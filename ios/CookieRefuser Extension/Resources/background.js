// Cookie Refuser - Background Service Worker
// Tracks denied cookie banners and manages extension state.

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// In-memory cache avoids read-modify-write races when messages arrive rapidly.
let statsCache = null;

// Initialise cache from storage on service worker startup.
browserAPI.storage.local.get({ stats: { total: 0, sites: {} } }).then((result) => {
  statsCache = result.stats;
});

browserAPI.runtime.onInstalled.addListener(() => {
  statsCache = { total: 0, sites: {} };
  browserAPI.storage.local.set({ enabled: true, stats: statsCache });
});

browserAPI.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== "cookie-denied") return;
  if (sender.id !== browserAPI.runtime.id) return;
  if (!statsCache) return;

  statsCache.total++;
  const host = message.url || "unknown";
  statsCache.sites[host] = (statsCache.sites[host] || 0) + 1;
  browserAPI.storage.local.set({ stats: statsCache });
});
