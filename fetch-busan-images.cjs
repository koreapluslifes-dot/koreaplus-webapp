#!/usr/bin/env node
/* Fetch properly-licensed lead images for the Busan local-guide spots from
   Wikimedia (Wikipedia lead image + Commons attribution), same approach as
   fetch-wikimedia-images.cjs. Keyed by English Wikipedia article title so the
   busan-local.json "wiki" fields resolve directly.
   Writes busan-images.json. Run: node fetch-busan-images.cjs */
const fs = require('fs');
const UA = 'KoreaPlusImageBot/1.0 (https://koreaplus-lifes.com; alllifes77@gmail.com)';

// Union of the topic whitelists (busan-local content "wiki" fields draw from these).
const TITLES = [
  'Busan', 'Dwaeji gukbap', 'Hotteok', 'Milmyeon', 'Jagalchi Market', 'Eomuk',
  'Gwangalli Beach', 'Haeundae Beach', 'Songjeong Beach', 'Haeundae Blueline Park',
  'Igidae', 'Oryukdo', 'Songdo Beach (Busan)', 'Dongbaekseom', 'Dalmaji Hill',
  'Gamcheon Culture Village', 'Yeongdo District', 'Jeonpo-dong', 'Bosu-dong Book Street',
  'Choryang-dong', 'Gukje Market', 'Bupyeong Market (Busan)', 'Haeundae District',
  'Gwangan Bridge', 'Hwangnyeongsan', 'Haeundae LCT The Sharp', 'Sajik Baseball Stadium',
  'Korea Train Express', 'Busan Metro', 'Gimhae International Airport',
  'Busan–Gimhae Light Rail Transit', 'Busan Station', 'Donghae Line',
  "Dongnae District", "Jjimjilbang", "Shinsegae Centum City", "Beomeosa", "Geumjeongsan", "Geumjeong District", "Haedong Yonggungsa", "Gyeongju", "Tongyeong", "Geoje", "Jinhae-gu", "Ulsan", "Tongdosa", "Bulguksa", "Seomyeon", "Nampo-dong", "Busan International Film Festival", "Busan Cinema Center",
  "Taejongdae", "Busan Museum of Art", "Busan Citizens Park", "Busan Tower", "Yongdusan Park", "Centum City", "Busan Museum", "Songdo Cable Car", "Dadaepo Beach",
];

const stripTags = s => (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const api = 'https://en.wikipedia.org/w/api.php';
async function jget(params) {
  const url = api + '?' + new URLSearchParams({ format: 'json', ...params });
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function fetchTitle(title) {
  const pi = await jget({ action: 'query', redirects: '1', prop: 'pageimages', piprop: 'thumbnail|name', pithumbsize: '1280', titles: title });
  const page = Object.values(pi.query.pages)[0];
  const thumb = page && page.thumbnail && page.thumbnail.source;
  const file = page && page.pageimage;
  if (!thumb || !file) return { title, error: 'no lead image' };
  const ii = await jget({ action: 'query', prop: 'imageinfo', iiprop: 'extmetadata|url', titles: 'File:' + file });
  const fpage = Object.values(ii.query.pages)[0];
  const md = (fpage.imageinfo && fpage.imageinfo[0] && fpage.imageinfo[0].extmetadata) || {};
  const filePage = (fpage.imageinfo && fpage.imageinfo[0] && fpage.imageinfo[0].descriptionurl)
    || 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file);
  return {
    title,
    entry: {
      raw: thumb,
      alt: stripTags(md.ImageDescription && md.ImageDescription.value).slice(0, 120) || (title + ', Busan, South Korea'),
      by: stripTags(md.Artist && md.Artist.value) || 'Wikimedia Commons',
      byUrl: filePage,
      link: filePage,
      license: stripTags(md.LicenseShortName && md.LicenseShortName.value) || '',
      source: 'wikimedia',
      file,
    },
  };
}

(async () => {
  // MERGE, never overwrite: entries filled from ko.wikipedia or a Commons file
  // search live only in the JSON, so a fresh en.wikipedia run must not drop them.
  let out = {};
  try { out = JSON.parse(fs.readFileSync("busan-images.json", "utf8")); } catch { /* first run */ }
  let ok = 0, miss = 0;
  for (const t of TITLES) {
    if (out[t]) { console.log("SKIP " + t + " (already have)"); continue; }
    try {
      const r = await fetchTitle(t);
      if (r.entry) { out[t] = r.entry; ok++; console.log('OK   ' + t + '  ←  ' + r.entry.file); }
      else { miss++; console.log('MISS ' + t + ' (' + r.error + ')'); }
    } catch (e) { miss++; console.log('ERR  ' + t + ': ' + e.message); }
    await new Promise(r => setTimeout(r, 350)); // be polite to the API
  }
  fs.writeFileSync('busan-images.json', JSON.stringify(out, null, 2));
  console.log(`\nWrote busan-images.json — ${ok} images, ${miss} missing`);
})();
