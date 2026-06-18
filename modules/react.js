/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — "Was this helpful?" reactions (element ⑧: UGC / social proof)
   No free text (no moderation). Posts a 👍/👎 to the Worker (KV-backed, 1 vote
   per IP per page / 30d); localStorage also blocks re-voting in the UI.
   Localized per <html lang>. Fallback-quiet if the endpoint is unavailable.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var WORKER = (typeof window !== 'undefined' && window.WORKER_URL) ||
    'https://koreaplus-webapp.jeybeeicon.workers.dev';
  var L = {
    en: { q: 'Was this helpful?', t: 'Thanks for the feedback!' },
    ko: { q: '도움이 되셨나요?', t: '피드백 감사합니다!' },
    ja: { q: 'お役に立ちましたか？', t: 'フィードバックありがとうございます！' },
    zh: { q: '这有帮助吗？', t: '感谢您的反馈！' },
    es: { q: '¿Te ha resultado útil?', t: '¡Gracias por tu opinión!' },
    fr: { q: 'Cet article vous a-t-il aidé ?', t: 'Merci pour votre retour !' },
    de: { q: 'War das hilfreich?', t: 'Danke für dein Feedback!' },
    pt: { q: 'Isto foi útil?', t: 'Obrigado pelo feedback!' },
    id: { q: 'Apakah ini membantu?', t: 'Terima kasih atas masukannya!' }
  };
  function lang() { return (document.documentElement.lang || 'en').slice(0, 2); }
  function slug() { return location.pathname.replace(/^\/guide\//, '').replace(/^\//, '') || 'home'; }
  function lsKey() { return 'kp_react_' + slug(); }

  function go() {
    var el = document.getElementById('kp-react');
    if (!el) return;
    var t = L[lang()] || L.en, sl = slug();
    var voted = (function () { try { return localStorage.getItem(lsKey()); } catch (e) { return null; } })();

    function draw(up, down, done) {
      var bs = 'padding:6px 14px;border-radius:999px;border:1px solid var(--border,rgba(255,255,255,.18));background:var(--card,rgba(255,255,255,.05));color:inherit;font-size:14px;cursor:pointer';
      var dis = (voted || done) ? ' disabled style="' + bs + ';opacity:.55;cursor:default"' : ' style="' + bs + '"';
      el.innerHTML = '<span style="font-weight:600">' + t.q + '</span>' +
        '<button data-v="up" aria-label="helpful"' + dis + '>👍 <b>' + (up || 0) + '</b></button>' +
        '<button data-v="down" aria-label="not helpful"' + dis + '>👎 <b>' + (down || 0) + '</b></button>' +
        ((voted || done) ? '<span style="color:var(--text3,#8a93a0)">' + t.t + '</span>' : '');
      el.style.display = 'flex';
      if (!voted && !done) el.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { vote(b.getAttribute('data-v')); });
      });
    }
    function vote(v) {
      try { localStorage.setItem(lsKey(), v); } catch (e) { /* ignore */ }
      fetch(WORKER + '/api/react?slug=' + encodeURIComponent(sl), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ v: v })
      }).then(function (r) { return r.json(); }).then(function (c) { draw(c.up, c.down, true); }).catch(function () { draw(0, 0, true); });
    }
    fetch(WORKER + '/api/react?slug=' + encodeURIComponent(sl))
      .then(function (r) { return r.json(); })
      .then(function (c) { draw(c.up, c.down); })
      .catch(function () { draw(0, 0); }); // still show the widget (0 counts) so users can vote
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
