#!/bin/bash
# Cookie Refuser - iOS Safari Web Extension Build Script
# Generates an Xcode project and copies extension resources.
#
# Prerequisites:
#   - macOS with Xcode 14+ installed
#   - Safari Web Extension converter (ships with Xcode)
#
# Usage:
#   cd ios && ./build.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
RESOURCES_DIR="$SCRIPT_DIR/CookieRefuser Extension/Resources"

echo "==> Cookie Refuser iOS Build"
echo ""

# Check for Xcode
if ! command -v xcrun &> /dev/null; then
    echo "Error: Xcode command-line tools not found."
    echo "Install Xcode from the App Store and run: xcode-select --install"
    exit 1
fi

# Copy extension resources from the root project
echo "==> Copying extension resources..."
mkdir -p "$RESOURCES_DIR/icons"

cp "$ROOT_DIR/manifest.json"  "$RESOURCES_DIR/"
cp "$ROOT_DIR/background.js"  "$RESOURCES_DIR/"
cp "$ROOT_DIR/content.js"     "$RESOURCES_DIR/"
cp "$ROOT_DIR/content.css"    "$RESOURCES_DIR/"
cp "$ROOT_DIR/popup.html"     "$RESOURCES_DIR/"
cp "$ROOT_DIR/popup.js"       "$RESOURCES_DIR/"
cp "$ROOT_DIR/icons/"*        "$RESOURCES_DIR/icons/"

echo "==> Resources copied to $RESOURCES_DIR"
echo ""

# Generate Xcode project using Apple's converter
echo "==> Generating Xcode project..."
xcrun safari-web-extension-converter \
    "$RESOURCES_DIR" \
    --project-location "$SCRIPT_DIR" \
    --app-name "CookieRefuser" \
    --bundle-identifier "com.cookierefuser.app" \
    --swift \
    --no-open \
    --force

echo ""
echo "==> Build complete!"
echo ""
echo "Next steps:"
echo "  1. Open CookieRefuser.xcodeproj in Xcode"
echo "  2. Select your development team in Signing & Capabilities for all targets"
echo "  3. Set the scheme to 'CookieRefuser (macOS)' and archive: Product > Archive"
echo "  4. In the Organizer, click Distribute App > App Store Connect"
echo "  5. Submit in App Store Connect at appstoreconnect.apple.com"
echo ""
echo "  For iOS: switch scheme to 'CookieRefuser (iOS)', archive and submit the same way"
echo "  Enable on device: Settings > Safari > Extensions > Cookie Refuser"
