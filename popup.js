// Cookie Refuser - Popup Script

const toggle = document.getElementById("toggle");
const totalEl = document.getElementById("total");

// Load current state
chrome.storage.local.get({ enabled: true, stats: { total: 0 } }, (result) => {
  toggle.checked = result.enabled;
  totalEl.textContent = result.stats.total;
});

// Toggle enable/disable
toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
});
