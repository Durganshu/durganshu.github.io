/* ============================================
   tabs.js — the editor tab bar.
   While the Explorer is on screen it is the navigation, so the tab bar lists
   only the pages opened in this browser tab, VS Code style: each one closable,
   index pinned. With no Explorer (phones, or collapsed) the tab bar is the
   navigation instead and lists every page.
   Loaded right after the tab bar (not deferred) so open tabs are restored
   before it is painted. Without JavaScript the tab bar lists every page.
   ============================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var list = document.querySelector('.tabs-list');
  var explorer = document.getElementById('explorer');
  if (!list) return;

  var KEY = 'durganshu-open-tabs';
  var tabs = Array.prototype.slice.call(list.querySelectorAll('.tab'));

  // Session storage: a new visit starts with fresh tabs
  function readOpen() {
    try {
      var keys = JSON.parse(sessionStorage.getItem(KEY));
      return Array.isArray(keys) ? keys : [];
    } catch (_) { return []; }
  }
  function writeOpen(keys) {
    try { sessionStorage.setItem(KEY, JSON.stringify(keys)); } catch (_) { /* storage unavailable */ }
  }

  function keyOf(tab) { return tab.getAttribute('data-tab'); }
  function isShown(tab) { return tab.getClientRects().length > 0; }
  function linkOf(tab) { return tab.querySelector('.tab-link'); }

  // Arriving on a page opens its tab. Preview tabs (posts, 404) are never stored,
  // so they go away once you move on.
  function restore() {
    var open = readOpen();
    var active = list.querySelector('.tab.is-active[data-tab]');
    if (active && open.indexOf(keyOf(active)) < 0) {
      open.push(keyOf(active));
      writeOpen(open);
    }
    tabs.forEach(function (tab) {
      tab.classList.toggle('is-open', open.indexOf(keyOf(tab)) > -1);
    });
  }

  function close(tab) {
    var key = keyOf(tab);
    if (key) writeOpen(readOpen().filter(function (k) { return k !== key; }));

    var shown = tabs.filter(isShown);
    var at = shown.indexOf(tab);
    var neighbor = shown[at + 1] || shown[at - 1];

    if (tab.classList.contains('is-active')) {
      // Closing the page you're reading moves to the tab beside it
      window.location.href = neighbor ? linkOf(neighbor).href : '/';
      return;
    }
    var hadFocus = tab.contains(document.activeElement);
    tab.classList.remove('is-open');
    if (hadFocus && neighbor) linkOf(neighbor).focus();
  }

  function syncMode() {
    var editors = !!explorer && window.getComputedStyle(explorer).display !== 'none';
    root.setAttribute('data-tabs', editors ? 'editors' : 'nav');
  }

  // Keep the active tab in view when the tab bar scrolls (narrow screens)
  function revealActive() {
    var active = list.querySelector('.tab.is-active');
    if (!active) return;
    var tabBox = active.getBoundingClientRect();
    var listBox = list.getBoundingClientRect();
    if (tabBox.right > listBox.right) list.scrollLeft += tabBox.left - listBox.left - 8;
  }

  list.addEventListener('click', function (e) {
    var button = e.target.closest && e.target.closest('.tab-close');
    if (button) close(button.closest('.tab'));
  });

  // The Explorer shows or hides on resize and from its toggle (terminal.js)
  if (window.matchMedia) {
    ['(min-width: 768px)', '(min-width: 1024px)'].forEach(function (query) {
      var mq = window.matchMedia(query);
      if (mq.addEventListener) mq.addEventListener('change', syncMode);
    });
  }
  if (window.MutationObserver) {
    new MutationObserver(syncMode).observe(root, { attributes: true, attributeFilter: ['data-sidebar'] });
  }

  // Back/forward cache: tabs may have been opened or closed on other pages since
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) restore();
  });

  syncMode();
  restore();
  revealActive();
})();
