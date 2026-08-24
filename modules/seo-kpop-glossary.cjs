/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-glossary.cjs — K-pop term dictionary (A–Z glossary).

   Produces, per language that has the strings:
     1) ONE A–Z glossary hub  →  kpop/glossary.html
        - scans kpop-history.json for the established "what-is" / term
          articles (via the curated EXISTING headword map in l10n) and
          builds an alphabetised index that links to each full guide.
        - emits ItemList + DefinedTermSet + BreadcrumbList schema.
     2) A small set (~8) of NEWLY-authored universal-term articles
        →  kpop/<term-slug>.html  (same path family as history pages,
        so the existing browse/sibling links keep working).

   Channel: K-Pop (homeHref '/kpop', brand '🎤 KoreaPlus', breadcrumb
   root '/kpop'). out.kpop.

   Contract: single ctx arg, no build-seo helpers required directly,
   URL built from BASEP + L10N[lang].dir (never hardcoded). Languages
   left untranslated for a term are simply not emitted (hreflang covers
   only filled languages). Content is strictly factual: established
   vocabulary, objective definitions, no fabricated dates/rankings.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const { HUB, EXISTING, TERMS } = require('./seo-kpop-glossary-l10n.js');
const chrome = require('./seo-kpop-chrome.cjs');

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, ld, TODAY } = ctx;

  // The K-pop channel rolls out locales ahead of the rest of the site, so it
  // has its own list. Tolerate its absence: this cluster must keep building
  // while that file is being introduced.
  let CHANNEL_LANGS;
  try { CHANNEL_LANGS = require('./seo-langs-kpop.cjs'); }
  catch { CHANNEL_LANGS = require('./seo-langs.cjs'); }
  const LANGS = CHANNEL_LANGS;

  // Try to read the history JSON if exposed; fall back to global require so
  // the EXISTING headwords still resolve their per-language article titles.
  // (We only LINK to history pages — we never regenerate them.)
  let HIST = ctx.KPOP_HISTORY || ctx.HISTORY || null;
  if (!HIST) {
    try { HIST = require('../kpop-history.json'); } catch { HIST = {}; }
  }

  // dir helper — mirrors build-seo's KPOP_HIST_DIR exactly.
  const dirOf = (lang) => lang === 'en' ? '' : (((L10N[lang] && L10N[lang].dir) || lang) + '/');
  const HUB_SLUG = 'glossary';
  const hubPath = (lang) => `${BASEP}${dirOf(lang)}kpop/${HUB_SLUG}.html`;
  const termPath = (lang, slug) => `${BASEP}${dirOf(lang)}kpop/${slug}.html`;
  // path to an existing history/term article we link to (same family)
  const histPath = (lang, slug) => `${BASEP}${dirOf(lang)}kpop/${slug}.html`;

  // Languages in which a brand-new TERM is translated (always include en
  // when the en block exists). A term page also renders hub chrome and links
  // back to the hub, so a language without a hub is not renderable either.
  function termLangs(slug) {
    const t = TERMS[slug];
    if (!t) return [];
    return HUB_LANGS.filter(l => t[l] && t[l].term);
  }

  // hreflang alternates for a NEW term page.
  function termAlts(slug, lang) {
    const langs = termLangs(slug);
    return langs.filter(l => l !== lang).map(l => ({ lang: l, url: termPath(l, slug) }));
  }
  // Alternates come from HUB_LANGS — the same set buildHub writes — so a
  // language whose hub is dropped is never advertised as one.
  function hubAlts(lang) {
    return HUB_LANGS.filter(l => l !== lang).map(l => ({ lang: l, url: hubPath(l) }));
  }

  // ── A–Z index entry assembly ───────────────────────────────────────
  // Each entry: { term, def, url, letter }. Sources:
  //   - EXISTING articles (link to history JSON pages), filtered to langs
  //     where BOTH the headword map AND the article translation exist.
  //   - NEW term articles (link to our own generated pages).
  const firstAlpha = (s) => {
    const m = String(s || '').toUpperCase().match(/[A-Z]/);
    return m ? m[0] : '#';
  };

  const entryCache = new Map();
  function indexEntries(lang) {
    if (entryCache.has(lang)) return entryCache.get(lang);
    const out = [];
    // existing articles
    for (const slug of Object.keys(EXISTING)) {
      const hw = EXISTING[slug] && EXISTING[slug][lang];
      const art = HIST[slug] && HIST[slug][lang];
      if (!hw || !hw.term || !art) continue; // need both gloss + real article
      out.push({ term: hw.term, def: hw.def || '', url: histPath(lang, slug), letter: firstAlpha(hw.term) });
    }
    // new term articles
    for (const slug of Object.keys(TERMS)) {
      const t = TERMS[slug] && TERMS[slug][lang];
      if (!t || !t.term) continue;
      out.push({ term: t.term, def: t.def || '', url: termPath(lang, slug), letter: firstAlpha(t.term) });
    }
    // dedupe by term, sort A→Z (locale-agnostic, by Latin headword key)
    const seen = new Set();
    const uniq = out.filter(e => { const k = e.term.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    uniq.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
    entryCache.set(lang, uniq);
    return uniq;
  }

  // Languages that actually get a hub: chrome strings AND at least one term
  // whose article exists in that language. Both halves matter — an empty A–Z
  // index is not a page, and hubAlts() must advertise only what we write.
  const HUB_LANGS = LANGS.filter(l => HUB[l] && indexEntries(l).length);

  // ── HUB page ───────────────────────────────────────────────────────
  function buildHub(lang) {
    if (!HUB_LANGS.includes(lang)) return null;
    const T = HUB[lang];
    const entries = indexEntries(lang);
    const url = hubPath(lang);
    const d = dirOf(lang);

    const trail = [{ name: 'K-Pop', url: '/kpop' }, { name: T.h1, url }];
    let body = ctx.bcHtml(trail);
    body += `<p class="lead">${esc(T.lead)}</p>`;

    // A–Z jump bar (letters that actually have entries)
    const letters = [...new Set(entries.map(e => e.letter))].sort();
    body += `<nav class="seo-az" aria-label="${esc(T.azLabel)}"><div class="seo-linklist">${letters.map(L => `<a href="#az-${L}">${esc(L)}</a>`).join('')}</div></nav>`;

    // grouped term list
    body += `<h2>${esc(T.termsH)}</h2>`;
    let curLetter = null;
    body += '<dl class="seo-glossary">';
    for (const e of entries) {
      if (e.letter !== curLetter) {
        curLetter = e.letter;
        body += `<dt class="seo-az-head" id="az-${esc(curLetter)}"><strong>${esc(curLetter)}</strong></dt>`;
      }
      body += `<dt><a href="${esc(e.url)}">${esc(e.term)}</a></dt>`;
      if (e.def) body += `<dd>${esc(e.def)}</dd>`;
    }
    body += '</dl>';

    // related nav
    body += `<h2>${esc(T.relatedH)}</h2><div class="seo-linklist"><a href="${d}kpop/browse.html">${esc(T.browse)}</a><a href="/kpop">${esc(T.hub)}</a></div>`;

    const hero = `<header class="seo-hero"><span class="emoji">📖</span><h1>${esc(T.h1)}</h1><div class="meta"><span class="seo-badge">K-Pop</span><span class="seo-badge">A–Z</span></div></header>`;

    // Schemas: ItemList (the index) + DefinedTermSet (the dictionary) +
    // breadcrumb. Both list/termset carry the linked article URLs.
    const itemList = ld.itemListLD(
      entries.map(e => ({ name: e.term, url: e.url, description: e.def })),
      { name: T.h1, description: T.metaDesc }
    );
    const termSet = ld.definedTermSetLD(
      entries.map(e => ({ name: e.term, description: e.def, url: e.url })),
      { name: T.h1, description: T.metaDesc, url }
    );
    const schemas = [itemList, termSet, ld.breadcrumbLD(trail)].filter(Boolean);

    writePage(`${d}kpop/${HUB_SLUG}.html`, shell({
      url, title: T.title, desc: T.metaDesc, keywords: '', schemas, hero, body, lang,
      alts: hubAlts(lang), homeHref: '/kpop', brand: '🎤 Korea<span>Plus</span>',
    }));
    return url;
  }

  // ── NEW term article page ──────────────────────────────────────────
  function buildTerm(slug, lang) {
    const t = TERMS[slug] && TERMS[slug][lang];
    // The page wears the hub's chrome and links back to it, so no hub in this
    // language means no term page either — never English chrome under hreflang.
    const hubT = HUB[lang];
    if (!t || !t.term || !hubT) return null;
    const en = TERMS[slug].en || t;
    const url = termPath(lang, slug);
    const d = dirOf(lang);
    const h1 = t.h1 || `${t.term}`;
    const title = t.title || `${h1} | KoreaPlus`;
    const metaDesc = t.metaDesc || t.def || '';

    const trail = [
      { name: 'K-Pop', url: '/kpop' },
      { name: hubT.h1, url: hubPath(lang) },
      { name: h1, url },
    ];
    let body = ctx.bcHtml(trail);
    if (t.lead) body += `<p class="lead">${esc(t.lead)}</p>`;
    for (const s of (t.sections || [])) {
      const inner = (s.body || '').trim();
      body += `<h2>${esc(s.h)}</h2>${inner.startsWith('<') ? inner : `<p>${esc(inner)}</p>`}`;
    }
    const qa = (t.faq || []).map(x => Array.isArray(x) ? x : [x.q, x.a]);
    if (qa.length) {
      // Was hardcoded English in every language; the localized heading already
      // ships alongside these pages in the member bundle.
      body += `<h2>${esc(chrome.faqHeading(lang))}</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
    }

    // link back to the glossary hub + a few sibling new terms
    const sibs = Object.keys(TERMS).filter(s2 => s2 !== slug && TERMS[s2][lang] && TERMS[s2][lang].term).slice(0, 8);
    body += `<h2>${esc(hubT.relatedH)}</h2><div class="seo-linklist">`;
    body += `<a href="${d}kpop/${HUB_SLUG}.html">📖 ${esc(hubT.h1)}</a>`;
    for (const s2 of sibs) body += `<a href="${d}kpop/${s2}.html">🎶 ${esc(TERMS[s2][lang].term)}</a>`;
    body += `<a href="/kpop">${esc(hubT.hub)}</a></div>`;


    const hero = `<header class="seo-hero"><span class="emoji">📖</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">K-Pop</span><span class="seo-badge">${esc(t.term)}</span></div></header>`;

    // Schemas: DefinedTerm (the single term) inside its set, FAQ, breadcrumb.
    const termNode = ld.definedTermSetLD(
      [{ name: t.term, description: t.def || metaDesc, url }],
      { name: hubT.h1, description: hubT.metaDesc, url: hubPath(lang) }
    );
    const schemas = [termNode, ld.faqLD(qa), ld.breadcrumbLD(trail)].filter(Boolean);

    writePage(`${d}kpop/${slug}.html`, shell({
      url, title, desc: metaDesc, keywords: '', schemas, hero, body, lang,
      alts: termAlts(slug, lang), homeHref: '/kpop', brand: '🎤 Korea<span>Plus</span>',
    }));
    return url;
  }

  return {
    buildHub,
    buildTerm,
    urls() {
      const acc = [];
      // hub (one per language with a HUB translation AND non-empty index)
      for (const lang of HUB_LANGS) {
        const u = buildHub(lang);
        if (u) acc.push({ lang, url: u });
      }
      // new term articles
      for (const slug of Object.keys(TERMS)) {
        for (const lang of termLangs(slug)) {
          const u = buildTerm(slug, lang);
          if (u) acc.push({ lang, url: u });
        }
      }
      return acc;
    },
  };
};
