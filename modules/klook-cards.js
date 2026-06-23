/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — Klook activities widget loader for SEO pages (affiliate)
   Companion to the Agoda hotel block. The placeholder
   <aside class="kp-klook" data-klook="1"> … <div class="kp-klook-slot"> is
   emitted by build-seo.cjs ONLY on city guides + itineraries (one per page),
   so this stays tasteful, not excessive. The heading + FTC disclosure are
   baked server-side (dark-theme styled); here we LAZY-load Klook's iframe
   init script + inject the <ins> only when the block scrolls near the
   viewport. data-lang/data-currency are blank so Klook auto-localizes.

   NOTE: this is intentionally separate from modules/klook.js (the dispatch
   session's #kp-klook variant for hand-built light-theme pages) — we never
   touch that file. Different selectors (.kp-klook[data-klook] vs #kp-klook)
   mean the two never collide.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var slots = document.querySelectorAll('.kp-klook[data-klook="1"]');
  if (!slots.length) return;

  var scriptLoaded = false;
  function loadInitScript() {
    if (scriptLoaded) return;
    scriptLoaded = true;
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'https://affiliate.klook.com/widget/fetch-iframe-init.js';
    (document.body || document.documentElement).appendChild(s);
  }

  function fill(el) {
    if (el.getAttribute('data-klook') !== '1') return; // already filled
    el.setAttribute('data-klook', 'done');
    var slot = el.querySelector('.kp-klook-slot') || el;
    var ins = document.createElement('ins');
    ins.className = 'klk-aff-widget';
    // Per-page widget id: the block's data-adid (city-matched in build-seo.cjs);
    // fall back to the default Seoul/all-categories widget.
    var adid = el.getAttribute('data-adid') || '1310693';
    var attrs = {
      'data-adid': adid, 'data-lang': '', 'data-currency': '',
      'data-cardH': '126', 'data-padding': '92', 'data-lgH': '470',
      'data-edgeValue': '655', 'data-cid': '13', 'data-tid': '-1',
      'data-amount': '3', 'data-prod': 'dynamic_widget'
    };
    for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) ins.setAttribute(k, attrs[k]); }
    var a = document.createElement('a');
    a.href = '//www.klook.com/'; a.rel = 'sponsored noopener'; a.target = '_blank'; a.textContent = 'Klook.com';
    ins.appendChild(a);
    slot.appendChild(ins);
    // The init script scans for unconverted .klk-aff-widget each time it runs.
    // One block per page → loading once is sufficient.
    loadInitScript();
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '400px 0px' });
    Array.prototype.forEach.call(slots, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(slots, fill);
  }
})();
