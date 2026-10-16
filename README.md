# Sublime Text 4 Clone (macOS)

A personal, lightweight Sublime Text 4 standalone desktop application for macOS built with Electron and Monaco Editor. It delivers the authentic Monokai aesthetics, speed, and keyboard shortcuts without any purchase reminders or periodic unregistered popups.

**No Node.js, npm, or developer tools required to use.**

---

## 💾 Out-of-the-Box Installation (No Prerequisites)

You do **not** need Node.js or npm to run this application. Prebuilt standalone binaries are provided directly in GitHub Releases:

### 1. Download
👉 **[Download the Latest DMG Installer (v1.0.0)](https://github.com/imunishsoni/sublime-text-4-clone/releases/latest)**

*(Available as `Sublime-Text-4-arm64.dmg` or `Sublime-Text-4-arm64.zip` for Apple Silicon Macs)*

### 2. Install
1. Open the downloaded `Sublime-Text-4-arm64.dmg`.
2. Drag **Sublime Text** into your **Applications** folder.
3. Launch **Sublime Text** from Launchpad, Spotlight (`⌘ + Space`), or your Applications folder.

---

## ⚡ Command Line Tool (`subl`)

To launch Sublime Text from anywhere in your Terminal:

```bash
# Open editor
subl

# Open current folder as project
subl .

# Open a specific file
subl path/to/file.py
```

If not already linked, add this to your `~/.zshrc`:
```bash
alias subl="/Applications/Sublime\ Text.app/Contents/MacOS/Sublime\ Text"
```

---

## ✨ Features

- **No Nag Popups**: Zero purchase prompts or periodic unregistered dialogs.
- **Iconic Monokai Look & Feel**: Sublime Text 4 dark theme palette, typography, status bar, and tab indicators.
- **Tabs with Dirty State**: Classic circular dot when a file has unsaved changes, turning to a close button on hover.
- **Sidebar & File Tree**: Collapsible directories, resizable sidebar pane (with `⌘B` toggle).
- **Command Palette (`⌘⇧P`)**: Fuzzy search over editor commands.
- **Go to File (`⌘P`)**: Instant fuzzy file navigation across the workspace.
- **Go to Line (`⌘G`)**: Direct line jumping.
- **Sublime Keybindings**:
  - `⌘P` — Go to File
  - `⌘⇧P` — Command Palette
  - `⌘G` — Go to Line
  - `⌘B` — Toggle Sidebar
  - `⌘S` — Save
  - `⌘W` — Close Tab
  - `⌘N` — New File
  - `⌘O` — Open File
  - `⌘⇧D` — Duplicate Line
  - `⌘D` — Add Selection to Next Find Match
  - `⌘⇧L` — Select All Occurrences
  - `⌘/` — Toggle Comment
  - `⌥↑` / `⌥↓` — Move Line Up / Down
- **Minimap**: High-performance minimap with toggle support.
- **Drag & Drop**: Drag files and folders straight into the editor to open them.

---

## 🛠 Building From Source (Developers Only)

If you wish to modify the code and package it yourself:

```bash
git clone https://github.com/imunishsoni/sublime-text-4-clone.git
cd sublime-text-4-clone
npm install

# Run in development mode
npm start

# Package standalone macOS .app
npm run pack

# Build .dmg installer
npm run dmg
```
