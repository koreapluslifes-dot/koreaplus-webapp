/* KoreaPlus Service Worker — v3 */
const CACHE = 'kp-v3';
const BASE  = '/guide';

const PRECACHE = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/style.css',
  BASE + '/hub-styles.css',
  BASE + '/theme.css',
  BASE + '/plan-styles.css',
  BASE + '/config.js',
  BASE + '/app.js',
  BASE + '/data.js',
  BASE + '/manifest.json',
  BASE + '/icons/icon.svg',
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
  BASE + '/menu-translator.html',
  BASE + '/subway.html',
  BASE + '/modules/api-client.js',
  BASE + '/modules/dashboard.js',
  BASE + '/modules/week-section.js',
  BASE + '/modules/planner.js',
  BASE + '/modules/i18n.js',
  BASE + '/modules/theme.js',
  BASE + '/modules/search.js',
  BASE + '/modules/analytics.js',
  BASE + '/messages/en.json',
  BASE + '/messages/ko.json',
  BASE + '/messages/ja.json',
  BASE + '/messages/zh.json',
  BASE + '/messages/es.json',
];

// ── Install: pre-cache all static assets ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE.map(p => new Request(p, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
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
        // Offline fallback: return cached index for navigation
        if (request.mode === 'navigate') return caches.match(BASE + '/');
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
