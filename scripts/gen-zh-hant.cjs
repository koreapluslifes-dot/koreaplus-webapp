#!/usr/bin/env node
/* W2 — Traditional Chinese (zh-Hant) generation via post-render OpenCC transform.
 *
 * Isolated post-build step (does NOT touch build-seo.cjs). Run AFTER build-seo.cjs:
 *     node build-seo.cjs && node scripts/gen-zh-hant.cjs
 *
 * Reads every Simplified-Chinese page under zh/ , converts the CJK text to
 * Traditional (Taiwan idiom) with OpenCC, rewrites the language metadata
 * (lang / canonical / internal links / hreflang / og:locale / JSON-LD inLanguage)
 * into a self-consistent zh-hant cluster, and writes to zh-hant/ mirroring paths.
 * Then appends the zh-hant URLs to sitemap.xml + kpop-sitemap.xml.
 *
 * Requires: opencc-js  (npm i opencc-js).  Only needed at generation time; the
 * deployed artifact is plain static HTML.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OpenCC = require('opencc-js');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'zh');
const OUT = path.join(ROOT, 'zh-hant');
const BASE = 'https://koreaplus-lifes.com/guide/';

const s2t = OpenCC.Converter({ from: 'cn', to: 'twp' }); // Simplified → Traditional (TW idioms)

// ── recursive .html walk ────────────────────────────────────────────────
function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

// ── per-file transform ──────────────────────────────────────────────────
function transform(html) {
  // 1) CJK Simplified → Traditional. OpenCC only touches CJK codepoints, so ASCII
  //    tags / attributes / class names / URLs / scripts are left intact.
  let h = s2t(html);

  // 2) structural language metadata — NOT character conversion.
  // <html lang="zh"> → zh-Hant
  h = h.replace(/(<html[^>]*\blang=")zh(")/i, '$1zh-Hant$2');
  // every internal /guide/zh/ reference (canonical, nav/body links, og:url, the
  // self hreflang) → /guide/zh-hant/  (makes a self-consistent zh-hant cluster;
  // hreflang alts to OTHER languages use /guide/<lang>/ and are untouched).
  h = h.replace(/\/guide\/zh\//g, '/guide/zh-hant/');
  // relabel the (now zh-hant-pointing) Simplified self hreflang as Traditional +
  // add zh-TW / zh-HK regional aliases pointing at the same URL.
  h = h.replace(/(<link[^>]*\brel="alternate"[^>]*\bhreflang=")zh("[^>]*\bhref=")([^"]*\/guide\/zh-hant\/[^"]*)("[^>]*>)/i,
    (m, a, b, url, c) =>
      `${a}zh-Hant${b}${url}${c}` +
      `\n<link rel="alternate" hreflang="zh-TW" href="${url}">` +
      `\n<link rel="alternate" hreflang="zh-HK" href="${url}">`);
  // og:locale zh_CN → zh_TW
  h = h.replace(/(og:locale"\s*content=")zh_CN(")/i, '$1zh_TW$2');
  // JSON-LD inLanguage "zh" → "zh-Hant"
  h = h.replace(/("inLanguage":")zh(")/g, '$1zh-Hant$2');
  return h;
}

// ── run ─────────────────────────────────────────────────────────────────
if (!fs.existsSync(SRC)) { console.error('[zh-hant] no zh/ dir — run build-seo.cjs first'); process.exit(1); }
const files = walk(SRC, []);
let n = 0;
const locs = [];
for (const f of files) {
  const rel = path.relative(SRC, f);                 // e.g. kpop/2ne1.html
  const dst = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, transform(fs.readFileSync(f, 'utf8')));
  locs.push(BASE + 'zh-hant/' + rel.replace(/\\/g, '/'));
  n++;
}
console.log(`[zh-hant] generated ${n} pages → zh-hant/`);

// ── append zh-hant URLs to the sitemaps (mirror of each zh loc) ───────────
const today = fs.statSync(path.join(ROOT, 'zh')).mtime.toISOString().slice(0, 10);
function addToSitemap(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return 0;
  let sm = fs.readFileSync(p, 'utf8');
  // collect existing zh locs in THIS sitemap, emit zh-hant twins not already present
  const zhLocs = [...sm.matchAll(/<loc>\s*([^<]*\/guide\/zh\/[^<]*)\s*<\/loc>/g)].map(m => m[1].trim());
  let added = 0, add = '';
  for (const z of zhLocs) {
    const t = z.replace('/guide/zh/', '/guide/zh-hant/');
    if (sm.includes('<loc>' + t + '</loc>') || sm.includes(t + '</loc>')) continue;
    add += `<url><loc>${t}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    added++;
  }
  if (added) { sm = sm.replace(/<\/urlset>\s*$/, add + '</urlset>\n'); fs.writeFileSync(p, sm); }
  return added;
}
const a1 = addToSitemap('sitemap.xml');
const a2 = addToSitemap('kpop-sitemap.xml');
console.log(`[zh-hant] sitemap += ${a1} (main) + ${a2} (kpop)`);
