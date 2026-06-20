/**
 * Prefetch one iconic Unsplash photo per Korean city → city-images.json.
 * The Unsplash Access Key is read from the env (UNSPLASH_ACCESS_KEY) and is
 * NEVER written to the output or committed — city-images.json holds only the
 * public CDN url + photographer attribution. Re-run when adding cities:
 *   UNSPLASH_ACCESS_KEY=xxx node prefetch-images.cjs
 * Unsplash API guidelines honored: hotlink the CDN image, attribute the
 * photographer + Unsplash, and trigger the download endpoint on use.
 */
const fs = require('fs');
const path = require('path');
const KEY = (process.env.UNSPLASH_ACCESS_KEY || '').trim();
if (!KEY) { console.error('Set UNSPLASH_ACCESS_KEY'); process.exit(1); }

// City → search query (landmark hints for iconic, relevant results).
const QUERIES = {
  Seoul: 'Seoul Korea',
  Busan: 'Busan South Korea Gamcheon culture village coast',
  Jeju: 'Jeju Island South Korea Seongsan Ilchulbong',
  Gyeongju: 'Gyeongju South Korea Bulguksa temple',
  Jeonju: 'Jeonju Hanok Village South Korea',
  Incheon: 'Incheon Korea',
  Gangneung: 'Gangneung South Korea beach east sea',
  Sokcho: 'Seoraksan mountains Sokcho South Korea',
  Suwon: 'Suwon Hwaseong Fortress South Korea',
  Daegu: 'Daegu South Korea city',
  Andong: 'Andong Hahoe folk village South Korea',
  Yeosu: 'Yeosu South Korea night harbour',
};
const AUTH = { headers: { Authorization: 'Client-ID ' + KEY, 'Accept-Version': 'v1' } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const out = {};
  const existing = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'city-images.json'), 'utf8')); } catch { return {}; } })();
  for (const [city, q] of Object.entries(QUERIES)) {
    if (existing[city] && existing[city].raw) { out[city] = existing[city]; console.log(city, '· cached'); continue; }
    try {
      const r = await fetch('https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&content_filter=high&query=' + encodeURIComponent(q), AUTH);
      const j = await r.json();
      const p = (j.results || [])[0];
      if (!p) { console.log(city, '· NO RESULT'); continue; }
      // Unsplash guideline: trigger the download endpoint when a photo is used.
      try { await fetch(p.links.download_location, AUTH); } catch { /* best-effort */ }
      out[city] = {
        raw: p.urls.raw,
        alt: (p.alt_description || p.description || (city + ', South Korea')).slice(0, 120),
        by: p.user.name,
        byUrl: p.user.links.html + '?utm_source=koreaplus&utm_medium=referral',
        link: p.links.html + '?utm_source=koreaplus&utm_medium=referral',
        id: p.id,
      };
      console.log(city, '· ok ·', p.id, 'by', p.user.name);
      await sleep(300);
    } catch (e) { console.log(city, '· ERR', String(e).slice(0, 80)); }
  }
  fs.writeFileSync(path.join(__dirname, 'city-images.json'), JSON.stringify(out, null, 1));
  console.log('\nwrote city-images.json with', Object.keys(out).length, 'cities (no key inside).');
})();
