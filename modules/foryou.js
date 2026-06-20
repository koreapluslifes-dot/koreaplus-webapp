/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — "For you" personalization (cross-domain: e-commerce recs)
   Records visited guide pages in localStorage and renders, near the page
   end, a "Recently viewed" rail + "You might also like" picks (top guides
   the visitor hasn't seen yet). Drives pages/session + return visits.
   Localized heading per <html lang>. Fully client-side, fallback-quiet.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var KEY = 'kp_seen_v1', MAX = 8;
  var LBL = {
    en: { r: '🕘 Recently viewed', y: '✨ You might also like' },
    ko: { r: '🕘 최근 본 가이드', y: '✨ 이런 가이드는 어때요' },
    ja: { r: '🕘 最近見たガイド', y: '✨ こちらもおすすめ' },
    zh: { r: '🕘 最近浏览', y: '✨ 你可能也喜欢' },
    es: { r: '🕘 Visto recientemente', y: '✨ También te puede gustar' },
    fr: { r: '🕘 Vus récemment', y: '✨ À découvrir aussi' },
    de: { r: '🕘 Zuletzt angesehen', y: '✨ Das könnte dir gefallen' },
    pt: { r: '🕘 Vistos recentemente', y: '✨ Você também pode gostar' },
    id: { r: '🕘 Baru dilihat', y: '✨ Mungkin Anda suka' }
  };
  // Curated high-value pool (relative to /guide/). Shown as "you might also like".
  var POOL = [
    ['📍 Things to Do in Seoul', 'guide/things-to-do-in-seoul.html'],
    ['📍 Things to Do in Busan', 'guide/things-to-do-in-busan.html'],
    ['📍 Things to Do in Jeju', 'guide/things-to-do-in-jeju.html'],
    ['🗺️ 7-Day Korea Itinerary', 'itinerary/first-time-korea-7-day-itinerary.html'],
    ['🗓️ Best Time to Visit Korea', 'faq/best-time-to-visit-korea.html'],
    ['💰 Korea Trip Cost Index', 'guide/korea-travel-cost-index.html'],
    ['🛂 Korea Visa & K-ETA', 'guide/korea-visa-k-eta-guide.html'],
    ['🧩 Which City Quiz', 'quiz.html'],
    ['✅ Korea Bucket List', 'bucket-list.html'],
    ['⚖️ Compare Korean Cities', 'compare.html']
  ];
  function lang() { return (document.documentElement.lang || 'en').slice(0, 2); }
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function pathKey() { return location.pathname.replace(/^\/guide\//, '').replace(/^\//, ''); }

  function record() {
    try {
      var h = read(), here = pathKey(), title = (document.querySelector('h1') || {}).textContent || document.title;
      // only record real guide/content pages
      if (!here || here === 'quiz.html') { /* still ok to record */ }
      h = h.filter(function (x) { return x.u !== here; });
      h.unshift({ u: here, t: (title || '').replace(/\s+\|\s*KoreaPlus.*$/, '').slice(0, 60) });
      localStorage.setItem(KEY, JSON.stringify(h.slice(0, MAX)));
    } catch (e) { /* ignore */ }
  }
  function chip(href, label) {
    return '<a href="' + href + '" style="display:inline-block;background:var(--card,rgba(255,255,255,.05));border:1px solid var(--border,rgba(255,255,255,.1));border-radius:999px;padding:8px 14px;font-size:13px;color:var(--accent2,#74b9ff);text-decoration:none;white-space:nowrap">' + label + '</a>';
  }
  function go() {
    var el = document.getElementById('kp-foryou');
    if (!el) return;
    var t = LBL[lang()] || LBL.en, here = pathKey();
    var seen = read().filter(function (x) { return x.u !== here; });
    var html = '';
    if (seen.length) html += '<div style="margin-bottom:14px"><div style="font-weight:700;font-size:13px;color:var(--text2,#aab);margin-bottom:8px">' + t.r + '</div><div style="display:flex;flex-wrap:wrap;gap:8px">' + seen.slice(0, 6).map(function (x) { return chip(x.u, x.t || x.u); }).join('') + '</div></div>';
    var seenU = {}; read().forEach(function (x) { seenU[x.u] = 1; }); seenU[here] = 1;
    var recs = POOL.filter(function (p) { return !seenU[p[1]]; }).slice(0, 6);
    if (recs.length) html += '<div><div style="font-weight:700;font-size:13px;color:var(--text2,#aab);margin-bottom:8px">' + t.y + '</div><div style="display:flex;flex-wrap:wrap;gap:8px">' + recs.map(function (p) { return chip(p[1], p[0]); }).join('') + '</div></div>';
    if (!html) return;
    el.innerHTML = html;
    el.style.display = 'block';
  }
  record();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
