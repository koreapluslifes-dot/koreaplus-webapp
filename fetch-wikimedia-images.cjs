#!/usr/bin/env node
/* Fetch accurate, properly-licensed city lead images from Wikimedia Commons via
   the Wikipedia API, to replace the generic Unsplash images in city-images.json.
   Writes city-images.wikimedia.json for review. Run: node fetch-wikimedia-images.cjs */
const fs = require('fs');
const UA = 'KoreaPlusImageBot/1.0 (https://koreaplus-lifes.com; alllifes77@gmail.com)';

// city name (as used in build-seo.cjs / city-l10n.json) → Wikipedia article title
const CITY_TITLE = {
  Seoul: 'Seoul', Busan: 'Busan', Jeju: 'Jeju Island', Gyeongju: 'Gyeongju',
  Jeonju: 'Jeonju', Incheon: 'Incheon', Gangneung: 'Gangneung', Sokcho: 'Sokcho',
  Suwon: 'Hwaseong Fortress', Daegu: 'Daegu', Daejeon: 'Daejeon', Andong: 'Andong', Yeosu: 'Yeosu',
  Taean: 'Taean County', Tongyeong: 'Tongyeong', Pohang: 'Pohang', Chuncheon: 'Chuncheon',
  Damyang: 'Damyang County', Jinju: 'Jinju', Suncheon: 'Suncheon', Boseong: 'Boseong County',
  Mokpo: 'Mokpo', Gongju: 'Gongju',
};

const stripTags = s => (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const api = 'https://en.wikipedia.org/w/api.php';
async function jget(params) {
  const url = api + '?' + new URLSearchParams({ format: 'json', ...params });
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function fetchCity(name, title) {
  // 1) lead image: 1280px thumbnail + the file name
  const pi = await jget({ action: 'query', redirects: '1', prop: 'pageimages', piprop: 'thumbnail|name', pithumbsize: '1280', titles: title });
  const page = Object.values(pi.query.pages)[0];
  const thumb = page.thumbnail && page.thumbnail.source;
  const file = page.pageimage;
  if (!thumb || !file) return { name, error: 'no lead image' };
  // 2) attribution: artist + license from Commons extmetadata
  const ii = await jget({ action: 'query', prop: 'imageinfo', iiprop: 'extmetadata|url', titles: 'File:' + file });
  const fpage = Object.values(ii.query.pages)[0];
  const md = (fpage.imageinfo && fpage.imageinfo[0] && fpage.imageinfo[0].extmetadata) || {};
  const filePage = (fpage.imageinfo && fpage.imageinfo[0] && fpage.imageinfo[0].descriptionurl)
    || 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file);
  const artist = stripTags(md.Artist && md.Artist.value) || 'Wikimedia Commons';
  const license = stripTags(md.LicenseShortName && md.LicenseShortName.value) || '';
  const descr = stripTags(md.ImageDescription && md.ImageDescription.value).slice(0, 120);
  return {
    name,
    entry: {
      raw: thumb,                 // ready-to-use ~1280px wikimedia thumbnail
      alt: descr || (name + ', South Korea'),
      by: artist,
      byUrl: filePage,
      link: filePage,
      license,
      source: 'wikimedia',
      file,
    },
  };
}

(async () => {
  const out = {};
  const report = [];
  for (const [name, title] of Object.entries(CITY_TITLE)) {
    try {
      const r = await fetchCity(name, title);
      if (r.entry) { out[name] = r.entry; report.push(`OK  ${name.padEnd(11)} ${r.entry.license.padEnd(16)} ${r.entry.by.slice(0, 28).padEnd(28)} ${r.entry.file.slice(0, 50)}`); }
      else report.push(`ERR ${name.padEnd(11)} ${r.error}`);
    } catch (e) { report.push(`ERR ${name.padEnd(11)} ${e.message}`); }
    await new Promise(res => setTimeout(res, 350)); // be polite to the API
  }
  fs.writeFileSync('city-images.wikimedia.json', JSON.stringify(out, null, 1));
  console.log(report.join('\n'));
  console.log('\nWrote city-images.wikimedia.json with ' + Object.keys(out).length + ' cities');
})();
