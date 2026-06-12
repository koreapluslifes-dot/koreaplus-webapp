/* KoreaPlus Analytics — GA4 + Microsoft Clarity, consent-gated */
(function () {
  // ── Config — fill in your real IDs ─────────────────────────────────────────
  const GA4_ID      = window.KP_GA4_ID      || 'G-FHNPTNFGJK';
  const CLARITY_ID  = window.KP_CLARITY_ID  || 'wy3z7trikr';

  const CONSENT_KEY = 'kp_consent';  // 'accepted' | 'declined' | null

  let loaded = false;
  let queue  = [];

  // ── Consent helpers ─────────────────────────────────────────────────────────
  function hasConsent()  { return localStorage.getItem(CONSENT_KEY) === 'accepted'; }
  function wasDeclined() { return localStorage.getItem(CONSENT_KEY) === 'declined'; }

  function grantConsent() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    hideBanner();
    loadVendors();
  }
  function declineConsent() {
    localStorage.setItem(CONSENT_KEY, 'declined');
    hideBanner();
  }

  function hideBanner() {
    const b = document.getElementById('kp-cookie-banner');
    if (b) b.classList.add('hidden');
    document.body.classList.remove('kp-cookie-open');
  }

  // ── Load GA4 ────────────────────────────────────────────────────────────────
  function loadGA4() {
    if (GA4_ID === 'G-XXXXXXXXXX') return; // placeholder — skip
    const s = document.createElement('script');
    s.async = true;
    s.src   = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, {
      anonymize_ip:  true,
      cookie_flags:  'SameSite=None;Secure',
      transport_url: undefined,
    });
  }

  // ── Load Microsoft Clarity ───────────────────────────────────────────────────
  function loadClarity() {
    if (CLARITY_ID === 'XXXXXXXXXX') return; // placeholder — skip
    /* jshint ignore:start */
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,"clarity","script",CLARITY_ID);
    /* jshint ignore:end */
  }

  function loadVendors() {
    if (loaded) return;
    loaded = true;
    loadGA4();
    loadClarity();
    // Flush queued events
    queue.forEach(([name, params]) => _fire(name, params));
    queue = [];
  }

  // ── Internal event dispatch ─────────────────────────────────────────────────
  function _fire(name, params = {}) {
    // GA4
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
    // Clarity custom tags
    if (typeof window.clarity === 'function') {
      window.clarity('set', name, JSON.stringify(params));
    }
  }

  // ── Public track function ───────────────────────────────────────────────────
  function track(name, params = {}) {
    if (hasConsent() && loaded) {
      _fire(name, params);
    } else if (hasConsent()) {
      queue.push([name, params]);
    }
    // silently drop if declined
  }

  // ── Auto-track key KoreaPlus events ────────────────────────────────────────
  function wireAutoEvents() {
    // Page view (already tracked by GA4 config, but track for Clarity)
    track('page_view', { page: location.pathname });

    // Track category clicks on index
    document.querySelectorAll('[data-cat]').forEach(el => {
      el.addEventListener('click', () => {
        track('category_viewed', { category: el.dataset.cat });
      });
    });

    // Track AI chatbot opens
    document.getElementById('ai-open-btn')?.addEventListener('click', () => {
      track('ai_guide_opened', {});
    });
    document.getElementById('chat-fab')?.addEventListener('click', () => {
      track('ai_guide_opened', { source: 'fab' });
    });

    // Planner — itinerary_generated (triggered externally from planner.js)
    // plan_saved, route_viewed, search_performed tracked inline
  }

  // ── Cookie banner wiring ────────────────────────────────────────────────────
  function wireBanner() {
    document.getElementById('kp-cookie-accept')?.addEventListener('click',  grantConsent);
    document.getElementById('kp-cookie-decline')?.addEventListener('click', declineConsent);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    wireBanner();
    if (hasConsent()) {
      hideBanner();
      loadVendors();
    } else if (wasDeclined()) {
      hideBanner();
    }
    // else: show banner — already visible by default in HTML
    wireAutoEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.kpAnalytics = { track, grantConsent, declineConsent };
})();
