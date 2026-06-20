/* KoreaPlus Service Worker — v7 */
const CACHE = 'kp-v43';
const BASE  = '/guide';

const PRECACHE = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/offline.html',
  BASE + '/style.css',
  BASE + '/hub-styles.css',
  BASE + '/theme.css',
  BASE + '/plan-styles.css',
  BASE + '/config.js',
  BASE + '/app.js',
  BASE + '/data.js',
  BASE + '/detail-data.js',
  BASE + '/detail-panel.js',
  BASE + '/manifest.json',
  BASE + '/icons/kplus.svg',
  BASE + '/plan.html',
  BASE + '/festivals.html',
  BASE + '/culture.html',
  BASE + '/temples.html',
  BASE + '/nightviews.html',
  BASE + '/about.html',
  BASE + '/privacy.html',
  BASE + '/terms.html',
  BASE + '/contact.html',
  /* Phase 6 — offline-first priority */
  BASE + '/emergency.html',
  BASE + '/phrases.html',
  BASE + '/currency.html',
  BASE + '/etiquette.html',
  BASE + '/seasons.html',
  BASE + '/kdrama-locations.html',
  BASE + '/kpop.html',
  BASE + '/kpop.css',
  BASE + '/kpop-data.js',
  BASE + '/kpop-enrich.js',
  BASE + '/kbeauty.html',
  BASE + '/kbeauty-data.js',
  BASE + '/assets/cosing-ingredients.json',
  BASE + '/assets/kbeauty-content.ko.json',
  BASE + '/assets/kbeauty-content.ja.json',
  BASE + '/assets/kbeauty-content.zh.json',
  BASE + '/assets/kbeauty-content.es.json',
  BASE + '/assets/kbeauty-content.fr.json',
  BASE + '/assets/kbeauty-content.de.json',
  BASE + '/assets/kbeauty-content.pt.json',
  BASE + '/assets/kbeauty-content.id.json',
  BASE + '/menu-translator.html',
  BASE + '/subway.html',
  BASE + '/modules/api-client.js',
  BASE + '/modules/kpop.js',
  BASE + '/modules/kpop-sharecard.js',
  BASE + '/modules/topads.js',
  BASE + '/modules/kbeauty.js',
  BASE + '/modules/kbeauty-sharecard.js',
  BASE + '/modules/dashboard.js',
  BASE + '/modules/week-section.js',
  BASE + '/modules/planner.js',
  BASE + '/modules/i18n.js',
  BASE + '/modules/theme.js',
  BASE + '/modules/search.js',
  BASE + '/modules/analytics.js',
  BASE + '/modules/header.js',
  BASE + '/modules/mytrip.js',
  BASE + '/modules/nav.js',
  BASE + '/modules/pwa.js',
  BASE + '/modules/affiliate.js',
  BASE + '/modules/klook.js',
  BASE + '/modules/cro.js',
  BASE + '/seo.css',
  BASE + '/explore.html',
  BASE + '/messages/en.json',
  BASE + '/messages/ko.json',
  BASE + '/messages/ja.json',
  BASE + '/messages/zh.json',
  BASE + '/messages/es.json',
  BASE + '/messages/fr.json',
  BASE + '/messages/de.json',
  BASE + '/messages/pt.json',
  BASE + '/messages/id.json',
];

// ── Install: pre-cache all static assets ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // Cache each asset individually so one missing file (e.g. gitignored
      // config.js) never aborts the whole install (addAll is atomic).
      .then(cache => Promise.allSettled(
        PRECACHE.map(p =>
          fetch(new Request(p, { cache: 'reload' }))
            .then(res => res.ok ? cache.put(p, res) : null)
            .catch(() => null)
        )
      ))
  );
  // Activate the new SW immediately (don't wait for all tabs to close) so
  // content/code updates apply on the next visit without the user having to
  // click the "update available" toast. modules/pwa.js reloads once on
  // controllerchange (guarded against loops) to swap in the fresh assets.
  self.skipWaiting();
});

// Allow the page (via modules/pwa.js) to trigger immediate activation.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin API calls
  if (request.method !== 'GET') return;
  if (url.hostname.includes('workers.dev'))   return;  // Cloudflare Worker API
  if (url.hostname.includes('googleapis.com')) return; // Google Maps / Places
  if (url.hostname.includes('openrouter.ai')) return;  // LLM
  if (url.hostname.includes('fonts.googleapis')) return;
  if (url.hostname.includes('googlesyndication.com')) return; // AdSense
  if (url.hostname.includes('doubleclick.net')) return;       // AdSense aux

  // Cache-first for same-origin assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(request, res.clone()));
          }
          return res;
        });
        return cached || network;
      }).catch(() => {
        // Offline fallback: branded offline page for uncached navigations
        if (request.mode === 'navigate') {
          return caches.match(request) || caches.match(BASE + '/offline.html');
        }
      })
    );
  }

  // Stale-while-revalidate for CDN assets (Fuse.js, Leaflet, etc.)
  if (
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('storage.googleapis.com')
  ) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const network = fetch(request).then(res => {
            cache.put(request, res.clone());
            return res;
          });
          return cached || network;
        })
      )
    );
  }
});
