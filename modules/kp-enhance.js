/* ══════════════════════════════════════════════════════════════════
   KoreaPlus — SEO-page enhancement bundle (kp-enhance.js)
   ~20 lightweight, high-value UX elements applied to every generated page
   in all 9 languages. Every feature is wrapped in try/catch and reads the
   page language from <html lang> so labels self-localize with NO dependency
   on the i18n message dict. Loaded (defer) by build-seo.cjs shell().
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var L = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    share:      { en: 'Share', ko: '공유', ja: 'シェア', zh: '分享', es: 'Compartir', fr: 'Partager', de: 'Teilen', pt: 'Compartilhar', id: 'Bagikan' },
    save:       { en: 'Save', ko: '저장', ja: '保存', zh: '收藏', es: 'Guardar', fr: 'Enregistrer', de: 'Merken', pt: 'Salvar', id: 'Simpan' },
    saved:      { en: 'Saved', ko: '저장됨', ja: '保存済み', zh: '已收藏', es: 'Guardado', fr: 'Enregistré', de: 'Gemerkt', pt: 'Salvo', id: 'Tersimpan' },
    copied:     { en: 'Link copied', ko: '링크 복사됨', ja: 'リンクをコピー', zh: '链接已复制', es: 'Enlace copiado', fr: 'Lien copié', de: 'Link kopiert', pt: 'Link copiado', id: 'Tautan disalin' },
    krCopied:   { en: 'Korean copied — show a local!', ko: '한국어 복사됨', ja: '韓国語をコピー', zh: '韩文已复制', es: 'Coreano copiado', fr: 'Coréen copié', de: 'Koreanisch kopiert', pt: 'Coreano copiado', id: 'Teks Korea disalin' },
    onThisPage: { en: 'On this page', ko: '목차', ja: '目次', zh: '目录', es: 'En esta página', fr: 'Sur cette page', de: 'Auf dieser Seite', pt: 'Nesta página', id: 'Di halaman ini' },
    minRead:    { en: 'min read', ko: '분 분량', ja: '分で読める', zh: '分钟阅读', es: 'min de lectura', fr: 'min de lecture', de: 'Min. Lesezeit', pt: 'min de leitura', id: 'mnt baca' },
    resume:     { en: 'Continue reading?', ko: '이어서 볼까요?', ja: '続きを読む？', zh: '继续阅读？', es: '¿Seguir leyendo?', fr: 'Reprendre ?', de: 'Weiterlesen?', pt: 'Continuar lendo?', id: 'Lanjut baca?' },
    listen:     { en: 'Listen', ko: '듣기', ja: '聞く', zh: '朗读', es: 'Escuchar', fr: 'Écouter', de: 'Anhören', pt: 'Ouvir', id: 'Dengar' },
    planCta:    { en: 'Plan my trip', ko: '내 여행 계획', ja: '旅行を計画', zh: '规划行程', es: 'Planear viaje', fr: 'Planifier', de: 'Reise planen', pt: 'Planejar viagem', id: 'Rencanakan' }
  };
  function t(k) { return (T[k] && (T[k][L] || T[k].en)) || k; }
  function ce(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  // ── shared toast ────────────────────────────────────────────────
  var toastEl;
  function toast(msg) {
    try {
      if (!toastEl) { toastEl = ce('div', 'kp-toast'); document.body.appendChild(toastEl); }
      toastEl.textContent = msg; toastEl.classList.add('on');
      clearTimeout(toast._t); toast._t = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
    } catch (e) {}
  }

  ready(function () {
    var main = document.querySelector('main.seo-wrap') || document.querySelector('main') || document.body;
    var hero = document.querySelector('.seo-hero');
    var article = document.querySelector('.seo-body');

    // 1) Reading-time badge (⏱ N min read) in the hero meta
    try {
      if (article && hero) {
        var words = (article.textContent || '').trim().split(/\s+/).length;
        var mins = Math.max(1, Math.round(words / 220));
        var meta = hero.querySelector('.meta');
        if (meta) { var b = ce('span', 'seo-badge', '⏱ ' + mins + ' ' + t('minRead')); meta.appendChild(b); }
      }
    } catch (e) {}

    // 2) Share + 3) Save action row under the hero
    try {
      if (hero) {
        var row = ce('div', 'kp-actions');
        var shareBtn = ce('button', 'kp-act', '<span aria-hidden="true">📤</span> ' + t('share'));
        shareBtn.type = 'button';
        shareBtn.addEventListener('click', function () {
          var data = { title: document.title, url: location.href };
          if (navigator.share) { navigator.share(data).catch(function () {}); }
          else if (navigator.clipboard) { navigator.clipboard.writeText(location.href).then(function () { toast(t('copied')); }); }
        });
        var saveBtn = ce('button', 'kp-act', '');
        saveBtn.type = 'button';
        var SKEY = 'kp_saved';
        function getSaved() { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { return {}; } }
        function isSaved() { return !!getSaved()[location.pathname]; }
        function renderSave() { saveBtn.innerHTML = (isSaved() ? '<span aria-hidden="true">⭐</span> ' + t('saved') : '<span aria-hidden="true">☆</span> ' + t('save')); saveBtn.classList.toggle('on', isSaved()); }
        saveBtn.addEventListener('click', function () {
          var s = getSaved();
          if (s[location.pathname]) delete s[location.pathname];
          else s[location.pathname] = { title: (document.querySelector('h1') || {}).textContent || document.title, ts: Date.now() };
          try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {}
          renderSave(); toast(isSaved() ? t('saved') : t('save'));
        });
        renderSave();
        row.appendChild(shareBtn); row.appendChild(saveBtn);
        hero.appendChild(row);
      }
    } catch (e) {}

    // 4) "On this page" scroll-spy mini-TOC (from existing .seo-toc, or built from h2s)
    try {
      var h2s = article ? [].slice.call(article.querySelectorAll('h2')) : [];
      if (h2s.length >= 3) {
        h2s.forEach(function (h, i) { if (!h.id) h.id = 'sec-' + i; });
        var toc = ce('nav', 'kp-toc');
        toc.setAttribute('aria-label', t('onThisPage'));
        toc.innerHTML = '<div class="kp-toc-h">' + t('onThisPage') + '</div>';
        h2s.forEach(function (h) {
          var a = ce('a', null, (h.textContent || '').replace(/^[^\w가-힣ぁ-んァ-ヶ一-鿿]+/, '').trim());
          a.href = '#' + h.id;
          a.addEventListener('click', function (ev) { ev.preventDefault(); document.getElementById(h.id).scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', '#' + h.id); });
          toc.appendChild(a);
        });
        article.parentNode.insertBefore(toc, article);
        // scroll-spy
        var links = [].slice.call(toc.querySelectorAll('a'));
        if ('IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (ents) {
            ents.forEach(function (en) { if (en.isIntersecting) { var id = en.target.id; links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + id); }); } });
          }, { rootMargin: '-20% 0px -70% 0px' });
          h2s.forEach(function (h) { io.observe(h); });
        }
      }
    } catch (e) {}

    // 5) Listen (TTS) + 6) copy for the hero Korean name (.kr) — great for taxis
    try {
      var kr = hero && hero.querySelector('.kr');
      if (kr && kr.textContent.trim()) {
        var krText = kr.textContent.trim();
        var tools = ce('span', 'kp-kr-tools');
        if ('speechSynthesis' in window) {
          var sp = ce('button', 'kp-kr-btn', '🔊');
          sp.type = 'button'; sp.title = t('listen'); sp.setAttribute('aria-label', t('listen'));
          sp.addEventListener('click', function () { try { var u = new SpeechSynthesisUtterance(krText); u.lang = 'ko-KR'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} });
          tools.appendChild(sp);
        }
        if (navigator.clipboard) {
          var cp = ce('button', 'kp-kr-btn', '📋');
          cp.type = 'button'; cp.title = 'Copy'; cp.setAttribute('aria-label', 'Copy Korean');
          cp.addEventListener('click', function () { navigator.clipboard.writeText(krText).then(function () { toast(t('krCopied')); }); });
          tools.appendChild(cp);
        }
        kr.appendChild(tools);
      }
    } catch (e) {}

    // 7) Image lightbox — tap the hero figure / any .seo-hero-img to zoom
    try {
      var imgs = [].slice.call(document.querySelectorAll('.seo-hero-img img, .seo-body img'));
      if (imgs.length) {
        var lb;
        function openLb(src, alt) {
          if (!lb) { lb = ce('div', 'kp-lb'); lb.innerHTML = '<img alt=""><button class="kp-lb-x" aria-label="Close">×</button>'; document.body.appendChild(lb); lb.addEventListener('click', function () { lb.classList.remove('on'); }); }
          lb.querySelector('img').src = src; lb.querySelector('img').alt = alt || ''; lb.classList.add('on');
        }
        imgs.forEach(function (im) { im.style.cursor = 'zoom-in'; im.addEventListener('click', function () { openLb(im.currentSrc || im.src, im.alt); }); });
      }
    } catch (e) {}

    // 8) Resume reading — remember scroll depth per URL, offer to continue
    try {
      var RKEY = 'kp_read_' + location.pathname;
      var saved = parseFloat(localStorage.getItem(RKEY) || '0');
      if (saved > 0.15 && saved < 0.9) {
        var bar = ce('div', 'kp-resume');
        bar.innerHTML = '<span>' + t('resume') + '</span>';
        var yes = ce('button', 'kp-resume-go', '↓'); bar.appendChild(yes);
        var no = ce('button', 'kp-resume-x', '×'); bar.appendChild(no);
        document.body.appendChild(bar); setTimeout(function () { bar.classList.add('on'); }, 700);
        yes.addEventListener('click', function () { window.scrollTo({ top: saved * document.documentElement.scrollHeight, behavior: 'smooth' }); bar.classList.remove('on'); });
        no.addEventListener('click', function () { bar.classList.remove('on'); });
      }
      var st;
      window.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(function () { try { var d = document.documentElement; localStorage.setItem(RKEY, (d.scrollTop / (d.scrollHeight - d.clientHeight || 1)).toFixed(3)); } catch (e) {} }, 400); }, { passive: true });
    } catch (e) {}

    // 9) Sticky mobile "Plan my trip" CTA (sits above the bottom tab bar)
    try {
      if (!document.querySelector('.kp-sticky-cta')) {
        var cta = ce('a', 'kp-sticky-cta', '🗺️ ' + t('planCta'));
        cta.href = 'plan.html';
        document.body.appendChild(cta);
        var last = 0;
        window.addEventListener('scroll', function () { var y = window.scrollY; cta.classList.toggle('show', y > 700 && y < document.documentElement.scrollHeight - 1400); last = y; }, { passive: true });
      }
    } catch (e) {}

    // 10) Keyboard shortcuts: "/" focus search, "t" back to top
    try {
      document.addEventListener('keydown', function (e) {
        if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
        if (e.key === '/') { var sb = document.querySelector('[data-action="search"]'); if (sb) { e.preventDefault(); sb.click(); } }
        else if (e.key === 't') { window.scrollTo({ top: 0, behavior: 'smooth' }); }
      });
    } catch (e) {}

    // 11) Harden external links (security + new-tab affordance)
    try {
      [].slice.call(document.querySelectorAll('a[href^="http"]')).forEach(function (a) {
        if (a.hostname && a.hostname !== location.hostname) { a.target = '_blank'; a.rel = (a.rel ? a.rel + ' ' : '') + 'noopener'; }
      });
    } catch (e) {}
  });
})();
