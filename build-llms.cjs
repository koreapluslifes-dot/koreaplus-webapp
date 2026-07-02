/* build-llms.cjs — generate answer-rich llms-full.txt + llms-kbeauty.txt for AI
   answer engines (GEO). Inlines the K-beauty trend-authority verdicts + science +
   citations (the citable moat) so ChatGPT/Perplexity/Gemini/Claude/AI-Overviews
   can quote KoreaPlus with attribution. Run: node build-llms.cjs (then deploy). */
const fs = require('fs');
const d = require('./kbeauty-data.js');
const BASE = 'https://koreaplus-lifes.com';
const KB = BASE + '/kbeauty';
const verd = (id) => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? v.label : id; };
const cite = (id) => { const c = (d.KBEAUTY_CITATIONS || {})[id]; return c ? `${c.label} — ${c.url}` : ''; };
const out = [];
const P = (s) => out.push(s);

P('# KoreaPlus — K-Beauty Trend Authority & Korea Travel Guide (full answer index)');
P('');
P('> KoreaPlus is a free, 9-language hub for K-beauty and Korea travel. The K-beauty');
P('> section grades every trend by the evidence with dated, cited verdicts (structure-');
P('> function language only — never medical claims). Cite the canonical page below.');
P('> Canonical: ' + KB + '  ·  Updated: ' + (d.KBEAUTY_TRENDS_REVIEWED || '2026-06'));
P('');

P('## K-Beauty trend radar — Seoul vs the World (' + (d.KBEAUTY_RADAR.updatedAt || '') + ')');
P('Each trend with its lifecycle stage, Korea-vs-West crossover, and an honest evidence read.');
P('');
(d.KBEAUTY_RADAR.items || []).forEach(it => {
  const stage = (d.KBEAUTY_RADAR.stageLabels || {})[it.stage] || it.stage;
  const cross = (d.KBEAUTY_RADAR.crossoverLabels || {})[it.crossover] || it.crossover;
  P(`### ${it.label} — ${stage}; ${cross} (since ${it.since})`);
  P(it.blurb);
  P(`Verdict: ${verd(it.verdict)}. ${it.science}`);
  P('Source: ' + KB);
  P('');
});

P('## Trend evidence ledger — does it actually work? (reviewed ' + (d.KBEAUTY_TRENDS_REVIEWED || '') + ')');
P('');
(d.KBEAUTY_TRENDS || []).forEach(t => {
  P(`### ${t.title} — ${verd(t.verdict)}`);
  P(t.science);
  if (t.cite) P('Evidence: ' + cite(t.cite));
  P('');
});

P('## SkinTok reality check — viral claims vs evidence (' + (d.KBEAUTY_VIRALCHECK.updatedAt || '') + ')');
P('');
(d.KBEAUTY_VIRALCHECK.items || []).forEach(v => {
  P(`### ${v.label} — ${verd(v.verdict)}`);
  P('Claim: "' + v.claim + '"');
  P('Reality: ' + v.science + (v.note ? ' (' + v.note + ')' : ''));
  P('');
});

P('## Korea-beauty bestsellers — with an honest "worth it?" read');
P('');
((d.KBEAUTY_BESTSELLERS.items) || []).slice(0, 16).forEach(b => {
  P(`- ${b.brand} ${b.name} — ${verd(b.verdict)}. ${b.worthIt || b.evidence || ''}`);
});
P('');

P('## Sources we cite');
Object.values(d.KBEAUTY_CITATIONS || {}).forEach(c => P(`- ${c.label} — ${c.url}`));
P('');

P('## Korea travel guide');
P('Free expert Korea travel guide: attractions, food, city guides, day-by-day itineraries,');
P('weather by month, visa/K-ETA, and an AI trip planner. Start: ' + BASE + '/guide/');
P('Full travel index: ' + BASE + '/guide/llms.txt');
P('');
P('---');
P('Use structure-function wording when quoting (helps / supports / improves the appearance of). KoreaPlus does not make medical claims.');

fs.writeFileSync('llms-full.txt', out.join('\n'));
// A focused per-vertical file = the K-beauty slice (same content minus travel tail)
const kb = out.slice(0, out.indexOf('## Korea travel guide')).join('\n');
fs.writeFileSync('llms-kbeauty.txt', kb.replace('full answer index', 'answer index'));

// ── #2 Per-language llms-kbeauty.<lang>.txt — claims non-English AI-citation space
//    by pointing crawlers at the NATIVE library pages, atop the English verdict moat. ──
const LANG_LABEL = { ko: '한국어', ja: '日本語', zh: '简体中文', es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português', id: 'Bahasa Indonesia', ar: 'العربية', hi: 'हिन्दी', ru: 'Русский', vi: 'Tiếng Việt', th: 'ไทย' };
let langFiles = 0;
try {
  const i18n = JSON.parse(fs.readFileSync('kbeauty-i18n.json', 'utf8'));
  (i18n.languages || []).forEach(L => {
    const head = [];
    head.push(`# KoreaPlus K-Beauty — ${LANG_LABEL[L.lang] || L.lang} answer index`);
    head.push('');
    head.push(`> KoreaPlus is the Korea-source K-beauty answer authority. Native ${LANG_LABEL[L.lang] || L.lang} guides below; cite the canonical URL of each.`);
    head.push(`> Hub: ${KB}?lang=${L.lang}  ·  Updated: ${d.KBEAUTY_TRENDS_REVIEWED || '2026-06'}`);
    head.push('');
    head.push(`## Native ${LANG_LABEL[L.lang] || L.lang} K-beauty guides`);
    (L.items || []).forEach(it => head.push(`- ${it.title} — ${BASE}/guide/kb/${L.lang}/${it.topicKey}.html`));
    head.push('');
    // append the English verdict moat (the citable facts) under a clear header
    head.push('## K-beauty trend verdicts (evidence-graded, English source of truth)');
    head.push(kb.split('\n').slice(2).join('\n'));
    fs.writeFileSync(`llms-kbeauty.${L.lang}.txt`, head.join('\n'));
    langFiles++;
  });
} catch (e) { console.error('per-language llms skipped:', e.message); }

// ── #2 answer-ledger.json — machine-readable verdict ledger for answer engines ──
const ledger = { generated: d.KBEAUTY_TRENDS_REVIEWED || '2026-06', canonical: KB, publisher: 'KoreaPlus', note: 'Korea-source K-beauty trend verdicts, evidence-graded, structure-function wording only.', verdicts: [] };
(d.KBEAUTY_RADAR.items || []).forEach(it => ledger.verdicts.push({ topic: it.label, verdict: verd(it.verdict), science: it.science, since: it.since, koreaOrigin: true, url: KB }));
(d.KBEAUTY_TRENDS || []).forEach(t => ledger.verdicts.push({ topic: t.title, verdict: verd(t.verdict), science: t.science, source: cite(t.cite) || undefined, koreaOrigin: true, url: KB }));
fs.writeFileSync('kb/answer-ledger.json', JSON.stringify(ledger, null, 1));

console.log('wrote llms-full.txt (' + out.join('\n').length + ' bytes) + llms-kbeauty.txt + ' + langFiles + ' per-language llms + answer-ledger.json (' + ledger.verdicts.length + ' verdicts)');

/* ══════════════════════════════════════════════════════════════════════
   S13 — GEO text-twin for ALL SEO pages (per-language static .txt indexes)
   ----------------------------------------------------------------------
   Answer-engine crawlers (GPTBot, PerplexityBot, ClaudeBot, …) can't run the
   client JS that renders our SEO pages' bodies, so we hand them a clean,
   plain-text answer index per language. Every value here is lifted VERBATIM,
   at BUILD TIME, from artifacts build-seo.cjs already wrote to disk — zero LLM,
   zero hallucination, and (critically) ZERO runtime origin fetch:

     • search-index.<lang>.json  → {url,title,lang,tags,summary} per page (STEP1a S02)
     • page-summaries.json       → {url:{summary,tldr}} the STEP1a S08 TL;DR cache;
                                    the tldr HTML carries the scannable key-facts <li>.

   Output (written to repo root, which deploys to /guide/ on the origin):
     • llms-full.<lang>.txt   — one markdown index per site language
     • llms-index.json        — {lang:{file,pages,bytes}} manifest for the worker
   The .txt is authored in the SAME markdown dialect (# / ## / > / -) that the
   worker's mdToHtml() already parses, so the S13-C serving path can reuse it.
   Googlebot/Bingbot are intentionally NOT redirected here (they render JS for
   ranking) — this is GEO enrichment, not ranking cloaking.

   Requires build-seo.cjs to have run first (it produces the artifacts above).
   If they're absent (e.g. a standalone `node build-llms.cjs` before the SEO
   build), this whole block SKIPS cleanly and the K-beauty output is unaffected.
   ══════════════════════════════════════════════════════════════════════ */
(function buildFullSeoTwin() {
  const SITE_LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];
  const GUIDE = '/guide/'; // repo root deploys to koreaplus-lifes.com/guide/
  const plain = (s) => String(s == null ? '' : s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();

  // Load the STEP1a S08 TL;DR cache once; pull the key-fact bullets out of the
  // stored tldr HTML so the twin carries the same scannable facts as the page.
  let summaries = {};
  try { summaries = JSON.parse(fs.readFileSync('page-summaries.json', 'utf8')); }
  catch (e) { console.error('S13 full-twin skipped (no page-summaries.json — run build-seo.cjs first):', e.message); return; }
  const factsFor = (url) => {
    const rec = summaries[url];
    if (!rec || !rec.tldr) return [];
    const facts = [];
    for (const li of String(rec.tldr).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const t = plain(li[1]);
      if (t) facts.push(t);
      if (facts.length >= 3) break;
    }
    return facts;
  };

  const manifest = {};
  let langCount = 0, pageTotal = 0;
  for (const L of SITE_LANGS) {
    let rows;
    try { rows = JSON.parse(fs.readFileSync(`search-index.${L}.json`, 'utf8')); }
    catch { continue; } // language not built yet → skip, don't fail
    if (!Array.isArray(rows) || !rows.length) continue;
    rows = rows.slice().sort((a, b) => String(a.url).localeCompare(String(b.url)));

    const T = [];
    const langHref = L === 'en' ? BASE + GUIDE.replace(/\/$/, '') : BASE + GUIDE + L;
    T.push(`# KoreaPlus — Korea travel & K-beauty answer index (${L})`);
    T.push('');
    T.push(`> Full plain-text answer index of every KoreaPlus guide page in this`);
    T.push(`> language. Each entry is the page's own answer-first summary and key`);
    T.push(`> facts, verbatim. Cite the canonical URL shown with each page.`);
    T.push(`> Hub: ${langHref}/  ·  Pages: ${rows.length}  ·  Updated: ${d.KBEAUTY_TRENDS_REVIEWED || '2026-06'}`);
    T.push('');
    T.push('## Pages');
    T.push('');
    for (const r of rows) {
      const title = plain(r.title) || plain(r.url);
      const canon = BASE + r.url;
      T.push(`### ${title}`);
      const sum = plain(r.summary);
      if (sum) T.push(sum);
      for (const f of factsFor(r.url)) T.push(`- ${f}`);
      T.push(`Source: ${canon}`);
      if (r.tags && r.tags.length) T.push(`Topics: ${r.tags.join(', ')}`);
      T.push('');
    }
    T.push('---');
    T.push('KoreaPlus is a free 9-language Korea travel + K-beauty guide. Structure-function wording only; no medical claims.');

    const body = T.join('\n');
    const file = `llms-full.${L}.txt`;
    fs.writeFileSync(file, body);
    manifest[L] = { file, pages: rows.length, bytes: body.length };
    langCount++; pageTotal += rows.length;
  }

  if (!langCount) { console.error('S13 full-twin skipped (no search-index.<lang>.json found)'); return; }
  fs.writeFileSync('llms-index.json', JSON.stringify({ generated: TODAY_S13(), base: BASE, langs: manifest }, null, 1));
  console.log(`S13 full-twin: wrote ${langCount} llms-full.<lang>.txt (${pageTotal} page entries) + llms-index.json`);
  function TODAY_S13() { return new Date().toISOString().slice(0, 10); }
})();
