/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — reactions (element ⑧: UGC / social proof) — S17 extension
   Multi-emotion feedback (useful / learned / save-worthy / confusing),
   animated score count-up, and a "N people this week" social-proof badge.
   Reuses the existing #kp-react container + /api/react (KV) endpoint.
   Counts are KV-measured ONLY — the week badge is hidden when the server
   does not return a real measured count (never fabricated). One vote per
   IP per page / 30d (server-enforced); localStorage blocks re-voting in UI.
   Localized per <html lang> (9 langs). Fallback-quiet if endpoint is down.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    var WORKER = (typeof window !== 'undefined' && window.WORKER_URL) ||
      'https://koreaplus-webapp.jeybeeicon.workers.dev';

    // Emotions. `k` = vote key sent to the server & read back from counts.
    // legacy: 'useful' folds onto KV 'up', 'confusing' onto KV 'down', so the
    // binary counts already stored keep working before the worker STEP C ships.
    var EMO = [
      { k: 'useful',    icon: '👍', legacy: 'up' },
      { k: 'learned',   icon: '💡' },
      { k: 'saved',     icon: '🔖' },
      { k: 'confusing', icon: '😕', legacy: 'down' }
    ];

    var L = {
      en: { q: 'Was this helpful?', t: 'Thanks for the feedback!',
            useful: 'Useful', learned: 'Learned something', saved: 'Save-worthy', confusing: 'Confusing',
            week: function (n) { return n.toLocaleString() + ' people found this useful this week'; } },
      ko: { q: '도움이 되셨나요?', t: '피드백 감사합니다!',
            useful: '유용해요', learned: '배웠어요', saved: '저장각', confusing: '헷갈려요',
            week: function (n) { return '이번 주 ' + n.toLocaleString() + '명이 유용하다고 했어요'; } },
      ja: { q: 'お役に立ちましたか？', t: 'フィードバックありがとうございます！',
            useful: '役立つ', learned: '勉強になった', saved: '保存したい', confusing: 'わかりにくい',
            week: function (n) { return '今週 ' + n.toLocaleString() + '人が役立つと評価' ; } },
      zh: { q: '这有帮助吗？', t: '感谢您的反馈！',
            useful: '有用', learned: '学到了', saved: '值得收藏', confusing: '有点懵',
            week: function (n) { return '本周有 ' + n.toLocaleString() + ' 人觉得有用'; } },
      es: { q: '¿Te ha resultado útil?', t: '¡Gracias por tu opinión!',
            useful: 'Útil', learned: 'Aprendí algo', saved: 'Para guardar', confusing: 'Confuso',
            week: function (n) { return n.toLocaleString() + ' personas lo encontraron útil esta semana'; } },
      fr: { q: 'Cet article vous a-t-il aidé ?', t: 'Merci pour votre retour !',
            useful: 'Utile', learned: 'Appris', saved: 'À garder', confusing: 'Confus',
            week: function (n) { return n.toLocaleString() + ' personnes l\'ont trouvé utile cette semaine'; } },
      de: { q: 'War das hilfreich?', t: 'Danke für dein Feedback!',
            useful: 'Nützlich', learned: 'Was gelernt', saved: 'Merkenswert', confusing: 'Verwirrend',
            week: function (n) { return n.toLocaleString() + ' fanden es diese Woche nützlich'; } },
      pt: { q: 'Isto foi útil?', t: 'Obrigado pelo feedback!',
            useful: 'Útil', learned: 'Aprendi algo', saved: 'Vale salvar', confusing: 'Confuso',
            week: function (n) { return n.toLocaleString() + ' pessoas acharam útil esta semana'; } },
      id: { q: 'Apakah ini membantu?', t: 'Terima kasih atas masukannya!',
            useful: 'Berguna', learned: 'Belajar sesuatu', saved: 'Layak simpan', confusing: 'Membingungkan',
            week: function (n) { return n.toLocaleString() + ' orang merasa berguna minggu ini'; } }
    };

    function lang() { return (document.documentElement.lang || 'en').slice(0, 2); }
    function slug() { return location.pathname.replace(/^\/guide\//, '').replace(/^\//, '') || 'home'; }
    function lsKey() { return 'kp_react_' + slug(); }
    var REDUCED = false;
    try { REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    // read a measured count for an emotion, folding legacy up/down keys.
    function countOf(c, e) {
      if (!c) return 0;
      var v = c[e.k];
      if (typeof v !== 'number' && e.legacy) v = c[e.legacy];
      return (typeof v === 'number' && v >= 0) ? v : 0;
    }

    // animated count-up on a <b> element (reduced-motion → instant).
    function countUp(node, to) {
      to = to || 0;
      if (REDUCED || to <= 0) { node.textContent = to.toLocaleString(); return; }
      var start = 0, t0 = 0, dur = Math.min(900, 220 + to * 6);
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(start + (to - start) * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function go() {
      var el = document.getElementById('kp-react');
      if (!el || el.getAttribute('data-s17') === '1') return;
      el.setAttribute('data-s17', '1');
      var t = L[lang()] || L.en, sl = slug();
      var voted = (function () { try { return localStorage.getItem(lsKey()); } catch (e) { return null; } })();

      function draw(c, done) {
        c = c || {};
        var locked = !!(voted || done);
        var bs = 'display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;' +
          'border:1px solid var(--border,rgba(255,255,255,.18));background:var(--card,rgba(255,255,255,.05));' +
          'color:inherit;font-size:14px;line-height:1.2;cursor:pointer;transition:transform .12s ease';
        var html = '<span style="font-weight:600;margin-right:2px">' + t.q + '</span>' +
          '<span style="display:inline-flex;flex-wrap:wrap;gap:8px;align-items:center">';
        EMO.forEach(function (e) {
          var n = countOf(c, e);
          var dis = locked ? ' disabled style="' + bs + ';opacity:.6;cursor:default"' : ' style="' + bs + '"';
          html += '<button type="button" data-v="' + e.k + '" aria-label="' + (t[e.k] || e.k) + '"' + dis + '>' +
            '<span aria-hidden="true">' + e.icon + '</span>' +
            '<span>' + (t[e.k] || e.k) + '</span>' +
            '<b data-c="' + e.k + '" style="font-variant-numeric:tabular-nums;min-width:1ch">0</b>' +
          '</button>';
        });
        html += '</span>';
        if (locked) html += '<span style="color:var(--text3,#8a93a0)">' + t.t + '</span>';

        // "N people this week" social-proof badge — KV-measured only.
        // Shown ONLY when the server returns a real, sufficient weekly count.
        var wk = c.week;
        if (typeof wk === 'number' && wk >= 5) {
          html += '<span class="kp-react-week" style="flex-basis:100%;font-size:12.5px;color:var(--text3,#8a93a0);' +
            'display:inline-flex;align-items:center;gap:6px;margin-top:2px;min-height:18px">' +
            '<span aria-hidden="true">🔥</span><span data-week="' + wk + '">' + t.week(wk) + '</span></span>';
        }

        el.innerHTML = html;
        el.style.display = 'flex';

        // animate each count into place after paint
        EMO.forEach(function (e) {
          var b = el.querySelector('b[data-c="' + e.k + '"]');
          if (b) countUp(b, countOf(c, e));
        });

        if (!locked) el.querySelectorAll('button[data-v]').forEach(function (b) {
          b.addEventListener('click', function () { vote(b.getAttribute('data-v')); });
          b.addEventListener('pointerdown', function () { if (!REDUCED) b.style.transform = 'scale(.94)'; });
          b.addEventListener('pointerup', function () { b.style.transform = ''; });
          b.addEventListener('pointerleave', function () { b.style.transform = ''; });
        });
      }

      function vote(v) {
        try { localStorage.setItem(lsKey(), v); } catch (e) { /* ignore */ }
        fetch(WORKER + '/api/react?slug=' + encodeURIComponent(sl), {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ v: v })
        })
          .then(function (r) { return r.json(); })
          .then(function (c) { draw(c, true); })
          .catch(function () { draw({}, true); });
      }

      fetch(WORKER + '/api/react?slug=' + encodeURIComponent(sl))
        .then(function (r) { return r.json(); })
        .then(function (c) { draw(c); })
        .catch(function () { draw({}); }); // still show the widget so users can vote
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  } catch (e) { /* fallback-quiet */ }
})();
