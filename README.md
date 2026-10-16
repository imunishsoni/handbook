# Aura (macOS)

<p align="center">
  <img src="build/icon.icns" width="128" height="128" alt="Aura Icon" />
</p>

<p align="center">
  <strong>Pure speed. Zero friction.</strong><br>
  A distraction-free, lightning-fast code editor for macOS with a tailored Midnight aesthetic.
</p>

---

## 💾 Out-of-the-Box Installation (No Prerequisites)

Aura is a native macOS application bundle. You do **not** need Node.js, npm, or any developer tools to use it:

### 1. Download
👉 **[Download Latest Aura for macOS (Apple Silicon)](https://github.com/imunishsoni/sublime-text-4-clone/releases/latest)**

- **[Aura-arm64.dmg](https://github.com/imunishsoni/sublime-text-4-clone/releases/download/v1.1.0/Aura-arm64.dmg)** — Drag & drop DMG installer
- **[Aura-arm64.zip](https://github.com/imunishsoni/sublime-text-4-clone/releases/download/v1.1.0/Aura-arm64.zip)** — Standalone application ZIP

### 2. Install
1. Open `Aura-arm64.dmg`.
2. Drag **Aura** into your **Applications** folder.
3. Open **Aura** from Spotlight (`⌘ + Space`), Launchpad, or Finder.

---

## ⚡ Command Line Tool (`aura`)

Launch Aura right from your Terminal:

```bash
# Open Aura
aura

# Open current folder as workspace
aura .

# Open a specific file
aura src/index.ts
```

If not already linked, add this alias to your `~/.zshrc`:
```bash
alias aura="/Applications/Aura.app/Contents/MacOS/Aura"
```

---

## 🎨 Aura Midnight Theme & Design

- **Deep Obsidian Palette**: Ultra-low distraction `#0d1117` background with refined hairline borders.
- **Electric Violet & Cyan Accents**: High-contrast, easy-on-the-eyes syntax highlighting.
- **Sleek Floating Tabs**: Clean segmented tabs with glowing dirty-state indicators.
- **Glassmorphic Command Palette**: Translucent floating search HUD with blur backing.
- **No Nag Dialogs**: Zero popups, zero license prompts, zero distractions.

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
