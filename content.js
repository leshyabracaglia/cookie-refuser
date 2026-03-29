// Cookie Refuser - Content Script
// Automatically finds and clicks "deny/reject" buttons on cookie consent banners.

(function () {
  "use strict";

  const browserAPI = typeof browser !== "undefined" ? browser : chrome;

  // Patterns that match "deny/reject cookies" buttons across languages
  const DENY_BUTTON_PATTERNS = [
    // English
    /\breject\s*(all)?\s*(cookies)?\b/i,
    /\bdeny\s*(all)?\s*(cookies)?\b/i,
    /\bdecline\s*(all)?\s*(cookies)?\b/i,
    /\brefuse\s*(all)?\s*(cookies)?\b/i,
    /\bno\s*,?\s*thanks\b/i,
    /\bonly\s*necessary\b/i,
    /\bnecessary\s*only\b/i,
    /\bonly\s*essential\b/i,
    /\bessential\s*only\b/i,
    /\bonly\s*required\b/i,
    /\bdo\s*not\s*(allow|accept|consent)\b/i,
    /\bopt[\s-]*out\b/i,
    /\bi\s*do\s*not\s*agree\b/i,
    /\bi\s*disagree\b/i,
    /\bdisagree\b/i,

    // German
    /\balle\s*ablehnen\b/i,
    /\bablehnen\b/i,
    /\bnur\s*notwendige\b/i,
    /\bnur\s*erforderliche\b/i,

    // French
    /\btout\s*refuser\b/i,
    /\brefuser\b/i,
    /\bcontinuer\s*sans\s*accepter\b/i,

    // Spanish
    /\brechazar\s*(todo|todas)?\b/i,
    /\bsolo\s*(las\s*)?necesarias\b/i,

    // Italian
    /\brifiuta\s*(tutto|tutti)?\b/i,
    /\bsolo\s*(i\s*)?necessari\b/i,

    // Dutch
    /\bweiger(en)?\s*(alles|alle)?\b/i,
    /\balleen\s*noodzakelijk\b/i,

    // Portuguese
    /\brecusar\s*(tudo|todos)?\b/i,
    /\bapenas\s*(os\s*)?necess[aá]rios\b/i,

    // Polish
    /\bodrzuć\s*(wszystk[ie]+)?\b/i,
    /\btylko\s*wymagane\b/i,

    // Swedish
    /\bavvisa\s*(alla)?\b/i,
    /\bendast\s*nödvändiga\b/i,
  ];

  // Selectors for common cookie consent banner containers
  const BANNER_SELECTORS = [
    "#onetrust-banner-sdk",
    "#CybotCookiebotDialog",
    "#cookiebanner",
    "#cookie-banner",
    "#cookie-consent",
    "#cookie-notice",
    "#cookie-popup",
    "#cookie-bar",
    "#cookie-law-info-bar",
    "#gdpr-cookie-notice",
    "#consent-banner",
    "#privacy-banner",
    '[class*="cookie-banner"]',
    '[class*="cookie-consent"]',
    '[class*="cookie-notice"]',
    '[class*="cookie-popup"]',
    '[class*="cookieBanner"]',
    '[class*="cookieConsent"]',
    '[class*="consent-banner"]',
    '[class*="consent-modal"]',
    '[class*="gdpr"]',
    '[class*="CookieConsent"]',
    '[id*="cookie-law"]',
    '[id*="cookie-consent"]',
    '[aria-label*="cookie" i]',
    '[aria-label*="consent" i]',
    '[role="dialog"][class*="cookie" i]',
    '[role="dialog"][class*="consent" i]',
    ".cc-banner",
    ".cc-window",
    ".cc-dialog",
    ".cmp-container",
  ];

  // Selectors for known deny/reject buttons on popular CMP platforms
  const KNOWN_DENY_SELECTORS = [
    // OneTrust
    "#onetrust-reject-all-handler",
    ".onetrust-close-btn-handler",

    // Cookiebot
    "#CybotCookiebotDialogBodyButtonDecline",
    "#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll",

    // Quantcast / TCF
    '[class*="qc-cmp2-summary-buttons"] button:last-child',
    ".qc-cmp-button[onclick*='reject']",

    // Didomi
    "#didomi-notice-disagree-button",

    // Klaro
    ".klaro .cn-decline",

    // Osano
    ".osano-cm-denyAll",

    // Complianz
    ".cmplz-deny",

    // Cookie Script
    "#cookiescript_reject",

    // GDPR Cookie Compliance
    '[data-cookie-set="reject"]',

    // Iubenda
    ".iubenda-cs-reject-btn",

    // Sourcepoint
    'button[title="Reject"]',
    'button[title="REJECT ALL"]',

    // Generic data attributes
    '[data-action="reject"]',
    '[data-action="deny"]',
    '[data-testid*="reject"]',
    '[data-testid*="deny"]',
    '[data-gdpr="reject"]',
    '[data-cookieconsent="reject"]',
  ];

  let handled = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 15;
  const RETRY_INTERVAL_MS = 800;

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
    );
  }

  function isClickable(el) {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    return (
      tag === "button" ||
      tag === "a" ||
      tag === "input" ||
      role === "button" ||
      el.classList.contains("btn") ||
      el.onclick != null ||
      el.style.cursor === "pointer"
    );
  }

  function getVisibleText(el) {
    return (el.textContent || el.value || el.getAttribute("aria-label") || "").trim();
  }

  function matchesDenyPattern(text) {
    return DENY_BUTTON_PATTERNS.some((pattern) => pattern.test(text));
  }

  // Try known deny button selectors first (fast path)
  function tryKnownSelectors() {
    for (const selector of KNOWN_DENY_SELECTORS) {
      try {
        const el = document.querySelector(selector);
        if (el && isVisible(el)) {
          el.click();
          notifyBackground("known-selector");
          return true;
        }
      } catch (_) {
        // Selector may be invalid on some pages
      }
    }
    return false;
  }

  // Search for deny buttons inside cookie banner containers
  function tryBannerSearch() {
    for (const selector of BANNER_SELECTORS) {
      try {
        const banner = document.querySelector(selector);
        if (!banner || !isVisible(banner)) continue;

        const clickables = banner.querySelectorAll(
          'button, a, input[type="button"], input[type="submit"], [role="button"], [class*="btn"]'
        );

        for (const el of clickables) {
          const text = getVisibleText(el);
          if (text && matchesDenyPattern(text) && isVisible(el)) {
            el.click();
            notifyBackground("banner-search");
            return true;
          }
        }
      } catch (_) {
        // Continue to next selector
      }
    }
    return false;
  }

  // Broad DOM search as a fallback
  function tryBroadSearch() {
    const candidates = document.querySelectorAll(
      'button, input[type="button"], input[type="submit"], [role="button"]'
    );
    const scored = [];

    for (const el of candidates) {
      if (!isVisible(el)) continue;
      const text = getVisibleText(el);
      if (!text || !matchesDenyPattern(text)) continue;

      // Score based on relevance — prefer elements that look like they are in a cookie context
      let score = 1;
      const parentText = (el.closest('[class*="cookie" i], [class*="consent" i], [id*="cookie" i], [id*="consent" i]') != null)
        ? 10
        : 0;
      score += parentText;

      if (isClickable(el)) score += 2;
      if (text.length < 30) score += 1; // Prefer concise button labels

      scored.push({ el, score });
    }

    if (scored.length === 0) return false;

    // Only click if the best candidate is clearly in a cookie/consent context.
    // Max score without cookie context = 4 (1 base + 2 clickable + 1 short text),
    // so requiring >= MIN_BROAD_SEARCH_SCORE prevents false positives on unrelated page elements.
    const MIN_BROAD_SEARCH_SCORE = 5;
    scored.sort((a, b) => b.score - a.score);
    if (scored[0].score < MIN_BROAD_SEARCH_SCORE) return false;

    scored[0].el.click();
    notifyBackground("broad-search");
    return true;
  }

  function dismissCookies() {
    if (handled) return;

    if (tryKnownSelectors() || tryBannerSearch() || tryBroadSearch()) {
      handled = true;
      return;
    }

    // Retry if banner hasn't appeared yet
    attempts++;
    if (attempts < MAX_ATTEMPTS) {
      setTimeout(dismissCookies, RETRY_INTERVAL_MS);
    }
  }

  function showByeToast() {
    const toast = document.createElement("div");
    toast.textContent = "bye! 👋";
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: "#e94560",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: "13px",
      fontWeight: "600",
      padding: "7px 14px",
      borderRadius: "20px",
      zIndex: "2147483647",
      opacity: "0",
      transform: "translateY(6px)",
      transition: "opacity 0.2s, transform 0.2s",
      pointerEvents: "none",
      boxShadow: "0 4px 20px rgba(233,69,96,0.45)",
      letterSpacing: "0.2px",
    });
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }));

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(6px)";
      setTimeout(() => toast.remove(), 250);
    }, 1800);
  }

  function notifyBackground(method) {
    showByeToast();
    browserAPI.runtime.sendMessage({
      type: "cookie-denied",
      url: window.location.hostname,
      method,
    }).catch(() => {});
  }

  // Check if extension is enabled before running
  function init() {
    browserAPI.storage.local.get({ enabled: true }).then((result) => {
      if (result.enabled) {
        // Small delay to let banners render
        setTimeout(dismissCookies, 500);

        // Also watch for dynamically injected banners
        let debounceTimer;
        const observer = new MutationObserver(() => {
          if (handled) return;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(dismissCookies, 100);
        });
        observer.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true,
        });

        // Stop observing after a reasonable time or when page unloads
        const disconnectObserver = () => observer.disconnect();
        setTimeout(disconnectObserver, 15000);
        window.addEventListener("beforeunload", disconnectObserver, { once: true });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
