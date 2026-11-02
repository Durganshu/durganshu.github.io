/* ============================================
   terminal.js — Explorer and terminal panels, plus the interactive terminal.
   The site works without this file; it only adds the panels.
   ============================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEYS = {
    sidebar: 'vscode-sidebar-state',
    terminal: 'vscode-terminal-state',
    lines: 'terminal-lines-v2',
    commands: 'terminal-commands-v2',
    height: 'terminal-height'
  };
  var MAX_SAVED_LINES = 200;
  var PROMPT = 'durganshu@dev:~$';
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function read(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* storage unavailable */ }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (_) { /* storage unavailable */ }
  }

  // Keys from the previous version of the site
  ['vscode-open-tabs', 'vscode-terminal-history', 'vscode-command-history', 'vscode-active-shell'].forEach(remove);

  // ─── Commands ─────────────────────────────────────
  var COMMANDS = {
    help: function () {
      return [
        { type: 'output', text: 'Available commands:' },
        { type: 'blank' },
        { type: 'pair', label: '  whoami    ', value: 'who I am' },
        { type: 'pair', label: '  skills    ', value: 'technical skills' },
        { type: 'pair', label: '  about     ', value: 'open my experience and publications' },
        { type: 'pair', label: '  projects  ', value: 'open my projects' },
        { type: 'pair', label: '  blogs     ', value: 'open my articles' },
        { type: 'pair', label: '  updates   ', value: 'open news and milestones' },
        { type: 'pair', label: '  samosa    ', value: 'what I build after hours' },
        { type: 'pair', label: '  contact   ', value: 'where to find me' },
        { type: 'pair', label: '  neofetch  ', value: 'system info' },
        { type: 'pair', label: '  history   ', value: 'commands you have run' },
        { type: 'pair', label: '  clear     ', value: 'clear the terminal (Ctrl+L)' },
        { type: 'blank' },
        { type: 'muted', text: 'Tip: ↑/↓ browse history, Esc closes the panel.' },
        { type: 'muted', text: "     Drag the panel's top edge to resize it; double-click it to reset." }
      ];
    },

    whoami: function () {
      return [
        { type: 'output', text: "Hi! I'm Durganshu Mishra 👋" },
        { type: 'output', text: 'I write code that makes CPUs sweat.' },
        { type: 'output', text: 'C++ and HPC by day at Teledyne SevenCs, Hamburg 🇩🇪' },
        { type: 'output', text: 'Local-first AI by night, building Samosa AI 🤖' },
        { type: 'blank' },
        { type: 'output', text: "I hold a Master's in Computational Science & Engineering from TU Munich." },
        { type: 'blank' },
        { type: 'muted', text: 'Type "samosa" for my side project, "about" for my journey, or "skills" for my stack.' }
      ];
    },

    skills: function () {
      return [
        { type: 'output', text: '⚡ Technical skills' },
        { type: 'blank' },
        { type: 'pair', label: '  Languages  ', value: 'C++ · Python · Julia · MATLAB' },
        { type: 'pair', label: '  Parallel   ', value: 'MPI · OpenMP · CUDA · SIMD' },
        { type: 'pair', label: '  Graphics   ', value: 'OpenGL · Vulkan' },
        { type: 'pair', label: '  Tools      ', value: 'Git · Valgrind · Intel VTune · CMake · CI/CD' },
        { type: 'pair', label: '  OS         ', value: 'Linux · Windows · Android' }
      ];
    },

    about: function () { return navigate('📋 Opening about-me…', '/about-me.html'); },
    projects: function () { return navigate('🔧 Opening projects…', '/projects.html'); },
    blogs: function () { return navigate('📝 Opening blog posts…', '/blogs.html'); },
    blog: function () { return COMMANDS.blogs(); },
    updates: function () { return navigate('📣 Opening updates…', '/updates/'); },
    home: function () { return navigate('🏠 Going home…', '/'); },

    samosa: function () {
      return [
        { type: 'output', text: '🤖 Samosa AI: a taste of innovation' },
        { type: 'blank' },
        { type: 'output', text: 'Open-source, privacy-first AI solutions for learning, productivity and health.' },
        { type: 'output', text: 'Built local-first, so your data stays with you. No subscriptions, no cloud lock-in.' },
        { type: 'output', text: 'I build it in my free time, after the C++ day job.' },
        { type: 'blank' },
        { type: 'link', label: '  Website  ', url: 'https://samosa-ai.com' },
        { type: 'link', label: '  Blog     ', url: 'https://blogs.samosa-ai.com' },
        { type: 'link', label: '  GitHub   ', url: 'https://github.com/samosa-ai-com' }
      ];
    },
    'samosa-ai': function () { return COMMANDS.samosa(); },

    contact: function () {
      return [
        { type: 'output', text: '📬 Find me here' },
        { type: 'blank' },
        { type: 'link', label: '  GitHub      ', url: 'https://github.com/durganshu' },
        { type: 'link', label: '  LinkedIn    ', url: 'https://www.linkedin.com/in/durganshu' },
        { type: 'link', label: '  Medium      ', url: 'https://medium.com/@durganshu' },
        { type: 'link', label: '  HackerNoon  ', url: 'https://hackernoon.com/about/durganshu' },
        { type: 'link', label: '  Samosa AI   ', url: 'https://samosa-ai.com' }
      ];
    },

    neofetch: function () { return [{ type: 'node', node: buildNeofetch() }]; },

    clear: function () { return [{ type: 'clear' }]; },
    cls: function () { return COMMANDS.clear(); },

    history: function () {
      if (!commandHistory.length) return [{ type: 'muted', text: '  (no commands in history)' }];
      return [{ type: 'output', text: 'Command history:' }, { type: 'blank' }].concat(
        commandHistory.map(function (cmd, i) { return { type: 'output', text: '  ' + (i + 1) + '  ' + cmd }; })
      );
    },

    ls: function () {
      return [
        { type: 'pair', label: 'index.md  about.md  projects.cpp  blogs.md  ', value: 'updates/' },
        { type: 'muted', text: 'Try "cat skills.txt" or open a page with "about", "projects" or "blogs".' }
      ];
    },
    dir: function () { return COMMANDS.ls(); },

    cd: function () { return [{ type: 'muted', text: "There's nowhere to go — you're already home! 🏡" }]; },
    pwd: function () { return [{ type: 'output', text: '/home/durganshu/portfolio' }]; },
    sudo: function () { return [{ type: 'error', text: "Nice try 😏 — you don't have root privileges here!" }]; },
    rm: function () { return [{ type: 'error', text: '🚫 Permission denied. This portfolio is read-only!' }]; },
    date: function () { return [{ type: 'output', text: new Date().toString() }]; },
    echo: function (args) { return [{ type: 'output', text: args || '' }]; },

    man: function () {
      return [
        'DURGANSHU(1)         Portfolio Manual         DURGANSHU(1)',
        '',
        'NAME',
        '       durganshu — C++ Software Developer',
        '',
        'SYNOPSIS',
        '       durganshu [--hpc] [--gpu] [--coffee]',
        '',
        'DESCRIPTION',
        '       Writes code that makes CPUs sweat. C++ and HPC by day,',
        '       local-first AI (Samosa AI) by night. Fueled by coffee.',
        '',
        'SEE ALSO',
        '       about(1), projects(1), blogs(1), samosa(1), contact(1)'
      ].map(function (text) { return text ? { type: 'output', text: text } : { type: 'blank' }; });
    },

    cat: function (args) {
      var files = {
        'skills.txt': function () { return COMMANDS.skills(); },
        'interests.txt': function () {
          return [{ type: 'output', text: 'High-Performance Computing · Local-first AI · Decentralised AI · Scientific Computing' }];
        },
        'contact.txt': function () { return COMMANDS.contact(); }
      };
      var file = (args || '').trim();
      if (!file) return [{ type: 'error', text: 'cat: missing file operand' }];
      if (files[file]) return files[file]();
      return [{ type: 'error', text: 'cat: ' + file + ': No such file or directory' }];
    }
  };

  function navigate(message, url) {
    return [{ type: 'output', text: message }, { type: 'nav', url: url }];
  }

  // ─── DOM helpers ──────────────────────────────────
  var panel = document.getElementById('terminal-panel');
  var body = document.getElementById('terminal-body');
  var inputLine = document.getElementById('terminal-input-line');
  var input = document.getElementById('terminal-input');
  var commandHistory = [];
  var historyIndex = 0;
  var terminalReady = false;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function addLine(children) {
    var line = el('div', 'terminal-line');
    (children || []).forEach(function (child) { line.appendChild(child); });
    body.insertBefore(line, inputLine);
    return line;
  }

  function addPromptLine(command) {
    return addLine([el('span', 'terminal-prompt', PROMPT + ' '), el('span', 'terminal-command', command)]);
  }

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function renderOutput(items) {
    items.forEach(function (item) {
      switch (item.type) {
        case 'clear':
          clearLines();
          break;
        case 'nav':
          setTimeout(function () { window.location.href = item.url; }, reducedMotion ? 0 : 500);
          break;
        case 'blank':
          addLine([el('span', '', ' ')]);
          break;
        case 'muted':
          addLine([el('span', 'terminal-muted', item.text)]);
          break;
        case 'error':
          addLine([el('span', 'terminal-error', item.text)]);
          break;
        case 'pair':
          addLine([el('span', 'terminal-label', item.label), el('span', 'terminal-output', item.value)]);
          break;
        case 'link': {
          var a = el('a', '', item.url.replace(/^https?:\/\/(www\.)?/, ''));
          a.href = item.url;
          a.target = '_blank';
          a.rel = 'noopener';
          addLine([el('span', 'terminal-label', item.label), a]);
          break;
        }
        case 'node':
          addLine([item.node]);
          break;
        default:
          addLine([el('span', 'terminal-output', item.text)]);
      }
    });
  }

  function clearLines() {
    while (body.firstChild && body.firstChild !== inputLine) body.removeChild(body.firstChild);
  }

  function saveTerminal() {
    var lines = Array.prototype.slice.call(body.querySelectorAll('.terminal-line:not(.terminal-input-line)'));
    lines = lines.slice(-MAX_SAVED_LINES);
    write(KEYS.lines, lines.map(function (line) { return line.outerHTML; }).join(''));
    write(KEYS.commands, JSON.stringify(commandHistory.slice(-100)));
  }

  function buildNeofetch() {
    var wrap = el('div', 'neofetch');
    wrap.appendChild(el('pre', '', '     ____  __  __\n    / __ \\/  |/  /\n   / / / / /|_/ /\n  / /_/ / /  / /\n /_____/_/  /_/\n\n  Durganshu Mishra'));
    var info = el('div', 'neofetch-info');
    info.appendChild(el('span', 'terminal-strong', 'durganshu@portfolio'));
    info.appendChild(document.createTextNode('\n'));
    info.appendChild(el('span', 'terminal-rule', '─────────────────────────'));
    [
      ['OS', 'Linux & Windows'],
      ['Day job', 'C++ Software Developer @ Teledyne SevenCs'],
      ['Night job', 'Building Samosa AI (local-first AI solutions)'],
      ['Degree', 'MSc Computational Science & Engineering, TU Munich'],
      ['Languages', 'C++, Python, Julia, MATLAB'],
      ['Parallel', 'MPI, OpenMP, CUDA, SIMD'],
      ['Graphics', 'OpenGL, Vulkan'],
      ['Tools', 'Git, Valgrind, Intel VTune, CMake, CI/CD'],
      ['Uptime', '4+ years professional experience']
    ].forEach(function (row) {
      info.appendChild(document.createTextNode('\n'));
      info.appendChild(el('span', 'terminal-label', row[0] + ': '));
      info.appendChild(el('span', 'terminal-output', row[1]));
    });
    var swatches = el('div', 'neofetch-swatches');
    ['--accent-red', '--accent-orange', '--accent-green', '--accent-blue', '--accent-purple', '--accent-cyan', '--text-primary']
      .forEach(function (token) {
        var s = el('span');
        s.style.background = 'var(' + token + ')';
        swatches.appendChild(s);
      });
    info.appendChild(swatches);
    wrap.appendChild(info);
    return wrap;
  }

  // ─── Command handling ─────────────────────────────
  function processCommand(raw) {
    var trimmed = raw.trim();
    addPromptLine(trimmed);

    if (trimmed) {
      commandHistory.push(trimmed);
      historyIndex = commandHistory.length;

      var parts = trimmed.split(/\s+/);
      var cmd = parts[0].toLowerCase();
      var args = parts.slice(1).join(' ');
      var handler = Object.prototype.hasOwnProperty.call(COMMANDS, cmd) ? COMMANDS[cmd] : null;

      if (handler) {
        renderOutput(handler(args));
      } else {
        renderOutput([
          { type: 'error', text: 'bash: ' + cmd + ': command not found' },
          { type: 'muted', text: 'Type "help" for available commands.' }
        ]);
      }
    }

    scrollToBottom();
    saveTerminal();
  }

  function playIntro() {
    var steps = [
      { cmd: 'whoami', out: 'C++ and HPC by day @ Teledyne SevenCs · local-first AI by night @ Samosa AI' },
      { cmd: 'cat skills.txt', out: 'C++ · HPC · GPU Programming · MPI · OpenMP · OpenGL · Vulkan' },
      { cmd: 'cat interests.txt', out: 'High-Performance Computing · Local-first AI · Decentralised AI · Scientific Computing' }
    ];
    var outro = [{ type: 'muted', text: 'Type "help" to see what else you can run.' }];

    if (reducedMotion) {
      steps.forEach(function (step) {
        addPromptLine(step.cmd);
        renderOutput([{ type: 'output', text: step.out }, { type: 'blank' }]);
      });
      renderOutput(outro);
      saveTerminal();
      return;
    }

    var index = 0;
    (function nextStep() {
      if (index >= steps.length) {
        renderOutput(outro);
        scrollToBottom();
        saveTerminal();
        return;
      }
      var step = steps[index++];
      var commandSpan = addPromptLine('').querySelector('.terminal-command');
      var typed = 0;
      (function typeChar() {
        if (typed < step.cmd.length) {
          commandSpan.textContent += step.cmd.charAt(typed++);
          setTimeout(typeChar, 35);
          return;
        }
        renderOutput([{ type: 'output', text: step.out }, { type: 'blank' }]);
        scrollToBottom();
        setTimeout(nextStep, 250);
      })();
    })();
  }

  function initTerminal() {
    if (terminalReady || !body || !input) return;
    terminalReady = true;

    try {
      var saved = JSON.parse(read(KEYS.commands));
      if (Array.isArray(saved)) commandHistory = saved;
    } catch (_) { commandHistory = []; }
    historyIndex = commandHistory.length;

    var savedLines = read(KEYS.lines);
    if (savedLines) {
      var temp = document.createElement('div');
      temp.innerHTML = savedLines;
      while (temp.firstChild) body.insertBefore(temp.firstChild, inputLine);
      scrollToBottom();
    } else {
      playIntro();
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        processCommand(input.value);
        input.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
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
        clearLines();
        saveTerminal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setTerminalOpen(false, { returnFocus: true });
      }
    });

    // Clicking empty space in the terminal focuses the prompt, but never steals a text selection
    body.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      if (window.getSelection && String(window.getSelection())) return;
      input.focus({ preventScroll: true });
    });
  }

  // ─── Terminal panel ───────────────────────────────
  var terminalToggles = Array.prototype.slice.call(document.querySelectorAll('[data-terminal-toggle]'));
  var lastToggle = null;

  function terminalOpen() {
    return root.getAttribute('data-terminal') === 'open';
  }

  function setTerminalOpen(open, options) {
    options = options || {};
    if (open) {
      root.setAttribute('data-terminal', 'open');
    } else {
      root.removeAttribute('data-terminal');
    }
    write(KEYS.terminal, open ? 'expanded' : 'collapsed');
    terminalToggles.forEach(function (btn) { btn.setAttribute('aria-expanded', String(open)); });

    if (open) {
      initTerminal();
      updateSashAria();
      if (options.focus && input) input.focus({ preventScroll: true });
    } else if (options.returnFocus) {
      var target = lastToggle && lastToggle.offsetParent !== null
        ? lastToggle
        : terminalToggles.filter(function (btn) { return btn.offsetParent !== null; })[0];
      if (target) target.focus();
    }
  }

  terminalToggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      lastToggle = btn;
      setTerminalOpen(!terminalOpen(), { focus: true });
    });
  });

  var closeBtn = document.getElementById('close-terminal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () { setTerminalOpen(false, { returnFocus: true }); });
  }

  var clearBtn = document.getElementById('clear-terminal-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      initTerminal();
      clearLines();
      saveTerminal();
      if (input) input.focus({ preventScroll: true });
    });
  }

  if (panel && terminalOpen()) {
    // Reopened from a previous page: restore it, but leave focus where the visitor is
    terminalToggles.forEach(function (btn) { btn.setAttribute('aria-expanded', 'true'); });
    initTerminal();
  }

  // ─── Resizable terminal panel ─────────────────────
  // The height lives in the --panel-h custom property on <html> (applied before
  // first paint by theme-switcher.js); CSS clamps it between --panel-min and --panel-max.
  var sash = document.getElementById('terminal-sash');
  var PANEL_MIN = 120;
  var STEP = 16;
  var BIG_STEP = 80;

  function panelMax() {
    var titlebar = document.querySelector('.titlebar');
    var header = document.querySelector('.editor-header');
    var chrome = (titlebar ? titlebar.offsetHeight : 0) + (header ? header.offsetHeight : 0);
    return Math.max(PANEL_MIN, window.innerHeight - chrome - 48);
  }

  function panelHeight() {
    return Math.round(panel.getBoundingClientRect().height);
  }

  function updateSashAria() {
    if (!sash || !panel || !terminalOpen()) return;
    sash.setAttribute('aria-valuemin', String(PANEL_MIN));
    sash.setAttribute('aria-valuemax', String(panelMax()));
    sash.setAttribute('aria-valuenow', String(panelHeight()));
    sash.setAttribute('aria-valuetext', panelHeight() + ' pixels tall');
  }

  function setPanelHeight(px, persist) {
    var height = Math.round(Math.min(panelMax(), Math.max(PANEL_MIN, px)));
    var pinnedToBottom = body && body.scrollHeight - body.scrollTop - body.clientHeight < 8;
    root.style.setProperty('--panel-h', height + 'px');
    if (pinnedToBottom) scrollToBottom();
    if (persist) write(KEYS.height, String(height));
    updateSashAria();
  }

  function resetPanelHeight() {
    root.style.removeProperty('--panel-h');
    remove(KEYS.height);
    updateSashAria();
    if (body) scrollToBottom();
  }

  if (sash && panel) {
    sash.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      var pointerId = e.pointerId;
      var startY = e.clientY;
      var startHeight = panelHeight();
      var pendingY = null;
      var frame = 0;

      sash.setPointerCapture(pointerId);
      root.classList.add('is-resizing-panel');

      function onMove(ev) {
        pendingY = ev.clientY;
        if (!frame) {
          frame = requestAnimationFrame(function () {
            frame = 0;
            setPanelHeight(startHeight + (startY - pendingY), false);
          });
        }
      }

      function onEnd() {
        if (frame) cancelAnimationFrame(frame);
        if (pendingY !== null) setPanelHeight(startHeight + (startY - pendingY), true);
        root.classList.remove('is-resizing-panel');
        if (sash.hasPointerCapture(pointerId)) sash.releasePointerCapture(pointerId);
        sash.removeEventListener('pointermove', onMove);
        sash.removeEventListener('pointerup', onEnd);
        sash.removeEventListener('pointercancel', onEnd);
      }

      sash.addEventListener('pointermove', onMove);
      sash.addEventListener('pointerup', onEnd);
      sash.addEventListener('pointercancel', onEnd);
    });

    sash.addEventListener('dblclick', resetPanelHeight);

    // Window-splitter keyboard pattern: arrows resize (Shift for bigger steps), Home/End jump to the limits
    sash.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? BIG_STEP : STEP;
      var next = null;
      if (e.key === 'ArrowUp') next = panelHeight() + step;
      else if (e.key === 'ArrowDown') next = panelHeight() - step;
      else if (e.key === 'Home') next = PANEL_MIN;
      else if (e.key === 'End') next = panelMax();
      if (next !== null) {
        e.preventDefault();
        setPanelHeight(next, true);
      }
    });

    window.addEventListener('resize', updateSashAria);
    updateSashAria();
  }

  // ─── Explorer sidebar ─────────────────────────────
  var explorer = document.getElementById('explorer');
  var explorerBtn = document.getElementById('explorer-toggle');

  function explorerVisible() {
    return !!explorer && window.getComputedStyle(explorer).display !== 'none';
  }

  function syncExplorerButton() {
    if (explorerBtn) explorerBtn.setAttribute('aria-expanded', String(explorerVisible()));
  }

  if (explorer && explorerBtn) {
    explorerBtn.addEventListener('click', function () {
      var next = explorerVisible() ? 'collapsed' : 'expanded';
      root.setAttribute('data-sidebar', next);
      write(KEYS.sidebar, next);
      syncExplorerButton();
    });
    if (window.matchMedia) {
      ['(min-width: 1024px)', '(min-width: 768px)'].forEach(function (query) {
        var mq = window.matchMedia(query);
        if (mq.addEventListener) mq.addEventListener('change', syncExplorerButton);
      });
    }
    syncExplorerButton();
  }
})();
