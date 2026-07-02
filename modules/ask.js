/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — "Ask this page" (S14, ask.js)
   A floating FAB on generated content pages that opens a small sheet
   where the reader can ask a free-text question about the page. It calls
   the existing /chat worker endpoint via KPApi.askPage(), passing ONLY a
   short page summary (#kp-tldr text) as context — never the full body —
   so token cost stays bounded.

   COST GUARDS (all must pass, else the FAB is never shown):
     (i)  window.KP_ASK_ENABLED === true  (default false; flipped ON only
          in STEP C, after the worker-side cost guard is deployed).
     (ii) page language is in the whitelist en·ko·ja·zh·es (others hidden).
     (iii) nothing loads or calls the AI until the user clicks the FAB.

   Fully client-side, IIFE, no-op when target/guards absent, dup-guarded.
   Embed pages: no #kp-tldr / not enabled → no-op. Ad layout untouched.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    // ── dup-mount guard ─────────────────────────────────────────────
    if (window.__kpAskMounted) return;

    // ── cost guard (i): feature flag (default OFF) ──────────────────
    if (window.KP_ASK_ENABLED !== true) return;

    // ── language resolve (STEP0 §5) ─────────────────────────────────
    var SUP = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id', 'th', 'vi', 'ar', 'hi', 'ru'];
    var qp;
    try { qp = new URLSearchParams(location.search).get('lang'); } catch (e) { qp = null; }
    var ls = null; try { ls = localStorage.getItem('kp_lang'); } catch (e) {}
    var nav = (navigator.language || 'en').slice(0, 2);
    var lang = (qp || ls || document.documentElement.lang || nav || 'en').slice(0, 2);
    if (SUP.indexOf(lang) === -1) lang = 'en';

    // ── cost guard (ii): language whitelist for the FAB ─────────────
    var WHITELIST = { en: 1, ko: 1, ja: 1, zh: 1, es: 1 };
    if (!WHITELIST[lang]) return;

    // ── labels (14 languages inline; STEP0 §6) ──────────────────────
    var STR = {
      en: { fab: 'Ask this page', title: 'Ask about this page', ph: 'Ask anything about this page…', send: 'Ask', close: 'Close', thinking: 'Thinking…', err: "Sorry — couldn't answer just now. Please try again.", disc: 'AI-generated · may be imperfect' },
      ko: { fab: '이 페이지에 묻기', title: '이 페이지에 대해 묻기', ph: '이 페이지에 대해 무엇이든 물어보세요…', send: '질문', close: '닫기', thinking: '생각 중…', err: '죄송해요 — 지금은 답변하지 못했어요. 다시 시도해 주세요.', disc: 'AI 생성 · 부정확할 수 있음' },
      ja: { fab: 'このページに質問', title: 'このページについて質問', ph: 'このページについて何でも聞いてください…', send: '質問', close: '閉じる', thinking: '考え中…', err: '申し訳ありません — 今は回答できませんでした。もう一度お試しください。', disc: 'AI生成 · 不正確な場合があります' },
      zh: { fab: '询问本页', title: '关于本页提问', ph: '关于本页可以问任何问题…', send: '提问', close: '关闭', thinking: '思考中…', err: '抱歉 — 暂时无法回答，请稍后再试。', disc: 'AI 生成 · 可能不准确' },
      es: { fab: 'Preguntar sobre esta página', title: 'Pregunta sobre esta página', ph: 'Pregunta lo que quieras sobre esta página…', send: 'Preguntar', close: 'Cerrar', thinking: 'Pensando…', err: 'Lo sentimos — no se pudo responder ahora. Inténtalo de nuevo.', disc: 'Generado por IA · puede no ser exacto' },
      fr: { fab: 'Poser une question', title: 'Question sur cette page', ph: 'Posez une question sur cette page…', send: 'Demander', close: 'Fermer', thinking: 'Réflexion…', err: 'Désolé — impossible de répondre pour l’instant. Réessayez.', disc: 'Généré par IA · peut être imparfait' },
      de: { fab: 'Seite fragen', title: 'Frage zu dieser Seite', ph: 'Frag alles zu dieser Seite…', send: 'Fragen', close: 'Schließen', thinking: 'Denkt nach…', err: 'Entschuldigung — konnte gerade nicht antworten. Bitte erneut versuchen.', disc: 'KI-generiert · evtl. ungenau' },
      pt: { fab: 'Perguntar sobre a página', title: 'Pergunte sobre esta página', ph: 'Pergunte qualquer coisa sobre esta página…', send: 'Perguntar', close: 'Fechar', thinking: 'Pensando…', err: 'Desculpe — não foi possível responder agora. Tente novamente.', disc: 'Gerado por IA · pode ser impreciso' },
      id: { fab: 'Tanya halaman ini', title: 'Tanya tentang halaman ini', ph: 'Tanyakan apa saja tentang halaman ini…', send: 'Tanya', close: 'Tutup', thinking: 'Berpikir…', err: 'Maaf — belum bisa menjawab sekarang. Coba lagi.', disc: 'Dihasilkan AI · mungkin tidak akurat' },
      th: { fab: 'ถามเกี่ยวกับหน้านี้', title: 'ถามเกี่ยวกับหน้านี้', ph: 'ถามอะไรก็ได้เกี่ยวกับหน้านี้…', send: 'ถาม', close: 'ปิด', thinking: 'กำลังคิด…', err: 'ขออภัย — ตอบไม่ได้ในตอนนี้ โปรดลองอีกครั้ง', disc: 'สร้างโดย AI · อาจไม่ถูกต้อง' },
      vi: { fab: 'Hỏi về trang này', title: 'Hỏi về trang này', ph: 'Hỏi bất cứ điều gì về trang này…', send: 'Hỏi', close: 'Đóng', thinking: 'Đang suy nghĩ…', err: 'Xin lỗi — hiện chưa thể trả lời. Vui lòng thử lại.', disc: 'Do AI tạo · có thể không chính xác' },
      ar: { fab: 'اسأل عن هذه الصفحة', title: 'اسأل عن هذه الصفحة', ph: 'اسأل أي شيء عن هذه الصفحة…', send: 'اسأل', close: 'إغلاق', thinking: 'جارٍ التفكير…', err: 'عذرًا — تعذّر الرد الآن. حاول مرة أخرى.', disc: 'من إنشاء الذكاء الاصطناعي · قد يكون غير دقيق' },
      hi: { fab: 'इस पेज के बारे में पूछें', title: 'इस पेज के बारे में पूछें', ph: 'इस पेज के बारे में कुछ भी पूछें…', send: 'पूछें', close: 'बंद करें', thinking: 'सोच रहे हैं…', err: 'क्षमा करें — अभी उत्तर नहीं दे सके। कृपया पुनः प्रयास करें।', disc: 'AI द्वारा निर्मित · गलत हो सकता है' },
      ru: { fab: 'Спросить об этой странице', title: 'Вопрос об этой странице', ph: 'Спросите что угодно об этой странице…', send: 'Спросить', close: 'Закрыть', thinking: 'Думаю…', err: 'Извините — сейчас не удалось ответить. Попробуйте снова.', disc: 'Сгенерировано ИИ · может быть неточным' }
    };
    var T = STR[lang] || STR.en;

    // ── page context = #kp-tldr text only (NOT full body) ───────────
    function pageCtx() {
      var box = document.getElementById('kp-tldr');
      var ctx = box ? (box.textContent || '').replace(/\s+/g, ' ').trim() : '';
      if (!ctx) {
        // fallback to hero title + meta description — still bounded, no body scrape
        var h1 = document.querySelector('h1');
        var md = document.querySelector('meta[name="description"]');
        ctx = ((h1 ? h1.textContent : document.title) + '. ' + (md ? md.getAttribute('content') || '' : '')).trim();
      }
      return ctx.slice(0, 600);
    }

    // ── styles (injected once; self-contained, no feature.css dep) ──
    function injectCss() {
      if (document.getElementById('kp-ask-css')) return;
      var css =
        '.kp-ask-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0));z-index:9998;' +
        'display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:0;border-radius:999px;cursor:pointer;' +
        'font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;' +
        'background:var(--accent2,#4a7dff);box-shadow:0 6px 20px rgba(0,0,0,.28);transition:transform .15s,box-shadow .15s}' +
        '.kp-ask-fab:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.34)}' +
        '.kp-ask-fab .kp-ask-ico{font-size:16px;line-height:1}' +
        '[dir=rtl] .kp-ask-fab{right:auto;left:16px}' +
        '.kp-ask-ovl{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);' +
        'display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .18s}' +
        '.kp-ask-ovl.on{opacity:1;pointer-events:auto}' +
        '.kp-ask-sheet{width:100%;max-width:560px;background:var(--card,#181b22);color:var(--text,#eef);' +
        'border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0));' +
        'box-shadow:0 -8px 40px rgba(0,0,0,.4);transform:translateY(12px);transition:transform .2s;min-height:180px}' +
        '.kp-ask-ovl.on .kp-ask-sheet{transform:translateY(0)}' +
        '@media(min-width:640px){.kp-ask-ovl{align-items:center}.kp-ask-sheet{border-radius:16px}}' +
        '.kp-ask-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}' +
        '.kp-ask-hd b{font-size:15px}' +
        '.kp-ask-x{background:0;border:0;color:var(--text2,#aab);font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}' +
        '.kp-ask-form{display:flex;gap:8px;align-items:flex-end}' +
        '.kp-ask-ta{flex:1;resize:none;min-height:44px;max-height:120px;padding:10px 12px;border-radius:10px;' +
        'border:1px solid var(--border,rgba(255,255,255,.14));background:var(--surface,rgba(255,255,255,.05));' +
        'color:inherit;font:400 15px/1.4 system-ui,sans-serif}' +
        '.kp-ask-send{border:0;border-radius:10px;padding:0 16px;height:44px;cursor:pointer;white-space:nowrap;' +
        'font:600 14px/1 system-ui,sans-serif;color:#fff;background:var(--accent2,#4a7dff)}' +
        '.kp-ask-send:disabled{opacity:.5;cursor:default}' +
        '.kp-ask-out{margin-top:12px;font-size:14px;line-height:1.6;color:var(--text2,#cdd);' +
        'white-space:pre-wrap;word-wrap:break-word;min-height:1.6em}' +
        '.kp-ask-disc{margin-top:10px;font-size:11px;color:var(--text3,#8a93a0)}' +
        '@media(prefers-reduced-motion:reduce){.kp-ask-fab,.kp-ask-ovl,.kp-ask-sheet{transition:none}}';
      var s = document.createElement('style');
      s.id = 'kp-ask-css';
      s.textContent = css;
      document.head.appendChild(s);
    }

    // ── sheet (lazily built on first FAB click; cost guard iii) ─────
    var sheetOvl, taEl, sendEl, outEl, busy = false;

    function buildSheet() {
      if (sheetOvl) return;
      sheetOvl = document.createElement('div');
      sheetOvl.className = 'kp-ask-ovl';
      sheetOvl.setAttribute('role', 'dialog');
      sheetOvl.setAttribute('aria-modal', 'true');
      sheetOvl.setAttribute('aria-label', T.title);
      sheetOvl.innerHTML =
        '<div class="kp-ask-sheet">' +
          '<div class="kp-ask-hd"><b></b><button class="kp-ask-x" type="button" aria-label=""></button></div>' +
          '<form class="kp-ask-form">' +
            '<textarea class="kp-ask-ta" rows="1"></textarea>' +
            '<button class="kp-ask-send" type="submit"></button>' +
          '</form>' +
          '<div class="kp-ask-out" aria-live="polite"></div>' +
          '<div class="kp-ask-disc"></div>' +
        '</div>';
      sheetOvl.querySelector('.kp-ask-hd b').textContent = T.title;
      var xBtn = sheetOvl.querySelector('.kp-ask-x');
      xBtn.textContent = '×'; xBtn.setAttribute('aria-label', T.close);
      taEl = sheetOvl.querySelector('.kp-ask-ta');
      taEl.placeholder = T.ph;
      sendEl = sheetOvl.querySelector('.kp-ask-send');
      sendEl.textContent = T.send;
      outEl = sheetOvl.querySelector('.kp-ask-out');
      sheetOvl.querySelector('.kp-ask-disc').textContent = T.disc;

      // close on overlay click / × / Esc
      sheetOvl.addEventListener('click', function (e) { if (e.target === sheetOvl) close(); });
      xBtn.addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetOvl.classList.contains('on')) close(); });

      // auto-grow textarea
      taEl.addEventListener('input', function () { taEl.style.height = 'auto'; taEl.style.height = Math.min(taEl.scrollHeight, 120) + 'px'; });

      sheetOvl.querySelector('.kp-ask-form').addEventListener('submit', function (e) { e.preventDefault(); submit(); });
      document.body.appendChild(sheetOvl);
    }

    function open() {
      buildSheet();
      sheetOvl.classList.add('on');
      setTimeout(function () { try { taEl.focus(); } catch (e) {} }, 60);
    }
    function close() { if (sheetOvl) sheetOvl.classList.remove('on'); }

    function submit() {
      if (busy) return;
      var q = (taEl.value || '').trim();
      if (!q) return;
      if (!window.KPApi || typeof window.KPApi.askPage !== 'function') { outEl.textContent = T.err; return; }
      busy = true; sendEl.disabled = true; outEl.textContent = T.thinking;
      window.KPApi.askPage(q, { ctx: pageCtx(), lang: lang })
        .then(function (reply) { outEl.textContent = (reply && String(reply).trim()) || T.err; })
        .catch(function () { outEl.textContent = T.err; })
        .then(function () { busy = false; sendEl.disabled = false; });
    }

    // ── FAB (rendered up-front; the AI is untouched until clicked) ──
    function mount() {
      if (document.querySelector('.kp-ask-fab')) return;
      injectCss();
      var fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'kp-ask-fab';
      fab.setAttribute('aria-haspopup', 'dialog');
      fab.setAttribute('aria-label', T.fab);
      fab.innerHTML = '<span class="kp-ask-ico" aria-hidden="true">💬</span><span class="kp-ask-txt"></span>';
      fab.querySelector('.kp-ask-txt').textContent = T.fab;
      fab.addEventListener('click', open);
      document.body.appendChild(fab);
      window.__kpAskMounted = true;
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
  } catch (e) { /* no-op */ }
})();
