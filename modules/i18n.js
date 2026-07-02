/* KoreaPlus i18n Module — 9 languages */
(function () {
  const SUPPORTED = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id', 'ar', 'hi', 'ru', 'vi', 'th'];
  const RTL = ['ar'];
  const LABELS = {
    en: { flag: '🇺🇸', name: 'English' },
    ko: { flag: '🇰🇷', name: '한국어' },
    ja: { flag: '🇯🇵', name: '日本語' },
    zh: { flag: '🇨🇳', name: '中文' },
    es: { flag: '🇪🇸', name: 'Español' },
    fr: { flag: '🇫🇷', name: 'Français' },
    de: { flag: '🇩🇪', name: 'Deutsch' },
    pt: { flag: '🇧🇷', name: 'Português' },
    id: { flag: '🇮🇩', name: 'Indonesia' },
    ar: { flag: '🇸🇦', name: 'العربية' },
    hi: { flag: '🇮🇳', name: 'हिन्दी' },
    ru: { flag: '🇷🇺', name: 'Русский' },
    vi: { flag: '🇻🇳', name: 'Tiếng Việt' },
    th: { flag: '🇹🇭', name: 'ไทย' },
  };

  let lang = 'en';
  const cache = {};

  function detect() {
    // 1. URL param (?lang=XX) — enables hreflang SEO targeting
    const urlLang = new URLSearchParams(location.search).get('lang');
    if (urlLang && SUPPORTED.includes(urlLang)) return urlLang;
    // 2. localStorage persisted choice
    const saved = localStorage.getItem('kp_lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
    // 3. Browser language
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : 'en';
  }

  async function loadMessages(l) {
    if (cache[l]) return cache[l];
    try {
      // Relative path: resolves correctly whether the app is served at
      // /guide/ (production) or at the site root (local dev) — no hardcode.
      const base = document.querySelector('base')?.href || '';
      const url  = base + 'messages/' + l + '.json';
      const r    = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      cache[l]   = await r.json();
    } catch {
      cache[l] = cache['en'] || {};
    }
    return cache[l];
  }

  function t(key) {
    return cache[lang]?.[key] || cache['en']?.[key] || key;
  }

  // Self-canonicalize per language variant + sync og:url so hreflang is honored.
  // Derives the base from the AUTHORED <link rel=canonical> (strips any ?lang), so
  // a page that canonicalizes to a clean URL (e.g. /kpop) keeps that base.
  function syncCanonical() {
    try {
      let c = document.querySelector('link[rel="canonical"]');
      const authored = c ? c.href.split('?')[0] : (location.origin + location.pathname);
      const href = (lang === 'en') ? authored : authored + '?lang=' + lang;
      if (!c) { c = document.createElement('link'); c.rel = 'canonical'; document.head.appendChild(c); }
      c.href = href;
      const og = document.querySelector('meta[property="og:url"]');
      if (og) og.setAttribute('content', href);
    } catch {}
  }

  function applyTranslations() {
    // data-i18n — textContent replacement
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = t(el.dataset.i18n);
      if (val) el.textContent = val;
    });
    // data-i18n-html — innerHTML replacement (newlines → <br>)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const val = t(el.dataset.i18nHtml);
      if (val) el.innerHTML = val.replace(/\n/g, '<br>');
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
    // Self-canonicalize + sync og:url per language (SEO: makes hreflang reciprocal)
    syncCanonical();
    // Keep the document LTR even for Arabic — the shared travel chrome (cookie banner,
    // search overlay, trip panel) isn't RTL-safe. RTL is scoped to the K-beauty hub
    // content via CSS (html[lang=ar] .hub-content, see kbeauty.html); library pages
    // set their own dir=rtl in shell() (no shared chrome there).
    document.documentElement.dir = 'ltr';
    // Notify dynamic modules (My Trip panel, detail panel, etc.) to relabel.
    try { document.dispatchEvent(new CustomEvent('kp:langchange', { detail: { lang } })); } catch {}
  }

  async function switchLang(l) {
    if (!SUPPORTED.includes(l)) return;
    lang = l;
    localStorage.setItem('kp_lang', l);
    // Update URL param so hreflang works correctly
    try {
      const url = new URL(location.href);
      if (l === 'en') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', l);
      }
      history.replaceState({}, '', url);
    } catch {}
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
      opt.addEventListener('click', () => window.kpI18n.switchLang(l));
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

  window.kpI18n = { init, switchLang, renderSwitcher, t, getLang: () => lang };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ══════════════════════════════════════════════════════════════════
     S06 — Language auto-suggest banner (STEP2)
     If the visitor's browser language differs from this page's <html lang>,
     they have never explicitly chosen a language (kp_lang unset), they have
     not already dismissed the offer, and the shell actually published a
     matching hreflang alternate — show a single-line "Read in <target>?"
     banner (localized in the TARGET language) that LINKS to the alternate
     URL. This is a suggestion, never an auto-redirect.
     Above-fold budget: when the banner shows it is mutually exclusive with
     the "Korea now" strip — it sets a shared flag (window.kpAboveFold) and
     hides #kp-korea-now for this session so only one above-fold widget runs.
     ══════════════════════════════════════════════════════════════════ */
  (function () {
    'use strict';
    try {
      var DISMISS_KEY = 'kp_langsuggest_dismissed_v1';
      // "Read in {lang}" phrased in the TARGET language; {L} = localized language name.
      var STR = {
        en: { msg: 'Read in {L}?', cta: 'Switch', close: 'Dismiss' },
        ko: { msg: '{L}(으)로 볼까요?', cta: '전환', close: '닫기' },
        ja: { msg: '{L}で読みますか？', cta: '切り替え', close: '閉じる' },
        zh: { msg: '用{L}阅读？', cta: '切换', close: '关闭' },
        es: { msg: '¿Leer en {L}?', cta: 'Cambiar', close: 'Cerrar' },
        fr: { msg: 'Lire en {L} ?', cta: 'Changer', close: 'Fermer' },
        de: { msg: 'Auf {L} lesen?', cta: 'Wechseln', close: 'Schließen' },
        pt: { msg: 'Ler em {L}?', cta: 'Mudar', close: 'Fechar' },
        id: { msg: 'Baca dalam {L}?', cta: 'Ganti', close: 'Tutup' },
        ar: { msg: 'هل تريد القراءة بـ{L}؟', cta: 'تبديل', close: 'إغلاق' },
        hi: { msg: '{L} में पढ़ें?', cta: 'बदलें', close: 'बंद करें' },
        ru: { msg: 'Читать на {L}?', cta: 'Переключить', close: 'Закрыть' },
        vi: { msg: 'Đọc bằng {L}?', cta: 'Chuyển', close: 'Đóng' },
        th: { msg: 'อ่านเป็น{L}?', cta: 'สลับ', close: 'ปิด' }
      };

      function dismissed() { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; } }
      function setDismissed() { try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {} }
      function hasChosen() { try { return !!localStorage.getItem('kp_lang'); } catch (e) { return false; } }

      // Find a published hreflang alternate whose base lang matches the target.
      function findAlternate(target) {
        var links = document.querySelectorAll('link[rel="alternate"][hreflang]');
        for (var i = 0; i < links.length; i++) {
          var hl = (links[i].getAttribute('hreflang') || '').slice(0, 2).toLowerCase();
          if (hl === target && links[i].href) return links[i].href;
        }
        return null;
      }

      function suggest() {
        if (document.getElementById('kp-langsuggest')) return;      // mount guard
        if (hasChosen() || dismissed()) return;                     // explicit choice / already declined
        var pageLang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
        var nav = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
        if (!nav || nav === pageLang) return;                       // already in browser language
        if (SUPPORTED.indexOf(nav) === -1) return;                  // we don't support it → no offer
        // Also skip if a ?lang param is present (visitor arrived via an explicit link)
        try { if (new URLSearchParams(location.search).get('lang')) return; } catch (e) {}
        var href = findAlternate(nav);
        if (!href) return;                                          // no reciprocal alternate → nothing to link to

        var s = STR[nav] || STR.en;
        var langName = (LABELS[nav] && LABELS[nav].name) || nav.toUpperCase();
        var flag = (LABELS[nav] && LABELS[nav].flag) || '🌐';
        var rtl = RTL.indexOf(nav) !== -1;

        var bar = document.createElement('div');
        bar.id = 'kp-langsuggest';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Language suggestion');
        bar.setAttribute('lang', nav);
        if (rtl) bar.setAttribute('dir', 'rtl');
        bar.style.cssText = [
          'display:flex', 'align-items:center', 'gap:10px', 'flex-wrap:wrap',
          'min-height:40px', 'box-sizing:border-box',
          'margin:0 0 12px', 'padding:8px 12px',
          'font-size:14px', 'line-height:1.4',
          'background:var(--card,rgba(255,255,255,.05))',
          'border:1px solid var(--border,rgba(255,255,255,.12))',
          'border-radius:10px', 'color:var(--text,inherit)'
        ].join(';');

        var label = document.createElement('span');
        label.style.cssText = 'flex:1 1 auto;min-width:0';
        label.textContent = flag + ' ' + s.msg.replace('{L}', langName);

        var go = document.createElement('a');
        go.href = href;
        go.textContent = s.cta;
        go.style.cssText = [
          'flex:0 0 auto', 'text-decoration:none', 'font-weight:700', 'font-size:13px',
          'padding:6px 12px', 'border-radius:999px',
          'background:var(--accent2,#74b9ff)', 'color:#001',
          'white-space:nowrap'
        ].join(';');
        // Persist the choice so the destination page doesn't re-offer, then let the
        // link navigate normally (NOT a JS redirect — the href is the real target).
        go.addEventListener('click', function () {
          try { localStorage.setItem('kp_lang', nav); } catch (e) {}
        });

        var close = document.createElement('button');
        close.type = 'button';
        close.setAttribute('aria-label', s.close);
        close.title = s.close;
        close.textContent = '×';
        close.style.cssText = [
          'flex:0 0 auto', 'background:transparent', 'border:0', 'cursor:pointer',
          'font-size:20px', 'line-height:1', 'padding:2px 6px',
          'color:var(--text2,#aab)'
        ].join(';');
        close.addEventListener('click', function () {
          setDismissed();
          if (bar.parentNode) bar.parentNode.removeChild(bar);
        });

        bar.appendChild(label);
        bar.appendChild(go);
        bar.appendChild(close);

        // Above-fold budget: this banner is mutually exclusive with "Korea now".
        // Set a shared flag (so korea-now can bow out if it checks) and defensively
        // hide the strip for this session — only one above-fold widget renders.
        try { window.kpAboveFold = window.kpAboveFold || {}; window.kpAboveFold.claimed = 'langsuggest'; } catch (e) {}
        var kn = document.getElementById('kp-korea-now');
        if (kn) kn.style.display = 'none';

        // Mount above the fold: before the hero-adjacent TLDR slot if present,
        // else at the top of <main>/<article>, else top of body.
        var anchor = document.getElementById('kp-tldr')
          || document.querySelector('main article')
          || document.querySelector('article')
          || document.querySelector('main');
        if (anchor && anchor.parentNode) {
          anchor.parentNode.insertBefore(bar, anchor);
        } else {
          document.body.insertBefore(bar, document.body.firstChild);
        }
      }

      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', suggest);
      else suggest();
    } catch (e) { /* no-op */ }
  })();
})();
