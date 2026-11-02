/**
 * theme-switcher.js — loaded synchronously in <head>.
 * Applies the saved theme and panel states before first paint, then wires
 * up the theme buttons. Themes: system (default), light, dark, night.
 */
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var THEME_KEY = 'durganshu-theme';
  var THEMES = ['system', 'light', 'dark', 'night'];
  var BAR_COLORS = { light: '#f6f8fa', dark: '#0c0f14', night: '#1e1913' };
  var prefersLight = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function read(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* storage unavailable */ }
  }

  function storedTheme() {
    var value = read(THEME_KEY);
    return THEMES.indexOf(value) > -1 ? value : 'system';
  }

  function resolvedTheme(theme) {
    if (theme !== 'system') return theme;
    return prefersLight && prefersLight.matches ? 'light' : 'dark';
  }

  function updateBrowserBar(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', BAR_COLORS[resolvedTheme(theme)]);
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    updateBrowserBar(theme);
    var buttons = document.querySelectorAll('[data-theme-value]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-theme-value') === theme));
    }
  }

  // Before first paint: theme and panel states (prevents a flash or layout jump)
  root.setAttribute('data-theme', storedTheme());

  var sidebarState = read('vscode-sidebar-state');
  if (sidebarState === 'collapsed' || sidebarState === 'expanded') {
    root.setAttribute('data-sidebar', sidebarState);
  }
  // Tab bar mode: open editors while the Explorer is on screen, every page otherwise.
  // Mirrors the .sidebar-col breakpoints in theme.css; tabs.js keeps it in sync after this.
  var mq = function (query) { return !!(window.matchMedia && window.matchMedia(query).matches); };
  var explorerShown = sidebarState === 'collapsed' ? false
    : sidebarState === 'expanded' ? mq('(min-width: 768px)')
    : mq('(min-width: 1024px)');
  root.setAttribute('data-tabs', explorerShown ? 'editors' : 'nav');
  if (read('vscode-terminal-state') === 'expanded') {
    root.setAttribute('data-terminal', 'open');
  }
  var terminalHeight = parseInt(read('terminal-height'), 10);
  if (terminalHeight >= 120 && terminalHeight <= 4000) {
    root.style.setProperty('--panel-h', terminalHeight + 'px');
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(storedTheme());
    var buttons = document.querySelectorAll('[data-theme-value]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        var theme = this.getAttribute('data-theme-value');
        write(THEME_KEY, theme);
        applyTheme(theme);
      });
    }
  });

  if (prefersLight && prefersLight.addEventListener) {
    prefersLight.addEventListener('change', function () { updateBrowserBar(storedTheme()); });
  }
})();
