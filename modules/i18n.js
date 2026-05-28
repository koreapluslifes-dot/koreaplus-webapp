/* KoreaPlus i18n Module — 5 languages */
(function () {
  const SUPPORTED = ['en', 'ko', 'ja', 'zh', 'es'];
  const LABELS = {
    en: { flag: '🇺🇸', name: 'English' },
    ko: { flag: '🇰🇷', name: '한국어' },
    ja: { flag: '🇯🇵', name: '日本語' },
    zh: { flag: '🇨🇳', name: '中文' },
    es: { flag: '🇪🇸', name: 'Español' },
  };

  let lang = 'en';
  const cache = {};

  function detect() {
    const saved = localStorage.getItem('kp_lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : 'en';
  }

  async function loadMessages(l) {
    if (cache[l]) return cache[l];
    try {
      const base = document.querySelector('base')?.href || '/guide/';
      const url  = base + 'messages/' + l + '.json';
      const r    = await fetch(url);
      cache[l]   = await r.json();
    } catch {
      cache[l] = cache['en'] || {};
    }
    return cache[l];
  }

  function t(key) {
    return cache[lang]?.[key] || cache['en']?.[key] || key;
  }

  function applyTranslations() {
    // data-i18n elements (text content)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = t(el.dataset.i18n);
      if (val) el.textContent = val;
    });
    // data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = t(el.dataset.i18nPlaceholder);
      if (val) el.placeholder = val;
    });
    // data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const val = t(el.dataset.i18nTitle);
      if (val) el.title = val;
    });
    // data-i18n-aria
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const val = t(el.dataset.i18nAria);
      if (val) el.setAttribute('aria-label', val);
    });
    // Update lang switcher UI
    document.querySelectorAll('.kp-lang-opt').forEach(el => {
      el.classList.toggle('active', el.dataset.lang === lang);
    });
    document.querySelectorAll('.kp-lang-current').forEach(el => {
      el.textContent = LABELS[lang]?.flag + ' ' + lang.toUpperCase();
    });
    // Update <html lang>
    document.documentElement.lang = lang;
  }

  async function switchLang(l) {
    if (!SUPPORTED.includes(l)) return;
    lang = l;
    localStorage.setItem('kp_lang', l);
    await loadMessages(l);
    applyTranslations();
    // Close dropdown
    document.querySelectorAll('.kp-lang-wrap').forEach(w => w.classList.remove('open'));
  }

  function renderSwitcher(container) {
    if (!container) return;
    const wrap = document.createElement('div');
    wrap.className = 'kp-lang-wrap';
    wrap.setAttribute('aria-label', 'Language');

    const btn = document.createElement('button');
    btn.className = 'kp-lang-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.innerHTML = '<span class="kp-lang-current">' + LABELS[lang].flag + ' ' + lang.toUpperCase() + '</span><span>▾</span>';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      wrap.classList.toggle('open');
    });

    const dropdown = document.createElement('div');
    dropdown.className = 'kp-lang-dropdown';
    dropdown.setAttribute('role', 'listbox');

    SUPPORTED.forEach(l => {
      const opt = document.createElement('div');
      opt.className = 'kp-lang-opt' + (l === lang ? ' active' : '');
      opt.dataset.lang = l;
      opt.setAttribute('role', 'option');
      opt.innerHTML = '<span class="lang-flag">' + LABELS[l].flag + '</span><span class="lang-name">' + LABELS[l].name + '</span>';
      opt.addEventListener('click', () => switchLang(l));
      dropdown.appendChild(opt);
    });

    wrap.appendChild(btn);
    wrap.appendChild(dropdown);
    container.appendChild(wrap);

    // Close dropdown on outside click
    document.addEventListener('click', () => wrap.classList.remove('open'));
  }

  async function init() {
    lang = detect();
    // Always load English as base, then the target lang
    await loadMessages('en');
    if (lang !== 'en') await loadMessages(lang);
    applyTranslations();
  }

  window.kpI18n = { init, switchLang, renderSwitcher, t };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
