// ============================================================
//  Handbook — Universal Native / WebKit Bridge
// ============================================================

(function () {
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.handbook) {
    let reqId = 1;
    const pendingRequests = new Map();
    const menuListeners = [];
    const cliListeners = [];
    const terminalDataListeners = [];
    const terminalExitListeners = [];

    window.__handleNativeResponse = (id, result, error) => {
      const p = pendingRequests.get(id);
      if (p) {
        pendingRequests.delete(id);
        if (error) p.resolve({ content: null, error: String(error) });
        else p.resolve(result);
      }
    };

    window.__triggerMenuAction = (action) => {
      menuListeners.forEach((fn) => {
        try { fn(action); } catch (e) { console.error('Menu action error:', e); }
      });
    };

    window.__triggerCliOpen = (targetPath) => {
      cliListeners.forEach((fn) => {
        try { fn(targetPath); } catch (e) { console.error('CLI open error:', e); }
      });
    };

    window.__handleTerminalData = (id, base64) => {
      terminalDataListeners.forEach((fn) => {
        try { fn(id, base64); } catch (e) { console.error('Terminal data error:', e); }
      });
    };

    window.__handleTerminalExit = (id, code) => {
      terminalExitListeners.forEach((fn) => {
        try { fn(id, code); } catch (e) { console.error('Terminal exit error:', e); }
      });
    };

    function sendNative(action, payload = null) {
      return new Promise((resolve, reject) => {
        const id = reqId++;
        pendingRequests.set(id, { resolve, reject });
        window.webkit.messageHandlers.handbook.postMessage({ id, action, payload });
      });
    }

    window.api = {
      openFolderDialog: () => sendNative('openFolderDialog'),
      openFileDialog: () => sendNative('openFileDialog'),
      showSaveDialog: (options) => sendNative('showSaveDialog', options),
      readDirectory: (dirPath) => sendNative('readDir', { path: dirPath }),
      readFile: (filePath) => sendNative('readFile', { path: filePath }),
      writeFile: (filePath, content) => sendNative('writeFile', { path: filePath, content }),
      isDirectory: (filePath) => sendNative('isDirectory', { path: filePath }),
      getAllFiles: (rootPath) => sendNative('getAllFiles', { path: rootPath }),
      getHomeDir: () => sendNative('getHomeDir'),
      onMenuAction: (callback) => menuListeners.push(callback),
      onCliOpen: (callback) => cliListeners.push(callback),

      // Integrated Terminal API
      terminalOpen: (options) => sendNative('terminalOpen', options),
      terminalWrite: (id, data) => sendNative('terminalWrite', { id, data }),
      terminalResize: (id, cols, rows) => sendNative('terminalResize', { id, cols, rows }),
      terminalClose: (id) => sendNative('terminalClose', { id }),
      onTerminalData: (callback) => terminalDataListeners.push(callback),
      onTerminalExit: (callback) => terminalExitListeners.push(callback),

      platform: 'darwin',
      homedir: '/',
    };

    window.nodePath = {
      join: (...args) => args.filter(Boolean).join('/').replace(/\/+/g, '/'),
      basename: (p, ext) => {
        const parts = p.replace(/\/+$/, '').split('/');
        let base = parts[parts.length - 1] || '';
        if (ext && base.endsWith(ext)) base = base.slice(0, -ext.length);
        return base;
      },
      dirname: (p) => {
        const idx = p.lastIndexOf('/');
        return idx > 0 ? p.substring(0, idx) : (idx === 0 ? '/' : '.');
      },
      extname: (p) => {
        const base = window.nodePath.basename(p);
        const idx = base.lastIndexOf('.');
        return idx > 0 ? base.substring(idx) : '';
      },
      sep: '/',
      relative: (from, to) => {
        if (to.startsWith(from)) {
          return to.slice(from.length).replace(/^\/+/, '');
        }
        return to;
      },
    };

    console.log('%c✦ Handbook Native Apple Silicon Bridge Activated', 'color: #38bdf8; font-weight: bold;');
  }
})();
