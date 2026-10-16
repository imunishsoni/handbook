import AppKit
import WebKit
import Foundation

// ============================================================
//  Handbook — Native macOS High Performance App
//  Target: Apple Silicon ARM64 (Metal GPU, Native WKWebView)
// ============================================================

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
        setupWindow()
        setupMenu()
        loadEditor()
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
        webView.navigationDelegate = self
        webView.underPageBackgroundColor = NSColor(red: 28/255.0, green: 28/255.0, blue: 31/255.0, alpha: 1.0)
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
        appMenu.addItem(withTitle: "About Handbook", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
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
        editMenu.addItem(NSMenuItem(title: "Find…", action: #selector(menuFind), keyEquivalent: "f"))
        editMenu.addItem(NSMenuItem(title: "Replace…", action: #selector(menuReplace), keyEquivalent: "h"))
        editMenuItem.submenu = editMenu
        mainMenu.addItem(editMenuItem)

        // View Menu
        let viewMenuItem = NSMenuItem()
        let viewMenu = NSMenu(title: "View")
        let cmdPalItem = NSMenuItem(title: "Command Palette…", action: #selector(menuCommandPalette), keyEquivalent: "p")
        cmdPalItem.keyEquivalentModifierMask = [.command, .shift]
        viewMenu.addItem(cmdPalItem)
        viewMenu.addItem(NSMenuItem(title: "Preferences: Color Theme…", action: #selector(menuThemePicker), keyEquivalent: ""))
        viewMenu.addItem(NSMenuItem.separator())
        viewMenu.addItem(NSMenuItem(title: "Toggle Sidebar", action: #selector(menuToggleSidebar), keyEquivalent: "b"))
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

    @objc func menuNewFile()         { triggerAction("newFile") }
    @objc func menuOpenFile()        { triggerAction("openFile") }
    @objc func menuOpenFolder()      { triggerAction("openFolder") }
    @objc func menuSave()            { triggerAction("save") }
    @objc func menuCloseTab()        { triggerAction("closeTab") }
    @objc func menuFind()            { triggerAction("find") }
    @objc func menuReplace()         { triggerAction("replace") }
    @objc func menuCommandPalette()  { triggerAction("commandPalette") }
    @objc func menuThemePicker()     { triggerAction("themePicker") }
    @objc func menuToggleSidebar()   { triggerAction("toggleSidebar") }
    @objc func menuGotoFile()        { triggerAction("gotoFile") }
    @objc func menuGotoLine()        { triggerAction("gotoLine") }
    @objc func menuZoomIn()          { triggerAction("zoomIn") }
    @objc func menuZoomOut()         { triggerAction("zoomOut") }
    @objc func menuResetZoom()       { triggerAction("resetZoom") }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// Entry Point
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
