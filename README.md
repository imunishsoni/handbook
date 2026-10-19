<p align="center">
  <img src="build/icon.icns" width="128" height="128" alt="Handbook App Icon" />
</p>

<h1 align="center">Handbook</h1>

<p align="center">
  <strong>Pure machine speed. Ultra-lightweight. Zero friction.</strong><br>
  A high-performance text and code editor for macOS compiled directly to native machine code.<br>
  Universal 2 binary running natively on both <strong>Apple Silicon</strong> and <strong>Intel</strong> chips across macOS 10.15 (Catalina) through macOS 15+ (Sequoia).
</p>

<p align="center">
  <a href="https://github.com/imunishsoni/handbook/releases/latest"><img src="https://img.shields.io/github/v/release/imunishsoni/handbook?style=flat-square&color=38bdf8" alt="Latest Release" /></a>
  <a href="https://github.com/imunishsoni/handbook/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%2010.15+-black.svg?style=flat-square&logo=apple" alt="macOS 10.15+" />
  <img src="https://img.shields.io/badge/architecture-Universal%202%20(Apple%20%2B%20Intel)-6366f1.svg?style=flat-square" alt="Universal 2" />
  <img src="https://img.shields.io/badge/installer-4.4%20MB-emerald.svg?style=flat-square" alt="Size: 4.4 MB" />
  <img src="https://img.shields.io/badge/startup-~25ms-amber.svg?style=flat-square" alt="Startup: ~25ms" />
</p>

---

## ⚡ Why Handbook?

Most modern editors carry over 120 MB of bundled browser runtimes, spawn 4+ auxiliary processes, and consume hundreds of megabytes of memory before you write a single line of code.

**Handbook** is built differently:

- **⚡ Direct Machine Code Core**: Compiled with `swiftc -O -whole-module-optimization` as an Apple **Universal 2** binary. File scanning, directory crawling, and atomic disk writes run directly on bare metal CPU registers via POSIX and Cocoa Foundation APIs.
- **💻 Universal Hardware Compatibility**: Contains native Mach-O machine code slices for both **Apple Silicon** (M1, M2, M3, M4, Pro, Max, Ultra) and **Intel** (Core i3, i5, i7, i9, Xeon) Macs — zero emulation overhead.
- **🖥 Broad macOS Version Support**: Runs out-of-the-box on older macOS releases (macOS 10.15 Catalina, macOS 11 Big Sur, macOS 12 Monterey, macOS 13 Ventura) and modern releases (macOS 14 Sonoma, macOS 15+ Sequoia).
- **🪶 Ultra-Lightweight (4.4 MB)**: Down from 125 MB on Electron — a **~96% size reduction**.
- **⏱ Instant ~25ms Cold Startup**: Instantaneous launch from Spotlight, Launchpad, or Terminal without Chromium boot latency.
- **🧠 ~25 MB RAM Footprint**: Backed by macOS's native system WebKit, sharing memory with the operating system rather than bundling an isolated Chromium engine.
- **🎨 Customizable Themes with Neutral Default**: Features a refined, balanced graphite dark theme (`#1c1c1f`) designed to reduce eye strain, plus an instant interactive theme switcher (`⌘⇧P` -> "Preferences: Color Theme") supporting 5 curated themes (Handbook Neutral, Midnight Slate, Obsidian Black, Warm Coffee, Paper Light) with live arrow-key previews.
- **⌨️ Sublime Text 4 Keymap**: Complete, 1:1 muscle memory compatibility including multi-cursor (`⌘D`, `⌃⌘G`, `⌘⇧L`), line operations (`⌘⇧D`, `⌘⇧K`, `⌘⌃↑/↓`), Go to Symbol (`⌘R`), and chords (`⌘K ...`).
- **🚫 Zero Nag Popups**: No license reminders, registration prompts, or modal interruptions.

---

## 📊 Performance & Compatibility Benchmarks

| Metric | Typical Electron Editor | **Handbook v2.3 (Native Universal 2)** | Advantage |
| :--- | :--- | :--- | :--- |
| **Architectures** | Single architecture / Heavy | **Apple Silicon (ARM64) + Intel (x86_64)** | Dual native execution |
| **macOS Compatibility** | Often drops older OS | **macOS 10.15 Catalina → macOS 15+ Sequoia** | Old & new Mac support |
| **DMG Installer Size** | ~122 MB | **4.45 MB** | **~96% smaller** |
| **Standalone App Size** | ~107 MB | **3.98 MB** | **~96% smaller** |
| **Cold Startup Time** | ~1,800 – 2,400 ms | **~25 ms** | **~80× faster** |
| **Idle Memory (RAM)** | ~220 – 300 MB | **~25 – 35 MB** | **~8× less memory** |
| **Process Count** | 4 separate processes | **1 single native process** | Minimal overhead |
| **GPU Pipeline** | Emulated WebGL layer | **Native Metal Pipeline** | Fluid 120Hz ProMotion |
| **File I/O Engine** | Node.js fs binding | **Direct POSIX & Foundation** | Native machine instructions |

---

## 💾 Installation

### 1-Click DMG Install (No Prerequisites)

No Node.js, npm, or dev tools required to use Handbook. Choose the installer that best fits your Mac:

| Target | Recommended Package | Architecture | Size |
| :--- | :--- | :--- | :--- |
| **All Macs (Universal)** | **[Handbook-mac-universal.dmg](https://github.com/imunishsoni/handbook/releases/latest/download/Handbook-mac-universal.dmg)** | Apple Silicon + Intel (macOS 10.15+) | **4.4 MB** |
| **Apple Silicon Only** | **[Handbook-mac-arm64.dmg](https://github.com/imunishsoni/handbook/releases/latest/download/Handbook-mac-arm64.dmg)** | M1 / M2 / M3 / M4 (macOS 11.0+) | **4.4 MB** |
| **Intel Mac Only** | **[Handbook-mac-x86_64.dmg](https://github.com/imunishsoni/handbook/releases/latest/download/Handbook-mac-x86_64.dmg)** | Intel Core / Xeon (macOS 10.15+) | **4.4 MB** |

> *Portable `.zip` archives are also available: [Universal.zip](https://github.com/imunishsoni/handbook/releases/latest/download/Handbook-mac-universal.zip), [ARM64.zip](https://github.com/imunishsoni/handbook/releases/latest/download/Handbook-mac-arm64.zip), and [x86_64.zip](https://github.com/imunishsoni/handbook/releases/latest/download/Handbook-mac-x86_64.zip).*

#### Steps:
1. Download **[Handbook-mac-universal.dmg](https://github.com/imunishsoni/handbook/releases/latest/download/Handbook-mac-universal.dmg)**.
2. Open the disk image and drag **Handbook** into your **Applications** folder.
3. Open **Handbook** from Spotlight (`⌘ + Space`), Launchpad, or Finder.

---

## 💻 Command Line Tool (`handbook`)

Launch Handbook from anywhere in your shell:

```bash
# Open Handbook
handbook

# Open the current working directory as a project
handbook .

# Open a specific file directly
handbook src/main.rs
```

To enable the `handbook` command globally, create a symlink or add an alias to your `~/.zshrc`:

```bash
# Option A: Symlink bundled launcher (recommended)
sudo ln -sf "/Applications/Handbook.app/Contents/SharedSupport/bin/handbook" /usr/local/bin/handbook

# Option B: Shell alias
alias handbook="/Applications/Handbook.app/Contents/MacOS/Handbook"
```

---

## 🎨 Customizable Themes

Handbook ships with 5 handcrafted color themes, with a balanced, neutral dark theme as the default:

- **Handbook Neutral** *(Default)*: Zinc & graphite charcoal (`#1c1c1f`) with gentle syntax colors for all-day focus.
- **Midnight Slate**: Deep dark slate (`#0d1117`) with vibrant indigo and cyan accents.
- **Obsidian Black**: True `#000000` dark theme optimized for OLED displays.
- **Warm Coffee**: Cozy sepia dark theme with warm espresso tones.
- **Paper Light**: Crisp, high-contrast light theme with clean neutral paper tones.

### How to Switch Themes
1. Open the Command Palette with `⌘ ⇧ P`.
2. Type **Preferences: Color Theme** (or click the `🎨` icon in the bottom status bar).
3. Use the `↑` and `↓` arrow keys to preview themes instantly in real time.
4. Press `Enter` to apply or `Escape` to cancel. Your theme choice is automatically persisted.

---

## ⌨️ Sublime Text 4 Keymap

Handbook is designed with faithful, 1:1 muscle-memory keybindings matching Sublime Text 4 on macOS:

### ⚡ Text & Line Editing
| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `⌘ ⇧ D` | **Duplicate Line / Selection** | Duplicates current line or exact text selection |
| `⌘ ⇧ K` / `⌃ ⇧ K` | **Delete Line** | Deletes line(s) under cursor |
| `⌘ ⌃ ↑` / `⌥ ↑` | **Move Line Up** | Swaps line(s) upward |
| `⌘ ⌃ ↓` / `⌥ ↓` | **Move Line Down** | Swaps line(s) downward |
| `⌘ J` | **Join Lines** | Joins line below with current line |
| `⌘ ↵` | **Insert Line Below** | Inserts newline below without splitting current line |
| `⌘ ⇧ ↵` | **Insert Line Above** | Inserts newline above without splitting current line |
| `⌘ ]` / `⌘ [` | **Indent / Outdent** | Indents or unindents line/selection |
| `⌘ K, ⌘ K` / `⌃ K` | **Delete to End of Line** | Cuts/deletes to end of line |
| `⌘ K, ⌘ ⌫` | **Delete to Start of Line** | Deletes from cursor to start of line |

### 🎯 Multi-Cursor & Selection
| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `⌘ D` | **Quick Add Next** | Select word under cursor / add next occurrence |
| `⌘ K, ⌘ D` | **Quick Skip Next** | Skips current match and advances to next occurrence |
| `⌃ ⌘ G` | **Quick Find All** | Selects all occurrences of word/selection across file |
| `⌘ ⇧ L` | **Split Selection into Lines** | Places a cursor at the end of every selected line |
| `⌘ L` | **Expand Selection to Line** | Selects entire line; press repeatedly to expand down |
| `⌃ ⇧ M` | **Select to Bracket** | Selects all content within enclosing brackets |
| `⌃ M` | **Jump to Matching Bracket** | Jumps between matching `()`, `{}`, `[]` brackets |
| `⌘ ⌥ ↑` / `⌃ ⇧ ↑` | **Add Cursor Above** | Places an additional cursor on the line above |
| `⌘ ⌥ ↓` / `⌃ ⇧ ↓` | **Add Cursor Below** | Places an additional cursor on the line below |
| `⌘ U` / `⌘ ⇧ U` | **Soft Undo / Redo** | Undoes / redoes cursor and selection movements |

### 💬 Comments, Folding & Case
| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `⌘ /` | **Toggle Line Comment** | Comments or uncomments current line(s) |
| `⌥ ⌘ /` / `⌘ ⇧ /` | **Toggle Block Comment** | Wraps or unwraps block comment |
| `⌥ ⌘ [` / `⌥ ⌘ ]` | **Fold / Unfold Code Block** | Folds/unfolds block at cursor |
| `⌘ K, ⌘ 1` / `⌘ K, ⌘ 0` | **Fold All** | Folds all code blocks in the document |
| `⌘ K, ⌘ J` | **Unfold All** | Unfolds all code blocks in the document |
| `⌘ K, ⌘ U` | **Transform to Uppercase** | Converts selection to UPPERCASE |
| `⌘ K, ⌘ L` | **Transform to Lowercase** | Converts selection to lowercase |
| `⌃ T` | **Transpose Characters** | Swaps adjacent characters |
| `F5` / `⌃ F5` | **Sort Lines Asc / Desc** | Sorts selected lines alphabetically |

### 🚀 Navigation, Goto & Tabs
| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `⌘ P` | **Goto File** | Fuzzy project file search |
| `⌘ R` | **Goto Symbol in File** | Fuzzy symbol search (`@` functions, classes, headings) |
| `⌘ G` / `⌃ G` | **Goto Line** | Jump to line number (`:`) |
| `⌘ ;` | **Goto Word in File** | Search occurrences in current file (`#`) |
| `⌘ ⇧ P` | **Command Palette** | Access all commands and themes (`>`) |
| `⌥ ⌘ →` / `⌃ ⇥` | **Next Tab** | Switches to next open tab |
| `⌥ ⌘ ←` / `⌃ ⇧ ⇥` | **Previous Tab** | Switches to previous open tab |
| `⌘ 1` .. `⌘ 8` | **Go to Tab 1–8** | Jump directly to tab index |
| `⌘ 9` | **Go to Last Tab** | Jump directly to the last tab |
| `⌘ ⇧ T` | **Reopen Closed Tab** | Restores the most recently closed tab |
| `⌘ B` | **Toggle Sidebar** | Shows/hides project file tree |
| `⌘ F` / `⌥ ⌘ F` | **Find / Replace** | Opens search and replace bar |

---

## 🛠 Building From Source

```bash
# 1. Clone repository
git clone https://github.com/imunishsoni/handbook.git
cd handbook

# 2. Install frontend dependencies
npm install

# 3. Compile the native Swift core directly to Apple Silicon machine code
./scripts/build-native.sh

# 4. Generate native DMG and ZIP distribution packages
npm run dmg
```

---

## 🤝 Contributing & Community

Contributions, feature ideas, and **public issues are warmly welcomed!** Feel free to open a [public GitHub Issue](https://github.com/imunishsoni/handbook/issues) to report bugs, suggest enhancements, or start a discussion. Please review our [Contributing Guidelines](CONTRIBUTING.md), [Code of Conduct](CODE_OF_CONDUCT.md), and [Security Policy](SECURITY.md) before submitting pull requests.

---

## 📄 License

Handbook is open-sourced under the [MIT License](LICENSE).
Created and maintained with ❤️ by [Munish Soni](https://github.com/imunishsoni).
