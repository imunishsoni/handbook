const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

console.log('Preload initializing...');

contextBridge.exposeInMainWorld('api', {
  // Dialogs
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:save', options),

  // File system
  readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  isDirectory: (filePath) => ipcRenderer.invoke('fs:isDirectory', filePath),
  getAllFiles: (rootPath) => ipcRenderer.invoke('fs:getAllFiles', rootPath),

  // Events from main process
  onMenuAction: (callback) => {
    ipcRenderer.on('menu:action', (_event, action) => callback(action));
  },
  onCliOpen: (callback) => {
    ipcRenderer.on('cli:open', (_event, targetPath) => callback(targetPath));
  },

  // Integrated Terminal API
  terminalOpen: (options) => ipcRenderer.invoke('terminal:open', options),
  terminalWrite: (id, data) => ipcRenderer.invoke('terminal:write', { id, data }),
  terminalResize: (id, cols, rows) => ipcRenderer.invoke('terminal:resize', { id, cols, rows }),
  terminalClose: (id) => ipcRenderer.invoke('terminal:close', { id }),
  onTerminalData: (callback) => {
    ipcRenderer.on('terminal:data', (_event, id, base64) => callback(id, base64));
  },
  onTerminalExit: (callback) => {
    ipcRenderer.on('terminal:exit', (_event, id, code) => callback(id, code));
  },

  // Platform
  platform: process.platform,
  homedir: os.homedir(),
});

contextBridge.exposeInMainWorld('nodePath', {
  join: (...args) => path.join(...args),
  basename: (p, ext) => path.basename(p, ext),
  dirname: (p) => path.dirname(p),
  extname: (p) => path.extname(p),
  sep: path.sep,
  relative: (from, to) => path.relative(from, to),
});
