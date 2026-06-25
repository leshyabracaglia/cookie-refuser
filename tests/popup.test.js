/**
 * @jest-environment jsdom
 *
 * Tests for popup.js — verifies the rating-prompt logic that appears
 * after the user has denied RATING_THRESHOLD banners.
 */

const fs = require("fs");
const path = require("path");

const POPUP_HTML = fs.readFileSync(path.join(__dirname, "../popup.html"), "utf8");
const POPUP_JS = fs.readFileSync(path.join(__dirname, "../popup.js"), "utf8");

// Pull the <body> out of popup.html so we have the real DOM the script targets.
function loadPopupDom() {
  const bodyMatch = POPUP_HTML.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  // Strip the inline <script src="popup.js"> tag — we'll eval the script directly.
  document.body.innerHTML = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/g, "");
}

function makeBrowserMock(initial = {}) {
  const store = {
    enabled: true,
    stats: { total: 0 },
    ratingPrompt: { status: "pending", snoozedUntil: 0 },
    ...initial,
  };
  const listeners = [];
  const mock = {
    storage: {
      local: {
        get: jest.fn((defaults) => Promise.resolve({ ...defaults, ...store })),
        set: jest.fn((values) => { Object.assign(store, values); return Promise.resolve(); }),
      },
      onChanged: { addListener: jest.fn((cb) => listeners.push(cb)) },
    },
    _store: store,
    _listeners: listeners,
  };
  return mock;
}

async function loadPopup(browserMock) {
  loadPopupDom();
  global.browser = browserMock;
  delete global.chrome;
  // window.open is called by the "Rate it" button.
  window.open = jest.fn();
  eval(POPUP_JS); // eslint-disable-line no-eval
  // Flush the startup storage.local.get promise so the UI reflects loaded state.
  await Promise.resolve();
  await Promise.resolve();
}

// Load just the exported helpers (no DOM) for pure-function tests.
function loadPopupHelpers() {
  // popup.js exports via module.exports when running under Node/Jest.
  const popupPath = path.join(__dirname, "../popup.js");
  // jest caches require()s — bust it so successive tests get a clean module.
  delete require.cache[require.resolve(popupPath)];
  // Helpers don't touch the DOM at import time, but the script DOES read
  // document.getElementById at top level. Give it a minimal DOM first.
  loadPopupDom();
  global.browser = makeBrowserMock();
  window.open = jest.fn();
  return require(popupPath);
}

afterEach(() => {
  delete global.browser;
  delete global.chrome;
  document.body.innerHTML = "";
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// detectStore — browser detection from User-Agent
// ---------------------------------------------------------------------------

describe("detectStore", () => {
  test("returns 'firefox' for Firefox UA", () => {
    const { detectStore } = loadPopupHelpers();
    expect(detectStore("Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0")).toBe("firefox");
  });

  test("returns 'chrome' for Chrome UA", () => {
    const { detectStore } = loadPopupHelpers();
    expect(detectStore("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36")).toBe("chrome");
  });

  test("returns 'chrome' for Edge (uses Chrome Web Store)", () => {
    const { detectStore } = loadPopupHelpers();
    expect(detectStore("Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0")).toBe("chrome");
  });

  test("returns 'safari' for Safari UA without Chrome", () => {
    const { detectStore } = loadPopupHelpers();
    expect(detectStore("Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15")).toBe("safari");
  });

  test("returns 'github' for unrecognised UA", () => {
    const { detectStore } = loadPopupHelpers();
    expect(detectStore("SomeBot/1.0")).toBe("github");
  });
});

// ---------------------------------------------------------------------------
// shouldShowRating — gating logic
// ---------------------------------------------------------------------------

describe("shouldShowRating", () => {
  test("hidden below the denial threshold", () => {
    const { shouldShowRating, RATING_THRESHOLD } = loadPopupHelpers();
    expect(shouldShowRating(RATING_THRESHOLD - 1, { status: "pending" })).toBe(false);
  });

  test("shown at exactly the threshold when pending", () => {
    const { shouldShowRating, RATING_THRESHOLD } = loadPopupHelpers();
    expect(shouldShowRating(RATING_THRESHOLD, { status: "pending" })).toBe(true);
  });

  test("shown above the threshold when pending", () => {
    const { shouldShowRating, RATING_THRESHOLD } = loadPopupHelpers();
    expect(shouldShowRating(RATING_THRESHOLD + 10, { status: "pending" })).toBe(true);
  });

  test("hidden when status is done", () => {
    const { shouldShowRating, RATING_THRESHOLD } = loadPopupHelpers();
    expect(shouldShowRating(RATING_THRESHOLD + 100, { status: "done" })).toBe(false);
  });

  test("hidden while snooze window is active", () => {
    const { shouldShowRating, RATING_THRESHOLD } = loadPopupHelpers();
    const now = 1_000_000;
    expect(shouldShowRating(RATING_THRESHOLD, { status: "snoozed", snoozedUntil: now + 1000 }, now)).toBe(false);
  });

  test("shown again after snooze window elapses", () => {
    const { shouldShowRating, RATING_THRESHOLD } = loadPopupHelpers();
    const now = 1_000_000;
    expect(shouldShowRating(RATING_THRESHOLD, { status: "snoozed", snoozedUntil: now - 1 }, now)).toBe(true);
  });

  test("treats missing ratingPrompt as pending", () => {
    const { shouldShowRating, RATING_THRESHOLD } = loadPopupHelpers();
    expect(shouldShowRating(RATING_THRESHOLD, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DOM behaviour
// ---------------------------------------------------------------------------

describe("rating prompt DOM", () => {
  test("is hidden when total < threshold", async () => {
    const mock = makeBrowserMock({ stats: { total: 4 } });
    await loadPopup(mock);
    expect(document.getElementById("rating").classList.contains("visible")).toBe(false);
  });

  test("becomes visible at threshold with pending status", async () => {
    const mock = makeBrowserMock({ stats: { total: 5 } });
    await loadPopup(mock);
    expect(document.getElementById("rating").classList.contains("visible")).toBe(true);
  });

  test("stays hidden when status is done, even past threshold", async () => {
    const mock = makeBrowserMock({
      stats: { total: 50 },
      ratingPrompt: { status: "done", snoozedUntil: 0 },
    });
    await loadPopup(mock);
    expect(document.getElementById("rating").classList.contains("visible")).toBe(false);
  });

  test("Rate it: opens store URL, marks done, hides prompt", async () => {
    const mock = makeBrowserMock({ stats: { total: 5 } });
    await loadPopup(mock);

    document.getElementById("rating-rate").click();
    await Promise.resolve();

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open.mock.calls[0][0]).toMatch(/^https?:\/\//);
    expect(mock._store.ratingPrompt.status).toBe("done");
    expect(document.getElementById("rating").classList.contains("visible")).toBe(false);
  });

  test("Later: snoozes for ~7 days and hides prompt", async () => {
    const mock = makeBrowserMock({ stats: { total: 5 } });
    await loadPopup(mock);
    const before = Date.now();

    document.getElementById("rating-later").click();
    await Promise.resolve();

    expect(mock._store.ratingPrompt.status).toBe("snoozed");
    // ~7 days in the future, give or take the test runtime.
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(mock._store.ratingPrompt.snoozedUntil).toBeGreaterThanOrEqual(before + sevenDays);
    expect(mock._store.ratingPrompt.snoozedUntil).toBeLessThanOrEqual(Date.now() + sevenDays + 1000);
    expect(document.getElementById("rating").classList.contains("visible")).toBe(false);
  });

  test("No thanks: marks done and hides prompt without opening a tab", async () => {
    const mock = makeBrowserMock({ stats: { total: 5 } });
    await loadPopup(mock);

    document.getElementById("rating-dismiss").click();
    await Promise.resolve();

    expect(window.open).not.toHaveBeenCalled();
    expect(mock._store.ratingPrompt.status).toBe("done");
    expect(document.getElementById("rating").classList.contains("visible")).toBe(false);
  });
});
