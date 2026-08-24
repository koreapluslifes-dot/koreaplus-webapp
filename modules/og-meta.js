/* KoreaPlus Guide — sync og:image / twitter:image to the active locale.
   Loaded synchronously in <head> (no defer) so ?lang= URLs pick the right
   square card before social crawlers snapshot the page. */
(function () {
  'use strict';
  var ORIGIN = 'https://koreaplus-lifes.com';
  var LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];
  var OGLC = {
    en: 'en_US', ko: 'ko_KR', ja: 'ja_JP', zh: 'zh_CN', es: 'es_ES',
    fr: 'fr_FR', de: 'de_DE', pt: 'pt_BR', id: 'id_ID'
  };

  function detectLang() {
    try {
      var m = location.search.match(/[?&]lang=(\w{2})/);
      if (m && LANGS.indexOf(m[1]) !== -1) return m[1];
    } catch (e) { /* no-op */ }
    return 'en';
  }

  function setMeta(sel, val) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.setAttribute('content', val);
  }

  function ensureMeta(attr, key, val) {
    var sel = attr === 'property'
      ? 'meta[property="' + key + '"]'
      : 'meta[name="' + key + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  }

  function apply(lang) {
    if (LANGS.indexOf(lang) === -1) lang = 'en';
    var img = ORIGIN + '/guide/og/guide-og-' + lang + '.png';
    ensureMeta('property', 'og:image', img);
    ensureMeta('property', 'og:image:secure_url', img);
    ensureMeta('property', 'og:image:width', '1200');
    ensureMeta('property', 'og:image:height', '1200');
    ensureMeta('property', 'og:image:type', 'image/png');
    ensureMeta('name', 'twitter:image', img);
    ensureMeta('name', 'twitter:card', 'summary');
    if (OGLC[lang]) ensureMeta('property', 'og:locale', OGLC[lang]);
  }

  var lang = detectLang();
  apply(lang);
  window.kpOgMeta = { apply: apply, detectLang: detectLang, LANGS: LANGS };
})();
