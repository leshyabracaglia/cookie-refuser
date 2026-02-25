// Cookie Refuser - Background Service Worker
// Tracks denied cookie banners and manages extension state.

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true, stats: { total: 0, sites: {} } });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "cookie-denied") {
    chrome.storage.local.get({ stats: { total: 0, sites: {} } }, (result) => {
      const stats = result.stats;
      stats.total++;
      const host = message.url || "unknown";
      stats.sites[host] = (stats.sites[host] || 0) + 1;
      chrome.storage.local.set({ stats });
    });
  }
});
