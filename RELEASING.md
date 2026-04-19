# Releasing Cookie Refuser

## Before any release

1. Bump `version` in `manifest.json` (e.g. `1.1.2` → `1.1.3`)
2. Bump the version in Xcode for all targets (macOS App, iOS App, macOS Extension, iOS Extension):
   - **Version** field (e.g. `1.1.3`) — matches manifest
   - **Build** field — increment by 1 each upload (e.g. `1` → `2`)

---

## Chrome Web Store

1. Run `npm run build:chrome` to generate `cookie-refuser-chrome.zip`
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Find Cookie Refuser → **Package** → **Upload New Package**
4. Upload the folder (not the zip) or the zip depending on what the dashboard accepts
5. Fill in release notes and submit for review

---

## Firefox Add-ons

1. Run `npm run build:firefox` to generate `cookie-refuser-firefox.zip`
2. Go to [addons.mozilla.org/developers](https://addons.mozilla.org/developers)
3. Find Cookie Refuser → **Upload New Version**
4. Upload `cookie-refuser-firefox.zip`
5. Answer no to all build tool questions (plain JS, no bundler/minifier)
6. Fill in release notes and submit for review

---

## Mac App Store (Xcode)

### Prerequisites
- Agree to latest PLA at [developer.apple.com/account](https://developer.apple.com/account)
- Ensure you have these certificates in Xcode → Settings → Accounts → Manage Certificates:
  - **Apple Distribution**
  - **Mac Installer Distribution**

### Steps
1. Open `ios/CookieRefuser.xcodeproj` in Xcode
2. Bump **Version** and **Build** number on all targets
3. **Product → Archive**
4. In Organizer: **Distribute App → App Store Connect → Upload**
5. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
6. Find Cookie Refuser (macOS) → add the new build
7. Fill in release notes and submit for review
