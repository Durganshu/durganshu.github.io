/**
 * Theme Switcher for durganshu.com
 * Supports: dark, night, system
 * Persists selection via localStorage across pages.
 */
(function () {
  const STORAGE_KEY = 'durganshu-theme';
  const VALID_THEMES = ['dark', 'night', 'system'];

  function getStoredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_THEMES.includes(stored)) return stored;
    } catch (_) { /* localStorage unavailable */ }
    return 'dark';
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    // Update active states on buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  function setTheme(theme) {
    if (!VALID_THEMES.includes(theme)) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) { /* fail silently */ }
    applyTheme(theme);
  }

  // Apply the stored theme immediately (before DOMContentLoaded) to prevent flash
  const initialTheme = getStoredTheme();
  if (initialTheme !== 'dark') {
    document.documentElement.setAttribute('data-theme', initialTheme);
  }

  // Bind button clicks once DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getStoredTheme());
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        setTheme(this.dataset.theme);
      });
    });
  });
})();
