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
let currentThemeId = localStorage.getItem('handbook_theme') || 'handbook-neutral';
let preThemeId = currentThemeId;
const recentlyClosedFiles = [];

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
const statusTheme       = $('#status-theme');
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
//  Theme System (Customizable & Neutral Default)
// ============================================================

const THEMES = {
  'handbook-neutral': {
    name: 'Handbook Neutral',
    category: 'Balanced Dark (Default)',
    isDark: true,
    ui: {
      '--bg-editor':        '#1c1c1f',
      '--bg-sidebar':       '#161618',
      '--bg-titlebar':      '#161618',
      '--bg-tabbar':        '#161618',
      '--bg-active-tab':    '#1c1c1f',
      '--bg-inactive-tab':  '#161618',
      '--bg-statusbar':     '#131315',
      '--bg-hover':         'rgba(255, 255, 255, 0.05)',
      '--bg-selected':      'rgba(255, 255, 255, 0.10)',
      '--bg-input':         '#242427',
      '--bg-overlay':       '#1f1f23',
      '--text-primary':     '#e4e4e7',
      '--text-secondary':   '#a1a1aa',
      '--text-muted':       '#71717a',
      '--text-dim':         '#52525b',
      '--border':           'rgba(255, 255, 255, 0.08)',
      '--border-subtle':    'rgba(255, 255, 255, 0.14)',
      '--border-focus':     '#a1a1aa',
      '--accent-purple':    '#a1a1aa',
      '--accent-cyan':      '#93c5fd',
      '--accent-mint':      '#86efac',
      '--accent-pink':      '#f472b6',
      '--accent-gradient':  'linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 100%)',
    },
    monaco: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',            foreground: '71717a', fontStyle: 'italic' },
        { token: 'keyword',            foreground: '93c5fd', fontStyle: 'bold' },
        { token: 'string',             foreground: '86efac' },
        { token: 'number',             foreground: 'fdba74' },
        { token: 'type',               foreground: 'c4b5fd', fontStyle: 'italic' },
        { token: 'class',              foreground: '67e8f9' },
        { token: 'function',           foreground: '7dd3fc' },
        { token: 'variable',           foreground: 'e4e4e7' },
        { token: 'constant',           foreground: 'fca5a5' },
        { token: 'operator',           foreground: 'cbd5e1' },
        { token: 'tag',                foreground: '93c5fd' },
        { token: 'attribute.name',     foreground: '67e8f9' },
        { token: 'attribute.value',    foreground: '86efac' },
        { token: 'delimiter',          foreground: 'a1a1aa' },
        { token: 'metatag',            foreground: 'c4b5fd' },
        { token: 'regexp',             foreground: 'fdba74' },
      ],
      colors: {
        'editor.background':                    '#1c1c1f',
        'editor.foreground':                    '#e4e4e7',
        'editorCursor.foreground':              '#e4e4e7',
        'editor.lineHighlightBackground':       '#242428',
        'editor.selectionBackground':           '#ffffff18',
        'editor.inactiveSelectionBackground':   '#ffffff0d',
        'editorLineNumber.foreground':           '#52525b',
        'editorLineNumber.activeForeground':     '#a1a1aa',
        'editorIndentGuide.background':          '#27272a',
        'editorIndentGuide.activeBackground':    '#52525b',
        'editorWhitespace.foreground':           '#27272a',
        'editorWidget.background':               '#1f1f23',
        'editorWidget.border':                   '#27272a',
        'input.background':                      '#242427',
        'input.foreground':                      '#e4e4e7',
        'input.border':                          '#3f3f46',
        'focusBorder':                           '#71717a',
        'scrollbar.shadow':                      '#00000000',
        'scrollbarSlider.background':            '#ffffff12',
        'scrollbarSlider.hoverBackground':       '#ffffff22',
        'scrollbarSlider.activeBackground':      '#ffffff30',
        'minimap.background':                    '#1c1c1f',
        'minimapSlider.background':              '#ffffff10',
        'minimapSlider.hoverBackground':         '#ffffff20',
        'minimapSlider.activeBackground':        '#ffffff28',
        'editorOverviewRuler.border':            '#1c1c1f',
      }
    }
  },
  'midnight-slate': {
    name: 'Midnight Slate',
    category: 'Vibrant Dark',
    isDark: true,
    ui: {
      '--bg-editor':        '#0d1117',
      '--bg-sidebar':       '#090d14',
      '--bg-titlebar':      '#090d14',
      '--bg-tabbar':        '#090d14',
      '--bg-active-tab':    '#0d1117',
      '--bg-inactive-tab':  '#090d14',
      '--bg-statusbar':     '#070a0f',
      '--bg-hover':         'rgba(255, 255, 255, 0.05)',
      '--bg-selected':      'rgba(124, 58, 237, 0.22)',
      '--bg-input':         '#151b2a',
      '--bg-overlay':       '#101522',
      '--text-primary':     '#f1f5f9',
      '--text-secondary':   '#94a3b8',
      '--text-muted':       '#64748b',
      '--text-dim':         '#475569',
      '--border':           'rgba(255, 255, 255, 0.07)',
      '--border-subtle':    'rgba(255, 255, 255, 0.12)',
      '--border-focus':     '#8b5cf6',
      '--accent-purple':    '#8b5cf6',
      '--accent-cyan':      '#38bdf8',
      '--accent-mint':      '#2dd4bf',
      '--accent-pink':      '#ec4899',
      '--accent-gradient':  'linear-gradient(135deg, #8b5cf6 0%, #38bdf8 100%)',
    },
    monaco: {
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
      }
    }
  },
  'obsidian-black': {
    name: 'Obsidian Black (OLED)',
    category: 'High Contrast Dark',
    isDark: true,
    ui: {
      '--bg-editor':        '#000000',
      '--bg-sidebar':       '#080808',
      '--bg-titlebar':      '#080808',
      '--bg-tabbar':        '#080808',
      '--bg-active-tab':    '#000000',
      '--bg-inactive-tab':  '#080808',
      '--bg-statusbar':     '#050505',
      '--bg-hover':         'rgba(255, 255, 255, 0.06)',
      '--bg-selected':      'rgba(255, 255, 255, 0.14)',
      '--bg-input':         '#121212',
      '--bg-overlay':       '#0f0f0f',
      '--text-primary':     '#ffffff',
      '--text-secondary':   '#a3a3a3',
      '--text-muted':       '#737373',
      '--text-dim':         '#525252',
      '--border':           'rgba(255, 255, 255, 0.1)',
      '--border-subtle':    'rgba(255, 255, 255, 0.18)',
      '--border-focus':     '#ffffff',
      '--accent-purple':    '#a855f7',
      '--accent-cyan':      '#06b6d4',
      '--accent-mint':      '#10b981',
      '--accent-pink':      '#f43f5e',
      '--accent-gradient':  'linear-gradient(135deg, #ffffff 0%, #a3a3a3 100%)',
    },
    monaco: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',            foreground: '737373', fontStyle: 'italic' },
        { token: 'keyword',            foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'string',             foreground: '4ade80' },
        { token: 'number',             foreground: 'facc15' },
        { token: 'type',               foreground: 'c084fc', fontStyle: 'italic' },
        { token: 'class',              foreground: '22d3ee' },
        { token: 'function',           foreground: '38bdf8' },
        { token: 'variable',           foreground: 'ffffff' },
        { token: 'constant',           foreground: 'fb7185' },
        { token: 'operator',           foreground: 'e5e5e5' },
        { token: 'tag',                foreground: '60a5fa' },
        { token: 'delimiter',          foreground: 'a3a3a3' },
      ],
      colors: {
        'editor.background':                    '#000000',
        'editor.foreground':                    '#ffffff',
        'editorCursor.foreground':              '#ffffff',
        'editor.lineHighlightBackground':       '#111111',
        'editor.selectionBackground':           '#ffffff22',
        'editor.inactiveSelectionBackground':   '#ffffff11',
        'editorLineNumber.foreground':           '#404040',
        'editorLineNumber.activeForeground':     '#a3a3a3',
        'editorIndentGuide.background':          '#1f1f1f',
        'editorIndentGuide.activeBackground':    '#525252',
        'editorWhitespace.foreground':           '#1f1f1f',
        'editorWidget.background':               '#0f0f0f',
        'editorWidget.border':                   '#262626',
        'input.background':                      '#121212',
        'input.foreground':                      '#ffffff',
        'input.border':                          '#404040',
        'focusBorder':                           '#737373',
        'scrollbar.shadow':                      '#00000000',
        'scrollbarSlider.background':            '#ffffff15',
        'scrollbarSlider.hoverBackground':       '#ffffff28',
        'scrollbarSlider.activeBackground':      '#ffffff35',
        'minimap.background':                    '#000000',
        'minimapSlider.background':              '#ffffff12',
        'minimapSlider.hoverBackground':         '#ffffff22',
        'minimapSlider.activeBackground':        '#ffffff30',
        'editorOverviewRuler.border':            '#000000',
      }
    }
  },
  'warm-coffee': {
    name: 'Warm Coffee',
    category: 'Sepia Dark',
    isDark: true,
    ui: {
      '--bg-editor':        '#221f1d',
      '--bg-sidebar':       '#1a1816',
      '--bg-titlebar':      '#1a1816',
      '--bg-tabbar':        '#1a1816',
      '--bg-active-tab':    '#221f1d',
      '--bg-inactive-tab':  '#1a1816',
      '--bg-statusbar':     '#151312',
      '--bg-hover':         'rgba(255, 255, 255, 0.05)',
      '--bg-selected':      'rgba(217, 119, 6, 0.22)',
      '--bg-input':         '#2b2724',
      '--bg-overlay':       '#262220',
      '--text-primary':     '#f5ebe0',
      '--text-secondary':   '#d5bdaf',
      '--text-muted':       '#8d7b68',
      '--text-dim':         '#605448',
      '--border':           'rgba(255, 255, 255, 0.07)',
      '--border-subtle':    'rgba(255, 255, 255, 0.13)',
      '--border-focus':     '#d97706',
      '--accent-purple':    '#d97706',
      '--accent-cyan':      '#f59e0b',
      '--accent-mint':      '#10b981',
      '--accent-pink':      '#f43f5e',
      '--accent-gradient':  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    monaco: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',            foreground: '8d7b68', fontStyle: 'italic' },
        { token: 'keyword',            foreground: 'f59e0b', fontStyle: 'bold' },
        { token: 'string',             foreground: '84cc16' },
        { token: 'number',             foreground: 'fb923c' },
        { token: 'type',               foreground: 'eab308', fontStyle: 'italic' },
        { token: 'class',              foreground: 'fde047' },
        { token: 'function',           foreground: '38bdf8' },
        { token: 'variable',           foreground: 'f5ebe0' },
        { token: 'constant',           foreground: 'f87171' },
        { token: 'operator',           foreground: 'e5e5e5' },
      ],
      colors: {
        'editor.background':                    '#221f1d',
        'editor.foreground':                    '#f5ebe0',
        'editorCursor.foreground':              '#f59e0b',
        'editor.lineHighlightBackground':       '#2a2624',
        'editor.selectionBackground':           '#d9770630',
        'editor.inactiveSelectionBackground':   '#d9770615',
        'editorLineNumber.foreground':           '#605448',
        'editorLineNumber.activeForeground':     '#d5bdaf',
        'editorIndentGuide.background':          '#2e2926',
        'editorIndentGuide.activeBackground':    '#d97706',
        'editorWhitespace.foreground':           '#2e2926',
        'editorWidget.background':               '#262220',
        'editorWidget.border':                   '#3a332f',
        'input.background':                      '#2b2724',
        'input.foreground':                      '#f5ebe0',
        'input.border':                          '#4a413c',
        'focusBorder':                           '#d97706',
        'scrollbar.shadow':                      '#00000000',
        'scrollbarSlider.background':            '#ffffff12',
        'scrollbarSlider.hoverBackground':       '#ffffff22',
        'scrollbarSlider.activeBackground':      '#ffffff30',
        'minimap.background':                    '#221f1d',
        'minimapSlider.background':              '#ffffff10',
        'minimapSlider.hoverBackground':         '#ffffff20',
        'minimapSlider.activeBackground':        '#ffffff28',
        'editorOverviewRuler.border':            '#221f1d',
      }
    }
  },
  'paper-light': {
    name: 'Paper Light',
    category: 'Neutral Light',
    isDark: false,
    ui: {
      '--bg-editor':        '#fafafa',
      '--bg-sidebar':       '#f4f4f5',
      '--bg-titlebar':      '#f4f4f5',
      '--bg-tabbar':        '#f4f4f5',
      '--bg-active-tab':    '#fafafa',
      '--bg-inactive-tab':  '#f4f4f5',
      '--bg-statusbar':     '#e4e4e7',
      '--bg-hover':         'rgba(0, 0, 0, 0.05)',
      '--bg-selected':      'rgba(37, 99, 235, 0.12)',
      '--bg-input':         '#ffffff',
      '--bg-overlay':       '#ffffff',
      '--text-primary':     '#18181b',
      '--text-secondary':   '#52525b',
      '--text-muted':       '#71717a',
      '--text-dim':         '#a1a1aa',
      '--border':           'rgba(0, 0, 0, 0.08)',
      '--border-subtle':    'rgba(0, 0, 0, 0.14)',
      '--border-focus':     '#2563eb',
      '--accent-purple':    '#2563eb',
      '--accent-cyan':      '#0284c7',
      '--accent-mint':      '#059669',
      '--accent-pink':      '#e11d48',
      '--accent-gradient':  'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
    },
    monaco: {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment',            foreground: '71717a', fontStyle: 'italic' },
        { token: 'keyword',            foreground: '2563eb', fontStyle: 'bold' },
        { token: 'string',             foreground: '16a34a' },
        { token: 'number',             foreground: 'd97706' },
        { token: 'type',               foreground: '7c3aed', fontStyle: 'italic' },
        { token: 'class',              foreground: '0284c7' },
        { token: 'function',           foreground: '0284c7' },
        { token: 'variable',           foreground: '18181b' },
        { token: 'constant',           foreground: 'dc2626' },
        { token: 'operator',           foreground: '52525b' },
        { token: 'tag',                foreground: '2563eb' },
        { token: 'delimiter',          foreground: '71717a' },
      ],
      colors: {
        'editor.background':                    '#fafafa',
        'editor.foreground':                    '#18181b',
        'editorCursor.foreground':              '#18181b',
        'editor.lineHighlightBackground':       '#f4f4f5',
        'editor.selectionBackground':           '#2563eb20',
        'editor.inactiveSelectionBackground':   '#2563eb10',
        'editorLineNumber.foreground':           '#a1a1aa',
        'editorLineNumber.activeForeground':     '#18181b',
        'editorIndentGuide.background':          '#e4e4e7',
        'editorIndentGuide.activeBackground':    '#a1a1aa',
        'editorWhitespace.foreground':           '#e4e4e7',
        'editorWidget.background':               '#ffffff',
        'editorWidget.border':                   '#e4e4e7',
        'input.background':                      '#ffffff',
        'input.foreground':                      '#18181b',
        'input.border':                          '#d4d4d8',
        'focusBorder':                           '#2563eb',
        'scrollbar.shadow':                      '#00000000',
        'scrollbarSlider.background':            '#00000015',
        'scrollbarSlider.hoverBackground':       '#00000025',
        'scrollbarSlider.activeBackground':      '#00000035',
        'minimap.background':                    '#fafafa',
        'minimapSlider.background':              '#00000010',
        'minimapSlider.hoverBackground':         '#00000020',
        'minimapSlider.activeBackground':        '#00000028',
        'editorOverviewRuler.border':            '#fafafa',
      }
    }
  }
};

function applyTheme(themeId, preview = false, notify = true) {
  const actualId = THEMES[themeId] ? themeId : 'handbook-neutral';
  const theme = THEMES[actualId];

  // 1. Update CSS Variables on document root
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.ui)) {
    root.style.setProperty(k, v);
  }

  // 2. Update Monaco Editor Theme
  if (monacoApi) {
    monacoApi.editor.setTheme(actualId);
  }

  // 3. Update Status Bar
  if (statusTheme) {
    const shortName = theme.name.split(' (')[0].replace('Handbook ', '');
    statusTheme.textContent = '🎨 ' + shortName;
  }

  // 4. Persistence
  if (!preview) {
    currentThemeId = actualId;
    localStorage.setItem('handbook_theme', actualId);
    if (notify) flash(`Theme: ${theme.name}`);
  }
}

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

      // Register all theme definitions
      for (const [id, def] of Object.entries(THEMES)) {
        monacoApi.editor.defineTheme(id, def.monaco);
      }

      // ---- Create editor ----
      editor = monacoApi.editor.create(monacoEditorEl, {
        value: '',
        language: 'plaintext',
        theme: currentThemeId,
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

      // Keybindings inside Monaco (Sublime Text 4 Keymap)
      registerSublimeKeybindings(editor);

      resolve();
    });
  });
}

// ============================================================
//  Sublime Text 4 Editing Actions & Keymap
// ============================================================

function expandSelectionToLine() {
  if (!editor) return;
  const model = editor.getModel();
  if (!model) return;
  const selections = editor.getSelections() || [editor.getSelection()];
  const lineCount = model.getLineCount();

  const newSelections = selections.map(sel => {
    let startLine = sel.startLineNumber;
    let endLine = sel.endLineNumber;

    const isWholeLine = sel.startColumn === 1 && (
      (sel.endColumn === 1 && endLine > startLine) ||
      (sel.endColumn === model.getLineMaxColumn(endLine))
    );

    if (isWholeLine && endLine < lineCount) {
      endLine++;
    }

    if (endLine < lineCount) {
      return new monacoApi.Selection(startLine, 1, endLine + 1, 1);
    } else {
      return new monacoApi.Selection(startLine, 1, lineCount, model.getLineMaxColumn(lineCount));
    }
  });

  editor.setSelections(newSelections);
}

function splitSelectionIntoLines() {
  if (!editor) return;
  const model = editor.getModel();
  const sel = editor.getSelection();
  if (!model || !sel) return;

  if (sel.startLineNumber !== sel.endLineNumber) {
    const newSelections = [];
    const endLine = sel.endColumn === 1 && sel.endLineNumber > sel.startLineNumber
      ? sel.endLineNumber - 1
      : sel.endLineNumber;

    for (let line = sel.startLineNumber; line <= endLine; line++) {
      const col = (line === sel.endLineNumber && sel.endColumn !== 1)
        ? sel.endColumn
        : model.getLineMaxColumn(line);
      newSelections.push(new monacoApi.Selection(line, col, line, col));
    }
    editor.setSelections(newSelections);
  } else {
    editor.getAction('editor.action.selectHighlights')?.run();
  }
}

function duplicateLineOrSelection() {
  if (!editor) return;
  const model = editor.getModel();
  const selections = editor.getSelections();
  if (!model || !selections) return;

  const hasSelection = selections.some(s => !s.isEmpty());
  if (hasSelection) {
    const edits = [];
    const nextSelections = [];
    selections.forEach(sel => {
      const text = model.getValueInRange(sel);
      edits.push({
        range: new monacoApi.Range(sel.endLineNumber, sel.endColumn, sel.endLineNumber, sel.endColumn),
        text: text,
      });
      const lines = text.split('\n');
      const addedLines = lines.length - 1;
      const endCol = addedLines === 0 ? sel.endColumn + text.length : lines[lines.length - 1].length + 1;
      nextSelections.push(new monacoApi.Selection(
        sel.endLineNumber, sel.endColumn,
        sel.endLineNumber + addedLines, endCol
      ));
    });
    editor.executeEdits('duplicate', edits);
    if (nextSelections.length) editor.setSelections(nextSelections);
  } else {
    editor.getAction('editor.action.copyLinesDownAction')?.run();
  }
}

function deleteToEndOfLine() {
  if (!editor) return;
  const model = editor.getModel();
  const selections = editor.getSelections();
  if (!model || !selections) return;

  const edits = selections.map(sel => {
    const line = sel.positionLineNumber;
    const col = sel.positionColumn;
    const maxCol = model.getLineMaxColumn(line);
    if (col >= maxCol) {
      if (line < model.getLineCount()) {
        return { range: new monacoApi.Range(line, col, line + 1, 1), text: '' };
      }
      return null;
    }
    return { range: new monacoApi.Range(line, col, line, maxCol), text: '' };
  }).filter(Boolean);

  if (edits.length) editor.executeEdits('deleteToEndOfLine', edits);
}

function deleteToStartOfLine() {
  if (!editor) return;
  const model = editor.getModel();
  const selections = editor.getSelections();
  if (!model || !selections) return;

  const edits = selections.map(sel => {
    const line = sel.positionLineNumber;
    const col = sel.positionColumn;
    if (col <= 1) {
      if (line > 1) {
        const prevMax = model.getLineMaxColumn(line - 1);
        return { range: new monacoApi.Range(line - 1, prevMax, line, 1), text: '' };
      }
      return null;
    }
    return { range: new monacoApi.Range(line, 1, line, col), text: '' };
  }).filter(Boolean);

  if (edits.length) editor.executeEdits('deleteToStartOfLine', edits);
}

function reopenClosedTab() {
  if (recentlyClosedFiles.length) {
    const lastPath = recentlyClosedFiles.pop();
    openFile(lastPath);
  } else {
    flash('No recently closed tabs');
  }
}

function nextTab() {
  const keys = Array.from(openFiles.keys());
  if (keys.length <= 1) return;
  const idx = keys.indexOf(activeFilePath);
  const nextIdx = (idx + 1) % keys.length;
  switchToFile(keys[nextIdx]);
}

function prevTab() {
  const keys = Array.from(openFiles.keys());
  if (keys.length <= 1) return;
  const idx = keys.indexOf(activeFilePath);
  const prevIdx = (idx - 1 + keys.length) % keys.length;
  switchToFile(keys[prevIdx]);
}

function switchToTabIndex(index) {
  const keys = Array.from(openFiles.keys());
  if (!keys.length) return;
  if (index === -1 || index >= keys.length) {
    switchToFile(keys[keys.length - 1]);
  } else if (index < keys.length) {
    switchToFile(keys[index]);
  }
}

function getDocumentSymbols() {
  if (!editor || !editor.getModel()) return [];
  const model = editor.getModel();
  const text = model.getValue();
  const lines = text.split('\n');
  const symbols = [];

  const patterns = [
    { regex: /^\s*(?:export\s+)?(?:async\s+)?function\s*([a-zA-Z0-9_$]+)/, kind: 'function' },
    { regex: /^\s*(?:export\s+)?(?:class|struct|enum|interface|type)\s+([a-zA-Z0-9_$]+)/, kind: 'class/type' },
    { regex: /^\s*(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/, kind: 'arrow fn' },
    { regex: /^\s*(?:def|async\s+def)\s+([a-zA-Z0-9_]+)/, kind: 'def' },
    { regex: /^\s*(?:func|fn)\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)/, kind: 'func' },
    { regex: /^(#{1,6}\s+.+)/, kind: 'heading' },
    { regex: /^\s*(?:async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/, kind: 'method' },
  ];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#!')) return;
    for (const pat of patterns) {
      const m = line.match(pat.regex);
      if (m && m[1]) {
        const name = m[1].trim();
        if (['if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(name) && pat.kind === 'method') {
          continue;
        }
        symbols.push({ name, line: i + 1, kind: pat.kind });
        break;
      }
    }
  });

  return symbols;
}

function registerSublimeKeybindings(ed) {
  const km = monacoApi.KeyMod;
  const kc = monacoApi.KeyCode;

  // --- 1. Line Editing ---
  // Duplicate Line / Selection: ⌘⇧D
  ed.addCommand(km.CtrlCmd | km.Shift | kc.KeyD, () => duplicateLineOrSelection());

  // Delete Line: ⌘⇧K and ⌃⇧K
  ed.addCommand(km.CtrlCmd | km.Shift | kc.KeyK, () => ed.getAction('editor.action.deleteLines')?.run());
  ed.addCommand(km.WinCtrl | km.Shift | kc.KeyK, () => ed.getAction('editor.action.deleteLines')?.run());

  // Move Line Up / Down: ⌘⌃↑ / ⌘⌃↓ (Sublime native) and ⌥↑ / ⌥↓
  ed.addCommand(km.CtrlCmd | km.WinCtrl | kc.UpArrow, () => ed.getAction('editor.action.moveLinesUpAction')?.run());
  ed.addCommand(km.CtrlCmd | km.WinCtrl | kc.DownArrow, () => ed.getAction('editor.action.moveLinesDownAction')?.run());
  ed.addCommand(km.Alt | kc.UpArrow, () => ed.getAction('editor.action.moveLinesUpAction')?.run());
  ed.addCommand(km.Alt | kc.DownArrow, () => ed.getAction('editor.action.moveLinesDownAction')?.run());

  // Join Lines: ⌘J
  ed.addCommand(km.CtrlCmd | kc.KeyJ, () => ed.getAction('editor.action.joinLines')?.run());

  // Insert Line Below: ⌘Enter
  ed.addCommand(km.CtrlCmd | kc.Enter, () => ed.getAction('editor.action.insertLineAfter')?.run());

  // Insert Line Above: ⌘⇧Enter
  ed.addCommand(km.CtrlCmd | km.Shift | kc.Enter, () => ed.getAction('editor.action.insertLineBefore')?.run());

  // Indent / Outdent: ⌘] / ⌘[
  ed.addCommand(km.CtrlCmd | kc.BracketRight, () => ed.getAction('editor.action.indentLines')?.run());
  ed.addCommand(km.CtrlCmd | kc.BracketLeft, () => ed.getAction('editor.action.outdentLines')?.run());

  // --- 2. Selection & Multi-Cursor ---
  // Quick Add Next (Select word / Next occurrence): ⌘D
  ed.addCommand(km.CtrlCmd | kc.KeyD, () => ed.getAction('editor.action.addSelectionToNextFindMatch')?.run());

  // Select All Occurrences: ⌃⌘G (Sublime Text Quick Find All)
  ed.addCommand(km.WinCtrl | km.CtrlCmd | kc.KeyG, () => ed.getAction('editor.action.selectHighlights')?.run());

  // Split Selection into Lines: ⌘⇧L
  ed.addCommand(km.CtrlCmd | km.Shift | kc.KeyL, () => splitSelectionIntoLines());

  // Expand Selection to Line: ⌘L
  ed.addCommand(km.CtrlCmd | kc.KeyL, () => expandSelectionToLine());

  // Bracket navigation: ⌃M (jump to matching bracket), ⌃⇧M (select to bracket)
  ed.addCommand(km.WinCtrl | kc.KeyM, () => ed.getAction('editor.action.jumpToBracket')?.run());
  ed.addCommand(km.WinCtrl | km.Shift | kc.KeyM, () => ed.getAction('editor.action.selectToBracket')?.run());

  // Column / Multi-cursor above & below: ⌃⇧↑/↓ and ⌘⌥↑/↓
  ed.addCommand(km.WinCtrl | km.Shift | kc.UpArrow, () => ed.getAction('editor.action.insertCursorAbove')?.run());
  ed.addCommand(km.WinCtrl | km.Shift | kc.DownArrow, () => ed.getAction('editor.action.insertCursorBelow')?.run());
  ed.addCommand(km.CtrlCmd | km.Alt | kc.UpArrow, () => ed.getAction('editor.action.insertCursorAbove')?.run());
  ed.addCommand(km.CtrlCmd | km.Alt | kc.DownArrow, () => ed.getAction('editor.action.insertCursorBelow')?.run());

  // Soft Undo / Redo (Undo / Redo Selection): ⌘U / ⌘⇧U
  ed.addCommand(km.CtrlCmd | kc.KeyU, () => ed.trigger('keyboard', 'cursorUndo'));
  ed.addCommand(km.CtrlCmd | km.Shift | kc.KeyU, () => ed.trigger('keyboard', 'cursorRedo'));

  // --- 3. Comments ---
  // Toggle Line Comment: ⌘/
  ed.addCommand(km.CtrlCmd | kc.Slash, () => ed.getAction('editor.action.commentLine')?.run());
  // Toggle Block Comment: ⌥⌘/ and ⌘⇧/
  ed.addCommand(km.CtrlCmd | km.Alt | kc.Slash, () => ed.getAction('editor.action.blockComment')?.run());
  ed.addCommand(km.CtrlCmd | km.Shift | kc.Slash, () => ed.getAction('editor.action.blockComment')?.run());

  // --- 4. Code Folding ---
  // Fold / Unfold current block: ⌥⌘[ / ⌥⌘]
  ed.addCommand(km.Alt | km.CtrlCmd | kc.BracketLeft, () => ed.getAction('editor.fold')?.run());
  ed.addCommand(km.Alt | km.CtrlCmd | kc.BracketRight, () => ed.getAction('editor.unfold')?.run());

  // Fold All: ⌘K ⌘1 and ⌘K ⌘0
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, km.CtrlCmd | kc.Digit1), () => ed.getAction('editor.foldAll')?.run());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, km.CtrlCmd | kc.Digit0), () => ed.getAction('editor.foldAll')?.run());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, kc.Digit1), () => ed.getAction('editor.foldAll')?.run());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, kc.Digit0), () => ed.getAction('editor.foldAll')?.run());

  // Unfold All: ⌘K ⌘J
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, km.CtrlCmd | kc.KeyJ), () => ed.getAction('editor.unfoldAll')?.run());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, kc.KeyJ), () => ed.getAction('editor.unfoldAll')?.run());

  // --- 5. Text Transformation & Case ---
  // Transform to Uppercase: ⌘K ⌘U
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, km.CtrlCmd | kc.KeyU), () => ed.getAction('editor.action.transformToUppercase')?.run());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, kc.KeyU), () => ed.getAction('editor.action.transformToUppercase')?.run());

  // Transform to Lowercase: ⌘K ⌘L
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, km.CtrlCmd | kc.KeyL), () => ed.getAction('editor.action.transformToLowercase')?.run());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, kc.KeyL), () => ed.getAction('editor.action.transformToLowercase')?.run());

  // Skip Next Occurrence: ⌘K ⌘D
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, km.CtrlCmd | kc.KeyD), () => ed.getAction('editor.action.moveSelectionToNextFindMatch')?.run());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, kc.KeyD), () => ed.getAction('editor.action.moveSelectionToNextFindMatch')?.run());

  // Delete to End of Line: ⌘K ⌘K and ⌃K
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, km.CtrlCmd | kc.KeyK), () => deleteToEndOfLine());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, kc.KeyK), () => deleteToEndOfLine());
  ed.addCommand(km.WinCtrl | kc.KeyK, () => deleteToEndOfLine());

  // Delete to Start of Line: ⌘K ⌘⌫
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, km.CtrlCmd | kc.Backspace), () => deleteToStartOfLine());
  ed.addCommand(km.chord(km.CtrlCmd | kc.KeyK, kc.Backspace), () => deleteToStartOfLine());

  // Transpose: ⌃T
  ed.addCommand(km.WinCtrl | kc.KeyT, () => ed.getAction('editor.action.transposeLetters')?.run());

  // Sort Lines: F5 (asc) and ⌃F5 / ⇧F5 (desc)
  ed.addCommand(kc.F5, () => ed.getAction('editor.action.sortLinesAscending')?.run());
  ed.addCommand(km.WinCtrl | kc.F5, () => ed.getAction('editor.action.sortLinesDescending')?.run());
  ed.addCommand(km.Shift | kc.F5, () => ed.getAction('editor.action.sortLinesDescending')?.run());

  // Format Document: ⌥⇧F
  ed.addCommand(km.Alt | km.Shift | kc.KeyF, () => ed.getAction('editor.action.formatDocument')?.run());

  // --- 6. Navigation & Goto ---
  ed.addCommand(km.CtrlCmd | kc.KeyP, () => showGotoPanel('file'));
  ed.addCommand(km.CtrlCmd | km.Shift | kc.KeyP, () => showGotoPanel('command'));
  ed.addCommand(km.CtrlCmd | kc.KeyG, () => showGotoPanel('line'));
  ed.addCommand(km.WinCtrl | kc.KeyG, () => showGotoPanel('line'));
  ed.addCommand(km.CtrlCmd | kc.KeyR, () => showGotoPanel('symbol'));
  ed.addCommand(km.CtrlCmd | kc.Semicolon, () => showGotoPanel('word'));

  // --- 7. Find & Replace ---
  ed.addCommand(km.CtrlCmd | kc.KeyF, () => ed.getAction('actions.find')?.run());
  ed.addCommand(km.CtrlCmd | km.Alt | kc.KeyF, () => ed.getAction('editor.action.startFindReplaceAction')?.run());
  ed.addCommand(km.CtrlCmd | kc.KeyH, () => ed.getAction('editor.action.startFindReplaceAction')?.run());

  // --- 8. Tabs & Files ---
  ed.addCommand(km.CtrlCmd | kc.KeyS, () => saveFile());
  ed.addCommand(km.CtrlCmd | kc.KeyN, () => newFile());
  ed.addCommand(km.CtrlCmd | kc.KeyW, () => closeFile(activeFilePath));
  ed.addCommand(km.CtrlCmd | km.Shift | kc.KeyT, () => reopenClosedTab());
  ed.addCommand(km.CtrlCmd | kc.KeyB, () => toggleSidebar());

  // Next / Prev Tab: ⌥⌘→ / ⌥⌘← and ⌃⇥ / ⌃⇧⇥
  ed.addCommand(km.CtrlCmd | km.Alt | kc.RightArrow, () => nextTab());
  ed.addCommand(km.CtrlCmd | km.Alt | kc.LeftArrow, () => prevTab());
  ed.addCommand(km.WinCtrl | kc.Tab, () => nextTab());
  ed.addCommand(km.WinCtrl | km.Shift | kc.Tab, () => prevTab());

  // Tab 1..9: ⌘1 .. ⌘9
  ed.addCommand(km.CtrlCmd | kc.Digit1, () => switchToTabIndex(0));
  ed.addCommand(km.CtrlCmd | kc.Digit2, () => switchToTabIndex(1));
  ed.addCommand(km.CtrlCmd | kc.Digit3, () => switchToTabIndex(2));
  ed.addCommand(km.CtrlCmd | kc.Digit4, () => switchToTabIndex(3));
  ed.addCommand(km.CtrlCmd | kc.Digit5, () => switchToTabIndex(4));
  ed.addCommand(km.CtrlCmd | kc.Digit6, () => switchToTabIndex(5));
  ed.addCommand(km.CtrlCmd | kc.Digit7, () => switchToTabIndex(6));
  ed.addCommand(km.CtrlCmd | kc.Digit8, () => switchToTabIndex(7));
  ed.addCommand(km.CtrlCmd | kc.Digit9, () => switchToTabIndex(-1));
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

  if (!filePath.startsWith('untitled:')) {
    recentlyClosedFiles.push(filePath);
    if (recentlyClosedFiles.length > 30) recentlyClosedFiles.shift();
  }

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
  if (mode === 'theme') {
    preThemeId = currentThemeId;
  }
  gotoSelectedIndex = 0;
  gotoOverlay.classList.remove('hidden');
  gotoInput.value = mode === 'command' ? '>'
                  : mode === 'line' ? ':'
                  : mode === 'symbol' ? '@'
                  : mode === 'word' ? '#'
                  : '';
  gotoInput.placeholder = mode === 'command' ? 'Type a command…'
                        : mode === 'line' ? 'Go to line…'
                        : mode === 'symbol' ? 'Go to symbol in file…'
                        : mode === 'word' ? 'Search in file…'
                        : mode === 'theme' ? 'Select color theme (↑/↓ to preview)…'
                        : 'Go to File…';
  gotoInput.focus();
  populateGotoResults();
}

function hideGotoPanel(cancelled = false) {
  if (gotoMode === 'theme' && cancelled) {
    applyTheme(preThemeId, false, false);
  }
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

  if (gotoMode === 'theme') {
    // ---- Color Theme Picker ----
    const q = raw.trim().toLowerCase();
    const themesList = Object.entries(THEMES).map(([id, t]) => ({ id, ...t }));
    const filtered = q ? themesList.filter((t) => fuzzy(q, t.name.toLowerCase()) || fuzzy(q, t.category.toLowerCase())) : themesList;
    filtered.forEach((t, i) => {
      const isCurrent = t.id === currentThemeId;
      const el = makeResultEl(t.name + (isCurrent ? '  ✓' : ''), t.category, i);
      el.dataset.themeId = t.id;
      el.addEventListener('mouseenter', () => {
        applyTheme(t.id, true);
      });
      el.addEventListener('click', () => {
        applyTheme(t.id, false);
        hideGotoPanel(false);
      });
      gotoResults.appendChild(el);
    });
  } else if (raw.startsWith('>') || gotoMode === 'command') {
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
  } else if (raw.startsWith('@') || gotoMode === 'symbol') {
    // ---- Go to Symbol in File (⌘R) ----
    const q = (raw.startsWith('@') ? raw.slice(1) : raw).trim().toLowerCase();
    const symbols = getDocumentSymbols();
    const list = q ? symbols.filter((s) => fuzzy(q, s.name.toLowerCase())) : symbols;
    list.slice(0, 100).forEach((sym, i) => {
      const el = makeResultEl(sym.name, `Ln ${sym.line} • ${sym.kind}`, i);
      el.addEventListener('click', () => {
        hideGotoPanel();
        editor.revealLineInCenter(sym.line);
        editor.setPosition({ lineNumber: sym.line, column: 1 });
        editor.focus();
      });
      gotoResults.appendChild(el);
    });
  } else if (raw.startsWith('#') || gotoMode === 'word') {
    // ---- Go to Word / Search in file (⌘;) ----
    const q = (raw.startsWith('#') ? raw.slice(1) : raw).trim();
    if (q && editor && editor.getModel()) {
      const matches = editor.getModel().findMatches(q, false, false, false, null, true, 60);
      matches.forEach((m, i) => {
        const lineContent = editor.getModel().getLineContent(m.range.startLineNumber).trim();
        const el = makeResultEl(lineContent, `Ln ${m.range.startLineNumber}`, i);
        el.addEventListener('click', () => {
          hideGotoPanel();
          editor.revealRangeInCenter(m.range);
          editor.setSelection(m.range);
          editor.focus();
        });
        gotoResults.appendChild(el);
      });
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
    case 'ArrowDown':
      e.preventDefault();
      gotoSelectedIndex = Math.min(gotoSelectedIndex + 1, items.length - 1);
      updateGotoSelection();
      if (gotoMode === 'theme') {
        const themeId = items[gotoSelectedIndex]?.dataset.themeId;
        if (themeId) applyTheme(themeId, true);
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      gotoSelectedIndex = Math.max(gotoSelectedIndex - 1, 0);
      updateGotoSelection();
      if (gotoMode === 'theme') {
        const themeId = items[gotoSelectedIndex]?.dataset.themeId;
        if (themeId) applyTheme(themeId, true);
      }
      break;
    case 'Enter':
      e.preventDefault();
      items[gotoSelectedIndex]?.click();
      break;
    case 'Escape':
      e.preventDefault();
      hideGotoPanel(true);
      break;
  }
}

// ============================================================
//  Commands
// ============================================================

function getCommands() {
  return [
    // File & Tab Navigation
    { name: 'File: New File',                         shortcut: '⌘N',      action: () => newFile() },
    { name: 'File: Open File…',                       shortcut: '⌘O',      action: () => openFileDialog() },
    { name: 'File: Open Workspace Folder…',           shortcut: '⌘⇧O',     action: () => openFolder() },
    { name: 'File: Save',                             shortcut: '⌘S',      action: () => saveFile() },
    { name: 'File: Close Tab',                        shortcut: '⌘W',      action: () => closeFile(activeFilePath) },
    { name: 'File: Reopen Closed Tab',                shortcut: '⌘⇧T',     action: () => reopenClosedTab() },
    { name: 'Tab: Next Tab',                          shortcut: '⌥⌘→',     action: () => nextTab() },
    { name: 'Tab: Previous Tab',                      shortcut: '⌥⌘←',     action: () => prevTab() },

    // Go To (Sublime Style)
    { name: 'Go to: File…',                           shortcut: '⌘P',      action: () => showGotoPanel('file') },
    { name: 'Go to: Symbol in File…',                 shortcut: '⌘R',      action: () => showGotoPanel('symbol') },
    { name: 'Go to: Line…',                           shortcut: '⌘G',      action: () => showGotoPanel('line') },
    { name: 'Go to: Word in File…',                   shortcut: '⌘;',      action: () => showGotoPanel('word') },
    { name: 'Go to: Matching Bracket',                shortcut: '⌃M',      action: () => editor?.getAction('editor.action.jumpToBracket')?.run() },

    // Selection & Multi-Cursor
    { name: 'Selection: Quick Add Next',              shortcut: '⌘D',      action: () => editor?.getAction('editor.action.addSelectionToNextFindMatch')?.run() },
    { name: 'Selection: Quick Skip Next',             shortcut: '⌘K ⌘D',   action: () => editor?.getAction('editor.action.moveSelectionToNextFindMatch')?.run() },
    { name: 'Selection: Select All Occurrences',      shortcut: '⌃⌘G',     action: () => editor?.getAction('editor.action.selectHighlights')?.run() },
    { name: 'Selection: Split into Lines',            shortcut: '⌘⇧L',     action: () => splitSelectionIntoLines() },
    { name: 'Selection: Expand to Line',              shortcut: '⌘L',      action: () => expandSelectionToLine() },
    { name: 'Selection: Select to Bracket',           shortcut: '⌃⇧M',     action: () => editor?.getAction('editor.action.selectToBracket')?.run() },
    { name: 'Selection: Add Cursor Above',            shortcut: '⌘⌥↑',    action: () => editor?.getAction('editor.action.insertCursorAbove')?.run() },
    { name: 'Selection: Add Cursor Below',            shortcut: '⌘⌥↓',    action: () => editor?.getAction('editor.action.insertCursorBelow')?.run() },
    { name: 'Selection: Soft Undo (Undo Cursor)',     shortcut: '⌘U',      action: () => editor?.trigger('keyboard', 'cursorUndo') },
    { name: 'Selection: Soft Redo (Redo Cursor)',     shortcut: '⌘⇧U',    action: () => editor?.trigger('keyboard', 'cursorRedo') },

    // Line Editing
    { name: 'Line: Duplicate Line / Selection',       shortcut: '⌘⇧D',    action: () => duplicateLineOrSelection() },
    { name: 'Line: Delete Line',                      shortcut: '⌘⇧K',    action: () => editor?.getAction('editor.action.deleteLines')?.run() },
    { name: 'Line: Move Line Up',                     shortcut: '⌘⌃↑',     action: () => editor?.getAction('editor.action.moveLinesUpAction')?.run() },
    { name: 'Line: Move Line Down',                   shortcut: '⌘⌃↓',     action: () => editor?.getAction('editor.action.moveLinesDownAction')?.run() },
    { name: 'Line: Join Lines',                       shortcut: '⌘J',      action: () => editor?.getAction('editor.action.joinLines')?.run() },
    { name: 'Line: Insert Line Below',                shortcut: '⌘↵',      action: () => editor?.getAction('editor.action.insertLineAfter')?.run() },
    { name: 'Line: Insert Line Above',                shortcut: '⌘⇧↵',    action: () => editor?.getAction('editor.action.insertLineBefore')?.run() },
    { name: 'Line: Indent Line',                      shortcut: '⌘]',      action: () => editor?.getAction('editor.action.indentLines')?.run() },
    { name: 'Line: Outdent Line',                     shortcut: '⌘[',      action: () => editor?.getAction('editor.action.outdentLines')?.run() },
    { name: 'Line: Delete to End of Line',            shortcut: '⌘K ⌘K',   action: () => deleteToEndOfLine() },
    { name: 'Line: Delete to Start of Line',          shortcut: '⌘K ⌘⌫',  action: () => deleteToStartOfLine() },

    // Code & Formatting
    { name: 'Code: Toggle Line Comment',              shortcut: '⌘/',      action: () => editor?.getAction('editor.action.commentLine')?.run() },
    { name: 'Code: Toggle Block Comment',             shortcut: '⌥⌘/',     action: () => editor?.getAction('editor.action.blockComment')?.run() },
    { name: 'Code: Fold Block',                       shortcut: '⌥⌘[',     action: () => editor?.getAction('editor.fold')?.run() },
    { name: 'Code: Unfold Block',                     shortcut: '⌥⌘]',     action: () => editor?.getAction('editor.unfold')?.run() },
    { name: 'Code: Fold All',                         shortcut: '⌘K ⌘1',   action: () => editor?.getAction('editor.foldAll')?.run() },
    { name: 'Code: Unfold All',                       shortcut: '⌘K ⌘J',   action: () => editor?.getAction('editor.unfoldAll')?.run() },
    { name: 'Code: Format Document',                  shortcut: '⌥⇧F',    action: () => editor?.getAction('editor.action.formatDocument')?.run() },
    { name: 'Code: Sort Lines Ascending',             shortcut: 'F5',      action: () => editor?.getAction('editor.action.sortLinesAscending')?.run() },
    { name: 'Code: Sort Lines Descending',            shortcut: '⌃F5',     action: () => editor?.getAction('editor.action.sortLinesDescending')?.run() },
    { name: 'Code: Transform to Uppercase',           shortcut: '⌘K ⌘U',   action: () => editor?.getAction('editor.action.transformToUppercase')?.run() },
    { name: 'Code: Transform to Lowercase',           shortcut: '⌘K ⌘L',   action: () => editor?.getAction('editor.action.transformToLowercase')?.run() },
    { name: 'Code: Transpose Characters',             shortcut: '⌃T',      action: () => editor?.getAction('editor.action.transposeLetters')?.run() },
    { name: 'Code: Trim Trailing Whitespace',         shortcut: '',        action: () => editor?.getAction('editor.action.trimTrailingWhitespace')?.run() },

    // Find & Replace
    { name: 'Find: Find…',                            shortcut: '⌘F',      action: () => editor?.getAction('actions.find')?.run() },
    { name: 'Find: Replace…',                         shortcut: '⌥⌘F',     action: () => editor?.getAction('editor.action.startFindReplaceAction')?.run() },

    // View & Preferences
    { name: 'View: Toggle Sidebar',                   shortcut: '⌘B',      action: () => toggleSidebar() },
    { name: 'View: Toggle Minimap',                   shortcut: '',        action: () => toggleMinimap() },
    { name: 'View: Word Wrap Toggle',                 shortcut: '⌥Z',      action: () => {
      const cur = editor.getOption(monacoApi.editor.EditorOption.wordWrap);
      editor.updateOptions({ wordWrap: cur === 'off' ? 'on' : 'off' });
    }},
    { name: 'View: Zoom In',                          shortcut: '⌘+',      action: () => { fontSize += 2; editor.updateOptions({ fontSize }); }},
    { name: 'View: Zoom Out',                         shortcut: '⌘-',      action: () => { fontSize = Math.max(8, fontSize - 2); editor.updateOptions({ fontSize }); }},
    { name: 'View: Reset Zoom',                       shortcut: '⌘0',      action: () => { fontSize = 14; editor.updateOptions({ fontSize }); }},
    { name: 'Preferences: Color Theme',               shortcut: '',        action: () => showGotoPanel('theme') },
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
  gotoOverlay.addEventListener('click', (e) => { if (e.target === gotoOverlay) hideGotoPanel(true); });

  // Status bar theme button
  statusTheme?.addEventListener('click', () => showGotoPanel('theme'));

  // Welcome screen shortcuts
  document.querySelectorAll('.shortcut[data-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const a = el.dataset.action;
      if (a === 'openFile')             openFileDialog();
      else if (a === 'openFolder')      openFolder();
      else if (a === 'newFile')         newFile();
      else if (a === 'gotoFile')        showGotoPanel('file');
      else if (a === 'commandPalette')  showGotoPanel('command');
      else if (a === 'gotoLine')        showGotoPanel('line');
      else if (a === 'gotoSymbol')      showGotoPanel('symbol');
      else if (a === 'themePicker')     showGotoPanel('theme');
    });
  });

  // Menu actions from main process
  window.api.onMenuAction((action) => {
    const handlers = {
      openFile:           () => openFileDialog(),
      openFolder:         () => openFolder(),
      reopenTab:          () => reopenClosedTab(),
      save:               () => saveFile(),
      saveAs:             () => saveFile(),
      newFile:            () => newFile(),
      closeTab:           () => closeFile(activeFilePath),
      find:               () => editor?.getAction('actions.find')?.run(),
      replace:            () => editor?.getAction('editor.action.startFindReplaceAction')?.run(),
      commandPalette:     () => showGotoPanel('command'),
      themePicker:        () => showGotoPanel('theme'),
      gotoFile:           () => showGotoPanel('file'),
      gotoLine:           () => showGotoPanel('line'),
      gotoSymbol:         () => showGotoPanel('symbol'),
      nextTab:            () => nextTab(),
      prevTab:            () => prevTab(),
      indent:             () => editor?.getAction('editor.action.indentLines')?.run(),
      outdent:            () => editor?.getAction('editor.action.outdentLines')?.run(),
      duplicateLine:      () => duplicateLineOrSelection(),
      deleteLine:         () => editor?.getAction('editor.action.deleteLines')?.run(),
      joinLines:          () => editor?.getAction('editor.action.joinLines')?.run(),
      toggleComment:      () => editor?.getAction('editor.action.commentLine')?.run(),
      toggleBlockComment: () => editor?.getAction('editor.action.blockComment')?.run(),
      splitLines:         () => splitSelectionIntoLines(),
      expandLine:         () => expandSelectionToLine(),
      addNextMatch:       () => editor?.getAction('editor.action.addSelectionToNextFindMatch')?.run(),
      selectAllMatches:   () => editor?.getAction('editor.action.selectHighlights')?.run(),
      toggleSidebar:      () => toggleSidebar(),
      toggleMinimap:      () => toggleMinimap(),
      zoomIn:             () => { fontSize += 2; editor?.updateOptions({ fontSize }); },
      zoomOut:            () => { fontSize = Math.max(8, fontSize - 2); editor?.updateOptions({ fontSize }); },
      resetZoom:          () => { fontSize = 14; editor?.updateOptions({ fontSize }); },
    };
    handlers[action]?.();
  });

  // Global keyboard shortcuts (when Monaco doesn't have focus or across application)
  document.addEventListener('keydown', (e) => {
    const cmd = e.metaKey || e.ctrlKey;
    const opt = e.altKey;
    const shift = e.shiftKey;
    const key = e.key.toLowerCase();

    // Prevent default browser shortcuts that interfere with editor actions
    if (cmd && key === 'r') {
      e.preventDefault();
      showGotoPanel('symbol');
      return;
    }
    if (cmd && key === 'd' && !shift && !opt) {
      // Avoid bookmarking in WebKit
      e.preventDefault();
      if (editor) editor.getAction('editor.action.addSelectionToNextFindMatch')?.run();
      return;
    }
    if (cmd && shift && key === 'd') {
      e.preventDefault();
      duplicateLineOrSelection();
      return;
    }
    if (cmd && key === 'j') {
      e.preventDefault();
      if (editor) editor.getAction('editor.action.joinLines')?.run();
      return;
    }
    if (cmd && key === 'l' && !shift) {
      e.preventDefault();
      expandSelectionToLine();
      return;
    }
    if (cmd && shift && key === 'l') {
      e.preventDefault();
      splitSelectionIntoLines();
      return;
    }
    if (cmd && (key === '[' || key === ']')) {
      e.preventDefault();
      if (editor) {
        if (key === '[') editor.getAction('editor.action.outdentLines')?.run();
        else editor.getAction('editor.action.indentLines')?.run();
      }
      return;
    }
    if (cmd && shift && key === 't') {
      e.preventDefault();
      reopenClosedTab();
      return;
    }
    if (cmd && opt && e.key === 'ArrowRight') {
      e.preventDefault();
      nextTab();
      return;
    }
    if (cmd && opt && e.key === 'ArrowLeft') {
      e.preventDefault();
      prevTab();
      return;
    }
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      if (shift) prevTab();
      else nextTab();
      return;
    }
    if (cmd && !shift && !opt && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const num = parseInt(e.key, 10);
      switchToTabIndex(num === 9 ? -1 : num - 1);
      return;
    }
    if (cmd && shift && key === 'p') { e.preventDefault(); showGotoPanel('command'); return; }
    if (cmd && !shift && key === 'p') { e.preventDefault(); showGotoPanel('file'); return; }
    if (cmd && !shift && key === 'g') { e.preventDefault(); showGotoPanel('line'); return; }
    if (cmd && !shift && key === 's') { e.preventDefault(); saveFile(); return; }
    if (cmd && !shift && key === 'n') { e.preventDefault(); newFile(); return; }
    if (cmd && !shift && key === 'w') { e.preventDefault(); closeFile(activeFilePath); return; }
    if (cmd && !shift && key === 'b') { e.preventDefault(); toggleSidebar(); return; }
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
  applyTheme(currentThemeId, false, false);
  await initMonaco();
  applyTheme(currentThemeId, false, false);
  initEvents();
  updateStatusBar();
  updateTitle();
  console.log('%c✦ Handbook ready', 'color: #38bdf8; font-weight: bold; font-size: 14px;');
}

initApp();
