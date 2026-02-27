// Cookie Refuser - Popup Script

const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const toggle = document.getElementById("toggle");
const totalEl = document.getElementById("total");

// Load current state
browserAPI.storage.local.get({ enabled: true, stats: { total: 0 } }).then((result) => {
  toggle.checked = result.enabled;
  totalEl.textContent = result.stats.total;
});

// Toggle enable/disable
toggle.addEventListener("change", () => {
  browserAPI.storage.local.set({ enabled: toggle.checked });
});
