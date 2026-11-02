/* ============================================
   workbench.js — the IDE extras around the page:
   the command palette (Ctrl/⌘+K), the status bar clock, and the
   cursor glow on cards. The site works without this file.
   ============================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ─── Status bar clock: local time in Hamburg ─────
  var clock = document.querySelector('[data-clock]');
  if (clock && window.Intl && Intl.DateTimeFormat) {
    var fmt;
    try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }); } catch (_) { fmt = null; }
    if (fmt) {
      var tick = function () {
        var now = new Date();
        clock.textContent = fmt.format(now);
        clock.setAttribute('datetime', now.toISOString());
      };
      tick();
      setInterval(tick, 15000);
    }
  }

  // ─── Cursor glow on cards ─────────────────────────
  // Cards read --mx/--my (see "Cursor glow" in theme.css)
  var GLOW = '.side-project, .update-entry, .timeline-entry, .pub-entry, .git-commit, .link-card';
  if (finePointer) {
    var pending = null, frame = 0;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      pending = e;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        var ev = pending, card = ev.target && ev.target.closest ? ev.target.closest(GLOW) : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
    }, { passive: true });
  }

  // ─── Command palette ──────────────────────────────
  var dialog = document.getElementById('palette');
  var input = document.getElementById('palette-input');
  var list = document.getElementById('palette-list');
  var dataEl = document.getElementById('palette-data');
  if (!dialog || !input || !list || !dataEl || typeof dialog.showModal !== 'function') return;

  var data;
  try { data = JSON.parse(dataEl.textContent); } catch (_) { return; }
  root.classList.add('has-palette');

  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  Array.prototype.forEach.call(document.querySelectorAll('[data-palette-kbd]'), function (k) { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });

  var icons = {};
  var tpl = document.getElementById('palette-icons');
  if (tpl && tpl.content) {
    Array.prototype.forEach.call(tpl.content.querySelectorAll('[data-icon]'), function (el) { icons[el.getAttribute('data-icon')] = el.innerHTML; });
  }

  function store(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage unavailable */ } }
  function go(url) { window.location.href = url; }
  function openExternal(url) {
    var w = window.open(url, '_blank', 'noopener');
    if (!w) go(url);
  }
  function click(selector) { var el = document.querySelector(selector); if (el) el.click(); }
  function explorerAvailable() { return window.matchMedia('(min-width: 768px)').matches && !!document.getElementById('explorer-toggle'); }
  function heroCommand(name) {
    return function () {
      if (window.durganshuHero) { window.durganshuHero.set(name); return; }
      store('durganshu-hero', name);
      go(data.home);
    };
  }

  // Everything the palette can do. Commands show first when the query starts with ">"
  var ITEMS = [];
  data.pages.forEach(function (p) {
    ITEMS.push({ group: 'page', label: p.label, icon: p.icon, run: function () { go(p.url); } });
  });
  [
    ['Theme: System', 'monitor', function () { click('[data-theme-value="system"]'); }],
    ['Theme: Light', 'sun', function () { click('[data-theme-value="light"]'); }],
    ['Theme: Dark', 'moon', function () { click('[data-theme-value="dark"]'); }],
    ['Theme: Night', 'moon-star', function () { click('[data-theme-value="night"]'); }],
    ['View: Toggle Terminal', 'square-terminal', function () { click('[data-terminal-toggle]'); }],
    ['View: Toggle Explorer', 'files', function () { click('#explorer-toggle'); }, explorerAvailable],
    ['Hero: Flow past a cylinder', 'wind', heroCommand('flow')],
    ['Hero: Heat stencil', 'thermometer', heroCommand('heat')],
    ['Hero: Particle fluid', 'droplets', heroCommand('fluid')],
    ['Hero: Roofline climb', 'trending-up', heroCommand('roofline')],
    ['Hero: Pause or play the animation', 'pause', function () { var h = window.durganshuHero; h.setPaused(!h.isPaused()); }, function () { return !!window.durganshuHero; }],
    ['Copy link to this page', 'link', function () {
      var url = window.location.href.split('#')[0];
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).catch(function () {});
    }]
  ].forEach(function (c) {
    ITEMS.push({ group: 'command', label: c[0], icon: c[1], run: c[2], when: c[3] });
  });
  data.posts.forEach(function (p) {
    ITEMS.push({ group: 'update', label: p.label, detail: p.detail, icon: 'file-text', run: function () { go(p.url); } });
  });
  data.profiles.forEach(function (p) {
    ITEMS.push({ group: 'link', label: 'Open ' + p.label, icon: p.icon, external: true, run: function () { openExternal(p.url); } });
  });
  var GROUP_NAMES = { page: 'page', command: 'command', update: 'update', link: 'link' };

  // Match: a plain substring wins (best at a word start); otherwise fuzzy, every query
  // character in order, with contiguous runs and word starts scoring higher
  function match(text, q) {
    if (!q) return { score: 0, hits: [] };
    var t = text.toLowerCase(), hits = [], score = 0, ti = 0, prev = -2;
    var at = t.indexOf(q);
    if (at > -1) {
      var wordStart = -1, re = /(^|[\s\-_./:])/g, m;
      while ((m = re.exec(t)) && m.index <= t.length) {
        var start = m.index + m[1].length;
        if (t.indexOf(q, start) === start) { wordStart = start; break; }
        if (re.lastIndex === m.index) re.lastIndex++;
      }
      if (wordStart > -1) at = wordStart;
      for (var h = 0; h < q.length; h++) hits.push(at + h);
      return { score: 100 + (wordStart > -1 ? 20 : 0) - at * 0.1, hits: hits };
    }
    for (var qi = 0; qi < q.length; qi++) {
      var ch = q[qi];
      if (ch === ' ') continue;
      var found = t.indexOf(ch, ti);
      if (found < 0) return null;
      score += 1;
      if (found === prev + 1) score += 3;
      if (found === 0 || /[\s\-_./:]/.test(t[found - 1])) score += 4;
      hits.push(found); prev = found; ti = found + 1;
    }
    score -= (t.length - hits.length) * 0.02;
    return { score: score, hits: hits };
  }

  function highlight(text, hits) {
    var frag = document.createDocumentFragment(), set = {}, i;
    for (i = 0; i < hits.length; i++) set[hits[i]] = true;
    var run = '', inMark = false;
    function flush() {
      if (!run) return;
      if (inMark) { var m = document.createElement('mark'); m.textContent = run; frag.appendChild(m); }
      else frag.appendChild(document.createTextNode(run));
      run = '';
    }
    for (i = 0; i < text.length; i++) {
      var hit = !!set[i];
      if (hit !== inMark) { flush(); inMark = hit; }
      run += text[i];
    }
    flush();
    return frag;
  }

  var results = [], active = 0, opener = null;

  function render() {
    var raw = input.value, commandsOnly = raw.trim().charAt(0) === '>';
    var q = (commandsOnly ? raw.trim().slice(1) : raw).trim().toLowerCase();
    results = [];
    ITEMS.forEach(function (item, order) {
      if (item.when && !item.when()) return;
      if (commandsOnly && item.group !== 'command') return;
      var m = match(item.label, q);
      if (!m && item.detail) { m = match(item.detail, q); if (m) m.hits = []; }
      if (!m) return;
      results.push({ item: item, score: m.score, hits: m.hits, order: order });
    });
    if (q) results.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
    active = Math.min(active, Math.max(0, results.length - 1));

    list.textContent = '';
    if (!results.length) {
      var empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.textContent = 'No matching pages or commands';
      list.appendChild(empty);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    results.forEach(function (r, i) {
      var li = document.createElement('li');
      li.id = 'palette-opt-' + i;
      li.className = 'palette-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      var ic = document.createElement('span');
      ic.className = 'palette-icon palette-icon-' + r.item.group;
      ic.innerHTML = icons[r.item.icon] || icons['file-text'] || '';
      var label = document.createElement('span');
      label.className = 'palette-label';
      label.appendChild(highlight(r.item.label, r.hits));
      li.appendChild(ic); li.appendChild(label);
      if (r.item.detail) {
        var d = document.createElement('span'); d.className = 'palette-detail'; d.textContent = r.item.detail; li.appendChild(d);
      }
      var g = document.createElement('span');
      g.className = 'palette-group';
      g.textContent = GROUP_NAMES[r.item.group] + (r.item.external ? ' ↗' : '');
      li.appendChild(g);
      li.addEventListener('mousemove', function () { if (active !== i) { active = i; sync(); } });
      li.addEventListener('click', function () { choose(i); });
      list.appendChild(li);
    });
    sync();
  }

  function sync() {
    var items = list.querySelectorAll('.palette-item');
    for (var i = 0; i < items.length; i++) items[i].setAttribute('aria-selected', String(i === active));
    var cur = items[active];
    if (cur) {
      input.setAttribute('aria-activedescendant', cur.id);
      cur.scrollIntoView({ block: 'nearest' });
    }
  }

  function choose(i) {
    var r = results[i];
    if (!r) return;
    close();
    r.item.run();
  }

  function open(prefill) {
    if (dialog.open) return;
    opener = document.activeElement;
    input.value = prefill || '';
    active = 0;
    render();
    dialog.showModal();
    root.classList.add('palette-is-open');
    input.focus();
  }
  function close() {
    if (dialog.open) dialog.close();
  }
  dialog.addEventListener('close', function () {
    root.classList.remove('palette-is-open');
    if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
  });
  // A click on the dimmed backdrop closes it
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });

  input.addEventListener('input', function () { active = 0; render(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (results.length) { active = (active + 1) % results.length; sync(); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (results.length) { active = (active - 1 + results.length) % results.length; sync(); } }
    else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); active = 0; sync(); }
    else if (e.key === 'End' && e.ctrlKey) { e.preventDefault(); active = Math.max(0, results.length - 1); sync(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-palette-open]'), function (btn) {
    btn.addEventListener('click', function () { open(); });
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (dialog.open) close(); else open();
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P') && !dialog.open) {
      // VS Code's own shortcut opens it in command mode, where the browser allows it
      e.preventDefault();
      open('>');
    }
  });
})();
