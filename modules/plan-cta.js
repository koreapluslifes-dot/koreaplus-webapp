/* Sticky mobile "Plan Trip" CTA — appears after scrolling past the hero.
   Keeps the planner one tap away without blocking the AI chat FAB. */
(function () {
  'use strict';
  if (window.__kpPlanCta) return;
  window.__kpPlanCta = true;

  var LBL = {
    en: { plan: 'Plan my trip', sub: 'Free AI itinerary' },
    ko: { plan: '여행 일정 짜기', sub: '무료 AI 플래너' },
    ja: { plan: '旅程を作る', sub: '無料AIプランナー' },
    zh: { plan: '规划行程', sub: '免费AI行程' },
    es: { plan: 'Planear viaje', sub: 'Itinerario IA gratis' },
    fr: { plan: 'Planifier', sub: 'Itinéraire IA gratuit' },
    de: { plan: 'Reise planen', sub: 'Kostenloser KI-Planer' },
    pt: { plan: 'Planejar viagem', sub: 'Roteiro IA grátis' },
    id: { plan: 'Buat rencana', sub: 'Itinerari AI gratis' }
  };

  function lang() {
    try {
      return (localStorage.getItem('kp_lang') || document.documentElement.lang || 'en').slice(0, 2);
    } catch (e) { return 'en'; }
  }
  function t(k) { var m = LBL[lang()] || LBL.en; return m[k] || LBL.en[k]; }

  function anchor() {
    return document.querySelector('.map-hero, .hub-hero, .plan-hero, .seo-wrap h1, #main');
  }

  function init() {
    if (document.getElementById('kp-plan-cta')) return;
    if (window.matchMedia('(min-width: 769px)').matches) return;

    var bar = document.createElement('a');
    bar.id = 'kp-plan-cta';
    bar.className = 'kp-plan-cta';
    bar.href = (window.kpUrl && kpUrl.href) ? kpUrl.href('plan.html') : 'plan';
    bar.setAttribute('aria-label', t('plan'));
    bar.innerHTML = '<span class="kp-plan-cta-i" aria-hidden="true">🗺️</span><span class="kp-plan-cta-t"><strong>' + t('plan') + '</strong><span>' + t('sub') + '</span></span>';
    document.body.appendChild(bar);

    var shown = false;
    function onScroll() {
      var el = anchor();
      var past = el ? (el.getBoundingClientRect().bottom < 80) : (window.scrollY > 420);
      if (past && !shown) { bar.classList.add('on'); shown = true; }
      else if (!past && shown) { bar.classList.remove('on'); shown = false; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    document.addEventListener('kp:langchange', function () {
      bar.setAttribute('aria-label', t('plan'));
      bar.querySelector('strong').textContent = t('plan');
      bar.querySelector('.kp-plan-cta-t span').textContent = t('sub');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
