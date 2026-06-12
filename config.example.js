// Copy this file to config.js (gitignored) and fill in real values.
// config.js is NEVER committed — it stays on the server only.
// See API-SETUP.md for full instructions.

window.WORKER_URL = 'https://koreaplus-webapp.jeybeeicon.workers.dev';

// Browser-side Google Maps *Embed API* key (public, referer-restricted).
// Leave blank to fall back to "Tap to view on map" + Naver/Kakao links.
// This is SEPARATE from the worker's GOOGLE_PLACES_KEY (which must be
// unrestricted/IP-restricted — see API-SETUP.md §3).
window.MAPS_KEY   = '';
