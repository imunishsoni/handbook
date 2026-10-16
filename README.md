# Handbook (macOS)

<p align="center">
  <img src="build/icon.icns" width="128" height="128" alt="Handbook Icon" />
</p>

<p align="center">
  <strong>Pure speed. Zero friction.</strong><br>
  A distraction-free, lightning-fast text and code editor for macOS with a tailored Midnight aesthetic.
</p>

---

## 💾 Out-of-the-Box Installation (No Prerequisites)

Handbook is a standalone native macOS application bundle. You do **not** need Node.js, npm, or any developer tools to install or run it:

### 1. Download
👉 **[Download Latest Handbook for macOS (Apple Silicon)](https://github.com/imunishsoni/sublime-text-4-clone/releases/latest)**

- **[Handbook-arm64.dmg](https://github.com/imunishsoni/sublime-text-4-clone/releases/download/v1.2.0/Handbook-arm64.dmg)** — Drag & drop DMG installer
- **[Handbook-arm64.zip](https://github.com/imunishsoni/sublime-text-4-clone/releases/download/v1.2.0/Handbook-arm64.zip)** — Standalone application ZIP

### 2. Install
1. Open `Handbook-arm64.dmg`.
2. Drag **Handbook** into your **Applications** folder.
3. Open **Handbook** from Spotlight (`⌘ + Space`), Launchpad, or Finder.

---

## ⚡ Command Line Tool (`handbook`)

Launch Handbook directly from your Terminal:

```bash
# Open Handbook
handbook

# Open current folder as workspace
handbook .

# Open a specific file
handbook src/index.ts
```

If not already linked, add this alias to your `~/.zshrc`:
```bash
alias handbook="/Applications/Handbook.app/Contents/MacOS/Handbook"
```

---

## 🎨 Midnight Theme & Visual Design

- **Deep Obsidian Background**: Zero-distraction `#0d1117` palette with refined hairline borders.
- **Electric Violet & Cyan Accents**: High-contrast, easy-on-the-eyes syntax highlighting.
- **Dimensional App Icon**: Native macOS Big Sur squircle featuring an open handbook motif with illuminated code page etchings.
- **Sleek Floating Tabs**: Clean segmented tabs with glowing dirty-state indicators.
- **Glassmorphic Command Palette**: Translucent floating search HUD with backdrop blur.
- **No Nag Dialogs**: Zero popups, zero purchase reminders, zero modal interruptions.

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
| `⌘ N` | **New Draft** |
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

# Run in development mode
npm start

# Generate custom app icon
npm run icon

# Package native macOS app (.app)
npm run pack

# Build standalone DMG & ZIP installers
npm run dmg
```
