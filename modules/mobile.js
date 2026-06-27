/* ════════════════════════════════════════════════════════════════════════
   mobile.js — KoreaPlus mobile foundation behaviors
   Mounts a Toss-style bottom navigation (thumb-first), context-aware via
   <body data-mnav="hub|kpop|travel">. Auto-hides on scroll-down, syncs the
   active item, and reuses existing in-page hooks (search button, filter
   tabs). Self-contained IIFE, 9 languages, reduced-motion safe.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__kpMobile) return; window.__kpMobile = 1;

  var L = (function () {
    try { return (localStorage.getItem('kp_lang') || (navigator.language || 'en').slice(0, 2) || 'en').toLowerCase(); }
    catch (e) { return 'en'; }
  })();
  function pick(m) { return (m && (m[L] || m.en)) || ''; }
  function langDir() { return (['ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'].indexOf(L) >= 0) ? L + '/' : ''; }

  // Short bottom-nav labels in 9 languages
  var T = {
    home:   { en: 'Home', ko: '홈', ja: 'ホーム', zh: '首页', es: 'Inicio', fr: 'Accueil', de: 'Start', pt: 'Início', id: 'Beranda' },
    charts: { en: 'Charts', ko: '차트', ja: 'チャート', zh: '榜单', es: 'Listas', fr: 'Charts', de: 'Charts', pt: 'Listas', id: 'Chart' },
    foryou: { en: 'For You', ko: '추천', ja: 'おすすめ', zh: '推荐', es: 'Para ti', fr: 'Pour toi', de: 'Für dich', pt: 'Para ti', id: 'Untukmu' },
    browse: { en: 'Browse', ko: '둘러보기', ja: '見る', zh: '浏览', es: 'Explorar', fr: 'Explorer', de: 'Stöbern', pt: 'Explorar', id: 'Jelajah' },
    search: { en: 'Search', ko: '검색', ja: '検索', zh: '搜索', es: 'Buscar', fr: 'Recherche', de: 'Suche', pt: 'Buscar', id: 'Cari' },
    top:    { en: 'Top', ko: '맨위', ja: '上へ', zh: '顶部', es: 'Arriba', fr: 'Haut', de: 'Oben', pt: 'Topo', id: 'Atas' },
    hub:    { en: 'K-Pop', ko: 'K-팝', ja: 'K-POP', zh: 'K-pop', es: 'K-Pop', fr: 'K-Pop', de: 'K-Pop', pt: 'K-Pop', id: 'K-Pop' },
    explore:{ en: 'Explore', ko: '탐색', ja: '探索', zh: '探索', es: 'Explora', fr: 'Explore', de: 'Entdecken', pt: 'Explorar', id: 'Jelajah' },
  };

  function openSearch() { var b = document.querySelector('.kp-search-btn'); if (b) { b.click(); return true; } return false; }
  function toTop() { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); } }

  // Context configs: act() = JS action; tab = filter-chip target; href = link
  var CTX = {
    hub: [
      { k: 'home',   ic: '🏠', act: toTop },
      { k: 'charts', ic: '📈', tab: 'kpop-charts' },
      { k: 'foryou', ic: '✨', tab: 'kpop-foryou' },
      { k: 'browse', ic: '📚', href: langDir() + 'kpop/browse.html' },
      { k: 'search', ic: '🔍', act: openSearch }
    ],
    kpop: [
      { k: 'hub',    ic: '🎤', href: '/kpop' },
      { k: 'browse', ic: '📚', href: langDir() + 'kpop/browse.html' },
      { k: 'search', ic: '🔍', act: openSearch },
      { k: 'top',    ic: '⬆️', act: toTop }
    ],
    travel: [
      { k: 'home',    ic: '🏠', href: 'index.html' },
      { k: 'explore', ic: '🧭', href: 'explore.html' },
      { k: 'search',  ic: '🔍', act: openSearch },
      { k: 'top',     ic: '⬆️', act: toTop }
    ]
  };

  function clearActive(row) { for (var i = 0; i < row.children.length; i++) row.children[i].classList.remove('is-active'); }

  function build(ctx) {
    var items = CTX[ctx]; if (!items || !document.body) return;
    var nav = document.createElement('nav');
    nav.className = 'mnav'; nav.setAttribute('aria-label', 'Primary'); nav.setAttribute('role', 'navigation');
    var row = document.createElement('div'); row.className = 'mnav-row';

    items.forEach(function (it) {
      var el;
      if (it.href && !it.tab && !it.act) { el = document.createElement('a'); el.setAttribute('href', it.href); }
      else { el = document.createElement('button'); el.type = 'button'; }
      el.className = 'mnav-item'; el.setAttribute('data-k', it.k);
      el.setAttribute('aria-label', pick(T[it.k]));
      el.innerHTML = '<span class="mnav-ic" aria-hidden="true">' + it.ic + '</span><span>' + pick(T[it.k]) + '</span>';
      el.addEventListener('click', function (e) {
        if (it.act) { e.preventDefault(); it.act(); }
        else if (it.tab) {
          e.preventDefault();
          var chip = document.querySelector('.filter-chip[data-target="' + it.tab + '"]');
          if (chip) chip.click();
          var sec = document.getElementById(it.tab);
          if (sec) try { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) { }
        }
        clearActive(row); el.classList.add('is-active');
        if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) { }
      });
      row.appendChild(el);
    });

    nav.appendChild(row);
    document.body.appendChild(nav);

    // Reveal + publish height so content padding + FABs can clear it.
    // Apply synchronously (offsetHeight forces layout) so it works even where
    // requestAnimationFrame is throttled (background tabs / headless renders).
    function reveal() {
      nav.classList.add('mnav-on');
      var h = nav.offsetHeight || 58;
      document.documentElement.style.setProperty('--mnav-h', h + 'px');
      document.body.classList.add('has-mnav');
    }
    reveal();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(reveal);

    autoHide(nav);
    return nav;
  }

  function autoHide(nav) {
    var last = 0, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (y > last + 8 && y > 160) nav.classList.add('mnav-hidden');
        else if (y < last - 8) nav.classList.remove('mnav-hidden');
        last = y; ticking = false;
      });
    }, { passive: true });
  }

  function init() {
    var ctx = document.body && document.body.getAttribute('data-mnav');
    if (ctx) build(ctx);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
