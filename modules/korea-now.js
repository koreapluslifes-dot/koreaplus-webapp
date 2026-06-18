/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — "Korea Now" live strip (element ③: real-time authority)
   Shows live Seoul weather + air quality (PM2.5) + KRW exchange rate via the
   Worker. Weather/FX work today; air quality appears once AIRKOREA_API_KEY is
   set (graceful — the segment is simply omitted until then). Localized per the
   page's <html lang>. One lazy fetch; values are KV-cached on the Worker.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var WORKER = (typeof window !== 'undefined' && window.WORKER_URL) ||
    'https://koreaplus-webapp.jeybeeicon.workers.dev';
  var LBL = {
    en: { now: 'Korea now', air: 'Air' }, ko: { now: '실시간 한국', air: '미세먼지' },
    ja: { now: '今の韓国', air: '大気' }, zh: { now: '此刻韩国', air: '空气' },
    es: { now: 'Corea ahora', air: 'Aire' }, fr: { now: 'Corée en direct', air: 'Air' },
    de: { now: 'Korea jetzt', air: 'Luft' }, pt: { now: 'Coreia agora', air: 'Ar' },
    id: { now: 'Korea sekarang', air: 'Udara' }
  };
  var GRADE = {
    en: { good: 'Good', moderate: 'Moderate', unhealthy: 'Unhealthy', very_unhealthy: 'Very unhealthy', hazardous: 'Hazardous' },
    ko: { good: '좋음', moderate: '보통', unhealthy: '나쁨', very_unhealthy: '매우 나쁨', hazardous: '위험' },
    ja: { good: '良好', moderate: '普通', unhealthy: '悪い', very_unhealthy: '非常に悪い', hazardous: '危険' },
    zh: { good: '优', moderate: '良', unhealthy: '差', very_unhealthy: '很差', hazardous: '危险' },
    es: { good: 'Buena', moderate: 'Moderada', unhealthy: 'Mala', very_unhealthy: 'Muy mala', hazardous: 'Peligrosa' },
    fr: { good: 'Bon', moderate: 'Modéré', unhealthy: 'Mauvais', very_unhealthy: 'Très mauvais', hazardous: 'Dangereux' },
    de: { good: 'Gut', moderate: 'Mäßig', unhealthy: 'Schlecht', very_unhealthy: 'Sehr schlecht', hazardous: 'Gefährlich' },
    pt: { good: 'Boa', moderate: 'Moderada', unhealthy: 'Ruim', very_unhealthy: 'Muito ruim', hazardous: 'Perigosa' },
    id: { good: 'Baik', moderate: 'Sedang', unhealthy: 'Buruk', very_unhealthy: 'Sangat buruk', hazardous: 'Berbahaya' }
  };
  function lang() { return (document.documentElement.lang || 'en').slice(0, 2); }
  function num(n) { return Math.round(n).toLocaleString(); }

  function go() {
    var el = document.getElementById('kp-korea-now');
    if (!el) return;
    var L = lang(), t = LBL[L] || LBL.en, gr = GRADE[L] || GRADE.en;
    var jx = function (r) { return r.ok ? r.json() : null; };
    Promise.allSettled([
      fetch(WORKER + '/api/weather?city=Seoul').then(jx),
      fetch(WORKER + '/api/exchange').then(jx),
      fetch(WORKER + '/api/airquality?city=Seoul').then(jx)
    ]).then(function (res) {
      var w = res[0].value && res[0].value.data;
      var fx = res[1].value && res[1].value.data;
      var aq = res[2].value && res[2].value.data;
      var html = '<b>🇰🇷 ' + t.now + '</b>';
      if (w && w.temp != null) html += ' <span>' + (w.conditionEmoji || '') + ' Seoul ' + Math.round(w.temp) + '°</span>';
      if (aq && aq.pm25 != null) html += ' <span>🌫️ ' + t.air + ': ' + (gr[aq.pm25Grade] || aq.pm25Grade) + '</span>';
      if (fx && fx.usdToKrw) html += ' <span>💱 ₩' + num(fx.usdToKrw) + ' / $1</span>';
      if (html.indexOf('<span>') === -1) return; // nothing live → stay hidden
      el.innerHTML = html;
      el.style.display = 'flex';
    }).catch(function () { /* stay hidden */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
