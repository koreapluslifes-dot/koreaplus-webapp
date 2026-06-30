/* ══════════════════════════════════════════════════════════════════
   modules/seo-budgettool.cjs — T07 generator: Korea travel budget tools.

   Produces, in every language that has translations (9 build langs):
     • /guide/tools/korea-budget-converter.html   (indexed, via ctx.shell)
     • /guide/tools/trip-cost-calculator.html      (indexed, via ctx.shell)
     • /guide/embed/korea-budget-converter.html     (no-ads, noindex)
     • /guide/embed/trip-cost-calculator.html        (no-ads, noindex)

   Numbers are NOT fabricated: the page reuses the frozen COST_INDEX 3-tier
   daily budgets + itemized prices (ctx.COST_INDEX) and converts them at
   LIVE exchange rates fetched client-side from /api/exchange (with a
   clearly-labelled offline fallback). The build emits only the chrome +
   the verified reference data; all currency math happens at runtime, so no
   stale/forecast figures are baked into the HTML.

   CommonJS factory: module.exports = function(ctx){ ... return {urls}; }.
   Only ctx helpers are used — no direct build-seo require.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const { L10N, CURRENCIES, FALLBACK_RATES } = require('./seo-budgettool-l10n.js');

// Live-FX worker origin (same host the rest of the app calls for /api/*;
// see widget.js / currency.html). Pages preconnect to it already.
const WORKER = 'https://koreaplus-webapp.jeybeeicon.workers.dev';

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N: BL10N, LOCALES, esc, COST_INDEX, TODAY, ld } = ctx;
  const ORIGIN = (ld && ld.abs) ? ld.abs('/', undefined).replace(/\/$/, '') : 'https://koreaplus-lifes.com';

  // All build languages (en + the 8 locales). A language is only emitted
  // when L10N has a block for it (all 9 are present here).
  const LANGS = ['en', ...LOCALES].filter(l => L10N[l]);

  // The two tools. `slug` is the path segment under /guide/.
  const TOOLS = [
    { id: 'converter',  slug: 'korea-budget-converter', tkey: 'cv' },
    { id: 'calculator', slug: 'trip-cost-calculator',   tkey: 'cc' },
  ];

  // dir prefix for a language ('' for en, 'ja/' etc otherwise).
  const dirOf = lang => (lang === 'en' ? '' : BL10N[lang].dir + '/');

  // Reference data lifted from the frozen COST_INDEX (objective, verified).
  // tiers: [{k,usd,krw}]   items: [[icon, krwRangeStr]]  (paired with itemN)
  const TIERS = COST_INDEX.styles.map(s => ({ k: s.k, usd: s.usd, krw: s.krw }));
  const ITEMS = COST_INDEX.items.map(([icon, , krw]) => [icon, krw]); // drop the itemN index + usd col

  // Build the client config blob for a given language (inlined as JSON).
  function cfgFor(lang) {
    const T = L10N[lang];
    return {
      worker: WORKER,
      currencies: CURRENCIES,
      fallback: FALLBACK_RATES,
      tiers: TIERS,
      items: ITEMS,
      itemN: T.itemN,
      curN: T.curN,
      t: {
        cv: { shareB: T.cv.shareB, sharedMsg: T.cv.sharedMsg },
        styleN: T.styleN,
        updated: T.updated,
        offline: T.offline,
        day: T.day,
        days: T.days,
      },
    };
  }

  // Shared <style> + config + script tags (scriptSrc differs page vs embed).
  function assets(lang, scriptSrc) {
    const cfg = JSON.stringify(cfgFor(lang)).replace(/</g, '\\u003c');
    return `<style>
.kpbt{max-width:620px;margin:0 auto}
.kpbt-card{background:var(--card,rgba(255,255,255,.04));border:1px solid var(--border,rgba(255,255,255,.09));border-radius:14px;padding:16px 16px 18px;margin:14px 0}
.kpbt-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
.kpbt-field{flex:1 1 140px;min-width:120px}
.kpbt-field label{display:block;font-size:12px;color:var(--text2,#9fb0c3);font-weight:700;letter-spacing:.03em;margin-bottom:5px}
.kpbt-input,.kpbt-select{width:100%;box-sizing:border-box;background:var(--bg2,rgba(0,0,0,.25));color:inherit;border:1px solid var(--border,rgba(255,255,255,.14));border-radius:10px;padding:11px 12px;font-size:16px;font-weight:700}
.kpbt-out{font-size:30px;font-weight:900;margin:10px 0 2px;line-height:1.15}
.kpbt-sub{font-size:14px;color:var(--text2,#9fb0c3);font-weight:700}
.kpbt-note{font-size:12.5px;color:var(--text3,#7c8aa0);margin:6px 0 0}
.kpbt-table{width:100%;border-collapse:collapse;margin:6px 0 4px;font-size:14.5px}
.kpbt-table th,.kpbt-table td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--border,rgba(255,255,255,.08))}
.kpbt-table th{color:var(--text2,#9fb0c3);font-size:11.5px;text-transform:uppercase;letter-spacing:.04em}
.kpbt-num{text-align:right;font-weight:700;white-space:nowrap}
.kpbt-chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 2px}
.kpbt-chip{background:var(--bg2,rgba(0,0,0,.22));border:1px solid var(--border,rgba(255,255,255,.1));border-radius:999px;padding:6px 12px;font-size:13.5px;font-weight:700}
.kpbt-chip b{color:var(--accent,#6ea8ff)}
.kpbt-slider{width:100%}
.kpbt-btn{display:inline-block;background:var(--accent,#2563eb);color:#fff;border:0;border-radius:10px;padding:10px 16px;font-size:14px;font-weight:800;cursor:pointer}
.kpbt-styles{display:flex;flex-direction:column;gap:8px;margin:4px 0}
.kpbt-styles label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;font-weight:700;font-size:14.5px}
.kpbt-styles small{display:block;font-weight:500;color:var(--text2,#9fb0c3);font-size:12.5px;margin-top:2px}
</style>
<script type="application/json" id="kpbt-cfg">${cfg}</script>
<script defer src="${scriptSrc}"></script>`;
  }

  // ── Converter body ─────────────────────────────────────────────────
  function converterBody(lang, T) {
    const C = T.cv;
    return `<div class="kpbt">
<div class="kpbt-card">
  <div class="kpbt-row">
    <div class="kpbt-field"><label for="amount">${esc(C.amountL)}</label><input class="kpbt-input" id="amount" type="number" inputmode="decimal" min="0" step="any" value="1000" aria-label="${esc(C.amountL)}"></div>
    <div class="kpbt-field"><label for="cur">${esc(C.curL)}</label><select class="kpbt-select" id="cur" aria-label="${esc(C.curL)}"></select></div>
  </div>
  <div class="kpbt-out" id="krwOut">—</div>
  <div class="kpbt-sub" id="rateOut" data-role="rate">${esc(C.rateL)}</div>
  <p style="margin:12px 0 0"><button type="button" class="kpbt-btn" id="share">${esc(C.shareB)}</button></p>
</div>
<h2>${esc(C.buysH)}</h2>
<table class="kpbt-table"><thead><tr><th>${esc(T.th[0])}</th><th class="kpbt-num">${esc(T.th[1])}</th><th class="kpbt-num">≈</th></tr></thead><tbody id="buysTbody"></tbody></table>
<h2>${esc(C.styleH)}</h2>
<div class="kpbt-chips" id="daysOut"></div>
<p class="kpbt-note">${esc(C.perDayNote)}</p>
</div>`;
  }

  // ── Calculator body ────────────────────────────────────────────────
  function calculatorBody(lang, T) {
    const C = T.cc;
    const styleOpts = TIERS.map(tr => `<label><input type="radio" name="cstyle-r" value="${esc(tr.k)}"${tr.k === 'midrange' ? ' checked' : ''}><span>${esc(T.styleN[tr.k])} · $${tr.usd}${esc(T.perDay)}<small>${esc(T.styleDesc[tr.k])}</small></span></label>`).join('');
    return `<div class="kpbt">
<div class="kpbt-card">
  <div class="kpbt-field"><label>${esc(C.styleL)}</label>
    <div class="kpbt-styles" id="cstyle-wrap">${styleOpts}</div>
    <input type="hidden" id="cstyle" value="midrange">
  </div>
  <div class="kpbt-row" style="margin-top:6px">
    <div class="kpbt-field"><label for="cdays">${esc(C.daysL)}: <b id="cdaysOut">5</b></label><input class="kpbt-slider" id="cdays" type="range" min="1" max="30" value="5" aria-label="${esc(C.daysL)}"></div>
    <div class="kpbt-field"><label for="cpeople">${esc(C.peopleL)}: <b id="cpeopleOut">2</b></label><input class="kpbt-slider" id="cpeople" type="range" min="1" max="12" value="2" aria-label="${esc(C.peopleL)}"></div>
  </div>
  <div class="kpbt-field" style="margin-top:8px"><label for="ccur">${esc(C.curL)}</label><select class="kpbt-select" id="ccur" aria-label="${esc(C.curL)}"></select></div>
</div>
<div class="kpbt-row">
  <div class="kpbt-card kpbt-field" style="flex:1 1 200px">
    <div class="kpbt-sub">${esc(C.perDayH)} · 1 ${esc(C.perPersonH)}</div>
    <div class="kpbt-out" id="perDayOut">—</div>
    <div class="kpbt-sub" id="perDayCur"></div>
  </div>
  <div class="kpbt-card kpbt-field" style="flex:1 1 200px">
    <div class="kpbt-sub">${esc(C.totalH)}</div>
    <div class="kpbt-out" id="totalOut">—</div>
    <div class="kpbt-sub" id="totalCur"></div>
  </div>
</div>
<h2>${esc(C.breakdownH)}</h2>
<table class="kpbt-table"><thead><tr><th>${esc(T.th[0])}</th><th class="kpbt-num">${esc(T.th[1])}</th><th class="kpbt-num">${esc(T.th[2])}</th></tr></thead><tbody id="brkTbody"></tbody></table>
<p class="kpbt-note">${esc(C.note)}</p>
<script>(function(){var w=document.getElementById('cstyle-wrap'),h=document.getElementById('cstyle');if(!w||!h)return;w.addEventListener('change',function(e){if(e.target&&e.target.name==='cstyle-r'){h.value=e.target.value;h.dispatchEvent(new Event('change',{bubbles:true}));}});})();</script>
</div>`;
  }

  // hreflang alternates for a given tool across all built languages.
  function altsFor(slug, isTool) {
    const seg = isTool ? 'tools' : 'embed';
    return LANGS.map(l => ({ lang: l, url: `${BASEP}${dirOf(l)}${seg}/${slug}.html` }));
  }

  // ── full (indexed) tool page via ctx.shell ─────────────────────────
  function buildTool(tool, lang) {
    const T = L10N[lang]; if (!T) return null;
    const C = T[tool.tkey];
    const dir = dirOf(lang);
    const rel = `guide/${dir}tools/${tool.slug}.html`;
    const url = `${BASEP}${dir}tools/${tool.slug}.html`;
    const alts = altsFor(tool.slug, true);

    const trail = [
      { name: T.home, url: BASEP },
      { name: T.tools, url: `${BASEP}${dir}tools/` },
      { name: C.h1, url },
    ];
    const body = ctx.bcHtml(trail)
      + assets(lang, 'modules/kp-tool-budget.js')
      + `<div id="kpbt-root">`
      + `<p class="lead">${esc(C.lead)}</p>`
      + (tool.id === 'converter' ? converterBody(lang, T) : calculatorBody(lang, T))
      + `</div>`
      + ctaBlock(lang, T)
      + faqBlock(lang, T)
      + embedBlock(lang, T, tool);

    // Schemas: a WebApplication entity (verified — it is a free browser tool)
    // + breadcrumb + FAQ. No fabricated ratings/prices.
    const appLD = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: C.h1,
      url: ORIGIN + url,
      description: C.desc,
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
      inLanguage: lang,
      publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', url: ORIGIN + BASEP },
    };
    const schemas = [appLD, ld.breadcrumbLD(trail), ld.faqLD(T.faq)].filter(Boolean);

    const hero = `<header class="seo-hero"><h1>${esc(C.h1)}</h1></header>`;
    writePage(rel, shell({
      url, title: C.title, desc: C.desc, keywords: '',
      schemas, hero, body, lang, alts,
    }));
    return url;
  }

  // CTA → Klook (affiliate) via ctx.affBlock so it stays consistent + safe.
  function ctaBlock(lang, T) {
    const aff = ctx.affBlock ? ctx.affBlock({ city: 'Seoul', cat: 'hotel', q: '', lang }) : '';
    return `<div class="seo-cta"><h2>${esc(T.ctaH)}</h2><p>${esc(T.ctaP)}</p></div>${aff}`;
  }

  function faqBlock(lang, T) {
    if (!Array.isArray(T.faq) || !T.faq.length) return '';
    return `<h2>${esc(T.faqH)}</h2><div class="seo-faq">${T.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  }

  // "embed on your site" snippet box (points at the no-ads embed page).
  function embedBlock(lang, T, tool) {
    const dir = dirOf(lang);
    const embedUrl = `${ORIGIN}${BASEP}${dir}embed/${tool.slug}.html`;
    const snippet = `<iframe src="${embedUrl}" width="100%" height="640" style="border:0;max-width:640px" loading="lazy" title="${esc(T[tool.tkey].h1)}"></iframe>`;
    return `<h2>${esc(T.embedH)}</h2><p>${esc(T.embedP)}</p>`
      + `<textarea readonly rows="3" style="width:100%;box-sizing:border-box;font-family:monospace;font-size:12px;padding:10px;border-radius:8px;background:var(--bg2,rgba(0,0,0,.25));color:inherit;border:1px solid var(--border,rgba(255,255,255,.14))" onclick="this.select()">${esc(snippet)}</textarea>`;
  }

  // ── embed (no-ads, noindex) page — raw minimal HTML, no shell ───────
  function buildEmbed(tool, lang) {
    const T = L10N[lang]; if (!T) return null;
    const C = T[tool.tkey];
    const dir = dirOf(lang);
    const rel = `guide/${dir}embed/${tool.slug}.html`;
    // script lives at /guide/modules/... — use an absolute path so the embed
    // works regardless of the host page that frames it.
    const scriptSrc = `${BASEP}modules/kp-tool-budget.js`;
    const inner = `<div id="kpbt-root">`
      + (tool.id === 'converter' ? converterBody(lang, T) : calculatorBody(lang, T))
      + `<p class="kpbt-note" style="text-align:center;margin-top:14px"><a href="${ORIGIN}${BASEP}${dir}tools/${tool.slug}.html" target="_blank" rel="noopener" style="color:var(--accent,#6ea8ff);font-weight:700">KoreaPlus · ${esc(C.h1)} →</a></p>`
      + `</div>`;
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(C.h1)} — KoreaPlus</title>
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>:root{color-scheme:dark}body{margin:0;padding:14px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0c1829;color:#e8eef6;line-height:1.5}h2{font-size:16px;margin:18px 0 8px}.lead{display:none}a{color:#6ea8ff}</style>
${assets(lang, scriptSrc)}
</head>
<body>
${inner}
</body>
</html>`;
    writePage(rel, html);
    return `${BASEP}${dir}embed/${tool.slug}.html`;
  }

  // ── public API ─────────────────────────────────────────────────────
  function urls() {
    const out = [];
    for (const tool of TOOLS) {
      for (const lang of LANGS) {
        const u = buildTool(tool, lang);
        if (u) out.push({ lang, url: u });
        // embeds are intentionally noindex — NOT pushed into the sitemap.
        buildEmbed(tool, lang);
      }
    }
    return out;
  }

  return { buildTool, buildEmbed, urls };
};
