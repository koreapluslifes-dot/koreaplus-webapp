/* KoreaPlus Theme & Font-Size Module */
(function () {
  const THEME_KEY = 'kp_theme';
  const FONT_KEY  = 'kp_fontsize';
  const FONTS     = ['sm', 'md', 'lg'];
  const FONT_LABELS = { sm: 'A−', md: 'A', lg: 'A+' };

  // Apply immediately (before render) to prevent flash
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  const savedFont  = localStorage.getItem(FONT_KEY)  || 'md';
  if (savedTheme === 'light') document.documentElement.classList.add('light');
  document.documentElement.classList.add('font-' + savedFont);

  let currentTheme = savedTheme;
  let currentFont  = savedFont;

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', currentTheme === 'light');
    localStorage.setItem(THEME_KEY, currentTheme);
    updateThemeIcon();
  }

  function setFont(size) {
    FONTS.forEach(f => document.documentElement.classList.remove('font-' + f));
    document.documentElement.classList.add('font-' + size);
    currentFont = size;
    localStorage.setItem(FONT_KEY, size);
    updateFontBtns();
  }

  function updateThemeIcon() {
    document.querySelectorAll('.kp-theme-btn').forEach(btn => {
      btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
      btn.title = currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-label', btn.title);
    });
  }

  function updateFontBtns() {
    document.querySelectorAll('.kp-font-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === currentFont);
    });
  }

  function renderControls(container) {
    if (!container) return;

    // Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.className = 'kp-theme-btn';
    themeBtn.setAttribute('aria-label', 'Toggle theme');
    themeBtn.addEventListener('click', toggleTheme);

    // Font size
    const fontWrap = document.createElement('div');
    fontWrap.className = 'kp-font-wrap';
    fontWrap.setAttribute('aria-label', 'Font size');
    FONTS.forEach(size => {
      const btn = document.createElement('button');
      btn.className = 'kp-font-btn';
      btn.dataset.size = size;
      btn.textContent = FONT_LABELS[size];
      btn.title = 'Font size: ' + size;
      btn.addEventListener('click', () => setFont(size));
      fontWrap.appendChild(btn);
    });

    container.appendChild(themeBtn);
    container.appendChild(fontWrap);

    updateThemeIcon();
    updateFontBtns();
  }

  // PWA install prompt
  let deferredPrompt = null;
  let visitCount = parseInt(localStorage.getItem('kp_visits') || '0') + 1;
  localStorage.setItem('kp_visits', visitCount);

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Show after 3rd visit or 25 seconds on plan page
    const isPlanner = location.pathname.includes('plan');
    const delay = (isPlanner || visitCount >= 3) ? 25_000 : 60_000;
    setTimeout(showInstallPrompt, delay);
  });

  function showInstallPrompt() {
    if (!deferredPrompt) return;
    const p = document.getElementById('kp-install-prompt');
    if (p) p.classList.add('visible');
  }

  window.kpTheme = { toggleTheme, setFont, renderControls };

  document.addEventListener('DOMContentLoaded', () => {
    // Auto-wire any .kp-theme-btn already in DOM
    document.querySelectorAll('.kp-theme-btn').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
    updateThemeIcon();
    updateFontBtns();

    // Install prompt actions
    const installYes = document.getElementById('kp-install-yes');
    const installNo  = document.getElementById('kp-install-no');
    const installClose = document.getElementById('kp-install-close');

    installYes?.addEventListener('click', () => {
      deferredPrompt?.prompt();
      deferredPrompt = null;
      document.getElementById('kp-install-prompt')?.classList.remove('visible');
    });
    [installNo, installClose].forEach(el => el?.addEventListener('click', () => {
      document.getElementById('kp-install-prompt')?.classList.remove('visible');
    }));
  });
})();
