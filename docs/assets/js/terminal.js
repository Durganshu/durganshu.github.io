/* ============================================
   Terminal-Themed Portfolio — terminal.js
   Interactive terminal typing & scroll animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // === Terminal Typing Animation ===
  initTerminalTyping();
  // === Scroll-triggered fade-in ===
  initScrollAnimations();
  // === Mobile nav toggle ===
  initMobileNav();
});

// ─── Terminal Typing Effect ─────────────────────────
function initTerminalTyping() {
  const terminalBody = document.getElementById('terminal-body');
  if (!terminalBody) return;

  const lines = terminalBody.querySelectorAll('.terminal-line');
  const cursor = document.getElementById('terminal-cursor');

  let delay = 400;
  lines.forEach((line, i) => {
    const chars = line.querySelectorAll('.type-char');
    if (chars.length > 0) {
      // Char-by-char typing for command lines
      setTimeout(() => {
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
        typeChars(chars, 0, 30);
      }, delay);
      delay += chars.length * 30 + 200;
    } else {
      // Instant reveal for output lines
      setTimeout(() => {
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
      }, delay);
      delay += 120;
    }
  });

  // Show cursor at the end
  if (cursor) {
    setTimeout(() => {
      cursor.style.opacity = '1';
    }, delay);
  }
}

function typeChars(chars, index, speed) {
  if (index >= chars.length) return;
  chars[index].style.opacity = '1';
  setTimeout(() => typeChars(chars, index + 1, speed), speed);
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

// ─── Mobile Navigation Toggle ──────────────────────
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const tabs = document.getElementById('nav-tabs');
  if (!toggle || !tabs) return;

  toggle.addEventListener('click', () => {
    tabs.classList.toggle('open');
    toggle.textContent = tabs.classList.contains('open') ? '✕' : '☰';
  });

  // Close on link click
  tabs.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.classList.remove('open');
      toggle.textContent = '☰';
    });
  });
}
