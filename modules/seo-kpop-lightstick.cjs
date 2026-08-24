/* ══════════════════════════════════════════════════════════════════════════
   modules/seo-kpop-lightstick.cjs — K-pop fandom lightstick (응원봉) directory.

   Generates one index page + one page per group that has a VERIFIED official
   lightstick name in ENRICH (kpop-enrich.js → KPOP_ENRICH[id].lightstick), in
   every channel language that has strings. K-pop channel (homeHref:'/kpop').

   FACTS POLICY (날조 0): the only group-specific claims are the lightstick name
   and the fandom name — both pulled straight from the frozen, verified
   ROSTER/ENRICH source data. Group meta (agency/debut/type/members) is joined
   from ROSTER by `id`. No subjective ranking, no fabricated dates, no scraping.

   Contract: factory takes the single frozen CTX object; never requires build-seo
   helpers directly. urls() returns [{lang,url},...] for the sitemap gate.

   Index slug is `kpop-lightsticks-list` (deliberately distinct from any existing
   `kpop-lightstick` slug to avoid collision).
   ══════════════════════════════════════════════════════════════════════════ */
'use strict';

const L10N_STR = require('../seo-kpop-lightstick-l10n.js');
const chrome = require('./seo-kpop-chrome.cjs');

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, slug, ld, kpopPublicUrl } = ctx;
  const ROSTER = ctx.ROSTER || [];
  const ENRICH = ctx.ENRICH || {};

  // The K-pop channel rolls out locales ahead of the rest of the site, so it
  // has its own list. Tolerate its absence: this cluster must keep building
  // while that file is being introduced.
  let CHANNEL_LANGS;
  try { CHANNEL_LANGS = require('./seo-langs-kpop.cjs'); }
  catch { CHANNEL_LANGS = require('./seo-langs.cjs'); }

  // Renderable languages = those with a complete string set. A locale listed
  // upstream before its translations land would otherwise publish English prose
  // under its own hreflang. altsFor() reads the same constant, so an advertised
  // alternate always has a page behind it.
  const LANGS = CHANNEL_LANGS.filter(l => L10N_STR[l]);
  const ORIGIN = 'https://koreaplus-lifes.com';
  const KPOP_HOME = '/kpop';
  const KPOP_BRAND = '🎤 Korea<span>Plus</span>';
  const INDEX_SLUG = 'kpop-lightsticks-list';

  // ── Build the working set: groups with a non-empty, verified lightstick. ──
  // Join ENRICH (lightstick) with ROSTER (group meta) by id. Skip empties.
  const GROUPS = ROSTER
    .filter(r => r && r.id && ENRICH[r.id] && ENRICH[r.id].lightstick && String(ENRICH[r.id].lightstick).trim())
    .map(r => ({
      id: r.id,
      nameEn: r.nameEn || r.id,
      nameKo: r.nameKo || '',
      lightstick: String(ENRICH[r.id].lightstick).trim(),
      fandom: (r.fandom || '').trim(),
      agency: (r.agency || '').trim(),
      debut: (r.debut || '').trim(),
      type: (r.type || '').trim(),
      gender: (r.gender || '').trim(),
      emoji: r.emoji || '🪄',
      members: Array.isArray(r.members) ? r.members : [],
      wikidataId: r.wikidataId || '',
    }));

  const GROUP_BY_ID = {};
  GROUPS.forEach(g => { GROUP_BY_ID[g.id] = g; });

  // URL helper — honors the L10N dir convention; en has no dir prefix. A
  // missing dir falls back to the bare code, never to '': '' is the English
  // path, so the localized page would overwrite the English one and both
  // would claim the same <loc>.
  function pageUrl(pathLeaf, lang) {
    return kpopPublicUrl(lang, pathLeaf);
  }
  const indexPath = 'kpop-lightsticks-list';
  const groupLeaf = (id) => `kpop-lightstick-${id}`;

  // Strings for one language. No English fallback: the page builders gate on
  // this and emit nothing rather than English text under a foreign hreflang.
  const L = (lang) => L10N_STR[lang];

  // Alternates cluster for a given path-leaf builder (all langs we render).
  function altsFor(leafFn) {
    return LANGS.map(l => ({ lang: l, url: pageUrl(leafFn, l) }));
  }

  function bc(lang, extra) {
    const t = L(lang);
    const trail = [
      { name: t.breadcrumbHome, url: KPOP_HOME },
      { name: t.breadcrumbDir, url: pageUrl(indexPath, lang) },
    ];
    if (extra) trail.push(extra);
    return trail;
  }

  function bcHtmlInline(trail) {
    // Lightweight breadcrumb nav (ctx.bcHtml expects BASEP-relative urls; our
    // KPOP_HOME root '/kpop' is absolute, so render inline to keep it correct).
    const parts = trail.map((t, i) =>
      i < trail.length - 1
        ? `<a href="${esc(t.url)}">${esc(t.name)}</a>`
        : `<span aria-current="page">${esc(t.name)}</span>`
    );
    return `<nav class="seo-breadcrumb" aria-label="Breadcrumb">${parts.join(' <span aria-hidden="true">›</span> ')}</nav>`;
  }

  // ── Index page ──────────────────────────────────────────────────────────
  function buildIndex(lang) {
    const t = L(lang);
    if (!t) return null;
    const url = pageUrl(indexPath, lang);
    const alts = altsFor(indexPath);

    const cards = GROUPS.map(g => {
      const gUrl = pageUrl(groupLeaf(g.id), lang);
      const ko = lang !== 'ko' && g.nameKo ? `<span class="kr" lang="ko"> ${esc(g.nameKo)}</span>` : '';
      return `<a class="seo-card kp-ls-card" href="${esc(gUrl)}">
  <span class="emoji" aria-hidden="true">${g.emoji}</span>
  <span class="kp-ls-name">${esc(g.nameEn)}${ko}</span>
  <span class="kp-ls-stick">🪄 ${esc(g.lightstick)}</span>
  ${g.fandom ? `<span class="seo-badge">${esc(g.fandom)}</span>` : ''}
</a>`;
    }).join('\n');

    const hero = `<header class="seo-hero">
  <span class="emoji" aria-hidden="true">🪄</span>
  <h1>${esc(t.indexH1)}</h1>
  <p class="lead">${esc(t.indexLead)}</p>
  <div class="meta"><span class="seo-badge">${esc(chrome.countTemplate(t.listLabel, lang, GROUPS.length) || `${GROUPS.length} ${t.listLabel}`)}</span></div>
</header>`;

    const body = `
${bcHtmlInline(bc(lang))}
<section class="seo-section">
  <h2>${esc(t.whatIsH)}</h2>
  <p>${esc(t.whatIsP)}</p>
</section>
<section class="seo-grid kp-ls-grid">
${cards}
</section>`;

    // ItemList of all lightstick pages + breadcrumb.
    const items = GROUPS.map(g => ({
      name: `${g.nameEn} — ${g.lightstick}`,
      url: pageUrl(groupLeaf(g.id), lang),
    }));
    const schemas = [
      ld.itemListLD(items, { name: t.indexH1, description: t.indexLead, origin: ORIGIN }),
      ld.breadcrumbLD(bc(lang).map(x => ({ name: x.name, url: x.url })), { origin: ORIGIN }),
    ].filter(Boolean);

    writePage(stripBase(url), shell({
      url, title: t.indexTitle, desc: t.indexDesc, keywords: '',
      schemas, hero, body, lang, alts,
      homeHref: KPOP_HOME, brand: KPOP_BRAND,
    }));
    return url;
  }

  // ── Group page ──────────────────────────────────────────────────────────
  function buildGroup(g, lang) {
    const t = L(lang);
    if (!t) return null;
    const url = pageUrl(groupLeaf(g.id), lang);
    const alts = altsFor(groupLeaf(g.id));

    // `type`/`gender` are English ROSTER enum values, not UI text. Printing them
    // raw put "Boy group" inside an otherwise fully Arabic/Thai/Russian fact
    // strip while the agency pages rendered the same field translated. The
    // localized pair already ships for all 14 languages — use it.
    const typeLabel = chrome.typeLabel(lang, g.type, g.gender);

    const factItems = [];
    factItems.push(`${t.lightstickLabel}: ${g.lightstick}`);
    if (g.fandom) factItems.push(`${t.fandomLabel}: ${g.fandom}`);
    if (g.agency) factItems.push(`${t.agencyLabel}: ${g.agency}`);
    if (g.debut) factItems.push(`${t.debutLabel}: ${chrome.chipDate(lang, g.debut)}`);
    if (typeLabel) factItems.push(`${t.typeLabel}: ${typeLabel}`);
    // Thai counts people with a mandatory classifier (สมาชิก 7 คน); a bare
    // numeral after the person-noun is not a Thai sentence.
    if (g.members.length) factItems.push(`${t.membersLabel}: ${chrome.countPeople(lang, g.members.length)}`);

    const factBox = ctx.keyFactsBox
      ? ctx.keyFactsBox(factItems)
      : `<ul class="seo-keyfacts">${factItems.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;

    const koLine = g.nameKo ? `<div class="kr" lang="ko">${esc(g.nameKo)}</div>` : '';
    const hero = `<header class="seo-hero">
  <span class="emoji" aria-hidden="true">🪄</span>
  <h1>${esc(t.h1(g.nameEn))}</h1>
  ${koLine}
  <div class="meta">
    <span class="seo-badge">🪄 ${esc(g.lightstick)}</span>
    ${g.fandom ? `<span class="seo-badge">${esc(g.fandom)}</span>` : ''}
  </div>
</header>`;

    // Related: up to 6 other lightstick pages.
    const related = GROUPS.filter(x => x.id !== g.id).slice(0, 12);
    const relCards = related.map(x => {
      const xUrl = pageUrl(groupLeaf(x.id), lang);
      return `<a class="seo-card kp-ls-card" href="${esc(xUrl)}">
  <span class="emoji" aria-hidden="true">${x.emoji}</span>
  <span class="kp-ls-name">${esc(x.nameEn)}</span>
  <span class="kp-ls-stick">🪄 ${esc(x.lightstick)}</span>
</a>`;
    }).join('\n');

    const body = `
${bcHtmlInline(bc(lang, { name: g.nameEn, url }))}
${factBox}
<section class="seo-section">
  <h2>${esc(t.aboutH)}</h2>
  <p>${esc(t.aboutP(g.nameEn, g.lightstick, g.fandom))}</p>
</section>
<section class="seo-section">
  <h2>${esc(t.whatIsH)}</h2>
  <p>${esc(t.whatIsP)}</p>
</section>
<section class="seo-section">
  <h2>${esc(t.relatedH)}</h2>
  <div class="seo-grid kp-ls-grid">${relCards}</div>
  <p><a class="seo-btn" href="${esc(pageUrl(indexPath, lang))}">${esc(t.backToIndex)} →</a></p>
</section>`;

    // FAQ: lightstick name (always) + fandom name (only if known).
    const qa = [[t.faqQ1(g.nameEn), t.faqA1(g.nameEn, g.lightstick)]];
    if (g.fandom) qa.push([t.faqQ2(g.nameEn), t.faqA2(g.nameEn, g.fandom)]);

    const wikiSameAs = g.wikidataId ? [`https://www.wikidata.org/wiki/${g.wikidataId}`] : [];
    const schemas = [
      // MusicGroup as the primary entity — members listed by NAME only (no
      // fabricated birthdates here; date-bearing nodes are out of scope).
      ld.musicGroupLD({
        name: g.nameEn,
        alternateName: g.nameKo || undefined,
        foundingDate: g.debut || undefined,
        sameAs: wikiSameAs,
        members: g.members.map(m => ({ name: m })),
        origin: ORIGIN,
      }),
      ld.faqLD(qa),
      ld.breadcrumbLD(bc(lang, { name: g.nameEn, url }).map(x => ({ name: x.name, url: x.url })), { origin: ORIGIN }),
    ].filter(Boolean);

    writePage(stripBase(url), shell({
      url,
      title: t.groupTitle(g.nameEn),
      desc: t.groupDesc(g.nameEn, g.lightstick, g.fandom),
      keywords: '',
      schemas, hero, body, lang, alts,
      homeHref: KPOP_HOME, brand: KPOP_BRAND,
    }));
    return url;
  }

  // writePage expects an OUT(__dirname)-relative path; our `url` is BASEP-
  // prefixed ('/guide/...'). Strip the leading BASEP so the file lands right.
  function stripBase(url) {
    return url.indexOf(BASEP) === 0 ? url.slice(BASEP.length) : url.replace(/^\//, '');
  }

  function urls() {
    const out = [];
    LANGS.forEach(lang => {
      const idx = buildIndex(lang);
      if (idx) out.push({ lang, url: idx });
      GROUPS.forEach(g => {
        const u = buildGroup(g, lang);
        if (u) out.push({ lang, url: u });
      });
    });
    return out;
  }

  return { buildIndex, buildGroup, urls, _groups: GROUPS };
};
