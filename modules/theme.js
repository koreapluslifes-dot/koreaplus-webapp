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

  window.kpTheme = { toggleTheme, setFont, renderControls };

  document.addEventListener('DOMContentLoaded', () => {
    // Auto-wire any .kp-theme-btn already in DOM
    document.querySelectorAll('.kp-theme-btn').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
    updateThemeIcon();
    updateFontBtns();

  });
})();
