/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — RUM (S20c) Real-User Monitoring, ultra-light.
   Measures Core Web Vitals (LCP / INP / CLS) with native PerformanceObserver
   (no library, ~1KB) and ships one JSON beacon to /api/rum on pagehide via
   navigator.sendBeacon — asynchronously, off the critical path.
   • Zero DOM output (no render, no .kp-nextsteps use) → cannot affect ads,
     layout, CLS, or any confirmed UX.
   • 10% client sampling (persisted per-session so a session is all-in/all-out).
   • Endpoint may not exist yet (STEP C adds worker /api/rum) → every failure
     is swallowed silently. Fully no-op on unsupported browsers.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    // ── no-op guards ───────────────────────────────────────────────
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;
    if (!navigator.sendBeacon) return;
    if (window.__kpRum) return;            // dup-mount guard
    window.__kpRum = 1;

    // Worker API lives on the workers.dev origin (same as react.js), NOT the
    // main domain — a relative '/api/rum' would hit the static WP host (200 HTML)
    // and silently drop the beacon.
    var ENDPOINT = (window.WORKER_URL || 'https://koreaplus-webapp.jeybeeicon.workers.dev') + '/api/rum';
    var SAMPLE = 0.10;                      // 10%

    // ── sampling decision, sticky per session ──────────────────────
    var sampled;
    try {
      var s = sessionStorage.getItem('kp_rum_s');
      if (s === null) { sampled = Math.random() < SAMPLE ? '1' : '0'; sessionStorage.setItem('kp_rum_s', sampled); }
      else sampled = s;
    } catch (e) { sampled = Math.random() < SAMPLE ? '1' : '0'; }
    if (sampled !== '1') return;

    // ── lang dimension (contract kp_lang order) ────────────────────
    var SUP = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id', 'vi', 'th', 'ru', 'ar', 'hi'];
    var lang;
    try {
      var qp = new URLSearchParams(location.search).get('lang');
      lang = qp || localStorage.getItem('kp_lang') || (navigator.language || 'en').slice(0, 2);
    } catch (e) { lang = 'en'; }
    if (SUP.indexOf(lang) === -1) lang = 'en';

    // ── metric accumulators ────────────────────────────────────────
    var lcp = 0, cls = 0, inp = 0, sent = false;
    var obs = [];

    function safeObserve(type, opts, cb) {
      try {
        var po = new PerformanceObserver(function (list) {
          try { cb(list.getEntries()); } catch (e) {}
        });
        po.observe(opts || { type: type, buffered: true });
        obs.push(po);
      } catch (e) {}
    }

    // LCP — keep the latest (largest) candidate
    safeObserve('largest-contentful-paint', { type: 'largest-contentful-paint', buffered: true }, function (ents) {
      for (var i = 0; i < ents.length; i++) {
        var v = ents[i].renderTime || ents[i].loadTime || ents[i].startTime || 0;
        if (v > lcp) lcp = v;
      }
    });

    // CLS — sum layout shifts without recent user input
    safeObserve('layout-shift', { type: 'layout-shift', buffered: true }, function (ents) {
      for (var i = 0; i < ents.length; i++) {
        if (!ents[i].hadRecentInput) cls += ents[i].value || 0;
      }
    });

    // INP — track the worst event-timing duration (interaction proxy)
    safeObserve('event', { type: 'event', buffered: true, durationThreshold: 40 }, function (ents) {
      for (var i = 0; i < ents.length; i++) {
        var d = ents[i].duration || 0;
        if (d > inp) inp = d;
      }
    });

    function nav() {
      try {
        var e = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        return e ? Math.round(e.type === 'reload' ? 1 : 0) : 0;
      } catch (x) { return 0; }
    }

    function flush() {
      if (sent) return;
      sent = true;
      try { obs.forEach(function (p) { try { p.disconnect(); } catch (e) {} }); } catch (e) {}
      var payload = {
        u: location.pathname,
        lang: lang,
        lcp: Math.round(lcp),
        inp: Math.round(inp),
        cls: Math.round(cls * 1000) / 1000,
        vw: window.innerWidth || 0,
        ts: Date.now(),
        v: 1
      };
      try {
        var body = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(ENDPOINT, body);   // fire-and-forget; missing endpoint fails silently
      } catch (e) {}
    }

    // Flush on the first backgrounding / unload — most reliable for RUM.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flush();
    }, { capture: true });
    window.addEventListener('pagehide', flush, { capture: true });
  } catch (e) {}
})();
