#!/usr/bin/env bash
set -e

# ============================================================
#  Handbook Native Build Pipeline (Apple Silicon ARM64)
#  Compiles Swift directly to machine code with -O optimization
# ============================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$DIR/dist"
APP_BUNDLE="$DIST_DIR/Handbook.app"
CONTENTS="$APP_BUNDLE/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
WEB="$RESOURCES/web"

echo "==> 1. Generating latest app icon..."
if [ ! -f "$DIR/build/icon.icns" ]; then
  npm run icon
fi

echo "==> 2. Preparing native app bundle structure..."
rm -rf "$APP_BUNDLE"
mkdir -p "$MACOS"
mkdir -p "$RESOURCES"
mkdir -p "$WEB"

echo "==> 3. Compiling native Swift binary directly to ARM64 machine code (-O)..."
swiftc -O \
  -whole-module-optimization \
  -target arm64-apple-macos12.0 \
  -framework AppKit \
  -framework WebKit \
  -framework Foundation \
  "$DIR/src/native/main.swift" \
  -o "$MACOS/Handbook"

chmod +x "$MACOS/Handbook"

echo "==> 4. Creating Info.plist..."
cat << 'EOF' > "$CONTENTS/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Handbook</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
    <key>CFBundleIdentifier</key>
    <string>com.handbook.editor</string>
    <key>CFBundleName</key>
    <string>Handbook</string>
    <key>CFBundleDisplayName</key>
    <string>Handbook</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>2.2.0</string>
    <key>CFBundleVersion</key>
    <string>2.2.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
</dict>
</plist>
EOF

echo "==> 5. Bundling icon and web assets..."
cp "$DIR/build/icon.icns" "$RESOURCES/icon.icns"

cp "$DIR/index.html" "$WEB/"
cp "$DIR/styles.css" "$WEB/"
cp "$DIR/bridge.js" "$WEB/"
cp "$DIR/renderer.js" "$WEB/"

mkdir -p "$WEB/node_modules/monaco-editor/min"
cp -R "$DIR/node_modules/monaco-editor/min/vs" "$WEB/node_modules/monaco-editor/min/"

echo "==> 6. Code-signing locally (ad-hoc)..."
codesign --force --deep --sign - "$APP_BUNDLE"

echo "==> 7. App bundle verified:"
ls -lh "$MACOS/Handbook"
du -sh "$APP_BUNDLE"

echo "==> Native build finished successfully at: $APP_BUNDLE"
