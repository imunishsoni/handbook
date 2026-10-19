#!/usr/bin/env bash
set -e

# ==============================================================================
#  Handbook Universal 2 Native Build Pipeline
#  Builds a native Universal 2 (Apple Silicon ARM64 + Intel x86_64) Mach-O binary
#  Targeting macOS 10.15 (Catalina) through macOS 15+ (Sequoia)
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$DIR/dist"
APP_BUNDLE="$DIST_DIR/Handbook.app"
CONTENTS="$APP_BUNDLE/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
SHARED_SUPPORT="$CONTENTS/SharedSupport/bin"
WEB="$RESOURCES/web"
TEMP_BUILD="/tmp/handbook_build_$$"

mkdir -p "$TEMP_BUILD"
trap 'rm -rf "$TEMP_BUILD"' EXIT

echo "==> 1. Generating latest app icon..."
if [ ! -f "$DIR/build/icon.icns" ]; then
  npm run icon
fi

echo "==> 2. Preparing native app bundle structure..."
rm -rf "$APP_BUNDLE"
mkdir -p "$MACOS"
mkdir -p "$RESOURCES"
mkdir -p "$SHARED_SUPPORT"
mkdir -p "$WEB"

echo "==> 3. Compiling native Universal 2 binaries directly to machine code (-O)..."

echo "    -> Compiling ARM64 slice (Apple Silicon M1/M2/M3/M4, macOS 11.0+)..."
swiftc -O \
  -whole-module-optimization \
  -target arm64-apple-macos11.0 \
  -framework AppKit \
  -framework WebKit \
  -framework Foundation \
  "$DIR/src/native/main.swift" \
  -o "$TEMP_BUILD/Handbook_arm64"

echo "    -> Compiling x86_64 slice (Intel Core i3/i5/i7/i9/Xeon, macOS 10.15+)..."
clang -target x86_64-apple-macos10.15 -c "$DIR/src/native/compat_x86_64.s" -o "$TEMP_BUILD/compat_x86_64.o"
swiftc -O \
  -whole-module-optimization \
  -target x86_64-apple-macos10.15 \
  -framework AppKit \
  -framework WebKit \
  -framework Foundation \
  "$DIR/src/native/main.swift" \
  "$TEMP_BUILD/compat_x86_64.o" \
  -o "$TEMP_BUILD/Handbook_x86_64"

echo "    -> Merging into Apple Universal 2 Mach-O binary with lipo..."
lipo -create \
  "$TEMP_BUILD/Handbook_arm64" \
  "$TEMP_BUILD/Handbook_x86_64" \
  -output "$MACOS/Handbook"

chmod +x "$MACOS/Handbook"

echo "    -> Verified binary architectures:"
lipo -info "$MACOS/Handbook"

echo "==> 4. Creating Info.plist (Universal macOS 10.15+)..."
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
    <string>2.3.0</string>
    <key>CFBundleVersion</key>
    <string>2.3.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
</dict>
</plist>
EOF

echo "==> 5. Creating CLI launcher helper..."
cat << 'EOF' > "$SHARED_SUPPORT/handbook"
#!/usr/bin/env bash
# Handbook CLI launcher
BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../MacOS" && pwd)"
if [ -x "$BIN_DIR/Handbook" ]; then
  exec "$BIN_DIR/Handbook" "$@"
else
  open -a "Handbook" "$@"
fi
EOF
chmod +x "$SHARED_SUPPORT/handbook"

echo "==> 6. Bundling icon and web assets..."
cp "$DIR/build/icon.icns" "$RESOURCES/icon.icns"

cp "$DIR/index.html" "$WEB/"
cp "$DIR/styles.css" "$WEB/"
cp "$DIR/bridge.js" "$WEB/"
cp "$DIR/renderer.js" "$WEB/"

mkdir -p "$WEB/node_modules/monaco-editor/min"
cp -R "$DIR/node_modules/monaco-editor/min/vs" "$WEB/node_modules/monaco-editor/min/"

echo "==> 7. Code-signing locally (ad-hoc)..."
codesign --force --deep --sign - "$APP_BUNDLE"

echo "==> 8. App bundle verified:"
ls -lh "$MACOS/Handbook"
du -sh "$APP_BUNDLE"

echo "==> Universal 2 native build finished successfully at: $APP_BUNDLE"
