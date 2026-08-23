/* build-kbeauty-pages.cjs — MASTER generator for the K-beauty content library.
   Emits substantive, crawlable pages under /guide/kb/<type>/<slug>.html built
   ENTIRELY from existing verified data (kbeauty-data.js) — no fabrication, no
   per-page AI. Owns the consolidated /kbeauty-sitemap.xml (hub 9-lang + every page).
   Run: node build-kbeauty-pages.cjs   (deploy /guide/kb/ + kbeauty-sitemap.xml)  */
const fs = require('fs');
const path = require('path');
const d = require('./kbeauty-data.js');
const SITE = 'https://koreaplus-lifes.com';
const HUB = SITE + '/kbeauty';
const OUT = path.join(__dirname, 'kb');
const TODAY = '2026-06-21';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function ensure(p) { fs.mkdirSync(path.join(OUT, p), { recursive: true }); }
// Windows writes 4,000+ files per build; AV/Search-indexer file locks surface as
// transient EBUSY/EPERM/UNKNOWN. Retry instead of dying half-built — a partially
// written library must never reach a deploy. The budget scales with the library:
// at 2,000 files a ~2.5s ceiling sufficed, at 4,000+ it did not, and a build that
// aborts two thirds of the way through is the worst possible outcome. Defined here,
// above every call site, so shared assets (kb.css, kb.js, the sitemap) get the same
// protection as the pages — those raw writes were the ones that actually broke.
const WRITE_ATTEMPTS = 12;
const LOCK_CODES = ['EBUSY', 'EPERM', 'UNKNOWN', 'EACCES'];
// Every path this build writes. Used at the end to delete pages a previous build
// produced and this one no longer does — otherwise a renamed or retired slug lingers
// on disk forever, duplicating its replacement and getting crawled.
const WRITTEN_PATHS = new Set();
function writeRetry(fp, data) {
  WRITTEN_PATHS.add(path.resolve(fp));
  for (let attempt = 0; ; attempt++) {
    try { fs.writeFileSync(fp, data); return; }
    catch (e) {
      if (!LOCK_CODES.includes(e.code)) throw e;
      // A plain write opens with truncate, which Windows denies outright while
      // another process holds the file — retrying that same call can never
      // succeed. Writing a sibling temp file and renaming over the target does,
      // because rename does not need to open the existing file. It is also
      // atomic, so a reader never sees a half-written page.
      try { const tmp = fp + '.tmp'; fs.writeFileSync(tmp, data); fs.renameSync(tmp, fp); return; }
      catch (e2) { if (attempt >= WRITE_ATTEMPTS || !LOCK_CODES.includes(e2.code)) throw e2; }
      const until = Date.now() + Math.min(1500, 150 * (attempt + 1)); // linear backoff, capped
      while (Date.now() < until) { /* sync backoff — the build is synchronous */ }
    }
  }
}
const sitemapUrls = [];   // { loc, prio }
const written = [];

// ── Library extension pack ────────────────────────────────────────────────────
// Extra ingredients / concerns / skin types / product types / brands that the
// LIBRARY carries but the hub does not. Deliberate split: kbeauty-data.js drives
// the interactive hub, whose 14 languages are fully translated overlay-by-overlay,
// so growing it there would mean shipping English into 13 localized hubs. The
// library is English + x-default, so it can scale freely. Same no-fabrication
// contract — see the pack's _readme.
let EXT = { ingredients: [], concerns: [], skintypes: [], categories: [], brands: [], conflicts: [], dose: [], moa: [], st_concerns: null };
try { EXT = Object.assign(EXT, require('./kbeauty-library-ext.json')); } catch (e) { console.warn('library ext pack absent — building core only'); }
// Second ingredient pack, merged in the same way. Ids already present win, so a
// later pack can never silently redefine an active the library already documents.
try {
  const E2 = require('./kbeauty-library-ext2.json');
  const have = new Set(EXT.ingredients.map(i => i.id));
  ['ingredients', 'dose', 'moa'].forEach(k => {
    const seen = new Set(EXT[k].map(x => x.id));
    (E2[k] || []).forEach(x => {
      if (k === 'ingredients' && have.has(x.id)) { console.warn(`ext2: ingredient "${x.id}" already defined — skipped`); return; }
      if (seen.has(x.id)) return;
      seen.add(x.id); EXT[k].push(x);
    });
  });
  EXT.conflicts = EXT.conflicts.concat(E2.conflicts || []);
} catch (e) { /* second pack optional */ }

const ING = (d.KBEAUTY_INGREDIENTS || []).concat(EXT.ingredients);
const ING_BY = Object.fromEntries(ING.map(i => [i.id, i]));
const BRANDS = (d.KBEAUTY_BRANDS || []).concat(EXT.brands);
const CONCERNS = (d.KBEAUTY_CONCERNS || []).concat(EXT.concerns);
const CONCERN_BY = Object.fromEntries(CONCERNS.map(c => [c.id, c]));
// Dupes merge from any drop-in pack too, keyed by id so a pack can never
// silently replace an existing entry.
const DUPES = (() => {
  const base = (d.KBEAUTY_DUPES || []).slice();
  const seen = new Set(base.map(x => x.id));
  fs.readdirSync(__dirname).filter(f => /^kbeauty-pack-.*\.json$/.test(f)).sort().forEach(f => {
    let pack; try { pack = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')); } catch (e) { return; }
    (pack.dupes || []).forEach(x => {
      if (!x || !x.id || !x.reference || !x.altName) return;
      if (seen.has(x.id)) { console.warn(`pack ${f}: duplicate dupe id "${x.id}" — skipped`); return; }
      seen.add(x.id); base.push(x);
    });
  });
  return base;
})();
const GLOSS = (d.KBEAUTY_GLOSSARY || []).concat((() => { try { return require('./kbeauty-editorial-ext.json').term || []; } catch (e) { return []; } })());
const CONFLICTS = (d.KBEAUTY_CONFLICTS || []).concat(EXT.conflicts);
const SKINTYPES = (d.KBEAUTY_SKINTYPES || []).concat(EXT.skintypes);
// Which concerns each skin type actually gets pages for — the gate that stops the
// cross-product generating "oily skin + flaking" style pages. The ext pack replaces
// it wholesale rather than merging: the core five have to widen too, or the new
// concerns would be unreachable from any existing skin type.
const ST_CONCERNS = EXT.st_concerns || { dry: ['dryness', 'dullness'], oily: ['oiliness', 'acne', 'pores'], combination: ['pores', 'oiliness', 'dryness'], sensitive: ['redness', 'dryness'], normal: ['dullness', 'aging'] };
// Product formats. Declared with the rest of the data rather than beside the
// section that first used it — the product and pick clusters need it earlier.
const CATS_ITEMS = ((d.KBEAUTY_CATEGORIES && d.KBEAUTY_CATEGORIES.items) || []).concat(EXT.categories);
const verd = id => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? (v.emoji + ' ' + v.label) : ''; };
// Traffic-10 datasets (authored, no-fabrication): pronunciation/Hangul, hanbang heritage, PAA Q&A.
// Authored extensions to the same datasets, kept in their own pack so the originals
// stay untouched and the additions are reviewable on their own.
let EDX = { say: { brands: [], ingredients: [] }, term: [], ask: [], hanbang: [] };
try { EDX = Object.assign(EDX, require('./kbeauty-editorial-ext.json')); } catch (e) { /* pack absent → originals only */ }
const _say = require('./kbeauty-say.json');
const SAY = { brands: _say.brands.concat(EDX.say.brands), ingredients: _say.ingredients.concat(EDX.say.ingredients) };
const HANBANG = require('./kbeauty-hanbang.json').concat(EDX.hanbang); // []
const ASKQ = require('./kbeauty-ask.json').concat(EDX.ask);            // []
// Advanced-20 science spine
const DOSE = require('./kbeauty-dose.json').concat(EXT.dose);   // [{id,pctRange,phRange,evidenceGrade,onset,ceilingNote,plainRead}]
const MOA = require('./kbeauty-moa.json').concat(EXT.moa);      // [{id,mechanism,target,ceiling,evidenceGrade}]
const EVID = require('./kbeauty-evidence.json');         // [{topic,slug,claim,grade,digest,citeIds}]
const FORM = require('./kbeauty-formulation.json');      // [{slug,title,h1,qa,sections}]
const ADVC = require('./kbeauty-adv-clusters.json');     // { ageClimate, fresh, hair, makeup, clinic }
const CITES = d.KBEAUTY_CITATIONS || {};

// ── Viral / social-share loop (OG-based) ────────────────────────────────────
// Per-language viral copy (tagline, share text, alt) — authored natively, loaded
// if present; English fallbacks keep the build green before the pack is merged.
let VIRAL = {};
try { VIRAL = require('./kbeauty-viral.json'); } catch (e) { /* pack not built yet */ }
const VIRAL_EN = { tagline: 'Korean skincare, decoded.', ogAlt: 'K-Beauty by KoreaPlus — Korean skincare guides, ingredients & brands', shareText: 'Found this on K-Beauty by KoreaPlus 👇', shareLabel: 'Share', shareTitle: 'Share this guide', copied: 'Link copied!', ctaFollow: 'Explore more K-beauty guides →' };
const viral = (lang) => Object.assign({}, VIRAL_EN, VIRAL[lang] || {});
// og:locale per 2-char page language (Open Graph territory tags help platforms
// preview the right language) — keyed by both 2-char and region hreflang codes.
const OG_LOCALE = { en: 'en_US', ko: 'ko_KR', ja: 'ja_JP', zh: 'zh_CN', 'zh-CN': 'zh_CN', es: 'es_ES', fr: 'fr_FR', de: 'de_DE', pt: 'pt_BR', 'pt-BR': 'pt_BR', id: 'id_ID', ar: 'ar_AR', hi: 'hi_IN', ru: 'ru_RU', vi: 'vi_VN', th: 'th_TH' };

// ── Q1: localized page chrome — the 16 strings that wrap every article ─────────
// (breadcrumb, quick-answer label, related, PAA, sources, CTA, footer trust lines).
// Native pack authored per-language (kbeauty-chrome-i18n.json); EN is the fallback.
let CHROME_PACK = {};
try { CHROME_PACK = require('./kbeauty-chrome-i18n.json'); } catch (e) { /* pack absent → EN */ }
const CHROME_EN = {
  skip: 'Skip to content', library: 'Library', quickAnswer: 'Quick answer', related: 'Related',
  paa: 'People also ask', readFull: 'Read the full answer →', sources: 'Sources', upNext: 'Up next',
  minRead: '{n} min read', hubLink: 'K-Beauty hub', allGuides: 'All guides', kpop: 'K-Pop', travel: 'Korea travel',
  reviewedBy: 'Written & reviewed by the KoreaPlus Editorial team — dermatologist-informed, cosmetic-science researched & source-cited.',
  lastReviewed: 'Last reviewed',
  disclaimer: 'General educational information using cosmetic structure-function wording — not medical advice. Always patch-test new actives.',
};
const chrome = (lang) => Object.assign({}, CHROME_EN, (CHROME_PACK[lang] || {}).chrome || {});

// ── Q2: content-hash freshness ledger — honest per-page dates ──────────────────
// Hash each page's INPUT content (h1+body, never the dates themselves). Content
// changed → lastChanged = the real build date; unchanged → dates stay put, so
// article:modified_time / Article LD / footer / sitemap <lastmod> only move when
// the page truly changed. Ledger persists in kb-freshness.json (committed).
const crypto = require('crypto');
const REAL_TODAY = new Date().toISOString().slice(0, 10);
const FRESH_FILE = path.join(__dirname, 'kb-freshness.json');
let FRESH = null; // null → first-ever run (migration): everything counts as changed today
try { FRESH = JSON.parse(fs.readFileSync(FRESH_FILE, 'utf8')); } catch (e) { }
const FRESH_MIGRATION = FRESH === null;
if (FRESH_MIGRATION) FRESH = {};
const FRESH_BY_URL = {}; // url → lastChanged, for per-URL sitemap <lastmod>
const FRESH_SEEN = new Set(); // keys touched this run — anything else is a dead page
function freshness(url, h1, bodyHtml) {
  const rel = String(url).replace(SITE + '/guide/kb/', '');
  FRESH_SEEN.add(rel);
  const hash = crypto.createHash('sha1').update(String(h1) + '|' + String(bodyHtml)).digest('hex');
  let e = FRESH[rel];
  if (!e) e = FRESH[rel] = { firstSeen: FRESH_MIGRATION ? '2026-06-01' : REAL_TODAY, lastChanged: REAL_TODAY, hash };
  else if (e.hash !== hash) { e.hash = hash; e.lastChanged = REAL_TODAY; }
  FRESH_BY_URL[url] = e.lastChanged;
  return { pub: e.firstSeen, mod: e.lastChanged };
}

// Theme tokens: every component color routes through CSS custom properties so the
// whole 2,255-page library gets dark mode from ONE definition. Dark applies via
// (a) OS preference unless the user forced light, (b) html.kb-dark forced toggle
// (persisted in kb_a11y, stamped pre-paint by an inline head script in shell()).
const THEME_DARK = '--bg:#161019;--text:#f1eaf3;--text2:#d8ccdc;--muted:#a795ac;--muted2:#8d7d93;--card:#221826;--card2:#281d2c;--border:#3b2c42;--border2:#2e2233;--link:#ff8fc0;--tint1:#2b1527;--tint2:#241a33;--tintc1:#271323;--tintc2:#221831;color-scheme:dark';
const CSS = ':root{--bg:#fff;--text:#1a1320;--text2:#333;--muted:#777;--muted2:#999;--card:#faf3f7;--card2:#f4eef2;--border:#f0d8e6;--border2:#eee;--link:#c01a63;--tint1:#fff0f6;--tint2:#f3ecff;--tintc1:#fff7fb;--tintc2:#f7f2ff;color-scheme:light}'
  + `@media (prefers-color-scheme:dark){:root:not(.kb-light){${THEME_DARK}}}`
  + `:root.kb-dark{${THEME_DARK}}`
  + 'body{margin:0;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--text);background:var(--bg)}'
  + '.w{max-width:740px;margin:0 auto;padding:22px 18px 64px}a{color:var(--link)}'
  + '.bc{font-size:13px;color:var(--muted);margin-bottom:12px}.bc a{color:var(--muted);text-decoration:none}'
  + 'h1{font-size:27px;line-height:1.25;margin:6px 0 6px}h2{font-size:18px;margin:26px 0 8px}.em{font-size:32px}'
  + '.ko{color:var(--muted2);font-size:15px;font-weight:600}'
  + '.lead{font-size:17px;color:var(--text2);line-height:1.6}'
  + '.box{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin:14px 0}'
  + '.pill{display:inline-block;font-size:12.5px;font-weight:700;background:var(--card2);border-radius:14px;padding:5px 11px;margin:3px 4px 3px 0;color:var(--text2);text-decoration:none}'
  + '.vb{display:inline-block;font-size:13px;font-weight:800;color:#fff;background:linear-gradient(135deg,#d61f6e,#8b46d6);border-radius:16px;padding:4px 12px}'
  + '.cta{display:inline-block;margin:18px 0;background:linear-gradient(135deg,#d61f6e,#8b46d6);color:#fff;text-decoration:none;font-weight:800;border-radius:24px;padding:12px 22px}'
  + 'ul{padding-left:20px}li{margin:5px 0}'
  + '.rel{margin-top:28px;border-top:1px solid var(--border2);padding-top:16px}.rel a{display:inline-block;margin:4px 8px 4px 0}'
  + '.foot{margin-top:24px;border-top:1px solid var(--border2);padding-top:14px;font-size:13px;color:var(--muted)}.foot a{margin-right:14px;text-decoration:none}'
  + '.kb-faq{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 14px;margin:8px 0}.kb-faq summary{cursor:pointer;font-weight:800;font-size:15px;color:var(--text)}.kb-faq p{margin:8px 0 2px;font-size:14.5px}'
  + '.qa{background:linear-gradient(135deg,var(--tint1),var(--tint2));border:1px solid var(--border);border-left:4px solid #d61f6e;border-radius:12px;padding:12px 15px;margin:14px 0 18px;font-size:15.5px;line-height:1.55;color:var(--text)}.qa b{color:var(--link)}'
  + '.kbh{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;padding:10px 18px;background:var(--bg);border-bottom:1px solid var(--border)}'
  + '.kbh-logo{font-weight:900;font-size:18px;color:var(--text);text-decoration:none;letter-spacing:-.01em}.kbh-logo b{color:#d61f6e}'
  + '.kbh-lib{margin-left:auto;font-size:13px;font-weight:800;color:var(--link);text-decoration:none}.kbh-lib:hover{text-decoration:underline}'
  + '.kbhub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:14px 0 30px}'
  + '.kbhub-card{display:block;padding:16px;border:1px solid var(--border);border-radius:14px;text-decoration:none;color:var(--text);background:var(--card);transition:transform .15s,box-shadow .15s}.kbhub-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(214,31,110,.1)}'
  + '.kbhub-card .he{font-size:24px}.kbhub-card .ht{font-weight:800;font-size:14.5px;margin-top:4px}.kbhub-card .hn{font-size:12px;color:var(--muted2);margin-top:2px}'
  + '.kbhub-sec{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--muted2);margin:24px 0 4px}'
  + '.disc{font-size:11.5px;color:var(--muted2);margin-top:16px}'
  // Clip the skip link rather than parking it at left:-999px. Off-canvas-left is
  // invisible in LTR but becomes real scrollable overflow under dir=rtl, which gave
  // every Arabic page ~999px of phantom horizontal scroll.
  + '.skip-link{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}'
  + '.skip-link:focus{position:fixed;top:0;inset-inline-start:0;width:auto;height:auto;margin:0;padding:8px 14px;overflow:visible;clip:auto;clip-path:none;background:#d61f6e;color:#fff;border-radius:0 0 8px 0;z-index:500;text-decoration:none}'
  + '.cmp{width:100%;border-collapse:collapse;font-size:14px;margin:12px 0}.cmp th,.cmp td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top}.cmp th{background:var(--card);font-weight:800}'
  + '.rank{display:flex;align-items:flex-start;gap:12px;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin:8px 0}.rank .rn{flex:0 0 auto;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#d61f6e,#8b46d6);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}.rank .rb{font-size:11px;font-weight:800;color:var(--link);text-transform:uppercase}'
  + '.grade{display:inline-block;font-size:11px;font-weight:800;border-radius:10px;padding:2px 9px;color:#fff}.grade.Strong{background:#1a7a45}.grade.Moderate{background:#2060c8}.grade.Emerging{background:#b35f1e}.grade.Limited,.grade.Insufficient{background:#5f6571}'
  + '.kb-constel{margin:8px 0 6px;background:linear-gradient(135deg,var(--tintc1),var(--tintc2));border:1px solid var(--border);border-radius:16px;padding:6px 4px}.kb-constel svg{display:block;max-width:420px;margin:0 auto}.kb-constel a{cursor:pointer;text-decoration:none}.kb-constel a:hover circle{stroke-width:3.4}.kb-constel a:focus-visible circle{stroke-width:3.4;outline:none}'
  + '.kb-paa{margin:26px 0 6px}.kb-paa>summary,.kb-paa .kb-q{cursor:pointer}.kb-q{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:11px 14px;margin:8px 0}.kb-q>summary{font-weight:800;font-size:15px;color:var(--text);list-style:none}.kb-q>summary::-webkit-details-marker{display:none}.kb-q>summary::before{content:"›";display:inline-block;margin-right:8px;color:var(--link);font-weight:900;transition:transform .15s}.kb-q[open]>summary::before{transform:rotate(90deg)}.kb-q p{margin:9px 0 3px;font-size:14.5px;color:var(--text2)}.kb-q a{font-weight:700}'
  + '.kp-nextsteps{margin:24px 0 4px;padding-top:18px;border-top:1px solid var(--border)}.kp-nextsteps[hidden]{display:none}.kp-ns-title{font-weight:800;font-size:15px;color:var(--text);margin:0 0 10px}.kp-share-btn{text-decoration:none;transition:transform .12s,filter .12s}.kp-share-btn:hover{transform:translateY(-1px);filter:brightness(1.05)}.kp-share-btn:active{transform:translateY(0)}'
  + '.kb-rt{display:inline-block;font-size:12.5px;font-weight:700;color:var(--muted);background:var(--card);border:1px solid var(--border);border-radius:12px;padding:3px 10px;margin:2px 0 10px}'
  + '.kb-upnext{display:block;margin:22px 0 4px;padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:14px;text-decoration:none;color:var(--text)}.kb-upnext .un-l{font-size:12px;font-weight:800;color:var(--link);text-transform:uppercase;letter-spacing:.03em}.kb-upnext .un-t{font-weight:800;font-size:15.5px;margin-top:3px}.kb-upnext:hover{border-color:var(--link)}'
  + '.kb-cont{margin:20px 0 4px}.kb-cont-h{font-weight:800;font-size:14px;color:var(--text);margin:0 0 8px}.kb-cont a{display:inline-block;font-size:12.5px;font-weight:700;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:5px 11px;margin:0 6px 6px 0;color:var(--text2);text-decoration:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:top}'
  + '.kb-src{font-size:13px;color:var(--muted);margin:18px 0 0}.kb-src a{font-weight:700}';
// Externalize the page CSS to one cached file (cuts ~4KB inline from every one of the
// 1,852+ pages; browsers cache it once). shell() links /guide/kb/kb.css?v=CSS_VER.
const JS_VER = '3';  // bump when kb/kb.js (shared runtime) changes
fs.mkdirSync(OUT, { recursive: true });
writeRetry(path.join(OUT, 'kb.css'), CSS);

// Q1: inject the runtime UI translations into kb/kb.js between its markers, so the
// shared runtime (search, a11y panel, TOC, continue-strip…) speaks all 14 languages.
// Idempotent — re-running the build just re-writes the same block.
try {
  const kbjsPath = path.join(OUT, 'kb.js');
  const src = fs.readFileSync(kbjsPath, 'utf8');
  const rt = {};
  Object.keys(CHROME_PACK).forEach(l => { if (CHROME_PACK[l].runtime) rt[l] = CHROME_PACK[l].runtime; });
  const out2 = src.replace(/\/\*L10N-START\*\/[\s\S]*?\/\*L10N-END\*\//, '/*L10N-START*/' + JSON.stringify(rt) + '/*L10N-END*/');
  if (out2 !== src) { writeRetry(kbjsPath, out2); console.log('kb.js: injected runtime l10n for', Object.keys(rt).length, 'languages'); }
} catch (e) { console.error('kb.js l10n injection skipped:', e.message); }

// ── Google AdSense — idle-gated (loads only after idle/first interaction, off the
//    critical render path → big LCP/INP win across all 1,852+ pages). Slot reserves
//    min-height to hold CLS ~0. ──
const ADSENSE_CLIENT = 'ca-pub-1378943893051810';
const ADSENSE_SLOT = '4521899200';
const AD_UNIT = `<ins class="adsbygoogle" style="display:block;margin:22px 0;width:100%;min-height:280px" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
const AD_BOOT = `<script>(function(){var d;function L(){if(d)return;d=1;var s=document.createElement('script');s.async=1;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';s.onload=function(){document.querySelectorAll('ins.adsbygoogle').forEach(function(){try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}})};document.head.appendChild(s);}['scroll','pointerdown','keydown','touchstart'].forEach(function(e){addEventListener(e,L,{once:true,passive:true})});(window.requestIdleCallback||function(f){setTimeout(f,2500)})(L,{timeout:5000});})();</script>`;
const CSS_VER = '5';

// Q1: the schema breadcrumb must say — and link — exactly what the visible one does.
// Non-EN pages name the library in their own language and point at their own
// language cluster; a mismatch here tells Google the page belongs to a tree it
// isn't actually in.
function crumbLD(o, C, libHome, hubHref) {
  const items = [
    { name: 'K-Beauty', item: hubHref },
    { name: C.library, item: libHome },
    { name: o.crumb || o.h1, item: o.url },
  ];
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) };
}
// Meta descriptions: never hard-slice mid-word. Cut at the last word boundary
// inside the limit and mark the elision, so a truncated snippet still reads as
// language. Spaceless scripts have no boundary to find — clamp and tidy instead.
const DESC_MAX = 158;
function clampDesc(s, lang) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (t.length <= DESC_MAX) return t;
  if (['ja', 'zh', 'th'].includes(lang)) return t.slice(0, DESC_MAX - 1).replace(/[、。，,\s]+$/, '') + '…';
  const cut = t.slice(0, DESC_MAX - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > DESC_MAX * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.—–-]+$/, '') + '…';
}
// ── #14 People-Also-Ask — build-time related-questions from the ASK bank ──
// Reuses the 39 already-authored Q&A entries: token-match each page's h1/title
// against the question bank, surface the top matches as an expandable accordion
// + fold them into the page's FAQPage schema (PAA/voice SERP + internal links).
const PAA_STOP = new Set(('the a an and or for to of in on at with your you is are be how what which who whom whose when where why does do can could should would will i my me it its this that these those best good bad korean kbeauty k-beauty skincare skin care use using vs than better help helps into out about more most very use used also get make made not no yes did was were has have had').split(' '));
const askTok = s => (String(s || '').toLowerCase().match(/[a-z][a-z-]{2,}/g) || []).filter(w => !PAA_STOP.has(w) && w.length > 2);
const ASK_PAA = ASKQ.map(q => ({ q: q.q, answer: q.answer, url: `${SITE}/guide/kb/ask/${q.slug}.html`, slug: q.slug, toks: new Set(askTok(q.q)) }));
function relatedQuestions(o, C) {
  C = C || CHROME_EN;
  if (o.ads === false) return { html: '', qs: [] };           // skip hubs/thin pages
  const ptoks = new Set(askTok((o.h1 || '') + ' ' + (o.title || '')));
  if (!ptoks.size) return { html: '', qs: [] };
  let scored = ASK_PAA
    .filter(a => o.url.indexOf('/ask/' + a.slug + '.html') < 0)  // never self-link
    .map(a => { let s = 0; a.toks.forEach(t => { if (ptoks.has(t)) s++; }); return { a, s }; })
    .filter(x => x.s >= 1).sort((x, y) => y.s - x.s).slice(0, 4);
  // Tokens are pre-stripped of stopwords + generic K-beauty terms, so a surviving
  // shared token (e.g. "niacinamide", "centella") is a real entity match. Require
  // 2+ related questions so a page never shows a lone tenuous match.
  if (scored.length < 2) return { html: '', qs: [] };
  const qs = scored.map(x => x.a);
  const html = `<section class="kb-paa" aria-label="${esc(C.paa)}"><h2>🙋 ${esc(C.paa)}</h2>`
    + qs.map(a => `<details class="kb-q"><summary>${esc(a.q)}</summary><p>${esc(a.answer)}</p><p><a href="${a.url}">${esc(C.readFull)}</a></p></details>`).join('')
    + `</section>`;
  return { html, qs };
}
function shell(o) {
  // o: {url, title, desc, depth, h1, emoji, ko, bodyHtml, ld, related, ads, quickAnswer}
  const back = '../'.repeat(o.depth || 2);
  const _lang = o.lang || 'en';
  const V = viral(_lang);
  const C = chrome(_lang);
  // Q2: honest dates — content-hash decides whether this page's dates move.
  const fr = freshness(o.url, o.h1, o.bodyHtml);
  // Q1: non-EN pages route their library links to the native cluster; hub link carries ?lang.
  const libHome = _lang !== 'en' ? `${SITE}/guide/kb/${_lang}/` : `${SITE}/guide/kb/`;
  const hubHref = _lang !== 'en' ? `${SITE}/kbeauty?lang=${_lang}` : `${SITE}/kbeauty`;
  // AEO: a short Korea-framed "Quick answer" on every content page, marked Speakable so
  // answer engines / voice assistants can quote it. Hubs (ads:false) skip it.
  const metaDesc = clampDesc(o.desc, _lang);
  const qaText = o.quickAnswer || (o.ads !== false ? (o.desc || '') : '');
  const speak = qaText ? [{ '@context': 'https://schema.org', '@type': 'WebPage', url: o.url, speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.qa', 'h1'] } }] : [];
  // #14 — related-questions accordion + FAQPage merge (fold into existing faqLD, no dup FAQPage node)
  const paa = relatedQuestions(o, C);
  const ldArr = [crumbLD(o, C, libHome, hubHref)].concat(o.ld || []);
  if (paa.qs.length) {
    const extra = paa.qs.map(a => ({ '@type': 'Question', name: a.q, acceptedAnswer: { '@type': 'Answer', text: a.answer } }));
    const fp = ldArr.find(x => x && x['@type'] === 'FAQPage');
    if (fp) { const have = new Set((fp.mainEntity || []).map(m => m.name)); fp.mainEntity = (fp.mainEntity || []).concat(extra.filter(e => !have.has(e.name))); }
    else ldArr.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: extra });
  }
  // Q2: real dates into every Article node (replaces the build-constant dates).
  ldArr.forEach(x => { if (x && x['@type'] === 'Article') { x.datePublished = fr.pub; x.dateModified = fr.mod; } });
  const ld = ldArr.concat(speak).map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('');
  // Ads only on substantive pages (AdSense policy: no ads on thin/low-value pages).
  const plain = (o.bodyHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const adsOk = o.ads !== false && plain.length >= 300;
  // Q3: reading-time chip (word-based; char-based for spaceless/dense scripts).
  const _dense = ['ko', 'ja', 'zh', 'th'].includes(_lang);
  const _mins = Math.max(1, Math.round(_dense ? plain.length / 500 : (plain.split(/\s+/).length / 200)));
  const rtChip = o.ads !== false ? `<div class="kb-rt">⏱ ${esc(C.minRead.replace('{n}', _mins))}</div>` : '';
  const hreflangs = o.altLinks || (`<link rel="alternate" hreflang="en" href="${o.url}">\n<link rel="alternate" hreflang="x-default" href="${o.url}">`);
  // ── OG/Twitter/article social block — the viral-share loop's engine. Baked into
  // every page (and every FUTURE page, since it lives in shell()). Per-language:
  // a localized share-card image, og:locale + the real alternate-locale cluster,
  // a summary_large_image Twitter card, and article provenance tags. ──
  const ogImg = `${SITE}/guide/kb/og/kb-og-${_lang}.png`;
  const ogLocale = OG_LOCALE[_lang] || 'en_US';
  const altLocales = [...new Set((hreflangs.match(/hreflang="([a-zA-Z-]+)"/g) || [])
    .map(m => m.replace(/.*"([a-zA-Z-]+)"/, '$1'))
    .filter(hl => hl !== 'x-default')
    .map(hl => OG_LOCALE[hl])
    .filter(loc => loc && loc !== ogLocale))];
  const ogSocial = `<meta property="og:image" content="${ogImg}"><meta property="og:image:secure_url" content="${ogImg}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="1200"><meta property="og:image:type" content="image/png"><meta property="og:image:alt" content="${esc(V.ogAlt)}">
<meta property="og:locale" content="${ogLocale}">${altLocales.map(l => `<meta property="og:locale:alternate" content="${l}">`).join('')}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(o.h1)}"><meta name="twitter:description" content="${esc(metaDesc)}"><meta name="twitter:image" content="${ogImg}"><meta name="twitter:image:alt" content="${esc(V.ogAlt)}"><meta name="twitter:site" content="@koreaplus">
<meta property="article:published_time" content="${fr.pub}"><meta property="article:modified_time" content="${fr.mod}"><meta property="article:author" content="KoreaPlus Editorial"><meta property="article:section" content="${esc(o.crumb || 'K-Beauty')}">`;
  return `<!doctype html><html lang="${o.lang || 'en'}"${o.lang === 'ar' ? ' dir="rtl"' : ''}><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)} | KoreaPlus</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${o.url}">
<meta property="og:title" content="${esc(o.h1)}"><meta property="og:description" content="${esc(metaDesc)}"><meta property="og:url" content="${o.url}"><meta property="og:type" content="article">
${ogSocial}
${hreflangs}
<link rel="icon" type="image/svg+xml" href="${SITE}/guide/kbeauty-favicon.svg">
<meta name="theme-color" content="#d61f6e">
<meta property="og:site_name" content="K-Beauty by KoreaPlus">
${ld}
<script>try{var a=JSON.parse(localStorage.getItem('kb_a11y')||'{}');if(a.theme==='dark')document.documentElement.classList.add('kb-dark');else if(a.theme==='light')document.documentElement.classList.add('kb-light')}catch(e){}</script>
<link rel="stylesheet" href="/guide/kb/kb.css?v=${CSS_VER}"></head><body>
<a class="skip-link" href="#main">${esc(C.skip)}</a>
<header class="kbh" role="banner"><a class="kbh-logo" href="${hubHref}" aria-label="K-Beauty home"><span aria-hidden="true">🧴</span> <b>K</b>·Beauty</a><a class="kbh-lib" href="${libHome}">📚 ${esc(C.library)}</a></header>
<main class="w" id="main" role="main" tabindex="-1">
<div class="bc"><a href="${hubHref}">K-Beauty</a> › <a href="${libHome}">${esc(C.library)}</a>${o.crumb ? ' › ' + o.crumb : ''}</div>
<div class="em" aria-hidden="true">${o.emoji || '✨'}</div>
<h1>${esc(o.h1)}${o.ko ? ` <span class="ko">${esc(o.ko)}</span>` : ''}</h1>
${rtChip}
${qaText ? `<div class="qa">⚡ <b>${esc(C.quickAnswer)}:</b> ${esc(qaText)}</div>` : ''}
${o.bodyHtml}
${adsOk ? AD_UNIT : ''}
<a class="cta" href="${hubHref}">${esc(V.ctaFollow)}</a>
${paa.html}
${o.related ? `<div class="rel"><h2>${esc(C.related)}</h2>${o.related}</div>` : ''}
<div class="kp-nextsteps" hidden></div>
<div class="foot"><a href="${hubHref}">💄 ${esc(C.hubLink)}</a><a href="${libHome}">📚 ${esc(C.allGuides)}</a><a href="${SITE}/guide/kpop.html">🎤 ${esc(C.kpop)}</a><a href="${SITE}/guide/">🧭 ${esc(C.travel)}</a></div>
<p class="disc">✍️ ${esc(C.reviewedBy)} ${esc(C.lastReviewed)}: ${fr.mod}.</p>
<p class="disc">${esc(C.disclaimer)} © KoreaPlus.</p>
</main>
${adsOk ? AD_BOOT : ''}
<script defer src="/guide/kb/kb.js?v=${JS_VER}"></script>
<script defer src="/guide/modules/share-viral.js?v=1"></script>
</body></html>`;
}
const INDEX = [];   // {rel, dir, title, emoji} — drives the category/language hub pages + up-next chains
// Emitted rel paths, for cross-section link guards. Several clusters want to link to
// a page another section only emits conditionally (best/ needs 3+ ranked ingredients),
// and linking optimistically is how the library grew broken internal links.
const WRITTEN_SET = new Set();
function emit(rel, html, prio) {
  const fp = path.join(OUT, rel); ensure(path.dirname(rel)); writeRetry(fp, html);
  // Hub pages canonicalize to their directory URL, so the sitemap has to list that
  // exact URL — a sitemap entry pointing away from its own canonical is a wasted
  // crawl. It's also the key the freshness ledger stored (shell got o.url).
  const loc = rel.endsWith('/index.html')
    ? `${SITE}/guide/kb/${rel.slice(0, -'index.html'.length)}`
    : `${SITE}/guide/kb/${rel}`;
  sitemapUrls.push({ loc, prio: prio || '0.6', mod: FRESH_BY_URL[loc] || REAL_TODAY }); written.push(rel); WRITTEN_SET.add(rel);
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : rel;
  const me = html.match(/<div class="em"[^>]*>([\s\S]*?)<\/div>/);
  const dir = rel.indexOf('/') >= 0 ? rel.slice(0, rel.indexOf('/')) : '_root';
  INDEX.push({ rel, dir, title, emoji: me ? me[1].trim() : '' });
}
const faqLD = (q, a) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }] });
const artLD = (h, desc, url) => ({ '@context': 'https://schema.org', '@type': 'Article', headline: h, description: desc, datePublished: '2026-06-01', dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus Editorial' }, reviewedBy: { '@type': 'Organization', name: 'KoreaPlus Editorial' }, publisher: { '@type': 'Organization', name: 'KoreaPlus' }, mainEntityOfPage: url });

// ── "Where to buy authentic" box (affiliate-ready; YesStyle AWIN deeplink slots in later) ──
// Real retailer search links now (rel sponsored nofollow); swap YesStyle URL for the
// AWIN deeplink once approved. Helps the high-intent K-beauty "buy authentic" journey.
const RETAILERS = [
  { n: '🛒 YesStyle', u: q => `https://www.yesstyle.com/en/search?q=${encodeURIComponent(q)}` },
  { n: '🛒 Amazon', u: q => `https://www.amazon.com/s?k=${encodeURIComponent(q + ' korean skincare')}` },
];
// Affiliate is paused site-wide (AdSense-first). buyBox emits nothing until re-enabled.
const AFFILIATE_ON = false;
function buyBox(query, label) {
  if (!AFFILIATE_ON) return '';
  const links = RETAILERS.map(r => `<a class="pill" rel="sponsored nofollow noopener" target="_blank" href="${r.u(query)}">${r.n}</a>`).join('');
  return `<div class="box"><b>🛍️ ${esc(label || ('Shop ' + query))}</b><div style="margin-top:8px">${links}</div>`
    + `<p class="disc" style="margin-top:8px">Links to trusted retailers — buy from official brand stores or first-party sellers to avoid counterfeits. Some links may earn KoreaPlus a commission at no extra cost to you.</p></div>`;
}

// Hub-spoke interlinking: surface the real ingredient/brand pages a piece of
// editorial/verdict copy is about (word-boundary match on its title/slug), plus
// CTAs into the interactive hub tools. Distributes authority + keeps users in K-beauty.
const KB_TOOLS = `<div style="margin-top:6px">`
  + `<a class="pill" href="${SITE}/kbeauty#cat=skin">🪞 Find your skin type</a>`
  + `<a class="pill" href="${SITE}/kbeauty#cat=routine">🧴 Build a routine</a>`
  + `<a class="pill" href="${SITE}/kbeauty#cat=buy">🛡️ Where to buy authentic</a></div>`;
function kbCrossLinks(item) {
  const hay = ' ' + [item.title, item.slug, item.h1, item.label].filter(Boolean).join(' ').toLowerCase() + ' ';
  const hit = n => new RegExp('(^|[^a-z])' + n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)').test(hay);
  const out = [];
  ING.forEach(i => { if (hit(i.name) || hay.includes(' ' + i.id + ' ') || hay.includes('-' + i.id + '-') || hay.includes('-' + i.id + ' ')) out.push(`<a class="pill" href="${SITE}/guide/kb/ingredient/${i.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`); });
  BRANDS.forEach(b => { if (hit(b.name)) out.push(`<a class="pill" href="${SITE}/guide/kb/brand/${b.id}.html">${b.emoji || ''} ${esc(b.name)}</a>`); });
  return [...new Set(out)].slice(0, 8);
}
function deeperBlock(item) {
  const links = kbCrossLinks(item);
  return (links.length ? `<h2>Related K-beauty guides</h2><div>${links.join('')}</div>` : '') + `<h2>Try the free tools</h2>${KB_TOOLS}`;
}

// ── #11 Ingredient Constellation — build-time radial SVG compatibility graph ──
// Turns the latent pairsWith/avoidWith arrays into a spatial, tappable map.
// Pure static SVG (deterministic radial layout) → zero-JS, CLS-safe; every node
// is an internal <a> to that ingredient's page (dense topical interlinking).
function constellationSVG(i, pairs, avoid) {
  const neigh = pairs.map(p => ({ o: p, type: 'good' }))
    .concat(avoid.map(p => ({ o: p, type: 'warn' })))
    .filter(n => n.o).slice(0, 8);
  if (neigh.length < 2) return '';
  const W = 340, H = 300, cx = W / 2, cy = 150, R = 112, rN = 22;
  const short = s => { s = String(s || ''); return s.length > 13 ? s.slice(0, 12) + '…' : s; };
  const col = t => t === 'good' ? '#1a7a45' : '#c0392b';
  const nodes = neigh.map((n, idx) => {
    const ang = (-90 + (360 / neigh.length) * idx) * Math.PI / 180;
    return Object.assign({ x: +(cx + R * Math.cos(ang)).toFixed(1), y: +(cy + R * Math.sin(ang)).toFixed(1) }, n);
  });
  const edges = nodes.map(n => `<line x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}" stroke="${col(n.type)}" stroke-width="2.4" stroke-opacity=".45"${n.type === 'warn' ? ' stroke-dasharray="5 4"' : ''}/>`).join('');
  const nodeEls = nodes.map(n => {
    const ly = n.y < cy ? n.y - rN - 6 : n.y + rN + 13;
    return `<a href="${esc(n.o.id)}.html" aria-label="${esc(n.o.name)} — ${n.type === 'good' ? 'pairs well' : 'use with care'}"><circle cx="${n.x}" cy="${n.y}" r="${rN}" style="fill:var(--card)" stroke="${col(n.type)}" stroke-width="2"/><text x="${n.x}" y="${n.y + 6}" text-anchor="middle" font-size="18">${esc(n.o.emoji || '•')}</text><text x="${n.x}" y="${ly}" text-anchor="middle" font-size="10.5" font-weight="700" style="fill:var(--text2)">${esc(short(n.o.name))}</text></a>`;
  }).join('');
  const center = `<circle cx="${cx}" cy="${cy}" r="34" style="fill:var(--bg)" stroke="#d61f6e" stroke-width="2.6"/><text x="${cx}" y="${cy + 2}" text-anchor="middle" font-size="24">${esc(i.emoji || '✨')}</text><text x="${cx}" y="${cy + 22}" text-anchor="middle" font-size="10.5" font-weight="800" style="fill:var(--text)">${esc(short(i.name))}</text>`;
  return `<h2>🌌 ${esc(i.name)} compatibility map</h2>
    <p style="font-size:13.5px;color:var(--muted);margin:2px 0 8px">Tap any ingredient to open its guide. <span style="color:#1a7a45;font-weight:700">━ pairs well</span> · <span style="color:#c0392b;font-weight:700">┈ use with care</span>.</p>
    <div class="kb-constel"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(i.name)} ingredient compatibility graph" xmlns="http://www.w3.org/2000/svg">${edges}${nodeEls}${center}</svg></div>`;
}

// ── 1. Ingredient deep-dives ────────────────────────────────────────────────
ING.forEach(i => {
  const concerns = (i.bestFor || []).map(c => CONCERN_BY[c]).filter(Boolean);
  const pairs = (i.pairsWith || []).map(id => ING_BY[id]).filter(Boolean);
  const avoid = (i.avoidWith || []).map(id => ING_BY[id]).filter(Boolean);
  const url = `${SITE}/guide/kb/ingredient/${i.id}.html`;
  const body = `<p class="lead">${esc(i.explainer || '')}</p>
    <h2>What ${esc(i.name)} does for your skin</h2><ul>${(i.benefits || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    ${concerns.length ? `<h2>Best for</h2><div>${concerns.map(c => `<a class="pill" href="../concern/${c.id}.html">${c.emoji || ''} ${esc(c.name)}</a>`).join('')}</div>` : ''}
    ${constellationSVG(i, pairs, avoid) || (pairs.length ? `<h2>Pairs well with</h2><div>${pairs.map(p => `<a class="pill" href="${p.id}.html">${p.emoji || ''} ${esc(p.name)}</a>`).join('')}</div>` : '')}
    ${avoid.length ? `<div class="box"><b>⚠️ Be careful pairing with:</b> ${avoid.map(p => esc(p.name)).join(', ')} — introduce gradually or alternate nights.</div>` : ''}
    <div class="box">🤰 <b>Pregnancy:</b> ${esc(i.preg === 'safe' ? 'Generally considered fine — confirm with your doctor.' : i.preg === 'caution' ? 'Ask your doctor before use during pregnancy.' : 'Check with your doctor.')} · ⏰ <b>Use:</b> ${esc((i.time || 'both').toUpperCase())}</div>
    ${buyBox('Korean ' + i.name, 'Shop Korean ' + i.name + ' products')}`;
  const related = ING.filter(x => x.id !== i.id && (x.cat === i.cat || (x.bestFor || []).some(b => (i.bestFor || []).includes(b)))).slice(0, 6).map(x => `<a href="${x.id}.html">${x.emoji || ''} ${esc(x.name)}</a>`).join('');
  emit(`ingredient/${i.id}.html`, shell({ url, depth: 3, crumb: 'Ingredients', emoji: i.emoji, h1: `${i.name}: K-beauty ingredient guide`, ko: i.korean, title: `${i.name} in K-beauty — benefits, how to use, what to pair`, desc: i.explainer, bodyHtml: body, related, ld: [artLD(`${i.name} in K-beauty`, i.explainer, url), faqLD(`What does ${i.name} do for skin?`, (i.benefits || []).join(' ') )] }), '0.7');
});

// ── 2. Brand profiles ───────────────────────────────────────────────────────
const tierLabel = { drugstore: 'Drugstore / affordable', midrange: 'Mid-range', premium: 'Premium', luxury: 'Luxury' };
BRANDS.forEach(b => {
  const url = `${SITE}/guide/kb/brand/${b.id}.html`;
  const body = `<p class="lead">${esc(b.name)}${b.korean ? ` (${esc(b.korean)})` : ''} is a Korean beauty brand known for ${esc((b.knownFor || '').toLowerCase())}.</p>
    <h2>At a glance</h2><div>
      <span class="pill">${esc(tierLabel[b.tier] || b.tier || '')}</span>
      ${b.vegan ? '<span class="pill">🌱 Vegan-friendly lines</span>' : ''}
      ${b.men ? '<span class="pill">🧔 Men-friendly</span>' : ''}
      ${b.intl ? '<span class="pill">🌍 Ships internationally</span>' : ''}
    </div>
    ${(b.hero || []).length ? `<h2>Hero products</h2><ul>${(b.hero || []).map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
    <h2>Where to buy ${esc(b.name)} authentic</h2>
    <p>${esc(b.name)} is widely counterfeited on open marketplaces — buy from the brand's official store or a trusted first-party retailer.</p>
    ${buyBox(b.name, 'Shop ' + b.name)}`;
  const related = BRANDS.filter(x => x.id !== b.id && x.tier === b.tier).slice(0, 6).map(x => `<a href="${x.id}.html">${x.emoji || ''} ${esc(x.name)}</a>`).join('');
  const brandLd = [
    { '@context': 'https://schema.org', '@type': 'Brand', name: b.name, alternateName: b.korean || undefined, description: b.knownFor, url },
    (b.hero || []).length ? { '@context': 'https://schema.org', '@type': 'ItemList', name: b.name + ' hero products', itemListElement: b.hero.map((h, i) => ({ '@type': 'ListItem', position: i + 1, name: h })) } : null,
    artLD(b.name + ' brand profile', b.knownFor, url),
  ].filter(Boolean);
  emit(`brand/${b.id}.html`, shell({ url, depth: 3, crumb: 'Brands', emoji: b.emoji, h1: `${b.name}: Korean beauty brand`, ko: b.korean, title: `${b.name} — K-beauty brand profile, hero products, where to buy`, desc: `${b.name}: ${b.knownFor}. Hero products, tier, and how to buy authentic.`, bodyHtml: body, related, ld: brandLd }), '0.6');
});

// ── 3. Concern hubs ─────────────────────────────────────────────────────────
CONCERNS.forEach(c => {
  const look = (c.lookFor || []).map(id => ING_BY[id]).filter(Boolean);
  const url = `${SITE}/guide/kb/concern/${c.id}.html`;
  const body = `<p class="lead">${esc(c.desc || '')}</p>
    <h2>Ingredients to look for</h2><div>${look.map(i => `<a class="pill" href="../ingredient/${i.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`).join('')}</div>
    ${c.tip ? `<div class="box">💡 <b>Tip:</b> ${esc(c.tip)}</div>` : ''}
    ${c.avoid ? `<div class="box">⚠️ <b>Be careful with:</b> ${esc(c.avoid)}</div>` : ''}
    <h2>Build a routine for ${esc(c.name.toLowerCase())}</h2><p>Start gentle, introduce one active at a time, and always finish your morning routine with SPF.</p>
    <div>${SKINTYPES.map(s => `<a class="pill" href="../routine/${s.id}-${c.id}.html">${s.emoji || ''} ${esc(s.name)} skin</a>`).join('')}</div>
    <p><a href="${SITE}/kbeauty">Use the free routine builder →</a></p>`;
  const related = look.slice(0, 6).map(i => `<a href="../ingredient/${i.id}.html">${i.emoji || ''} ${esc(i.name)} for ${esc(c.id)}</a>`).join('');
  const cDesc = `${String(c.desc || '').replace(/\.$/, '')}. Korean skincare for ${c.name.toLowerCase()}: the ingredients to look for${look.length ? ` (${look.slice(0, 4).map(i => i.name).join(', ')})` : ''}, what to be careful with, and a routine for every skin type.`;
  emit(`concern/${c.id}.html`, shell({ url, depth: 3, crumb: 'Concerns', emoji: c.emoji, h1: `Korean skincare for ${c.name.toLowerCase()}`, title: `K-beauty for ${c.name} — ingredients, routine & what to avoid`, desc: cDesc, bodyHtml: body, related, ld: [artLD(`Korean skincare for ${c.name}`, c.desc, url), faqLD(`What Korean ingredients help with ${c.name.toLowerCase()}?`, look.map(i => i.name).join(', '))] }), '0.7');
});

// ── 4. Ingredient × concern (gated to real, relevant pairs) ──────────────────
let icCount = 0;
CONCERNS.forEach(c => {
  const ings = ING.filter(i => (i.bestFor || []).includes(c.id) || (c.lookFor || []).includes(i.id));
  ings.forEach(i => {
    const url = `${SITE}/guide/kb/ingredient/${i.id}-for-${c.id}.html`;
    const body = `<p class="lead">Does ${esc(i.name)} help with ${esc(c.name.toLowerCase())}? Here's the honest, structure-function read.</p>
      <p>${esc(i.explainer || '')}</p>
      <h2>Why it helps ${esc(c.name.toLowerCase())}</h2><ul>${(i.benefits || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="box">💡 <b>How to use:</b> ${esc((i.time || 'both').toUpperCase())} · introduce gradually and patch-test. ${(c.tip ? esc(c.tip) : '')}</div>
      <p><a href="${i.id}.html">Full ${esc(i.name)} guide →</a> · <a href="../concern/${c.id}.html">All ${esc(c.name.toLowerCase())} ingredients →</a></p>`;
    const icDesc = `Does ${i.name} help ${c.name.toLowerCase()}? ${String((i.benefits || [])[0] || i.explainer || '').replace(/\.$/, '')}. How it works, when to apply it (${(i.time || 'both').toUpperCase()}), and how to introduce it without irritating your skin.`;
    emit(`ingredient/${i.id}-for-${c.id}.html`, shell({ url, depth: 3, crumb: 'Ingredients', emoji: i.emoji, h1: `${i.name} for ${c.name.toLowerCase()}`, title: `${i.name} for ${c.name} — does it work?`, desc: icDesc, bodyHtml: body, ld: [faqLD(`Is ${i.name} good for ${c.name.toLowerCase()}?`, (i.benefits || []).join(' '))] }), '0.6');
    icCount++;
  });
});

// ── 5. "Can I mix X and Y?" (from conflicts + safe pairs) ────────────────────
let mixCount = 0;
const seenMix = new Set();
function mixPage(aId, bId, verdict, reason) {
  const a = ING_BY[aId], b = ING_BY[bId]; if (!a || !b) return;
  const key = [aId, bId].sort().join('|'); if (seenMix.has(key)) return; seenMix.add(key);
  const url = `${SITE}/guide/kb/mix/${[aId, bId].sort().join('-')}.html`;
  const vlabel = verdict === 'avoid' ? '🚫 Better apart' : verdict === 'caution' ? '⚠️ With care' : '✅ Fine together';
  const body = `<p class="lead">Can you use <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> together?</p>
    <p><span class="vb">${vlabel}</span></p>
    <div class="box">${esc(reason)}</div>
    <p><a href="../ingredient/${a.id}.html">${esc(a.name)} guide →</a> · <a href="../ingredient/${b.id}.html">${esc(b.name)} guide →</a></p>`;
  // Name both actives in the description — several pairs share the same one-line
  // reason, and an identical meta description makes them look like the same page.
  const vplain = verdict === 'avoid' ? 'better used apart' : verdict === 'caution' ? 'usable with care' : 'fine together';
  const mixDesc = `Can you use ${a.name} and ${b.name} together in a Korean routine? Verdict: ${vplain}. ${reason}`;
  emit(`mix/${[aId, bId].sort().join('-')}.html`, shell({ url, depth: 3, crumb: 'Mixing', emoji: '🧪', h1: `Can I use ${a.name} and ${b.name} together?`, title: `${a.name} + ${b.name}: can you mix them?`, desc: mixDesc, bodyHtml: body, ld: [faqLD(`Can I use ${a.name} and ${b.name} together?`, reason)] }), '0.6');
  mixCount++;
}
CONFLICTS.forEach(cf => mixPage(cf.a, cf.b, cf.verdict, cf.reason));
ING.forEach(i => (i.pairsWith || []).forEach(pid => mixPage(i.id, pid, 'safe', `${i.name} and ${ING_BY[pid] ? ING_BY[pid].name : pid} layer well together — a common, complementary K-beauty pairing. Apply thinnest to thickest and give each a moment to absorb.`)));
// "Can I use X and Y together?" is one of the highest-volume questions in skincare,
// and the authored pairs above only cover the combinations someone thought to write
// down. Fill in the rest for the actives people actually stack — but derive every
// verdict from a stated rule rather than asserting compatibility we have not checked:
// declared conflicts win, then two irritation-class actives are always "caution",
// and only genuinely low-risk combinations are called safe. The reasoning is printed
// on the page so a reader can judge the rule, not just the answer.
(function deriveMixes() {
  const ASKED_ABOUT = new Set(['exfoliant', 'anti-aging', 'brightening', 'acne-care', 'antioxidant']);
  const IRRITATING = new Set(['exfoliant', 'acne-care']);
  const isRetinoid = id => ['retinol', 'retinal'].includes(id);
  const acts = ING.filter(i => ASKED_ABOUT.has(i.cat) || isRetinoid(i.id));
  const CAP = 12, used = {};
  for (let x = 0; x < acts.length; x++) for (let y = x + 1; y < acts.length; y++) {
    const a = acts[x], b = acts[y];
    if ((used[a.id] || 0) >= CAP || (used[b.id] || 0) >= CAP) continue;
    const declaredClash = (a.avoidWith || []).includes(b.id) || (b.avoidWith || []).includes(a.id);
    const bothHarsh = (IRRITATING.has(a.cat) || isRetinoid(a.id)) && (IRRITATING.has(b.cat) || isRetinoid(b.id));
    let verdict, reason;
    if (declaredClash) {
      verdict = 'caution';
      reason = `${a.name} and ${b.name} are flagged in this library as a pair to keep apart. Use them on alternate evenings, or split them between your morning and evening routine, rather than layering them in one sitting.`;
    } else if (bothHarsh) {
      verdict = 'caution';
      reason = `Both ${a.name} and ${b.name} push skin in the same irritating direction — more turnover, more sensitivity. Combining them rarely doubles the result and reliably doubles the sting. Alternate nights instead.`;
    } else if ((a.time === 'am' && b.time === 'pm') || (a.time === 'pm' && b.time === 'am')) {
      verdict = 'safe';
      reason = `${a.name} suits ${(a.time || 'both').toUpperCase()} and ${b.name} suits ${(b.time || 'both').toUpperCase()}, so the simplest answer is to use each at its own time of day. Split that way there is no conflict at all.`;
    } else {
      verdict = 'safe';
      reason = `Nothing in this library flags ${a.name} and ${b.name} as a problem pair, and neither is an exfoliating or retinoid active that would compound irritation. Layer thinnest to thickest, give each a moment to settle, and introduce them one at a time so you can tell which is doing what.`;
    }
    if (mixPage(a.id, b.id, verdict, reason) !== false) { used[a.id] = (used[a.id] || 0) + 1; used[b.id] = (used[b.id] || 0) + 1; }
  }
})();

// ── 6. Dupe pages ───────────────────────────────────────────────────────────
const BRAND_BY = Object.fromEntries(BRANDS.map(b => [b.id, b]));
DUPES.forEach(dp => {
  const url = `${SITE}/guide/kb/dupe/${dp.id}.html`;
  const altBrand = dp.altBrandId && BRAND_BY[dp.altBrandId] ? BRAND_BY[dp.altBrandId] : null;
  const body = `<p class="lead">Looking for a Korean alternative to <b>${esc(dp.reference)}</b>? ${esc(dp.referenceRole || '')}</p>
    <h2>The K-beauty alternative</h2>
    <div class="box"><b>${esc(dp.altName || '')}</b><br>≈ <b>${esc(dp.sharedHero || '')}</b> — ${esc(dp.whyComparable || '')}</div>
    <p><b>${esc(dp.reference)}</b> ${dp.referenceBand ? `(${esc(dp.referenceBand)})` : ''} vs the Korean pick — similar hero ingredients, a fraction of the price.</p>
    ${altBrand ? `<p><a href="../brand/${altBrand.id}.html">${altBrand.emoji || ''} More from ${esc(altBrand.name)} →</a></p>` : ''}
    ${buyBox(dp.altName || dp.reference, 'Shop the Korean alternative')}
    <p><a href="${SITE}/kbeauty">See all ${DUPES.length} K-beauty dupes →</a></p>`;
  const dupeLd = [
    { '@context': 'https://schema.org', '@type': 'ItemList', name: `Korean dupe for ${dp.reference}`, itemListElement: [
      { '@type': 'ListItem', position: 1, item: { '@type': 'Product', name: dp.reference, category: dp.category } },
      { '@type': 'ListItem', position: 2, item: { '@type': 'Product', name: dp.altName, category: dp.category, brand: altBrand ? { '@type': 'Brand', name: altBrand.name } : undefined } },
    ] },
    faqLD(`Is ${dp.altName} a good dupe for ${dp.reference}?`, `${dp.altName} shares ${dp.sharedHero || 'the key hero ingredients'} with ${dp.reference}. ${dp.whyComparable || ''}`.trim()),
    artLD(`Korean dupe for ${dp.reference}`, dp.whyComparable, url),
  ];
  // One Western product can have several Korean dupes, each with its own page —
  // name the alternative in the title so the siblings don't share one.
  const dupeTitle = dp.altName ? `Korean dupe for ${dp.reference}: ${dp.altName}` : `Korean dupe for ${dp.reference}`;
  const dupeDesc = `${dp.altName ? `${dp.altName} is the Korean dupe for ${dp.reference}` : `The Korean dupe for ${dp.reference}`}${dp.sharedHero ? ` — same hero ingredients (${dp.sharedHero})` : ''}. ${dp.whyComparable || ''}${dp.save ? ` Save ${dp.save}.` : ''}`;
  emit(`dupe/${dp.id}.html`, shell({ url, depth: 3, crumb: 'Dupes', emoji: dp.referenceEmoji || '💸', h1: `${dp.altName || 'Korean dupe'} — a K-beauty alternative to ${dp.reference}`, title: dupeTitle, desc: dupeDesc, bodyHtml: body, ld: dupeLd }), '0.6');
});

// ── 6b. "Korean alternative to [global product]" — inverse-keyed by the Western
//        product people actually search for (groups all Korean alts per reference).
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const byRef = {};
DUPES.forEach(dp => { (byRef[dp.reference] = byRef[dp.reference] || []).push(dp); });
Object.keys(byRef).forEach(ref => {
  const alts = byRef[ref];
  const slug = slugify(ref); if (!slug) return;
  const url = `${SITE}/guide/kb/alternative/${slug}.html`;
  const a0 = alts[0];
  const qa = `In Korean skincare, the go-to alternative to ${ref} is ${a0.altName} — it delivers ${a0.sharedHero || 'the same hero ingredients'} for a similar result at a fraction of the price.`;
  const altCards = alts.map(dp => `<div class="box"><b>${esc(dp.altName || '')}</b>${dp.altBand ? ` <span class="ko">${esc(dp.altBand)}</span>` : ''}<br>≈ <b>${esc(dp.sharedHero || '')}</b> — ${esc(dp.whyComparable || '')}${dp.save ? ` <b>Save ${esc(dp.save)}.</b>` : ''}<div style="margin-top:6px"><a class="pill" href="../dupe/${dp.id}.html">Full comparison →</a></div></div>`).join('');
  const body = `<p class="lead">Want a <b>Korean alternative to ${esc(ref)}</b>? Korean skincare is famous for delivering the same proven actives — backed by formulation science, at far better value. Here's the K-beauty pick and why it works.</p>
    <h2>The Korean alternative${alts.length > 1 ? 's' : ''}</h2>
    ${altCards}
    <h2>Why the Korean formula compares</h2>
    <p>Korea's skincare industry iterates fast on proven actives — ferments, peptides, centella and niacinamide — in elegant, barrier-friendly textures. That's how a Korean ${esc(a0.category || 'product')} can match a Western icon like ${esc(ref)} on the ingredients that actually matter, for less.</p>
    ${deeperBlock({ title: ref + ' ' + alts.map(a => a.altName).join(' '), slug })}`;
  const ld = [artLD(`Korean alternative to ${ref}`, qa, url), faqLD(`What is the Korean alternative to ${ref}?`, qa)];
  emit(`alternative/${slug}.html`, shell({ url, depth: 3, crumb: 'Korean alternatives', emoji: a0.referenceEmoji || '🔁', h1: `Korean alternative to ${ref}`, title: `Korean alternative to ${ref} — the K-beauty pick that works`, desc: qa, quickAnswer: qa, bodyHtml: body, ld }), '0.6');
});

// ── 6c. Pronunciation + Hangul guide (say/) — teaches Korean while answering
//        "how to pronounce <brand>" / "how to say <ingredient> in Korean".
const BRAND_BY2 = Object.fromEntries(BRANDS.map(b => [b.id, b]));
const sayItems = [].concat(
  (SAY.brands || []).map(x => Object.assign({ kind: 'brand' }, x)),
  (SAY.ingredients || []).map(x => Object.assign({ kind: 'ingredient' }, x))
);
sayItems.forEach(s => {
  const url = `${SITE}/guide/kb/say/${s.id}.html`;
  const qa = `${s.name}${s.hangul ? ` (${s.hangul})` : ''} is pronounced "${s.respell}"${s.romanization ? `, romanized ${s.romanization}` : ''}.${s.meaning ? ` Meaning: ${s.meaning}` : ''}`;
  const linkPage = s.kind === 'brand' && BRAND_BY2[s.id] ? `../brand/${s.id}.html` : (s.kind === 'ingredient' && ING_BY[s.id] ? `../ingredient/${s.id}.html` : '');
  const body = `<p class="lead">How do you pronounce <b>${esc(s.name)}</b>? Here's the Korean — Hangul, romanization and an easy English respelling.</p>
    <div class="box"><b>🗣️ Say it right</b><ul>
      ${s.hangul ? `<li><b>Hangul:</b> ${esc(s.hangul)}</li>` : ''}
      ${s.romanization ? `<li><b>Romanization:</b> ${esc(s.romanization)}</li>` : ''}
      <li><b>Say it like:</b> ${esc(s.respell)}</li>
    </ul></div>
    ${s.meaning ? `<h2>What ${esc(s.name)} means</h2><p>${esc(s.meaning)}</p>` : ''}
    <p>${esc(s.name)} is ${s.kind === 'brand' ? 'a Korean beauty brand' : 'a K-beauty ingredient'} — learning its Korean name and pronunciation is a small step into the Korean language behind K-beauty.</p>
    ${linkPage ? `<p><a class="pill" href="${linkPage}">Full ${esc(s.name)} guide →</a></p>` : ''}
    ${deeperBlock({ title: s.name, slug: s.id })}`;
  emit(`say/${s.id}.html`, shell({ url, depth: 3, crumb: 'Pronunciation', emoji: '🗣️', h1: `How to pronounce ${s.name}`, ko: s.hangul, title: `How to pronounce ${s.name} (${s.respell}) — Korean & Hangul`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [faqLD(`How do you pronounce ${s.name}?`, qa), artLD(`How to pronounce ${s.name}`, qa, url)] }), '0.6');
});

// ── 6d. Hanbang (한방) heritage encyclopedia — Korea's traditional botanicals.
HANBANG.forEach(h => {
  const url = `${SITE}/guide/kb/hanbang/${h.id}.html`;
  const qa = `${h.name} (${h.hangul}, ${h.romanization}) is a hanbang botanical Korea has used in traditional skincare for generations. ${h.modernUse}`;
  const body = `<p class="lead">${esc(h.heritageNote)}</p>
    <div class="box">🗣️ <b>${esc(h.name)}</b> — Hangul ${esc(h.hangul)}, romanized ${esc(h.romanization)}, say "${esc(h.respell)}".</div>
    <h2>In modern K-beauty</h2><p>${esc(h.modernUse)}</p>
    ${(h.concerns || []).length ? `<h2>Associated with the look of</h2><div>${h.concerns.map(c => `<span class="pill">${esc(c)}</span>`).join('')}</div>` : ''}
    ${(h.heritageBrands || []).length ? `<h2>Korean brands that feature it</h2><p>${h.heritageBrands.map(esc).join(' · ')}</p>` : ''}
    ${deeperBlock({ title: h.name + ' ' + h.id, slug: h.id })}`;
  emit(`hanbang/${h.id}.html`, shell({ url, depth: 3, crumb: 'Hanbang heritage', emoji: '🪷', h1: `${h.name}: Korea's hanbang heritage ingredient`, ko: h.hangul, title: `${h.name} (${h.hangul}) — hanbang K-beauty heritage`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`${h.name} — hanbang heritage`, qa, url), faqLD(`What is ${h.name} in Korean skincare?`, `${h.heritageNote} ${h.modernUse}`)] }), '0.7');
});

// ── 6e. Voice/PAA answer pages (ask/) — question-as-URL, speakable answer.
ASKQ.forEach(q => {
  const url = `${SITE}/guide/kb/ask/${q.slug}.html`;
  const body = `<p class="lead">${esc(q.answer)}</p>
    <h2>More detail</h2><p>${esc(q.detail)}</p>
    <div class="box">🇰🇷 ${esc(q.koreaNote)}</div>
    ${deeperBlock({ title: q.q, slug: q.slug })}`;
  emit(`ask/${q.slug}.html`, shell({ url, depth: 3, crumb: 'Q&A', emoji: '💬', h1: q.q, title: `${q.q} — K-beauty answer`, desc: q.answer, quickAnswer: q.answer, bodyHtml: body, ld: [faqLD(q.q, `${q.answer} ${q.detail}`), artLD(q.q, q.answer, url)] }), '0.7');
});

// ── 6f. Auto-dated monthly K-beauty trend report (freshness signal, data-driven) ──
(function () {
  const V = d.KBEAUTY_BESTSELLERS_VELOCITY, B = d.KBEAUTY_BESTSELLERS;
  if (!V || !B || !V.items) return;
  const period = V.statusAsOf; const mm = parseInt((period.split('-')[1] || '1'), 10);
  const monthName = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mm] + ' ' + period.split('-')[0];
  const byId = Object.fromEntries((B.items || []).map(x => [x.id, x]));
  const labels = V.statusLabels || {}; const verbEmoji = { rising: '📈', peaking: '🔥', steady: '➡️', cooling: '📉' };
  const groups = {};
  Object.keys(V.items).forEach(id => { const s = V.items[id].status; (groups[s] = groups[s] || []).push(Object.assign({ id }, V.items[id], byId[id] || {})); });
  const sections = ['rising', 'peaking', 'steady', 'cooling'].filter(s => (groups[s] || []).length).map(s =>
    `<h2>${verbEmoji[s] || ''} ${esc(labels[s] || s)}</h2>` + groups[s].map(it =>
      `<div class="box"><b>${it.emoji || ''} ${esc(it.brand || '')} ${esc(it.name || '')}</b>${it.koreaNative ? ' <span class="ko">🇰🇷 Korea-native</span>' : ''}<br>${esc(it.whyMoved || '')}${it.channel ? ` <span class="disc">— Korea signal: ${esc(it.channel)}</span>` : ''}${it.worthIt ? `<br>💡 ${esc(it.worthIt)}` : ''}</div>`).join('')).join('');
  const qa = `As of ${monthName}, Korean skincare has ${(groups.rising || []).length} rising and ${(groups.peaking || []).length} peaking products on Korea's own retail signals (Olive Young, Hwahae) — here's what's moving and why.`;
  const url = `${SITE}/guide/kb/report/${period}.html`;
  const body = `<p class="lead">What's rising, peaking and cooling in Korean skincare as of <b>${monthName}</b> — read straight from Korea's own retail and review signals, with an honest 'worth it?' take.</p>${sections}
    <p class="disc">Status reflects editorial review of Korea-native retail/review signals as of ${period}; updated when the underlying data changes, not on a fixed schedule.</p>
    ${deeperBlock({ title: 'K-beauty trend report bestseller Olive Young', slug: 'report' })}`;
  emit(`report/${period}.html`, shell({ url, depth: 3, crumb: 'Trend report', emoji: '📰', h1: `K-Beauty Trend Report — ${monthName}`, title: `K-Beauty trends ${monthName} — what's rising, peaking & cooling`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`K-Beauty Trend Report ${monthName}`, qa, url), faqLD(`What are the K-beauty trends in ${monthName}?`, qa)] }), '0.8');
})();

// ── 6g. Glass Skin Score — SEO landing that funnels to the interactive hub tool.
(function () {
  const url = `${SITE}/guide/kb/glass-score/`; // directory form — matches what the sitemap lists
  const qa = `Your Glass Skin Score rates how close your skin is to the Korean 'glass skin' (유리 피부) ideal across hydration, barrier, glow and consistency — take the free 8-question test for your 0–100 score and the Korean next steps to raise it.`;
  const body = `<p class="lead">${esc(qa)}</p>
    <p><a class="cta" href="${SITE}/kbeauty#kb-glassscore">🔮 Take the Glass Skin Score test →</a></p>
    <h2>What is a Glass Skin Score?</h2>
    <p>Glass skin — <i>yuri-pibu</i> (유리 피부) — is the Korean ideal of a smooth, translucent, luminous complexion. The Glass Skin Score turns that ideal into four measurable habits: <b>Hydration</b>, <b>Barrier</b>, <b>Glow</b> and <b>Consistency</b>. Answer eight quick questions for a 0–100 score, a Korean tier (Jelly 🫧 → Honey 🍯 → Glass 🔮), and the three Korean ingredients or steps most likely to raise your weakest area.</p>
    <h2>How to raise your score</h2>
    <ul><li><b>Hydration:</b> layer hydrating toners/essences (the 7-skin method), snail mucin, beta-glucan.</li><li><b>Barrier:</b> centella (cica), ceramides, heartleaf — and ease off harsh actives.</li><li><b>Glow:</b> niacinamide, rice extract, morning vitamin C.</li><li><b>Consistency:</b> a simple repeatable AM/PM routine and daily SPF with reapplication.</li></ul>
    ${deeperBlock({ title: 'glass skin score hydration barrier glow centella niacinamide snail rice', slug: 'glass-score' })}`;
  emit(`glass-score/index.html`, shell({ url, depth: 3, crumb: 'Glass Skin Score', emoji: '🔮', h1: 'Glass Skin Score — the free K-beauty skin test', title: 'Glass Skin Score — how close are you to Korean glass skin?', desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD('Glass Skin Score', qa, url), faqLD('What is a glass skin score?', qa)] }), '0.7');
})();

// ── 6h. K-pop / K-drama beauty (star/) — GENERAL educational content only.
//        No fabricated per-celebrity product claims (right-of-publicity safe);
//        bridges the global K-wave to Korean skincare + cross-links the /kpop vertical.
const STARS = [
  { slug: 'kpop-idol-skincare-routine', h1: 'K-pop idol skincare routine: the real Korean approach', qa: 'K-pop idols are widely reported to rely on a consistent, hydration-first Korean routine — gentle double cleansing, layered hydration, barrier care (centella, snail mucin) and daily SPF — rather than any single miracle product.', secs: [['Hydration over everything', 'The look most associated with idols is dewy, even, "glass" skin. In practice that comes from layering lightweight hydration — toner, essence, moisturizer — on a healthy barrier, the cornerstone of Korean skincare, not from one product.'], ['Gentle, not harsh', 'Because idols are in heavy makeup often, thorough but gentle double cleansing (oil then water-based) and barrier-supporting ingredients like centella (cica) and ceramides are emphasized to keep skin calm.'], ['Sun protection is non-negotiable', 'Daily SPF 50+ and reapplication is the most evidence-backed habit for keeping skin even and youthful — and Korean sunscreens are prized for elegant, no-white-cast textures.']] },
  { slug: 'kdrama-actor-glass-skin', h1: 'How K-drama actors get glass skin', qa: 'The luminous "glass skin" seen on K-drama actors is a lighting-plus-skincare effect: months of consistent hydration, exfoliation in moderation and barrier care, finished with dewy makeup — an aesthetic rooted in Korean skincare culture.', secs: [['It starts months before camera', 'Glass skin (유리 피부) is built over time through consistent hydration and a calm barrier — not overnight. Korean routines prioritize this slow, gentle consistency.'], ['Prep + dewy finish', 'On set, hydrating prep (essences, sheet masks) plus dewy, skin-like makeup amplify the glass effect under lighting.'], ['The Korean ingredient toolkit', 'Hydrators (hyaluronic acid, snail mucin), soothers (centella, heartleaf) and brighteners (niacinamide, rice) are the Korean staples behind the look.']] },
  { slug: 'korean-celebrity-skincare-secrets', h1: 'Korean celebrity skincare secrets (the science)', qa: 'The "secret" behind Korean celebrity skin is mostly unglamorous and evidence-based: consistency, gentle cleansing, layered hydration, barrier repair and rigorous daily sun protection — the same Korean principles anyone can follow.', secs: [['Consistency beats intensity', 'Doing a simple routine every morning and night outperforms occasional aggressive treatments — a core Korean philosophy.'], ['Barrier-first', 'Protecting the skin barrier (ceramides, centella, avoiding over-exfoliation) keeps skin resilient and glowing.'], ['Professional support', 'Many also rely on dermatologist guidance and in-clinic care; at home, the routine stays gentle and hydration-led.']] },
  { slug: 'kpop-glass-skin-ingredients', h1: 'The Korean ingredients behind K-pop glass skin', qa: 'The Korean ingredients most linked to the K-pop "glass skin" look are hydrators (hyaluronic acid, snail mucin, beta-glucan), soothers (centella/cica, heartleaf) and gentle brighteners (niacinamide, rice extract) — all layered over diligent SPF.', secs: [['Hydrators for the dewy base', 'Hyaluronic acid, snail mucin and beta-glucan draw in and hold water for the plump, reflective finish.'], ['Soothers for an even tone', 'Centella (cica) and heartleaf help calm redness so skin looks uniform — key to the glass effect.'], ['Brighteners for glow', 'Niacinamide and traditional rice extract support a brighter, more luminous appearance over time.']] },
  { slug: 'how-idols-prep-skin-before-makeup', h1: 'How idols prep their skin before makeup', qa: 'Idol-style skin prep is hydration layering: a gentle cleanse, a hydrating toner/essence, a lightweight moisturizer and SPF, letting each absorb so makeup sits smoothly on a plump, dewy base — a hallmark of Korean skincare.', secs: [['Clean, then hydrate', 'A gentle low-pH cleanse, then layered hydration (the "7-skin" idea of pressing in light toner layers) creates a smooth canvas.'], ['Lock and protect', 'A light moisturizer seals hydration; SPF protects — both help makeup last and look skin-like.'], ['Let it absorb', 'Pausing between steps so each layer absorbs prevents pilling and gives the dewy, glass-skin finish.']] },
];
STARS.forEach(s => {
  const url = `${SITE}/guide/kb/star/${s.slug}.html`;
  const body = `<p class="lead">${esc(s.qa)}</p>
    ${s.secs.map(sec => `<h2>${esc(sec[0])}</h2><p>${esc(sec[1])}</p>`).join('')}
    <div class="box">🎤 <b>Love K-pop & K-drama?</b> Explore the people and culture behind the wave on our <a href="${SITE}/guide/kpop.html">K-Pop hub</a> — then build the look with the <a href="${SITE}/kbeauty#kb-glassscore">Glass Skin Score</a>.</div>
    ${deeperBlock({ title: s.h1 + ' glass skin centella snail niacinamide rice heartleaf', slug: s.slug })}`;
  emit(`star/${s.slug}.html`, shell({ url, depth: 3, crumb: 'K-pop & K-drama beauty', emoji: '🎤', h1: s.h1, title: `${s.h1} — K-beauty`, desc: s.qa, quickAnswer: s.qa, bodyHtml: body, ld: [artLD(s.h1, s.qa, url), faqLD(s.h1.replace(/:.*/, '') + '?', s.qa)] }), '0.6');
});

// ── 6i. Ranked "Best Korean ingredients for <concern>" (best/) — ranks INGREDIENTS
//        (never products) by a transparent score. AdSense-only, no affiliate.
CONCERNS.forEach(c => {
  const ranked = ING.filter(i => (i.bestFor || []).includes(c.id))
    .map(i => ({ i, score: (i.star ? 2 : 0) + (i.benefits || []).length * 0.2 + (i.bestFor || []).length * 0.1 }))
    .sort((a, b) => b.score - a.score || a.i.name.localeCompare(b.i.name)).slice(0, 10);
  if (ranked.length < 3) return;
  const cn = c.name.toLowerCase();
  const url = `${SITE}/guide/kb/best/korean-ingredients-for-${c.id}.html`;
  const qa = `For ${cn}, the most-recommended Korean skincare ingredients are ${ranked.slice(0, 3).map(r => r.i.name).join(', ')} — ranked by hero status, breadth of benefit, and how broadly Korean routines use them for ${cn}.`;
  const rows = ranked.map((r, idx) => `<div class="rank"><div class="rn">${idx + 1}</div><div><div><b>${r.i.emoji || ''} <a href="../ingredient/${r.i.id}.html">${esc(r.i.name)}</a></b> ${r.i.korean ? `<span class="ko">${esc(r.i.korean)}</span>` : ''}</div><div style="font-size:13.5px;color:var(--text2);margin-top:3px">${esc(r.i.explainer || '')}</div></div></div>`).join('');
  const body = `<p class="lead">${esc(qa)}</p>
    <p style="font-size:13px;color:var(--muted)">Ranking criteria (transparent): hero-ingredient status, breadth of documented skin benefits, and how broadly Korean routines use it for ${esc(cn)}. We rank ingredients, never specific products.</p>
    ${rows}
    ${deeperBlock({ title: c.name + ' ' + ranked.map(r => r.i.name).join(' '), slug: 'best-' + c.id })}`;
  emit(`best/korean-ingredients-for-${c.id}.html`, shell({ url, depth: 3, crumb: 'Best for…', emoji: '🏆', h1: `Best Korean ingredients for ${cn}`, title: `Best Korean skincare ingredients for ${cn} — ranked`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`Best Korean ingredients for ${c.name}`, qa, url), faqLD(`What are the best Korean ingredients for ${cn}?`, qa), { '@context': 'https://schema.org', '@type': 'ItemList', name: `Best Korean ingredients for ${c.name}`, itemListElement: ranked.map((r, idx) => ({ '@type': 'ListItem', position: idx + 1, name: r.i.name })) }] }), '0.7');
});

// ── 6i-2. The same ranking narrowed to a skin type — "best for acne on oily skin"
//         is a materially different question from "best for acne", and it is the
//         one people actually type. Gated to pairs the ST_CONCERNS map endorses,
//         so no page claims a concern that skin type does not typically have. ──
SKINTYPES.forEach(s => {
  (ST_CONCERNS[s.id] || []).forEach(cid => {
    const c = CONCERN_BY[cid]; if (!c) return;
    const ranked = ING.filter(i => (i.bestFor || []).includes(c.id))
      .map(i => ({ i, score: (i.star ? 2 : 0) + (i.benefits || []).length * 0.2 + ((i.bestFor || []).includes(s.id) ? 1 : 0) }))
      .sort((a, b) => b.score - a.score || a.i.name.localeCompare(b.i.name)).slice(0, 8);
    if (ranked.length < 3) return;
    const cn = c.name.toLowerCase(), sn = s.name.toLowerCase();
    const url = `${SITE}/guide/kb/best/korean-ingredients-for-${c.id}-on-${s.id}-skin.html`;
    const qa = `For ${cn} on ${sn} skin, the Korean ingredients worth prioritising are ${ranked.slice(0, 3).map(r => r.i.name).join(', ')} — chosen for what ${sn} skin needs (${(s.focus || []).join(', ')}) as well as for the concern itself.`;
    const rows = ranked.map((r, idx) => `<div class="rank"><div class="rn">${idx + 1}</div><div><div><b>${r.i.emoji || ''} <a href="../ingredient/${r.i.id}.html">${esc(r.i.name)}</a></b> ${r.i.korean ? `<span class="ko">${esc(r.i.korean)}</span>` : ''}</div><div style="font-size:13.5px;color:var(--text2);margin-top:3px">${esc(r.i.explainer || '')}</div></div></div>`).join('');
    const body = `<p class="lead">${esc(qa)}</p>
      <p>${esc(s.desc || '')}</p>
      <p style="font-size:13px;color:var(--muted)">Ranked by hero status, breadth of documented benefit, and fit with ${esc(sn)} skin. We rank ingredients, never specific products.</p>
      ${rows}
      <p><a class="pill" href="korean-ingredients-for-${c.id}.html">🏆 Best for ${esc(cn)} (all skin types) →</a><a class="pill" href="../routine/${s.id}-${c.id}.html">🧴 Full ${esc(sn)}-skin routine →</a><a class="pill" href="../skin-type/${s.id}.html">🧖 ${esc(s.name)} skin guide →</a></p>
      ${deeperBlock({ title: c.name + ' ' + s.name + ' ' + ranked.map(r => r.i.name).join(' '), slug: 'best-' + c.id + '-' + s.id })}`;
    emit(`best/korean-ingredients-for-${c.id}-on-${s.id}-skin.html`, shell({ url, depth: 3, crumb: 'Best for…', emoji: '🏆', h1: `Best Korean ingredients for ${cn} on ${sn} skin`, title: `Best Korean ingredients for ${cn} on ${sn} skin — ranked`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`Best Korean ingredients for ${c.name} on ${s.name} skin`, qa, url), faqLD(`What Korean ingredients work for ${cn} on ${sn} skin?`, qa), { '@context': 'https://schema.org', '@type': 'ItemList', name: `Best Korean ingredients for ${c.name} on ${s.name} skin`, itemListElement: ranked.map((r, idx) => ({ '@type': 'ListItem', position: idx + 1, name: r.i.name })) }] }), '0.6');
  });
});

// ── 6j. "X vs Y" ingredient comparison matrix (vs/) — curated same-purpose pairs.
// Hand-picked pairs first — these are the comparisons people actually search for.
const VS_CURATED = [['snail', 'hyaluronic'], ['centella', 'mugwort'], ['centella', 'heartleaf'], ['niacinamide', 'azelaic'], ['niacinamide', 'vitaminc'], ['retinol', 'bakuchiol'], ['retinol', 'peptides'], ['aha', 'bha'], ['bha', 'pha'], ['vitaminc', 'arbutin'], ['arbutin', 'tranexamic'], ['hyaluronic', 'betaglucan'], ['ceramide', 'squalane'], ['pdrn', 'peptides'], ['ginseng', 'propolis'], ['rice', 'galactomyces'],
  ['retinol', 'retinal'], ['retinal', 'bakuchiol'], ['aha', 'mandelic'], ['aha', 'lactic'], ['lactic', 'mandelic'], ['hyaluronic', 'polyglutamic'], ['ceramide', 'cholesterol'], ['niacinamide', 'zincpca'], ['arbutin', 'kojic'], ['tranexamic', 'kojic'], ['vitaminc', 'ferulic'], ['peptides', 'copperpeptide'], ['peptides', 'adenosine'], ['pdrn', 'exosome'], ['exosome', 'egf'], ['galactomyces', 'bifida'], ['bifida', 'yeast'], ['squalane', 'jojoba'], ['squalane', 'shea'], ['centella', 'madecassoside'], ['centella', 'ectoin'], ['bha', 'succinic'], ['bha', 'sulfur'], ['teatree', 'heartleaf'], ['greentea', 'yuja'], ['ginseng', 'blackginseng'], ['glycerin', 'hyaluronic'], ['urea', 'lactic'], ['collagen', 'peptides'], ['coq10', 'astaxanthin'], ['resveratrol', 'vitamine'], ['aloe', 'panthenol'], ['birch', 'bamboo'], ['caffeine', 'peptides']];
// Then derive the rest: same ingredient family AND a shared concern, so every
// generated comparison is genuinely like-for-like. Capped per ingredient — the
// ungated cross-product runs to hundreds of pairs nobody would ever compare.
const VS_CAP = 8;
const VS_PAIRS = (() => {
  const seen = new Set(), used = {}, out = [];
  const take = (a, b) => {
    const k = [a, b].sort().join('|');
    if (seen.has(k)) return false;
    seen.add(k); used[a] = (used[a] || 0) + 1; used[b] = (used[b] || 0) + 1; out.push([a, b]); return true;
  };
  VS_CURATED.forEach(([a, b]) => { if (ING_BY[a] && ING_BY[b]) take(a, b); });
  for (let i = 0; i < ING.length; i++) for (let j = i + 1; j < ING.length; j++) {
    const a = ING[i], b = ING[j];
    if (a.cat !== b.cat) continue;
    if (!(a.bestFor || []).some(x => (b.bestFor || []).includes(x))) continue;
    if ((used[a.id] || 0) >= VS_CAP || (used[b.id] || 0) >= VS_CAP) continue;
    take(a.id, b.id);
  }
  return out;
})();
VS_PAIRS.forEach(([aid, bid]) => {
  const a = ING_BY[aid], b = ING_BY[bid]; if (!a || !b) return;
  const slug = `${aid}-vs-${bid}`;
  const url = `${SITE}/guide/kb/vs/${slug}.html`;
  const clash = (a.avoidWith || []).includes(bid) || (b.avoidWith || []).includes(aid);
  const together = clash ? 'with care — alternate nights or split AM/PM' : 'yes — they layer well together';
  const aFor = (a.bestFor || []).map(x => (CONCERN_BY[x] || {}).name).filter(Boolean);
  const bFor = (b.bestFor || []).map(x => (CONCERN_BY[x] || {}).name).filter(Boolean);
  const qa = `${a.name} vs ${b.name}: ${a.name} leans toward ${aFor[0] ? aFor[0].toLowerCase() : 'its strengths'}, while ${b.name} targets ${bFor[0] ? bFor[0].toLowerCase() : 'its strengths'}. Can you use both? ${together.charAt(0).toUpperCase() + together.slice(1)}.`;
  const table = `<table class="cmp"><tr><th></th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr>
    <tr><th>What it is</th><td>${esc(a.explainer || '')}</td><td>${esc(b.explainer || '')}</td></tr>
    <tr><th>Best for</th><td>${esc(aFor.join(', '))}</td><td>${esc(bFor.join(', '))}</td></tr>
    <tr><th>When to use</th><td>${esc((a.time || 'both').toUpperCase())}</td><td>${esc((b.time || 'both').toUpperCase())}</td></tr></table>`;
  const body = `<p class="lead">${esc(qa)}</p>${table}
    <h2>Which should you choose?</h2><p>Choose <b>${esc(a.name)}</b> if your priority is ${esc(aFor[0] || 'its strengths')}; choose <b>${esc(b.name)}</b> for ${esc(bFor[0] || 'its strengths')}. Many Korean routines use both — ${together}.</p>
    <p><a class="pill" href="../ingredient/${a.id}.html">${esc(a.name)} guide →</a><a class="pill" href="../ingredient/${b.id}.html">${esc(b.name)} guide →</a></p>
    ${deeperBlock({ title: a.name + ' ' + b.name, slug })}`;
  emit(`vs/${slug}.html`, shell({ url, depth: 3, crumb: 'Compare', emoji: '⚖️', h1: `${a.name} vs ${b.name}: which Korean skincare ingredient?`, title: `${a.name} vs ${b.name} — K-beauty comparison`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`${a.name} vs ${b.name}`, qa, url), faqLD(`${a.name} vs ${b.name} — which is better?`, qa)] }), '0.6');
});

// ── Q5: Sources box for the quantitative science-spine pages (dose/ + how-it-works/).
// Fabrication-free: PubMed *topic-search* URLs (not invented citations) + AAD's public
// skincare basics + a cross-link to our own graded evidence/ digest when one exists.
const EVID_BY_ING = (id) => EVID.find(e => e.slug === id || e.slug.indexOf(id + '-') === 0 || e.slug === id.replace(/-.*$/, '') || (e.slug || '').includes(id));
function sciSources(i) {
  const pm = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(i.name.replace(/\s*\(.*\)/, '') + ' skin')}`;
  const ev = EVID_BY_ING(i.id);
  return `<div class="kb-src"><b>${esc(CHROME_EN.sources)}:</b> <a href="${pm}" rel="nofollow noopener" target="_blank">PubMed — ${esc(i.name)} &amp; skin ↗</a> · <a href="https://www.aad.org/public/everyday-care/skin-care-basics" rel="nofollow noopener" target="_blank">AAD skin-care basics ↗</a>${ev ? ` · <a href="../evidence/${esc(ev.slug)}.html">Evidence digest: ${esc(ev.topic)} →</a>` : ''}</div>`;
}

// ── 6k. Dosage & pH (dose/) — effective % + pH window per active.
DOSE.forEach(x => {
  const i = ING_BY[x.id]; if (!i) return;
  const url = `${SITE}/guide/kb/dose/${x.id}.html`;
  const qa = `${i.name}: effective concentration ${x.pctRange}, optimal pH ${x.phRange}, evidence ${x.evidenceGrade}. ${x.plainRead}`;
  const body = `<p class="lead">How much ${esc(i.name)} actually works? Here's the dosage, pH and evidence — the formulator-level read behind the % on a Korean label.</p>
    <table class="cmp"><tr><th>Effective %</th><td>${esc(x.pctRange)}</td></tr><tr><th>Optimal pH</th><td>${esc(x.phRange)}</td></tr><tr><th>Evidence</th><td><span class="grade ${esc(x.evidenceGrade)}">${esc(x.evidenceGrade)}</span></td></tr><tr><th>Onset</th><td>${esc(x.onset)}</td></tr></table>
    <h2>What the % on the label really means</h2><p>${esc(x.plainRead)}</p>
    <div class="box">⚠️ <b>Ceiling:</b> ${esc(x.ceilingNote)}</div>
    <p><a class="pill" href="../ingredient/${i.id}.html">${esc(i.name)} guide →</a><a class="pill" href="../how-it-works/${i.id}.html">How ${esc(i.name)} works →</a></p>
    ${sciSources(i)}
    ${deeperBlock({ title: i.name + ' ' + i.id, slug: 'dose-' + i.id })}`;
  emit(`dose/${x.id}.html`, shell({ url, depth: 3, crumb: 'Dosage & pH', emoji: '⚗️', h1: `${i.name}: effective % & pH`, ko: i.korean, title: `${i.name} — effective concentration, pH & dose (K-beauty)`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`${i.name} dosage & pH`, qa, url), faqLD(`What percentage of ${i.name} is effective?`, qa)] }), '0.7');
});

// ── 6l. Mechanism of action (how-it-works/) — how each active works.
MOA.forEach(x => {
  const i = ING_BY[x.id]; if (!i) return;
  const url = `${SITE}/guide/kb/how-it-works/${x.id}.html`;
  const qa = `How does ${i.name} work? ${x.mechanism}`;
  const body = `<p class="lead">${esc(x.mechanism)}</p>
    <table class="cmp"><tr><th>Acts on</th><td>${esc(x.target)}</td></tr><tr><th>Evidence</th><td><span class="grade ${esc(x.evidenceGrade)}">${esc(x.evidenceGrade)}</span></td></tr></table>
    <div class="box">🔬 <b>The honest ceiling:</b> ${esc(x.ceiling)}</div>
    <p><a class="pill" href="../ingredient/${i.id}.html">${esc(i.name)} guide →</a><a class="pill" href="../dose/${i.id}.html">Effective % & pH →</a></p>
    ${sciSources(i)}
    ${deeperBlock({ title: i.name + ' ' + i.id + ' mechanism', slug: 'moa-' + i.id })}`;
  emit(`how-it-works/${x.id}.html`, shell({ url, depth: 3, crumb: 'How it works', emoji: '🔬', h1: `How ${i.name} works`, ko: i.korean, title: `How does ${i.name} work? — mechanism (K-beauty)`, desc: qa, quickAnswer: qa.slice(0, 300), bodyHtml: body, ld: [artLD(`How ${i.name} works`, x.mechanism, url), faqLD(`How does ${i.name} work?`, x.mechanism)] }), '0.7');
});

// ── 6m. Evidence-grade digests (evidence/) — GRADE-style authority over real sources.
EVID.forEach(x => {
  const url = `${SITE}/guide/kb/evidence/${x.slug}.html`;
  const cites = (x.citeIds || []).map(id => CITES[id]).filter(Boolean);
  const qa = `${x.claim} — Evidence grade: ${x.grade}. ${x.digest}`;
  const body = `<p class="lead"><b>The claim:</b> ${esc(x.claim)}</p>
    <p><span class="grade ${esc(x.grade)}">${esc(x.grade)} evidence</span></p>
    <h2>What the research actually shows</h2><p>${esc(x.digest)}</p>
    ${cites.length ? `<h2>Sources</h2><ul>${cites.map(c => `<li><a href="${esc(c.url)}" target="_blank" rel="nofollow noopener">${esc(c.label)} ↗</a></li>`).join('')}</ul>` : ''}
    ${deeperBlock({ title: x.topic, slug: x.slug })}`;
  emit(`evidence/${x.slug}.html`, shell({ url, depth: 3, crumb: 'Evidence grades', emoji: '📊', h1: `${x.topic}: what the evidence says`, title: `Is ${x.topic} backed by science? — evidence grade`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`${x.topic} evidence`, x.digest, url), faqLD(`Is ${x.topic} backed by science?`, `${x.grade} evidence. ${x.digest}`)] }), '0.7');
});

// ── 6n. Formulation science explainers (formulation/).
FORM.forEach(x => {
  const url = `${SITE}/guide/kb/formulation/${x.slug}.html`;
  const body = `<p class="lead">${esc(x.qa)}</p>${(x.sections || []).map(s => `<h2>${esc(s.h)}</h2><p>${esc(s.body)}</p>`).join('')}${deeperBlock({ title: x.title, slug: x.slug })}`;
  emit(`formulation/${x.slug}.html`, shell({ url, depth: 3, crumb: 'Formulation science', emoji: '🧫', h1: x.h1, title: `${x.title} — K-beauty formulation science`, desc: x.qa, quickAnswer: x.qa, bodyHtml: body, ld: [artLD(x.h1, x.qa, url), faqLD(x.title, x.qa)] }), '0.7');
});

// ── 6o. Advanced content clusters (age/climate routines, freshness feeds, 3 verticals).
function emitContent(dir, item, crumb, emoji, extraNote, prio) {
  const url = `${SITE}/guide/kb/${dir}/${item.slug}.html`;
  const body = `<p class="lead">${esc(item.qa)}</p>${(item.sections || []).map(s => `<h2>${esc(s.h)}</h2><p>${esc(s.body)}</p>`).join('')}${extraNote || ''}${deeperBlock({ title: item.h1 + ' ' + item.slug, slug: item.slug })}`;
  emit(`${dir}/${item.slug}.html`, shell({ url, depth: 3, crumb, emoji, h1: item.h1, ko: item.ko || '', title: item.title, desc: item.qa, quickAnswer: item.qa, bodyHtml: body, ld: [artLD(item.h1, item.qa, url), faqLD(item.h1.replace(/[:—].*/, '').trim() + '?', item.qa)] }), prio || '0.6');
}
ADVC.ageClimate.forEach(it => { const cl = /climate|humid|winter|hard-water|altitude|tropical|arid/.test(it.slug); emitContent(cl ? 'climate' : 'age', it, cl ? 'Climate routines' : 'Routines by age', cl ? '🌡️' : '🎂'); });
ADVC.fresh.forEach(it => { const w = /^watch/.test(it.slug); emitContent(w ? 'watch' : 'digest', it, w ? 'Regulatory & safety watch' : 'Research digest', w ? '⚠️' : '📰', '', '0.7'); });
ADVC.hair.forEach(it => emitContent('hair', it, 'K-Haircare & scalp', '💇'));
ADVC.makeup.forEach(it => emitContent('makeup', it, 'K-Makeup & color', '💋'));
const CLINIC_NOTE = `<div class="box">⚕️ <b>Education only.</b> General information about Korean skincare/aesthetic concepts — not medical advice or a recommendation. Procedures carry risks; always consult a licensed medical professional in person.</div>`;
ADVC.clinic.forEach(it => emitContent('clinic', it, 'K-Derma education', '⚕️', CLINIC_NOTE));

// ── 6o-2. Distinctly-Korean clusters the library was missing entirely: the modern
// UV filters Korean sunscreens are built on, Korea's 기능성화장품 regulatory tier,
// home devices, myth-vs-evidence, and how to actually read Korean packaging. ──
let CLUS = {};
try { CLUS = require('./kbeauty-clusters-ext.json'); } catch (e) { console.warn('cluster ext pack absent'); }
const FILTER_NOTE = `<div class="box">🔎 <b>Regulatory note.</b> UV-filter approval differs by market — a filter permitted in Korea, the EU or Japan may not be approved elsewhere. Always check the label of the product sold in your own country.</div>`;
(CLUS.filter || []).forEach(it => emitContent('filter', it, 'Sunscreen filters', '🛡️', FILTER_NOTE, '0.7'));
(CLUS.functional || []).forEach(it => emitContent('functional', it, 'Korean regulation', '📜', '', '0.7'));
(CLUS.device || []).forEach(it => emitContent('device', it, 'Home beauty devices', '🔌', CLINIC_NOTE));
(CLUS.myth || []).forEach(it => emitContent('myth', it, 'Myths vs evidence', '🔬', '', '0.7'));
(CLUS.label || []).forEach(it => emitContent('label', it, 'Reading Korean labels', '🏷️', '', '0.7'));

// ── 6o-3. Life-stage, body, culture and step-by-step clusters. The pregnancy set
// carries a standing medical caveat on every page — it is the one topic in this
// library where the right answer is consistently "ask your own clinician". ──
let CLUS2 = {};
try { CLUS2 = require('./kbeauty-clusters-ext2.json'); } catch (e) { console.warn('cluster ext pack 2 absent'); }
const PREG_NOTE = `<div class="box">🤍 <b>Not medical advice.</b> Cosmetic-ingredient guidance in pregnancy and breastfeeding varies between countries and between clinicians, and your situation is specific to you. Take your actual product list to your doctor or midwife and confirm it with them.</div>`;
(CLUS2.pregnancy || []).forEach(it => emitContent('pregnancy', it, 'Pregnancy & skincare', '🤍', PREG_NOTE, '0.7'));
(CLUS2.men || []).forEach(it => emitContent('men', it, "Men's skincare", '🧔', '', '0.7'));
(CLUS2.body || []).forEach(it => emitContent('body', it, 'Body & hand care', '🧼', '', '0.6'));
(CLUS2.spa || []).forEach(it => emitContent('spa', it, 'Bathhouse & spa culture', '♨️', '', '0.6'));
(CLUS2.step || []).forEach(it => emitContent('step', it, 'The routine, step by step', '🔢', '', '0.7'));
(CLUS2.compare2 || []).forEach(it => emitContent('compare', it, 'Korea vs the world', '⚖️', '', '0.6'));

// ── 6o-4. Drop-in content packs. Any kbeauty-pack-*.json in the repo root is
// picked up automatically and its arrays routed to the matching directory, so
// adding a topic area is a matter of writing one data file — no generator edit.
// Unknown keys are reported rather than silently ignored, and slugs already
// emitted are skipped so a pack can never overwrite hand-authored content. ──
const PACK_DIRS = {
  country: { crumb: 'K-beauty worldwide', emoji: '🌍', prio: '0.6' },
  makeup: { crumb: 'K-Makeup & color', emoji: '💋', prio: '0.6' },
  hair: { crumb: 'K-Haircare & scalp', emoji: '💇', prio: '0.6' },
  clinic: { crumb: 'K-Derma education', emoji: '⚕️', prio: '0.6', note: CLINIC_NOTE },
  culture: { crumb: 'Beauty culture', emoji: '🎎', prio: '0.6' },
  shop: { crumb: 'Where to shop', emoji: '🛍️', prio: '0.6' },
  condition: { crumb: 'Skin conditions', emoji: '🩺', prio: '0.7', note: CLINIC_NOTE },
  rx: { crumb: 'Prescriptions & procedures', emoji: '💊', prio: '0.7', note: CLINIC_NOTE },
  fix: { crumb: 'Troubleshooting', emoji: '🔧', prio: '0.7' },
  tone: { crumb: 'Skin tone & K-beauty', emoji: '🎨', prio: '0.7' },
  cost: { crumb: 'Cost & value', emoji: '💸', prio: '0.6' },
};
const packEmitted = new Set(written);
let packCount = 0;
fs.readdirSync(__dirname).filter(f => /^kbeauty-pack-.*\.json$/.test(f)).sort().forEach(f => {
  let pack;
  try { pack = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')); }
  catch (e) { console.error(`pack ${f} skipped — invalid JSON: ${e.message}`); return; }
  Object.keys(pack).forEach(key => {
    if (key === 'dupes' || key.startsWith('_')) return; // dupes merge into DUPES up top
    const cfg = PACK_DIRS[key];
    if (!cfg) { console.warn(`pack ${f}: no output directory configured for key "${key}" — skipped`); return; }
    (Array.isArray(pack[key]) ? pack[key] : []).forEach(it => {
      if (!it || !it.slug || !it.h1 || !it.qa) { console.warn(`pack ${f}: ${key} item missing slug/h1/qa — skipped`); return; }
      const rel = `${key}/${it.slug}.html`;
      if (packEmitted.has(rel)) { console.warn(`pack ${f}: ${rel} already exists — skipped`); return; }
      packEmitted.add(rel);
      emitContent(key, it, cfg.crumb, cfg.emoji, cfg.note || '', cfg.prio);
      packCount++;
    });
  });
});
if (packCount) console.log(`drop-in packs: ${packCount} pages`);

// ── 6o-5. Products, and the picks built on top of them. Until now the library
// climbed ingredient → category-for-concern and stopped: it named ~150 hero
// products in brand pages as dead text and linked to none of them, so the
// highest-intent question in the category — "which one do I actually buy?" —
// had no landing page anywhere. Products come from kbeauty-products-*.json. ──
const PRODUCTS = (() => {
  const out = [], seen = new Set();
  fs.readdirSync(__dirname).filter(f => /^kbeauty-products-.*\.json$/.test(f)).sort().forEach(f => {
    let pack; try { pack = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')); }
    catch (e) { console.error(`products pack ${f} skipped — invalid JSON: ${e.message}`); return; }
    (pack.products || []).forEach(p => {
      if (!p || !p.id || !p.name || !p.brandId) return;
      if (seen.has(p.id)) { console.warn(`products: duplicate id "${p.id}" — skipped`); return; }
      // Agents working in parallel filed a handful of the same products under
      // different ids, which id-dedup alone lets through as two pages for one
      // product. Match on brand + normalised name as well.
      const nameKey = p.brandId + '|' + String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (seen.has(nameKey)) { console.warn(`products: "${p.id}" duplicates an existing product by name — skipped`); return; }
      seen.add(nameKey);
      // A product referencing a brand or category the library does not have would
      // render a broken page, so drop it rather than emit a dead end.
      if (!BRAND_BY[p.brandId]) { console.warn(`products: "${p.id}" references unknown brand "${p.brandId}" — skipped`); return; }
      seen.add(p.id); out.push(p);
    });
  });
  return out;
})();
const CAT_BY_ID = Object.fromEntries(CATS_ITEMS.map(c => [c.id, c]));
const ST_BY_ID = Object.fromEntries(SKINTYPES.map(s => [s.id, s]));
// Which pick pages will exist. Products are emitted before picks, so this has to
// be computed up front — linking optimistically is what produced 29 dead links.
// Mirrors emitPick's own "fewer than three is a list, not a pick" threshold.
const PICK_EXISTS = new Set();
CATS_ITEMS.forEach(cat => {
  const inCat = PRODUCTS.filter(p => p.categoryId === cat.id);
  if (inCat.length < 3) return;
  PICK_EXISTS.add(`best-korean-${cat.id}`);
  CONCERNS.forEach(c => { if (inCat.filter(p => (p.concernIds || []).includes(c.id)).length >= 3) PICK_EXISTS.add(`${cat.id}-for-${c.id}`); });
  SKINTYPES.forEach(s => { if (inCat.filter(p => (p.skinTypeIds || []).includes(s.id)).length >= 3) PICK_EXISTS.add(`${cat.id}-for-${s.id}-skin`); });
});

PRODUCTS.forEach(p => {
  const b = BRAND_BY[p.brandId], cat = CAT_BY_ID[p.categoryId];
  const ings = (p.heroIngredientIds || []).map(i => ING_BY[i]).filter(Boolean);
  const cons = (p.concernIds || []).map(c => CONCERN_BY[c]).filter(Boolean);
  const sts = (p.skinTypeIds || []).map(s => ST_BY_ID[s]).filter(Boolean);
  const url = `${SITE}/guide/kb/product/${p.id}.html`;
  const qa = `${p.name} is ${b.name}'s ${cat ? cat.name.toLowerCase() : 'hero product'}${ings.length ? `, built around ${ings.map(i => i.name).join(' and ')}` : ''}. ${String(p.whoItSuits || '').split(/(?<=\.)\s/)[0]}`;
  const body = `<p class="lead">${esc(p.whatItIs || '')}</p>
    <div class="box">
      <span class="pill">🏷️ <a href="../brand/${b.id}.html">${esc(b.name)}</a></span>
      ${cat ? `<span class="pill">${cat.emoji || ''} <a href="../category/${cat.id}.html">${esc(cat.name)}</a></span>` : ''}
      ${p.band ? `<span class="pill">💸 ${esc(p.band)}</span>` : ''}
    </div>
    ${ings.length ? `<h2>What it is built around</h2><div>${ings.map(i => `<a class="pill" href="../ingredient/${i.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`).join('')}</div>` : ''}
    <h2>Who it suits</h2><p>${esc(p.whoItSuits || '')}</p>
    ${cons.length ? `<div>${cons.map(c => `<a class="pill" href="../concern/${c.id}.html">${c.emoji || ''} ${esc(c.name)}</a>`).join('')}</div>` : ''}
    <h2>How to use it</h2><p>${esc(p.howToUse || '')}</p>
    ${p.watchOut ? `<div class="box">⚠️ <b>Worth knowing:</b> ${esc(p.watchOut)}</div>` : ''}
    ${(() => {
      if (!cat) return '';
      const hit = cons.find(c => PICK_EXISTS.has(`${cat.id}-for-${c.id}`));
      if (hit) return `<p><a class="pill" href="../pick/${cat.id}-for-${hit.id}.html">🏆 Compare Korean ${esc(cat.name.toLowerCase())} for ${esc(hit.name.toLowerCase())} →</a></p>`;
      if (PICK_EXISTS.has(`best-korean-${cat.id}`)) return `<p><a class="pill" href="../pick/best-korean-${cat.id}.html">🏆 Compare Korean ${esc(cat.name.toLowerCase())} →</a></p>`;
      return '';
    })()}
    <p style="font-size:12.5px;color:var(--muted)">We describe products from public information and rank ingredients, never take payment for placement. Formulas change — always read the current ingredient list on the pack you buy.</p>
    ${deeperBlock({ title: `${b.name} ${p.name} ${ings.map(i => i.name).join(' ')}`, slug: p.id })}`;
  emit(`product/${p.id}.html`, shell({
    url, depth: 3, crumb: 'Products', emoji: cat ? cat.emoji : '🧴',
    h1: `${b.name} ${p.name}`, ko: p.korean || '',
    title: `${b.name} ${p.name} — what it is & who it suits`,
    desc: qa, quickAnswer: qa, bodyHtml: body,
    ld: [artLD(`${b.name} ${p.name}`, qa, url), { '@context': 'https://schema.org', '@type': 'Product', name: `${b.name} ${p.name}`, brand: { '@type': 'Brand', name: b.name }, category: cat ? cat.name : undefined, description: String(p.whatItIs || '').slice(0, 400) }],
  }), '0.6');
});

// pick/ — the "which one do I buy" pages, assembled only where enough real
// products exist to make a genuine comparison. Fewer than three and it is a
// list, not a pick, so it is skipped.
let pickCount = 0;
const emitPick = (slug, h1, title, intro, list, extraLinks) => {
  if (list.length < 3) return;
  const url = `${SITE}/guide/kb/pick/${slug}.html`;
  const qa = `${intro} The picks below are ${list.slice(0, 3).map(p => `${BRAND_BY[p.brandId].name} ${p.name}`).join(', ')}${list.length > 3 ? ` and ${list.length - 3} more` : ''}.`;
  const rows = list.map((p, i) => {
    const b = BRAND_BY[p.brandId];
    const ings = (p.heroIngredientIds || []).map(x => ING_BY[x]).filter(Boolean);
    return `<div class="rank"><div class="rn">${i + 1}</div><div>
      <div><b><a href="../product/${p.id}.html">${esc(b.name)} ${esc(p.name)}</a></b>${p.band ? ` <span class="ko">${esc(p.band)}</span>` : ''}</div>
      <div style="font-size:13.5px;color:var(--text2);margin-top:3px">${esc(p.whoItSuits || p.whatItIs || '')}</div>
      ${ings.length ? `<div style="margin-top:5px">${ings.map(x => `<a class="pill" href="../ingredient/${x.id}.html">${x.emoji || ''} ${esc(x.name)}</a>`).join('')}</div>` : ''}
    </div></div>`;
  }).join('');
  const body = `<p class="lead">${esc(qa)}</p>
    <p style="font-size:13px;color:var(--muted)">How this list is built: products are grouped by what they are formulated around and who they suit, drawn from public information. Order is not a ranking of quality and nothing here is paid placement. Formulas change — read the current ingredient list before you buy.</p>
    ${rows}
    ${extraLinks || ''}
    ${deeperBlock({ title: h1, slug })}`;
  emit(`pick/${slug}.html`, shell({ url, depth: 3, crumb: 'Product picks', emoji: '🏆', h1, title, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(h1, qa, url), { '@context': 'https://schema.org', '@type': 'ItemList', name: h1, itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `${BRAND_BY[p.brandId].name} ${p.name}` })) }] }), '0.7');
  pickCount++;
};

CATS_ITEMS.forEach(cat => {
  const inCat = PRODUCTS.filter(p => p.categoryId === cat.id);
  if (inCat.length < 3) return;
  const cn = cat.name.toLowerCase();
  emitPick(`best-korean-${cat.id}.html`.replace('.html', ''), `Best Korean ${cn}: the ones worth knowing`,
    `Best Korean ${cn} — what to buy and why`,
    `Choosing a Korean ${cn} comes down to what it is formulated around and whether the texture suits your skin.`,
    inCat, `<p><a class="pill" href="../category/${cat.id}.html">🧴 What a Korean ${esc(cn)} actually does →</a></p>`);

  CONCERNS.forEach(c => {
    const list = inCat.filter(p => (p.concernIds || []).includes(c.id));
    emitPick(`${cat.id}-for-${c.id}`, `Best Korean ${cn} for ${c.name.toLowerCase()}`,
      `Korean ${cn} for ${c.name.toLowerCase()} — the picks`,
      `For ${c.name.toLowerCase()}, a Korean ${cn} earns its place through what it is built around rather than through the claim on the box.`,
      // Both targets are conditional — category×concern only exists for treatment
      // formats, and best/ needs three ranked ingredients. Link only what was built.
      list, `<p>${WRITTEN_SET.has(`category/${cat.id}-for-${c.id}.html`) ? `<a class="pill" href="../category/${cat.id}-for-${c.id}.html">🧴 What to look for in a ${esc(cn)} for this →</a>` : ''}${WRITTEN_SET.has(`best/korean-ingredients-for-${c.id}.html`) ? `<a class="pill" href="../best/korean-ingredients-for-${c.id}.html">🏆 Ranked ingredients →</a>` : ''}</p>`);
  });

  SKINTYPES.forEach(s => {
    const list = inCat.filter(p => (p.skinTypeIds || []).includes(s.id));
    emitPick(`${cat.id}-for-${s.id}-skin`, `Best Korean ${cn} for ${s.name.toLowerCase()} skin`,
      `Korean ${cn} for ${s.name.toLowerCase()} skin — the picks`,
      `${s.name} skin narrows a Korean ${cn} down mostly by texture and by what the formula leaves behind.`,
      list, `<p><a class="pill" href="../skin-type/${s.id}.html">🧖 ${esc(s.name)} skin guide →</a></p>`);
  });
});
// Brand pages render before products are loaded, so the hero-product list they
// print was dead text pointing nowhere. Post-pass: give every brand page a linked
// list of the product guides that now exist for it.
let brandLinked = 0;
if (PRODUCTS.length) {
  const byBrand = {};
  PRODUCTS.forEach(p => (byBrand[p.brandId] = byBrand[p.brandId] || []).push(p));
  Object.keys(byBrand).forEach(bid => {
    const fp = path.join(OUT, `brand/${bid}.html`);
    let html; try { html = fs.readFileSync(fp, 'utf8'); } catch (e) { return; }
    if (html.indexOf('kb-brandprods') >= 0) return;
    const links = byBrand[bid].sort((a, b) => a.name.localeCompare(b.name))
      .map(p => `<a class="pill" href="../product/${p.id}.html">${esc(p.name)}</a>`).join('');
    const block = `<div class="kb-cont kb-brandprods"><div class="kb-cont-h">🧴 Product guides</div>${links}</div>\n`;
    const anchor = '<div class="kp-nextsteps" hidden></div>';
    if (html.indexOf(anchor) < 0) return;
    writeRetry(fp, html.replace(anchor, block + anchor));
    brandLinked++;
  });
}
if (PRODUCTS.length) console.log(`products: ${PRODUCTS.length} pages · picks: ${pickCount} · brand pages linked: ${brandLinked}`);

// ── 6p. Ingredient pairing matrix (matrix/) — at-a-glance N×N from pairs/avoid data.
(function () {
  const acts = ING.filter(i => (i.pairsWith || []).length || (i.avoidWith || []).length).slice(0, 14);
  if (acts.length < 4) return;
  const cell = (a, b) => {
    if (a.id === b.id) return '<td style="background:#eee">—</td>';
    const avoid = (a.avoidWith || []).includes(b.id) || (b.avoidWith || []).includes(a.id);
    const pair = (a.pairsWith || []).includes(b.id) || (b.pairsWith || []).includes(a.id);
    const v = avoid ? ['⚠️', '#b35f1e'] : pair ? ['✓', '#1a7a45'] : ['·', '#bbb'];
    return `<td style="text-align:center;color:${v[1]};font-weight:800" title="${esc(a.name)} + ${esc(b.name)}">${v[0]}</td>`;
  };
  const header = `<tr><th></th>${acts.map(a => `<th style="font-size:10px">${esc(a.name.replace(/\s*\(.*\)/, ''))}</th>`).join('')}</tr>`;
  const rows = acts.map(a => `<tr><th style="font-size:12px;white-space:nowrap;text-align:left">${a.emoji || ''} ${esc(a.name)}</th>${acts.map(b => cell(a, b)).join('')}</tr>`).join('');
  const url = `${SITE}/guide/kb/matrix/pairing-matrix.html`;
  const qa = `A quick-reference pairing matrix for ${acts.length} popular Korean skincare actives — which pair well (✓), which to use with care (⚠️), and which are neutral (·), at a glance.`;
  const body = `<p class="lead">${esc(qa)}</p><div style="overflow-x:auto"><table class="cmp">${header}${rows}</table></div>
    <p style="font-size:13px;color:var(--muted)">✓ pairs well · ⚠️ use with care (alternate nights or split AM/PM) · · neutral. Tap an ingredient for its full guide.</p>
    <p>${acts.map(a => `<a class="pill" href="../ingredient/${a.id}.html">${esc(a.name)}</a>`).join('')}</p>
    <p><a class="cta" href="${SITE}/kbeauty#cat=ingr">⚗️ Check your own combo in the interactive tool →</a></p>`;
  emit('matrix/pairing-matrix.html', shell({ url, depth: 3, crumb: 'Pairing matrix', emoji: '🧮', h1: 'K-beauty ingredient pairing matrix', title: 'Korean skincare ingredient pairing matrix — what mixes', desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD('Ingredient pairing matrix', qa, url), faqLD('Which Korean skincare ingredients can you mix?', qa)] }), '0.7');
})();

// ── 6q. Hub-tool SEO landings (tools/) + #16 embeddable Glass-Score badge widget.
const TOOL_LANDINGS = [
  { slug: 'cost-per-use-calculator', h1: 'Skincare cost-per-use calculator', emoji: '💸', qa: 'Stop comparing sticker prices — our free calculator shows what a Korean skincare product really costs per use, per month and per year, and how long a bottle lasts.', secs: [['Why cost-per-use matters', 'A pricey essence you use sparingly can be cheaper per use than a budget one you pour on. Cost-per-use reveals the true value of a Korean routine and where to spend or save.'], ['How it works', 'Enter price, size (ml), amount per use and uses per day. The tool computes cost-per-use, monthly and annual spend, and how many days the bottle lasts.']] },
  { slug: 'skincare-expiry-pao-tracker', h1: 'Skincare expiry & shelf-life (PAO) tracker', emoji: '🗓️', qa: 'Not sure when to toss a product? Our free PAO tracker gives the safe-use window for sunscreens, vitamin C, retinoids and more — plus a dispose-by date from the day you opened it.', secs: [['What is PAO?', 'PAO (Period After Opening) is how long a product stays good once opened — shown as a little open-jar symbol (e.g. 12M). Actives like vitamin C and sunscreen degrade faster, so the window is shorter.'], ['How to use it', 'Pick the product type and the date you opened it; the tool returns the months it stays effective and the exact dispose-by date, so you never use a product that has turned.']] },
  { slug: 'skin-cycling-routine-planner', h1: 'Skin-cycling planner — the Korean barrier-first way', emoji: '🔄', qa: 'Skin cycling alternates active and recovery nights for results without irritation. Our free planner lays out a gentle Korean 4-night cycle — exfoliate, retinoid, recover, recover — with the right K-beauty ingredients for each night.', secs: [['What is skin cycling?', 'Instead of using actives every night, you cycle: one exfoliation night, one retinoid night, then recovery nights for the barrier. It suits sensitive and beginner skin.'], ['The Korean twist', 'K-beauty leans barrier-first, so the recovery nights use centella (cica), ceramides, snail mucin and heartleaf to keep skin calm — and SPF every morning, always.']] },
];
TOOL_LANDINGS.forEach(t => {
  const url = `${SITE}/guide/kb/tools/${t.slug}.html`;
  const body = `<p class="lead">${esc(t.qa)}</p>${t.secs.map(s => `<h2>${esc(s[0])}</h2><p>${esc(s[1])}</p>`).join('')}<p><a class="cta" href="${SITE}/kbeauty#cat=tools">🧰 Open the free tool →</a></p>${deeperBlock({ title: t.h1, slug: t.slug })}`;
  emit(`tools/${t.slug}.html`, shell({ url, depth: 3, crumb: 'Tools', emoji: t.emoji, h1: t.h1, title: `${t.h1} — free K-beauty tool`, desc: t.qa, quickAnswer: t.qa, bodyHtml: body, ld: [artLD(t.h1, t.qa, url), faqLD(t.h1 + '?', t.qa)] }), '0.6');
});
// #16 — the embeddable badge (minimal standalone iframe target; written raw, not in sitemap).
const BADGE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Glass Skin Score</title><style>body{margin:0;font:15px/1.4 -apple-system,system-ui,sans-serif}a{display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff;background:linear-gradient(135deg,#d61f6e,#8b46d6);padding:15px 18px;border-radius:14px}a .e{font-size:30px}a b{font-size:16px}a small{display:block;opacity:.92;font-weight:400;font-size:12px;margin-top:2px}a .go{margin-left:auto;font-size:20px}</style></head><body><a href="${SITE}/kbeauty#kb-glassscore" target="_top" rel="noopener"><span class="e">🔮</span><span><b>What's your Glass Skin Score?</b><small>Take the free K-beauty skin test · KoreaPlus</small></span><span class="go">→</span></a></body></html>`;
fs.mkdirSync(path.join(OUT, 'embed'), { recursive: true });
writeRetry(path.join(OUT, 'embed/glass-skin-score.html'), BADGE_HTML);
(function () {
  const url = `${SITE}/guide/kb/tools/embed-glass-skin-score.html`;
  const snippet = `<iframe src="${SITE}/guide/kb/embed/glass-skin-score.html" style="width:100%;max-width:360px;height:82px;border:0" loading="lazy" title="Glass Skin Score by KoreaPlus"></iframe>`;
  const qa = `Embed the free Glass Skin Score on your blog or site with one line of HTML — your visitors take the K-beauty skin test on KoreaPlus and you get a polished interactive widget.`;
  const body = `<p class="lead">${esc(qa)}</p><h2>Copy this snippet</h2><pre style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;overflow-x:auto;font-size:12.5px">${esc(snippet)}</pre><h2>Live preview</h2>${snippet}<p style="font-size:13px;color:var(--muted)">Free to embed. Links back to the full Glass Skin Score tool on KoreaPlus.</p>${deeperBlock({ title: 'glass skin score embed widget', slug: 'embed' })}`;
  emit('tools/embed-glass-skin-score.html', shell({ url, depth: 3, crumb: 'Tools', emoji: '🔌', h1: 'Embed the Glass Skin Score widget', title: 'Embed the Glass Skin Score — free K-beauty widget', desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD('Embed the Glass Skin Score', qa, url)] }), '0.5');
})();

// ── 6r. Layering-order pages (layer/) — optimal sequence + wait-time + AM/PM, by
//        formulation logic (thinnest→thickest, low-pH first, oils last). Data-derived.
const LAYER = {
  vitaminc: { rank: 2, low: 1, am: 1 }, aha: { rank: 2, low: 1, pm: 1, acid: 1 }, bha: { rank: 2, low: 1, pm: 1, acid: 1 }, pha: { rank: 2.5, low: 1, acid: 1 },
  hyaluronic: { rank: 3, damp: 1 }, betaglucan: { rank: 3, damp: 1 }, panthenol: { rank: 3.5 },
  snail: { rank: 4 }, galactomyces: { rank: 4 }, heartleaf: { rank: 4 }, rice: { rank: 4 }, mugwort: { rank: 4 }, ginseng: { rank: 4 }, greentea: { rank: 4 }, propolis: { rank: 4 }, centella: { rank: 4 }, madecassoside: { rank: 4 },
  niacinamide: { rank: 5 }, azelaic: { rank: 5 }, arbutin: { rank: 5 }, tranexamic: { rank: 5 }, peptides: { rank: 5 }, pdrn: { rank: 5 },
  retinol: { rank: 6, pm: 1, retinoid: 1 }, bakuchiol: { rank: 6 },
  ceramide: { rank: 7 }, squalane: { rank: 8, oil: 1 },
  // Extension-pack actives, ranked by the same formulation logic: low-pH and
  // water-thin first, treatment actives in the middle, lipids and oils last.
  lactic: { rank: 2, low: 1, pm: 1, acid: 1 }, mandelic: { rank: 2, low: 1, pm: 1, acid: 1 },
  glycerin: { rank: 3, damp: 1 }, polyglutamic: { rank: 3, damp: 1 }, trehalose: { rank: 3, damp: 1 }, amino: { rank: 3, damp: 1 }, collagen: { rank: 3, damp: 1 },
  aloe: { rank: 3.5 }, birch: { rank: 3.5 }, bamboo: { rank: 3.5 }, ectoin: { rank: 3.5 }, allantoin: { rank: 3.5 },
  bifida: { rank: 4 }, lactobacillus: { rank: 4 }, yeast: { rank: 4 }, soybean: { rank: 4 }, licorice: { rank: 4 }, yuja: { rank: 4 }, blackginseng: { rank: 4 }, pomegranate: { rank: 4 }, royaljelly: { rank: 4 }, pearl: { rank: 4 },
  adenosine: { rank: 5 }, kojic: { rank: 5 }, copperpeptide: { rank: 5 }, egf: { rank: 5 }, exosome: { rank: 5 }, caffeine: { rank: 5, am: 1 }, zincpca: { rank: 5 }, succinic: { rank: 5, pm: 1 }, teatree: { rank: 5, pm: 1 }, sulfur: { rank: 5, pm: 1 },
  ferulic: { rank: 5, am: 1 }, resveratrol: { rank: 5, pm: 1 }, astaxanthin: { rank: 5 }, coq10: { rank: 5 },
  retinal: { rank: 6, pm: 1, retinoid: 1 },
  urea: { rank: 6.5 }, cholesterol: { rank: 7 }, linoleic: { rank: 7 }, vitamine: { rank: 7 }, dimethicone: { rank: 7.5 },
  jojoba: { rank: 8, oil: 1 }, rosehip: { rank: 8, oil: 1 }, argan: { rank: 8, oil: 1 }, camellia: { rank: 8, oil: 1 }, shea: { rank: 8.5, oil: 1 },
};
const LAYER_COMBOS = [['vitaminc', 'niacinamide'], ['retinol', 'niacinamide', 'hyaluronic'], ['bha', 'niacinamide'], ['vitaminc', 'hyaluronic', 'ceramide'], ['snail', 'niacinamide', 'hyaluronic'], ['centella', 'hyaluronic', 'ceramide'], ['aha', 'hyaluronic', 'squalane'], ['azelaic', 'niacinamide'], ['peptides', 'hyaluronic', 'ceramide'], ['bakuchiol', 'hyaluronic'], ['pdrn', 'peptides', 'hyaluronic'], ['arbutin', 'vitaminc', 'niacinamide'], ['retinol', 'ceramide'], ['snail', 'centella', 'hyaluronic'], ['niacinamide', 'hyaluronic', 'retinol'],
  ['retinal', 'niacinamide', 'ceramide'], ['retinal', 'hyaluronic', 'squalane'], ['retinal', 'panthenol', 'ceramide'],
  ['hyaluronic', 'polyglutamic', 'ceramide'], ['glycerin', 'hyaluronic', 'squalane'], ['trehalose', 'hyaluronic', 'ceramide'],
  ['bifida', 'niacinamide', 'ceramide'], ['yeast', 'hyaluronic', 'ceramide'], ['galactomyces', 'niacinamide', 'hyaluronic'],
  ['adenosine', 'peptides', 'ceramide'], ['adenosine', 'hyaluronic', 'squalane'], ['copperpeptide', 'hyaluronic', 'ceramide'],
  ['kojic', 'niacinamide', 'hyaluronic'], ['tranexamic', 'niacinamide', 'ceramide'], ['licorice', 'niacinamide', 'hyaluronic'],
  ['mandelic', 'hyaluronic', 'ceramide'], ['lactic', 'hyaluronic', 'squalane'], ['lactic', 'panthenol', 'ceramide'],
  ['zincpca', 'niacinamide', 'hyaluronic'], ['succinic', 'niacinamide', 'panthenol'], ['teatree', 'centella', 'panthenol'],
  ['ectoin', 'ceramide', 'squalane'], ['allantoin', 'panthenol', 'ceramide'], ['aloe', 'hyaluronic', 'squalane'],
  ['cholesterol', 'ceramide', 'squalane'], ['linoleic', 'niacinamide', 'ceramide'], ['urea', 'ceramide', 'squalane'],
  ['ferulic', 'vitaminc', 'vitamine'], ['vitaminc', 'vitamine', 'squalane'], ['coq10', 'peptides', 'ceramide'],
  ['caffeine', 'peptides', 'hyaluronic'], ['exosome', 'pdrn', 'hyaluronic'], ['egf', 'peptides', 'ceramide'],
  ['pdrn', 'ceramide', 'squalane'], ['heartleaf', 'niacinamide', 'panthenol'], ['mugwort', 'hyaluronic', 'ceramide'],
  ['propolis', 'hyaluronic', 'squalane'], ['rice', 'niacinamide', 'hyaluronic'], ['ginseng', 'peptides', 'camellia'],
  ['blackginseng', 'adenosine', 'ceramide'], ['pomegranate', 'peptides', 'squalane'], ['jojoba', 'ceramide', 'panthenol'],
  ['rosehip', 'niacinamide', 'squalane'], ['argan', 'ceramide', 'hyaluronic'], ['shea', 'ceramide', 'glycerin'],
  ['dimethicone', 'hyaluronic', 'niacinamide'], ['pha', 'hyaluronic', 'ceramide'], ['azelaic', 'centella', 'ceramide']];
const seenLayer = {};
LAYER_COMBOS.forEach(combo => {
  if (!combo.every(id => ING_BY[id] && LAYER[id])) return;
  const sorted = combo.slice().sort((a, b) => LAYER[a].rank - LAYER[b].rank);
  const slug = sorted.join('-'); if (seenLayer[slug]) return; seenLayer[slug] = 1;
  const names = sorted.map(id => ING_BY[id].name);
  const url = `${SITE}/guide/kb/layer/${slug}.html`;
  const hasAcid = combo.some(id => LAYER[id].acid), hasRet = combo.some(id => LAYER[id].retinoid), hasVitc = combo.includes('vitaminc'), hasLow = combo.some(id => LAYER[id].low);
  const steps = sorted.map((id, idx) => {
    const L = LAYER[id]; const tags = [];
    if (L.low) tags.push('low pH — apply to clean, dry skin');
    if (L.damp) tags.push('press into slightly damp skin');
    if (L.oil) tags.push('seal everything in (oil/occlusive last)');
    if (L.am) tags.push('AM');
    if (L.pm) tags.push('PM');
    return `<div class="rank"><div class="rn">${idx + 1}</div><div><b><a href="../ingredient/${id}.html">${esc(ING_BY[id].name)}</a></b>${tags.length ? `<div class="rb">${esc(tags.join(' · '))}</div>` : ''}</div></div>`;
  }).join('');
  const notes = [];
  if (hasLow) notes.push('⏳ Wait ~15–20 minutes after the low-pH step (acid or vitamin C) so it can work before the next layer.');
  if (hasAcid && hasRet) notes.push('🚫 Don’t layer exfoliating acids with a retinoid the same night — alternate them on different nights.');
  if (hasVitc && (hasRet || hasAcid)) notes.push('🕑 Split AM/PM: vitamin C in the morning, ' + (hasRet ? 'retinoid' : 'acids') + ' at night.');
  notes.push('☀️ Finish every morning with SPF, whatever you layered.');
  const qa = `The optimal order for ${names.join(', ')} is: ${names.join(' → ')}. Apply thinnest to thickest, low-pH actives first, oils last — the Korean barrier-friendly way.`;
  const body = `<p class="lead">${esc(qa)}</p><h2>Apply in this order</h2>${steps}
    <div class="box">${notes.map(n => `<div style="margin:4px 0">${esc(n)}</div>`).join('')}</div>
    <p>${sorted.map(id => `<a class="pill" href="../ingredient/${id}.html">${esc(ING_BY[id].name)}</a>`).join('')}<a class="pill" href="${SITE}/kbeauty#cat=ingr">⚗️ Check any combo →</a></p>
    ${deeperBlock({ title: names.join(' '), slug })}`;
  emit(`layer/${slug}.html`, shell({ url, depth: 3, crumb: 'Layering order', emoji: '🧅', h1: `In what order? ${names.join(' + ')}`, title: `What order to apply ${names.join(', ')} — K-beauty layering`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`Layering order: ${names.join(' + ')}`, qa, url), faqLD(`What order do you apply ${names.join(', ')}?`, qa)] }), '0.6');
});

// ── 7. Glossary terms ───────────────────────────────────────────────────────
// A glossary entry whose whole body is one sentence is a thin page. Give each term
// its Korean reading and real onward links, resolved by matching the term against
// the product types and ingredients the library already documents — derived from
// existing data, so nothing here is invented.
const GLOSS_CATS = (d.KBEAUTY_CATEGORIES && d.KBEAUTY_CATEGORIES.items) || [];
GLOSS.forEach((g, idx) => {
  const sg = slug(g.term);
  const url = `${SITE}/guide/kb/term/${sg}.html`;
  const words = String(g.term).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const hit = (name, id) => words.some(w => String(name).toLowerCase().includes(w) || String(id).includes(w));
  const catHits = GLOSS_CATS.filter(ci => hit(ci.name, ci.id)).slice(0, 4);
  const ingHits = ING.filter(i => hit(i.name, i.id)).slice(0, 4);
  const seeAlso = GLOSS.filter((o, i) => i !== idx && String(o.def || '').toLowerCase().includes(String(g.term).split(/[^A-Za-z]+/)[0].toLowerCase())).slice(0, 3);
  const body = `<p class="lead">${esc(g.def || '')}</p>
    ${g.korean ? `<div class="box">🇰🇷 <b>In Korean:</b> ${esc(g.korean)} — this is the word you'll see on Korean packaging and on Olive Young shelves.</div>` : ''}
    ${catHits.length ? `<h2>Where you'll meet it</h2><div>${catHits.map(ci => `<a class="pill" href="../category/${ci.id}.html">${ci.emoji || ''} Korean ${esc(ci.name.toLowerCase())}</a>`).join('')}</div>` : ''}
    ${ingHits.length ? `<h2>Related ingredients</h2><div>${ingHits.map(i => `<a class="pill" href="../ingredient/${i.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`).join('')}</div>` : ''}
    ${seeAlso.length ? `<h2>See also</h2><div>${seeAlso.map(o => `<a class="pill" href="${slug(o.term)}.html">📖 ${esc(o.term)}</a>`).join('')}</div>` : ''}
    <p>Every term in this glossary is used the way Korean brands and Korean dermatology-adjacent marketing actually use it — which is often narrower than the English equivalent implies.</p>
    <p><a href="index.html">All ${GLOSS.length} glossary terms →</a> · <a href="${SITE}/kbeauty">Build your routine free →</a></p>`;
  emit(`term/${sg}.html`, shell({ url, depth: 3, crumb: 'Glossary', emoji: '📖', h1: g.term, ko: g.korean, title: `${g.term} — K-beauty glossary`, desc: g.def, quickAnswer: g.def, bodyHtml: body, ld: [{ '@context': 'https://schema.org', '@type': 'DefinedTerm', name: g.term, description: g.def, inDefinedTermSet: `${SITE}/guide/kb/` }] }), '0.5');
});

// ── 8. Skin-type × concern routines ─────────────────────────────────────────
let rtCount = 0;
SKINTYPES.forEach(st => {
  CONCERNS.forEach(c => {
    const look = (c.lookFor || []).map(id => ING_BY[id]).filter(Boolean).slice(0, 4);
    const url = `${SITE}/guide/kb/routine/${st.id}-${c.id}.html`;
    const body = `<p class="lead">A Korean skincare routine for <b>${esc(st.name.toLowerCase())} skin</b> dealing with <b>${esc(c.name.toLowerCase())}</b>.</p>
      <p>${esc(st.desc || '')}</p>
      <h2>Key ingredients</h2><div>${look.map(i => `<a class="pill" href="../ingredient/${i.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`).join('')}</div>
      <h2>Routine shape</h2><ul><li>AM: gentle cleanse → hydrating toner → targeted serum → moisturizer → <b>SPF</b></li><li>PM: (oil +) gentle cleanse → toner → treatment → moisturizer</li></ul>
      ${c.tip ? `<div class="box">💡 ${esc(c.tip)}</div>` : ''}
      <p><a href="${SITE}/kbeauty">Build your exact routine free →</a></p>`;
    const rtDesc = `A Korean routine for ${st.name.toLowerCase()} skin dealing with ${c.name.toLowerCase()} — the AM and PM step order${look.length ? `, the ingredients worth leaning on (${look.slice(0, 3).map(i => i.name).join(', ')})` : ''}, and how to introduce actives without irritation.`;
    emit(`routine/${st.id}-${c.id}.html`, shell({ url, depth: 3, crumb: 'Routines', emoji: '🧴', h1: `${st.name} skin + ${c.name.toLowerCase()}: Korean routine`, title: `Korean routine for ${st.name.toLowerCase()} skin with ${c.name.toLowerCase()}`, desc: rtDesc, bodyHtml: body, ld: [artLD(`${st.name} skin + ${c.name} routine`, st.desc, url)] }), '0.6');
    rtCount++;
  });
});

// ── 9. Trend/viral verdict pages (folded in from build-kbeauty-seo) ─────────
const verdLabel = id => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? v.label : id; };
const verdEmoji = id => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? v.emoji : ''; };
const trendById = Object.fromEntries((d.KBEAUTY_TRENDS || []).map(t => [t.id, t]));
const citeOf = id => (d.KBEAUTY_CITATIONS || {})[id] || null;
const verdItems = [];
// A handful of trends appear in BOTH banks (radar "does it work?" + viral-check
// "claim vs evidence"). They're genuinely different angles, so both pages stay —
// but the title/FAQ question have to differ too, or the twins compete in the SERP.
(d.KBEAUTY_RADAR.items || []).forEach(it => { const tr = trendById[it.id]; verdItems.push({ slug: it.id, h1: `${it.label}: does it actually work?`, title: `Does ${it.label} actually work? — K-beauty verdict`, faqQ: `Does ${it.label} actually work?`, label: it.label, emoji: it.emoji, verdict: it.verdict, summary: it.blurb, answer: it.science, cite: tr && tr.cite ? citeOf(tr.cite) : null }); });
(d.KBEAUTY_VIRALCHECK.items || []).forEach(it => { verdItems.push({ slug: 'viral-' + it.id, h1: `${it.label}: viral claim vs the evidence`, title: `${it.label}: viral claim vs the evidence — K-beauty fact-check`, faqQ: `Is the viral ${it.label} claim true?`, label: it.label, emoji: it.emoji, verdict: it.verdict, summary: 'Viral claim: "' + it.claim + '"', answer: it.science + (it.note ? ' ' + it.note : ''), cite: null }); });
verdItems.forEach((it, i) => {
  const url = `${SITE}/guide/kb/${it.slug}.html`;
  const body = `<p><span class="vb">${verdEmoji(it.verdict)} ${esc(verdLabel(it.verdict))}</span></p>
    <p class="lead"><i>${esc(it.summary)}</i></p>
    <div class="box">${esc(it.answer)}</div>
    ${it.cite ? `<p style="font-size:13px;color:var(--muted)">Evidence: <a href="${esc(it.cite.url)}" rel="nofollow noopener" target="_blank">${esc(it.cite.label)} ↗</a></p>` : ''}
    ${deeperBlock(it)}`;
  const rel = [verdItems[(i + 1) % verdItems.length], verdItems[(i + 2) % verdItems.length], verdItems[(i + 3) % verdItems.length]].map(r => `<a href="${r.slug}.html">${r.emoji || '•'} ${esc(r.h1)}</a>`).join('');
  // Via emit(), not a raw write: that's what puts these in INDEX, and INDEX is what
  // gives them a slot on the library index, an entry in kb-search.json, an up-next
  // card and an honest sitemap <lastmod>. Written directly, they were orphans.
  emit(it.slug + '.html', shell({ url, depth: 2, crumb: 'Trend verdicts', emoji: it.emoji, h1: it.h1, title: it.title, desc: it.answer, bodyHtml: body, related: rel, ld: [faqLD(it.faqQ, `${verdLabel(it.verdict)}. ${it.answer}`), { '@context': 'https://schema.org', '@type': 'WebPage', speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.box'] }, url }] }), '0.7');
});

// ── 10. Editorial content (history/format/heritage/company/industry/country/philosophy) ──
const EDITORIAL_CATS = {
  history: { path: 'history', crumb: 'History', label: '📜 K-beauty history' },
  format: { path: 'format', crumb: 'Formats', label: '💡 Formats & inventions' },
  heritage: { path: 'heritage', crumb: 'Heritage ingredients', label: '🌿 Heritage ingredients' },
  company: { path: 'company', crumb: 'Companies', label: '🏢 Companies & makers' },
  industry: { path: 'industry', crumb: 'Industry', label: '🏭 Industry & regulation' },
  country: { path: 'country', crumb: 'K-beauty worldwide', label: '🌍 K-beauty worldwide' },
  philosophy: { path: 'compare', crumb: 'Korea vs West', label: '⚖️ Korea vs the West' },
  culture: { path: 'culture', crumb: 'Beauty culture', label: '🎎 Beauty culture' },
  cities: { path: 'shop', crumb: 'Where to shop', label: '🛍️ Seoul shopping' },
  people: { path: 'people', crumb: 'People & creators', label: '👤 People & creators' },
  howto: { path: 'how-to', crumb: 'How-to guides', label: '📋 How-to guides' },
};
const editorialIndex = {};   // cat -> [{slug,h1,emoji,label}]
// Dedup: two editorial waves produced near-duplicate history topics that
// cannibalize each other; keep one per topic, drop the weaker slug.
const EDITORIAL_DROP = new Set([
  'bb-cream-boom-korea-history', 'cushion-compact-era-2008', 'snail-mucin-ingredient-wave',
  'ten-step-routine-globalizes-k-beauty', 'glass-skin-viral-concept-history',
  'thaad-china-demand-shock-2016-17', 'olive-young-health-beauty-retail',
  'indie-brand-boom-late-2010s', 'stylenanda-3ce-makeup-era', 'k-beauty-amazon-history',
  'skintok-tiktok-era-history', 'pdrn-salmon-dna-history',
]);
const EDIT_FILE = path.join(__dirname, 'kbeauty-editorial.json');
let editorialDropped = 0;
if (fs.existsSync(EDIT_FILE)) {
  const ed = JSON.parse(fs.readFileSync(EDIT_FILE, 'utf8'));
  (ed.categories || []).forEach(catObj => {
    const meta = EDITORIAL_CATS[catObj.cat]; if (!meta) return;
    const peers = (catObj.items || []).filter(it => { const drop = EDITORIAL_DROP.has(slug(it.slug || it.h1)); if (drop) editorialDropped++; return !drop; });
    editorialIndex[catObj.cat] = [];
    peers.forEach((it, idx) => {
      const sg = slug(it.slug || it.h1);
      const url = `${SITE}/guide/kb/${meta.path}/${sg}.html`;
      const sections = (it.sections || []).map(s => `<h2>${esc(s.h)}</h2><p>${esc(s.body)}</p>`).join('');
      const facts = (it.keyFacts || []).length ? `<div class="box"><b>Key facts</b><ul>${it.keyFacts.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : '';
      const cites = (it.citations || []).length ? `<h2>Sources</h2><ul>${it.citations.map(c => `<li><a href="${esc(c.url)}" rel="nofollow noopener" target="_blank">${esc(c.label)} ↗</a></li>`).join('')}</ul>` : '';
      const rel = peers.filter((_, j) => j !== idx).slice(0, 6).map(p => `<a href="${slug(p.slug || p.h1)}.html">${p.emoji || ''} ${esc(p.h1)}</a>`).join('');
      const body = `<p class="lead">${esc(it.lead || '')}</p>${sections}${facts}${deeperBlock(it)}${cites}`;
      emit(`${meta.path}/${sg}.html`, shell({ url, depth: 3, crumb: meta.crumb, emoji: it.emoji, h1: it.h1, title: it.title, desc: it.metaDesc, bodyHtml: body, related: rel, ld: [artLD(it.h1, it.metaDesc, url)] }), catObj.cat === 'history' ? '0.7' : '0.6');
      editorialIndex[catObj.cat].push({ sg, h1: it.h1, emoji: it.emoji, path: meta.path });
    });
  });
}
const editorialIdxSections = Object.entries(EDITORIAL_CATS)
  .filter(([k]) => (editorialIndex[k] || []).length)
  .map(([k, meta]) => [meta.label, editorialIndex[k].map(it => `<a href="${meta.path}/${it.sg}.html">${it.emoji || ''} ${esc(it.h1)}</a>`)]);

// ── 11. INCI decoder — function hubs + gated individual ingredient pages ─────
const COSING = require('./assets/cosing-ingredients.json');
const FN_INFO = {
  'humectant': ['Humectants', '💧', 'Humectants draw water into the upper layers of skin, the backbone of K-beauty "dewy" hydration. They work best sandwiched under an emollient or occlusive that locks the water in.'],
  'emollient': ['Emollients & occlusives', '🧴', 'Emollients soften and smooth the skin surface; occlusives form a light seal that slows water loss — the "lock it in" step after watery layers.'],
  'soothing': ['Soothing / calming', '🌿', 'Soothing actives help comfort the look of redness and sensitivity — a defining strength of Korean cica/centella and heartleaf formulas.'],
  'antioxidant': ['Antioxidants', '🍊', 'Antioxidants help defend skin against the visible effects of daily environmental stress and support a brighter, more even-looking tone.'],
  'surfactant': ['Cleansing agents (surfactants)', '🫧', 'Surfactants lift away oil, sunscreen and grime. K-beauty favours mild amino-acid and amphoteric surfactants that clean without stripping.'],
  'preservative': ['Preservatives', '🛡️', 'Preservatives keep water-based formulas safe from microbial growth. Modern, well-tolerated systems are why your essence stays safe for months.'],
  'uv-filter': ['UV filters (sunscreen)', '☀️', 'UV filters absorb or reflect UV. Korea approves several elegant next-generation filters not yet available in the US, a key reason Korean sunscreens feel so light.'],
  'exfoliant': ['Exfoliants (AHA/BHA/PHA)', '✨', 'Chemical exfoliants loosen dead surface cells for smoother, clearer-looking skin. K-beauty tends to favour low, gentle, gradual percentages.'],
  'retinoid': ['Retinoids & alternatives', '🌙', 'Retinoids support skin renewal and the look of firmness over time. Introduce slowly at night and always pair with daytime SPF.'],
  'peptide': ['Peptides', '🧬', 'Peptides are signal ingredients formulated to support a firmer, bouncier-looking complexion — a fast-growing K-beauty category.'],
  'brightening': ['Brightening actives', '🌟', 'Brightening actives target the look of dark spots and uneven tone for a more radiant, even finish.'],
  'fragrance': ['Fragrance & essential oils', '🌸', 'Fragrance and essential oils add scent but can be a sensitivity trigger — useful to recognise on a label if your skin is reactive.'],
  'conditioning': ['Skin-conditioning agents', '🍃', 'Skin-conditioning agents improve how skin looks and feels — versatile multitaskers found across toners, essences and creams.'],
  'stabilizer': ['Emulsifiers & stabilizers', '⚗️', 'Emulsifiers and stabilizers hold oil and water together so a cream stays smooth and uniform from first pump to last.'],
  'ph-adjuster': ['pH adjusters', '⚖️', 'pH adjusters fine-tune a formula to skin-friendly acidity, which keeps both the product and your skin barrier happy.'],
  'chelator': ['Chelators', '🔗', 'Chelators bind stray metal ions so formulas stay stable and effective for longer.'],
  'solvent': ['Solvents', '🧪', 'Solvents dissolve and carry other ingredients. Some lightweight alcohols also give a fast-absorbing finish (a sensitivity point for some skin).'],
  'other': ['Other functional ingredients', '🔬', 'Specialised functional ingredients that round out modern K-beauty formulas.'],
};
function fnBase(fn) {
  const f = String(fn).toLowerCase();
  if (f.includes('uv filter')) return 'uv-filter';
  if (f.includes('humectant')) return 'humectant';
  if (f.includes('preservative')) return 'preservative';
  if (f.includes('fragrance') || f.includes('essential oil')) return 'fragrance';
  if (f.includes('emollient') || f.includes('occlusive')) return 'emollient';
  if (f.includes('antioxidant')) return 'antioxidant';
  if (f.includes('soothing')) return 'soothing';
  if (f.includes('surfactant')) return 'surfactant';
  if (f.includes('peptide')) return 'peptide';
  if (f.includes('retinoid') || f.includes('retinol')) return 'retinoid';
  if (f.includes('exfoliant') || /\b(aha|bha|pha)\b/.test(f)) return 'exfoliant';
  if (f.includes('brightening')) return 'brightening';
  if (f.includes('chelator')) return 'chelator';
  if (f.includes('ph ') || f.includes('ph-adjuster') || f.includes('ph adjuster')) return 'ph-adjuster';
  if (f.includes('emulsifier') || f.includes('stabilizer')) return 'stabilizer';
  if (f.includes('solvent') || f.includes('alcohol')) return 'solvent';
  if (f.includes('conditioning') || f.includes('hydrating')) return 'conditioning';
  return 'other';
}
const inciEntries = Object.entries(COSING.ingredients || {}).map(([key, v]) => ({ key, slug: slug(key), name: v.name || key, fn: v.fn || '', desc: v.desc || '', flags: v.flags || [], base: fnBase(v.fn || '') }));
const byBase = {};
inciEntries.forEach(e => { (byBase[e.base] = byBase[e.base] || []).push(e); });
const gatedInci = inciEntries.filter(e => e.desc && e.desc.split(/\s+/).length >= 14);
const gatedSlugs = new Set(gatedInci.map(e => e.slug));
// 11a. function hubs
Object.entries(byBase).forEach(([base, list]) => {
  const info = FN_INFO[base] || FN_INFO.other;
  const url = `${SITE}/guide/kb/inci-class/${base}.html`;
  const rows = list.slice().sort((a, b) => a.name.localeCompare(b.name)).map(e => gatedSlugs.has(e.slug)
    ? `<li><a href="../inci/${e.slug}.html"><b>${esc(e.name)}</b></a> — ${esc(e.desc || e.fn)}</li>`
    : `<li><b>${esc(e.name)}</b> — ${esc(e.desc || e.fn)}</li>`).join('');
  const body = `<p class="lead">${esc(info[2])}</p>
    <h2>${list.length} ${esc(info[0].toLowerCase())} in the K-beauty INCI decoder</h2>
    <ul>${rows}</ul>
    <p><a href="${SITE}/kbeauty">Decode any ingredient list free →</a></p>`;
  emit(`inci-class/${base}.html`, shell({ url, depth: 3, crumb: 'INCI decoder', emoji: info[1], h1: `${info[0]} in skincare — what they do`, title: `${info[0]} in K-beauty — what they do & full list`, desc: info[2], bodyHtml: body, ld: [artLD(`${info[0]} in skincare`, info[2], url), faqLD(`What are ${info[0].toLowerCase()} in skincare?`, info[2])] }), '0.6');
});
// 11b. gated individual INCI pages
const FLAG_LABEL = { 'eu-allergen': '⚠️ EU-listed fragrance allergen', 'fungal-acne-trigger': '⚠️ May feed malassezia (fungal acne)', 'comedogenic': '⚠️ Can be pore-clogging for some', 'drying': '⚠️ Can be drying in high amounts', 'sensitizer': '⚠️ Possible sensitizer for reactive skin' };
gatedInci.forEach(e => {
  const info = FN_INFO[e.base] || FN_INFO.other;
  const url = `${SITE}/guide/kb/inci/${e.slug}.html`;
  const flagsHtml = (e.flags || []).length ? `<div class="box"><b>Heads-up flags</b><ul>${e.flags.map(f => `<li>${esc(FLAG_LABEL[f] || f)}</li>`).join('')}</ul></div>` : '';
  const peers = (byBase[e.base] || []).filter(x => x.slug !== e.slug && gatedSlugs.has(x.slug)).slice(0, 6).map(x => `<a href="${x.slug}.html">${esc(x.name)}</a>`).join('');
  const body = `<p class="lead">${esc(e.desc)}</p>
    <h2>What it does</h2><p><b>Function:</b> ${esc(e.fn)}. ${esc(info[2])}</p>
    ${flagsHtml}
    <h2>How to spot it on a label</h2><p>On a Korean product's INCI list, look for <b>${esc(e.name)}</b>. Ingredients are listed high-to-low by amount, so its position hints at how much is in the formula. <a href="../inci-class/${e.base}.html">See all ${esc(info[0].toLowerCase())} →</a></p>`;
  emit(`inci/${e.slug}.html`, shell({ url, depth: 3, crumb: 'INCI decoder', emoji: info[1], h1: `${e.name}: what it is in skincare`, title: `${e.name} in skincare — what it does, safety`, desc: e.desc, bodyHtml: body, related: peers, ld: [{ '@context': 'https://schema.org', '@type': 'DefinedTerm', name: e.name, description: e.desc, inDefinedTermSet: `${SITE}/guide/kb/inci-class/${e.base}.html` }, faqLD(`What is ${e.name} in skincare?`, e.desc)] }), '0.5');
});
const inciHubLinks = Object.keys(byBase).map(base => { const info = FN_INFO[base] || FN_INFO.other; return `<a href="inci-class/${base}.html">${info[1]} ${esc(info[0])}</a>`; });

// ── 12. Product categories + category×concern + category×skintype + skintype hubs ──
const TREAT = new Set(['toner', 'essence', 'serum', 'ampoule', 'emulsion', 'cream', 'sleepingmask', 'eyecream', 'tonerpad', 'exfoliator', 'spot']);
const textureFit = (thickness, stId) => {
  const light = thickness <= 2, rich = thickness >= 4;
  if ((stId === 'oily' || stId === 'combination') && light) return 'A lightweight texture like this suits oily and combination skin well — it hydrates without feeling heavy or greasy.';
  if ((stId === 'oily') && rich) return 'This is on the richer side, so oily skin should use it sparingly (or save it for drier patches and colder months).';
  if ((stId === 'dry' || stId === 'sensitive') && rich) return 'A richer, cushioning texture like this is ideal for dry and sensitive skin that needs extra comfort and barrier support.';
  if ((stId === 'dry') && light) return 'On its own this may not be enough for very dry skin — layer it under a richer cream to seal in the hydration.';
  return 'It works for most skin types — adjust how much you layer to how your skin feels.';
};
// 12a. category pages
CATS_ITEMS.forEach(ci => {
  const url = `${SITE}/guide/kb/category/${ci.id}.html`;
  const concernLinks = TREAT.has(ci.id) ? CONCERNS.map(c => `<a class="pill" href="${ci.id}-for-${c.id}.html">${c.emoji || ''} for ${esc(c.name.toLowerCase())}</a>`).join('') : '';
  const stLinks = SKINTYPES.map(s => `<a class="pill" href="${ci.id}-for-${s.id}-skin.html">${s.emoji || ''} ${esc(s.name.toLowerCase())} skin</a>`).join('');
  const body = `<p class="lead">${esc(ci.job || '')}</p>
    <h2>At a glance</h2><div>
      <span class="pill">Texture: ${esc(ci.texture || '')}</span>
      ${ci.westernEquiv ? `<span class="pill">≈ ${esc(ci.westernEquiv)}</span>` : ''}
      ${ci.routinePosition ? `<span class="pill">When: ${esc(ci.routinePosition)}</span>` : ''}
    </div>
    ${ci.need ? `<h2>Do you need it?</h2><p>${esc(ci.need)}${ci.needWhy ? ' ' + esc(ci.needWhy) : ''}</p>` : ''}
    ${ci.skipIf ? `<div class="box">⏭️ <b>You can skip it if:</b> ${esc(ci.skipIf)}</div>` : ''}
    ${ci.tip ? `<div class="box">💡 <b>Tip:</b> ${esc(ci.tip)}</div>` : ''}
    ${concernLinks ? `<h2>Choose by concern</h2><div>${concernLinks}</div>` : ''}
    <h2>Choose by skin type</h2><div>${stLinks}</div>
    <p><a href="${SITE}/kbeauty">Build your routine free →</a></p>`;
  const catDesc = `What a Korean ${ci.name.toLowerCase()} actually is and whether you need one. ${String(ci.job || '').replace(/\.$/, '')}${ci.texture ? ` — a ${ci.texture.toLowerCase()} texture` : ''}${ci.routinePosition ? `, used ${ci.routinePosition.toLowerCase()}` : ''}.`;
  emit(`category/${ci.id}.html`, shell({ url, depth: 3, crumb: 'Product types', emoji: ci.emoji, h1: `Korean ${ci.name}: what it is & do you need it`, ko: ci.korean, title: `Korean ${ci.name} — what it does & how to use`, desc: catDesc, bodyHtml: body, ld: [artLD(`Korean ${ci.name}`, ci.job, url), faqLD(`What is a Korean ${ci.name.toLowerCase()}?`, ci.job)] }), '0.6');
});
// 12b. category × concern
CATS_ITEMS.filter(ci => TREAT.has(ci.id)).forEach(ci => {
  CONCERNS.forEach(c => {
    const look = (c.lookFor || []).map(id => ING_BY[id]).filter(Boolean);
    const url = `${SITE}/guide/kb/category/${ci.id}-for-${c.id}.html`;
    const body = `<p class="lead">How to choose a Korean <b>${esc(ci.name.toLowerCase())}</b> for <b>${esc(c.name.toLowerCase())}</b>.</p>
      <p>${esc(ci.job || '')}</p>
      <h2>Ingredients to look for</h2><div>${look.map(i => `<a class="pill" href="../ingredient/${i.id}-for-${c.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`).join('')}</div>
      ${c.tip ? `<div class="box">💡 ${esc(c.tip)}</div>` : ''}
      <p><a href="${ci.id}.html">All about Korean ${esc(ci.name.toLowerCase())} →</a> · <a href="../concern/${c.id}.html">All ${esc(c.name.toLowerCase())} picks →</a></p>`;
    const ccDesc = `How to choose a Korean ${ci.name.toLowerCase()} for ${c.name.toLowerCase()} — the ingredients worth looking for${look.length ? ` (${look.map(i => i.name).slice(0, 3).join(', ')})` : ''}, what the step does${ci.job ? ` (${ci.job.replace(/\.$/, '')})` : ''}, and where it sits in the routine.`;
    emit(`category/${ci.id}-for-${c.id}.html`, shell({ url, depth: 3, crumb: 'Product types', emoji: ci.emoji, h1: `Best Korean ${ci.name.toLowerCase()} for ${c.name.toLowerCase()}`, title: `Korean ${ci.name.toLowerCase()} for ${c.name.toLowerCase()} — what to look for`, desc: ccDesc, bodyHtml: body, ld: [faqLD(`What Korean ${ci.name.toLowerCase()} is best for ${c.name.toLowerCase()}?`, look.map(i => i.name).join(', '))] }), '0.5');
  });
});
// 12c. category × skintype
CATS_ITEMS.forEach(ci => {
  SKINTYPES.forEach(s => {
    const url = `${SITE}/guide/kb/category/${ci.id}-for-${s.id}-skin.html`;
    const body = `<p class="lead">Choosing a Korean <b>${esc(ci.name.toLowerCase())}</b> for <b>${esc(s.name.toLowerCase())} skin</b>.</p>
      <p>${esc(s.desc || '')}</p>
      <h2>The texture fit</h2><p>${esc(textureFit(ci.thickness || 3, s.id))}</p>
      <p><b>What this step does:</b> ${esc(ci.job || '')}</p>
      ${ci.tip ? `<div class="box">💡 ${esc(ci.tip)}</div>` : ''}
      <p><a href="${ci.id}.html">All about Korean ${esc(ci.name.toLowerCase())} →</a> · <a href="../skin-type/${s.id}.html">${esc(s.name)} skin guide →</a></p>`;
    const cstDesc = `How to choose a Korean ${ci.name.toLowerCase()} for ${s.name.toLowerCase()} skin — what the step actually does${ci.job ? ` (${ci.job.replace(/\.$/, '')})` : ''}, the texture that suits ${s.name.toLowerCase()} skin, and where it belongs in the routine.`;
    emit(`category/${ci.id}-for-${s.id}-skin.html`, shell({ url, depth: 3, crumb: 'Product types', emoji: ci.emoji, h1: `Best Korean ${ci.name.toLowerCase()} for ${s.name.toLowerCase()} skin`, title: `Korean ${ci.name.toLowerCase()} for ${s.name.toLowerCase()} skin`, desc: cstDesc, bodyHtml: body, ld: [artLD(`Korean ${ci.name} for ${s.name} skin`, ci.job, url)] }), '0.5');
  });
});
// 12d. skin-type hubs
SKINTYPES.forEach(s => {
  const concerns = (ST_CONCERNS[s.id] || []).map(id => CONCERN_BY[id]).filter(Boolean);
  const ings = [...new Set(concerns.flatMap(c => (c.lookFor || [])))].map(id => ING_BY[id]).filter(Boolean);
  const url = `${SITE}/guide/kb/skin-type/${s.id}.html`;
  const body = `<p class="lead">${esc(s.desc || '')}</p>
    <h2>What to focus on</h2><div>${(s.focus || []).map(f => `<span class="pill">${esc(f)}</span>`).join('')}</div>
    <h2>Ingredients that suit ${esc(s.name.toLowerCase())} skin</h2><div>${ings.map(i => `<a class="pill" href="../ingredient/${i.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`).join('')}</div>
    <h2>Common concerns for ${esc(s.name.toLowerCase())} skin</h2><div>${concerns.map(c => `<a class="pill" href="../routine/${s.id}-${c.id}.html">${c.emoji || ''} ${esc(c.name)}</a>`).join('')}</div>
    <h2>Product textures to reach for</h2><div>${CATS_ITEMS.map(ci => `<a class="pill" href="../category/${ci.id}-for-${s.id}-skin.html">${ci.emoji || ''} ${esc(ci.name.split('/')[0].trim())}</a>`).join('')}</div>
    <p><a href="${SITE}/kbeauty">Build your ${esc(s.name.toLowerCase())}-skin routine free →</a></p>`;
  emit(`skin-type/${s.id}.html`, shell({ url, depth: 3, crumb: 'Skin types', emoji: s.emoji, h1: `Korean skincare for ${s.name.toLowerCase()} skin`, title: `Korean skincare for ${s.name.toLowerCase()} skin — routine & ingredients`, desc: s.desc, bodyHtml: body, ld: [artLD(`Korean skincare for ${s.name} skin`, s.desc, url), faqLD(`What is the best Korean skincare for ${s.name.toLowerCase()} skin?`, ings.map(i => i.name).join(', '))] }), '0.6');
});
const catHubLinks = CATS_ITEMS.map(ci => `<a href="category/${ci.id}.html">${ci.emoji || ''} ${esc(ci.name.split('/')[0].trim())}</a>`);
const stHubLinks = SKINTYPES.map(s => `<a href="skin-type/${s.id}.html">${s.emoji || ''} ${esc(s.name)} skin</a>`);

// ── 13. Seasonal routines (season×skintype + season×concern) ────────────────
const SEASONS = [
  { id: 'spring', name: 'Spring', emoji: '🌸', note: 'Fluctuating temperatures, pollen and sensitivity, and rising UV mean a gentle, barrier-supportive routine with reliable daily SPF.' },
  { id: 'summer', name: 'Summer', emoji: '☀️', note: 'Heat, humidity, sweat and excess oil call for lightweight, fast-absorbing layers and a high, re-applied sunscreen.' },
  { id: 'autumn', name: 'Autumn', emoji: '🍂', note: 'Dropping humidity is the classic time to repair the moisture barrier and slowly transition to richer textures.' },
  { id: 'winter', name: 'Winter', emoji: '❄️', note: 'Cold air and indoor heating strip moisture, so layer hydrating toners and essences under a richer cream or occlusive.' },
];
let seasCount = 0;
SEASONS.forEach(se => {
  // season overview hub
  const hubUrl = `${SITE}/guide/kb/seasonal/${se.id}.html`;
  const hubBody = `<p class="lead">${esc(se.note)}</p>
    <h2>By skin type</h2><div>${SKINTYPES.map(s => `<a class="pill" href="${se.id}-${s.id}-skin.html">${s.emoji || ''} ${esc(s.name)} skin</a>`).join('')}</div>
    <h2>By concern</h2><div>${CONCERNS.map(c => `<a class="pill" href="${se.id}-${c.id}.html">${c.emoji || ''} ${esc(c.name)}</a>`).join('')}</div>
    <p><a href="${SITE}/kbeauty">Build your routine free →</a></p>`;
  const seDesc = `Korean ${se.name.toLowerCase()} skincare, step by step. ${String(se.note || '').replace(/\.$/, '')} — how to adjust your routine for the season, by skin type and by concern.`;
  emit(`seasonal/${se.id}.html`, shell({ url: hubUrl, depth: 3, crumb: 'Seasonal routines', emoji: se.emoji, h1: `Korean ${se.name.toLowerCase()} skincare guide`, title: `Korean ${se.name.toLowerCase()} skincare — the seasonal guide`, desc: seDesc, bodyHtml: hubBody, ld: [artLD(`Korean ${se.name} skincare guide`, se.note, hubUrl)] }), '0.6');
  seasCount++;
  SKINTYPES.forEach(s => {
    const url = `${SITE}/guide/kb/seasonal/${se.id}-${s.id}-skin.html`;
    const body = `<p class="lead">A Korean <b>${esc(se.name.toLowerCase())}</b> skincare routine for <b>${esc(s.name.toLowerCase())} skin</b>.</p>
      <p>${esc(se.note)}</p><p>${esc(s.desc || '')}</p>
      <h2>${esc(se.name)} adjustments</h2><ul><li>Match texture to the weather — lighter in heat, richer in cold.</li><li>Never skip morning SPF, year-round.</li><li>Introduce or pull back actives gradually as your skin reacts to the season.</li></ul>
      <p><a href="${SITE}/guide/kb/skin-type/${s.id}.html">${esc(s.name)} skin guide →</a> · <a href="${SITE}/kbeauty">Build your routine free →</a></p>`;
    const ssDesc = `Korean ${se.name.toLowerCase()} skincare for ${s.name.toLowerCase()} skin — what the season does to your barrier (${String(se.note || '').replace(/\.$/, '')}) and which textures and actives to switch to.`;
    emit(`seasonal/${se.id}-${s.id}-skin.html`, shell({ url, depth: 3, crumb: 'Seasonal routines', emoji: se.emoji, h1: `Korean ${se.name.toLowerCase()} skincare for ${s.name.toLowerCase()} skin`, title: `${se.name} Korean routine for ${s.name.toLowerCase()} skin`, desc: ssDesc, bodyHtml: body, ld: [artLD(`Korean ${se.name} routine for ${s.name} skin`, se.note, url)] }), '0.5');
    seasCount++;
  });
  CONCERNS.forEach(c => {
    const look = (c.lookFor || []).map(id => ING_BY[id]).filter(Boolean).slice(0, 4);
    const url = `${SITE}/guide/kb/seasonal/${se.id}-${c.id}.html`;
    const body = `<p class="lead">Managing <b>${esc(c.name.toLowerCase())}</b> in <b>${esc(se.name.toLowerCase())}</b> with a Korean approach.</p>
      <p>${esc(se.note)}</p><p>${esc(c.desc || '')}</p>
      <h2>Ingredients to lean on</h2><div>${look.map(i => `<a class="pill" href="${SITE}/guide/kb/ingredient/${i.id}-for-${c.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`).join('')}</div>
      ${c.tip ? `<div class="box">💡 ${esc(c.tip)}</div>` : ''}
      <p><a href="${SITE}/guide/kb/concern/${c.id}.html">All ${esc(c.name.toLowerCase())} picks →</a></p>`;
    const scDesc = `Managing ${c.name.toLowerCase()} through ${se.name.toLowerCase()} the Korean way — how the season shifts your skin (${String(se.note || '').replace(/\.$/, '')})${look.length ? ` and which ingredients to lean on (${look.slice(0, 3).map(i => i.name).join(', ')})` : ''}.`;
    emit(`seasonal/${se.id}-${c.id}.html`, shell({ url, depth: 3, crumb: 'Seasonal routines', emoji: se.emoji, h1: `${se.name} K-beauty for ${c.name.toLowerCase()}`, title: `Korean ${se.name.toLowerCase()} skincare for ${c.name.toLowerCase()}`, desc: scDesc, bodyHtml: body, ld: [artLD(`${se.name} K-beauty for ${c.name}`, c.desc, url)] }), '0.5');
    seasCount++;
  });
});

// ── 13b. Ingredient × season — only for actives where the season genuinely changes
// the advice (exfoliants you ease off in winter, occlusives you drop in summer,
// antioxidants that matter most under strong UV). Ingredients whose usage does not
// shift with the weather are skipped rather than padded out. ──
const SEASONAL_CATS = new Set(['exfoliant', 'barrier', 'antioxidant', 'hydration', 'oil-control', 'acne-care', 'anti-aging']);
const SEASON_ANGLE = {
  spring: { pull: 'rising UV and pollen-season reactivity', advice: 'Spring is when UV climbs while skin is still adjusting out of winter — keep the barrier steady and let sunscreen do the heavy lifting.' },
  summer: { pull: 'heat, humidity, sweat and peak UV', advice: 'Summer rewards lighter textures and punishes anything occlusive. Strength of active matters less than whether it survives a humid day.' },
  autumn: { pull: 'falling humidity and barrier recovery', advice: 'Autumn is the classic Korean repair season — humidity drops, summer sun damage surfaces, and richer textures start to feel right again.' },
  winter: { pull: 'cold air, indoor heating and moisture loss', advice: 'Winter is when barrier support outranks everything. Actives that were comfortable in August frequently are not in January.' },
};
let seasIngCount = 0;
SEASONS.forEach(se => {
  ING.filter(i => SEASONAL_CATS.has(i.cat)).forEach(i => {
    const ang = SEASON_ANGLE[se.id];
    const url = `${SITE}/guide/kb/seasonal/${i.id}-in-${se.id}.html`;
    const forC = (i.bestFor || []).map(x => (CONCERN_BY[x] || {}).name).filter(Boolean);
    const qa = `Using ${i.name} in ${se.name.toLowerCase()}: the season brings ${ang.pull}, so what changes is texture, frequency and what you layer around it — not usually whether you use it at all.`;
    const body = `<p class="lead">${esc(qa)}</p>
      <p>${esc(i.explainer || '')}</p>
      <h2>What ${esc(se.name.toLowerCase())} does to your skin</h2><p>${esc(se.note)}</p>
      <h2>How that changes ${esc(i.name)}</h2><p>${esc(ang.advice)} ${esc(i.name)} works on ${esc(forC.length ? forC.join(', ').toLowerCase() : 'its usual targets')}, and it is normally applied ${esc((i.time || 'both').toUpperCase())}.</p>
      ${(i.avoidWith || []).length ? `<div class="box">⚠️ <b>Keep apart from:</b> ${esc((i.avoidWith).map(x => (ING_BY[x] || {}).name).filter(Boolean).join(', '))} — especially when seasonal dryness has already made skin more reactive.</div>` : ''}
      ${(i.pairsWith || []).length ? `<h2>What to layer it with</h2><div>${(i.pairsWith).map(x => ING_BY[x]).filter(Boolean).map(x => `<a class="pill" href="../ingredient/${x.id}.html">${x.emoji || ''} ${esc(x.name)}</a>`).join('')}</div>` : ''}
      <p><a class="pill" href="${se.id}.html">${se.emoji} Full ${esc(se.name.toLowerCase())} guide →</a><a class="pill" href="../ingredient/${i.id}.html">${i.emoji || ''} ${esc(i.name)} guide →</a></p>
      ${deeperBlock({ title: i.name + ' ' + se.name, slug: i.id + '-' + se.id })}`;
    emit(`seasonal/${i.id}-in-${se.id}.html`, shell({ url, depth: 3, crumb: 'Seasonal routines', emoji: se.emoji, h1: `${i.name} in ${se.name.toLowerCase()}: how to adjust`, title: `${i.name} in ${se.name.toLowerCase()} — how Korean routines adjust`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`${i.name} in ${se.name}`, qa, url), faqLD(`Should you use ${i.name} in ${se.name.toLowerCase()}?`, qa)] }), '0.5');
    seasIngCount++;
  });
});

// ── 13c. Concern × life stage — "adult acne in your 30s" is a different article
// from "acne". Gated by which concerns are actually characteristic of each decade,
// so nothing here invents a problem for an age group that does not typically have it.
const AGE_BANDS = [
  { id: 'teens', name: 'your teens', emoji: '🧒', note: 'Hormonal oil production peaks and the barrier is generally robust — the risk at this stage is over-treating, not under-treating.', concerns: ['acne', 'oiliness', 'blackheads', 'pores', 'postacne', 'sensitivity'] },
  { id: '20s', name: 'your 20s', emoji: '🌱', note: 'The prevention decade. Skin still recovers quickly, which makes it the cheapest possible time to build sunscreen and barrier habits.', concerns: ['acne', 'dehydration', 'pores', 'postacne', 'dullness', 'sundamage', 'texture', 'barrier'] },
  { id: '30s', name: 'your 30s', emoji: '🌿', note: 'Turnover slows and the first cumulative sun damage becomes visible, often alongside breakouts that never fully left.', concerns: ['aging', 'dehydration', 'melasma', 'pigmentation', 'acne', 'dullness', 'texture', 'elasticity'] },
  { id: '40s', name: 'your 40s', emoji: '🌳', note: 'Dryness, pigment and loss of firmness tend to arrive together, and cleansing that worked for twenty years can start to feel stripping.', concerns: ['aging', 'elasticity', 'melasma', 'pigmentation', 'dryness', 'sundamage', 'maturecare'] },
  { id: '50s-beyond', name: 'your 50s and beyond', emoji: '🌾', note: 'Skin is thinner and drier, recovers more slowly, and rewards richer textures and gentler cleansing far more than stronger actives.', concerns: ['maturecare', 'elasticity', 'dryness', 'aging', 'barrier', 'flaking'] },
];
let ageConCount = 0;
AGE_BANDS.forEach(ab => {
  ab.concerns.forEach(cid => {
    const c = CONCERN_BY[cid]; if (!c) return;
    const look = (c.lookFor || []).map(id => ING_BY[id]).filter(Boolean).slice(0, 5);
    const cn = c.name.toLowerCase();
    const url = `${SITE}/guide/kb/age/${c.id}-in-${ab.id}.html`;
    const qa = `${c.name} in ${ab.name}: ${ab.note} The Korean approach leans on ${look.slice(0, 3).map(i => i.name).join(', ')}, introduced one at a time and always finished with daily sunscreen.`;
    const body = `<p class="lead">${esc(qa)}</p>
      <h2>What is different about this stage</h2><p>${esc(ab.note)}</p>
      <h2>What ${esc(cn)} looks like here</h2><p>${esc(c.desc || '')}</p>
      ${look.length ? `<h2>Ingredients to lean on</h2><div>${look.map(i => `<a class="pill" href="../ingredient/${i.id}-for-${c.id}.html">${i.emoji || ''} ${esc(i.name)}</a>`).join('')}</div>` : ''}
      ${c.avoid ? `<div class="box">⚠️ <b>Be careful with:</b> ${esc(c.avoid)}</div>` : ''}
      ${c.tip ? `<div class="box">💡 <b>Tip:</b> ${esc(c.tip)}</div>` : ''}
      <p><a class="pill" href="../concern/${c.id}.html">🎯 Full ${esc(cn)} guide →</a>${WRITTEN_SET.has(`best/korean-ingredients-for-${c.id}.html`) ? `<a class="pill" href="../best/korean-ingredients-for-${c.id}.html">🏆 Ranked ingredients →</a>` : ''}</p>
      ${deeperBlock({ title: c.name + ' ' + ab.name, slug: c.id + '-' + ab.id })}`;
    emit(`age/${c.id}-in-${ab.id}.html`, shell({ url, depth: 3, crumb: 'Routines by age', emoji: ab.emoji, h1: `${c.name} in ${ab.name}: the Korean approach`, title: `${c.name} in ${ab.name} — Korean skincare guide`, desc: qa, quickAnswer: qa, bodyHtml: body, ld: [artLD(`${c.name} in ${ab.name}`, qa, url), faqLD(`How do you treat ${cn} in ${ab.name}?`, qa)] }), '0.6');
    ageConCount++;
  });
});

// ── 14. Ingredient × skin-type (gated via skin-type→concern mapping) ─────────
let isCount = 0;
SKINTYPES.forEach(s => {
  // Two routes in, both anchored to this skin type's concerns: ingredients the
  // concern explicitly names, plus ingredients that name the concern themselves.
  // The first alone missed most of the library — a concern's lookFor list is a
  // curated shortlist, not the full set of actives that address it.
  const stConcerns = ST_CONCERNS[s.id] || [];
  const ids = [...new Set(
    stConcerns.flatMap(cid => (CONCERN_BY[cid] && CONCERN_BY[cid].lookFor) || [])
      .concat(ING.filter(i => (i.bestFor || []).some(b => stConcerns.includes(b))).map(i => i.id))
  )];
  ids.map(id => ING_BY[id]).filter(Boolean).forEach(i => {
    const url = `${SITE}/guide/kb/ingredient/${i.id}-for-${s.id}-skin.html`;
    const body = `<p class="lead">Is <b>${esc(i.name)}</b> good for <b>${esc(s.name.toLowerCase())} skin</b>?</p>
      <p>${esc(i.explainer || '')}</p>
      <h2>Why it suits ${esc(s.name.toLowerCase())} skin</h2><ul>${(i.benefits || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="box">💡 <b>How to use:</b> ${esc((i.time || 'both').toUpperCase())} · patch-test and introduce gradually.</div>
      <p><a href="${SITE}/guide/kb/ingredient/${i.id}.html">Full ${esc(i.name)} guide →</a> · <a href="${SITE}/guide/kb/skin-type/${s.id}.html">${esc(s.name)} skin guide →</a></p>`;
    const isDesc = `Does ${i.name} suit ${s.name.toLowerCase()} skin? ${String((i.benefits || [])[0] || i.explainer || '').replace(/\.$/, '')}. What it does for ${s.name.toLowerCase()} skin, when to use it (${(i.time || 'both').toUpperCase()}), and how to work it into a Korean routine.`;
    emit(`ingredient/${i.id}-for-${s.id}-skin.html`, shell({ url, depth: 3, crumb: 'Ingredients', emoji: i.emoji, h1: `${i.name} for ${s.name.toLowerCase()} skin`, title: `${i.name} for ${s.name.toLowerCase()} skin — does it suit it?`, desc: isDesc, bodyHtml: body, ld: [faqLD(`Is ${i.name} good for ${s.name.toLowerCase()} skin?`, (i.benefits || []).join(' '))] }), '0.5');
    isCount++;
  });
});

// ── 15. Per-language SEO content (8 languages × canonical topics, hreflang clusters) ──
const I18N_FILE = path.join(__dirname, 'kbeauty-i18n.json');
const I18N_HL = { ko: 'ko', ja: 'ja', zh: 'zh-CN', es: 'es', fr: 'fr', de: 'de', pt: 'pt-BR', id: 'id', ar: 'ar', hi: 'hi', ru: 'ru', vi: 'vi', th: 'th' };
let i18nCount = 0;
if (fs.existsSync(I18N_FILE)) {
  const data = JSON.parse(fs.readFileSync(I18N_FILE, 'utf8'));
  const langs = data.languages || [];
  const topicLangs = {};
  langs.forEach(L => (L.items || []).forEach(it => { (topicLangs[it.topicKey] = topicLangs[it.topicKey] || []).push(L.lang); }));
  // Q5-A: citation inheritance — citations are language-neutral {label,url} authority
  // links, so a topic cited in ANY language lends its sources to every sibling that
  // has none (ar/hi/ru/vi/th were authored without them → 350 pages gain Sources).
  const topicCites = {};
  langs.forEach(L => (L.items || []).forEach(it => { if ((it.citations || []).length && !topicCites[it.topicKey]) topicCites[it.topicKey] = it.citations; }));
  langs.forEach(L => {
    const lc = L.lang;
    (L.items || []).forEach(it => {
      const tk = slug(it.topicKey);
      const url = `${SITE}/guide/kb/${lc}/${tk}.html`;
      const alt = (topicLangs[it.topicKey] || []).map(l => `<link rel="alternate" hreflang="${I18N_HL[l] || l}" href="${SITE}/guide/kb/${l}/${tk}.html">`).join('') + `<link rel="alternate" hreflang="x-default" href="${HUB}">`;
      const sections = (it.sections || []).map(s => `<h2>${esc(s.h)}</h2><p>${esc(s.body)}</p>`).join('');
      const facts = (it.keyFacts || []).length ? `<div class="box"><ul>${it.keyFacts.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : '';
      const faqHtml = (it.faq || []).length ? `<h2>FAQ</h2>` + it.faq.map(f => `<details class="kb-faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('') : '';
      const citeList = (it.citations || []).length ? it.citations : (topicCites[it.topicKey] || []);
      const cites = citeList.length ? `<h2>${esc(chrome(lc).sources)}</h2><ul>${citeList.map(c => `<li><a href="${esc(c.url)}" rel="nofollow noopener" target="_blank">${esc(c.label)} ↗</a></li>`).join('')}</ul>` : '';
      const sib = (topicLangs[it.topicKey] || []).filter(l => l !== lc).map(l => `<a href="${SITE}/guide/kb/${l}/${tk}.html">${l.toUpperCase()}</a>`).join(' · ');
      const peers = (L.items || []).filter(x => x.topicKey !== it.topicKey).slice(0, 6).map(p => `<a href="${slug(p.topicKey)}.html">${esc(p.h1)}</a>`).join('');
      const body = `<p class="lead">${esc(it.lead || '')}</p>${sections}${facts}${faqHtml}${cites}${sib ? `<p style="font-size:12px;color:var(--muted2);margin-top:14px">🌐 ${sib}</p>` : ''}`;
      const ld = [artLD(it.h1, it.metaDesc, url)];
      if ((it.faq || []).length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: it.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
      emit(`${lc}/${tk}.html`, shell({ url, depth: 3, lang: lc, altLinks: alt, crumb: 'K-Beauty', emoji: '💄', h1: it.h1, title: it.title, desc: it.metaDesc, bodyHtml: body, related: peers, ld }), '0.6');
      i18nCount++;
    });
  });
}

// ── Hierarchical navigation: category hubs + per-language hubs + top-level index ──
// Every page is reachable: index → category hub → page (EN), and index → language → lang hub → page (i18n).
const HUB_META = {
  ingredient: { e: '🧪', t: 'Ingredients', g: 'Ingredients & INCI' },
  inci: { e: '🔬', t: 'INCI decoder', g: 'Ingredients & INCI' },
  'inci-class': { e: '🔬', t: 'INCI by function', g: 'Ingredients & INCI' },
  mix: { e: '🧪', t: 'What to mix', g: 'Ingredients & INCI' },
  brand: { e: '🏷️', t: 'Brands', g: 'Brands & products' },
  dupe: { e: '💸', t: 'Dupes', g: 'Brands & products' },
  alternative: { e: '🔁', t: 'Korean alternatives', g: 'Brands & products' },
  best: { e: '🏆', t: 'Best ingredients for…', g: 'Ingredients & INCI' },
  vs: { e: '⚖️', t: 'Ingredient comparisons', g: 'Ingredients & INCI' },
  dose: { e: '⚗️', t: 'Dosage & pH', g: 'Ingredients & INCI' },
  'how-it-works': { e: '🔬', t: 'How actives work', g: 'Ingredients & INCI' },
  evidence: { e: '📊', t: 'Evidence grades', g: 'Ingredients & INCI' },
  formulation: { e: '🧫', t: 'Formulation science', g: 'Ingredients & INCI' },
  matrix: { e: '🧮', t: 'Pairing matrix', g: 'Ingredients & INCI' },
  layer: { e: '🧅', t: 'Layering order', g: 'Ingredients & INCI' },
  age: { e: '🎂', t: 'Routines by age', g: 'Skin & routines' },
  climate: { e: '🌡️', t: 'Routines by climate', g: 'Skin & routines' },
  digest: { e: '📰', t: 'Research digest', g: 'K-beauty knowledge' },
  watch: { e: '⚠️', t: 'Regulatory & safety watch', g: 'K-beauty knowledge' },
  hair: { e: '💇', t: 'K-Haircare & scalp', g: 'K-beauty knowledge' },
  makeup: { e: '💋', t: 'K-Makeup & color', g: 'K-beauty knowledge' },
  clinic: { e: '⚕️', t: 'K-Derma education', g: 'K-beauty knowledge' },
  tools: { e: '🧰', t: 'Free tools', g: 'Skin & routines' },
  filter: { e: '🛡️', t: 'Sunscreen filters', g: 'Ingredients & INCI' },
  functional: { e: '📜', t: 'Korean regulation', g: 'K-beauty knowledge' },
  device: { e: '🔌', t: 'Home beauty devices', g: 'K-beauty knowledge' },
  myth: { e: '🔬', t: 'Myths vs evidence', g: 'K-beauty knowledge' },
  label: { e: '🏷️', t: 'Reading Korean labels', g: 'Reference' },
  product: { e: '🧴', t: 'Product guides', g: 'Brands & products' },
  pick: { e: '🏆', t: 'Product picks', g: 'Brands & products' },
  condition: { e: '🩺', t: 'Skin conditions', g: 'Skin & routines' },
  rx: { e: '💊', t: 'Prescriptions & procedures', g: 'Skin & routines' },
  fix: { e: '🔧', t: 'Troubleshooting', g: 'Skin & routines' },
  tone: { e: '🎨', t: 'Skin tone & K-beauty', g: 'K-beauty knowledge' },
  cost: { e: '💸', t: 'Cost & value', g: 'K-beauty knowledge' },
  pregnancy: { e: '🤍', t: 'Pregnancy & skincare', g: 'Skin & routines' },
  men: { e: '🧔', t: "Men's skincare", g: 'Skin & routines' },
  body: { e: '🧼', t: 'Body & hand care', g: 'Skin & routines' },
  spa: { e: '♨️', t: 'Bathhouse & spa culture', g: 'K-beauty knowledge' },
  step: { e: '🔢', t: 'The routine, step by step', g: 'Skin & routines' },
  category: { e: '🧴', t: 'Product types', g: 'Brands & products' },
  concern: { e: '🎯', t: 'Skin concerns', g: 'Skin & routines' },
  'skin-type': { e: '🧖', t: 'Skin types', g: 'Skin & routines' },
  routine: { e: '🧴', t: 'Routines', g: 'Skin & routines' },
  seasonal: { e: '🗓️', t: 'Seasonal routines', g: 'Skin & routines' },
  'how-to': { e: '📋', t: 'How-to guides', g: 'Skin & routines' },
  term: { e: '📖', t: 'Glossary', g: 'Reference' },
  history: { e: '📜', t: 'History', g: 'K-beauty knowledge' },
  format: { e: '💡', t: 'Formats & inventions', g: 'K-beauty knowledge' },
  heritage: { e: '🌿', t: 'Heritage ingredients', g: 'K-beauty knowledge' },
  hanbang: { e: '🪷', t: 'Hanbang heritage', g: 'K-beauty knowledge' },
  say: { e: '🗣️', t: 'Pronunciation', g: 'K-beauty knowledge' },
  ask: { e: '💬', t: 'K-beauty Q&A', g: 'K-beauty knowledge' },
  report: { e: '📰', t: 'Trend reports', g: 'Skin & routines' },
  star: { e: '🎤', t: 'K-pop & K-drama beauty', g: 'K-beauty knowledge' },
  'glass-score': { e: '🔮', t: 'Glass Skin Score', g: 'Skin & routines' },
  company: { e: '🏢', t: 'Companies', g: 'K-beauty knowledge' },
  industry: { e: '🏭', t: 'Industry', g: 'K-beauty knowledge' },
  country: { e: '🌍', t: 'K-beauty worldwide', g: 'K-beauty knowledge' },
  compare: { e: '⚖️', t: 'Korea vs West', g: 'K-beauty knowledge' },
  culture: { e: '🎎', t: 'Beauty culture', g: 'K-beauty knowledge' },
  shop: { e: '🛍️', t: 'Where to shop', g: 'K-beauty knowledge' },
  people: { e: '👤', t: 'People & creators', g: 'K-beauty knowledge' },
};
const LANG_NAMES = { ko: '한국어', ja: '日本語', zh: '简体中文', es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português', id: 'Bahasa Indonesia', ar: 'العربية', hi: 'हिन्दी', ru: 'Русский', vi: 'Tiếng Việt', th: 'ภาษาไทย' };
const byDir = {};
INDEX.forEach(p => { (byDir[p.dir] = byDir[p.dir] || []).push(p); });

// 1) English-library category hubs → /guide/kb/<dir>/index.html
const EMITTED = new Set(written);
Object.keys(HUB_META).forEach(dir => {
  const pages = (byDir[dir] || []).slice().sort((a, b) => a.title.localeCompare(b.title));
  if (!pages.length) return;
  // A directory that already authored its own index (the Glass Score landing) must
  // not be clobbered by a generated "all N guides" hub — that silently replaced a
  // hand-built funnel page with a stub and double-listed it in the sitemap.
  if (EMITTED.has(`${dir}/index.html`)) return;
  const m = HUB_META[dir];
  const links = pages.map(p => `<a href="${p.rel.slice(dir.length + 1)}">${esc(p.title)}</a>`).join('');
  emit(`${dir}/index.html`, shell({ url: `${SITE}/guide/kb/${dir}/`, depth: 2, crumb: m.t, emoji: m.e, h1: `${m.t} — K-Beauty Library`, title: `K-Beauty ${m.t} — all ${pages.length} guides`, desc: `Browse all ${pages.length} K-beauty ${m.t.toLowerCase()} guides in the KoreaPlus library.`, bodyHtml: `<p class="lead">All ${pages.length} ${esc(m.t.toLowerCase())} guides.</p><div class="rel">${links}</div>`, ads: false }), '0.5');
});

// 2) Per-language hubs → /guide/kb/<lang>/index.html (grouped by topic type)
const langGroupOf = (key) => key.startsWith('company-') ? 'Companies' : (key.startsWith('routine-') || key.startsWith('how-to-')) ? 'Routines & how-to' : key.startsWith('ingredient-') ? 'Ingredients' : (key.startsWith('brand-') || key.startsWith('best-')) ? 'Brands' : key.startsWith('faq-') ? 'FAQ' : 'Shopping & trends';
const LG_ORDER = ['Routines & how-to', 'Ingredients', 'Brands', 'Companies', 'Shopping & trends', 'FAQ'];
Object.keys(LANG_NAMES).forEach(lc => {
  const pages = (byDir[lc] || []).slice();
  if (!pages.length) return;
  const groups = {};
  pages.forEach(p => { const key = p.rel.slice(lc.length + 1).replace(/\.html$/, ''); const g = langGroupOf(key); (groups[g] = groups[g] || []).push(p); });
  // Q1: the hub for a language has to be written IN that language — its title, its
  // lead, its section headings. English scaffolding around native articles was the
  // one place the localization stopped short. EN strings stay as the fallback.
  const H = ((CHROME_PACK[lc] || {}).hub) || {};
  const HG = H.groups || {};
  const n = pages.length;
  const fill = (s, dflt) => String(s || dflt).replace('{n}', n);
  const body = LG_ORDER.filter(g => groups[g]).map(g => `<h2>${esc(HG[g] || g)}</h2><div class="rel">${groups[g].sort((a, b) => a.title.localeCompare(b.title)).map(p => `<a href="${p.rel.slice(lc.length + 1)}">${esc(p.title)}</a>`).join('')}</div>`).join('');
  emit(`${lc}/index.html`, shell({
    url: `${SITE}/guide/kb/${lc}/`, depth: 2, lang: lc, crumb: LANG_NAMES[lc], emoji: '🌐',
    h1: `K-Beauty — ${LANG_NAMES[lc]}`,
    title: fill(H.title, `K-Beauty ${LANG_NAMES[lc]} — {n} guides`),
    desc: fill(H.desc, `{n} K-beauty guides in ${LANG_NAMES[lc]}.`),
    bodyHtml: `<p class="lead">${esc(fill(H.lead, '{n} guides'))}</p>${body}`, ads: false,
  }), '0.7');
});

// 3) Top-level library index → /guide/kb/index.html (category tiles + language tiles + verdicts)
const hubCard = (href, e, t, n) => `<a class="kbhub-card" href="${href}"><div class="he">${e}</div><div class="ht">${esc(t)}</div><div class="hn">${n} guides</div></a>`;
const groups = {};
Object.keys(HUB_META).forEach(dir => { if (!(byDir[dir] || []).length) return; const m = HUB_META[dir]; (groups[m.g] = groups[m.g] || []).push(hubCard(`${dir}/`, m.e, m.t, (byDir[dir] || []).length)); });
const GROUP_ORDER = ['Ingredients & INCI', 'Brands & products', 'Skin & routines', 'K-beauty knowledge', 'Reference'];
const LANG_COUNT = Object.keys(LANG_NAMES).length + 1; // + English
let mainBody = `<p class="lead">Everything K-beauty, organized — drill into a category to reach every guide. ${INDEX.length}+ pages across ${LANG_COUNT} languages.</p>`;
GROUP_ORDER.forEach(g => { if (groups[g]) mainBody += `<div class="kbhub-sec">${g}</div><div class="kbhub-grid">${groups[g].join('')}</div>`; });
mainBody += `<div class="kbhub-sec">🌐 In your language</div><div class="kbhub-grid">` + Object.keys(LANG_NAMES).map(lc => (byDir[lc] || []).length ? hubCard(`${lc}/`, '🌐', LANG_NAMES[lc], (byDir[lc] || []).length) : '').join('') + `</div>`;
if ((byDir._root || []).length) mainBody += `<div class="kbhub-sec">⚖️ Trend verdicts</div><div class="rel">` + byDir._root.slice().sort((a, b) => a.title.localeCompare(b.title)).map(p => `<a href="${p.rel}">${esc(p.title)}</a>`).join('') + `</div>`;
writeRetry(path.join(OUT, 'index.html'), shell({ url: `${SITE}/guide/kb/`, depth: 1, h1: 'The K-Beauty Library', emoji: '📚', title: `K-Beauty Library — ingredients, brands, companies & guides in ${LANG_COUNT} languages`, desc: `The complete K-beauty knowledge library — ingredients, brands, company analyses, routines, dupes & FAQs in ${LANG_COUNT} languages. Browse by category.`, bodyHtml: mainBody, ads: false }));
sitemapUrls.push({ loc: `${SITE}/guide/kb/`, prio: '0.9', mod: REAL_TODAY });
// kb-search.json — client-side full-library search index consumed by kb.js (all langs).
const _langset = Object.keys(LANG_NAMES);
const searchJson = INDEX.map(p => {
  const lang = _langset.indexOf(p.dir) >= 0 ? p.dir : 'en';
  // Root-level pages are the trend verdicts — they have no HUB_META entry, so label
  // them explicitly instead of letting them fall through to a blank category.
  const meta = HUB_META[p.dir] || (p.dir === '_root' ? { e: '⚖️', t: 'Trend verdicts' } : null);
  return { t: p.title, u: '/guide/kb/' + p.rel, e: meta ? meta.e : '📄', d: meta ? meta.t : (lang !== 'en' ? LANG_NAMES[lang] : ''), l: lang };
});
writeRetry(path.join(OUT, 'kb-search.json'), JSON.stringify(searchJson));
console.log('kb-search.json:', searchJson.length, 'entries');

// ── Consolidated sitemap (hub 9-lang + every page) ──────────────────────────
const ALT = [['x-default', ''], ['en', ''], ['ko', '?lang=ko'], ['ja', '?lang=ja'], ['zh-CN', '?lang=zh'], ['es', '?lang=es'], ['fr', '?lang=fr'], ['de', '?lang=de'], ['pt-BR', '?lang=pt'], ['id', '?lang=id'], ['ar', '?lang=ar'], ['hi', '?lang=hi'], ['ru', '?lang=ru'], ['vi', '?lang=vi'], ['th', '?lang=th']];
const alts = ALT.map(([hl, q]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${HUB}${q}"/>`).join('\n');
const hubVariants = ['', '?lang=ko', '?lang=ja', '?lang=zh', '?lang=es', '?lang=fr', '?lang=de', '?lang=pt', '?lang=id', '?lang=ar', '?lang=hi', '?lang=ru', '?lang=vi', '?lang=th'];
const hubXml = hubVariants.map(q => `  <url>\n    <loc>${HUB}${q}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${q ? '0.8' : '0.9'}</priority>\n${alts}\n  </url>`).join('\n');
// Q2: per-URL <lastmod> from the freshness ledger (real dates search engines can trust).
const pageXml = sitemapUrls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.mod || REAL_TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u.prio}</priority>\n  </url>`).join('\n');
writeRetry(path.join(__dirname, 'kbeauty-sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${hubXml}\n${pageXml}\n</urlset>\n`);

// Q2: persist the freshness ledger (committed → later builds only move real changes).
// Drop entries for pages this build no longer produces, so a renamed or retired URL
// can't keep a stale firstSeen/lastChanged alive forever.
const FRESH_DROPPED = Object.keys(FRESH).filter(k => !FRESH_SEEN.has(k));
FRESH_DROPPED.forEach(k => { delete FRESH[k]; });
writeRetry(FRESH_FILE, JSON.stringify(FRESH, null, 0));

// ── Q3: "Up next" post-pass — give every article a next click. Chains run inside
// each directory in emit order (wrap at the end); i18n dirs chain within their own
// language. Injected before the stable .kp-nextsteps anchor. Runs AFTER freshness
// hashing (hashes cover the INPUT body, not the final file) so dates stay honest. ──
const CHAIN_SKIP = new Set(['og']);
const byDirChain = {};
INDEX.forEach(p => { if (!CHAIN_SKIP.has(p.dir) && !/index\.html$/.test(p.rel)) (byDirChain[p.dir] = byDirChain[p.dir] || []).push(p); });
let upnextCount = 0;
Object.keys(byDirChain).forEach(dir => {
  const list = byDirChain[dir];
  const lang = Object.prototype.hasOwnProperty.call(LANG_NAMES, dir) ? dir : 'en';
  const C = chrome(lang);
  // A directory with a single article has no sibling to point at — send its reader
  // to the category hub rather than leaving the one page without a next click.
  const soloHub = list.length < 2 && dir !== '_root' && HUB_META[dir];
  if (list.length < 2 && !soloHub) return;
  list.forEach((p, i) => {
    const nxt = soloHub ? null : list[(i + 1) % list.length];
    const href = nxt ? nxt.rel.slice(nxt.rel.indexOf('/') + 1) : 'index.html'; // same-dir relative link
    const label = nxt ? `${nxt.emoji ? nxt.emoji + ' ' : ''}${nxt.title}` : `${soloHub.e} ${soloHub.t}`;
    const card = `<a class="kb-upnext" href="${href}"><span class="un-l">⏭ ${esc(C.upNext)}</span><span class="un-t" style="display:block">${esc(label)}</span></a>\n`;
    const fp = path.join(OUT, p.rel);
    try {
      const html = fs.readFileSync(fp, 'utf8');
      if (html.indexOf('kb-upnext') >= 0) return;
      const anchor = '<div class="kp-nextsteps" hidden></div>';
      if (html.indexOf(anchor) < 0) return;
      writeRetry(fp, html.replace(anchor, card + anchor));
      upnextCount++;
    } catch (e) { }
  });
});

// ── Prune orphans: any .html under kb/ this build did not write is a page that no
// longer exists in the data. Left behind it stays live, competes with whatever
// replaced it, and quietly rots. Only .html is pruned — kb.css, kb.js, the search
// index and og/ images are written by other steps or checked in. ──
let pruned = 0;
(function pruneOrphans(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { pruneOrphans(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    if (WRITTEN_PATHS.has(path.resolve(p))) continue;
    try { fs.unlinkSync(p); pruned++; console.log(`pruned orphan: ${path.relative(OUT, p).replace(/\\/g, '/')}`); }
    catch (err) { console.error(`could not prune ${p}: ${err.message}`); }
  }
})(OUT);

console.log(`pages written: ${written.length} (ingredient ${ING.length}, ix${icCount}, brand ${BRANDS.length}, concern ${CONCERNS.length}, mix ${mixCount}, dupe ${DUPES.length}, gloss ${GLOSS.length}, routine ${rtCount}) + index · orphans pruned: ${pruned}`);
console.log(`sitemap urls: ${sitemapUrls.length + hubVariants.length} (hub ${hubVariants.length} + pages ${sitemapUrls.length}) · up-next cards: ${upnextCount} · freshness entries: ${Object.keys(FRESH).length} (pruned ${FRESH_DROPPED.length})`);
