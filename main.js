const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

app.name = 'Handbook';

let mainWindow;

function getAppIcon() {
  if (process.platform === 'win32') {
    const icoPath = path.join(__dirname, 'build', 'icon.ico');
    if (fs.existsSync(icoPath)) return icoPath;
  }
  const pngPath = path.join(__dirname, 'assets', 'icon.png');
  if (fs.existsSync(pngPath)) return pngPath;
  return undefined;
}

function getPlatformDefaultShell() {
  if (process.platform === 'win32') {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const winPS = path.join(sysRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    if (fs.existsSync(winPS)) {
      return { shell: winPS, args: ['-NoLogo'] };
    }
    return { shell: process.env.COMSPEC || 'cmd.exe', args: [] };
  } else if (process.platform === 'darwin') {
    return { shell: process.env.SHELL || '/bin/zsh', args: ['-l'] };
  } else {
    // Linux and others
    const linuxShell = process.env.SHELL || (fs.existsSync('/bin/bash') ? '/bin/bash' : '/bin/sh');
    return { shell: linuxShell, args: ['-l'] };
  }
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  const icon = getAppIcon();

  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: '#1c1c1f',
    icon,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  };

  if (isMac) {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.trafficLightPosition = { x: 15, y: 12 };
  } else {
    // Windows and Linux: native titlebar overlay with matching theme controls
    windowOptions.titleBarStyle = 'hidden';
    windowOptions.titleBarOverlay = {
      color: '#161618',
      symbolColor: '#e4e4e7',
      height: 38,
    };
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}]: ${message} (${sourceId}:${line})`);
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  const cliArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('-') && arg !== '.');
  const target = cliArgs[0] || (process.argv.includes('.') ? process.cwd() : null);
  if (target) {
    const resolvedPath = path.resolve(target);
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        mainWindow?.webContents.send('cli:open', resolvedPath);
      }, 500);
    });
  }
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:action', 'newFile'),
        },
        { type: 'separator' },
        {
          label: 'Open File…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:action', 'openFile'),
        },
        {
          label: 'Open Folder…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow?.webContents.send('menu:action', 'openFolder'),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:action', 'save'),
        },
        {
          label: 'Save As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:action', 'saveAs'),
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('menu:action', 'closeTab'),
        },
        ...(!isMac ? [
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: 'Alt+F4',
            click: () => app.quit(),
          },
        ] : []),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('menu:action', 'find'),
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow?.webContents.send('menu:action', 'replace'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Command Palette…',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => mainWindow?.webContents.send('menu:action', 'commandPalette'),
        },
        {
          label: 'Color Theme…',
          click: () => mainWindow?.webContents.send('menu:action', 'themePicker'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.send('menu:action', 'toggleSidebar'),
        },
        {
          label: 'Toggle Integrated Terminal',
          accelerator: 'Ctrl+`',
          click: () => mainWindow?.webContents.send('menu:action', 'toggleTerminal'),
        },
        {
          label: 'Toggle Minimap',
          click: () => mainWindow?.webContents.send('menu:action', 'toggleMinimap'),
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.send('menu:action', 'zoomIn'),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('menu:action', 'zoomOut'),
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('menu:action', 'resetZoom'),
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Go',
      submenu: [
        {
          label: 'Go to File…',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('menu:action', 'gotoFile'),
        },
        {
          label: 'Go to Line…',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow?.webContents.send('menu:action', 'gotoLine'),
        },
        {
          label: 'Go to Symbol…',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.send('menu:action', 'gotoSymbol'),
        },
      ],
    },
    {
      label: 'Terminal',
      submenu: [
        {
          label: 'Toggle Terminal',
          accelerator: 'Ctrl+`',
          click: () => mainWindow?.webContents.send('menu:action', 'toggleTerminal'),
        },
        {
          label: 'New Terminal Session',
          accelerator: 'Ctrl+Shift+`',
          click: () => mainWindow?.webContents.send('menu:action', 'newTerminal'),
        },
        {
          label: 'Clear Terminal',
          click: () => mainWindow?.webContents.send('menu:action', 'clearTerminal'),
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [
          { role: 'close' },
        ]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Handbook',
          click: () => {
            if (isMac) {
              app.orderFrontStandardAboutPanel();
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'About Handbook',
                message: 'Handbook v2.5.0',
                detail: 'Pure speed. Zero friction.\nA lightning-fast, distraction-free code and text editor for macOS, Linux, and Windows.\n\n© 2026 Munish Soni. Open-source under MIT License.',
                buttons: ['OK'],
                icon: getAppIcon(),
              });
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Documentation & GitHub',
          click: () => shell.openExternal('https://github.com/imunishsoni/handbook'),
        },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/imunishsoni/handbook/issues'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ===== Window Control IPC Handlers =====

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// ===== Dialog IPC Handlers =====

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
  });
  return result.canceled ? null : result.filePaths;
});

ipcMain.handle('dialog:save', async (_event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options || {});
  return result.canceled ? null : result.filePath;
});

// ===== File System IPC Handlers =====

ipcMain.handle('fs:readDir', async (_event, dirPath) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const result = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env') continue;
      result.push({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      });
    }
    result.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    return result;
  } catch (err) {
    return [];
  }
});

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { content, error: null };
  } catch (err) {
    return { content: null, error: err.message };
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('fs:isDirectory', async (_event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
});

ipcMain.handle('fs:getAllFiles', async (_event, rootPath) => {
  const results = [];
  const maxResults = 8000;
  const ignoreDirs = new Set([
    'node_modules', '.git', '__pycache__', '.venv', 'venv',
    'dist', 'build', '.next', '.nuxt', 'coverage',
    '.idea', '.vscode', '.DS_Store', 'vendor', 'target',
  ]);

  async function walk(dir, depth) {
    if (depth > 20 || results.length >= maxResults) return;
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxResults) return;
        if (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!ignoreDirs.has(entry.name)) {
            await walk(fullPath, depth + 1);
          }
        } else {
          results.push({
            name: entry.name,
            path: fullPath,
            relativePath: path.relative(rootPath, fullPath),
          });
        }
      }
    } catch { /* skip unreadable dirs */ }
  }

  await walk(rootPath, 0);
  return results;
});

// ===== Integrated Terminal IPC (Cross-Platform) =====
const electronTerminalSessions = new Map();

ipcMain.handle('terminal:open', (_event, { id = 1, cols = 80, rows = 24, cwd = null } = {}) => {
  try {
    const { shell: shellPath, args: shellArgs } = getPlatformDefaultShell();
    const workingDir = cwd && fs.existsSync(cwd) ? cwd : os.homedir();

    const env = { ...process.env };
    env.TERM = 'xterm-256color';
    env.COLORTERM = 'truecolor';
    env.TERM_PROGRAM = 'Handbook';

    if (process.platform === 'darwin') {
      env.PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`;
    } else if (process.platform === 'linux') {
      env.PATH = `/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`;
    }

    const spawnOptions = {
      cwd: workingDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    };

    if (process.platform === 'win32') {
      spawnOptions.windowsHide = true;
    }

    const child = spawn(shellPath, shellArgs, spawnOptions);

    child.stdout.on('data', (chunk) => {
      mainWindow?.webContents.send('terminal:data', id, chunk.toString('base64'));
    });

    child.stderr.on('data', (chunk) => {
      mainWindow?.webContents.send('terminal:data', id, chunk.toString('base64'));
    });

    child.on('close', (code) => {
      mainWindow?.webContents.send('terminal:exit', id, code ?? 0);
      electronTerminalSessions.delete(id);
    });

    child.on('error', (err) => {
      console.error('Terminal process error:', err);
      mainWindow?.webContents.send('terminal:data', id, Buffer.from(`\r\nError launching shell: ${err.message}\r\n`).toString('base64'));
    });

    electronTerminalSessions.set(id, child);
    return { success: true, id };
  } catch (err) {
    console.error('Failed to spawn terminal:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('terminal:write', (_event, { id = 1, data = '' }) => {
  const child = electronTerminalSessions.get(id);
  if (child && child.stdin && !child.stdin.destroyed) {
    child.stdin.write(data);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('terminal:resize', (_event) => {
  return { success: true };
});

ipcMain.handle('terminal:close', (_event, { id = 1 }) => {
  const child = electronTerminalSessions.get(id);
  if (child) {
    try {
      child.kill();
    } catch (_) {}
    electronTerminalSessions.delete(id);
    return { success: true };
  }
  return { success: false };
});

// ===== App Lifecycle =====

app.whenReady().then(() => {
  const iconPath = getAppIcon();
  if (process.platform === 'darwin' && app.dock && iconPath) {
    try {
      app.dock.setIcon(iconPath);
    } catch (_) {}
  }
  if (app.setAboutPanelOptions) {
    app.setAboutPanelOptions({
      applicationName: 'Handbook',
      applicationVersion: '2.5.0',
      version: '2.5.0',
      copyright: '© 2026 Munish Soni. Open-source under MIT License.',
      iconPath,
    });
  }
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
