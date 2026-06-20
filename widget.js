/* ══════════════════════════════════════════════════════════════════
   KoreaPlus embeddable widget (cross-domain: fintech/weather embeds)
   Any site can paste:
     <script src="https://koreaplus-lifes.com/guide/widget.js"
             data-kp="now" async></script>
   data-kp = "now" (live Korea weather+FX), "quiz" (city-match teaser) or
   "cost" (trip-cost teaser). Injects a compact card with a *visible backlink*
   to KoreaPlus → every embed is a real inbound link + referral traffic.
   Self-contained, no dependencies, theme-agnostic (light card).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var s = document.currentScript || (function () { var a = document.getElementsByTagName('script'); return a[a.length - 1]; })();
  if (!s) return;
  var type = (s.getAttribute('data-kp') || 'now').toLowerCase();
  var BASE = 'https://koreaplus-lifes.com/guide/';
  var WK = 'https://koreaplus-webapp.jeybeeicon.workers.dev';
  var UTM = '?utm_source=embed&utm_medium=widget&utm_campaign=' + type;

  var box = document.createElement('div');
  box.setAttribute('data-kp-widget', type);
  box.style.cssText = 'all:initial;display:block;box-sizing:border-box;max-width:340px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0e1f33;color:#eaf0f7;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px 18px;line-height:1.5;box-shadow:0 6px 24px rgba(0,0,0,.18)';
  function a(href, label, primary) {
    return '<a href="' + BASE + href + UTM + '" target="_blank" rel="noopener" style="all:unset;cursor:pointer;display:inline-block;margin-top:10px;' +
      (primary ? 'background:linear-gradient(135deg,#74b9ff,#ff6b9d);color:#06101d;font-weight:800;padding:9px 16px;border-radius:10px;' : 'color:#74b9ff;font-weight:700;') + 'font-size:13.5px">' + label + '</a>';
  }
  var brand = '<div style="margin-top:12px;font-size:10.5px;color:#8aa">🇰🇷 <a href="' + BASE + UTM + '" target="_blank" rel="noopener" style="all:unset;cursor:pointer;color:#8aa;text-decoration:underline">Powered by KoreaPlus</a></div>';

  function paint(inner) { box.innerHTML = inner + brand; }

  if (type === 'quiz') {
    paint('<div style="font-size:13px;color:#9fb0c3;font-weight:700;letter-spacing:.04em">KOREA TRAVEL QUIZ</div>' +
      '<div style="font-size:18px;font-weight:900;margin-top:4px">Which Korean city should you visit?</div>' +
      '<div style="font-size:13.5px;color:#9fb0c3;margin-top:6px">60-second quiz → your perfect match + free guide.</div>' +
      a('quiz.html', '🧩 Take the quiz →', true));
  } else if (type === 'cost') {
    paint('<div style="font-size:13px;color:#9fb0c3;font-weight:700;letter-spacing:.04em">KOREA TRIP COST</div>' +
      '<div style="font-size:18px;font-weight:900;margin-top:4px">How much does Korea cost?</div>' +
      '<div style="font-size:13.5px;color:#9fb0c3;margin-top:6px">Budget ~$70/day · Mid ~$150/day · Luxe $300+/day.</div>' +
      a('guide/korea-travel-cost-index.html', '💰 Full cost index →', true));
  } else { // "now"
    paint('<div style="font-size:13px;color:#9fb0c3;font-weight:700;letter-spacing:.04em">🇰🇷 KOREA NOW</div>' +
      '<div id="kpw-live" style="font-size:16px;font-weight:800;margin-top:6px">Loading live conditions…</div>' +
      a('index.html', 'Plan your Korea trip →', true));
    try {
      Promise.all([
        fetch(WK + '/api/weather?city=Seoul').then(function (r) { return r.ok ? r.json() : null; }),
        fetch(WK + '/api/exchange').then(function (r) { return r.ok ? r.json() : null; })
      ]).then(function (res) {
        var w = res[0] && res[0].data, fx = res[1] && res[1].data, parts = [];
        if (w && w.temp != null) parts.push((w.conditionEmoji || '🌡️') + ' Seoul ' + Math.round(w.temp) + '°');
        if (fx && fx.usdToKrw) parts.push('💱 ₩' + Math.round(fx.usdToKrw).toLocaleString() + '/$1');
        var live = document.getElementById('kpw-live');
        if (live) live.textContent = parts.length ? parts.join('  ·  ') : 'Your complete guide to Korea';
      }).catch(function () { var l = document.getElementById('kpw-live'); if (l) l.textContent = 'Your complete guide to Korea'; });
    } catch (e) { }
  }
  s.parentNode.insertBefore(box, s);
})();
