/* KoreaPlus Hub Header Injector
   Adds: theme toggle, font size, lang switcher, search btn, SW, cookie banner, install prompt
   Include once in <head> of any hub page — requires hub-styles.css + theme.css */
(function () {

  // ── Service Worker registration ─────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/guide/sw.js').catch(() => {});
  }

  // ── PWA meta tags (dynamic insert) ────────────────────────────────────────
  function addMeta(name, content, type = 'name') {
    if (document.querySelector('meta[' + type + '="' + name + '"]')) return;
    const m = document.createElement('meta');
    m.setAttribute(type, name); m.content = content;
    document.head.appendChild(m);
  }
  function addLink(rel, href, extra = {}) {
    if (document.querySelector('link[rel="' + rel + '"]')) return;
    const l = document.createElement('link');
    l.rel = rel; l.href = href;
    Object.entries(extra).forEach(([k, v]) => l.setAttribute(k, v));
    document.head.appendChild(l);
  }
  addMeta('theme-color', '#000406');
  addMeta('apple-mobile-web-app-capable', 'yes');
  addMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  addLink('manifest', '/guide/manifest.json');
  addLink('apple-touch-icon', '/guide/icons/icon.svg');

  // ── Inject theme.css if not already linked ─────────────────────────────────
  if (!document.querySelector('link[href*="theme.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/guide/theme.css';
    document.head.insertBefore(l, document.head.firstChild);
  }

  // ── Apply saved theme immediately (prevent flash) ──────────────────────────
  const savedTheme = localStorage.getItem('kp_theme') || 'dark';
  const savedFont  = localStorage.getItem('kp_fontsize') || 'md';
  if (savedTheme === 'light') document.documentElement.classList.add('light');
  document.documentElement.classList.add('font-' + savedFont);

  // ── On DOMContentLoaded: inject controls ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    injectNavControls();
    injectCookieBanner();
    injectInstallPrompt();
    injectSearchModal();
    loadModules();
  });

  function injectNavControls() {
    const nav = document.querySelector('.hub-nav');
    if (!nav) return;

    // Search button
    const searchBtn = document.createElement('button');
    searchBtn.className = 'kp-search-btn';
    searchBtn.setAttribute('aria-label', 'Search');
    searchBtn.setAttribute('data-action', 'search');
    searchBtn.innerHTML = '🔍 <span class="search-shortcut">⌘K</span>';

    // Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.className = 'kp-theme-btn';
    themeBtn.setAttribute('aria-label', 'Toggle theme');
    const isDark = !document.documentElement.classList.contains('light');
    themeBtn.textContent = isDark ? '☀️' : '🌙';
    themeBtn.addEventListener('click', () => {
      if (window.kpTheme) window.kpTheme.toggleTheme();
      else {
        const isLight = document.documentElement.classList.toggle('light');
        localStorage.setItem('kp_theme', isLight ? 'light' : 'dark');
        themeBtn.textContent = isLight ? '🌙' : '☀️';
      }
    });

    // Lang switcher placeholder
    const langWrap = document.createElement('div');
    langWrap.id = 'hub-lang-mount';
    langWrap.style.display = 'contents';

    nav.appendChild(searchBtn);
    nav.appendChild(themeBtn);
    nav.appendChild(langWrap);
  }

  function injectCookieBanner() {
    if (localStorage.getItem('kp_consent')) return;
    const banner = document.createElement('div');
    banner.id = 'kp-cookie-banner';
    banner.className = 'kp-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<p class="kp-cookie-text">We use cookies for analytics. See our <a href="/guide/privacy.html">Privacy Policy</a>.</p>' +
      '<div class="kp-cookie-btns">' +
        '<button id="kp-cookie-accept" class="kp-cookie-accept">Accept</button>' +
        '<button id="kp-cookie-decline" class="kp-cookie-decline">Decline</button>' +
      '</div>';
    document.body.appendChild(banner);
  }

  function injectInstallPrompt() {
    const p = document.createElement('div');
    p.id = 'kp-install-prompt';
    p.className = 'kp-install-prompt';
    p.setAttribute('aria-label', 'Install app prompt');
    p.innerHTML =
      '<button class="kp-install-close" id="kp-install-close" aria-label="Close">×</button>' +
      '<span class="kp-install-icon">🇰🇷</span>' +
      '<div class="kp-install-body">' +
        '<div class="kp-install-title">Add to Home Screen</div>' +
        '<div class="kp-install-sub">Use KoreaPlus like an app — works offline</div>' +
        '<div class="kp-install-btns">' +
          '<button class="kp-install-yes" id="kp-install-yes">Install</button>' +
          '<button class="kp-install-no" id="kp-install-no">Not now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(p);
  }

  function injectSearchModal() {
    // Search modal is created by modules/search.js; just ensure the overlay placeholder exists
  }

  function loadModules() {
    const base = '/guide/modules/';
    // Load in order: theme.js, i18n.js, search.js, analytics.js
    const scripts = ['theme.js', 'i18n.js', 'search.js', 'analytics.js'];

    let chain = Promise.resolve();
    scripts.forEach(s => {
      chain = chain.then(() => new Promise(res => {
        if (document.querySelector('script[src*="' + s + '"]')) { res(); return; }
        const el = document.createElement('script');
        el.src = base + s;
        el.onload = res; el.onerror = res;
        document.head.appendChild(el);
      }));
    });

    chain.then(() => {
      // Wire lang switcher into hub-nav after i18n loads
      const mount = document.getElementById('hub-lang-mount');
      if (mount && window.kpI18n) {
        window.kpI18n.renderSwitcher(mount);
      }
    });
  }

})();
