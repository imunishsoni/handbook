# Changelog

All notable changes to **Handbook** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-16

### ⚡ Performance & Architecture
- **Pure Native Machine Code**: Re-architected core in Swift compiled with `swiftc -O -whole-module-optimization` directly targeting Apple Silicon ARM64.
- **Installer Reduction**: Reduced installer size from 125 MB down to **4.46 MB** (~96% lighter).
- **Cold Boot Speed**: Achieved **~25 ms startup time** by eliminating Chromium and Node.js boot latency.
- **Memory Footprint**: Reduced idle memory consumption from ~250 MB down to **~25 MB**.
- **Native Cocoa File System**: File indexing, recursive workspace directory scanning, atomic file saves, and system dialogs run directly on the CPU via POSIX and Foundation APIs.
- **Metal Hardware Acceleration**: Native Metal pipeline for smooth 120Hz ProMotion display rendering.

---

## [1.2.0] - 2026-10-16

### 🎨 Identity & Branding
- **Renamed to Handbook**: Distinct, elegant brand identity.
- **New App Icon**: Custom macOS Big Sur squircle featuring an open illuminated handbook with radiant code line etchings and an emerald ribbon bookmark.
- **New CLI Command**: Terminal launcher `handbook` for instant project opening.

---

## [1.1.0] - 2026-10-16

### 🎨 Visual Theme
- **Aura Midnight Theme**: Custom obsidian slate background (`#0d1117`), electric violet keywords (`#c084fc`), neon cyan functions (`#38bdf8`), emerald mint strings (`#34d399`), and warm amber numbers (`#fbbf24`).
- **Glassmorphic Command Palette**: Translucent floating search HUD with blur backing.
- **Segmented Tabs**: Custom tab bar with dirty-state glow indicators.

---

## [1.0.0] - 2026-10-15

### 🚀 Initial Release
- Desktop code editor inspired by the speed and keyboard workflows of Sublime Text.
- Zero nag popups, registration dialogs, or purchase prompts.
- Full keyboard shortcuts (`⌘P`, `⌘⇧P`, `⌘G`, `⌘B`, multi-cursor `⌘D`).
