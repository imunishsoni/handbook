// ============================================================
//  Handbook — Universal Native / WebKit Bridge (Cross-Platform)
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

    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    const plat = (typeof navigator !== 'undefined' && navigator.platform) || '';
    const isWindows = /Win/i.test(plat) || /Windows/i.test(ua);
    const isMac = !isWindows && (/Mac/i.test(plat) || /Macintosh/i.test(ua));
    const isLinux = !isWindows && !isMac;
    const currentPlatform = isWindows ? 'win32' : isMac ? 'darwin' : 'linux';
    const pathSep = isWindows ? '\\' : '/';

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

      // Window controls
      minimizeWindow: () => sendNative('minimizeWindow'),
      maximizeWindow: () => sendNative('maximizeWindow'),
      closeWindow: () => sendNative('closeWindow'),
      isMaximized: () => sendNative('isMaximized'),

      // Integrated Terminal API
      terminalOpen: (options) => sendNative('terminalOpen', options),
      terminalWrite: (id, data) => sendNative('terminalWrite', { id, data }),
      terminalResize: (id, cols, rows) => sendNative('terminalResize', { id, cols, rows }),
      terminalClose: (id) => sendNative('terminalClose', { id }),
      onTerminalData: (callback) => terminalDataListeners.push(callback),
      onTerminalExit: (callback) => terminalExitListeners.push(callback),

      platform: currentPlatform,
      isMac,
      isWindows,
      isLinux,
      homedir: isWindows ? 'C:\\' : '/',
    };

    window.nodePath = {
      join: (...args) => {
        const clean = args.filter(Boolean).map((a, i) => {
          if (i === 0) return a.replace(/[/\\]+$/, '');
          return a.replace(/^[/\\]+|[/\\]+$/g, '');
        });
        return clean.join(pathSep);
      },
      basename: (p, ext) => {
        if (!p) return '';
        const parts = p.replace(/[/\\]+$/, '').split(/[/\\]/);
        let base = parts[parts.length - 1] || '';
        if (ext && base.endsWith(ext)) base = base.slice(0, -ext.length);
        return base;
      },
      dirname: (p) => {
        if (!p) return '.';
        const normalized = p.replace(/[/\\]+$/, '');
        const lastFwd = normalized.lastIndexOf('/');
        const lastBack = normalized.lastIndexOf('\\');
        const idx = Math.max(lastFwd, lastBack);
        if (idx < 0) return '.';
        if (idx === 0) return normalized[0];
        // Handle Windows C:\
        if (idx === 2 && normalized[1] === ':') return normalized.slice(0, 3);
        return normalized.substring(0, idx);
      },
      extname: (p) => {
        const base = window.nodePath.basename(p);
        const idx = base.lastIndexOf('.');
        return idx > 0 ? base.substring(idx) : '';
      },
      sep: pathSep,
      relative: (from, to) => {
        if (!from || !to) return to || '';
        const normFrom = from.replace(/\\/g, '/').replace(/\/+$/, '');
        const normTo = to.replace(/\\/g, '/');
        if (normTo.startsWith(normFrom)) {
          return normTo.slice(normFrom.length).replace(/^\/+/, '').split('/').join(pathSep);
        }
        return to;
      },
      normalize: (p) => p ? p.replace(/[/\\]+/g, pathSep) : '',
      isAbsolute: (p) => Boolean(p && (p.startsWith('/') || p.startsWith('\\') || /^[a-zA-Z]:[/\\]/.test(p))),
    };

    console.log(`%c✦ Handbook Native Bridge Activated (${currentPlatform})`, 'color: #38bdf8; font-weight: bold;');
  }
})();
