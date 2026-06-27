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
const sitemapUrls = [];   // { loc, prio }
const written = [];

const ING = d.KBEAUTY_INGREDIENTS || [];
const ING_BY = Object.fromEntries(ING.map(i => [i.id, i]));
const BRANDS = d.KBEAUTY_BRANDS || [];
const CONCERNS = d.KBEAUTY_CONCERNS || [];
const CONCERN_BY = Object.fromEntries(CONCERNS.map(c => [c.id, c]));
const DUPES = d.KBEAUTY_DUPES || [];
const GLOSS = d.KBEAUTY_GLOSSARY || [];
const CONFLICTS = d.KBEAUTY_CONFLICTS || [];
const SKINTYPES = d.KBEAUTY_SKINTYPES || [];
const verd = id => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? (v.emoji + ' ' + v.label) : ''; };
// Traffic-10 datasets (authored, no-fabrication): pronunciation/Hangul, hanbang heritage, PAA Q&A.
const SAY = require('./kbeauty-say.json');       // { brands:[], ingredients:[] }
const HANBANG = require('./kbeauty-hanbang.json'); // []
const ASKQ = require('./kbeauty-ask.json');        // []

const CSS = 'body{margin:0;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1a1320;background:#fff}'
  + '.w{max-width:740px;margin:0 auto;padding:22px 18px 64px}a{color:#c01a63}'
  + '.bc{font-size:13px;color:#777;margin-bottom:12px}.bc a{color:#777;text-decoration:none}'
  + 'h1{font-size:27px;line-height:1.25;margin:6px 0 6px}h2{font-size:18px;margin:26px 0 8px}.em{font-size:32px}'
  + '.ko{color:#999;font-size:15px;font-weight:600}'
  + '.lead{font-size:17px;color:#333;line-height:1.6}'
  + '.box{background:#faf3f7;border:1px solid #f0d8e6;border-radius:14px;padding:14px 16px;margin:14px 0}'
  + '.pill{display:inline-block;font-size:12.5px;font-weight:700;background:#f4eef2;border-radius:14px;padding:5px 11px;margin:3px 4px 3px 0;color:#333;text-decoration:none}'
  + '.vb{display:inline-block;font-size:13px;font-weight:800;color:#fff;background:linear-gradient(135deg,#d61f6e,#8b46d6);border-radius:16px;padding:4px 12px}'
  + '.cta{display:inline-block;margin:18px 0;background:linear-gradient(135deg,#d61f6e,#8b46d6);color:#fff;text-decoration:none;font-weight:800;border-radius:24px;padding:12px 22px}'
  + 'ul{padding-left:20px}li{margin:5px 0}'
  + '.rel{margin-top:28px;border-top:1px solid #eee;padding-top:16px}.rel a{display:inline-block;margin:4px 8px 4px 0}'
  + '.foot{margin-top:24px;border-top:1px solid #eee;padding-top:14px;font-size:13px;color:#777}.foot a{margin-right:14px;text-decoration:none}'
  + '.kb-faq{background:#faf3f7;border:1px solid #f0d8e6;border-radius:12px;padding:10px 14px;margin:8px 0}.kb-faq summary{cursor:pointer;font-weight:800;font-size:15px;color:#1a1320}.kb-faq p{margin:8px 0 2px;font-size:14.5px}'
  + '.qa{background:linear-gradient(135deg,#fff0f6,#f3ecff);border:1px solid #f0d8e6;border-left:4px solid #d61f6e;border-radius:12px;padding:12px 15px;margin:14px 0 18px;font-size:15.5px;line-height:1.55;color:#1a1320}.qa b{color:#c01a63}'
  + '.kbh{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;padding:10px 18px;background:#fff;border-bottom:1px solid #f0d8e6}'
  + '.kbh-logo{font-weight:900;font-size:18px;color:#1a1320;text-decoration:none;letter-spacing:-.01em}.kbh-logo b{color:#d61f6e}'
  + '.kbh-lib{margin-left:auto;font-size:13px;font-weight:800;color:#c01a63;text-decoration:none}.kbh-lib:hover{text-decoration:underline}'
  + '.kbhub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:14px 0 30px}'
  + '.kbhub-card{display:block;padding:16px;border:1px solid #f0d8e6;border-radius:14px;text-decoration:none;color:#1a1320;background:#faf3f7;transition:transform .15s,box-shadow .15s}.kbhub-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(214,31,110,.1)}'
  + '.kbhub-card .he{font-size:24px}.kbhub-card .ht{font-weight:800;font-size:14.5px;margin-top:4px}.kbhub-card .hn{font-size:12px;color:#999;margin-top:2px}'
  + '.kbhub-sec{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#999;margin:24px 0 4px}'
  + '.disc{font-size:11.5px;color:#999;margin-top:16px}';

// ── Google AdSense (Auto ads page tag + one in-content responsive unit) ─────
const ADSENSE_CLIENT = 'ca-pub-1378943893051810';
const ADSENSE_SLOT = '4521899200';
const AD_LOADER = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>`;
const AD_UNIT = `<ins class="adsbygoogle" style="display:block;margin:22px 0;width:100%" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>`;

function crumbLD(o) {
  const items = [
    { name: 'K-Beauty', item: SITE + '/kbeauty' },
    { name: 'Library', item: SITE + '/guide/kb/' },
    { name: o.crumb || o.h1, item: o.url },
  ];
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) };
}
function shell(o) {
  // o: {url, title, desc, depth, h1, emoji, ko, bodyHtml, ld, related, ads, quickAnswer}
  const back = '../'.repeat(o.depth || 2);
  // AEO: a short Korea-framed "Quick answer" on every content page, marked Speakable so
  // answer engines / voice assistants can quote it. Hubs (ads:false) skip it.
  const qaText = o.quickAnswer || (o.ads !== false ? (o.desc || '') : '');
  const speak = qaText ? [{ '@context': 'https://schema.org', '@type': 'WebPage', url: o.url, speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.qa', 'h1'] } }] : [];
  const ld = [crumbLD(o)].concat(o.ld || []).concat(speak).map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('');
  // Ads only on substantive pages (AdSense policy: no ads on thin/low-value pages).
  const plain = (o.bodyHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const adsOk = o.ads !== false && plain.length >= 300;
  const hreflangs = o.altLinks || (`<link rel="alternate" hreflang="en" href="${o.url}">\n<link rel="alternate" hreflang="x-default" href="${o.url}">`);
  return `<!doctype html><html lang="${o.lang || 'en'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)} | KoreaPlus</title>
<meta name="description" content="${esc((o.desc || '').slice(0, 158))}">
<link rel="canonical" href="${o.url}">
<meta property="og:title" content="${esc(o.h1)}"><meta property="og:description" content="${esc((o.desc || '').slice(0, 158))}"><meta property="og:url" content="${o.url}"><meta property="og:type" content="article">
${hreflangs}
<link rel="icon" type="image/svg+xml" href="${SITE}/guide/kbeauty-favicon.svg">
<meta name="theme-color" content="#d61f6e">
<meta property="og:site_name" content="K-Beauty by KoreaPlus">
${ld}
${adsOk ? AD_LOADER : ''}
<style>${CSS}</style></head><body>
<header class="kbh"><a class="kbh-logo" href="/kbeauty" aria-label="K-Beauty home"><span aria-hidden="true">🧴</span> <b>K</b>·Beauty</a><a class="kbh-lib" href="/guide/kb/">📚 Library</a></header>
<div class="w">
<div class="bc"><a href="${SITE}/kbeauty">K-Beauty</a> › <a href="${SITE}/guide/kb/">Library</a>${o.crumb ? ' › ' + o.crumb : ''}</div>
<div class="em" aria-hidden="true">${o.emoji || '✨'}</div>
<h1>${esc(o.h1)}${o.ko ? ` <span class="ko">${esc(o.ko)}</span>` : ''}</h1>
${qaText ? `<div class="qa">⚡ <b>Quick answer:</b> ${esc(qaText)}</div>` : ''}
${o.bodyHtml}
${adsOk ? AD_UNIT : ''}
<a class="cta" href="${SITE}/kbeauty">Explore the full K-beauty hub →</a>
${o.related ? `<div class="rel"><h2>Related</h2>${o.related}</div>` : ''}
<div class="foot"><a href="${SITE}/kbeauty">💄 K-Beauty hub</a><a href="${SITE}/guide/kb/">📚 All guides</a><a href="${SITE}/guide/kpop.html">🎤 K-Pop</a><a href="${SITE}/guide/">🧭 Korea travel</a></div>
<p class="disc">General educational information using cosmetic structure-function wording — not medical advice. Always patch-test new actives. © KoreaPlus.</p>
</div></body></html>`;
}
const INDEX = [];   // {rel, dir, title} — drives the category/language hub pages
function emit(rel, html, prio) {
  const fp = path.join(OUT, rel); ensure(path.dirname(rel)); fs.writeFileSync(fp, html);
  sitemapUrls.push({ loc: `${SITE}/guide/kb/${rel}`, prio: prio || '0.6' }); written.push(rel);
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : rel;
  const dir = rel.indexOf('/') >= 0 ? rel.slice(0, rel.indexOf('/')) : '_root';
  INDEX.push({ rel, dir, title });
}
const faqLD = (q, a) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }] });
const artLD = (h, desc, url) => ({ '@context': 'https://schema.org', '@type': 'Article', headline: h, description: desc, datePublished: '2026-06-01', dateModified: TODAY, author: { '@type': 'Organization', name: 'KoreaPlus Editorial' }, publisher: { '@type': 'Organization', name: 'KoreaPlus' }, mainEntityOfPage: url });

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

// ── 1. Ingredient deep-dives ────────────────────────────────────────────────
ING.forEach(i => {
  const concerns = (i.bestFor || []).map(c => CONCERN_BY[c]).filter(Boolean);
  const pairs = (i.pairsWith || []).map(id => ING_BY[id]).filter(Boolean);
  const avoid = (i.avoidWith || []).map(id => ING_BY[id]).filter(Boolean);
  const url = `${SITE}/guide/kb/ingredient/${i.id}.html`;
  const body = `<p class="lead">${esc(i.explainer || '')}</p>
    <h2>What ${esc(i.name)} does for your skin</h2><ul>${(i.benefits || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    ${concerns.length ? `<h2>Best for</h2><div>${concerns.map(c => `<a class="pill" href="../concern/${c.id}.html">${c.emoji || ''} ${esc(c.name)}</a>`).join('')}</div>` : ''}
    ${pairs.length ? `<h2>Pairs well with</h2><div>${pairs.map(p => `<a class="pill" href="${p.id}.html">${p.emoji || ''} ${esc(p.name)}</a>`).join('')}</div>` : ''}
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
  emit(`concern/${c.id}.html`, shell({ url, depth: 3, crumb: 'Concerns', emoji: c.emoji, h1: `Korean skincare for ${c.name.toLowerCase()}`, title: `K-beauty for ${c.name} — ingredients, routine & what to avoid`, desc: c.desc, bodyHtml: body, related, ld: [artLD(`Korean skincare for ${c.name}`, c.desc, url), faqLD(`What Korean ingredients help with ${c.name.toLowerCase()}?`, look.map(i => i.name).join(', '))] }), '0.7');
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
    emit(`ingredient/${i.id}-for-${c.id}.html`, shell({ url, depth: 3, crumb: 'Ingredients', emoji: i.emoji, h1: `${i.name} for ${c.name.toLowerCase()}`, title: `${i.name} for ${c.name} — does it work?`, desc: `${i.name} for ${c.name.toLowerCase()}: ${(i.benefits || [])[0] || ''}`, bodyHtml: body, ld: [faqLD(`Is ${i.name} good for ${c.name.toLowerCase()}?`, (i.benefits || []).join(' '))] }), '0.6');
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
  emit(`mix/${[aId, bId].sort().join('-')}.html`, shell({ url, depth: 3, crumb: 'Mixing', emoji: '🧪', h1: `Can I use ${a.name} and ${b.name} together?`, title: `${a.name} + ${b.name}: can you mix them?`, desc: reason, bodyHtml: body, ld: [faqLD(`Can I use ${a.name} and ${b.name} together?`, reason)] }), '0.6');
  mixCount++;
}
CONFLICTS.forEach(cf => mixPage(cf.a, cf.b, cf.verdict, cf.reason));
ING.forEach(i => (i.pairsWith || []).forEach(pid => mixPage(i.id, pid, 'safe', `${i.name} and ${ING_BY[pid] ? ING_BY[pid].name : pid} layer well together — a common, complementary K-beauty pairing. Apply thinnest to thickest and give each a moment to absorb.`)));

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
  emit(`dupe/${dp.id}.html`, shell({ url, depth: 3, crumb: 'Dupes', emoji: dp.referenceEmoji || '💸', h1: `${dp.altName || 'Korean dupe'} — a K-beauty alternative to ${dp.reference}`, title: `Korean dupe for ${dp.reference}`, desc: dp.whyComparable, bodyHtml: body, ld: dupeLd }), '0.6');
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
  const url = `${SITE}/guide/kb/glass-score/index.html`;
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

// ── 7. Glossary terms ───────────────────────────────────────────────────────
GLOSS.forEach((g, idx) => {
  const sg = slug(g.term);
  const url = `${SITE}/guide/kb/term/${sg}.html`;
  const body = `<p class="lead">${esc(g.def || '')}</p>`;
  emit(`term/${sg}.html`, shell({ url, depth: 3, crumb: 'Glossary', emoji: '📖', h1: esc(g.term), ko: g.korean, title: `${g.term} — K-beauty glossary`, desc: g.def, bodyHtml: body, ads: false, ld: [{ '@context': 'https://schema.org', '@type': 'DefinedTerm', name: g.term, description: g.def, inDefinedTermSet: `${SITE}/guide/kb/` }] }), '0.5');
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
    emit(`routine/${st.id}-${c.id}.html`, shell({ url, depth: 3, crumb: 'Routines', emoji: '🧴', h1: `${st.name} skin + ${c.name.toLowerCase()}: Korean routine`, title: `Korean routine for ${st.name.toLowerCase()} skin with ${c.name.toLowerCase()}`, desc: `K-beauty routine for ${st.name.toLowerCase()} skin and ${c.name.toLowerCase()}.`, bodyHtml: body, ld: [artLD(`${st.name} skin + ${c.name} routine`, st.desc, url)] }), '0.6');
    rtCount++;
  });
});

// ── 9. Trend/viral verdict pages (folded in from build-kbeauty-seo) ─────────
const verdLabel = id => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? v.label : id; };
const verdEmoji = id => { const v = (d.KBEAUTY_BOARD_CONFIG.verdicts || {})[id]; return v ? v.emoji : ''; };
const trendById = Object.fromEntries((d.KBEAUTY_TRENDS || []).map(t => [t.id, t]));
const citeOf = id => (d.KBEAUTY_CITATIONS || {})[id] || null;
const verdItems = [];
(d.KBEAUTY_RADAR.items || []).forEach(it => { const tr = trendById[it.id]; verdItems.push({ slug: it.id, h1: `${it.label}: does it actually work?`, label: it.label, emoji: it.emoji, verdict: it.verdict, summary: it.blurb, answer: it.science, cite: tr && tr.cite ? citeOf(tr.cite) : null }); });
(d.KBEAUTY_VIRALCHECK.items || []).forEach(it => { verdItems.push({ slug: 'viral-' + it.id, h1: `${it.label}: viral claim vs the evidence`, label: it.label, emoji: it.emoji, verdict: it.verdict, summary: 'Viral claim: "' + it.claim + '"', answer: it.science + (it.note ? ' ' + it.note : ''), cite: null }); });
verdItems.forEach((it, i) => {
  const url = `${SITE}/guide/kb/${it.slug}.html`;
  const body = `<p><span class="vb">${verdEmoji(it.verdict)} ${esc(verdLabel(it.verdict))}</span></p>
    <p class="lead"><i>${esc(it.summary)}</i></p>
    <div class="box">${esc(it.answer)}</div>
    ${it.cite ? `<p style="font-size:13px;color:#666">Evidence: <a href="${esc(it.cite.url)}" rel="nofollow noopener" target="_blank">${esc(it.cite.label)} ↗</a></p>` : ''}
    ${deeperBlock(it)}`;
  const rel = [verdItems[(i + 1) % verdItems.length], verdItems[(i + 2) % verdItems.length], verdItems[(i + 3) % verdItems.length]].map(r => `<a href="${r.slug}.html">${r.emoji || '•'} ${esc(r.h1)}</a>`).join('');
  fs.writeFileSync(path.join(OUT, it.slug + '.html'), shell({ url, depth: 2, crumb: 'Trend verdicts', emoji: it.emoji, h1: it.h1, title: `Does ${it.label} actually work? — K-beauty verdict`, desc: it.answer, bodyHtml: body, related: rel, ld: [faqLD(`Does ${it.label} actually work?`, `${verdLabel(it.verdict)}. ${it.answer}`), { '@context': 'https://schema.org', '@type': 'WebPage', speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.box'] }, url }] }));
  sitemapUrls.push({ loc: url, prio: '0.7' }); written.push(it.slug + '.html');
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
  emit(`inci/${e.slug}.html`, shell({ url, depth: 3, crumb: 'INCI decoder', emoji: info[1], h1: `${e.name}: what it is in skincare`, title: `${e.name} in skincare — what it does, safety`, desc: e.desc.slice(0, 155), bodyHtml: body, related: peers, ld: [{ '@context': 'https://schema.org', '@type': 'DefinedTerm', name: e.name, description: e.desc, inDefinedTermSet: `${SITE}/guide/kb/inci-class/${e.base}.html` }, faqLD(`What is ${e.name} in skincare?`, e.desc)] }), '0.5');
});
const inciHubLinks = Object.keys(byBase).map(base => { const info = FN_INFO[base] || FN_INFO.other; return `<a href="inci-class/${base}.html">${info[1]} ${esc(info[0])}</a>`; });

// ── 12. Product categories + category×concern + category×skintype + skintype hubs ──
const CATS_ITEMS = (d.KBEAUTY_CATEGORIES && d.KBEAUTY_CATEGORIES.items) || [];
const TREAT = new Set(['toner', 'essence', 'serum', 'ampoule', 'emulsion', 'cream']);
const ST_CONCERNS = { dry: ['dryness', 'dullness'], oily: ['oiliness', 'acne', 'pores'], combination: ['pores', 'oiliness', 'dryness'], sensitive: ['redness', 'dryness'], normal: ['dullness', 'aging'] };
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
  emit(`category/${ci.id}.html`, shell({ url, depth: 3, crumb: 'Product types', emoji: ci.emoji, h1: `Korean ${ci.name}: what it is & do you need it`, ko: ci.korean, title: `Korean ${ci.name} — what it does & how to use`, desc: ci.job, bodyHtml: body, ld: [artLD(`Korean ${ci.name}`, ci.job, url), faqLD(`What is a Korean ${ci.name.toLowerCase()}?`, ci.job)] }), '0.6');
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
    emit(`category/${ci.id}-for-${c.id}.html`, shell({ url, depth: 3, crumb: 'Product types', emoji: ci.emoji, h1: `Best Korean ${ci.name.toLowerCase()} for ${c.name.toLowerCase()}`, title: `Korean ${ci.name.toLowerCase()} for ${c.name.toLowerCase()} — what to look for`, desc: `Choosing a Korean ${ci.name.toLowerCase()} for ${c.name.toLowerCase()}: ${look.map(i => i.name).slice(0, 3).join(', ')}.`, bodyHtml: body, ld: [faqLD(`What Korean ${ci.name.toLowerCase()} is best for ${c.name.toLowerCase()}?`, look.map(i => i.name).join(', '))] }), '0.5');
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
    emit(`category/${ci.id}-for-${s.id}-skin.html`, shell({ url, depth: 3, crumb: 'Product types', emoji: ci.emoji, h1: `Best Korean ${ci.name.toLowerCase()} for ${s.name.toLowerCase()} skin`, title: `Korean ${ci.name.toLowerCase()} for ${s.name.toLowerCase()} skin`, desc: `Choosing a Korean ${ci.name.toLowerCase()} for ${s.name.toLowerCase()} skin.`, bodyHtml: body, ld: [artLD(`Korean ${ci.name} for ${s.name} skin`, ci.job, url)] }), '0.5');
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
  emit(`seasonal/${se.id}.html`, shell({ url: hubUrl, depth: 3, crumb: 'Seasonal routines', emoji: se.emoji, h1: `Korean ${se.name.toLowerCase()} skincare guide`, title: `Korean ${se.name.toLowerCase()} skincare — the seasonal guide`, desc: se.note, bodyHtml: hubBody, ld: [artLD(`Korean ${se.name} skincare guide`, se.note, hubUrl)] }), '0.6');
  seasCount++;
  SKINTYPES.forEach(s => {
    const url = `${SITE}/guide/kb/seasonal/${se.id}-${s.id}-skin.html`;
    const body = `<p class="lead">A Korean <b>${esc(se.name.toLowerCase())}</b> skincare routine for <b>${esc(s.name.toLowerCase())} skin</b>.</p>
      <p>${esc(se.note)}</p><p>${esc(s.desc || '')}</p>
      <h2>${esc(se.name)} adjustments</h2><ul><li>Match texture to the weather — lighter in heat, richer in cold.</li><li>Never skip morning SPF, year-round.</li><li>Introduce or pull back actives gradually as your skin reacts to the season.</li></ul>
      <p><a href="${SITE}/guide/kb/skin-type/${s.id}.html">${esc(s.name)} skin guide →</a> · <a href="${SITE}/kbeauty">Build your routine free →</a></p>`;
    emit(`seasonal/${se.id}-${s.id}-skin.html`, shell({ url, depth: 3, crumb: 'Seasonal routines', emoji: se.emoji, h1: `Korean ${se.name.toLowerCase()} skincare for ${s.name.toLowerCase()} skin`, title: `${se.name} Korean routine for ${s.name.toLowerCase()} skin`, desc: `Korean ${se.name.toLowerCase()} skincare for ${s.name.toLowerCase()} skin: ${se.note.slice(0, 90)}`, bodyHtml: body, ld: [artLD(`Korean ${se.name} routine for ${s.name} skin`, se.note, url)] }), '0.5');
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
    emit(`seasonal/${se.id}-${c.id}.html`, shell({ url, depth: 3, crumb: 'Seasonal routines', emoji: se.emoji, h1: `${se.name} K-beauty for ${c.name.toLowerCase()}`, title: `Korean ${se.name.toLowerCase()} skincare for ${c.name.toLowerCase()}`, desc: `Managing ${c.name.toLowerCase()} in ${se.name.toLowerCase()} with K-beauty.`, bodyHtml: body, ld: [artLD(`${se.name} K-beauty for ${c.name}`, c.desc, url)] }), '0.5');
    seasCount++;
  });
});

// ── 14. Ingredient × skin-type (gated via skin-type→concern mapping) ─────────
let isCount = 0;
SKINTYPES.forEach(s => {
  const ids = [...new Set((ST_CONCERNS[s.id] || []).flatMap(cid => (CONCERN_BY[cid] && CONCERN_BY[cid].lookFor) || []))];
  ids.map(id => ING_BY[id]).filter(Boolean).forEach(i => {
    const url = `${SITE}/guide/kb/ingredient/${i.id}-for-${s.id}-skin.html`;
    const body = `<p class="lead">Is <b>${esc(i.name)}</b> good for <b>${esc(s.name.toLowerCase())} skin</b>?</p>
      <p>${esc(i.explainer || '')}</p>
      <h2>Why it suits ${esc(s.name.toLowerCase())} skin</h2><ul>${(i.benefits || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="box">💡 <b>How to use:</b> ${esc((i.time || 'both').toUpperCase())} · patch-test and introduce gradually.</div>
      <p><a href="${SITE}/guide/kb/ingredient/${i.id}.html">Full ${esc(i.name)} guide →</a> · <a href="${SITE}/guide/kb/skin-type/${s.id}.html">${esc(s.name)} skin guide →</a></p>`;
    emit(`ingredient/${i.id}-for-${s.id}-skin.html`, shell({ url, depth: 3, crumb: 'Ingredients', emoji: i.emoji, h1: `${i.name} for ${s.name.toLowerCase()} skin`, title: `${i.name} for ${s.name.toLowerCase()} skin — does it suit it?`, desc: `${i.name} for ${s.name.toLowerCase()} skin: ${(i.benefits || [])[0] || ''}`, bodyHtml: body, ld: [faqLD(`Is ${i.name} good for ${s.name.toLowerCase()} skin?`, (i.benefits || []).join(' '))] }), '0.5');
    isCount++;
  });
});

// ── 15. Per-language SEO content (8 languages × canonical topics, hreflang clusters) ──
const I18N_FILE = path.join(__dirname, 'kbeauty-i18n.json');
const I18N_HL = { ko: 'ko', ja: 'ja', zh: 'zh-CN', es: 'es', fr: 'fr', de: 'de', pt: 'pt-BR', id: 'id' };
let i18nCount = 0;
if (fs.existsSync(I18N_FILE)) {
  const data = JSON.parse(fs.readFileSync(I18N_FILE, 'utf8'));
  const langs = data.languages || [];
  const topicLangs = {};
  langs.forEach(L => (L.items || []).forEach(it => { (topicLangs[it.topicKey] = topicLangs[it.topicKey] || []).push(L.lang); }));
  langs.forEach(L => {
    const lc = L.lang;
    (L.items || []).forEach(it => {
      const tk = slug(it.topicKey);
      const url = `${SITE}/guide/kb/${lc}/${tk}.html`;
      const alt = (topicLangs[it.topicKey] || []).map(l => `<link rel="alternate" hreflang="${I18N_HL[l] || l}" href="${SITE}/guide/kb/${l}/${tk}.html">`).join('') + `<link rel="alternate" hreflang="x-default" href="${HUB}">`;
      const sections = (it.sections || []).map(s => `<h2>${esc(s.h)}</h2><p>${esc(s.body)}</p>`).join('');
      const facts = (it.keyFacts || []).length ? `<div class="box"><ul>${it.keyFacts.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : '';
      const faqHtml = (it.faq || []).length ? `<h2>FAQ</h2>` + it.faq.map(f => `<details class="kb-faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('') : '';
      const cites = (it.citations || []).length ? `<h2>Sources</h2><ul>${it.citations.map(c => `<li><a href="${esc(c.url)}" rel="nofollow noopener" target="_blank">${esc(c.label)} ↗</a></li>`).join('')}</ul>` : '';
      const sib = (topicLangs[it.topicKey] || []).filter(l => l !== lc).map(l => `<a href="${SITE}/guide/kb/${l}/${tk}.html">${l.toUpperCase()}</a>`).join(' · ');
      const peers = (L.items || []).filter(x => x.topicKey !== it.topicKey).slice(0, 6).map(p => `<a href="${slug(p.topicKey)}.html">${esc(p.h1)}</a>`).join('');
      const body = `<p class="lead">${esc(it.lead || '')}</p>${sections}${facts}${faqHtml}${cites}${sib ? `<p style="font-size:12px;color:#999;margin-top:14px">🌐 ${sib}</p>` : ''}`;
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
const LANG_NAMES = { ko: '한국어', ja: '日本語', zh: '简体中文', es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português', id: 'Bahasa Indonesia' };
const byDir = {};
INDEX.forEach(p => { (byDir[p.dir] = byDir[p.dir] || []).push(p); });

// 1) English-library category hubs → /guide/kb/<dir>/index.html
Object.keys(HUB_META).forEach(dir => {
  const pages = (byDir[dir] || []).slice().sort((a, b) => a.title.localeCompare(b.title));
  if (!pages.length) return;
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
  const body = LG_ORDER.filter(g => groups[g]).map(g => `<h2>${g}</h2><div class="rel">${groups[g].sort((a, b) => a.title.localeCompare(b.title)).map(p => `<a href="${p.rel.slice(lc.length + 1)}">${esc(p.title)}</a>`).join('')}</div>`).join('');
  emit(`${lc}/index.html`, shell({ url: `${SITE}/guide/kb/${lc}/`, depth: 2, lang: lc, crumb: LANG_NAMES[lc], emoji: '🌐', h1: `K-Beauty — ${LANG_NAMES[lc]}`, title: `K-Beauty ${LANG_NAMES[lc]} — ${pages.length} guides`, desc: `${pages.length} K-beauty guides in ${LANG_NAMES[lc]}.`, bodyHtml: `<p class="lead">${pages.length} guides.</p>${body}`, ads: false }), '0.7');
});

// 3) Top-level library index → /guide/kb/index.html (category tiles + language tiles + verdicts)
const hubCard = (href, e, t, n) => `<a class="kbhub-card" href="${href}"><div class="he">${e}</div><div class="ht">${esc(t)}</div><div class="hn">${n} guides</div></a>`;
const groups = {};
Object.keys(HUB_META).forEach(dir => { if (!(byDir[dir] || []).length) return; const m = HUB_META[dir]; (groups[m.g] = groups[m.g] || []).push(hubCard(`${dir}/`, m.e, m.t, (byDir[dir] || []).length)); });
const GROUP_ORDER = ['Ingredients & INCI', 'Brands & products', 'Skin & routines', 'K-beauty knowledge', 'Reference'];
let mainBody = `<p class="lead">Everything K-beauty, organized — drill into a category to reach every guide. ${INDEX.length}+ pages across 9 languages.</p>`;
GROUP_ORDER.forEach(g => { if (groups[g]) mainBody += `<div class="kbhub-sec">${g}</div><div class="kbhub-grid">${groups[g].join('')}</div>`; });
mainBody += `<div class="kbhub-sec">🌐 In your language</div><div class="kbhub-grid">` + Object.keys(LANG_NAMES).map(lc => (byDir[lc] || []).length ? hubCard(`${lc}/`, '🌐', LANG_NAMES[lc], (byDir[lc] || []).length) : '').join('') + `</div>`;
if ((byDir._root || []).length) mainBody += `<div class="kbhub-sec">⚖️ Trend verdicts</div><div class="rel">` + byDir._root.slice().sort((a, b) => a.title.localeCompare(b.title)).map(p => `<a href="${p.rel}">${esc(p.title)}</a>`).join('') + `</div>`;
fs.writeFileSync(path.join(OUT, 'index.html'), shell({ url: `${SITE}/guide/kb/`, depth: 1, h1: 'The K-Beauty Library', emoji: '📚', title: 'K-Beauty Library — ingredients, brands, companies & guides in 9 languages', desc: 'The complete K-beauty knowledge library — ingredients, brands, company analyses, routines, dupes & FAQs in 9 languages. Browse by category.', bodyHtml: mainBody, ads: false }));
sitemapUrls.push({ loc: `${SITE}/guide/kb/`, prio: '0.9' });

// ── Consolidated sitemap (hub 9-lang + every page) ──────────────────────────
const ALT = [['x-default', ''], ['en', ''], ['ko', '?lang=ko'], ['ja', '?lang=ja'], ['zh-CN', '?lang=zh'], ['es', '?lang=es'], ['fr', '?lang=fr'], ['de', '?lang=de'], ['pt-BR', '?lang=pt'], ['id', '?lang=id']];
const alts = ALT.map(([hl, q]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${HUB}${q}"/>`).join('\n');
const hubVariants = ['', '?lang=ko', '?lang=ja', '?lang=zh', '?lang=es', '?lang=fr', '?lang=de', '?lang=pt', '?lang=id'];
const hubXml = hubVariants.map(q => `  <url>\n    <loc>${HUB}${q}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${q ? '0.8' : '0.9'}</priority>\n${alts}\n  </url>`).join('\n');
const pageXml = sitemapUrls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u.prio}</priority>\n  </url>`).join('\n');
fs.writeFileSync(path.join(__dirname, 'kbeauty-sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${hubXml}\n${pageXml}\n</urlset>\n`);

console.log(`pages written: ${written.length} (ingredient ${ING.length}, ix${icCount}, brand ${BRANDS.length}, concern ${CONCERNS.length}, mix ${mixCount}, dupe ${DUPES.length}, gloss ${GLOSS.length}, routine ${rtCount}) + index`);
console.log(`sitemap urls: ${sitemapUrls.length + hubVariants.length} (hub ${hubVariants.length} + pages ${sitemapUrls.length})`);
