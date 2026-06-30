/* ══════════════════════════════════════════════════════════════════
   modules/seo-festivals.cjs — "Korea festivals in <month>" generator.

   12 months × 9 languages (en + ko/ja/zh/es/fr/de/pt/id) = up to 108
   pages on the TRAVEL channel (default homeHref, default brand).
   Slug: korea-festivals-in-<month>  (e.g. korea-festivals-in-july).

   DATA (zero fabrication): ctx pulls korea-festivals.json via a tiny require
   here (the file is plain data with no build coupling). Each festival entry:
     { slug, name:{en,ko}, city, month (1..12), desc, url }
   We group festivals by their `month` field and render one page per month.

   ── RECURRING-ONLY POLICY (critical) ─────────────────────────────────
   Festival pages describe ANNUAL, RECURRING events. We deliberately emit
   NO concrete future date and NO startDate:
     • Copy never names a year or a specific calendar date — only the month.
     • We do NOT call ld.eventLD at all (it requires a startDate, which we
       intentionally do not have). The primary schema is an ItemList of the
       month's festivals; emitting an Event would imply a fabricated date.
   schemas = [ itemListLD, breadcrumbLD, faqLD ].

   Localized festival names: the JSON only carries en/ko. Festival names are
   proper nouns, so non-en/ko languages fall back to the English name (never
   machine-mangled or invented). City names likewise pass through as-is.

   Pure factory: receives ONLY ctx; never requires build-seo helpers.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const { MONTH_NAMES, T } = require('./seo-festivals-l10n.js');

// Travel/default channel language set (en first; en is the canonical root).
const LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];

// English month slugs, index 0 (january) … 11 (december).
const MONTH_SLUGS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

// Load the festival data file once (plain JSON, no build coupling). The file
// lives at the repo root, one directory up from modules/.
let FESTIVALS = [];
try {
  FESTIVALS = require(path.join(__dirname, '..', 'korea-festivals.json'));
  if (!Array.isArray(FESTIVALS)) FESTIVALS = [];
} catch (_e) { FESTIVALS = []; }

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, bcHtml, keyFactsBox, affBlock, ld } = ctx;
  const ORIGIN = 'https://koreaplus-lifes.com';

  // dir() — '' for English, else the locale directory + '/'. Mirrors the
  // build-seo URL rule; never hardcodes a directory string.
  const dir = (lang) => (lang === 'en' ? '' : (L10N[lang] && L10N[lang].dir ? L10N[lang].dir + '/' : lang + '/'));
  const fileFor = (monthIdx) => `guide/korea-festivals-in-${MONTH_SLUGS[monthIdx]}.html`;
  const urlFor = (lang, monthIdx) => `${BASEP}${dir(lang)}${fileFor(monthIdx)}`;

  // ── Build month → [festivals] index ONCE (language-independent). ──
  // Only entries with a valid 1..12 month are bucketed; others dropped.
  const byMonth = Array.from({ length: 12 }, () => []);
  for (const f of FESTIVALS) {
    if (!f || typeof f !== 'object') continue;
    const m = Number(f.month);
    if (!Number.isInteger(m) || m < 1 || m > 12) continue;
    const nameEn = f.name && f.name.en;
    if (!nameEn) continue; // no canonical name → skip (no fabrication)
    byMonth[m - 1].push(f);
  }
  // Stable, alphabetical-by-English-name order within each month.
  for (const arr of byMonth) {
    arr.sort((a, b) => String(a.name.en).localeCompare(String(b.name.en)));
  }

  // Localized festival name: Korean for ko (when present), else English.
  const festName = (f, lang) => (lang === 'ko' && f.name && f.name.ko) ? f.name.ko : f.name.en;

  // hreflang alts: every month page exists in all 9 langs (content is fully
  // translated chrome; the festival index is language-independent).
  const altsFor = (lang, monthIdx) => {
    const others = LANGS.filter(l => l !== lang);
    if (lang === 'en') return others.map(l => ({ lang: l, url: urlFor(l, monthIdx) }));
    return [{ lang: 'en', url: urlFor('en', monthIdx) },
      ...others.filter(l => l !== 'en').map(l => ({ lang: l, url: urlFor(l, monthIdx) }))];
  };

  function buildFestivalMonth(month, lang) {
    // Accept 1..12 (public contract) → 0-based index internally.
    const mNum = Number(month);
    if (!Number.isInteger(mNum) || mNum < 1 || mNum > 12) return null;
    const monthIdx = mNum - 1;
    const tr = T[lang] || T.en;
    const names = MONTH_NAMES[lang] || MONTH_NAMES.en;
    const mName = names[monthIdx];
    const fests = byMonth[monthIdx];
    const n = fests.length;
    const url = urlFor(lang, monthIdx);
    const h1 = tr.h1(mName);

    const trail = [{ name: tr.festHubLabel.replace(/^🎉\s*/, ''), url: '/guide/festivals.html' }, { name: h1, url }];
    let body = bcHtml(trail);
    body += `<p class="lead">${esc(tr.lead(mName, n))}</p>`;
    body += keyFactsBox([tr.factMonth(mName), tr.factN(n)]);

    // ── Festival list (recurring; NO dates) ──
    if (n) {
      body += `<h2>${esc(tr.listH(mName, n))}</h2>`;
      body += `<table class="seo-table"><thead><tr>`
        + `<th>${esc(tr.col.name)}</th><th>${esc(tr.col.city)}</th><th>${esc(tr.col.about)}</th>`
        + `</tr></thead><tbody>`;
      for (const f of fests) {
        const nm = festName(f, lang);
        const cityCell = f.city ? esc(String(f.city)) : '';
        const aboutCell = f.desc ? esc(String(f.desc)) : '';
        body += `<tr>`
          + `<td>${f.url ? `<a href="${esc(String(f.url))}" rel="nofollow noopener" target="_blank">${esc(nm)}</a>` : esc(nm)}</td>`
          + `<td>${cityCell}</td>`
          + `<td>${aboutCell}</td>`
          + `</tr>`;
      }
      body += `</tbody></table>`;
    } else {
      body += `<p>${esc(tr.none(mName))}</p>`;
    }

    // ── Other-months nav (drill-around, always present) ──
    body += `<h2>${esc(tr.monthsH)}</h2><div class="seo-linklist">`;
    for (let i = 0; i < 12; i++) {
      if (i === monthIdx) continue;
      body += `<a href="${dir(lang)}${fileFor(i)}">🎉 ${esc(names[i])}</a>`;
    }
    body += `</div>`;

    // ── FAQ (recurring-only; no concrete dates in answers) ──
    const qa = [];
    if (n) {
      const sample = fests.slice(0, 4).map(f => festName(f, lang)).join(', ');
      qa.push([tr.q1(mName), tr.a1(mName, sample)]);
    }
    qa.push([tr.q2(mName), tr.a2()]);
    qa.push([tr.q3(), tr.a3()]);
    body += `<h2>${esc(tr.faqH)}</h2><div class="seo-faq">`
      + qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')
      + `</div>`;

    // ── Related navigation back into the travel property ──
    body += `<h2>${esc(tr.relH)}</h2><div class="seo-linklist">`
      + `<a href="${dir(lang)}plan.html">${esc(tr.browseLabel)}</a>`
      + `<a href="${dir(lang)}festivals.html">${esc(tr.festHubLabel)}</a>`
      + `</div>`;

    body += affBlock({ city: 'Seoul', cat: 'general', q: '', lang });

    const hero = `<header class="seo-hero"><span class="emoji">🎉</span><h1>${esc(h1)}</h1>`
      + `<div class="meta"><span class="seo-badge">${esc(mName)}</span><span class="seo-badge">${esc(String(n))}</span></div></header>`;

    // ── Schemas: ItemList (festivals) + breadcrumb + FAQ. ──
    // NO Event/startDate — these are recurring annual events with no fixed
    // future date; an Event node would imply a fabricated startDate.
    const schemas = [];
    if (n) {
      const il = ld.itemListLD(
        fests.map(f => ({
          name: festName(f, lang),
          url: f.url || undefined,
          description: f.city ? `${f.city}${f.desc ? ' · ' + f.desc : ''}` : (f.desc || undefined),
        })),
        { name: h1, description: tr.desc(mName, n), origin: ORIGIN }
      );
      if (il) schemas.push(il);
    }
    const bc = ld.breadcrumbLD(trail, { origin: ORIGIN });
    if (bc) schemas.push(bc);
    const fq = ld.faqLD(qa);
    if (fq) schemas.push(fq);

    writePage(`${dir(lang)}${fileFor(monthIdx)}`, shell({
      url, title: tr.title(mName, n), desc: tr.desc(mName, n), keywords: '',
      schemas, hero, body, lang, alts: altsFor(lang, monthIdx),
    }));
    return url;
  }

  return {
    buildFestivalMonth,
    urls() {
      const out = [];
      for (let m = 1; m <= 12; m++) {
        for (const lang of LANGS) {
          const u = buildFestivalMonth(m, lang);
          if (u) out.push({ lang, url: u });
        }
      }
      return out;
    },
  };
};
