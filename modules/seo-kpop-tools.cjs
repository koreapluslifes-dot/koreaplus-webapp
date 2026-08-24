/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-tools.cjs — module K09: K-pop Idol Birthday & Zodiac
   Matcher (interactive tool + embeddable widget).

   Generates, per language (en + every dir-bearing locale that has strings in
   kpop-tools-l10n.json — currently 14: en/ja/zh/es/ko/fr/de/pt/id/ar/hi/ru/vi/th):
     1. /guide[/<dir>]/tools/kpop-idol-birthday-finder.html  (indexed, ads
        via ctx.shell, full chrome, FAQ + structured data)
     2. /guide[/<dir>]/embed/kpop-idol-birthday-finder.html  (NOINDEX, NO
        ads — a minimal iframe-friendly standalone page, written directly
        so it bypasses the ad/footer chrome that ctx.shell always injects)

   Both pages inline the SAME 191-record idol-birthday dataset (joined from
   ctx.ENRICH bdays + ctx.ROSTER group names) and the active-language string
   bundle, then load modules/kp-tool-idolfinder.js (client IIFE) to do the
   matching, URL-query sharing, navigator.share + clipboard.

   Contract: CTX is the sole dependency. URLs follow
   `${BASEP}${lang==='en'?'':dir+'/'}<path>` (dir never hard-coded — read
   from ctx.L10N[lang].dir). urls() returns every generated {lang,url}
   (tool + embed) — silent-drop is forbidden (verification gate). The embed
   page carries <meta name="robots" content="noindex"> at the page level;
   its URL is still surfaced via urls() so the gate sees it.

   Zero fabrication: every birthday is a verified date already shipped in
   kpop-enrich.js. Sign/zodiac are computed only via ctx.derive (same rules
   as the client), and the solar-year Chinese-zodiac caveat is hedged.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, ROSTER, ENRICH, ld, TODAY, kpopPublicUrl } = ctx;
  const ORIGIN = 'https://koreaplus-lifes.com';

  // Mirrors RTL_LANGS in build-seo.cjs — the embed page is written directly
  // and so never passes through shell(), which is where dir="rtl" is applied.
  const RTL_LANGS = new Set(['ar']);

  // 9 languages: en + the 8 dir-bearing locales present in L10N.
  const LANGS = ['en'].concat(Object.keys(L10N).filter(l => L10N[l] && L10N[l].dir));

  // i18n bundle (server text + strings injected into the client IIFE).
  let I18N = {};
  try {
    I18N = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kpop-tools-l10n.json'), 'utf8'));
  } catch { I18N = {}; }

  // ── dataset: join ENRICH bdays (source of truth) with ROSTER names ──
  // Each record: { n:memberName, g:groupNameEn, b:"YYYY-MM-DD", e:emoji }.
  // A member that appears in two roster entries (e.g. Mark in nct127 &
  // nctdream) is intentionally kept once per group context — the count
  // (191) reflects the shipped member-birthday records, matching the spec.
  const IDOLS = [];
  for (const r of (ROSTER || [])) {
    const en = ENRICH && ENRICH[r.id];
    if (!en || !Array.isArray(en.bdays)) continue;
    const groupName = r.nameEn || r.id;
    const emoji = r.emoji || '🎤';
    for (const tup of en.bdays) {
      if (!Array.isArray(tup) || tup.length < 2) continue;
      const name = tup[0], bday = tup[1];
      if (!name || !ld.isISODate(bday)) continue; // verified ISO only
      IDOLS.push({ n: name, g: groupName, b: bday, e: emoji });
    }
  }
  const IDOL_COUNT = IDOLS.length;
  const GROUP_COUNT = new Set(IDOLS.map(x => x.g)).size;

  const TOOL_PATH = 'tools/kpop-idol-birthday-finder.html';
  const EMBED_PATH = 'embed/kpop-idol-birthday-finder.html';

  function dirOf(lang) { return lang === 'en' ? '' : (L10N[lang].dir + '/'); }
  function urlFor(lang, p) { return `${BASEP}${dirOf(lang)}${p}`; }
  function tr(lang) { return I18N[lang] || I18N.en || {}; }

  // ── counted-noun rendering for the hero badge ───────────────────────
  // Each locale supplies badgeIdols/badgeGroups as an ARRAY of forms with a
  // {n} placeholder. Length 1 = the language has no count-driven morphology
  // (ar collapses via noun-first inversion "عدد النجوم: 191"; hi/vi/th/ja/zh/ko
  // are invariant). Length 2 = English-style one/other. Length 3 = Russian
  // one/few/many, which an `n === 1` ternary gets wrong for 4 of 5 bands.
  function pluralIdx(lang, n, len) {
    if (len <= 1) return 0;
    if (lang === 'ru') {
      const m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return 0;
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return Math.min(1, len - 1);
      return Math.min(2, len - 1);
    }
    return n === 1 ? 0 : Math.min(1, len - 1);
  }
  function countPhrase(lang, forms, n, fallback) {
    if (!Array.isArray(forms) || !forms.length) return fallback;
    const f = forms[pluralIdx(lang, n, forms.length)] || forms[0];
    return String(f).replace(/\{n\}/g, String(n));
  }
  // "191 verified idol birthdays across 34 groups" — real counts, never rounded.
  function countBadge(lang) {
    const t = tr(lang);
    return countPhrase(lang, t.badgeIdols, IDOL_COUNT, `${IDOL_COUNT} idols`) +
      ' · ' + countPhrase(lang, t.badgeGroups, GROUP_COUNT, `${GROUP_COUNT} groups`);
  }

  // hreflang alternates: x-default=en, only languages we actually render.
  function altsFor(lang, p) {
    const langsWith = LANGS.filter(l => I18N[l]); // every lang we have strings for
    if (lang === 'en') {
      return langsWith.filter(l => l !== 'en').map(l => ({ lang: l, url: urlFor(l, p) }));
    }
    const out = [{ lang: 'en', url: urlFor('en', p) }];
    for (const l of langsWith) if (l !== 'en' && l !== lang) out.push({ lang: l, url: urlFor(l, p) });
    return out;
  }

  // Shared inline payload (data + i18n bundle + lang) for both pages.
  function payloadScript(lang, noShare) {
    const t = tr(lang);
    const data = JSON.stringify(IDOLS);
    const bundle = JSON.stringify(t);
    return `<script>window.KP_IDOLS=${data};window.KP_TOOL_I18N=${bundle};window.KP_TOOL_LANG=${JSON.stringify(lang)};${noShare ? 'window.KP_TOOL_NOSHARE=1;' : ''}</script>`;
  }

  // The interactive widget markup (shared by tool + embed). Styles inlined
  // so the embed page is fully self-contained.
  function widgetHtml(lang, opts) {
    opts = opts || {};
    const t = tr(lang);
    const today = TODAY || '';
    return `
<div class="kpf-tool">
  <style>
    .kpf-tool{max-width:680px;margin:0 auto;font-family:Inter,system-ui,-apple-system,"Noto Sans KR",sans-serif}
    .kpf-card{background:var(--card,#16213a);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:16px;padding:20px 18px}
    .kpf-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
    .kpf-field{flex:1 1 200px;display:flex;flex-direction:column;gap:6px}
    .kpf-field label{font-size:13px;font-weight:700;color:var(--text2,#aab)}
    .kpf-field input{font-size:16px;padding:11px 12px;border-radius:10px;border:1px solid var(--border,rgba(255,255,255,.18));background:var(--bg,#0c1829);color:var(--text,#fff)}
    .kpf-btn{font-size:15px;font-weight:800;padding:12px 18px;border-radius:10px;border:0;cursor:pointer;background:linear-gradient(90deg,#74b9ff,#ff6b9d);color:#0c1829}
    .kpf-btn.sec{background:transparent;color:var(--text,#fff);border:1px solid var(--border,rgba(255,255,255,.25))}
    .kpf-result{margin-top:18px}
    .kpf-result[hidden]{display:none}
    .kpf-you{font-size:15px;margin:0 0 10px}
    .kpf-hedge{font-size:13px;color:var(--text2,#cab);background:rgba(255,180,80,.08);border:1px solid rgba(255,180,80,.25);border-radius:10px;padding:8px 12px;margin:0 0 12px}
    .kpf-none{font-size:14px;color:var(--text2,#aab);margin:0 0 12px}
    .kpf-block{margin:0 0 16px}
    .kpf-block h3{font-size:15px;margin:0 0 8px}
    .kpf-n{display:inline-block;font-size:12px;font-weight:800;background:rgba(255,255,255,.1);border-radius:999px;padding:1px 8px;vertical-align:middle}
    .kpf-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
    .kpf-chip{display:flex;flex-direction:column;gap:2px;background:var(--bg,#0c1829);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:10px;padding:9px 11px}
    .kpf-chip .kpf-emoji{font-size:18px}
    .kpf-chip .kpf-name{font-weight:800;font-size:14px}
    .kpf-chip .kpf-grp{font-size:12px;color:var(--text2,#9ab)}
    .kpf-chip .kpf-bd{font-size:11px;color:var(--text3,#789);font-variant-numeric:tabular-nums}
    .kpf-sharebar{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}
    .kpf-sharebar[hidden]{display:none}
    .kpf-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0c1829;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:9px 16px;font-size:13px;font-weight:700;opacity:0;transition:opacity .2s;z-index:9999;pointer-events:none}
    .kpf-toast.on{opacity:1}
    .kpf-foot{font-size:11px;color:var(--text3,#789);margin-top:12px;text-align:center}
  </style>
  <div class="kpf-card">
    <div class="kpf-row">
      <div class="kpf-field">
        <label for="kpf-date">${esc(t.inputLabel || 'Your birthday')}</label>
        <input type="date" id="kpf-date" min="1900-01-01" max="${esc(today)}" autocomplete="bday">
      </div>
      <button type="button" id="kpf-find" class="kpf-btn">${esc(t.btnFind || 'Find matches')}</button>
    </div>
    <div id="kpf-result" class="kpf-result" hidden></div>
    ${opts.noShare ? '' : `<div id="kpf-sharebar" class="kpf-sharebar" hidden>
      <button type="button" id="kpf-share" class="kpf-btn sec">🔗 ${esc(t.btnShare || 'Share')}</button>
      <button type="button" id="kpf-copy" class="kpf-btn sec">📋 ${esc(t.btnCopy || 'Copy link')}</button>
    </div>`}
    <p class="kpf-foot">${esc(t.dataNote || '')}</p>
    ${t.cnForkNote ? `<p class="kpf-foot">${esc(t.cnForkNote)}</p>` : ''}
  </div>
  <div id="kpf-toast" class="kpf-toast" role="status" aria-live="polite" hidden></div>
</div>`;
  }

  // ── TOOL page (indexed, full chrome via ctx.shell, ads on) ──────────
  function buildTool(lang) {
    if (!I18N[lang]) return null; // no translation → skip this language
    const t = tr(lang);
    const url = urlFor(lang, TOOL_PATH);
    const alts = altsFor(lang, TOOL_PATH);

    const embedUrl = urlFor(lang, EMBED_PATH);
    const embedSnippet = `<iframe src="${ORIGIN}${embedUrl}" width="100%" height="640" style="border:0;max-width:680px" loading="lazy" title="${esc(t.title || 'K-pop Idol Matcher')}"></iframe>`;

    const trail = [
      { name: t.bcHome || 'Home', url: '/kpop' },
      { name: t.bcTools || 'K-pop Tools', url: kpopPublicUrl(lang, 'browse') },
      { name: t.title || 'Idol Birthday Matcher', url },
    ];

    const hero = `<header class="seo-hero"><span class="emoji">🎂</span><h1>${esc(t.h1 || t.title)}</h1>` +
      `<div class="meta"><span class="seo-badge">${esc(t.badgeKpop || 'K-Pop')}</span> <span class="seo-badge">${esc(countBadge(lang))}</span></div></header>`;

    let body = ctx.bcHtml(trail);
    body += `<p class="seo-lead">${esc(t.lead || '')}</p>`;
    body += widgetHtml(lang, { noShare: false });
    body += payloadScript(lang, false);
    body += `<script defer src="modules/kp-tool-idolfinder.js"></script>`;

    // How it works
    body += `<h2>${esc(t.howTitle || 'How it works')}</h2><p>${esc(t.howText || '')}</p>`;

    // Embed section
    body += `<h2>${esc(t.embedTitle || 'Embed this tool')}</h2><p>${esc(t.embedText || '')}</p>` +
      `<pre class="kpf-embed-code" style="overflow:auto;background:var(--bg,#0c1829);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:10px;padding:12px;font-size:12px"><code>${esc(embedSnippet)}</code></pre>`;

    // FAQ
    const qa = Array.isArray(t.faq) ? t.faq : [];
    if (qa.length) {
      // Same heading wording the member/agency/month pages use in this
      // language — a bare Latin "FAQ" inside an otherwise native page reads
      // as an unfinished build.
      body += `<h2>${esc(t.faqTitle || 'FAQ')}</h2><div class="seo-faq">`;
      for (const [q, a] of qa) body += `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`;
      body += `</div>`;
    }

    // structured data: WebApplication + breadcrumb + FAQ (all verifiable)
    const appLD = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t.metaTitle || t.title,
      description: t.desc || '',
      url: ORIGIN + url,
      applicationCategory: 'Entertainment',
      operatingSystem: 'Any',
      inLanguage: lang,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      datePublished: ld.isISODate(TODAY) ? TODAY : undefined,
    };
    const schemas = [appLD, ld.breadcrumbLD(trail, { origin: ORIGIN }), ld.faqLD(qa)].filter(Boolean);

    writePage(url.replace(BASEP, ''), shell({
      url, title: t.metaTitle || t.title, desc: t.desc || '', keywords: '',
      schemas, hero, body, lang, alts,
      homeHref: '/kpop', brand: '🎤 Korea<span>Plus</span>',
    }));
    return url;
  }

  // ── EMBED page (NOINDEX, NO ads — minimal standalone HTML) ───────────
  function buildEmbed(lang) {
    if (!I18N[lang]) return null;
    const t = tr(lang);
    const url = urlFor(lang, EMBED_PATH);
    const canonical = ORIGIN + url;
    const html = `<!DOCTYPE html>
<html lang="${esc(lang)}"${RTL_LANGS.has(lang) ? ' dir="rtl"' : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="${BASEP}">
<title>${esc(t.title || 'K-pop Idol Birthday Matcher')}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${canonical}">
<meta name="description" content="${esc(t.desc || '')}">
<style>
  :root{--bg:#0c1829;--card:#16213a;--border:rgba(255,255,255,.12);--text:#fff;--text2:#aab;--text3:#789}
  html,body{margin:0;padding:0;background:transparent;color:var(--text)}
  body{padding:10px;font-family:Inter,system-ui,-apple-system,"Noto Sans KR",sans-serif}
  .kpf-credit{text-align:center;font-size:11px;margin-top:10px}
  .kpf-credit a{color:#74b9ff;text-decoration:none}
</style>
</head>
<body>
${widgetHtml(lang, { noShare: false })}
<p class="kpf-credit"><a href="${ORIGIN}${urlFor(lang, TOOL_PATH)}" target="_blank" rel="noopener">🇰🇷 KoreaPlus — ${esc(t.title || 'K-pop Idol Matcher')}</a></p>
${payloadScript(lang, false)}
<script src="${ORIGIN}${BASEP}modules/kp-tool-idolfinder.js"></script>
</body>
</html>`;
    writePage(url.replace(BASEP, ''), html);
    return url;
  }

  return {
    buildTool,
    buildEmbed,
    // urls(): emit every generated page (tool + embed) per language.
    // Embed URLs are surfaced too (page-level noindex handles exclusion);
    // silent-drop is forbidden so the verification gate sees the full set.
    urls() {
      const out = [];
      for (const lang of LANGS) {
        const tu = buildTool(lang);
        if (tu) out.push({ lang, url: tu });
        const eu = buildEmbed(lang);
        if (eu) out.push({ lang, url: eu });
      }
      return out;
    },
  };
};
