/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — Read next (readnext.js)  [STEP2 · S04]
   Fetches related.json (built by build-seo) and appends the current
   page's same-origin related guides (top 3–4) as one <section> inside
   the shared '.kp-nextsteps' container. First module to add an item
   un-hides the container. Section label localizes across 14 languages;
   link titles come from related.json (SEO-derived, English). No-op when
   the container is absent, the page has no related entry, or on error.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    var host = document.querySelector('.kp-nextsteps');
    if (!host) return;                                   // no-op: no container
    if (host.querySelector('[data-kp-readnext]')) return; // dup-mount guard

    // ── language (STEP0 kp_lang contract) ─────────────────────────────
    var qs = '';
    try { qs = new URLSearchParams(location.search).get('lang') || ''; } catch (e) {}
    var ls = '';
    try { ls = localStorage.getItem('kp_lang') || ''; } catch (e) {}
    var nav = (navigator.language || 'en').slice(0, 2);
    var lang = (qs || ls || nav || 'en').slice(0, 2);
    var SUP = { en:1, ko:1, ja:1, zh:1, es:1, fr:1, de:1, pt:1, id:1, vi:1, th:1, ru:1, ar:1, hi:1 };
    if (!SUP[lang]) lang = 'en';

    var STR = {
      en: 'Read next',
      ko: '다음 읽을거리',
      ja: '次に読む',
      zh: '接下来阅读',
      es: 'Leer a continuación',
      fr: 'À lire ensuite',
      de: 'Als Nächstes lesen',
      pt: 'Leia a seguir',
      id: 'Baca berikutnya',
      vi: 'Đọc tiếp',
      th: 'อ่านต่อ',
      ru: 'Читать далее',
      ar: 'اقرأ التالي',
      hi: 'आगे पढ़ें'
    };
    var title = STR[lang] || STR.en;

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function mount(items) {
      if (!items || !items.length) return;               // no-op: nothing related
      // guard again in case of a race with another async caller
      if (host.querySelector('[data-kp-readnext]')) return;

      var links = items.slice(0, 4).map(function (it) {
        var href = esc(it && it.url);
        var label = esc((it && it.title) || (it && it.url) || '');
        return '<li style="margin:0"><a href="' + href + '" style="color:var(--accent2,#74b9ff);text-decoration:none;line-height:1.6;display:block;padding:4px 0">' + label + '</a></li>';
      }).join('');

      var sec = document.createElement('section');
      sec.setAttribute('data-kp-readnext', '1');
      // reserve space to limit CLS (title + up to 4 rows)
      sec.style.minHeight = '112px';
      sec.innerHTML =
        '<p class="kp-ns-title">📖 ' + esc(title) + '</p>' +
        '<ul style="list-style:none;margin:0;padding:0">' + links + '</ul>';

      // first item into the shared container un-hides it
      if (host.hidden) host.hidden = false;
      host.insertAdjacentHTML('beforeend', sec.outerHTML);
    }

    // Current page path is the related.json key (keys are "/guide/*.html").
    var key = location.pathname;

    fetch('/guide/related.json', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (map) {
        if (!map) return;
        var items = map[key];
        if (!items && /\/index\.html$/.test(key)) items = map[key.replace(/index\.html$/, '')];
        mount(items);
      })
      .catch(function () { /* no-op on error */ });
  } catch (e) { /* no-op */ }
})();
