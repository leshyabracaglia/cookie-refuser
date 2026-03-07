/**
 * @jest-environment jsdom
 *
 * Tests for background.js — verifies Firefox browser API usage and
 * stats tracking when cookie-denied messages arrive.
 */

const fs = require("fs");
const path = require("path");

const SCRIPT = fs.readFileSync(path.join(__dirname, "../background.js"), "utf8");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBrowserMock(initialStats = { total: 0, sites: {} }) {
  const store = { enabled: true, stats: initialStats };
  const mock = {
    storage: {
      local: {
        get: jest.fn().mockImplementation((defaults) =>
          Promise.resolve({ ...defaults, ...store })
        ),
        set: jest.fn().mockImplementation((values) => {
          Object.assign(store, values);
          return Promise.resolve();
        }),
      },
    },
    runtime: {
      id: "test-extension-id",
      onInstalled: { addListener: jest.fn() },
      onMessage: { addListener: jest.fn() },
    },
    _store: store,
  };
  return mock;
}

/** Evaluate the background script and return its registered message listener. */
async function loadScript(browserMock) {
  global.browser = browserMock;
  delete global.chrome;
  eval(SCRIPT); // eslint-disable-line no-eval
  // Flush the startup storage.local.get that initialises statsCache
  await Promise.resolve();
  // The script calls onMessage.addListener once — return that listener
  return browserMock.runtime.onMessage.addListener.mock.calls[0][0];
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  delete global.browser;
  delete global.chrome;
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// 1. Firefox API selection
// ---------------------------------------------------------------------------

describe("Firefox API selection", () => {
  test("uses browser namespace (Firefox) when available", async () => {
    const mock = makeBrowserMock();
    await loadScript(mock);
    expect(mock.runtime.onInstalled.addListener).toHaveBeenCalled();
    expect(mock.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test("falls back to chrome namespace when browser is not defined", async () => {
    const mock = makeBrowserMock();
    delete global.browser;
    global.chrome = mock;
    eval(SCRIPT); // eslint-disable-line no-eval
    await Promise.resolve();
    expect(mock.runtime.onInstalled.addListener).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. onInstalled initialises storage
// ---------------------------------------------------------------------------

describe("onInstalled", () => {
  test("sets enabled:true and empty stats on install", async () => {
    const mock = makeBrowserMock();
    await loadScript(mock);

    // Clear the set call from startup init, then fire onInstalled
    mock.storage.local.set.mockClear();
    const installedCb = mock.runtime.onInstalled.addListener.mock.calls[0][0];
    installedCb();

    expect(mock.storage.local.set).toHaveBeenCalledWith({
      enabled: true,
      stats: { total: 0, sites: {} },
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Message handling — stats tracking
// ---------------------------------------------------------------------------

describe("cookie-denied message handling", () => {
  const SENDER = { id: "test-extension-id" };

  test("increments total count on first denial", async () => {
    const mock = makeBrowserMock({ total: 0, sites: {} });
    const onMessage = await loadScript(mock);

    onMessage({ type: "cookie-denied", url: "example.com", method: "known-selector" }, SENDER);

    expect(mock._store.stats.total).toBe(1);
    expect(mock._store.stats.sites["example.com"]).toBe(1);
  });

  test("accumulates total across multiple denials", async () => {
    const mock = makeBrowserMock({ total: 0, sites: {} });
    const onMessage = await loadScript(mock);

    onMessage({ type: "cookie-denied", url: "a.com", method: "banner-search" }, SENDER);
    onMessage({ type: "cookie-denied", url: "b.com", method: "broad-search" }, SENDER);
    onMessage({ type: "cookie-denied", url: "a.com", method: "known-selector" }, SENDER);

    expect(mock._store.stats.total).toBe(3);
    expect(mock._store.stats.sites["a.com"]).toBe(2);
    expect(mock._store.stats.sites["b.com"]).toBe(1);
  });

  test("handles missing url gracefully (uses 'unknown')", async () => {
    const mock = makeBrowserMock({ total: 0, sites: {} });
    const onMessage = await loadScript(mock);

    onMessage({ type: "cookie-denied", method: "known-selector" }, SENDER);

    expect(mock._store.stats.sites["unknown"]).toBe(1);
  });

  test("ignores unrecognised message types", async () => {
    const mock = makeBrowserMock({ total: 0, sites: {} });
    const onMessage = await loadScript(mock);
    mock.storage.local.set.mockClear();

    onMessage({ type: "something-else" }, SENDER);

    expect(mock._store.stats.total).toBe(0);
    expect(mock.storage.local.set).not.toHaveBeenCalled();
  });

  test("ignores messages from unknown senders", async () => {
    const mock = makeBrowserMock({ total: 0, sites: {} });
    const onMessage = await loadScript(mock);
    mock.storage.local.set.mockClear();

    onMessage({ type: "cookie-denied", url: "evil.com" }, { id: "some-other-extension" });

    expect(mock._store.stats.total).toBe(0);
    expect(mock.storage.local.set).not.toHaveBeenCalled();
  });

  test("preserves existing stats when updating", async () => {
    const mock = makeBrowserMock({ total: 5, sites: { "old.com": 5 } });
    const onMessage = await loadScript(mock);

    onMessage({ type: "cookie-denied", url: "new.com", method: "banner-search" }, SENDER);

    expect(mock._store.stats.total).toBe(6);
    expect(mock._store.stats.sites["old.com"]).toBe(5);
    expect(mock._store.stats.sites["new.com"]).toBe(1);
  });
});
