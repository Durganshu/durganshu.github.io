/* ============================================
   Terminal-Themed Portfolio — terminal.js
   Interactive terminal, typing & scroll animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTerminalTyping();
  initClearTerminalButton();
  initScrollAnimations();
  initMobileNav();
  initEditorToggle();
  initVSCodeToggles();
  initVSCodeTabs();
});

// ─── Command Definitions ────────────────────────────
const COMMANDS = {
  help: () => [
    { type: 'output', text: 'Available commands:' },
    { type: 'output', text: '' },
    { type: 'highlight', label: '  whoami', value: '    — about me' },
    { type: 'highlight', label: '  skills', value: '    — technical skills' },
    { type: 'highlight', label: '  projects', value: '  — view my projects' },
    { type: 'highlight', label: '  blogs', value: '     — read my articles' },
    { type: 'highlight', label: '  about', value: '     — full background' },
    { type: 'highlight', label: '  contact', value: '   — get in touch' },
    { type: 'highlight', label: '  neofetch', value: '  — system info' },
    { type: 'highlight', label: '  clear', value: '     — clear terminal' },
    { type: 'highlight', label: '  history', value: '   — command history' },
    { type: 'output', text: '' },
    { type: 'muted', text: 'Tip: use ↑/↓ arrows to navigate command history' },
  ],

  whoami: () => {
    const activeShell = localStorage.getItem('vscode-active-shell') || 'bash';
    const intro = [
      { type: 'output', text: "Hi! I'm Durganshu Mishra 👋" },
      { type: 'output', text: 'C++ Software Developer @ Teledeyne SevenCs (Teledyne), Hamburg 🇩🇪' },
      { type: 'output', text: '' },
      { type: 'output', text: "I hold a Master's in Computational Science & Engineering from TU Munich." },
      { type: 'output', text: 'My work spans HPC, HPC-QC integration, GPU programming, and scientific computing.' },
      { type: 'output', text: '' }
    ];
    if (activeShell === 'powershell') {
      return [
        { type: 'output', text: 'desktop-dev\\durganshu' },
        { type: 'output', text: '' },
        ...intro,
        { type: 'muted', text: 'Type "about" to explore my full journey, or "skills" to see my tech stack.' }
      ];
    }
    return [
      ...intro,
      { type: 'muted', text: 'Type "about" to explore my full journey, or "skills" to see my tech stack.' }
    ];
  },

  skills: () => [
    { type: 'output', text: '⚡ Technical Skills' },
    { type: 'output', text: '' },
    { type: 'bar', label: 'C++', pct: 95 },
    { type: 'bar', label: 'MPI/OpenMP', pct: 85 },
    { type: 'bar', label: 'Python', pct: 75 },
    { type: 'bar', label: 'OpenGL/Vulkan', pct: 70 },
    { type: 'bar', label: 'CUDA/SIMD', pct: 65 },
    { type: 'bar', label: 'Julia', pct: 50 },
    { type: 'output', text: '' },
    { type: 'highlight', label: '  Tools', value: ': Git, Valgrind, Intel VTune, CMake, CI/CD' },
    { type: 'highlight', label: '  OS', value: ':    Linux, Windows, Android' },
  ],

  projects: () => [
    { type: 'output', text: '🔧 Navigating to projects...' },
    { type: 'nav', url: 'projects.html', delay: 600 },
  ],

  blogs: () => [
    { type: 'output', text: '📝 Opening blog posts...' },
    { type: 'nav', url: 'blogs.html', delay: 600 },
  ],
  blog: () => COMMANDS.blogs(),

  about: () => [
    { type: 'output', text: '📋 Loading full profile...' },
    { type: 'nav', url: 'about-me.html', delay: 600 },
  ],

  contact: () => [
    { type: 'output', text: '📬 Contact Info' },
    { type: 'output', text: '' },
    { type: 'link', label: '  GitHub', value: ':   github.com/durganshu', url: 'https://github.com/durganshu' },
    { type: 'link', label: '  LinkedIn', value: ': linkedin.com/in/durganshu', url: 'https://www.linkedin.com/in/durganshu' },
    { type: 'link', label: '  Medium', value: ':   medium.com/@durganshu', url: 'https://medium.com/@durganshu' },
    { type: 'link', label: '  HackerNoon', value: ': hackernoon.com/about/durganshu', url: 'https://hackernoon.com/about/durganshu' },
  ],

  neofetch: () => [
    { type: 'raw', html: buildNeofetchHTML() },
  ],

  clear: () => [
    { type: 'clear' },
  ],

  history: () => {
    const hist = commandHistory.length
      ? commandHistory.map((cmd, i) => ({ type: 'output', text: `  ${i + 1}  ${cmd}` }))
      : [{ type: 'muted', text: '  (no commands in history)' }];
    return [{ type: 'output', text: 'Command history:' }, { type: 'output', text: '' }, ...hist];
  },

  ls: () => {
    const activeShell = localStorage.getItem('vscode-active-shell') || 'bash';
    if (activeShell === 'powershell') {
      return [
        { type: 'output', text: '    Directory: F:\\Projects\\durganshu.github.io' },
        { type: 'output', text: '' },
        { type: 'output', text: 'Mode                 LastWriteTime         Length Name' },
        { type: 'output', text: '----                 -------------         ------ ----' },
        { type: 'output', text: 'd----           7/16/2026  10:20 PM                assets' },
        { type: 'output', text: 'd----           7/16/2026  10:20 PM                images' },
        { type: 'output', text: 'd----           7/16/2026  10:20 PM                attachments' },
        { type: 'output', text: '-a---           7/16/2026  10:20 PM         30248 about-me.html' },
        { type: 'output', text: '-a---           7/16/2026  10:20 PM         18242 blogs.html' },
        { type: 'output', text: '-a---           7/16/2026  10:20 PM         16604 index.html' },
        { type: 'output', text: '-a---           7/16/2026  10:20 PM         18800 projects.html' }
      ];
    }
    return [
      { type: 'highlight', label: 'index', value: '    about.h    blogs.md    projects.cpp' },
      { type: 'muted', text: 'attachments/  images/  assets/' },
    ];
  },

  dir: () => COMMANDS.ls(),
  'get-childitem': () => COMMANDS.ls(),
  gci: () => COMMANDS.ls(),

  cd: () => [
    { type: 'muted', text: 'There\'s nowhere to go — you\'re already home! 🏡' },
  ],

  pwd: () => {
    const activeShell = localStorage.getItem('vscode-active-shell') || 'bash';
    return activeShell === 'powershell'
      ? [{ type: 'output', text: 'F:\\Projects\\durganshu.github.io' }]
      : [{ type: 'output', text: '/home/durganshu/portfolio' }];
  },
  'get-location': () => COMMANDS.pwd(),
  gl: () => COMMANDS.pwd(),

  sudo: () => [
    { type: 'error', text: 'Nice try 😏 — you don\'t have root privileges here!' },
  ],

  rm: () => [
    { type: 'error', text: '🚫 Permission denied. This portfolio is read-only!' },
  ],

  date: () => [
    { type: 'output', text: new Date().toString() },
  ],

  echo: (args) => [
    { type: 'output', text: args || '' },
  ],

  man: () => [
    { type: 'output', text: 'DURGANSHU(1)         Portfolio Manual         DURGANSHU(1)' },
    { type: 'output', text: '' },
    { type: 'output', text: 'NAME' },
    { type: 'output', text: '       durganshu — C++ Software Developer' },
    { type: 'output', text: '' },
    { type: 'output', text: 'SYNOPSIS' },
    { type: 'output', text: '       durganshu [--hpc] [--gpu] [--coffee]' },
    { type: 'output', text: '' },
    { type: 'output', text: 'DESCRIPTION' },
    { type: 'output', text: '       Expert in High-Performance Computing, scientific' },
    { type: 'output', text: '       computing, and GPU programming. Fueled by coffee.' },
    { type: 'output', text: '' },
    { type: 'output', text: 'SEE ALSO' },
    { type: 'output', text: '       about(1), projects(1), blogs(1), contact(1)' },
  ],
  'get-help': () => COMMANDS.help(),

  cat: (args) => {
    const files = {
      'skills.txt': () => COMMANDS.skills(),
      'interests.txt': () => [
        { type: 'output', text: 'High-Performance Computing · HPC-QC Integration · Scientific Computing' },
      ],
      'contact.txt': () => COMMANDS.contact(),
    };
    const file = args?.trim();
    if (!file) return [{ type: 'error', text: 'cat: missing file operand' }];
    if (files[file]) return files[file]();
    return [{ type: 'error', text: `cat: ${file}: No such file or directory` }];
  },
  'get-content': (args) => COMMANDS.cat(args),
  gc: (args) => COMMANDS.cat(args),
  cls: () => COMMANDS.clear(),
};

// ─── State ──────────────────────────────────────────
let commandHistory = [];
let historyIndex = -1;

const DEFAULT_LINES = [
  { type: 'input', text: 'whoami' },
  { type: 'output', text: 'C++ Software Developer @ Teledeyne SevenCs (Teledyne), Hamburg 🇩🇪' },
  { type: 'empty' },
  { type: 'input', text: 'cat skills.txt' },
  { type: 'output', text: 'C++ · HPC · GPU Programming · MPI · OpenMP · OpenGL · Vulkan' },
  { type: 'empty' },
  { type: 'input', text: 'cat interests.txt' },
  { type: 'output', text: 'High-Performance Computing · HPC-QC Integration · Scientific Computing' }
];

function generateTypingLineHTML(prompt, commandText) {
  const charsHTML = Array.from(commandText).map(c => `<span class="type-char" style="opacity:0">${escapeHTML(c)}</span>`).join('');
  return `<div class="terminal-line" style="opacity:0; transform:translateY(4px)"><span class="terminal-prompt">${escapeHTML(prompt)}</span>${charsHTML}</div>`;
}

function generateOutputLineHTML(text, prefixClass = 'terminal-output', style = '') {
  return `<div class="terminal-line" style="opacity:0; transform:translateY(4px)"><span class="${prefixClass}" style="${style}">${escapeHTML(text)}</span></div>`;
}

function loadDefaultTerminalLines(terminalBody, inputLine) {
  DEFAULT_LINES.forEach(item => {
    if (item.type === 'input') {
      const lineHTML = generateTypingLineHTML('durganshu@dev:~$ ', item.text);
      const temp = document.createElement('div');
      temp.innerHTML = lineHTML;
      terminalBody.insertBefore(temp.firstElementChild, inputLine);
    } else if (item.type === 'output') {
      const lineHTML = generateOutputLineHTML(item.text, 'terminal-output');
      const temp = document.createElement('div');
      temp.innerHTML = lineHTML;
      terminalBody.insertBefore(temp.firstElementChild, inputLine);
    } else if (item.type === 'empty') {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.style.opacity = '0';
      line.style.transform = 'translateY(4px)';
      line.innerHTML = '&nbsp;';
      terminalBody.insertBefore(line, inputLine);
    }
  });
}

// ─── neofetch Builder ───────────────────────────────
function buildNeofetchHTML() {
  const ascii = `     ____  __  __
    / __ \\/ |/  /
   / / / / /|_/ /
  / /_/ / /  / /
 /_____/_/  /_/

  Durganshu Mishra`;

  const info = [
    ['', 'durganshu@portfolio', 'neofetch-header'],
    ['', '─────────────────────────', 'neofetch-separator'],
    ['OS', 'Linux & Windows'],
    ['Role', 'C++ Software Developer @ SevenCs (Teledyne)'],
    ['Degree', 'MSc Computational Science & Engineering, TU Munich'],
    ['Languages', 'C++, Python, Julia, MATLAB'],
    ['Parallel', 'MPI, OpenMP, CUDA, SIMD'],
    ['Graphics', 'OpenGL, Vulkan'],
    ['Tools', 'Git, Valgrind, Intel VTune, CMake, CI/CD'],
    ['Uptime', '4+ years professional experience'],
  ];

  let infoHTML = info.map(([label, value, cls]) => {
    if (cls === 'neofetch-header') return `<span style="color:#3fb950;font-weight:700">${value}</span>`;
    if (cls === 'neofetch-separator') return `<span style="color:#30363d">${value}</span>`;
    return `<span style="color:#56d4dd;font-weight:600">${label}: </span><span style="color:#8b949e">${value}</span>`;
  }).join('\n');

  const colors = ['#f85149', '#d29922', '#3fb950', '#58a6ff', '#bc8cff', '#56d4dd', '#f778ba', '#e6edf3'];
  const colorBlocks = colors.map(c => `<span style="display:inline-block;width:20px;height:10px;background:${c};border-radius:2px;margin-right:3px"></span>`).join('');

  return `<div style="display:flex;gap:24px;font-family:var(--font-mono);font-size:12px;line-height:1.5">
    <pre style="color:#3fb950;margin:0;font-size:11px">${ascii}</pre>
    <div style="white-space:pre">${infoHTML}\n\n${colorBlocks}</div>
  </div>`;
}

// ─── Skill Bar Builder ──────────────────────────────
function buildBar(label, pct) {
  const total = 20;
  const filled = Math.round(pct / 100 * total);
  const empty = total - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const paddedLabel = label.padEnd(14);
  return `<span style="color:#8b949e">  ${paddedLabel}</span><span style="color:#3fb950">${bar}</span> <span style="color:#8b949e">${pct}%</span>`;
}

// ─── Render Output Lines ────────────────────────────
function renderOutput(terminalBody, results) {
  results.forEach((item, i) => {
    if (item.type === 'clear') {
      // Remove all lines except the input line
      const inputLine = document.getElementById('terminal-input-line');
      while (terminalBody.firstChild !== inputLine) {
        terminalBody.removeChild(terminalBody.firstChild);
      }
      return;
    }

    if (item.type === 'nav') {
      setTimeout(() => { window.location.href = item.url; }, item.delay || 500);
      return;
    }

    if (item.type === 'download') {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = item.url;
        a.download = '';
        a.click();
      }, item.delay || 300);
    }

    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.style.opacity = '1';
    line.style.transform = 'translateY(0)';

    if (item.type === 'output') {
      line.innerHTML = `<span class="terminal-output">${escapeHTML(item.text)}</span>`;
    } else if (item.type === 'muted') {
      line.innerHTML = `<span style="color:var(--text-muted);font-style:italic">${escapeHTML(item.text)}</span>`;
    } else if (item.type === 'error') {
      line.innerHTML = `<span style="color:var(--accent-red)">${escapeHTML(item.text)}</span>`;
    } else if (item.type === 'highlight') {
      line.innerHTML = `<span style="color:var(--accent-cyan)">${escapeHTML(item.label)}</span><span class="terminal-output">${escapeHTML(item.value)}</span>`;
    } else if (item.type === 'link') {
      line.innerHTML = `<span style="color:var(--accent-cyan)">${escapeHTML(item.label)}</span><span class="terminal-output">${escapeHTML(item.value.split(':')[0])}:</span> <a href="${item.url}" target="_blank" style="color:var(--accent-blue)">${escapeHTML(item.url)}</a>`;
    } else if (item.type === 'bar') {
      line.innerHTML = buildBar(item.label, item.pct);
    } else if (item.type === 'raw') {
      line.innerHTML = item.html;
    } else if (item.type === 'download') {
      line.innerHTML = `<span class="terminal-output">${escapeHTML(item.text || 'Downloading...')}</span>`;
    }

    const inputLine = document.getElementById('terminal-input-line');
    terminalBody.insertBefore(line, inputLine);
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Help Functions for Terminal Persistence ────────
function saveTerminalHistory() {
  const terminalBody = document.getElementById('terminal-body');
  if (!terminalBody) return;
  const lines = Array.from(terminalBody.querySelectorAll('.terminal-line:not(.terminal-input-line)'));
  const linesHTML = lines.map(line => line.outerHTML).join('\n');
  localStorage.setItem('vscode-terminal-history', linesHTML);
  localStorage.setItem('vscode-command-history', JSON.stringify(commandHistory));
}

// ─── Process Command ────────────────────────────────
function processCommand(raw) {
  const terminalBody = document.getElementById('terminal-body');
  const trimmed = raw.trim();

  // Echo the typed command as a line
  const echoLine = document.createElement('div');
  echoLine.className = 'terminal-line';
  echoLine.style.opacity = '1';
  echoLine.style.transform = 'translateY(0)';
  
  echoLine.innerHTML = `<span class="terminal-prompt">durganshu@dev:~$ </span><span class="terminal-command">${escapeHTML(trimmed)}</span>`;
  const inputLine = document.getElementById('terminal-input-line');
  terminalBody.insertBefore(echoLine, inputLine);

  if (!trimmed) {
    saveTerminalHistory();
    return;
  }

  // Add to history
  commandHistory.push(trimmed);
  historyIndex = commandHistory.length;

  // Parse command and args
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  // Look up command
  const handler = COMMANDS[cmd];
  if (handler) {
    const results = handler(args);
    renderOutput(terminalBody, results);
  } else {
    renderOutput(terminalBody, [
      { type: 'error', text: `bash: ${cmd}: command not found` },
      { type: 'muted', text: 'Type "help" for available commands.' },
    ]);
  }

  // Auto-scroll terminal to bottom
  terminalBody.scrollTop = terminalBody.scrollHeight;
  saveTerminalHistory();
}

// ─── Terminal Typing Animation ──────────────────────
function animateTerminalLines() {
  const terminalBody = document.getElementById('terminal-body');
  const inputLine = document.getElementById('terminal-input-line');
  const input = document.getElementById('terminal-input');
  const hint = document.getElementById('terminal-hint');
  
  if (!terminalBody || !inputLine || !input) return;
  
  // hide input line and hint initially
  inputLine.style.opacity = '0';
  if (hint) {
    hint.classList.remove('visible');
    hint.style.opacity = '0';
    hint.style.display = 'none';
  }
  
  const lines = terminalBody.querySelectorAll('.terminal-line:not(.terminal-input-line)');
  let delay = 400;
  lines.forEach((line) => {
    const chars = line.querySelectorAll('.type-char');
    if (chars.length > 0) {
      setTimeout(() => {
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
        typeChars(chars, 0, 30);
      }, delay);
      delay += chars.length * 30 + 200;
    } else {
      setTimeout(() => {
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
      }, delay);
      delay += 120;
    }
  });

  setTimeout(() => {
    inputLine.style.opacity = '1';
    inputLine.style.transform = 'translateY(0)';
    input.focus();
    if (hint) {
      hint.style.display = 'block';
      setTimeout(() => {
        hint.classList.add('visible');
        hint.style.opacity = '1';
      }, 50);
    }
    saveTerminalHistory();
  }, delay);
}

function initTerminalTyping() {
  const terminalBody = document.getElementById('terminal-body');
  if (!terminalBody) return;

  const inputLine = document.getElementById('terminal-input-line');
  const input = document.getElementById('terminal-input');
  const hint = document.getElementById('terminal-hint');

  if (!input) return;

  // Restore command history array
  try {
    const savedCmdHist = JSON.parse(localStorage.getItem('vscode-command-history'));
    if (Array.isArray(savedCmdHist)) {
      commandHistory = savedCmdHist;
      historyIndex = commandHistory.length;
    } else {
      commandHistory = [];
      historyIndex = -1;
    }
  } catch (e) {
    commandHistory = [];
    historyIndex = -1;
  }

  // Check if terminal history HTML exists in localStorage
  const savedHistory = localStorage.getItem('vscode-terminal-history');

  // Clear whatever default lines came from HTML delivery
  const defaultLines = terminalBody.querySelectorAll('.terminal-line:not(.terminal-input-line)');
  defaultLines.forEach(line => line.remove());

  if (savedHistory !== null) {
    // Insert saved lines
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = savedHistory;
    while (tempDiv.firstChild) {
      terminalBody.insertBefore(tempDiv.firstChild, inputLine);
    }

    // Set input line and auto-scroll
    inputLine.style.opacity = '1';
    inputLine.style.transform = 'translateY(0)';
    if (hint) {
      hint.style.display = 'block';
      hint.style.opacity = '1';
      hint.classList.add('visible');
    }
    input.focus();
    terminalBody.scrollTop = terminalBody.scrollHeight;
  } else {
    // No saved history, load default lines
    loadDefaultTerminalLines(terminalBody, inputLine);
    animateTerminalLines();
  }

  // Handle Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processCommand(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        input.value = '';
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      processCommand('clear');
    }
  });

  // Click anywhere in terminal to focus input
  terminalBody.addEventListener('click', () => {
    input.focus();
  });
}

function typeChars(chars, index, speed) {
  if (index >= chars.length) return;
  chars[index].style.opacity = '1';
  setTimeout(() => typeChars(chars, index + 1, speed), speed);
}

function initClearTerminalButton() {
  const clearBtn = document.getElementById('clear-terminal-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const terminalBody = document.getElementById('terminal-body');
      const inputLine = document.getElementById('terminal-input-line');
      if (terminalBody && inputLine) {
        const defaultLines = terminalBody.querySelectorAll('.terminal-line:not(.terminal-input-line)');
        defaultLines.forEach(line => line.remove());
        saveTerminalHistory();
        const input = document.getElementById('terminal-input');
        if (input) input.focus();
      }
    });
  }
}

// ─── Scroll Animations ─────────────────────────────
function initScrollAnimations() {
  const targets = document.querySelectorAll('.fade-in, .fade-in-stagger');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(t => observer.observe(t));
}

// ─── Editor Split/Code/Preview Toggle ──────────────
function initEditorToggle() {
  const workspace = document.getElementById('editor-workspace');
  const btnSplit = document.getElementById('btn-split');
  const btnCode = document.getElementById('btn-code');
  const btnPreview = document.getElementById('btn-preview');
  if (!workspace || !btnSplit || !btnCode || !btnPreview) return;

  const buttons = [btnSplit, btnCode, btnPreview];

  function setActive(btn) {
    buttons.forEach(b => b.classList.toggle('active', b === btn));
  }

  btnSplit.addEventListener('click', () => {
    workspace.classList.remove('show-code-only', 'show-render-only', 'show-code');
    setActive(btnSplit);
  });

  btnCode.addEventListener('click', () => {
    workspace.classList.remove('show-render-only');
    workspace.classList.add('show-code-only', 'show-code');
    setActive(btnCode);
  });

  btnPreview.addEventListener('click', () => {
    workspace.classList.remove('show-code-only', 'show-code');
    workspace.classList.add('show-render-only');
    setActive(btnPreview);
  });
}

// ─── Mobile Navigation Toggle ──────────────────────
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const tabs = document.getElementById('nav-tabs');
  if (!toggle || !tabs) return;

  toggle.addEventListener('click', () => {
    tabs.classList.toggle('open');
    toggle.textContent = tabs.classList.contains('open') ? '✕' : '☰';
  });

  tabs.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.classList.remove('open');
      toggle.textContent = '☰';
    });
  });
}

// ─── VS Code Layout Panel Toggles ──────────────────
function initVSCodeToggles() {
  const explorerBtn = document.getElementById('activity-explorer-btn');
  const terminalBtn = document.getElementById('activity-terminal-btn');
  const sidebar = document.getElementById('vscode-sidebar');
  const bottomPanel = document.getElementById('vscode-bottom-panel');
  const closeTerminalBtn = document.getElementById('close-terminal-btn');

  // Load and apply persistent states, default to 'collapsed'
  const sidebarState = localStorage.getItem('vscode-sidebar-state') || 'collapsed';
  const terminalState = localStorage.getItem('vscode-terminal-state') || 'collapsed';

  if (sidebar && explorerBtn) {
    if (sidebarState === 'collapsed') {
      sidebar.classList.add('collapsed');
      explorerBtn.classList.remove('active');
    } else {
      sidebar.classList.remove('collapsed');
      explorerBtn.classList.add('active');
    }

    explorerBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
      } else {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        localStorage.setItem('vscode-sidebar-state', isCollapsed ? 'collapsed' : 'expanded');
        if (isCollapsed) {
          explorerBtn.classList.remove('active');
        } else {
          explorerBtn.classList.add('active');
        }
      }
    });
  }

  if (bottomPanel && terminalBtn) {
    if (terminalState === 'collapsed') {
      bottomPanel.classList.add('collapsed');
      terminalBtn.classList.remove('active');
    } else {
      bottomPanel.classList.remove('collapsed');
      terminalBtn.classList.add('active');
    }

    terminalBtn.addEventListener('click', () => {
      const isCollapsed = bottomPanel.classList.toggle('collapsed');
      localStorage.setItem('vscode-terminal-state', isCollapsed ? 'collapsed' : 'expanded');
      if (isCollapsed) {
        terminalBtn.classList.remove('active');
      } else {
        terminalBtn.classList.add('active');
      }
    });
  }

  if (closeTerminalBtn && bottomPanel && terminalBtn) {
    closeTerminalBtn.addEventListener('click', () => {
      bottomPanel.classList.add('collapsed');
      terminalBtn.classList.remove('active');
      localStorage.setItem('vscode-terminal-state', 'collapsed');
    });
  }
}

// ─── VS Code Tabs Persistence and Interaction ──────
const TAB_CONFIG = {
  index: {
    id: 'index',
    title: 'index',
    url: '/',
    icon: '📄',
    iconColor: 'var(--accent-cyan)',
    pinned: true
  },
  about: {
    id: 'about',
    title: 'about',
    url: 'about-me.html',
    icon: '📋',
    iconColor: 'var(--accent-cyan)',
    pinned: false
  },
  projects: {
    id: 'projects',
    title: 'projects',
    url: 'projects.html',
    icon: '🔧',
    iconColor: 'var(--accent-green)',
    pinned: false
  },
  blogs: {
    id: 'blogs',
    title: 'blogs',
    url: 'blogs.html',
    icon: '📝',
    iconColor: 'var(--accent-purple)',
    pinned: false
  }
};

function getCurrentPageKey() {
  const path = window.location.pathname;
  if (path.includes('about-me.html')) return 'about';
  if (path.includes('projects.html')) return 'projects';
  if (path.includes('blogs.html')) return 'blogs';
  return 'index';
}

function initVSCodeTabs() {
  const tabsBar = document.querySelector('.vscode-tabs-bar');
  if (!tabsBar) return;

  const currentKey = getCurrentPageKey();

  // Load open tabs from localStorage
  let openTabs;
  try {
    openTabs = JSON.parse(localStorage.getItem('vscode-open-tabs'));
  } catch (e) {
    openTabs = null;
  }

  if (!Array.isArray(openTabs) || openTabs.length === 0) {
    openTabs = ['index'];
  }

  // Ensure current page is in the open tabs
  if (!openTabs.includes(currentKey)) {
    openTabs.push(currentKey);
    localStorage.setItem('vscode-open-tabs', JSON.stringify(openTabs));
  }

  // Dynamic tab rendering function
  function renderTabs() {
    tabsBar.innerHTML = '';
    openTabs.forEach(key => {
      const config = TAB_CONFIG[key];
      if (!config) return;

      const tabDiv = document.createElement('div');
      tabDiv.className = `vscode-tab ${key === currentKey ? 'active' : ''}`;

      const iconSpan = `<span class="sidebar-file-icon" style="color:${config.iconColor}">${config.icon}</span>`;

      const pinOrClose = config.pinned
        ? `<span class="vscode-tab-pin-icon" title="Pinned" style="margin-left: 6px;">📌</span>`
        : `<span class="vscode-tab-close-btn" style="margin-left: 8px;">×</span>`;

      tabDiv.innerHTML = `${iconSpan} ${config.title} ${pinOrClose}`;

      // Tab click navigation
      tabDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('vscode-tab-close-btn')) return;
        window.location.href = config.url;
      });

      // Tab close event
      const closeBtn = tabDiv.querySelector('.vscode-tab-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();

          const idx = openTabs.indexOf(key);
          if (idx > -1) {
            openTabs.splice(idx, 1);
            localStorage.setItem('vscode-open-tabs', JSON.stringify(openTabs));
          }

          if (key === currentKey) {
            const nextKey = openTabs[idx] || openTabs[idx - 1] || 'index';
            window.location.href = TAB_CONFIG[nextKey].url;
          } else {
            renderTabs();
          }
        });
      }

      tabsBar.appendChild(tabDiv);
    });
  }

  renderTabs();
}
