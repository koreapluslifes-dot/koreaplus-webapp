/* build-kbeauty-seo.cjs (#7 GEO answer pages + #6 cross-vertical linking)
   Emits lightweight, crawlable, JS-free "does X work?" answer pages under
   /guide/kb/ from the K-beauty trend-authority data — FAQPage + Speakable +
   DefinedTerm JSON-LD, verdict + science + citation, deep-links to the full
   interactive hub and across verticals. Run: node build-kbeauty-seo.cjs
   Output: ./kb/*.html  +  ./kbeauty-answers-sitemap.xml  (deploy to /guide/). */
const fs = require('fs');
const path = require('path');
const d = require('./kbeauty-data.js');
const SITE = 'https://koreaplus-lifes.com';
const OUT = path.join(__dirname, 'kb');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const verdLabel = (id) => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? v.label : id; };
const verdEmoji = (id) => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? v.emoji : ''; };
const trendById = Object.fromEntries((d.KBEAUTY_TRENDS || []).map(t => [t.id, t]));
const citeOf = (id) => { const c = (d.KBEAUTY_CITATIONS || {})[id]; return c || null; };

// ── Build the answer set ────────────────────────────────────────────────────
const items = [];
(d.KBEAUTY_RADAR.items || []).forEach(it => {
  const tr = trendById[it.id];
  items.push({
    slug: it.id,
    q: `Does ${it.label} actually work? K-beauty trend verdict`,
    h1: `${it.label}: does it actually work?`,
    label: it.label, emoji: it.emoji, verdict: it.verdict,
    summary: it.blurb, answer: it.science,
    meta: [['Stage', (d.KBEAUTY_RADAR.stageLabels || {})[it.stage] || it.stage], ['Korea↔West', (d.KBEAUTY_RADAR.crossoverLabels || {})[it.crossover] || it.crossover], ['Trending since', it.since]],
    cite: tr && tr.cite ? citeOf(tr.cite) : null,
    kind: 'trend',
  });
});
(d.KBEAUTY_VIRALCHECK.items || []).forEach(it => {
  items.push({
    slug: 'viral-' + it.id,
    q: `${it.label}: does it work? SkinTok reality check`,
    h1: `${it.label}: viral claim vs the evidence`,
    label: it.label, emoji: it.emoji, verdict: it.verdict,
    summary: 'Viral claim: “' + it.claim + '”',
    answer: it.science + (it.note ? ' ' + it.note : ''),
    meta: [['Trending since', it.since]],
    cite: null, kind: 'viral',
  });
});

const related = (i) => {
  const out = [];
  for (let k = 1; k <= 3; k++) out.push(items[(i + k) % items.length]);
  return out;
};

const CSS = 'body{margin:0;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1a1320;background:#fff}'
  + '.w{max-width:720px;margin:0 auto;padding:22px 18px 60px}a{color:#c01a63}'
  + '.bc{font-size:13px;color:#777;margin-bottom:14px}.bc a{color:#777;text-decoration:none}'
  + 'h1{font-size:26px;line-height:1.25;margin:6px 0 10px}.em{font-size:30px}'
  + '.vb{display:inline-block;font-size:13px;font-weight:800;color:#fff;background:linear-gradient(135deg,#d61f6e,#8b46d6);border-radius:16px;padding:5px 13px;margin:4px 0 14px}'
  + '.sum{font-size:15px;color:#444;font-style:italic;margin:0 0 14px}'
  + '.ans{font-size:17px;background:#faf3f7;border:1px solid #f0d8e6;border-radius:14px;padding:16px 18px}'
  + '.meta{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.meta span{font-size:12.5px;font-weight:700;background:#f4eef2;border-radius:14px;padding:5px 11px;color:#333}'
  + '.src{font-size:13px;color:#666;margin:12px 0}.cta{display:inline-block;margin:18px 0;background:linear-gradient(135deg,#d61f6e,#8b46d6);color:#fff;text-decoration:none;font-weight:800;border-radius:24px;padding:12px 22px}'
  + '.rel{margin-top:26px;border-top:1px solid #eee;padding-top:18px}.rel h2{font-size:15px}.rel a{display:block;padding:7px 0;text-decoration:none;font-weight:600}'
  + '.foot{margin-top:26px;border-top:1px solid #eee;padding-top:14px;font-size:13px;color:#777}.foot a{margin-right:14px;text-decoration:none}'
  + '.disc{font-size:11.5px;color:#999;margin-top:18px}';

function page(it, i) {
  const url = `${SITE}/guide/kb/${it.slug}.html`;
  const desc = (it.answer || it.summary).slice(0, 155);
  const faqLD = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: `${verdLabel(it.verdict)}. ${it.answer}` } }] };
  const speakLD = { '@context': 'https://schema.org', '@type': 'WebPage', speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.ans'] }, url };
  const rel = related(i);
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(it.q)} | KoreaPlus</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(it.h1)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:type" content="article">
<link rel="alternate" hreflang="x-default" href="${SITE}/kbeauty">
<script type="application/ld+json">${JSON.stringify(faqLD)}</script>
<script type="application/ld+json">${JSON.stringify(speakLD)}</script>
<style>${CSS}</style></head><body><div class="w">
<div class="bc"><a href="${SITE}/kbeauty">K-Beauty</a> › <a href="${SITE}/guide/kb/">Trend verdicts</a></div>
<div class="em" aria-hidden="true">${it.emoji || '✨'}</div>
<h1>${esc(it.h1)}</h1>
<div class="vb">${verdEmoji(it.verdict)} ${esc(verdLabel(it.verdict))}</div>
<p class="sum">${esc(it.summary)}</p>
<div class="ans">${esc(it.answer)}</div>
<div class="meta">${it.meta.map(m => `<span>${esc(m[0])}: ${esc(m[1])}</span>`).join('')}</div>
${it.cite ? `<div class="src">Evidence: <a href="${esc(it.cite.url)}" rel="nofollow noopener" target="_blank">${esc(it.cite.label)} ↗</a></div>` : ''}
<a class="cta" href="${SITE}/kbeauty">See the full K-beauty trend radar →</a>
<div class="rel"><h2>More honest verdicts</h2>${rel.map(r => `<a href="${SITE}/guide/kb/${r.slug}.html">${r.emoji || '•'} ${esc(r.h1)}</a>`).join('')}</div>
<div class="foot"><a href="${SITE}/kbeauty">💄 K-Beauty hub</a><a href="${SITE}/guide/kpop.html">🎤 K-Pop</a><a href="${SITE}/guide/">🧭 Korea travel guide</a></div>
<p class="disc">General educational information using cosmetic structure-function wording — not medical advice. Some links may be affiliate links. © KoreaPlus.</p>
</div></body></html>`;
}

items.forEach((it, i) => fs.writeFileSync(path.join(OUT, it.slug + '.html'), page(it, i)));

// Cluster index page (hub for internal linking + crawl)
const indexHtml = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>K-Beauty trend verdicts — does it actually work? | KoreaPlus</title>
<meta name="description" content="Honest, evidence-based verdicts on ${items.length} K-beauty trends and viral claims — proven, promising, or hype, with sources.">
<link rel="canonical" href="${SITE}/guide/kb/">
<link rel="alternate" hreflang="x-default" href="${SITE}/kbeauty">
<style>${CSS}</style></head><body><div class="w">
<div class="bc"><a href="${SITE}/kbeauty">K-Beauty</a> › Trend verdicts</div>
<h1>K-beauty trend verdicts — does it actually work?</h1>
<p class="sum">Evidence-based, dated verdicts on the trends and viral claims everyone is asking about.</p>
<div class="rel">${items.map(it => `<a href="${SITE}/guide/kb/${it.slug}.html">${verdEmoji(it.verdict)} ${esc(it.h1)}</a>`).join('')}</div>
<a class="cta" href="${SITE}/kbeauty">Explore the full interactive K-beauty hub →</a>
<div class="foot"><a href="${SITE}/guide/kpop.html">🎤 K-Pop</a><a href="${SITE}/guide/">🧭 Korea travel guide</a></div>
</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml);

// Sitemap for the answer cluster
const today = '2026-06-18';
const urls = [`${SITE}/guide/kb/`, ...items.map(it => `${SITE}/guide/kb/${it.slug}.html`)];
const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n')
  + `\n</urlset>`;
fs.writeFileSync(path.join(__dirname, 'kbeauty-answers-sitemap.xml'), sm);

console.log('wrote ' + items.length + ' answer pages + index + sitemap (' + urls.length + ' urls)');
