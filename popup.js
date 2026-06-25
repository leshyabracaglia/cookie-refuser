// Cookie Refuser - Popup Script

const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const toggle = document.getElementById("toggle");
const totalEl = document.getElementById("total");
const ratingEl = document.getElementById("rating");
const rateBtn = document.getElementById("rating-rate");
const laterBtn = document.getElementById("rating-later");
const dismissBtn = document.getElementById("rating-dismiss");

const RATING_THRESHOLD = 5;
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const STORE_URLS = {
  chrome: "https://chromewebstore.google.com/detail/cookie-refuser/mcglfjkmfeliffphgmihihlgehcfbkmi/reviews",
  firefox: "https://addons.mozilla.org/en-US/firefox/addon/cookies-refuser/reviews/",
  safari: "https://apps.apple.com/us/app/cookie-refuser/id6760318624?action=write-review",
  github: "https://github.com/leshyabracaglia/Cookie-refuser",
};

function detectStore(ua = navigator.userAgent) {
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Edg\//.test(ua)) return "chrome"; // Edge uses Chrome store for this extension
  if (/Chrome\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua)) return "safari";
  return "github";
}

function shouldShowRating(total, ratingPrompt, now = Date.now()) {
  if (total < RATING_THRESHOLD) return false;
  if (!ratingPrompt || ratingPrompt.status === "pending") return true;
  if (ratingPrompt.status === "snoozed") return now >= (ratingPrompt.snoozedUntil || 0);
  return false; // "done"
}

function openStore() {
  const url = STORE_URLS[detectStore()] || STORE_URLS.github;
  // Chrome/Firefox: chrome.tabs would need the "tabs" permission; window.open
  // from the popup opens a new tab without needing it.
  window.open(url, "_blank", "noopener");
}

function persistRating(state) {
  return browserAPI.storage.local.set({ ratingPrompt: state }).catch(() => {});
}

function hideRating() {
  ratingEl.classList.remove("visible");
}

function maybeShowRating(total, ratingPrompt) {
  if (shouldShowRating(total, ratingPrompt)) {
    ratingEl.classList.add("visible");
  } else {
    hideRating();
  }
}

// Load current state
browserAPI.storage.local.get({
  enabled: true,
  stats: { total: 0 },
  ratingPrompt: { status: "pending", snoozedUntil: 0 },
}).then((result) => {
  toggle.checked = result.enabled;
  totalEl.textContent = result.stats.total;
  maybeShowRating(result.stats.total, result.ratingPrompt);
}).catch(() => {});

// Toggle enable/disable
toggle.addEventListener("change", () => {
  browserAPI.storage.local.set({ enabled: toggle.checked }).catch(() => {});
});

rateBtn.addEventListener("click", () => {
  openStore();
  persistRating({ status: "done", snoozedUntil: 0 });
  hideRating();
});

laterBtn.addEventListener("click", () => {
  persistRating({ status: "snoozed", snoozedUntil: Date.now() + SNOOZE_MS });
  hideRating();
});

dismissBtn.addEventListener("click", () => {
  persistRating({ status: "done", snoozedUntil: 0 });
  hideRating();
});

// Keep counter live while popup is open
browserAPI.storage.onChanged.addListener((changes) => {
  if (changes.stats) {
    totalEl.textContent = changes.stats.newValue.total;
  }
});

// Exported for tests (no-op in extension runtime).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { detectStore, shouldShowRating, RATING_THRESHOLD, SNOOZE_MS, STORE_URLS };
}
