/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — On-page search (search.js) · STEP2 / S02
   Cmd/Ctrl+K (or the header 🔍 button / [data-action="search"] / "/") opens
   an overlay that fetches search-index.<lang>.json (built by build-seo.cjs)
   for the current kp_lang and runs a lightweight, dependency-free token
   filter over title/tags/summary. No external library (Fuse.js removed).
   IIFE · no-op when no trigger exists · single-mount guard · try/catch.
   UI labels self-localize across 14 languages via inline STR.
   Reuses the existing .kp-search-* / .si-* CSS in theme.css.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    // ── single-mount guard ────────────────────────────────────────────
    if (window.kpSearch && window.kpSearch.__s02) return;

    // ── kp_lang resolution (contract §5) ──────────────────────────────
    var SUP = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id', 'ru', 'ar', 'hi', 'th', 'vi'];
    // Languages that actually have a built search-index.<lang>.json file.
    var IDX_LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];
    var lang;
    try {
      lang = new URLSearchParams(location.search).get('lang')
        || localStorage.getItem('kp_lang')
        || (navigator.language || 'en').slice(0, 2);
    } catch (e) { lang = (navigator.language || 'en').slice(0, 2); }
    lang = (lang || 'en').toLowerCase();
    if (SUP.indexOf(lang) < 0) lang = 'en';
    // The index file we actually fetch (fall back to en when unbuilt).
    var idxLang = IDX_LANGS.indexOf(lang) >= 0 ? lang : 'en';

    // ── UI strings — 14 languages inline (contract §6) ────────────────
    var STR = {
      placeholder: {
        en: 'Search Korea guides, food, K-pop…', ko: '가이드·음식·K-pop 검색…',
        ja: 'ガイド・グルメ・K-POPを検索…', zh: '搜索指南、美食、K-pop…',
        es: 'Buscar guías, comida, K-pop…', fr: 'Rechercher guides, cuisine, K-pop…',
        de: 'Guides, Essen, K-Pop suchen…', pt: 'Pesquisar guias, comida, K-pop…',
        id: 'Cari panduan, kuliner, K-pop…', ru: 'Поиск гидов, еды, K-pop…',
        ar: 'ابحث في الأدلة والطعام و K-pop…', hi: 'गाइड, भोजन, K-pop खोजें…',
        th: 'ค้นหาไกด์ อาหาร K-pop…', vi: 'Tìm hướng dẫn, ẩm thực, K-pop…'
      },
      type: {
        en: 'Start typing to search', ko: '검색어를 입력하세요',
        ja: '入力して検索', zh: '输入以搜索',
        es: 'Escribe para buscar', fr: 'Tapez pour rechercher',
        de: 'Zum Suchen tippen', pt: 'Digite para pesquisar',
        id: 'Ketik untuk mencari', ru: 'Начните вводить для поиска',
        ar: 'ابدأ الكتابة للبحث', hi: 'खोजने के लिए टाइप करें',
        th: 'พิมพ์เพื่อค้นหา', vi: 'Nhập để tìm kiếm'
      },
      loading: {
        en: 'Loading…', ko: '불러오는 중…', ja: '読み込み中…', zh: '加载中…',
        es: 'Cargando…', fr: 'Chargement…', de: 'Wird geladen…', pt: 'Carregando…',
        id: 'Memuat…', ru: 'Загрузка…', ar: 'جارٍ التحميل…', hi: 'लोड हो रहा है…',
        th: 'กำลังโหลด…', vi: 'Đang tải…'
      },
      results: {
        en: 'Results', ko: '검색 결과', ja: '検索結果', zh: '搜索结果',
        es: 'Resultados', fr: 'Résultats', de: 'Ergebnisse', pt: 'Resultados',
        id: 'Hasil', ru: 'Результаты', ar: 'النتائج', hi: 'परिणाम',
        th: 'ผลลัพธ์', vi: 'Kết quả'
      },
      noResults: {
        en: 'No results found', ko: '검색 결과가 없습니다', ja: '該当なし', zh: '未找到结果',
        es: 'Sin resultados', fr: 'Aucun résultat', de: 'Keine Ergebnisse', pt: 'Nenhum resultado',
        id: 'Tidak ada hasil', ru: 'Ничего не найдено', ar: 'لا توجد نتائج', hi: 'कोई परिणाम नहीं',
        th: 'ไม่พบผลลัพธ์', vi: 'Không có kết quả'
      },
      recent: {
        en: 'Recent searches', ko: '최근 검색', ja: '最近の検索', zh: '最近搜索',
        es: 'Búsquedas recientes', fr: 'Recherches récentes', de: 'Letzte Suchen', pt: 'Buscas recentes',
        id: 'Pencarian terbaru', ru: 'Недавние запросы', ar: 'عمليات البحث الأخيرة', hi: 'हाल की खोजें',
        th: 'การค้นหาล่าสุด', vi: 'Tìm kiếm gần đây'
      },
      searchLabel: {
        en: 'Search', ko: '검색', ja: '検索', zh: '搜索', es: 'Buscar', fr: 'Recherche',
        de: 'Suche', pt: 'Pesquisar', id: 'Cari', ru: 'Поиск', ar: 'بحث', hi: 'खोज',
        th: 'ค้นหา', vi: 'Tìm kiếm'
      },
      close: {
        en: 'Close', ko: '닫기', ja: '閉じる', zh: '关闭', es: 'Cerrar', fr: 'Fermer',
        de: 'Schließen', pt: 'Fechar', id: 'Tutup', ru: 'Закрыть', ar: 'إغلاق', hi: 'बंद करें',
        th: 'ปิด', vi: 'Đóng'
      }
    };
    function t(k) { var m = STR[k] || {}; return m[lang] || m.en || k; }

    // ── config / state ────────────────────────────────────────────────
    var RECENT_KEY = 'kp_recent_search';
    var MAX_RECENT = 6;
    var MAX_RESULTS = 12;
    var INDEX = null;        // loaded array of {url,title,tags,summary}
    var loading = false;
    var loadFailed = false;
    var overlay = null, input = null, resultsEl = null, focusIdx = -1;

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
    function norm(s) { return String(s == null ? '' : s).toLowerCase().trim(); }

    // ── index loader (lazy, fetched on first open) ────────────────────
    function loadIndex() {
      if (INDEX || loading || loadFailed) return Promise.resolve();
      loading = true;
      var url = '/guide/search-index.' + idxLang + '.json';
      return fetch(url, { cache: 'default' })
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (data) {
          INDEX = (Array.isArray(data) ? data : []).map(function (it) {
            var tags = Array.isArray(it.tags) ? it.tags : [];
            return {
              url: it.url || '',
              title: it.title || '',
              summary: it.summary || '',
              tags: tags,
              _t: norm(it.title),
              _g: norm(tags.join(' ')),
              _s: norm(it.summary)
            };
          }).filter(function (it) { return it.url && it.title; });
          loading = false;
        })
        .catch(function () { loadFailed = true; loading = false; INDEX = INDEX || []; });
    }

    // ── lightweight token scoring (no external library) ───────────────
    // Splits the query into tokens; every token must appear in title/tags/
    // summary (AND). Scores by field weight + prefix/word-boundary bonus.
    function scoreEntry(e, tokens) {
      var score = 0;
      for (var i = 0; i < tokens.length; i++) {
        var tk = tokens[i];
        var inTitle = e._t.indexOf(tk) >= 0;
        var inTags = e._g.indexOf(tk) >= 0;
        var inSum = e._s.indexOf(tk) >= 0;
        if (!inTitle && !inTags && !inSum) return -1; // token missing → drop
        if (inTitle) {
          score += 10;
          if (e._t.indexOf(tk) === 0) score += 8;              // title prefix
          else if (new RegExp('(^|\\s)' + escRe(tk)).test(e._t)) score += 4; // word start
        }
        if (inTags) score += 6;
        if (inSum) score += 2;
      }
      return score;
    }
    function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function search(q) {
      if (!INDEX) return [];
      var tokens = norm(q).split(/\s+/).filter(Boolean);
      if (!tokens.length) return [];
      var out = [];
      for (var i = 0; i < INDEX.length; i++) {
        var sc = scoreEntry(INDEX[i], tokens);
        if (sc > 0) out.push({ item: INDEX[i], score: sc });
      }
      out.sort(function (a, b) { return b.score - a.score || a.item._t.localeCompare(b.item._t); });
      return out.slice(0, MAX_RESULTS).map(function (x) { return x.item; });
    }

    // ── recent searches ───────────────────────────────────────────────
    function getRecent() {
      try { var r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(r) ? r : []; }
      catch (e) { return []; }
    }
    function addRecent(term) {
      try {
        var r = [term].concat(getRecent().filter(function (x) { return x !== term; })).slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(r));
      } catch (e) {}
    }

    // ── render ────────────────────────────────────────────────────────
    function highlight(text, tokens) {
      var safe = esc(text);
      for (var i = 0; i < tokens.length; i++) {
        if (!tokens[i]) continue;
        try { safe = safe.replace(new RegExp('(' + escRe(esc(tokens[i])) + ')', 'gi'), '<mark>$1</mark>'); }
        catch (e) {}
      }
      return safe;
    }

    function renderResultItem(item, tokens) {
      var div = document.createElement('div');
      div.className = 'kp-search-item';
      div.setAttribute('role', 'option');
      div.tabIndex = 0;
      var tag = (item.tags && item.tags[0]) ? esc(item.tags[0]) : '';
      div.innerHTML =
        '<span class="si-icon" aria-hidden="true">📄</span>' +
        '<div class="si-body">' +
          '<div class="si-title">' + highlight(item.title, tokens) + '</div>' +
          (item.summary ? '<div class="si-sub">' + highlight(item.summary, tokens) + '</div>' : '') +
        '</div>' +
        (tag ? '<span class="si-tag">' + tag + '</span>' : '');
      function go() { navigate(item, true); }
      div.addEventListener('click', go);
      div.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      return div;
    }

    function renderRecentItem(term) {
      var div = document.createElement('div');
      div.className = 'kp-search-item';
      div.setAttribute('role', 'option');
      div.tabIndex = 0;
      div.innerHTML =
        '<span class="si-icon" aria-hidden="true">🕐</span>' +
        '<div class="si-body"><div class="si-title">' + esc(term) + '</div></div>';
      div.addEventListener('click', function () { if (input) { input.value = term; render(); input.focus(); } });
      return div;
    }

    function render() {
      if (!resultsEl) return;
      resultsEl.innerHTML = '';
      focusIdx = -1;
      var q = input ? input.value : '';

      if (!q.trim()) {
        var recent = getRecent();
        if (!recent.length) {
          resultsEl.innerHTML = '<div class="kp-search-empty">' + esc(t('type')) + '</div>';
          return;
        }
        var rl = document.createElement('div');
        rl.className = 'kp-search-section';
        rl.textContent = t('recent');
        resultsEl.appendChild(rl);
        recent.forEach(function (term) { resultsEl.appendChild(renderRecentItem(term)); });
        return;
      }

      if (loading || (!INDEX && !loadFailed)) {
        resultsEl.innerHTML = '<div class="kp-search-empty">' + esc(t('loading')) + '</div>';
        return;
      }

      var tokens = norm(q).split(/\s+/).filter(Boolean);
      var hits = search(q);
      if (!hits.length) {
        resultsEl.innerHTML = '<div class="kp-search-empty">' + esc(t('noResults')) + '</div>';
        return;
      }
      var sl = document.createElement('div');
      sl.className = 'kp-search-section';
      sl.textContent = t('results');
      resultsEl.appendChild(sl);
      hits.forEach(function (it) { resultsEl.appendChild(renderResultItem(it, tokens)); });
    }

    function navigate(item, saveRecent) {
      try {
        if (saveRecent && input && input.value.trim()) addRecent(input.value.trim());
        if (window.kpAnalytics && window.kpAnalytics.track) {
          window.kpAnalytics.track('search_performed', { query: input ? input.value : '', result: item.title });
        }
      } catch (e) {}
      close();
      if (item.url) window.location.href = item.url;
    }

    // ── keyboard nav within results ───────────────────────────────────
    function moveFocus(dir) {
      var items = resultsEl ? resultsEl.querySelectorAll('.kp-search-item') : [];
      if (!items.length) return;
      if (items[focusIdx]) items[focusIdx].classList.remove('focused');
      focusIdx = (focusIdx + dir + items.length) % items.length;
      var f = items[focusIdx];
      f.classList.add('focused');
      f.scrollIntoView({ block: 'nearest' });
    }

    // ── open / close ──────────────────────────────────────────────────
    function open() {
      if (!overlay) return;
      overlay.classList.add('open');
      if (input) { input.value = ''; input.focus(); }
      render();
      loadIndex().then(function () { render(); });
    }
    function close() {
      if (!overlay) return;
      overlay.classList.remove('open');
      if (input) input.value = '';
    }

    // ── build modal (reuses existing theme.css .kp-search-* classes) ──
    function buildModal() {
      if (document.getElementById('kp-search-overlay')) { overlay = document.getElementById('kp-search-overlay'); return; }
      overlay = document.createElement('div');
      overlay.id = 'kp-search-overlay';
      overlay.className = 'kp-search-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', t('searchLabel'));
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

      var box = document.createElement('div');
      box.className = 'kp-search-box';

      var row = document.createElement('div');
      row.className = 'kp-search-input-row';
      row.innerHTML = '<span class="search-icon" aria-hidden="true">🔍</span>';

      input = document.createElement('input');
      input.type = 'search';
      input.className = 'kp-search-input';
      input.placeholder = t('placeholder');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('aria-label', t('searchLabel'));
      input.addEventListener('input', render);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-1); }
        else if (e.key === 'Enter') {
          var f = resultsEl && resultsEl.querySelector('.kp-search-item.focused');
          if (f) f.click();
          else {
            var first = resultsEl && resultsEl.querySelector('.kp-search-item');
            if (first) first.click();
          }
        } else if (e.key === 'Escape') { close(); }
      });

      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'kp-search-close';
      closeBtn.textContent = 'Esc';
      closeBtn.setAttribute('aria-label', t('close'));
      closeBtn.addEventListener('click', close);

      row.appendChild(input);
      row.appendChild(closeBtn);

      resultsEl = document.createElement('div');
      resultsEl.className = 'kp-search-results';
      resultsEl.setAttribute('role', 'listbox');

      box.appendChild(row);
      box.appendChild(resultsEl);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }

    // ── init ──────────────────────────────────────────────────────────
    function init() {
      // no-op if the page has no search trigger at all (respect targets)
      var triggers = document.querySelectorAll('.kp-search-btn, [data-action="search"]');
      var hasTrigger = triggers.length > 0;

      buildModal();

      for (var i = 0; i < triggers.length; i++) {
        triggers[i].addEventListener('click', function (e) { e.preventDefault(); open(); });
      }

      // Cmd/Ctrl+K global shortcut (always available once mounted).
      document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          if (overlay && overlay.classList.contains('open')) close(); else open();
        }
      });

      // "/" quick-focus (kp-enhance.js also clicks [data-action=search]; this
      // is a fallback for pages without that button). Ignore while typing.
      if (!hasTrigger) {
        document.addEventListener('keydown', function (e) {
          if (e.key !== '/' ) return;
          if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
          if (e.target && e.target.isContentEditable) return;
          e.preventDefault(); open();
        });
      }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.kpSearch = { __s02: true, open: open, close: close };
  } catch (e) { /* no-op */ }
})();
