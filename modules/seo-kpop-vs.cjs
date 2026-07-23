/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-vs.cjs — K05: curated K-pop GROUP vs GROUP comparison
   pages (kpop-vs/{a}-vs-{b}), 9 languages.

   FACT-ONLY. Compares only objective ROSTER fields — debut date, member
   count, agency, genres (and fandom/type). NO ranking, NO "better than",
   NO subjective superiority. Curated pairs are same-gender and adjacent
   generation only (no boy-vs-girl, no generational gaps).

   CommonJS factory: module.exports = function(ctx){ ... }. All build-seo
   helpers arrive via ctx — this file requires nothing from build-seo.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, ROSTER, TODAY, ld, bcHtml, keyFactsBox } = ctx;

  // ── i18n strings (en + 8 locales). Lives at repo root next to build-seo. ──
  let T = {};
  try {
    T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'kpop-vs-l10n.json'), 'utf8'));
  } catch { T = {}; }

  // Languages we can render = en + every locale that has a translation block.
  const LANGS = ['en'].concat(['ja', 'zh', 'es', 'ko', 'fr', 'de', 'pt', 'id'])
    .filter(l => T[l]);

  // Build a quick id→roster lookup (objective fields only).
  const BY_ID = {};
  (ROSTER || []).forEach(r => { if (r && r.id) BY_ID[r.id] = r; });

  // ── Curated comparison pairs ────────────────────────────────────────
  // Rule: same gender, adjacent generation (debut years close), groups only.
  // No boy-vs-girl, no big generational gaps. Each pair references roster ids
  // that must both exist (skipped at build time if either is missing).
  const PAIRS = [
    // girl groups — adjacent generation
    ['blackpink', 'twice'],     // 2016 / 2015
    ['twice', 'redvelvet'],     // 2015 / 2014
    ['newjeans', 'lesserafim'], // both 2022
    ['aespa', 'ive'],           // 2020 / 2021
    ['itzy', 'aespa'],          // 2019 / 2020
    ['gidle', 'itzy'],          // 2018 / 2019
    ['illit', 'babymonster'],   // both 2024
    // boy groups — adjacent generation
    ['bts', 'seventeen'],       // 2013 / 2015
    ['exo', 'bts'],             // 2012 / 2013
    ['straykids', 'ateez'],     // both 2018
    ['txt', 'enhypen'],         // 2019 / 2020
    ['zerobaseone', 'riize'],   // both 2023
  ];

  // Validated pairs: both ids resolve to a roster entry that is a group.
  const VALID = PAIRS.filter(([a, b]) => {
    const ra = BY_ID[a], rb = BY_ID[b];
    return ra && rb && ra.type === 'group' && rb.type === 'group';
  });

  // ── helpers ─────────────────────────────────────────────────────────
  const fmt = (tpl, vars) => String(tpl == null ? '' : tpl)
    .replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

  const yearOf = d => (typeof d === 'string' && /^\d{4}/.test(d)) ? d.slice(0, 4) : '';

  const slugFor = (a, b) => `kpop-vs/${a}-vs-${b}.html`;

  // URL with the BASEP + locale dir convention (dir hardcoding forbidden).
  function urlFor(a, b, lang) {
    const dir = lang === 'en' ? '' : (L10N[lang] && L10N[lang].dir ? L10N[lang].dir + '/' : '');
    return `${BASEP}${dir}${slugFor(a, b)}`;
  }

  // Build hreflang alternates: only languages that can render (all of LANGS,
  // since every page is fully data-driven + has its locale block).
  function altsFor(a, b) {
    return LANGS.map(l => ({ lang: l, url: urlFor(a, b, l) }));
  }

  // ── page builder ────────────────────────────────────────────────────
  // Returns the absolute (BASEP-prefixed) url on success, or null if the
  // pair/locale cannot be rendered (missing roster / missing translation).
  function buildVs(pairIdx, lang) {
    const pair = VALID[pairIdx];
    if (!pair) return null;
    const t = T[lang];
    if (!t) return null;
    const ra = BY_ID[pair[0]], rb = BY_ID[pair[1]];
    if (!ra || !rb) return null;

    const nameA = ra.nameEn, nameB = rb.nameEn;
    const ya = yearOf(ra.debut), yb = yearOf(rb.debut);
    const ma = Array.isArray(ra.members) ? ra.members.length : 0;
    const mb = Array.isArray(rb.members) ? rb.members.length : 0;
    const genresA = (ra.genres || []).join(', ');
    const genresB = (rb.genres || []).join(', ');

    const vstr = { a: nameA, b: nameB, ya, yb, ma, mb, aa: ra.agency || '', ab: rb.agency || '' };

    const url = urlFor(pair[0], pair[1], lang);
    const title = `${nameA} ${t.vs} ${nameB} — ${t.titleSuffix}`;
    const desc = fmt(t.desc, vstr);

    // ── side-by-side comparison table (objective rows only) ──
    const rowsDef = [
      [t.row.debut, esc(ra.debut || '—'), esc(rb.debut || '—')],
      [t.row.members, ma ? String(ma) : '—', mb ? String(mb) : '—'],
      [t.row.agency, esc(ra.agency || '—'), esc(rb.agency || '—')],
      [t.row.genres, esc(genresA || '—'), esc(genresB || '—')],
      [t.row.fandom, esc(ra.fandom || '—'), esc(rb.fandom || '—')],
      [t.row.type, esc(ra.type || '—'), esc(rb.type || '—')],
    ];
    const tableHtml = `<div class="kp-vs-table" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;margin:1rem 0">
<thead><tr><th style="text-align:left;padding:.5rem;border-bottom:2px solid #2a3a52"></th><th style="text-align:left;padding:.5rem;border-bottom:2px solid #2a3a52">${ra.emoji || ''} ${esc(nameA)}</th><th style="text-align:left;padding:.5rem;border-bottom:2px solid #2a3a52">${rb.emoji || ''} ${esc(nameB)}</th></tr></thead>
<tbody>${rowsDef.map(r => `<tr><th style="text-align:left;padding:.5rem;border-bottom:1px solid #1e2c44;font-weight:600">${esc(r[0])}</th><td style="padding:.5rem;border-bottom:1px solid #1e2c44">${r[1]}</td><td style="padding:.5rem;border-bottom:1px solid #1e2c44">${r[2]}</td></tr>`).join('')}</tbody>
</table></div>`;

    // ── neutral comparison notes (data-derived, never opinion) ──
    const notes = [];
    notes.push(ya && yb ? (ya === yb ? fmt(t.noteSameYear, vstr) : fmt(t.noteDebut, vstr)) : '');
    notes.push(ma && mb ? (ma === mb ? fmt(t.noteSameMembers, vstr) : fmt(t.noteMembers, vstr)) : '');
    notes.push((ra.agency && rb.agency)
      ? (ra.agency === rb.agency ? fmt(t.noteSameAgency, vstr) : fmt(t.noteAgency, vstr)) : '');
    const notesHtml = `<ul class="tips">${notes.filter(Boolean).map(n => `<li>${esc(n)}</li>`).join('')}</ul><p style="opacity:.8;font-size:.9em">${esc(t.neutral)}</p>`;

    // ── members lists ──
    const memberHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0">
<div><strong>${ra.emoji || ''} ${esc(nameA)}</strong><br>${(ra.members || []).map(esc).join(' · ') || '—'}</div>
<div><strong>${rb.emoji || ''} ${esc(nameB)}</strong><br>${(rb.members || []).map(esc).join(' · ') || '—'}</div>
</div>`;

    // ── key facts chips ──
    const facts = keyFactsBox([
      `${esc(nameA)}: ${esc(ra.debut || '')}`,
      `${esc(nameB)}: ${esc(rb.debut || '')}`,
      `${nameA} · ${ma} ${t.row.members}`,
      `${nameB} · ${mb} ${t.row.members}`,
    ]);

    // ── FAQ (fact-only Q&A) ──
    let firstName, secondName, yf, ys;
    if (ya && yb && ya !== yb) {
      if (Number(ya) < Number(yb)) { firstName = nameA; secondName = nameB; yf = ya; ys = yb; }
      else { firstName = nameB; secondName = nameA; yf = yb; ys = ya; }
    }
    const qa = [];
    if (firstName) {
      qa.push([
        fmt(t.q_who_debut, vstr),
        fmt(t.a_who_debut, { first: firstName, second: secondName, yf, ys }),
      ]);
    }
    qa.push([fmt(t.q_members, vstr), fmt(t.a_members, vstr)]);
    if (ra.agency && rb.agency) {
      qa.push([fmt(t.q_agency, vstr), fmt(t.a_agency, vstr)]);
    }
    const faqHtml = `<h2>${esc(t.faqH)}</h2><div class="faq">${qa.map(([q, a]) =>
      `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

    // ── related comparisons (other pairs sharing a group) ──
    const rel = VALID
      .map((p, i) => ({ p, i }))
      .filter(({ p }, ) => (p[0] === pair[0] || p[1] === pair[0] || p[0] === pair[1] || p[1] === pair[1])
        && !(p[0] === pair[0] && p[1] === pair[1]))
      .slice(0, 6)
      .map(({ p }) => {
        const na = BY_ID[p[0]].nameEn, nb = BY_ID[p[1]].nameEn;
        return `<li><a href="${esc(urlFor(p[0], p[1], lang))}">${esc(na)} ${esc(t.vs)} ${esc(nb)}</a></li>`;
      }).join('');
    const relHtml = rel ? `<h2>${esc(t.relH)}</h2><ul class="rel-links">${rel}</ul>` : '';

    // ── breadcrumb (K-pop channel root = /kpop) ──
    const trail = [
      { name: t.bcHub, url: '/kpop' },
      { name: t.bcVs, url: `${BASEP}${lang === 'en' ? '' : (L10N[lang] && L10N[lang].dir ? L10N[lang].dir + '/' : '')}kpop-vs/` },
      { name: `${nameA} ${t.vs} ${nameB}`, url },
    ];

    // ── JSON-LD: Article (compareLD) + breadcrumb + FAQ ──
    const schemas = [
      ld.compareLD({
        headline: `${nameA} ${t.vs} ${nameB}`,
        description: desc,
        url,
        datePublished: TODAY,
        dateModified: TODAY,
      }),
      ld.breadcrumbLD(trail),
      ld.faqLD(qa),
    ].filter(Boolean);

    // ── body ──
    const body = `${bcHtml(trail)}
<article class="content">
<p class="lead">${esc(fmt(t.lead, vstr))}</p>
${facts}
<h2>${esc(t.tableH)}</h2>
${tableHtml}
<h2>${esc(t.memberH)}</h2>
${memberHtml}
<h2>${esc(t.notesH)}</h2>
${notesHtml}
${faqHtml}
${relHtml}
</article>`;

    // shell() RETURNS the html string — it does not write. writePage must be
    // called with the OUT-relative path (= url minus the BASEP prefix), else
    // the page is sitemap-listed but never materialized on disk (ghost 404).
    writePage(url.slice(BASEP.length), shell({
      url,
      title,
      desc,
      keywords: '',
      schemas,
      hero: `<h1>${esc(fmt(t.hero, vstr))}</h1>`,
      body,
      lang,
      alts: altsFor(pair[0], pair[1]),
      homeHref: '/kpop',
      brand: '🎤 Korea<span>Plus</span>',
    }));

    return url;
  }

  return {
    buildVs,
    pairs: VALID.map(p => p.join('-vs-')),
    urls() {
      const out = [];
      for (let i = 0; i < VALID.length; i++) {
        for (const lang of LANGS) {
          const u = buildVs(i, lang);
          if (u) out.push({ lang, url: u });
        }
      }
      return out;
    },
  };
};
