# Changelog

All notable changes to **Handbook** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.5.0] - 2026-10-27

### 🌍 Universal Platform Independence
- **Full Cross-Platform Support**: Built to run natively and consistently across **macOS**, **Linux** (Ubuntu, Debian, Fedora, Arch), and **Windows** (10 & 11).
- **Native OS Windowing & Titlebars**:
  - **macOS**: `hiddenInset` titlebar with native traffic lights and centered brand title.
  - **Windows & Linux**: Modern `titleBarOverlay` window controls with native minimize, maximize, and close controls themed to Handbook's dark styling.
  - Platform-specific CSS (`.platform-darwin`, `.platform-win32`, `.platform-linux`) for tailored titlebar padding and controls alignment.
- **Cross-Platform Integrated Terminal**:
  - **Windows**: Automatic detection and execution of PowerShell 7 (`pwsh.exe`), Windows PowerShell, or Command Prompt (`cmd.exe`) without auxiliary console popups (`windowsHide: true`).
  - **Linux**: Automatic login shell spawning via `$SHELL`, `/bin/bash`, or `/bin/sh`.
  - **macOS**: POSIX PTY login shell (`$SHELL` / `/bin/zsh`).
- **Dynamic Keybinding Adaptation**:
  - Automatically translates shortcuts based on operating system (`⌘` / `⌥` on Mac; `Ctrl` / `Alt` / `Shift` on Windows & Linux).
  - Dynamic Welcome Screen keyboard badges (`<kbd>Ctrl</kbd>` on Windows/Linux vs `<kbd>⌘</kbd>` on macOS).
  - Sublime Text 4 keybindings matching standard muscle memory on all OSes (`Ctrl+D`, `Ctrl+Shift+L`, `Ctrl+R`, `Alt+F3`).
- **Cross-Platform CLI Launchers**:
  - Universal Node.js launcher `bin/handbook.js` (callable via `npx` or `npm link`).
  - POSIX shell launcher `bin/handbook` for Linux & macOS.
  - Windows Command Prompt launcher `bin/handbook.cmd`.
  - Windows PowerShell launcher `bin/handbook.ps1`.
- **Multi-OS Icon Assets**:
  - Automated generation of Windows multi-resolution `build/icon.ico` containing 16px, 32px, 64px, 128px, and 256px slices alongside macOS `build/icon.icns` and high-res PNG.
- **Cross-Platform CI & Packaging Pipeline**:
  - Multi-platform GitHub Actions CI matrix building and testing across `macos-14`, `ubuntu-latest`, and `windows-latest`.
  - New `npm run dist:all` and `scripts/build-dist.js` packaging pipeline producing Linux tarballs/zips, Windows portable zips, and macOS DMGs.

---

## [2.4.0] - 2026-10-23

### 🖥 Integrated Native Terminal
- **Native POSIX Pseudoterminal (PTY)**: Built-in Swift terminal engine utilizing Darwin `openpty` and `Process` for native, low-latency shell execution with zero external C dependencies.
- **Full Shell & Environment Integration**: Automatically launches default login shell (`/bin/zsh`, `/bin/bash`, etc.) with full environment (`PATH`, `TERM=xterm-256color`, `COLORTERM=truecolor`), supporting interactive CLI workflows (`git`, `npm`, `top`, `vim`, `cargo`, etc.).
- **xterm.js Rendering**: Embedded high-performance VT100 / xterm terminal emulator with full 256-color and truecolor ANSI support.
- **Dynamic Theme Synchronization**: Terminal background, text, cursor, selection, and ANSI color palette automatically adapt in real-time when switching between Handbook's 5 curated color themes.
- **Collapsible & Resizable Drawer**:
  - Horizontal drag handle to adjust terminal height dynamically with persistent size remembered across restarts.
  - Header actions: New Session / Restart (`+`), Clear Buffer (`⌕` / `⌃L`), Maximize / Restore (`⤢`), Close (`✕`).
- **Shortcuts & Menus**:
  - `⌃\`` (Ctrl+Backtick) or `⌘\`` global shortcut to toggle terminal from anywhere in the editor.
  - `View > Toggle Integrated Terminal` in native macOS menu bar.
  - Clickable `❯_ Terminal` indicator on the status bar.
  - Command Palette actions: `View: Toggle Integrated Terminal`, `Terminal: Clear Terminal`, `Terminal: New Session`, `Terminal: Maximize / Restore Panel`.
  - Welcome screen one-click shortcut for Integrated Terminal.
- **Workspace Directory Binding**: Terminal automatically spawns in the currently active project/workspace directory.

---

## [2.3.0] - 2026-10-19

### 🍎 Universal 2 Architecture & Broad macOS Compatibility
- **Universal 2 Mach-O Binary**: Compiled into an Apple Universal 2 fat binary packing native machine code slices for both **Apple Silicon** (M1/M2/M3/M4, Pro, Max, Ultra) and **Intel** (Core i3/i5/i7/i9, Xeon) Macs — zero emulation required on either platform.
- **Broad macOS Compatibility (10.15 Catalina → 15+ Sequoia)**:
  - Supports older Intel Macs on macOS 10.15 (Catalina), 11 (Big Sur), 12 (Monterey), and 13 (Ventura).
  - Supports Apple Silicon Macs on macOS 11 (Big Sur) through macOS 15+ (Sequoia).
- **Graceful API Back-deployment**: Added runtime `#available(macOS 12.0, *)` guards and an x86_64 compatibility shim (`compat_x86_64.s`) to prevent missing symbol errors when back-deploying to older macOS targets.
- **Bundled CLI Launcher**: Included native command-line launcher at `Handbook.app/Contents/SharedSupport/bin/handbook` for effortless `/usr/local/bin` symlinking.
- **Universal Packaging**:
  - `Handbook-mac-universal.dmg`: Single unified DMG installer that works on all Macs.
  - `Handbook-mac-arm64.dmg` & `Handbook-mac-x86_64.dmg`: Architecture-labeled installers for automated workflows and target-specific downloads.
  - Universal and target-specific `.zip` portable archives.

---

## [2.2.0] - 2026-10-19

### ⌨️ Sublime Text 4 Keymap & Navigation
- **Comprehensive Sublime Text 4 Muscle Memory**: Implemented exact 1:1 macOS Sublime Text 4 keybindings across Monaco Editor, native menus, and global handlers.
- **Go to Symbol (`⌘R` / `@`)**: Fast zero-dependency symbol indexing and jump navigation for functions, classes, methods, interfaces, and headings across JS/TS, Python, Swift, Go, Rust, Ruby, C/C++, and Markdown.
- **Multi-Cursor & Selection Enhancements**:
  - `⌘D`: Quick Add Next occurrence
  - `⌘K ⌘D`: Skip Next occurrence
  - `⌃⌘G`: Quick Find All / Select all occurrences
  - `⌘⇧L`: Split multi-line selection into individual cursors per line
  - `⌘L`: Expand selection to current line (press repeatedly to expand downward)
  - `⌃M`: Jump to matching bracket
  - `⌃⇧M`: Select to matching bracket
  - `⌘⌥↑` / `⌘⌥↓` & `⌃⇧↑` / `⌃⇧↓`: Add multi-cursor above / below
  - `⌘U` / `⌘⇧U`: Soft undo / redo cursor positions
- **Line Editing & Structural Transforms**:
  - `⌘⇧D`: Duplicate line or selection
  - `⌘⇧K` / `⌃⇧K`: Delete line
  - `⌘⌃↑` / `⌘⌃↓` & `⌥↑` / `⌥↓`: Move line / selection up or down
  - `⌘J`: Join lines
  - `⌘↵`: Insert line below without splitting current line
  - `⌘⇧↵`: Insert line above
  - `⌘]` / `⌘[`: Indent / Outdent line or selection
  - `⌘K ⌘K` / `⌃K`: Delete to end of line (EOL)
  - `⌘K ⌘⌫`: Delete to beginning of line (BOL)
  - `⌘K ⌘U` / `⌘K ⌘L`: Transform selection to uppercase / lowercase
  - `⌃T`: Transpose adjacent characters
  - `F5` / `⌃F5`: Sort lines ascending / descending (case-sensitive)
- **Code Folding & Comments**:
  - `⌘/`: Toggle line comment
  - `⌥⌘/` / `⌘⇧/`: Toggle block comment
  - `⌥⌘[` / `⌥⌘]`: Fold / Unfold current code block
  - `⌘K ⌘1`: Fold all top-level blocks
  - `⌘K ⌘J`: Unfold all blocks
- **Tab & Window Navigation**:
  - `⌥⌘→` / `⌥⌘←` & `⌃⇥` / `⌃⇧⇥`: Cycle next / previous tab
  - `⌘1` – `⌘8`: Switch directly to tabs 1 through 8
  - `⌘9`: Switch to last open tab
  - `⌘⇧T`: Reopen last closed tab (with history stack)
- **Native macOS Menu Integration**:
  - Added native `Selection` menu with `Split into Lines`, `Quick Add Next`, `Select All Occurrences`, `Expand Selection to Line`.
  - Added `Line` and `Comment` submenus under native `Edit` menu.
  - Added `Go to Symbol…` (`⌘R`), `Reopen Closed Tab` (`⌘⇧T`), and tab switching commands under native `Go` and `File` menus.

---

## [2.1.0] - 2026-10-16

### 🎨 Customizable Themes & Neutral Default
- **Neutral Dark Default**: Refined zinc & graphite palette (`#1c1c1f` background, `#e4e4e7` foreground, `#161618` chrome) tailored for long coding sessions with minimal eye strain.
- **Interactive Theme Switcher**: Instant theme picker accessible via Command Palette (`⌘⇧P` -> "Preferences: Color Theme"), View Menu, Welcome screen, or clicking the status bar theme indicator.
- **Real-Time Live Preview**: Browse themes with `↑` and `↓` arrow keys with real-time editor and UI color previewing; pressing `Escape` cleanly cancels and restores your prior theme.
- **5 Curated Themes**:
  - **Handbook Neutral** (Default balanced graphite dark)
  - **Midnight Slate** (High-contrast indigo slate)
  - **Obsidian Black** (OLED true black)
  - **Warm Coffee** (Sepia warm dark)
  - **Paper Light** (High-contrast clean light)
- **Persistent Preferences**: Selected color theme is remembered across application restarts via local storage.

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
- **New App Icon**: Custom macOS Big Sur squircle featuring a dimensional closed hardcover developer handbook in midnight slate with blind-debossed framing, spine binding ribs, emerald silk ribbon bookmark, elastic closure strap, corner clasps, and a radiant embossed `</>` code medallion.
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
