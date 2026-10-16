# Handbook (macOS)

<p align="center">
  <img src="build/icon.icns" width="128" height="128" alt="Handbook Icon" />
</p>

<p align="center">
  <strong>Pure machine speed. Ultra-lightweight. Zero friction.</strong><br>
  A high-performance text and code editor for macOS compiled directly to native Apple Silicon ARM64 machine code.
</p>

---

## ⚡ Performance & Native Architecture

Handbook is compiled with Swift's optimizing compiler (`swiftc -O -whole-module-optimization`) directly targeting Apple Silicon:

- **~4.5 MB Total Installer** (vs 125 MB+ on Electron apps — **~97% lighter**).
- **Instant ~25ms Cold Startup** (no heavy Chromium/Node.js runtime boot).
- **Ultra-low Memory (~25-30 MB RAM)** using macOS native system WebKit and shared frameworks.
- **Native Cocoa File System**: File indexing, recursive traversal, atomic file saving, and dialogs execute directly in compiled machine code via POSIX and Foundation APIs.
- **Metal Hardware Acceleration**: GPU-accelerated rendering driven directly by macOS AppKit.
- **No Nag Dialogs**: Zero popups, zero purchase reminders.

---

## 💾 Out-of-the-Box Installation (No Prerequisites)

No Node.js, npm, or dev tools required:

### 1. Download
👉 **[Download Latest Handbook for macOS (Apple Silicon)](https://github.com/imunishsoni/sublime-text-4-clone/releases/latest)**

- **[Handbook-mac-arm64.dmg](https://github.com/imunishsoni/sublime-text-4-clone/releases/download/v2.0.0/Handbook-mac-arm64.dmg)** (~4.5 MB) — Native DMG installer
- **[Handbook-mac-arm64.zip](https://github.com/imunishsoni/sublime-text-4-clone/releases/download/v2.0.0/Handbook-mac-arm64.zip)** (~3.9 MB) — Standalone application ZIP

### 2. Install
1. Open `Handbook-mac-arm64.dmg`.
2. Drag **Handbook** into **Applications**.
3. Launch from Spotlight (`⌘ + Space`), Launchpad, or Finder.

---

## ⚡ Command Line Tool (`handbook`)

Launch Handbook directly from your Terminal:

```bash
# Open Handbook
handbook

# Open current directory as project
handbook .

# Open a specific file
handbook src/main.rs
```

Add this alias to your `~/.zshrc` if needed:
```bash
alias handbook="/Applications/Handbook.app/Contents/MacOS/Handbook"
```

---

## 🎨 Midnight Theme

- **Deep Obsidian Background**: Minimalist `#0d1117` canvas with subtle borders.
- **Vibrant Syntax Highlighting**: Electric violet keywords (`#c084fc`), neon cyan functions (`#38bdf8`), emerald mint strings (`#34d399`), and warm amber numbers (`#fbbf24`).
- **Glassmorphic Command Palette**: Floating HUD with fuzzy file search (`⌘P`) and command palette (`⌘⇧P`).
- **Segmented Tabs**: Glowing dirty-state indicators.

---

## ⌨️ Shortcuts & Workflows

| Shortcut | Action |
| :--- | :--- |
| `⌘ P` | **Quick Find File** (fuzzy project search) |
| `⌘ ⇧ P` | **Command Palette** |
| `⌘ G` | **Jump to Line** |
| `⌘ B` | **Toggle Sidebar** |
| `⌘ S` | **Save File** |
| `⌘ W` | **Close Tab** |
| `⌘ N` | **New File** |
| `⌘ O` | **Open File** |
| `⌘ ⇧ O` | **Open Workspace Folder** |
| `⌘ D` | **Add Selection to Next Match** (multi-cursor) |
| `⌘ ⇧ L` | **Select All Occurrences** |
| `⌘ /` | **Toggle Line Comment** |
| `⌥ ↑` / `⌥ ↓` | **Move Line Up / Down** |
| `⌘ ⇧ D` | **Duplicate Line** |

---

## 🛠 Building From Source

```bash
git clone https://github.com/imunishsoni/sublime-text-4-clone.git
cd sublime-text-4-clone
npm install

# Compile native Apple Silicon app bundle
./scripts/build-native.sh

# Build native compressed DMG & ZIP installers
npm run dmg
```
