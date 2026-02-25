# Cookie Refuser

A Chrome extension that automatically denies all cookie consent banners.

## Features

- Automatically clicks "deny", "reject", or "only necessary" buttons on cookie popups
- Supports major consent management platforms: OneTrust, Cookiebot, Quantcast, Didomi, Klaro, Osano, Complianz, Iubenda, and more
- Multilingual support: English, German, French, Spanish, Italian, Dutch, Portuguese, Polish, and Swedish
- Watches for late-loading banners using a MutationObserver
- Popup UI with an enable/disable toggle and a counter of denied banners
- Manifest V3 — works with the latest Chrome extension APIs

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/leshyabracaglia/Cookie-refuser.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked**
5. Select the cloned `Cookie-refuser` folder
6. The extension icon will appear in your toolbar — you're ready to go

## Usage

- **Browse normally** — the extension runs on every page and automatically dismisses cookie banners
- **Click the extension icon** to open the popup where you can:
  - Toggle the extension on or off
  - See how many cookie banners have been denied
- The extension works in all frames (including iframes) so embedded consent dialogs are handled too

## How It Works

The content script uses a three-tier detection strategy:

1. **Known selectors** — Matches deny/reject buttons from popular consent platforms using platform-specific CSS selectors
2. **Banner search** — Locates cookie banner containers on the page and scans for deny/reject buttons inside them
3. **Broad search** — Falls back to scanning all interactive elements, scoring them by relevance to cookie consent context

If the banner hasn't appeared yet, the script retries periodically and also observes DOM mutations to catch dynamically injected banners.

## Project Structure

```
Cookie-refuser/
├── manifest.json   # Extension manifest (V3)
├── background.js   # Service worker — tracks denial stats
├── content.js      # Content script — detects and clicks deny buttons
├── content.css     # Overlay transition styles
├── popup.html      # Popup UI
├── popup.js        # Popup logic (toggle + stats)
└── icons/          # Extension icons (16, 48, 128px)
```

## License

MIT
