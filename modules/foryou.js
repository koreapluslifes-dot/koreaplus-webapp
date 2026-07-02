/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — "For you" personalization (cross-domain: e-commerce recs)
   Records visited guide pages in localStorage and renders, near the page
   end, a "Recently viewed" rail + "You might also like" picks (top guides
   the visitor hasn't seen yet). Drives pages/session + return visits.
   Localized heading per <html lang>. Fully client-side, fallback-quiet.

   STEP2 extensions (this file only — no new module):
     • S05 Interest re-ordering — derive decayed tag weights from URL
       segments + kp_seen_v1 history into kp_int_v1, then re-rank POOL so
       "You might also like" leads with the visitor's strongest interests.
       Falls back to the original POOL order when there is no signal.
     • S07 "Continue your Korea trip" — if a trip signal exists
       (kp_trip_v1 saved places / kp_itinerary / a detected top city) we
       prepend ONE resume card into the shared '.kp-nextsteps' container.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var KEY = 'kp_seen_v1', INT = 'kp_int_v1', MAX = 8;
  var LBL = {
    en: { r: '🕘 Recently viewed', y: '✨ You might also like', trip: '🧳 Continue your Korea trip', resume: 'Pick up where you left off' },
    ko: { r: '🕘 최근 본 가이드', y: '✨ 이런 가이드는 어때요', trip: '🧳 여행 이어서 계획하기', resume: '멈춘 곳부터 이어가기' },
    ja: { r: '🕘 最近見たガイド', y: '✨ こちらもおすすめ', trip: '🧳 韓国旅行を続ける', resume: '続きから再開' },
    zh: { r: '🕘 最近浏览', y: '✨ 你可能也喜欢', trip: '🧳 继续规划你的韩国之旅', resume: '从上次的地方继续' },
    es: { r: '🕘 Visto recientemente', y: '✨ También te puede gustar', trip: '🧳 Continúa tu viaje a Corea', resume: 'Retoma donde lo dejaste' },
    fr: { r: '🕘 Vus récemment', y: '✨ À découvrir aussi', trip: '🧳 Continuez votre voyage en Corée', resume: 'Reprenez où vous en étiez' },
    de: { r: '🕘 Zuletzt angesehen', y: '✨ Das könnte dir gefallen', trip: '🧳 Korea-Reise fortsetzen', resume: 'Dort weitermachen, wo du aufgehört hast' },
    pt: { r: '🕘 Vistos recentemente', y: '✨ Você também pode gostar', trip: '🧳 Continue sua viagem à Coreia', resume: 'Retome de onde parou' },
    id: { r: '🕘 Baru dilihat', y: '✨ Mungkin Anda suka', trip: '🧳 Lanjutkan perjalanan Korea Anda', resume: 'Lanjutkan dari terakhir' }
  };
  // Curated high-value pool (relative to /guide/). Shown as "you might also like".
  // tags[] feed the S05 interest re-ranker (matched against URL segments + history).
  var POOL = [
    ['📍 Things to Do in Seoul', 'guide/things-to-do-in-seoul.html', ['seoul', 'things', 'city', 'sightseeing']],
    ['📍 Things to Do in Busan', 'guide/things-to-do-in-busan.html', ['busan', 'things', 'city', 'sightseeing']],
    ['📍 Things to Do in Jeju', 'guide/things-to-do-in-jeju.html', ['jeju', 'things', 'city', 'nature']],
    ['🗺️ 7-Day Korea Itinerary', 'itinerary/first-time-korea-7-day-itinerary.html', ['itinerary', 'plan', 'trip', 'days']],
    ['🗓️ Best Time to Visit Korea', 'faq/best-time-to-visit-korea.html', ['season', 'weather', 'when', 'faq']],
    ['💰 Korea Trip Cost Index', 'guide/korea-travel-cost-index.html', ['cost', 'budget', 'money', 'trip']],
    ['🛂 Korea Visa & K-ETA', 'guide/korea-visa-k-eta-guide.html', ['visa', 'keta', 'entry', 'faq']],
    ['🧩 Which City Quiz', 'quiz.html', ['quiz', 'city', 'fun']],
    ['✅ Korea Bucket List', 'bucket-list.html', ['bucket', 'things', 'fun']],
    ['⚖️ Compare Korean Cities', 'compare.html', ['compare', 'city', 'plan']]
  ];
  function lang() { return (document.documentElement.lang || 'en').slice(0, 2); }
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function pathKey() { return location.pathname.replace(/^\/guide\//, '').replace(/^\//, ''); }

  /* ── S05 interest model ─────────────────────────────────────────────
     Split the current path into meaningful segments, then fold them (plus
     every recorded history slug) into a time-decayed weight map kp_int_v1.
     Each visit multiplies existing weights by 0.85 (recency decay) and adds
     +1 for the segments seen now, so long-standing interests fade unless
     revisited. rankPool() sorts POOL by summed weight of its tags. */
  function segs(u) {
    return String(u || '').toLowerCase()
      .replace(/\.html?$/, '').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
      .filter(function (s) { return s.length >= 3 && s !== 'html' && s !== 'guide' && s !== 'www'; });
  }
  function readInt() { try { return JSON.parse(localStorage.getItem(INT)) || {}; } catch (e) { return {}; } }
  function bumpInterests() {
    try {
      var w = readInt();
      Object.keys(w).forEach(function (k) { w[k] = w[k] * 0.85; if (w[k] < 0.05) delete w[k]; }); // decay
      segs(pathKey()).forEach(function (s) { w[s] = (w[s] || 0) + 1; });
      localStorage.setItem(INT, JSON.stringify(w));
    } catch (e) { /* ignore */ }
  }
  function rankPool(pool) {
    var w = readInt(), any = false;
    for (var k in w) { if (w[k] > 0) { any = true; break; } }
    if (!any) return pool.slice(); // no signal → original curated order
    var scored = pool.map(function (p, i) {
      var s = 0, tags = p[2] || [];
      for (var j = 0; j < tags.length; j++) s += (w[tags[j]] || 0);
      return { p: p, s: s, i: i };
    });
    scored.sort(function (a, b) { return (b.s - a.s) || (a.i - b.i); }); // stable, keep curated order on ties
    return scored.map(function (x) { return x.p; });
  }
  /* Best-guess top city from accumulated interest weights (S07 signal). */
  var CITY_GUIDE = { seoul: 'guide/things-to-do-in-seoul.html', busan: 'guide/things-to-do-in-busan.html', jeju: 'guide/things-to-do-in-jeju.html' };
  function topCity() {
    var w = readInt(), best = null, bv = 0;
    ['seoul', 'busan', 'jeju'].forEach(function (c) { if ((w[c] || 0) > bv) { bv = w[c]; best = c; } });
    return bv > 0 ? best : null;
  }

  function read2() { try { return JSON.parse(localStorage.getItem('kp_trip_v1')) || null; } catch (e) { return null; } }

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
    // S05: rank the curated pool by the visitor's interest weights, then filter seen.
    var recs = rankPool(POOL).filter(function (p) { return !seenU[p[1]]; }).slice(0, 6);
    if (recs.length) html += '<div><div style="font-weight:700;font-size:13px;color:var(--text2,#aab);margin-bottom:8px">' + t.y + '</div><div style="display:flex;flex-wrap:wrap;gap:8px">' + recs.map(function (p) { return chip(p[1], p[0]); }).join('') + '</div></div>';
    if (!html) return;
    el.innerHTML = html;
    el.style.display = 'block';
  }

  /* ── S07: "Continue your Korea trip" card in the shared .kp-nextsteps ──
     Fires only when a real trip signal exists. Prefers a saved-places /
     itinerary planner resume; otherwise links to the strongest city guide.
     Prepends exactly one <section>, un-hides the container, guards against
     double-mount, and never touches the confirmed UX / other owners. */
  function continueTrip() {
    try {
      var ns = document.querySelector('.kp-nextsteps');
      if (!ns || ns.querySelector('[data-kp-ns="trip"]')) return; // no host / already mounted
      var t = LBL[lang()] || LBL.en;
      var trip = read2();
      var hasPlan = false;
      try { hasPlan = !!localStorage.getItem('kp_itinerary'); } catch (e) {}
      var savedPlaces = trip && Array.isArray(trip.places) ? trip.places.length : 0;
      var savedTrips = trip && Array.isArray(trip.itineraries) ? trip.itineraries.length : 0;
      var city = topCity();
      // Require a genuine signal — otherwise fall back to the existing order (no card).
      if (!hasPlan && !savedPlaces && !savedTrips && !city) return;

      var href, label;
      if (hasPlan || savedTrips || savedPlaces) { href = 'plan.html'; label = t.trip; }
      else { href = CITY_GUIDE[city] || 'plan.html'; label = t.trip; }

      var sec = document.createElement('section');
      sec.setAttribute('data-kp-ns', 'trip');
      sec.style.minHeight = '64px'; // reserve space → no CLS
      sec.innerHTML =
        '<p class="kp-ns-title">' + label + '</p>' +
        '<a href="' + href + '" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;text-decoration:none;' +
          'background:var(--card,rgba(255,255,255,.05));border:1px solid var(--border,rgba(255,255,255,.12));color:inherit">' +
          '<span style="font-size:26px;line-height:1" aria-hidden="true">🧭</span>' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-weight:800;font-size:15px">' + label + '</span>' +
            '<span style="display:block;font-size:13px;color:var(--text2,#8a93a0);margin-top:2px">' + t.resume + '</span>' +
          '</span>' +
          '<span style="font-size:18px;color:var(--accent2,#74b9ff)" aria-hidden="true">→</span>' +
        '</a>';
      // Prepend so the resume card leads the shared next-steps stack.
      ns.insertAdjacentElement('afterbegin', sec);
      if (ns.hasAttribute('hidden')) ns.removeAttribute('hidden'); // first item un-hides the container
    } catch (e) { /* ignore */ }
  }

  function boot() { go(); continueTrip(); }

  record();
  bumpInterests(); // S05: fold this visit into the interest model
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
