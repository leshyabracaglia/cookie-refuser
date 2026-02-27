// Cookie Refuser - Background Service Worker
// Tracks denied cookie banners and manages extension state.

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.storage.local.set({ enabled: true, stats: { total: 0, sites: {} } });
});

browserAPI.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "cookie-denied") {
    browserAPI.storage.local.get({ stats: { total: 0, sites: {} } }).then((result) => {
      const stats = result.stats;
      stats.total++;
      const host = message.url || "unknown";
      stats.sites[host] = (stats.sites[host] || 0) + 1;
      browserAPI.storage.local.set({ stats });
    });
  }
});
