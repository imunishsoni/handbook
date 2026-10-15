# Sublime Text 4 Clone (macOS)

A personal, lightweight Sublime Text 4 desktop clone built with Electron and Monaco Editor. It gives you the familiar Monokai aesthetics, speed, and keyboard workflows without any registration nag popups.

## ✨ Features

- **No Nag Popups**: Zero purchase prompts or periodic unregistered dialogs.
- **Iconic Monokai Look & Feel**: Sublime Text 4 dark theme palette, typography, status bar, and tab indicators.
- **Tabs with Dirty State**: Shows the classic circular dot when a file has unsaved changes, turning to a close button on hover.
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

## 🚀 How to Run

From this directory:

```bash
npm start
```

Or using the included launcher:

```bash
# Open editor
./subl

# Open current directory as project
./subl .

# Open a specific file or folder
./subl path/to/file.js
```

### Optional: Add `subl` to your Shell

To use `subl` from anywhere in your terminal, add an alias to your `~/.zshrc`:

```bash
alias subl="/Users/imunishsoni/.gemini/antigravity/scratch/sublime-clone/subl"
```
