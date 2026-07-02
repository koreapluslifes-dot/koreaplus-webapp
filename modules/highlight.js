/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — S15 select-to-highlight & quote (highlight.js)
   Lets a reader select prose text inside .seo-body and, from a tiny
   popover, (1) SAVE the passage (persisted to localStorage kp_hl_<slug>)
   and (2) COPY A LINK to exactly that passage (URL Text Fragment,
   #:~:text=). On a return visit, saved passages are re-marked with <mark>.
   Desktop uses selectionchange; MOBILE requires a long-press to *enter*
   selection mode first, so we never fight the native selection sheet.
   Self-localizing (14 langs), self-contained, fully try/catch guarded.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    var article = document.querySelector('.seo-body');
    if (!article) return;                              // no-op off-target
    if (article.getAttribute('data-kp-hl')) return;    // dup-mount guard
    article.setAttribute('data-kp-hl', '1');

    // ── language (STEP0 §5) ──────────────────────────────────────────
    var SUP = ['en','ko','ja','zh','es','fr','de','pt','id','ar','hi','ru','vi','th'];
    var lang;
    try {
      lang = new URLSearchParams(location.search).get('lang')
        || localStorage.getItem('kp_lang')
        || (navigator.language || 'en').slice(0, 2);
    } catch (e) { lang = 'en'; }
    lang = (lang || 'en').slice(0, 2);
    if (SUP.indexOf(lang) < 0) lang = 'en';

    var STR = {
      en: { save: 'Save', saved: 'Saved', link: 'Copy link', copied: 'Link to passage copied', shl: 'Saved highlights', rm: 'Remove', hint: 'Tip: select text to save or link it' },
      ko: { save: '저장', saved: '저장됨', link: '링크 복사', copied: '구절 링크 복사됨', shl: '저장한 하이라이트', rm: '삭제', hint: '팁: 텍스트를 선택해 저장·링크하세요' },
      ja: { save: '保存', saved: '保存済み', link: 'リンクをコピー', copied: '該当箇所のリンクをコピー', shl: '保存したハイライト', rm: '削除', hint: 'ヒント: テキストを選択して保存・リンク' },
      zh: { save: '收藏', saved: '已收藏', link: '复制链接', copied: '已复制该段落链接', shl: '已保存的高亮', rm: '删除', hint: '提示：选中文字即可收藏或链接' },
      es: { save: 'Guardar', saved: 'Guardado', link: 'Copiar enlace', copied: 'Enlace al fragmento copiado', shl: 'Destacados guardados', rm: 'Quitar', hint: 'Consejo: selecciona texto para guardarlo o enlazarlo' },
      fr: { save: 'Enregistrer', saved: 'Enregistré', link: 'Copier le lien', copied: 'Lien vers le passage copié', shl: 'Surlignages enregistrés', rm: 'Retirer', hint: 'Astuce : sélectionnez du texte pour l’enregistrer ou le lier' },
      de: { save: 'Merken', saved: 'Gemerkt', link: 'Link kopieren', copied: 'Link zur Passage kopiert', shl: 'Gespeicherte Markierungen', rm: 'Entfernen', hint: 'Tipp: Text markieren zum Speichern oder Verlinken' },
      pt: { save: 'Salvar', saved: 'Salvo', link: 'Copiar link', copied: 'Link do trecho copiado', shl: 'Destaques salvos', rm: 'Remover', hint: 'Dica: selecione o texto para salvar ou vincular' },
      id: { save: 'Simpan', saved: 'Tersimpan', link: 'Salin tautan', copied: 'Tautan ke bagian disalin', shl: 'Sorotan tersimpan', rm: 'Hapus', hint: 'Tips: pilih teks untuk menyimpan atau menautkan' },
      ar: { save: 'حفظ', saved: 'تم الحفظ', link: 'نسخ الرابط', copied: 'تم نسخ رابط المقطع', shl: 'التمييزات المحفوظة', rm: 'إزالة', hint: 'نصيحة: حدد النص لحفظه أو ربطه' },
      hi: { save: 'सहेजें', saved: 'सहेजा गया', link: 'लिंक कॉपी करें', copied: 'अंश का लिंक कॉपी हुआ', shl: 'सहेजे गए हाइलाइट', rm: 'हटाएँ', hint: 'सुझाव: सहेजने या लिंक करने के लिए टेक्स्ट चुनें' },
      ru: { save: 'Сохранить', saved: 'Сохранено', link: 'Копировать ссылку', copied: 'Ссылка на фрагмент скопирована', shl: 'Сохранённые выделения', rm: 'Удалить', hint: 'Совет: выделите текст, чтобы сохранить или дать ссылку' },
      vi: { save: 'Lưu', saved: 'Đã lưu', link: 'Sao chép liên kết', copied: 'Đã sao chép liên kết đến đoạn', shl: 'Đoạn đã lưu', rm: 'Xóa', hint: 'Mẹo: chọn văn bản để lưu hoặc tạo liên kết' },
      th: { save: 'บันทึก', saved: 'บันทึกแล้ว', link: 'คัดลอกลิงก์', copied: 'คัดลอกลิงก์ไปยังข้อความแล้ว', shl: 'ไฮไลต์ที่บันทึกไว้', rm: 'ลบ', hint: 'เคล็ดลับ: เลือกข้อความเพื่อบันทึกหรือทำลิงก์' }
    };
    var S = STR[lang] || STR.en;

    // ── storage: kp_hl_<slug> ────────────────────────────────────────
    function slug() {
      try { return location.pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root'; }
      catch (e) { return 'root'; }
    }
    var KEY = 'kp_hl_' + slug();
    function readStore() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; } }
    function writeStore(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 40))); } catch (e) {} }

    var isMobile = false;
    try { isMobile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches; } catch (e) {}

    // ── toast (reuses shared .kp-toast styling; own instance) ────────
    var toastEl;
    function toast(msg) {
      try {
        if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'kp-toast'; document.body.appendChild(toastEl); }
        toastEl.textContent = msg; toastEl.classList.add('on');
        clearTimeout(toast._t); toast._t = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
      } catch (e) {}
    }

    // ── plain-text offset helpers (article.textContent space) ────────
    // Compute the character offset of a boundary (node, offset) within
    // article.textContent by walking text nodes in document order.
    function offsetOf(node, nodeOffset) {
      var total = 0, done = false, result = -1;
      var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null, false);
      var tn;
      while ((tn = walker.nextNode())) {
        if (tn === node) { result = total + nodeOffset; done = true; break; }
        total += tn.nodeValue.length;
      }
      if (!done && node === article) result = nodeOffset; // rare: boundary is the element
      return result;
    }
    function fullText() { return article.textContent || ''; }

    // ── selection → {start,end,text} in textContent space ────────────
    function selInfo() {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
      var r = sel.getRangeAt(0);
      if (!article.contains(r.commonAncestorContainer)) return null;
      var txt = (sel.toString() || '').trim();
      if (txt.length < 4 || txt.length > 600) return null;   // ignore trivial / huge
      var a = offsetOf(r.startContainer, r.startOffset);
      var b = offsetOf(r.endContainer, r.endOffset);
      if (a < 0 || b < 0) return null;
      if (a > b) { var t = a; a = b; b = t; }
      return { start: a, end: b, text: txt };
    }

    // ── popover ──────────────────────────────────────────────────────
    var pop;
    function ensurePop() {
      if (pop) return pop;
      pop = document.createElement('div');
      pop.setAttribute('role', 'menu');
      pop.style.cssText = 'position:absolute;z-index:2001;display:none;gap:6px;'
        + 'background:#0c1829;border:1px solid rgba(255,255,255,.15);border-radius:10px;'
        + 'padding:6px;box-shadow:0 8px 30px -8px rgba(0,0,0,.6);white-space:nowrap;'
        + '-webkit-user-select:none;user-select:none';
      pop.style.display = 'none';
      pop.innerHTML =
        '<button type="button" data-hl="save" style="' + btnCss() + '">☆ ' + esc(S.save) + '</button>'
        + '<button type="button" data-hl="link" style="' + btnCss() + '">🔗 ' + esc(S.link) + '</button>';
      document.body.appendChild(pop);
      // keep selection alive: prevent the popover mousedown from clearing it
      pop.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      pop.addEventListener('click', function (ev) {
        var b = ev.target.closest && ev.target.closest('button[data-hl]');
        if (!b) return;
        var info = pendingSel;
        if (!info) return;
        if (b.getAttribute('data-hl') === 'save') doSave(info);
        else doLink(info);
        hidePop();
      });
      return pop;
    }
    function btnCss() {
      return 'background:transparent;border:0;color:#fff;font-size:13px;font-weight:600;'
        + 'cursor:pointer;padding:6px 10px;border-radius:7px;line-height:1';
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    var pendingSel = null;
    function showPop(info) {
      pendingSel = info;
      var p = ensurePop();
      var sel = window.getSelection();
      var rect;
      try { rect = sel.getRangeAt(0).getBoundingClientRect(); } catch (e) { return; }
      if (!rect || (!rect.width && !rect.height)) return;
      p.style.display = 'flex';
      var pw = p.offsetWidth || 160, ph = p.offsetHeight || 36;
      var top = window.scrollY + rect.top - ph - 8;
      if (top < window.scrollY + 4) top = window.scrollY + rect.bottom + 8;   // flip below
      var left = window.scrollX + rect.left + rect.width / 2 - pw / 2;
      var maxL = window.scrollX + document.documentElement.clientWidth - pw - 6;
      if (left < window.scrollX + 6) left = window.scrollX + 6;
      if (left > maxL) left = maxL;
      p.style.top = top + 'px';
      p.style.left = left + 'px';
    }
    function hidePop() { if (pop) pop.style.display = 'none'; pendingSel = null; }

    // ── actions ──────────────────────────────────────────────────────
    function doSave(info) {
      var store = readStore();
      // de-dupe by overlapping range
      for (var i = 0; i < store.length; i++) {
        if (info.start < store[i].end && info.end > store[i].start) { toast(S.saved); return; }
      }
      store.push({ start: info.start, end: info.end, text: info.text, ts: Date.now() });
      store.sort(function (a, b) { return a.start - b.start; });
      writeStore(store);
      applyMarks();
      renderSavedSection();
      toast(S.saved);
    }
    function fragUrl(text) {
      // URL Text Fragment: keep it short/robust — trim to first ~w words.
      var t = text.replace(/\s+/g, ' ').trim();
      var enc = encodeURIComponent(t);
      var base = location.href.split('#')[0];
      return base + '#:~:text=' + enc;
    }
    function doLink(info) {
      var url = fragUrl(info.text);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { toast(S.copied); }, function () { legacyCopy(url); });
        } else { legacyCopy(url); }
      } catch (e) { legacyCopy(url); }
    }
    function legacyCopy(txt) {
      try {
        var ta = document.createElement('textarea');
        ta.value = txt; ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        toast(S.copied);
      } catch (e) {}
    }

    // ── restore saved passages as <mark> (by textContent offsets) ────
    function applyMarks() {
      try {
        var store = readStore();
        if (!store.length) return;
        // build a flat list of text nodes + cumulative offsets
        clearMarks();
        var ranges = store.slice().sort(function (a, b) { return b.start - a.start; }); // last-first so offsets stay valid
        ranges.forEach(function (h) { markRange(h.start, h.end); });
      } catch (e) {}
    }
    function clearMarks() {
      try {
        [].slice.call(article.querySelectorAll('mark[data-kp-hl]')).forEach(function (m) {
          var parent = m.parentNode;
          while (m.firstChild) parent.insertBefore(m.firstChild, m);
          parent.removeChild(m);
          parent.normalize();
        });
      } catch (e) {}
    }
    // wrap the textContent span [start,end) in a <mark>
    function markRange(start, end) {
      var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null, false);
      var pos = 0, tn, startNode = null, startOff = 0, endNode = null, endOff = 0;
      while ((tn = walker.nextNode())) {
        var len = tn.nodeValue.length;
        if (!startNode && start < pos + len && start >= pos) { startNode = tn; startOff = start - pos; }
        if (startNode && end <= pos + len) { endNode = tn; endOff = end - pos; break; }
        pos += len;
      }
      if (!startNode || !endNode) return;
      try {
        var r = document.createRange();
        r.setStart(startNode, startOff);
        r.setEnd(endNode, endOff);
        var mark = document.createElement('mark');
        mark.setAttribute('data-kp-hl', '1');
        mark.style.cssText = 'background:rgba(255,214,10,.28);color:inherit;border-radius:2px;padding:0 1px';
        // surroundContents fails if range crosses element boundaries — fall back to extract+insert
        try { r.surroundContents(mark); }
        catch (e2) { mark.appendChild(r.extractContents()); r.insertNode(mark); }
      } catch (e) {}
    }

    // ── saved-highlights list in the unified .kp-nextsteps container ──
    function renderSavedSection() {
      try {
        var host = document.querySelector('.kp-nextsteps');
        if (!host) return;
        var store = readStore();
        var sec = host.querySelector('section[data-kp-ns="highlights"]');
        if (!store.length) { if (sec) sec.parentNode.removeChild(sec); return; }
        if (!sec) {
          sec = document.createElement('section');
          sec.setAttribute('data-kp-ns', 'highlights');
          host.appendChild(sec);
          if (host.hasAttribute('hidden')) host.removeAttribute('hidden');  // first item reveals
        }
        var items = store.slice().sort(function (a, b) { return a.start - b.start; }).map(function (h, i) {
          return '<li data-i="' + i + '" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 8px;font-size:13px;line-height:1.5">'
            + '<a href="' + esc(fragUrl(h.text)) + '" style="flex:1;color:var(--text2,#cfd6e0);text-decoration:none;border-left:2px solid rgba(255,214,10,.6);padding-left:8px">'
            + esc(h.text.length > 140 ? h.text.slice(0, 140) + '…' : h.text) + '</a>'
            + '<button type="button" data-rm="' + i + '" aria-label="' + esc(S.rm) + '" title="' + esc(S.rm)
            + '" style="background:transparent;border:0;color:var(--text3,#8a93a0);cursor:pointer;font-size:14px;padding:0 2px;line-height:1">✕</button>'
            + '</li>';
        }).join('');
        sec.innerHTML = '<p class="kp-ns-title">' + esc(S.shl) + '</p>'
          + '<ul style="list-style:none;margin:0;padding:0">' + items + '</ul>';
        // remove handlers
        [].slice.call(sec.querySelectorAll('button[data-rm]')).forEach(function (b) {
          b.addEventListener('click', function () {
            var idx = parseInt(b.getAttribute('data-rm'), 10);
            var st = readStore().sort(function (a, c) { return a.start - c.start; });
            st.splice(idx, 1);
            writeStore(st);
            applyMarks();
            renderSavedSection();
          });
        });
      } catch (e) {}
    }

    // ── selection wiring ─────────────────────────────────────────────
    var selectionEnabled = !isMobile;   // desktop on by default; mobile gated
    var longTimer = null;

    function onSelectionChange() {
      if (!selectionEnabled) return;
      var info = selInfo();
      if (!info) { hidePop(); return; }
      clearTimeout(onSelectionChange._t);
      onSelectionChange._t = setTimeout(function () {
        var again = selInfo();
        if (again) showPop(again); else hidePop();
      }, 120);
    }

    if (!isMobile) {
      document.addEventListener('selectionchange', onSelectionChange);
    } else {
      // MOBILE: long-press inside article to enter selection mode once,
      // so we don't collide with the browser's own selection sheet on tap.
      article.addEventListener('touchstart', function () {
        selectionEnabled = false;
        clearTimeout(longTimer);
        longTimer = setTimeout(function () {
          selectionEnabled = true;   // arm: after this the user's drag-select shows our popover
          document.addEventListener('selectionchange', onSelectionChange);
        }, 450);
      }, { passive: true });
      article.addEventListener('touchend', function () { clearTimeout(longTimer); }, { passive: true });
      article.addEventListener('touchmove', function () { clearTimeout(longTimer); }, { passive: true });
    }

    // dismiss popover on outside interaction / scroll
    document.addEventListener('mousedown', function (e) {
      if (pop && pop.style.display !== 'none' && !pop.contains(e.target)) hidePop();
    });
    window.addEventListener('scroll', function () { hidePop(); }, { passive: true });

    // ── init: restore marks + saved list on load ─────────────────────
    function init() { applyMarks(); renderSavedSection(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

  } catch (e) { /* silent no-op */ }
})();
