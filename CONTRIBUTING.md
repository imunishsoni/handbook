# Contributing to Handbook

Thank you for your interest in contributing to **Handbook**! We welcome all contributions from bug fixes and documentation improvements to new features and performance enhancements.

---

## 🏗 Architecture Overview

Handbook is built with a lightweight, high-performance hybrid architecture designed to run as close to the machine code as possible:

1. **Native Core (`src/native/main.swift`)**:
   - Compiled with `swiftc -O -whole-module-optimization` directly targeting Apple Silicon ARM64.
   - Manages the native `NSWindow`, native menu bar, POSIX and Foundation file I/O, directory crawling, and atomic file operations.
   - Communicates with the web runtime via a high-speed asynchronous message bridge (`WKScriptMessageHandler`).

2. **Editor Frontend (`web/` or project root)**:
   - Built on Monaco Editor (the battle-tested core of VS Code) themed in **Midnight**.
   - Connected to the native core through `bridge.js`.

---

## 🚀 Development Setup

### Prerequisites
- macOS (macOS 12.0 Monterey or later, Apple Silicon recommended)
- Xcode Command Line Tools (`xcode-select --install`)
- Node.js 18+ (for Monaco dependency installation)

### Steps
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/imunishsoni/handbook.git
   cd handbook
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the native Apple Silicon app:
   ```bash
   ./scripts/build-native.sh
   ```

4. Launch the built app:
   ```bash
   open dist/Handbook.app
   ```

---

## 🛠 Project Structure

```
handbook/
├── .github/                  # GitHub Actions CI & Issue/PR templates
├── build/                    # App icons & temporary build assets
├── dist/                     # Compiled native app bundle and installers
├── scripts/
│   ├── build-native.sh       # Compiles Swift to ARM64 machine code
│   ├── build-dmg.js          # Creates DMG and ZIP installers
│   └── generate-icon.js      # Generates multi-resolution .icns icon
├── src/
│   └── native/
│       └── main.swift        # Swift AppKit & WKWebView native core
├── index.html                # Editor shell HTML
├── styles.css                # Midnight Theme stylesheet
├── bridge.js                 # High-speed native message bridge
├── renderer.js               # Editor orchestration & Monaco logic
└── package.json              # Project metadata & scripts
```

---

## 📋 Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Write clean, readable code that adheres to project formatting.
3. Test your changes locally by rebuilding and launching:
   ```bash
   ./scripts/build-native.sh && open dist/Handbook.app
   ```
4. Commit with descriptive commit messages following the Conventional Commits specification (e.g. `feat: ...`, `fix: ...`, `docs: ...`, `perf: ...`).
5. Push to your fork and submit a Pull Request.

---

## 🔒 Security Vulnerabilities

If you discover a security vulnerability, please do **not** open a public issue. Follow our [Security Policy](SECURITY.md) to report vulnerabilities privately and coordinate fixes under our Safe Harbor policy.
