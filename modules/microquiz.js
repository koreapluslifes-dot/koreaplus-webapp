/* ══════════════════════════════════════════════════════════════════
   modules/microquiz.js — micro decision-quiz (STEP2 · S16)

   Detects the current page's category from its URL slug + <h1> text
   (visa · city · food · season · transport · kpop · budget · generic),
   then renders a 2-question mini yes-no/choice picker into the shared
   '.kp-nextsteps' container. The result deterministically surfaces the
   most relevant internal links — pulled from related.json for THIS page
   (reused, no new data) with a curated per-category fallback.

   STEP0 contract:
   • appends ONE direct-child <section> to '.kp-nextsteps'
     via insertAdjacentHTML('beforeend', …); removes [hidden] if it is
     the first item; no own border (feature.css handles it); section
     heading uses <p class="kp-ns-title">.
   • dup-mount guard via data-kp-microquiz.
   • no-op when '.kp-nextsteps' is absent OR no category matches.
   • CLS-safe: reserves min-height on the widget body.
   • reduced-motion respected (no animated transitions).
   • ad-safe / above-fold untouched (mounts below </article>).

   Body wording (questions/choices/result copy) is localized in 9 SEO
   languages via modules/microquiz-l10n.js (window.KP_MICROQUIZ_L10N),
   which this module injects on demand. The widget CHROME (title etc.)
   also has a 14-language inline STR fallback below.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    var host = document.querySelector('.kp-nextsteps');
    if (!host) return;                                   // no-op: no container
    if (host.querySelector('[data-kp-microquiz]')) return; // dup guard

    var SUP = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id',
               'it', 'ru', 'th', 'vi', 'ar'];            // 14 languages
    function pickLang() {
      var q = '';
      try { q = new URLSearchParams(location.search).get('lang') || ''; } catch (e) {}
      var ls = '';
      try { ls = localStorage.getItem('kp_lang') || ''; } catch (e) {}
      var nav = (navigator.language || 'en').slice(0, 2);
      var raw = (q || ls || nav || 'en').slice(0, 2);
      return SUP.indexOf(raw) >= 0 ? raw : 'en';
    }
    var lang = pickLang();

    /* ── 14-language CHROME strings (title / prompts / buttons) ────── */
    var STR = {
      en: { title: 'Quick picker', pick: 'Pick one', see: 'See picks', restart: 'Start over', result: 'Based on your answers' },
      ko: { title: '빠른 추천', pick: '선택하세요', see: '추천 보기', restart: '다시 하기', result: '답변을 바탕으로' },
      ja: { title: 'かんたん診断', pick: '選んでください', see: '結果を見る', restart: '最初から', result: 'あなたの回答から' },
      zh: { title: '快速测测', pick: '请选择', see: '查看推荐', restart: '重新开始', result: '根据你的选择' },
      es: { title: 'Elige rápido', pick: 'Elige una', see: 'Ver opciones', restart: 'Empezar de nuevo', result: 'Según tus respuestas' },
      fr: { title: 'Choix rapide', pick: 'Choisissez', see: 'Voir les choix', restart: 'Recommencer', result: 'D’après vos réponses' },
      de: { title: 'Schnell-Finder', pick: 'Wähle eine', see: 'Tipps ansehen', restart: 'Neu starten', result: 'Basierend auf deinen Antworten' },
      pt: { title: 'Escolha rápida', pick: 'Escolha uma', see: 'Ver sugestões', restart: 'Começar de novo', result: 'Com base nas suas respostas' },
      id: { title: 'Pilih cepat', pick: 'Pilih satu', see: 'Lihat pilihan', restart: 'Mulai lagi', result: 'Berdasarkan jawabanmu' },
      it: { title: 'Scelta rapida', pick: 'Scegli', see: 'Vedi i consigli', restart: 'Ricomincia', result: 'In base alle tue risposte' },
      ru: { title: 'Быстрый выбор', pick: 'Выберите', see: 'Смотреть подборку', restart: 'Начать заново', result: 'На основе ваших ответов' },
      th: { title: 'เลือกด่วน', pick: 'เลือกหนึ่งข้อ', see: 'ดูคำแนะนำ', restart: 'เริ่มใหม่', result: 'จากคำตอบของคุณ' },
      vi: { title: 'Chọn nhanh', pick: 'Chọn một', see: 'Xem gợi ý', restart: 'Làm lại', result: 'Dựa trên câu trả lời của bạn' },
      ar: { title: 'اختيار سريع', pick: 'اختر واحداً', see: 'عرض الاقتراحات', restart: 'ابدأ من جديد', result: 'بناءً على إجاباتك' }
    };
    var S = STR[lang] || STR.en;

    /* ── Category detection from URL slug + <h1> ───────────────────── */
    var slug = (location.pathname.split('/').pop() || '').toLowerCase().replace(/\.html?$/, '');
    var h1 = ((document.querySelector('h1') || {}).textContent || '').toLowerCase();
    var hay = slug + ' ' + h1;
    // ordered: first matching pattern wins (specific → generic)
    var RULES = [
      ['visa',      /\bvisa|k-?eta|entry|passport|immigration\b/],
      ['season',    /autumn|foliage|cherry|blossom|spring|summer|winter|snow|season|best-time|weather/],
      ['food',      /\bfood|eat|dish|cuisine|bibimbap|bbq|street-food|restaurant|kimchi\b/],
      ['transport', /\bktx|train|bus|subway|metro|airport|transport|getting-around|t-money|-to-\b/],
      ['kpop',      /\bkpop|k-pop|idol|lightstick|blackpink|bts|twice|aespa|comeback|album\b/],
      ['budget',    /\bbudget|cost|price|cheap|money|expense|how-much|won\b/],
      ['city',      /things-to-do|where-to|places-to|in-seoul|in-busan|in-jeju|in-gyeongju|city|itinerary|visit/]
    ];
    var cat = 'generic';
    for (var i = 0; i < RULES.length; i++) { if (RULES[i][1].test(hay)) { cat = RULES[i][0]; break; } }

    /* ── Reserve slot immediately (CLS-safe) — fill after l10n loads ─ */
    var sec = document.createElement('section');
    sec.setAttribute('data-kp-microquiz', cat);
    sec.style.minHeight = '10rem';
    // first item? reveal container
    var first = !host.querySelector('section, [data-kp-mounted]');
    host.appendChild(sec);
    if (first) host.removeAttribute('hidden');

    /* ── Load 9-language body l10n on demand, then build ───────────── */
    function withL10N(cb) {
      if (window.KP_MICROQUIZ_L10N) { cb(window.KP_MICROQUIZ_L10N); return; }
      var existing = document.querySelector('script[data-kp-mq-l10n]');
      if (existing) { existing.addEventListener('load', function () { cb(window.KP_MICROQUIZ_L10N); }); return; }
      var sc = document.createElement('script');
      sc.src = 'modules/microquiz-l10n.js?v=1';
      sc.defer = true;
      sc.setAttribute('data-kp-mq-l10n', '1');
      sc.onload = function () { cb(window.KP_MICROQUIZ_L10N); };
      sc.onerror = function () { cb(null); };
      document.head.appendChild(sc);
    }

    /* ── Deterministic outcome links: related.json for THIS page,
          curated per-category fallback otherwise. All internal. ────── */
    var FALLBACK = {
      visa:      [['🛂 Korea Visa & K-ETA Guide', 'guide/korea-visa-k-eta-guide.html'], ['🗺️ 7-Day Korea Itinerary', 'itinerary/first-time-korea-7-day-itinerary.html'], ['🗓️ Best Time to Visit Korea', 'faq/best-time-to-visit-korea.html']],
      city:      [['📍 Things to Do in Seoul', 'guide/things-to-do-in-seoul.html'], ['📍 Things to Do in Busan', 'guide/things-to-do-in-busan.html'], ['🗺️ 7-Day Korea Itinerary', 'itinerary/first-time-korea-7-day-itinerary.html']],
      food:      [['🍚 Best Korean Food', 'guide/best-korean-food.html'], ['🍜 Best Food in Seoul', 'guide/best-food-in-seoul.html'], ['🥩 Best Food in Busan', 'guide/best-food-in-busan.html']],
      season:    [['🗓️ Best Time to Visit Korea', 'faq/best-time-to-visit-korea.html'], ['🍂 Autumn Foliage in Seoul', 'guide/autumn-foliage-in-seoul.html'], ['🌸 Things to Do in Jeju', 'guide/things-to-do-in-jeju.html']],
      transport: [['🚄 Korea Transport Guide', 'guide/korea-transport.html'], ['🗺️ 7-Day Korea Itinerary', 'itinerary/first-time-korea-7-day-itinerary.html'], ['📍 Things to Do in Seoul', 'guide/things-to-do-in-seoul.html']],
      kpop:      [['🎤 K-Pop & Culture', 'guide/k-pop-and-culture.html'], ['📍 Things to Do in Seoul', 'guide/things-to-do-in-seoul.html'], ['🧩 Which City Quiz', 'quiz.html']],
      budget:    [['💰 Korea Travel Cost Index', 'guide/korea-travel-cost-index.html'], ['🗺️ 7-Day Korea Itinerary', 'itinerary/first-time-korea-7-day-itinerary.html'], ['🗓️ Best Time to Visit Korea', 'faq/best-time-to-visit-korea.html']],
      generic:   [['🧩 Which City Quiz', 'quiz.html'], ['🗺️ 7-Day Korea Itinerary', 'itinerary/first-time-korea-7-day-itinerary.html'], ['📍 Things to Do in Seoul', 'guide/things-to-do-in-seoul.html']]
    };

    function getRelated(cb) {
      // related.json is keyed by full pathname → [{url,title},…]
      fetch('related.json', { cache: 'force-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (map) {
          if (!map) { cb(null); return; }
          var arr = map[location.pathname] || map[location.pathname.replace(/^\//, '')] || null;
          if (arr && arr.length) {
            cb(arr.slice(0, 6).map(function (x) { return [x.title || x.url, (x.url || '').replace(/^\//, '')]; }));
          } else cb(null);
        })
        .catch(function () { cb(null); });
    }

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    withL10N(function (L10N) {
      var pack = (L10N && (L10N[lang] || L10N.en)) || null;
      var body = pack && pack[cat];
      if (!body || !body.q || !body.q.length) { sec.remove(); return; } // no-op if no wording

      var titleTxt = (pack.title) || S.title;
      var resultTxt = (pack.result) || S.result;
      var restartTxt = (pack.restart) || S.restart;
      var resHeadTxt = body.r || resultTxt;

      var qs = body.q.slice(0, 3);              // 2–3 questions
      var answers = [];                         // chosen index per question
      var rtl = (lang === 'ar');

      getRelated(function (rel) {
        var links = (rel && rel.length ? rel : null) || FALLBACK[cat] || FALLBACK.generic;

        function render() {
          var qi = answers.length;             // current question index
          var html = '<p class="kp-ns-title">' + esc(titleTxt) + '</p>';
          html += '<div style="min-height:8rem"' + (rtl ? ' dir="rtl"' : '') + '>';

          if (qi < qs.length) {
            var q = qs[qi];
            html += '<div style="font-weight:600;font-size:.95rem;margin:0 0 .75rem">' + esc(q.t) + '</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:.5rem">';
            (q.a || []).forEach(function (opt, idx) {
              html += '<button type="button" data-mq-opt="' + idx + '" ' +
                'style="cursor:pointer;background:var(--card,rgba(255,255,255,.05));border:1px solid var(--border,rgba(255,255,255,.12));' +
                'border-radius:999px;padding:.5rem .9rem;font-size:.85rem;color:var(--text,inherit);font:inherit">' +
                esc(opt) + '</button>';
            });
            html += '</div>';
            html += '<div style="font-size:.7rem;color:var(--text2,#9aa);margin-top:.6rem">' +
              esc((qi + 1) + '/' + qs.length) + '</div>';
          } else {
            // deterministic outcome: rotate the related pool by the summed
            // answer indices so different answer sets surface different
            // (but stable) picks — never random, never repeats the wording.
            var sum = answers.reduce(function (a, b) { return a + b; }, 0);
            var n = links.length;
            var start = n ? (sum % n) : 0;
            var picks = [];
            for (var k = 0; k < Math.min(3, n); k++) picks.push(links[(start + k) % n]);
            html += '<div style="font-weight:600;font-size:.95rem;margin:0 0 .75rem">' + esc(resHeadTxt) + '</div>';
            html += '<div style="display:flex;flex-direction:column;gap:.5rem">';
            picks.forEach(function (p) {
              html += '<a href="' + esc(p[1]) + '" ' +
                'style="display:block;background:var(--card,rgba(255,255,255,.05));border:1px solid var(--border,rgba(255,255,255,.12));' +
                'border-radius:.6rem;padding:.6rem .8rem;font-size:.9rem;color:var(--accent2,#74b9ff);text-decoration:none">' +
                esc(p[0]) + '</a>';
            });
            html += '</div>';
            html += '<button type="button" data-mq-restart="1" ' +
              'style="margin-top:.8rem;cursor:pointer;background:none;border:0;padding:0;font:inherit;font-size:.75rem;' +
              'color:var(--text2,#9aa);text-decoration:underline">' + esc(restartTxt) + '</button>';
          }
          html += '</div>';
          sec.innerHTML = html;
          sec.style.minHeight = '';            // release reserve; content sized now

          sec.querySelectorAll('[data-mq-opt]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              answers.push(parseInt(btn.getAttribute('data-mq-opt'), 10) || 0);
              render();
            });
          });
          var rb = sec.querySelector('[data-mq-restart]');
          if (rb) rb.addEventListener('click', function () { answers = []; render(); });

          if (window.kpAnalytics && qi >= qs.length) {
            try { window.kpAnalytics.track('microquiz_result', { category: cat, lang: lang }); } catch (e) {}
          }
        }
        render();
      });
    });
  } catch (e) { /* fail quiet */ }
})();
