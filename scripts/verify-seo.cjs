#!/usr/bin/env node
/*
 * verify-seo.cjs — SEO integrity gate for koreaplus-webapp build artifacts.
 *
 * Read-only. Does NOT run build-seo.cjs; it inspects the sitemaps as they
 * currently exist on disk. Checks:
 *   (1) <loc> counts for sitemap.xml + kpop-sitemap.xml, compared against an
 *       optional baseline (.seo-baseline.json). Reports growth/shrinkage;
 *       any NET DECREASE is fatal (exit 1).
 *   (2) hreflang symmetry (best-effort): groups URLs by canonical slug across
 *       the 9 supported languages and lists slugs with missing language
 *       variants (asymmetric language balance).
 *   (3) duplicates: identical <loc> appearing more than once (dupLocs).
 *       Plus a best-effort orphan sample: on-disk generated .html files
 *       (kpop/, ja/, ... under guide/) that are NOT present in any sitemap.
 *   (4) per-language and per-prefix page-count summary.
 *
 * Exit codes: 1 = fatal (sitemap parse failure OR net loc decrease);
 *             0 = ok or warnings only.
 *
 * Usage: node scripts/verify-seo.cjs [--write-baseline]
 *   `node scripts/verify-seo.cjs` always refreshes .seo-baseline.json at the
 *   end (so the next run compares against this run) unless --no-baseline given.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITEMAPS = [
  { name: 'sitemap.xml', file: path.join(ROOT, 'sitemap.xml') },
  { name: 'kpop-sitemap.xml', file: path.join(ROOT, 'kpop-sitemap.xml') },
];
const BASELINE_FILE = path.join(ROOT, '.seo-baseline.json');

// Supported languages. `en` is the bare/default variant (no path prefix).
const LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];
const PREFIXED = LANGS.filter((l) => l !== 'en'); // languages that use /guide/<lang>/
const ORIGIN = 'https://koreaplus-lifes.com';

const args = process.argv.slice(2);
const NO_BASELINE = args.includes('--no-baseline');

let fatal = false;
const warnings = [];
const out = [];
const log = (s) => out.push(s);

function fail(msg) {
  fatal = true;
  warnings.push('FATAL: ' + msg);
}
function warn(msg) {
  warnings.push('WARN: ' + msg);
}

// --- parse sitemaps ---------------------------------------------------------

function extractLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<\s][^<]*?)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) locs.push(m[1].trim());
  return locs;
}

const all = []; // { sitemap, loc }
const perSitemapCount = {};

for (const sm of SITEMAPS) {
  let xml;
  try {
    xml = fs.readFileSync(sm.file, 'utf8');
  } catch (e) {
    fail(`cannot read ${sm.name}: ${e.message}`);
    perSitemapCount[sm.name] = 0;
    continue;
  }
  // Cheap structural sanity check (we don't depend on a full XML parser).
  if (!/<urlset[\s>]/.test(xml) || !/<\/urlset>/.test(xml)) {
    fail(`${sm.name} missing <urlset>...</urlset> wrapper (parse failure)`);
  }
  const locs = extractLocs(xml);
  if (locs.length === 0) {
    fail(`${sm.name} yielded 0 <loc> entries (parse failure or empty sitemap)`);
  }
  perSitemapCount[sm.name] = locs.length;
  for (const loc of locs) all.push({ sitemap: sm.name, loc });
}

// If a sitemap failed to parse, stop before producing misleading analysis.
if (fatal) {
  printReport();
  process.exit(1);
}

const totalLocs = all.length;

// --- (1) baseline comparison ------------------------------------------------

let baseline = null;
if (fs.existsSync(BASELINE_FILE)) {
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  } catch (e) {
    warn(`.seo-baseline.json exists but is unreadable JSON: ${e.message}`);
  }
}

const baselineReport = [];
if (baseline && baseline.perSitemap) {
  for (const sm of SITEMAPS) {
    const now = perSitemapCount[sm.name] || 0;
    const was = baseline.perSitemap[sm.name];
    if (was == null) {
      baselineReport.push(`  ${sm.name}: ${now} (new in baseline)`);
      continue;
    }
    const delta = now - was;
    const sign = delta > 0 ? '+' : '';
    baselineReport.push(`  ${sm.name}: ${was} -> ${now} (${sign}${delta})`);
    if (delta < 0) {
      fail(`${sm.name} loc count DECREASED ${was} -> ${now} (${delta}); ` +
           `possible regression / lost pages`);
    }
  }
  const wasTotal = baseline.total != null
    ? baseline.total
    : Object.values(baseline.perSitemap).reduce((a, b) => a + b, 0);
  const dTotal = totalLocs - wasTotal;
  baselineReport.push(`  TOTAL: ${wasTotal} -> ${totalLocs} (${dTotal >= 0 ? '+' : ''}${dTotal})`);
} else {
  baselineReport.push('  (no baseline found — this run establishes one)');
}

// --- (2) hreflang symmetry + (4) lang/prefix counts -------------------------
//
// Canonicalize each loc to a (lang, slug) pair. slug = origin-relative path
// with the language prefix stripped, so all 9 language variants of one page
// collapse to the same slug. Then a slug is "symmetric" iff every language it
// appears in is present — we flag slugs that have some but not all variants.

const perLang = Object.fromEntries(LANGS.map((l) => [l, 0]));
let unclassifiedLang = 0;

// slug -> Set(langs present)
const slugLangs = new Map();

function classify(loc) {
  let rel;
  try {
    const u = new URL(loc);
    rel = u.pathname;
    // homepage SPA uses ?lang=xx
    const ql = u.searchParams.get('lang');
    if (ql && LANGS.includes(ql)) {
      return { lang: ql, slug: rel + '#spa' };
    }
  } catch (e) {
    rel = loc.replace(ORIGIN, '');
  }
  // path-prefix convention: /guide/<lang>/....  en is bare.
  const m = rel.match(/^\/guide\/([a-z]{2})\/(.*)$/);
  if (m && PREFIXED.includes(m[1])) {
    return { lang: m[1], slug: '/guide/' + m[2] };
  }
  // bare (en/default) — everything else, normalized as en slug
  return { lang: 'en', slug: rel };
}

for (const { loc } of all) {
  const { lang, slug } = classify(loc);
  if (perLang[lang] == null) {
    unclassifiedLang++;
  } else {
    perLang[lang]++;
  }
  let set = slugLangs.get(slug);
  if (!set) {
    set = new Set();
    slugLangs.set(slug, set);
  }
  set.add(lang);
}

// Asymmetry: slugs present in >1 language but not in all that the page family
// uses. We only flag slugs that look localizable (appear in at least one
// prefixed language OR in en alongside others) and are missing variants.
const asymmetric = [];
for (const [slug, set] of slugLangs) {
  // Single-language slugs (e.g. en-only utility pages, raw assets) are not
  // expected to be translated — skip to avoid noise.
  if (set.size <= 1) continue;
  const missing = LANGS.filter((l) => !set.has(l));
  if (missing.length > 0) {
    asymmetric.push({ slug, have: set.size, missing });
  }
}
asymmetric.sort((a, b) => b.missing.length - a.missing.length);

if (asymmetric.length > 0) {
  warn(`${asymmetric.length} slug(s) have asymmetric language coverage ` +
       `(present in 2+ langs but missing some of ${LANGS.length})`);
}

// --- (3) duplicate locs -----------------------------------------------------

// Distinguish two failure modes:
//  - withinFile dupes: one sitemap lists the same loc 2+ times (more serious).
//  - crossFile overlap: a loc appears in BOTH sitemaps (canonical ambiguity).
const seen = new Map();      // loc -> total count across all sitemaps
const perFileSeen = {};      // sitemap -> Map(loc -> count)
const fileForLoc = new Map(); // loc -> Set(sitemaps)
for (const sm of SITEMAPS) perFileSeen[sm.name] = new Map();
for (const { loc, sitemap } of all) {
  seen.set(loc, (seen.get(loc) || 0) + 1);
  const pf = perFileSeen[sitemap];
  pf.set(loc, (pf.get(loc) || 0) + 1);
  let s = fileForLoc.get(loc);
  if (!s) { s = new Set(); fileForLoc.set(loc, s); }
  s.add(sitemap);
}
const dupLocs = [...seen.entries()].filter(([, c]) => c > 1).map(([loc, c]) => ({ loc, count: c }));
const withinFileDups = [];
for (const sm of SITEMAPS) {
  for (const [loc, c] of perFileSeen[sm.name]) {
    if (c > 1) withinFileDups.push({ sitemap: sm.name, loc, count: c });
  }
}
const crossFileDups = [...fileForLoc.entries()]
  .filter(([, set]) => set.size > 1)
  .map(([loc, set]) => ({ loc, sitemaps: [...set] }));
if (withinFileDups.length > 0) {
  warn(`${withinFileDups.length} <loc> value(s) duplicated WITHIN a single sitemap`);
}
if (crossFileDups.length > 0) {
  warn(`${crossFileDups.length} <loc> value(s) appear in MORE THAN ONE sitemap ` +
       `(cross-file overlap; pick one canonical sitemap per URL)`);
}

// --- (3b) orphan on-disk pages (best-effort) --------------------------------
//
// Scan generated content dirs under guide/ for .html files whose canonical URL
// is absent from every sitemap. Best-effort: we map a file path to its most
// likely loc and check membership. Sampled, not exhaustive-failing.

const locSet = new Set(all.map(({ loc }) => loc));
const orphanSample = [];
let orphanTotal = 0;

const SCAN_DIRS = ['kpop', 'kb', ...PREFIXED.map((l) => l)]; // guide/kpop, guide/kb, guide/<lang>
function walkHtml(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(full, acc);
    else if (ent.isFile() && ent.name.endsWith('.html')) acc.push(full);
  }
}

const guideDir = path.join(ROOT, 'guide');
const htmlFiles = [];
for (const d of SCAN_DIRS) walkHtml(path.join(guideDir, d), htmlFiles);

for (const f of htmlFiles) {
  const rel = f.substring(ROOT.length).split(path.sep).join('/'); // /guide/...
  const loc = ORIGIN + rel;
  if (!locSet.has(loc)) {
    orphanTotal++;
    if (orphanSample.length < 15) orphanSample.push(rel);
  }
}
if (orphanTotal > 0) {
  warn(`${orphanTotal} on-disk generated .html file(s) not found in any sitemap ` +
       `(orphan candidates; see sample)`);
}

// --- (4b) prefix/suffix family counts (en/bare slugs only, to dedupe langs) --
// Count canonical page families by recognizable slug suffix/prefix tokens.

const familyPatterns = [
  { label: 'kpop *-member',            re: /\/kpop\/[a-z0-9-]+-member\.html$/ },
  { label: 'kpop *-profile',           re: /\/kpop\/[a-z0-9-]+-profile\.html$/ },
  { label: 'kpop *-history',           re: /\/kpop\/[a-z0-9-]+-history\.html$/ },
  { label: 'kpop-idols-with-*',        re: /\/kpop\/kpop-idols-with-[a-z0-9-]+\.html$/ },
  { label: 'cherry-blossom-*',         re: /cherry-blossom-[a-z0-9-]+\.html$/ },
  { label: 'best-time-to-visit-*',     re: /best-time-to-visit-[a-z0-9-]+\.html$/ },
  { label: 'best-food-in-*',           re: /best-food-in-[a-z0-9-]+\.html$/ },
  { label: 'kb/* (k-beauty lib)',      re: /\/kb\// },
];
// Count over canonical (en/default) slugs only so language variants don't
// multiply the family totals.
const canonicalSlugs = [...slugLangs.keys()];
const familyCounts = familyPatterns.map((p) => ({
  label: p.label,
  count: canonicalSlugs.filter((s) => p.re.test(s)).length,
}));

// --- write baseline ---------------------------------------------------------

let baselineWritten = false;
if (!NO_BASELINE && !fatal) {
  const payload = {
    generatedAt: new Date().toISOString().slice(0, 10),
    perSitemap: perSitemapCount,
    total: totalLocs,
    perLang,
  };
  try {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(payload, null, 2) + '\n');
    baselineWritten = true;
  } catch (e) {
    warn(`could not write .seo-baseline.json: ${e.message}`);
  }
}

// --- report -----------------------------------------------------------------

function printReport() {
  log('');
  log('================ SEO VERIFICATION REPORT ================');
  log('');
  log('[1] LOC COUNTS' + (baseline ? ' (vs baseline)' : ''));
  for (const sm of SITEMAPS) log(`  ${sm.name}: ${perSitemapCount[sm.name] || 0}`);
  log(`  TOTAL: ${totalLocs}`);
  log('');
  log('  Baseline comparison:');
  for (const line of baselineReport) log(line);
  log('');

  log('[2] HREFLANG / LANGUAGE SYMMETRY');
  log(`  Per-language URL counts (en=bare, others=/guide/<lang>/):`);
  for (const l of LANGS) log(`    ${l}: ${perLang[l]}`);
  if (unclassifiedLang) log(`    (unclassified: ${unclassifiedLang})`);
  log(`  Distinct canonical slugs: ${slugLangs.size}`);
  log(`  Asymmetric slugs (multi-lang but missing variants): ${asymmetric.length}`);
  for (const a of asymmetric.slice(0, 15)) {
    log(`    - ${a.slug}  have=${a.have}/${LANGS.length}  missing=[${a.missing.join(',')}]`);
  }
  if (asymmetric.length > 15) log(`    ... and ${asymmetric.length - 15} more`);
  log('');

  log('[3] DUPLICATES & ORPHANS');
  log(`  Total <loc> appearing >1x (any sitemap): ${dupLocs.length}`);
  log(`  Within-file duplicates (same sitemap lists URL 2+x): ${withinFileDups.length}`);
  for (const d of withinFileDups.slice(0, 15)) log(`    x${d.count}  [${d.sitemap}]  ${d.loc}`);
  if (withinFileDups.length > 15) log(`    ... and ${withinFileDups.length - 15} more`);
  log(`  Cross-file overlap (URL in 2+ sitemaps): ${crossFileDups.length}`);
  for (const d of crossFileDups.slice(0, 10)) log(`    [${d.sitemaps.join(' + ')}]  ${d.loc}`);
  if (crossFileDups.length > 10) log(`    ... and ${crossFileDups.length - 10} more`);
  log(`  Orphan on-disk .html (not in sitemap): ${orphanTotal}` +
      (htmlFiles.length ? ` (scanned ${htmlFiles.length} files)` : ' (no files scanned)'));
  for (const o of orphanSample) log(`    - ${o}`);
  if (orphanTotal > orphanSample.length) log(`    ... and ${orphanTotal - orphanSample.length} more`);
  log('');

  log('[4] PAGE FAMILY COUNTS (canonical slugs, language-deduped)');
  for (const f of familyCounts) log(`  ${f.label}: ${f.count}`);
  log('');

  log('-------- SUMMARY --------');
  if (warnings.length === 0) {
    log('  OK — no warnings.');
  } else {
    for (const w of warnings) log('  ' + w);
  }
  if (baselineWritten) log(`  baseline updated: ${path.relative(ROOT, BASELINE_FILE)}`);
  log(`  RESULT: ${fatal ? 'FATAL (exit 1)' : 'PASS (exit 0)'}`);
  log('========================================================');
  process.stdout.write(out.join('\n') + '\n');
  out.length = 0;
}

printReport();
process.exit(fatal ? 1 : 0);
