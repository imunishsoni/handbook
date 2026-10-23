import AppKit
import WebKit
import Foundation
import Darwin

// ============================================================
//  Handbook — Native macOS High Performance App
//  Target: Universal 2 (Apple Silicon ARM64 + Intel x86_64)
// ============================================================

class TerminalSession {
    let id: Int
    var masterFd: Int32
    var process: Process?
    var readSource: DispatchSourceRead?
    var isRunning: Bool = false

    init(id: Int, masterFd: Int32) {
        self.id = id
        self.masterFd = masterFd
    }

    func close() {
        isRunning = false
        if let source = readSource {
            source.cancel()
            readSource = nil
        }
        if let proc = process, proc.isRunning {
            proc.terminate()
        }
        process = nil
        if masterFd >= 0 {
            Darwin.close(masterFd)
            masterFd = -1
        }
    }
}

class TerminalManager {
    static let shared = TerminalManager()
    private var sessions: [Int: TerminalSession] = [:]
    private let queue = DispatchQueue(label: "com.handbook.terminal", qos: .userInitiated)
    weak var webView: WKWebView?

    func open(id: Int, cols: Int, rows: Int, cwd: String?) -> Bool {
        var masterFd: Int32 = 0
        var slaveFd: Int32 = 0
        guard openpty(&masterFd, &slaveFd, nil, nil, nil) == 0 else {
            return false
        }

        var ws = winsize(ws_row: UInt16(max(1, rows)), ws_col: UInt16(max(2, cols)), ws_xpixel: 0, ws_ypixel: 0)
        _ = ioctl(masterFd, TIOCSWINSZ, &ws)

        let session = TerminalSession(id: id, masterFd: masterFd)
        let slaveHandle = FileHandle(fileDescriptor: slaveFd, closeOnDealloc: false)

        let proc = Process()
        let envShell = ProcessInfo.processInfo.environment["SHELL"] ?? "/bin/zsh"
        let shellPath = FileManager.default.isExecutableFile(atPath: envShell) ? envShell : "/bin/zsh"
        proc.executableURL = URL(fileURLWithPath: shellPath)
        proc.arguments = ["-l"]

        if let cwd = cwd, !cwd.isEmpty, FileManager.default.fileExists(atPath: cwd) {
            proc.currentDirectoryURL = URL(fileURLWithPath: cwd)
        } else {
            proc.currentDirectoryURL = URL(fileURLWithPath: NSHomeDirectory())
        }

        var env = ProcessInfo.processInfo.environment
        env["TERM"] = "xterm-256color"
        env["COLORTERM"] = "truecolor"
        if env["LANG"] == nil {
            env["LANG"] = "en_US.UTF-8"
        }
        env["TERM_PROGRAM"] = "Handbook"
        let curPath = env["PATH"] ?? "/usr/bin:/bin:/usr/sbin:/sbin"
        let extraPaths = "/opt/homebrew/bin:/usr/local/bin"
        env["PATH"] = "\(extraPaths):\(curPath)"
        proc.environment = env

        proc.standardInput = slaveHandle
        proc.standardOutput = slaveHandle
        proc.standardError = slaveHandle

        do {
            try proc.run()
        } catch {
            Darwin.close(masterFd)
            Darwin.close(slaveFd)
            return false
        }

        Darwin.close(slaveFd)
        session.process = proc
        session.isRunning = true

        let readSource = DispatchSource.makeReadSource(fileDescriptor: masterFd, queue: queue)
        readSource.setEventHandler { [weak self, weak session] in
            guard let self = self, let session = session, session.isRunning, session.masterFd >= 0 else { return }
            var buffer = [UInt8](repeating: 0, count: 4096)
            let bytesRead = Darwin.read(session.masterFd, &buffer, buffer.count)
            if bytesRead > 0 {
                let chunk = Data(buffer[0..<bytesRead])
                let base64 = chunk.base64EncodedString()
                DispatchQueue.main.async {
                    self.webView?.evaluateJavaScript("window.__handleTerminalData(\(id), '\(base64)');", completionHandler: nil)
                }
            } else if bytesRead == 0 {
                session.close()
            }
        }
        readSource.setCancelHandler {
            if session.masterFd >= 0 {
                Darwin.close(session.masterFd)
                session.masterFd = -1
            }
        }
        session.readSource = readSource
        readSource.resume()

        proc.terminationHandler = { [weak self] p in
            DispatchQueue.main.async {
                self?.webView?.evaluateJavaScript("window.__handleTerminalExit(\(id), \(p.terminationStatus));", completionHandler: nil)
            }
        }

        queue.sync {
            sessions[id]?.close()
            sessions[id] = session
        }

        return true
    }

    func write(id: Int, data: String) -> Bool {
        return queue.sync {
            guard let session = sessions[id], session.isRunning, session.masterFd >= 0 else { return false }
            guard let rawData = data.data(using: .utf8) else { return false }
            return rawData.withUnsafeBytes { ptr in
                guard let base = ptr.baseAddress else { return false }
                let written = Darwin.write(session.masterFd, base, ptr.count)
                return written >= 0
            }
        }
    }

    func resize(id: Int, cols: Int, rows: Int) -> Bool {
        return queue.sync {
            guard let session = sessions[id], session.isRunning, session.masterFd >= 0 else { return false }
            var ws = winsize(ws_row: UInt16(max(1, rows)), ws_col: UInt16(max(2, cols)), ws_xpixel: 0, ws_ypixel: 0)
            return ioctl(session.masterFd, TIOCSWINSZ, &ws) == 0
        }
    }

    func close(id: Int) -> Bool {
        return queue.sync {
            if let session = sessions.removeValue(forKey: id) {
                session.close()
                return true
            }
            return false
        }
    }

    func closeAll() {
        queue.sync {
            for (_, s) in sessions {
                s.close()
            }
            sessions.removeAll()
        }
    }
}

class NativeBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    weak var window: NSWindow?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let id = body["id"] as? Int,
              let action = body["action"] as? String else {
            return
        }
        let payload = body["payload"] as? [String: Any]

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            do {
                let result = try self.handleAction(action, payload: payload)
                DispatchQueue.main.async {
                    self.sendResponse(id: id, result: result, error: nil)
                }
            } catch {
                DispatchQueue.main.async {
                    self.sendResponse(id: id, result: nil, error: error.localizedDescription)
                }
            }
        }
    }

    private func sendResponse(id: Int, result: Any?, error: String?) {
        guard let webView = self.webView else { return }
        var resultJson = "null"
        if let result = result,
           let data = try? JSONSerialization.data(withJSONObject: result, options: []),
           let str = String(data: data, encoding: .utf8) {
            resultJson = str
        }

        var errorJson = "null"
        if let error = error,
           let data = try? JSONSerialization.data(withJSONObject: error, options: []),
           let str = String(data: data, encoding: .utf8) {
            errorJson = str
        }

        let script = "window.__handleNativeResponse(\(id), \(resultJson), \(errorJson));"
        webView.evaluateJavaScript(script, completionHandler: nil)
    }

    private func handleAction(_ action: String, payload: [String: Any]?) throws -> Any? {
        switch action {
        case "readDir":
            let dirPath = payload?["path"] as? String ?? ""
            let fileManager = FileManager.default
            let urls = try fileManager.contentsOfDirectory(at: URL(fileURLWithPath: dirPath),
                                                           includingPropertiesForKeys: [.isDirectoryKey],
                                                           options: [.skipsHiddenFiles])
            var items: [[String: Any]] = []
            for url in urls {
                let resourceValues = try? url.resourceValues(forKeys: [.isDirectoryKey])
                let isDir = resourceValues?.isDirectory ?? false
                items.append([
                    "name": url.lastPathComponent,
                    "path": url.path,
                    "isDirectory": isDir
                ])
            }
            items.sort { a, b in
                let aIsDir = a["isDirectory"] as? Bool ?? false
                let bIsDir = b["isDirectory"] as? Bool ?? false
                if aIsDir != bIsDir { return aIsDir }
                let aName = a["name"] as? String ?? ""
                let bName = b["name"] as? String ?? ""
                return aName.localizedCaseInsensitiveCompare(bName) == .orderedAscending
            }
            return items

        case "readFile":
            let path = payload?["path"] as? String ?? ""
            do {
                let content = try String(contentsOfFile: path, encoding: .utf8)
                return ["content": content, "error": nil]
            } catch {
                return ["content": nil, "error": error.localizedDescription]
            }

        case "writeFile":
            let path = payload?["path"] as? String ?? ""
            let content = payload?["content"] as? String ?? ""
            do {
                try content.write(toFile: path, atomically: true, encoding: .utf8)
                return ["error": nil]
            } catch {
                return ["error": error.localizedDescription]
            }

        case "isDirectory":
            let path = payload?["path"] as? String ?? ""
            var isDir: ObjCBool = false
            let exists = FileManager.default.fileExists(atPath: path, isDirectory: &isDir)
            return exists && isDir.boolValue

        case "getAllFiles":
            let rootPath = payload?["path"] as? String ?? ""
            let rootURL = URL(fileURLWithPath: rootPath)
            var results: [[String: Any]] = []
            let ignored: Set<String> = [
                "node_modules", ".git", "__pycache__", ".venv", "venv",
                "dist", "build", ".next", ".nuxt", "coverage", ".DS_Store"
            ]

            let fileManager = FileManager.default
            if let enumerator = fileManager.enumerator(at: rootURL,
                                                       includingPropertiesForKeys: [.isDirectoryKey],
                                                       options: [.skipsPackageDescendants]) {
                for case let fileURL as URL in enumerator {
                    if results.count >= 8000 { break }
                    let name = fileURL.lastPathComponent
                    if name.hasPrefix(".") && name != ".gitignore" && name != ".env" {
                        enumerator.skipDescendants()
                        continue
                    }
                    if ignored.contains(name) {
                        enumerator.skipDescendants()
                        continue
                    }

                    if let values = try? fileURL.resourceValues(forKeys: [.isDirectoryKey]),
                       let isDir = values.isDirectory {
                        if !isDir {
                            let rel = fileURL.path.replacingOccurrences(of: rootPath + "/", with: "")
                            results.append([
                                "name": name,
                                "path": fileURL.path,
                                "relativePath": rel
                            ])
                        }
                    }
                }
            }
            return results

        case "openFolderDialog":
            return DispatchQueue.main.sync {
                let panel = NSOpenPanel()
                panel.canChooseDirectories = true
                panel.canChooseFiles = false
                panel.allowsMultipleSelection = false
                panel.prompt = "Open Workspace"
                if panel.runModal() == .OK {
                    return panel.url?.path
                }
                return nil
            }

        case "openFileDialog":
            return DispatchQueue.main.sync {
                let panel = NSOpenPanel()
                panel.canChooseDirectories = false
                panel.canChooseFiles = true
                panel.allowsMultipleSelection = true
                panel.prompt = "Open File"
                if panel.runModal() == .OK {
                    return panel.urls.map { $0.path }
                }
                return nil
            }

        case "showSaveDialog":
            return DispatchQueue.main.sync {
                let panel = NSSavePanel()
                if let def = payload?["defaultPath"] as? String {
                    panel.nameFieldStringValue = def
                }
                panel.prompt = "Save"
                if panel.runModal() == .OK {
                    return panel.url?.path
                }
                return nil
            }

        case "terminalOpen":
            let id = payload?["id"] as? Int ?? 1
            let cols = payload?["cols"] as? Int ?? 80
            let rows = payload?["rows"] as? Int ?? 24
            let cwd = payload?["cwd"] as? String
            TerminalManager.shared.webView = self.webView
            let success = TerminalManager.shared.open(id: id, cols: cols, rows: rows, cwd: cwd)
            return ["success": success, "id": id]

        case "terminalWrite":
            let id = payload?["id"] as? Int ?? 1
            let data = payload?["data"] as? String ?? ""
            let success = TerminalManager.shared.write(id: id, data: data)
            return ["success": success]

        case "terminalResize":
            let id = payload?["id"] as? Int ?? 1
            let cols = payload?["cols"] as? Int ?? 80
            let rows = payload?["rows"] as? Int ?? 24
            let success = TerminalManager.shared.resize(id: id, cols: cols, rows: rows)
            return ["success": success]

        case "terminalClose":
            let id = payload?["id"] as? Int ?? 1
            let success = TerminalManager.shared.close(id: id)
            return ["success": success]

        case "getHomeDir":
            return NSHomeDirectory()

        default:
            return nil
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var nativeBridge: NativeBridge!
    var pendingCliPath: String?

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupAppIcon()
        setupWindow()
        setupMenu()
        loadEditor()
    }

    private func setupAppIcon() {
        if let iconURL = Bundle.main.url(forResource: "icon", withExtension: "icns"),
           let image = NSImage(contentsOf: iconURL) {
            NSApp.applicationIconImage = image
        } else if let resourcePath = Bundle.main.resourcePath {
            let directURL = URL(fileURLWithPath: resourcePath).appendingPathComponent("icon.icns")
            if let image = NSImage(contentsOf: directURL) {
                NSApp.applicationIconImage = image
            }
        }
    }

    private func setupWindow() {
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1400, height: 900)
        let w: CGFloat = min(1400, screenRect.width * 0.9)
        let h: CGFloat = min(900, screenRect.height * 0.9)
        let rect = NSRect(x: screenRect.midX - w/2, y: screenRect.midY - h/2, width: w, height: h)

        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )

        window.title = "Handbook"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.backgroundColor = NSColor(red: 28/255.0, green: 28/255.0, blue: 31/255.0, alpha: 1.0)
        window.minSize = NSSize(width: 800, height: 500)
        window.isReleasedWhenClosed = false

        // WKWebView Configuration
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        nativeBridge = NativeBridge()
        nativeBridge.webView = nil
        nativeBridge.window = window
        contentController.add(nativeBridge, name: "handbook")

        config.userContentController = contentController
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")

        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        if #available(macOS 12.0, *) {
            webView.underPageBackgroundColor = NSColor(red: 28/255.0, green: 28/255.0, blue: 31/255.0, alpha: 1.0)
        }
        webView.setValue(false, forKey: "drawsBackground")

        nativeBridge.webView = webView
        window.contentView!.addSubview(webView)
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    private func loadEditor() {
        // Detect resources path
        let bundleURL = Bundle.main.bundleURL
        let webDir = bundleURL.appendingPathComponent("Contents/Resources/web")

        let indexURL: URL
        if FileManager.default.fileExists(atPath: webDir.appendingPathComponent("index.html").path) {
            indexURL = webDir.appendingPathComponent("index.html")
            webView.loadFileURL(indexURL, allowingReadAccessTo: webDir)
        } else {
            // Development fallback
            let devDir = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
            indexURL = devDir.appendingPathComponent("index.html")
            webView.loadFileURL(indexURL, allowingReadAccessTo: devDir)
        }

        // Check command line arguments for initial path
        let args = CommandLine.arguments.dropFirst().filter { !$0.hasPrefix("-") }
        if let target = args.first {
            let fullPath = URL(fileURLWithPath: target).standardized.path
            pendingCliPath = fullPath
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let path = pendingCliPath {
            pendingCliPath = nil
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                let escaped = path.replacingOccurrences(of: "\"", with: "\\\"")
                webView.evaluateJavaScript("window.__triggerCliOpen(\"\(escaped)\");", completionHandler: nil)
            }
        }
    }

    func triggerAction(_ action: String) {
        webView.evaluateJavaScript("window.__triggerMenuAction('\(action)');", completionHandler: nil)
    }

    private func setupMenu() {
        let mainMenu = NSMenu()

        // App Menu
        let appMenuItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About Handbook", action: #selector(menuAboutHandbook), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Hide Handbook", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h").keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(withTitle: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit Handbook", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)

        // File Menu
        let fileMenuItem = NSMenuItem()
        let fileMenu = NSMenu(title: "File")
        fileMenu.addItem(NSMenuItem(title: "New File", action: #selector(menuNewFile), keyEquivalent: "n"))
        fileMenu.addItem(NSMenuItem(title: "Open File…", action: #selector(menuOpenFile), keyEquivalent: "o"))
        let openFolderItem = NSMenuItem(title: "Open Workspace Folder…", action: #selector(menuOpenFolder), keyEquivalent: "o")
        openFolderItem.keyEquivalentModifierMask = [.command, .shift]
        fileMenu.addItem(openFolderItem)
        let reopenItem = NSMenuItem(title: "Reopen Closed Tab", action: #selector(menuReopenTab), keyEquivalent: "t")
        reopenItem.keyEquivalentModifierMask = [.command, .shift]
        fileMenu.addItem(reopenItem)
        fileMenu.addItem(NSMenuItem.separator())
        fileMenu.addItem(NSMenuItem(title: "Save", action: #selector(menuSave), keyEquivalent: "s"))
        fileMenu.addItem(NSMenuItem.separator())
        fileMenu.addItem(NSMenuItem(title: "Close Tab", action: #selector(menuCloseTab), keyEquivalent: "w"))
        fileMenuItem.submenu = fileMenu
        mainMenu.addItem(fileMenuItem)

        // Edit Menu
        let editMenuItem = NSMenuItem()
        let editMenu = NSMenu(title: "Edit")
        editMenu.addItem(withTitle: "Undo", action: #selector(UndoManager.undo), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: #selector(UndoManager.redo), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editMenu.addItem(NSMenuItem.separator())

        // Line Submenu
        let lineMenuItem = NSMenuItem(title: "Line", action: nil, keyEquivalent: "")
        let lineMenu = NSMenu(title: "Line")
        let indentItem = NSMenuItem(title: "Indent", action: #selector(menuIndent), keyEquivalent: "]")
        let outdentItem = NSMenuItem(title: "Outdent", action: #selector(menuOutdent), keyEquivalent: "[")
        let dupLineItem = NSMenuItem(title: "Duplicate Line / Selection", action: #selector(menuDuplicateLine), keyEquivalent: "d")
        dupLineItem.keyEquivalentModifierMask = [.command, .shift]
        let delLineItem = NSMenuItem(title: "Delete Line", action: #selector(menuDeleteLine), keyEquivalent: "k")
        delLineItem.keyEquivalentModifierMask = [.command, .shift]
        let joinLineItem = NSMenuItem(title: "Join Lines", action: #selector(menuJoinLines), keyEquivalent: "j")
        lineMenu.addItem(indentItem)
        lineMenu.addItem(outdentItem)
        lineMenu.addItem(NSMenuItem.separator())
        lineMenu.addItem(dupLineItem)
        lineMenu.addItem(delLineItem)
        lineMenu.addItem(joinLineItem)
        lineMenuItem.submenu = lineMenu
        editMenu.addItem(lineMenuItem)

        // Comment Submenu
        let commentMenuItem = NSMenuItem(title: "Comment", action: nil, keyEquivalent: "")
        let commentMenu = NSMenu(title: "Comment")
        commentMenu.addItem(NSMenuItem(title: "Toggle Line Comment", action: #selector(menuToggleComment), keyEquivalent: "/"))
        let blockCommentItem = NSMenuItem(title: "Toggle Block Comment", action: #selector(menuToggleBlockComment), keyEquivalent: "/")
        blockCommentItem.keyEquivalentModifierMask = [.command, .option]
        commentMenu.addItem(blockCommentItem)
        commentMenuItem.submenu = commentMenu
        editMenu.addItem(commentMenuItem)

        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(NSMenuItem(title: "Find…", action: #selector(menuFind), keyEquivalent: "f"))
        let replaceItem = NSMenuItem(title: "Replace…", action: #selector(menuReplace), keyEquivalent: "f")
        replaceItem.keyEquivalentModifierMask = [.command, .option]
        editMenu.addItem(replaceItem)
        editMenuItem.submenu = editMenu
        mainMenu.addItem(editMenuItem)

        // Selection Menu (Sublime Text style)
        let selectionMenuItem = NSMenuItem()
        let selectionMenu = NSMenu(title: "Selection")
        let addNextItem = NSMenuItem(title: "Quick Add Next", action: #selector(menuAddNextMatch), keyEquivalent: "d")
        let selectAllOccurItem = NSMenuItem(title: "Select All Occurrences", action: #selector(menuSelectAllMatches), keyEquivalent: "g")
        selectAllOccurItem.keyEquivalentModifierMask = [.command, .control]
        let splitLinesItem = NSMenuItem(title: "Split into Lines", action: #selector(menuSplitLines), keyEquivalent: "l")
        splitLinesItem.keyEquivalentModifierMask = [.command, .shift]
        let expandLineItem = NSMenuItem(title: "Expand Selection to Line", action: #selector(menuExpandLine), keyEquivalent: "l")
        selectionMenu.addItem(addNextItem)
        selectionMenu.addItem(selectAllOccurItem)
        selectionMenu.addItem(NSMenuItem.separator())
        selectionMenu.addItem(splitLinesItem)
        selectionMenu.addItem(expandLineItem)
        selectionMenuItem.submenu = selectionMenu
        mainMenu.addItem(selectionMenuItem)

        // View Menu
        let viewMenuItem = NSMenuItem()
        let viewMenu = NSMenu(title: "View")
        let cmdPalItem = NSMenuItem(title: "Command Palette…", action: #selector(menuCommandPalette), keyEquivalent: "p")
        cmdPalItem.keyEquivalentModifierMask = [.command, .shift]
        viewMenu.addItem(cmdPalItem)
        viewMenu.addItem(NSMenuItem(title: "Preferences: Color Theme…", action: #selector(menuThemePicker), keyEquivalent: ""))
        viewMenu.addItem(NSMenuItem.separator())
        viewMenu.addItem(NSMenuItem(title: "Toggle Sidebar", action: #selector(menuToggleSidebar), keyEquivalent: "b"))
        let termItem = NSMenuItem(title: "Toggle Integrated Terminal", action: #selector(menuToggleTerminal), keyEquivalent: "`")
        termItem.keyEquivalentModifierMask = [.control]
        viewMenu.addItem(termItem)
        viewMenu.addItem(NSMenuItem.separator())
        viewMenu.addItem(NSMenuItem(title: "Zoom In", action: #selector(menuZoomIn), keyEquivalent: "="))
        viewMenu.addItem(NSMenuItem(title: "Zoom Out", action: #selector(menuZoomOut), keyEquivalent: "-"))
        viewMenu.addItem(NSMenuItem(title: "Reset Zoom", action: #selector(menuResetZoom), keyEquivalent: "0"))
        viewMenuItem.submenu = viewMenu
        mainMenu.addItem(viewMenuItem)

        // Go Menu
        let goMenuItem = NSMenuItem()
        let goMenu = NSMenu(title: "Go")
        goMenu.addItem(NSMenuItem(title: "Go to File…", action: #selector(menuGotoFile), keyEquivalent: "p"))
        goMenu.addItem(NSMenuItem(title: "Go to Line…", action: #selector(menuGotoLine), keyEquivalent: "g"))
        goMenu.addItem(NSMenuItem(title: "Go to Symbol…", action: #selector(menuGotoSymbol), keyEquivalent: "r"))
        goMenu.addItem(NSMenuItem.separator())
        goMenu.addItem(NSMenuItem(title: "Next Tab", action: #selector(menuNextTab), keyEquivalent: ""))
        goMenu.addItem(NSMenuItem(title: "Previous Tab", action: #selector(menuPrevTab), keyEquivalent: ""))
        goMenuItem.submenu = goMenu
        mainMenu.addItem(goMenuItem)

        // Window Menu
        let windowMenuItem = NSMenuItem()
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        windowMenuItem.submenu = windowMenu
        mainMenu.addItem(windowMenuItem)

        NSApp.mainMenu = mainMenu
    }

    @objc func menuAboutHandbook() {
        var options: [NSApplication.AboutPanelOptionKey: Any] = [
            .applicationName: "Handbook"
        ]
        if let icon = NSApp.applicationIconImage {
            options[.applicationIcon] = icon
        }
        NSApplication.shared.orderFrontStandardAboutPanel(options)
    }

    @objc func menuNewFile()            { triggerAction("newFile") }
    @objc func menuOpenFile()           { triggerAction("openFile") }
    @objc func menuOpenFolder()         { triggerAction("openFolder") }
    @objc func menuReopenTab()          { triggerAction("reopenTab") }
    @objc func menuSave()               { triggerAction("save") }
    @objc func menuCloseTab()           { triggerAction("closeTab") }
    @objc func menuFind()               { triggerAction("find") }
    @objc func menuReplace()            { triggerAction("replace") }
    @objc func menuIndent()             { triggerAction("indent") }
    @objc func menuOutdent()            { triggerAction("outdent") }
    @objc func menuDuplicateLine()      { triggerAction("duplicateLine") }
    @objc func menuDeleteLine()         { triggerAction("deleteLine") }
    @objc func menuJoinLines()          { triggerAction("joinLines") }
    @objc func menuToggleComment()      { triggerAction("toggleComment") }
    @objc func menuToggleBlockComment() { triggerAction("toggleBlockComment") }
    @objc func menuAddNextMatch()       { triggerAction("addNextMatch") }
    @objc func menuSelectAllMatches()   { triggerAction("selectAllMatches") }
    @objc func menuSplitLines()         { triggerAction("splitLines") }
    @objc func menuExpandLine()         { triggerAction("expandLine") }
    @objc func menuCommandPalette()     { triggerAction("commandPalette") }
    @objc func menuThemePicker()        { triggerAction("themePicker") }
    @objc func menuToggleSidebar()      { triggerAction("toggleSidebar") }
    @objc func menuToggleTerminal()     { triggerAction("toggleTerminal") }
    @objc func menuGotoFile()           { triggerAction("gotoFile") }
    @objc func menuGotoLine()           { triggerAction("gotoLine") }
    @objc func menuGotoSymbol()         { triggerAction("gotoSymbol") }
    @objc func menuNextTab()            { triggerAction("nextTab") }
    @objc func menuPrevTab()            { triggerAction("prevTab") }
    @objc func menuZoomIn()             { triggerAction("zoomIn") }
    @objc func menuZoomOut()            { triggerAction("zoomOut") }
    @objc func menuResetZoom()          { triggerAction("resetZoom") }

    func applicationWillTerminate(_ notification: Notification) {
        TerminalManager.shared.closeAll()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        TerminalManager.shared.closeAll()
        return true
    }
}

// Entry Point
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
