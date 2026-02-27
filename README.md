# Cookie Refuser

A cross-platform extension that automatically denies all cookie consent banners. Works with Chrome, Firefox, Edge, Safari, and Safari on iOS/iPadOS.

## Features

- Automatically clicks "deny", "reject", or "only necessary" buttons on cookie popups
- Supports major consent management platforms: OneTrust, Cookiebot, Quantcast, Didomi, Klaro, Osano, Complianz, Iubenda, and more
- Multilingual support: English, German, French, Spanish, Italian, Dutch, Portuguese, Polish, and Swedish
- Watches for late-loading banners using a MutationObserver
- Popup UI with an enable/disable toggle and a counter of denied banners
- Manifest V3 — works with the latest browser extension APIs

## Installation

### Chrome

1. Clone the repository:
   ```
   git clone https://github.com/leshyabracaglia/Cookie-refuser.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked**
5. Select the cloned `Cookie-refuser` folder

### Firefox

1. Clone the repository:
   ```
   git clone https://github.com/leshyabracaglia/Cookie-refuser.git
   ```
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file inside the cloned `Cookie-refuser` folder

### Edge

1. Clone the repository:
   ```
   git clone https://github.com/leshyabracaglia/Cookie-refuser.git
   ```
2. Open Edge and navigate to `edge://extensions/`
3. Enable **Developer mode** using the toggle in the bottom-left corner
4. Click **Load unpacked**
5. Select the cloned `Cookie-refuser` folder

### Safari (macOS)

1. Clone the repository and ensure you have Xcode installed
2. Run Apple's converter from the terminal:
   ```
   xcrun safari-web-extension-converter /path/to/Cookie-refuser
   ```
3. Open the generated Xcode project and build it
4. Enable the extension in **Safari > Preferences > Extensions**

### iOS / iPadOS

Requires Xcode 14+ on macOS and an iOS 15+ or iPadOS 15+ device.

1. Clone the repository:
   ```
   git clone https://github.com/leshyabracaglia/Cookie-refuser.git
   ```
2. Run the iOS build script:
   ```
   cd Cookie-refuser/ios
   ./build.sh
   ```
3. Open the generated `CookieRefuser.xcodeproj` in Xcode
4. Select your development team under **Signing & Capabilities** for both the app and extension targets
5. Build and run on your device (or simulator)
6. On your device, go to **Settings > Safari > Extensions** and enable **Cookie Refuser**
7. When prompted, allow the extension for **All Websites** or select specific sites

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

## Browser Compatibility

| Browser        | Minimum Version | Notes |
|----------------|----------------|-------|
| Chrome         | 88+            | Full Manifest V3 support |
| Firefox        | 109+           | Manifest V3 with `browser_specific_settings` |
| Edge           | 88+            | Chromium-based, same as Chrome |
| Safari (macOS) | 15.4+          | Requires Xcode conversion |
| Safari (iOS)   | 15+            | Via iOS Safari Web Extension |

## Project Structure

```
Cookie-refuser/
├── manifest.json   # Extension manifest (V3, cross-browser)
├── background.js   # Service worker — tracks denial stats
├── content.js      # Content script — detects and clicks deny buttons
├── content.css     # Overlay transition styles
├── popup.html      # Popup UI
├── popup.js        # Popup logic (toggle + stats)
├── icons/          # Extension icons (16, 48, 128px)
└── ios/            # iOS Safari Web Extension
    ├── build.sh                        # Build script
    ├── CookieRefuser/                  # SwiftUI host app
    │   ├── CookieRefuserApp.swift
    │   ├── ContentView.swift
    │   ├── Info.plist
    │   └── Assets.xcassets/
    └── CookieRefuser Extension/        # Safari Web Extension target
        ├── SafariWebExtensionHandler.swift
        ├── Info.plist
        └── Resources/                  # Populated by build.sh
```

## License

MIT
