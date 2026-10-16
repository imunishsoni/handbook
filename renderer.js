// ============================================================
//  Sublime Text Clone — Renderer
// ============================================================

// ===== State =====
let editor = null;
let monacoApi = null;
const openFiles = new Map();      // path -> { model, viewState, modified, savedContent, name }
let activeFilePath = null;
let rootFolderPath = null;
let allProjectFiles = [];
let sidebarVisible = true;
let minimapEnabled = true;
let gotoMode = null;               // 'file' | 'command' | 'line'
let gotoSelectedIndex = 0;
let fontSize = 14;
let untitledCounter = 0;

// ===== DOM refs =====
const $ = (s) => document.querySelector(s);
const titlebarTitle     = $('#titlebar-title');
const titlebarDoc       = $('#titlebar-doc');
const sidebar           = $('#sidebar');
const sidebarTitleEl    = $('#sidebar-title');
const fileTreeEl        = $('#file-tree');
const tabsEl            = $('#tabs');
const monacoEditorEl    = $('#monaco-editor');
const welcomeScreen     = $('#welcome-screen');
const statusPosition    = $('#status-position');
const statusIndentation = $('#status-indentation');
const statusEncoding    = $('#status-encoding');
const statusLanguage    = $('#status-language');
const statusMessage     = $('#status-message');
const gotoOverlay       = $('#goto-overlay');
const gotoInput         = $('#goto-input');
const gotoResults       = $('#goto-results');
const resizeHandle      = $('#sidebar-resize-handle');

// ============================================================
//  Monaco Initialization
// ============================================================

function initMonaco() {
  return new Promise((resolve) => {
    require.config({
      paths: { vs: './node_modules/monaco-editor/min/vs' },
    });

    require(['vs/editor/editor.main'], function () {
      monacoApi = monaco; // global set by Monaco

      // ---- Aura Midnight Theme ----
      monacoApi.editor.defineTheme('aura-midnight', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment',            foreground: '64748b', fontStyle: 'italic' },
          { token: 'keyword',            foreground: 'c084fc', fontStyle: 'bold' },
          { token: 'string',             foreground: '34d399' },
          { token: 'number',             foreground: 'fbbf24' },
          { token: 'type',               foreground: '818cf8', fontStyle: 'italic' },
          { token: 'class',              foreground: '67e8f9' },
          { token: 'function',           foreground: '38bdf8' },
          { token: 'variable',           foreground: 'f1f5f9' },
          { token: 'constant',           foreground: 'f43f5e' },
          { token: 'operator',           foreground: '38bdf8' },
          { token: 'tag',                foreground: 'c084fc' },
          { token: 'attribute.name',     foreground: '67e8f9' },
          { token: 'attribute.value',    foreground: '34d399' },
          { token: 'delimiter',          foreground: '94a3b8' },
          { token: 'metatag',            foreground: 'a855f7' },
          { token: 'regexp',             foreground: 'f43f5e' },
        ],
        colors: {
          'editor.background':                    '#0d1117',
          'editor.foreground':                    '#f1f5f9',
          'editorCursor.foreground':              '#38bdf8',
          'editor.lineHighlightBackground':       '#151b2a',
          'editor.selectionBackground':           '#7c3aed45',
          'editor.inactiveSelectionBackground':   '#7c3aed20',
          'editorLineNumber.foreground':           '#334155',
          'editorLineNumber.activeForeground':     '#94a3b8',
          'editorIndentGuide.background':          '#1e293b',
          'editorIndentGuide.activeBackground':    '#7c3aed',
          'editorWhitespace.foreground':           '#1e293b',
          'editorWidget.background':               '#111624',
          'editorWidget.border':                   '#1e293b',
          'input.background':                      '#151b2a',
          'input.foreground':                      '#f1f5f9',
          'input.border':                          '#334155',
          'focusBorder':                           '#8b5cf6',
          'scrollbar.shadow':                      '#00000000',
          'scrollbarSlider.background':            '#ffffff12',
          'scrollbarSlider.hoverBackground':       '#ffffff22',
          'scrollbarSlider.activeBackground':      '#ffffff30',
          'minimap.background':                    '#0d1117',
          'minimapSlider.background':              '#ffffff10',
          'minimapSlider.hoverBackground':         '#ffffff20',
          'minimapSlider.activeBackground':        '#ffffff28',
          'editorOverviewRuler.border':            '#0d1117',
        },
      });

      // ---- Create editor ----
      editor = monacoApi.editor.create(monacoEditorEl, {
        value: '',
        language: 'plaintext',
        theme: 'aura-midnight',
        fontSize,
        fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
        fontLigatures: false,
        lineNumbers: 'on',
        minimap: { enabled: minimapEnabled, renderCharacters: false, maxColumn: 120 },
        scrollBeyondLastLine: true,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderLineHighlight: 'line',
        renderWhitespace: 'selection',
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'off',
        automaticLayout: true,
        padding: { top: 8 },
        bracketPairColorization: { enabled: true },
        guides: { indentation: true, bracketPairs: true },
        matchBrackets: 'always',
        occurrencesHighlight: 'singleFile',
        selectionHighlight: true,
        roundedSelection: false,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        overviewRulerLanes: 0,
        glyphMargin: false,
        folding: true,
        foldingHighlight: true,
        contextmenu: true,
        suggest: { preview: true, showIcons: true },
        quickSuggestions: true,
        parameterHints: { enabled: true },
        find: {
          addExtraSpaceOnTop: false,
          autoFindInSelection: 'multiline',
          seedSearchStringFromSelection: 'selection',
        },
      });

      editor.onDidChangeModelContent(() => {
        if (activeFilePath && openFiles.has(activeFilePath)) {
          const f = openFiles.get(activeFilePath);
          const modified = editor.getValue() !== f.savedContent;
          if (f.modified !== modified) {
            f.modified = modified;
            renderTabs();
            updateTitle();
          }
        }
      });

      editor.onDidChangeCursorPosition(() => updateStatusBar());
      editor.onDidChangeModel(() => updateStatusBar());

      // Keybindings inside Monaco
      editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyP, () => {
        showGotoPanel('file');
      });
      editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyMod.Shift | monacoApi.KeyCode.KeyP, () => {
        showGotoPanel('command');
      });
      editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyG, () => {
        showGotoPanel('line');
      });

      resolve();
    });
  });
}

// ============================================================
//  File Tree
// ============================================================

async function openFolder(folderPath) {
  if (!folderPath) {
    folderPath = await window.api.openFolderDialog();
    if (!folderPath) return;
  }
  rootFolderPath = folderPath;
  sidebarTitleEl.textContent = window.nodePath.basename(folderPath).toUpperCase();
  updateTitle();
  await buildFileTree(folderPath, fileTreeEl, 0);
  allProjectFiles = await window.api.getAllFiles(folderPath);
  if (!sidebarVisible) toggleSidebar();
  flash('Opened folder: ' + window.nodePath.basename(folderPath));
}

async function buildFileTree(dirPath, container, depth) {
  container.innerHTML = '';
  const entries = await window.api.readDirectory(dirPath);

  for (const entry of entries) {
    if (entry.isDirectory) {
      // Folder
      const wrapper = document.createElement('div');
      const header = document.createElement('div');
      header.className = 'tree-item';
      header.style.paddingLeft = `${12 + depth * 18}px`;
      header.innerHTML =
        `<span class="chevron">▶</span><span class="item-name">${esc(entry.name)}</span>`;

      const children = document.createElement('div');
      children.className = 'tree-children';
      let loaded = false;

      header.addEventListener('click', async () => {
        const expanding = !header.classList.contains('expanded');
        header.classList.toggle('expanded', expanding);
        children.classList.toggle('expanded', expanding);
        header.querySelector('.chevron').textContent = expanding ? '▼' : '▶';
        if (expanding && !loaded) {
          loaded = true;
          await buildFileTree(entry.path, children, depth + 1);
        }
      });

      wrapper.appendChild(header);
      wrapper.appendChild(children);
      container.appendChild(wrapper);
    } else {
      // File
      const item = document.createElement('div');
      item.className = 'tree-item';
      item.style.paddingLeft = `${12 + depth * 18 + 16}px`;
      item.dataset.path = entry.path;
      item.innerHTML = `<span class="item-name">${esc(entry.name)}</span>`;
      item.addEventListener('click', () => openFile(entry.path));
      container.appendChild(item);
    }
  }
}

// ============================================================
//  File Operations
// ============================================================

async function openFile(filePath) {
  if (openFiles.has(filePath)) { switchToFile(filePath); return; }

  const result = await window.api.readFile(filePath);
  if (result.error) { flash('Error: ' + result.error); return; }

  const ext = window.nodePath.extname(filePath);
  const lang = extToLang(ext);
  const uri = monacoApi.Uri.file(filePath);

  let model = monacoApi.editor.getModel(uri);
  if (!model) model = monacoApi.editor.createModel(result.content, lang, uri);

  openFiles.set(filePath, {
    model,
    viewState: null,
    modified: false,
    savedContent: result.content,
    name: window.nodePath.basename(filePath),
  });

  switchToFile(filePath);
  renderTabs();
}

function switchToFile(filePath) {
  // Save outgoing state
  if (activeFilePath && openFiles.has(activeFilePath)) {
    openFiles.get(activeFilePath).viewState = editor.saveViewState();
  }

  activeFilePath = filePath;
  const f = openFiles.get(filePath);

  welcomeScreen.classList.add('hidden');
  monacoEditorEl.classList.add('visible');

  editor.setModel(f.model);
  if (f.viewState) editor.restoreViewState(f.viewState);
  editor.focus();

  renderTabs();
  updateStatusBar();
  updateTitle();
  highlightTreeItem();
}

function closeFile(filePath) {
  if (!filePath) return;
  const f = openFiles.get(filePath);
  if (!f) return;

  f.model.dispose();
  openFiles.delete(filePath);

  if (filePath === activeFilePath) {
    const keys = Array.from(openFiles.keys());
    if (keys.length) {
      switchToFile(keys[keys.length - 1]);
    } else {
      activeFilePath = null;
      editor.setModel(null);
      monacoEditorEl.classList.remove('visible');
      welcomeScreen.classList.remove('hidden');
      updateTitle();
    }
  }
  renderTabs();
  updateStatusBar();
}

async function saveFile(filePath) {
  filePath = filePath || activeFilePath;
  if (!filePath) return;
  const f = openFiles.get(filePath);
  if (!f) return;

  if (filePath.startsWith('untitled:')) {
    const savePath = await window.api.showSaveDialog({ defaultPath: f.name });
    if (!savePath) return;
    const content = f.model.getValue();
    const res = await window.api.writeFile(savePath, content);
    if (res.error) { flash('Save error: ' + res.error); return; }

    f.model.dispose();
    openFiles.delete(filePath);

    const ext = window.nodePath.extname(savePath);
    const lang = extToLang(ext);
    const uri = monacoApi.Uri.file(savePath);
    const model = monacoApi.editor.createModel(content, lang, uri);

    openFiles.set(savePath, {
      model, viewState: null, modified: false, savedContent: content,
      name: window.nodePath.basename(savePath),
    });
    if (activeFilePath === filePath) { activeFilePath = savePath; editor.setModel(model); }
    renderTabs(); updateStatusBar(); updateTitle();
    flash('Saved: ' + window.nodePath.basename(savePath));
    return;
  }

  const content = f.model.getValue();
  const res = await window.api.writeFile(filePath, content);
  if (res.error) { flash('Save error: ' + res.error); return; }
  f.savedContent = content;
  f.modified = false;
  renderTabs();
  updateTitle();
  flash('Saved: ' + f.name);
}

function newFile() {
  untitledCounter++;
  const fakePath = `untitled:${untitledCounter}`;
  const model = monacoApi.editor.createModel('', 'plaintext');
  openFiles.set(fakePath, {
    model, viewState: null, modified: false, savedContent: '',
    name: `untitled-${untitledCounter}`,
  });
  switchToFile(fakePath);
  renderTabs();
}

async function openFileDialog() {
  const paths = await window.api.openFileDialog();
  if (paths && paths.length) {
    for (const p of paths) await openFile(p);
  }
}

// ============================================================
//  Tabs
// ============================================================

function renderTabs() {
  tabsEl.innerHTML = '';
  for (const [fp, f] of openFiles) {
    const tab = document.createElement('div');
    tab.className = 'tab' + (fp === activeFilePath ? ' active' : '') + (f.modified ? ' modified' : '');
    tab.innerHTML =
      `<span class="tab-name">${esc(f.name)}</span>` +
      `<span class="tab-dot"></span>` +
      `<span class="tab-close-btn">×</span>`;
    tab.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close-btn')) closeFile(fp);
      else switchToFile(fp);
    });
    tab.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); closeFile(fp); } });
    tabsEl.appendChild(tab);
  }
}

// ============================================================
//  Status Bar
// ============================================================

function updateStatusBar() {
  if (!editor || !editor.getModel()) {
    statusPosition.textContent = '';
    statusLanguage.textContent = '';
    statusIndentation.textContent = '';
    return;
  }
  const pos = editor.getPosition();
  const sels = editor.getSelections();
  statusPosition.textContent = sels && sels.length > 1
    ? `${sels.length} selections`
    : pos ? `Ln ${pos.lineNumber}, Col ${pos.column}` : '';

  const model = editor.getModel();
  statusLanguage.textContent = langDisplayName(model.getLanguageId());
  const opts = model.getOptions();
  statusIndentation.textContent = opts.insertSpaces ? `Spaces: ${opts.tabSize}` : `Tab Size: ${opts.tabSize}`;
  statusEncoding.textContent = 'UTF-8';
}

function updateTitle() {
  const parts = [];
  if (activeFilePath) {
    const f = openFiles.get(activeFilePath);
    if (f?.modified) parts.push('•');
    parts.push(f?.name || '');
  }
  if (rootFolderPath) parts.push(window.nodePath.basename(rootFolderPath));

  if (titlebarDoc) {
    titlebarDoc.textContent = parts.length ? '— ' + parts.join(' / ') : '';
  }
  document.title = parts.length ? parts.join(' ') + ' — Handbook' : 'Handbook';
}

function highlightTreeItem() {
  fileTreeEl.querySelectorAll('.tree-item.active').forEach((el) => el.classList.remove('active'));
  if (!activeFilePath) return;
  const el = fileTreeEl.querySelector(`.tree-item[data-path="${CSS.escape(activeFilePath)}"]`);
  if (el) el.classList.add('active');
}

function flash(msg) {
  statusMessage.textContent = msg;
  clearTimeout(flash._t);
  flash._t = setTimeout(() => { statusMessage.textContent = ''; }, 4000);
}

// ============================================================
//  Sidebar & Resize
// ============================================================

function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  sidebar.classList.toggle('hidden', !sidebarVisible);
  resizeHandle.classList.toggle('sidebar-hidden', !sidebarVisible);
}

function initSidebarResize() {
  let dragging = false;
  resizeHandle.addEventListener('mousedown', (e) => {
    dragging = true;
    resizeHandle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const w = Math.max(140, Math.min(500, e.clientX));
    sidebar.style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; resizeHandle.classList.remove('active'); document.body.style.cursor = ''; }
  });
}

// ============================================================
//  Minimap
// ============================================================

function toggleMinimap() {
  minimapEnabled = !minimapEnabled;
  editor.updateOptions({ minimap: { enabled: minimapEnabled } });
}

// ============================================================
//  Go-To Panel (⌘P / ⌘⇧P / ⌘G)
// ============================================================

function showGotoPanel(mode) {
  gotoMode = mode;
  gotoSelectedIndex = 0;
  gotoOverlay.classList.remove('hidden');
  gotoInput.value = mode === 'command' ? '>' : mode === 'line' ? ':' : '';
  gotoInput.placeholder = mode === 'command' ? 'Type a command…'
                        : mode === 'line' ? 'Go to line…'
                        : 'Go to File…';
  gotoInput.focus();
  populateGotoResults();
}

function hideGotoPanel() {
  gotoOverlay.classList.add('hidden');
  gotoMode = null;
  gotoInput.value = '';
  gotoResults.innerHTML = '';
  if (editor) editor.focus();
}

function populateGotoResults() {
  const raw = gotoInput.value;
  gotoResults.innerHTML = '';
  gotoSelectedIndex = 0;

  if (raw.startsWith('>') || gotoMode === 'command') {
    // ---- Command Palette ----
    const q = (raw.startsWith('>') ? raw.slice(1) : raw).trim().toLowerCase();
    const cmds = getCommands();
    const list = q ? cmds.filter((c) => fuzzy(q, c.name.toLowerCase())) : cmds;
    list.forEach((cmd, i) => {
      const el = makeResultEl(cmd.name, cmd.shortcut || '', i);
      el.querySelector('.result-detail').classList.add('result-shortcut-text');
      el.addEventListener('click', () => { hideGotoPanel(); cmd.action(); });
      gotoResults.appendChild(el);
    });
  } else if (raw.startsWith(':') || gotoMode === 'line') {
    // ---- Go to Line ----
    const n = parseInt(raw.startsWith(':') ? raw.slice(1) : raw, 10);
    if (n > 0 && editor && editor.getModel()) {
      const max = editor.getModel().getLineCount();
      const target = Math.min(n, max);
      const el = makeResultEl(`Go to line ${target}`, `of ${max}`, 0);
      el.addEventListener('click', () => {
        hideGotoPanel();
        editor.revealLineInCenter(target);
        editor.setPosition({ lineNumber: target, column: 1 });
        editor.focus();
      });
      gotoResults.appendChild(el);
    }
  } else {
    // ---- Go to File ----
    const q = raw.trim().toLowerCase();
    let list;
    if (!rootFolderPath || !allProjectFiles.length) {
      list = Array.from(openFiles.entries()).map(([p, f]) => ({
        name: f.name, path: p, relativePath: p,
      }));
    } else {
      list = q
        ? allProjectFiles.filter((f) => fuzzy(q, f.name.toLowerCase()) || fuzzy(q, f.relativePath.toLowerCase()))
        : allProjectFiles.slice(0, 60);
    }
    if (q) {
      list.sort((a, b) => {
        const as = a.name.toLowerCase().startsWith(q);
        const bs = b.name.toLowerCase().startsWith(q);
        if (as !== bs) return as ? -1 : 1;
        return a.relativePath.length - b.relativePath.length;
      });
    }
    list.slice(0, 60).forEach((file, i) => {
      const el = makeResultEl(file.name, file.relativePath, i);
      el.addEventListener('click', () => { hideGotoPanel(); openFile(file.path); });
      gotoResults.appendChild(el);
    });
  }
  updateGotoSelection();
}

function makeResultEl(name, detail, idx) {
  const el = document.createElement('div');
  el.className = 'goto-result';
  el.dataset.index = idx;
  el.innerHTML =
    `<span class="result-name">${esc(name)}</span>` +
    `<span class="result-detail">${esc(detail)}</span>`;
  return el;
}

function updateGotoSelection() {
  const items = gotoResults.querySelectorAll('.goto-result');
  items.forEach((el, i) => el.classList.toggle('selected', i === gotoSelectedIndex));
  const sel = gotoResults.querySelector('.goto-result.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

function handleGotoKey(e) {
  const items = gotoResults.querySelectorAll('.goto-result');
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); gotoSelectedIndex = Math.min(gotoSelectedIndex + 1, items.length - 1); updateGotoSelection(); break;
    case 'ArrowUp':   e.preventDefault(); gotoSelectedIndex = Math.max(gotoSelectedIndex - 1, 0);               updateGotoSelection(); break;
    case 'Enter':     e.preventDefault(); items[gotoSelectedIndex]?.click(); break;
    case 'Escape':    e.preventDefault(); hideGotoPanel(); break;
  }
}

// ============================================================
//  Commands
// ============================================================

function getCommands() {
  return [
    { name: 'New File',                   shortcut: '⌘N',     action: () => newFile() },
    { name: 'Open File…',                 shortcut: '⌘O',     action: () => openFileDialog() },
    { name: 'Open Folder…',              shortcut: '',        action: () => openFolder() },
    { name: 'Save',                       shortcut: '⌘S',     action: () => saveFile() },
    { name: 'Close Tab',                  shortcut: '⌘W',     action: () => closeFile(activeFilePath) },
    { name: 'Toggle Sidebar',             shortcut: '⌘B',     action: () => toggleSidebar() },
    { name: 'Toggle Minimap',             shortcut: '',        action: () => toggleMinimap() },
    { name: 'Go to Line…',               shortcut: '⌘G',     action: () => showGotoPanel('line') },
    { name: 'Go to File…',               shortcut: '⌘P',     action: () => showGotoPanel('file') },
    { name: 'Find',                       shortcut: '⌘F',     action: () => editor?.getAction('actions.find')?.run() },
    { name: 'Find and Replace',           shortcut: '⌘H',     action: () => editor?.getAction('editor.action.startFindReplaceAction')?.run() },
    { name: 'Word Wrap: Toggle',          shortcut: '⌥Z',     action: () => {
      const cur = editor.getOption(monacoApi.editor.EditorOption.wordWrap);
      editor.updateOptions({ wordWrap: cur === 'off' ? 'on' : 'off' });
    }},
    { name: 'Zoom In',                    shortcut: '⌘+',     action: () => { fontSize += 2; editor.updateOptions({ fontSize }); }},
    { name: 'Zoom Out',                   shortcut: '⌘-',     action: () => { fontSize = Math.max(8, fontSize - 2); editor.updateOptions({ fontSize }); }},
    { name: 'Reset Zoom',                 shortcut: '⌘0',     action: () => { fontSize = 14; editor.updateOptions({ fontSize }); }},
    { name: 'Toggle Line Comment',        shortcut: '⌘/',     action: () => editor?.getAction('editor.action.commentLine')?.run() },
    { name: 'Toggle Block Comment',       shortcut: '⌘⇧/',   action: () => editor?.getAction('editor.action.blockComment')?.run() },
    { name: 'Duplicate Line',             shortcut: '⌘⇧D',   action: () => editor?.getAction('editor.action.copyLinesDownAction')?.run() },
    { name: 'Move Line Up',               shortcut: '⌥↑',     action: () => editor?.getAction('editor.action.moveLinesUpAction')?.run() },
    { name: 'Move Line Down',             shortcut: '⌥↓',     action: () => editor?.getAction('editor.action.moveLinesDownAction')?.run() },
    { name: 'Delete Line',                shortcut: '⌘⇧K',   action: () => editor?.getAction('editor.action.deleteLines')?.run() },
    { name: 'Select All Occurrences',     shortcut: '⌘⇧L',   action: () => editor?.getAction('editor.action.selectHighlights')?.run() },
    { name: 'Add Selection to Next Find', shortcut: '⌘D',     action: () => editor?.getAction('editor.action.addSelectionToNextFindMatch')?.run() },
    { name: 'Add Cursor Above',           shortcut: '⌘⌥↑',   action: () => editor?.getAction('editor.action.insertCursorAbove')?.run() },
    { name: 'Add Cursor Below',           shortcut: '⌘⌥↓',   action: () => editor?.getAction('editor.action.insertCursorBelow')?.run() },
    { name: 'Fold All',                   shortcut: '⌘K⌘0',  action: () => editor?.getAction('editor.foldAll')?.run() },
    { name: 'Unfold All',                 shortcut: '⌘K⌘J',  action: () => editor?.getAction('editor.unfoldAll')?.run() },
    { name: 'Format Document',            shortcut: '⌥⇧F',   action: () => editor?.getAction('editor.action.formatDocument')?.run() },
    { name: 'Sort Lines Ascending',       shortcut: '',        action: () => editor?.getAction('editor.action.sortLinesAscending')?.run() },
    { name: 'Sort Lines Descending',      shortcut: '',        action: () => editor?.getAction('editor.action.sortLinesDescending')?.run() },
    { name: 'Transform to Uppercase',     shortcut: '',        action: () => editor?.getAction('editor.action.transformToUppercase')?.run() },
    { name: 'Transform to Lowercase',     shortcut: '',        action: () => editor?.getAction('editor.action.transformToLowercase')?.run() },
    { name: 'Trim Trailing Whitespace',   shortcut: '',        action: () => editor?.getAction('editor.action.trimTrailingWhitespace')?.run() },
    { name: 'Indent Line',                shortcut: '⌘]',     action: () => editor?.getAction('editor.action.indentLines')?.run() },
    { name: 'Outdent Line',               shortcut: '⌘[',     action: () => editor?.getAction('editor.action.outdentLines')?.run() },
  ];
}

// ============================================================
//  Language helpers
// ============================================================

function extToLang(ext) {
  const m = {
    '.js':'javascript','.mjs':'javascript','.cjs':'javascript','.jsx':'javascript',
    '.ts':'typescript','.tsx':'typescript',
    '.html':'html','.htm':'html',
    '.css':'css','.scss':'scss','.less':'less',
    '.json':'json','.jsonc':'json',
    '.md':'markdown','.mdx':'markdown',
    '.py':'python','.pyw':'python',
    '.rb':'ruby',
    '.go':'go','.rs':'rust',
    '.java':'java',
    '.c':'c','.h':'c','.cpp':'cpp','.cc':'cpp','.cxx':'cpp','.hpp':'cpp',
    '.cs':'csharp',
    '.php':'php',
    '.swift':'swift','.kt':'kotlin','.scala':'scala',
    '.sql':'sql',
    '.sh':'shell','.bash':'shell','.zsh':'shell','.fish':'shell',
    '.yaml':'yaml','.yml':'yaml',
    '.xml':'xml','.svg':'xml','.plist':'xml',
    '.toml':'ini','.ini':'ini','.cfg':'ini','.conf':'ini',
    '.lua':'lua','.pl':'perl','.r':'r',
    '.m':'objective-c',
    '.bat':'bat','.cmd':'bat','.ps1':'powershell',
    '.dockerfile':'dockerfile',
    '.graphql':'graphql','.gql':'graphql',
    '.txt':'plaintext','.log':'plaintext','.csv':'plaintext',
  };
  return m[ext.toLowerCase()] || 'plaintext';
}

function langDisplayName(id) {
  const m = {
    javascript:'JavaScript',typescript:'TypeScript',html:'HTML',css:'CSS',json:'JSON',
    markdown:'Markdown',python:'Python',java:'Java',cpp:'C++',c:'C',csharp:'C#',
    go:'Go',rust:'Rust',ruby:'Ruby',php:'PHP',swift:'Swift',kotlin:'Kotlin',
    scala:'Scala',sql:'SQL',shell:'Shell Script',yaml:'YAML',xml:'XML',
    plaintext:'Plain Text',scss:'SCSS',less:'Less',lua:'Lua',perl:'Perl',r:'R',
    'objective-c':'Objective-C',bat:'Batch',powershell:'PowerShell',ini:'INI',
    graphql:'GraphQL',dockerfile:'Dockerfile',
  };
  return m[id] || id;
}

// ============================================================
//  Utilities
// ============================================================

function fuzzy(query, text) {
  if (text.includes(query)) return true;
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ============================================================
//  Event Wiring
// ============================================================

function initEvents() {
  // Goto panel
  gotoInput.addEventListener('input', populateGotoResults);
  gotoInput.addEventListener('keydown', handleGotoKey);
  gotoOverlay.addEventListener('click', (e) => { if (e.target === gotoOverlay) hideGotoPanel(); });

  // Welcome screen shortcuts
  document.querySelectorAll('.shortcut[data-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const a = el.dataset.action;
      if (a === 'openFile')        openFileDialog();
      else if (a === 'openFolder') openFolder();
      else if (a === 'newFile')    newFile();
      else if (a === 'gotoFile')   showGotoPanel('file');
      else if (a === 'commandPalette') showGotoPanel('command');
      else if (a === 'gotoLine')   showGotoPanel('line');
    });
  });

  // Menu actions from main process
  window.api.onMenuAction((action) => {
    const handlers = {
      openFile:        () => openFileDialog(),
      openFolder:      () => openFolder(),
      save:            () => saveFile(),
      saveAs:          () => saveFile(),  // simplified
      newFile:         () => newFile(),
      closeTab:        () => closeFile(activeFilePath),
      find:            () => editor?.getAction('actions.find')?.run(),
      replace:         () => editor?.getAction('editor.action.startFindReplaceAction')?.run(),
      commandPalette:  () => showGotoPanel('command'),
      gotoFile:        () => showGotoPanel('file'),
      gotoLine:        () => showGotoPanel('line'),
      toggleSidebar:   () => toggleSidebar(),
      toggleMinimap:   () => toggleMinimap(),
      zoomIn:          () => { fontSize += 2; editor?.updateOptions({ fontSize }); },
      zoomOut:         () => { fontSize = Math.max(8, fontSize - 2); editor?.updateOptions({ fontSize }); },
      resetZoom:       () => { fontSize = 14; editor?.updateOptions({ fontSize }); },
    };
    handlers[action]?.();
  });

  // Global keyboard shortcuts (when Monaco doesn't have focus)
  document.addEventListener('keydown', (e) => {
    const cmd = e.metaKey || e.ctrlKey;
    if (cmd && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); showGotoPanel('command'); }
    else if (cmd && e.key.toLowerCase() === 'p' && !e.shiftKey) { e.preventDefault(); showGotoPanel('file'); }
    else if (cmd && e.key.toLowerCase() === 'g' && !e.shiftKey) { e.preventDefault(); showGotoPanel('line'); }
    else if (cmd && e.key.toLowerCase() === 's' && !e.shiftKey) { e.preventDefault(); saveFile(); }
    else if (cmd && e.key.toLowerCase() === 'n' && !e.shiftKey) { e.preventDefault(); newFile(); }
    else if (cmd && e.key.toLowerCase() === 'w' && !e.shiftKey) { e.preventDefault(); closeFile(activeFilePath); }
    else if (cmd && e.key.toLowerCase() === 'b' && !e.shiftKey) { e.preventDefault(); toggleSidebar(); }
  });

  // Drag & drop
  document.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    for (const file of e.dataTransfer.files) {
      const p = file.path;
      if (await window.api.isDirectory(p)) {
        await openFolder(p);
      } else {
        await openFile(p);
      }
    }
  });

  // CLI Open
  window.api.onCliOpen(async (targetPath) => {
    if (!targetPath) return;
    try {
      const isDir = await window.api.isDirectory(targetPath);
      if (isDir) {
        await openFolder(targetPath);
      } else {
        await openFile(targetPath);
      }
    } catch (err) {
      console.error('Error opening target:', err);
    }
  });

  // Sidebar resize
  initSidebarResize();
}

// ============================================================
//  Bootstrap
// ============================================================

async function initApp() {
  await initMonaco();
  initEvents();
  updateStatusBar();
  updateTitle();
  console.log('%c✦ Handbook ready', 'color: #38bdf8; font-weight: bold; font-size: 14px;');
}

initApp();
