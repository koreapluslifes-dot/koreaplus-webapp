/* IndexNow instant-indexing submission — Bing / Naver / Yandex / Seznam.
   Run after every deploy: `node indexnow-submit.cjs`
   Reads the freshly-built sitemap.xml and submits all /guide/ canonical URLs.
   NOTE: the key file lives at /guide/<KEY>.txt, so IndexNow only accepts URLs
   under /guide/ (the /kpop clean URL and ?lang= variants are excluded). */
const https = require('https');
const fs = require('fs');
const path = require('path');

const KEY = 'kp7e3f1c9a2b5d48069e3f1c9a2b5d48';
const HOST = 'koreaplus-lifes.com';
const KEY_LOCATION = `https://${HOST}/guide/${KEY}.txt`;

const sm = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
const urls = [...new Set(
  [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    .filter(u => u.includes('/guide/') && !u.includes('?')),   // key path scope + drop ?lang= variants
)];

const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls });
const req = https.request('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
}, r => { console.log(`IndexNow: HTTP ${r.statusCode} (${urls.length} URLs submitted)`); r.resume(); });
req.on('error', e => console.log('IndexNow error:', e.message));
req.write(body);
req.end();
