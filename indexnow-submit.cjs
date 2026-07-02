/* IndexNow instant-indexing submission — Bing / Naver / Yandex / Seznam.
   Run after every deploy: `node indexnow-submit.cjs`
   Reads the freshly-built sitemap.xml AND kpop-sitemap.xml and submits all
   /guide/ canonical URLs (the K-Pop channel lives under /guide/.../kpop/...).
   NOTE: the key file lives at /guide/<KEY>.txt, so IndexNow only accepts URLs
   under /guide/ (the /kpop clean URL and ?lang= variants are excluded).
   IndexNow caps a single request at 10,000 URLs, so we chunk-split. */
const https = require('https');
const fs = require('fs');
const path = require('path');

const KEY = 'kp7e3f1c9a2b5d48069e3f1c9a2b5d48';
const HOST = 'koreaplus-lifes.com';
const KEY_LOCATION = `https://${HOST}/guide/${KEY}.txt`;
const CHUNK = 10000;

function locsFrom(file) {
  const fp = path.join(__dirname, file);
  if (!fs.existsSync(fp)) return [];
  const sm = fs.readFileSync(fp, 'utf8');
  return [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    .filter(u => u.includes('/guide/') && !u.includes('?'));  // key path scope + drop ?lang= variants
}

// Merge main + K-Pop + K-Beauty sitemaps, de-dupe across all three.
const urls = [...new Set([...locsFrom('sitemap.xml'), ...locsFrom('kpop-sitemap.xml'), ...locsFrom('kbeauty-sitemap.xml')])];

function submit(chunk, idx, total) {
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: chunk });
  const req = https.request('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
  }, r => { console.log(`IndexNow chunk ${idx}/${total}: HTTP ${r.statusCode} (${chunk.length} URLs)`); r.resume(); });
  req.on('error', e => console.log(`IndexNow chunk ${idx}/${total} error:`, e.message));
  req.write(body);
  req.end();
}

const chunks = [];
for (let i = 0; i < urls.length; i += CHUNK) chunks.push(urls.slice(i, i + CHUNK));
console.log(`IndexNow: submitting ${urls.length} URLs in ${chunks.length} chunk(s)`);
chunks.forEach((c, i) => submit(c, i + 1, chunks.length));
