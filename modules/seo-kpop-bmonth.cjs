/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-bmonth.cjs — "K-pop idols born in <month>" generator.

   12 months × 9 languages (en + ko/ja/zh/es/fr/de/pt/id). For each month
   we collect every roster member whose VERIFIED birthday (ENRICH.bdays)
   falls in that month, join the member back to their group meta (ROSTER),
   and render a localized birthday page. Slug: kpop-idols-born-in-<month>.

   K-pop channel page (homeHref:'/kpop'). Out → __out.kpop.

   Data contract (confirmed by reading the real files):
     ROSTER  item: { id, nameEn, nameKo, type, gender, emoji, members:[name],
                     genres:[], wikidataId, ... }
     ENRICH  keyed by ROSTER id: { lightstick?, color?,
                     bdays:[[memberName,"YYYY-MM-DD"], ...] }
   Members are joined to their group purely by ROSTER id (the ENRICH key).
   Only dates that pass ctx.derive.monthOf are listed — zero fabrication.

   Pure factory: receives ONLY ctx; never requires build-seo helpers.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const { MONTH_NAMES, T } = require('../seo-kpop-bmonth-l10n.js');

// K-pop channel language set (en first; matches build-seo KPOP_HIST_LANGS).
const LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];

// English month slugs, index 0 (january) … 11 (december).
const MONTH_SLUGS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, bcHtml, affBlock, ROSTER, ENRICH, derive, ld } = ctx;

  // dir() — '' for English, else the locale directory + '/'. Mirrors the
  // build-seo URL rule; never hardcodes a directory string.
  const dir = (lang) => (lang === 'en' ? '' : (L10N[lang] && L10N[lang].dir ? L10N[lang].dir + '/' : lang + '/'));
  const urlFor = (lang, monthIdx) => `${BASEP}${dir(lang)}kpop/kpop-idols-born-in-${MONTH_SLUGS[monthIdx]}.html`;

  // ── Build the month → [entries] index ONCE (language-independent).
  // entry = { name, date, sign, group:{id,nameEn,nameKo,emoji,type,gender} }
  // Sorted by day-of-month then name so output is deterministic.
  const byMonth = Array.from({ length: 12 }, () => []);
  for (const g of (Array.isArray(ROSTER) ? ROSTER : [])) {
    if (!g || !g.id) continue;
    const en = ENRICH && ENRICH[g.id];
    const bdays = en && Array.isArray(en.bdays) ? en.bdays : [];
    for (const tup of bdays) {
      if (!Array.isArray(tup) || tup.length < 2) continue;
      const [memberName, dateStr] = tup;
      if (!memberName || !dateStr) continue;
      const mo = derive.monthOf(dateStr);   // validated YYYY-MM-DD → {index,...} | null
      if (!mo) continue;                     // unverifiable/malformed → drop silently
      const p = derive.parseDate(dateStr);   // for day-of-month sort
      byMonth[mo.index].push({
        name: String(memberName),
        date: dateStr,
        day: p ? p.d : 99,
        sign: derive.signOf(dateStr),        // {key,name,emoji} | null
        group: {
          id: g.id,
          nameEn: g.nameEn || g.id,
          nameKo: g.nameKo || '',
          emoji: g.emoji || '🎤',
          type: g.type || '',
          gender: g.gender || '',
        },
      });
    }
  }
  for (const arr of byMonth) {
    arr.sort((a, b) => (a.day - b.day) || a.name.localeCompare(b.name));
  }

  // Localized group display name: Korean roster name for ko, else English.
  const groupName = (grp, lang) => (lang === 'ko' && grp.nameKo) ? grp.nameKo : grp.nameEn;

  // hreflang alts across all 9 langs (every month page exists in all langs,
  // since the index is language-independent and content is fully translated).
  const altsFor = (lang, monthIdx) => {
    const others = LANGS.filter(l => l !== lang);
    if (lang === 'en') return others.map(l => ({ lang: l, url: urlFor(l, monthIdx) }));
    return [{ lang: 'en', url: urlFor('en', monthIdx) },
      ...others.filter(l => l !== 'en').map(l => ({ lang: l, url: urlFor(l, monthIdx) }))];
  };

  function buildMonth(monthIdx, lang) {
    const tr = T[lang] || T.en;
    const mName = (MONTH_NAMES[lang] || MONTH_NAMES.en)[monthIdx];
    const entries = byMonth[monthIdx];
    const url = urlFor(lang, monthIdx);
    const h1 = tr.h1(mName);

    const trail = [{ name: 'K-Pop', url: '/kpop' }, { name: h1, url }];
    let body = bcHtml(trail);
    body += `<p class="lead">${esc(tr.lead(mName))}</p>`;

    if (entries.length) {
      body += `<h2>${esc(tr.listH(mName, entries.length))}</h2>`;
      body += `<table class="seo-table"><thead><tr>`
        + `<th>${esc(tr.col.idol)}</th><th>${esc(tr.col.group)}</th><th>${esc(tr.col.date)}</th>`
        + `</tr></thead><tbody>`;
      for (const e of entries) {
        const gLink = `${dir(lang)}kpop/${e.group.id}-profile.html`;
        const signTag = e.sign ? ` <span class="seo-badge">${e.sign.emoji} ${esc(e.sign.name)}</span>` : '';
        body += `<tr>`
          + `<td>${esc(e.name)}${signTag}</td>`
          + `<td>${e.group.emoji} <a href="${gLink}">${esc(groupName(e.group, lang))}</a></td>`
          + `<td>${esc(e.date)}</td>`
          + `</tr>`;
      }
      body += `</tbody></table>`;
    } else {
      body += `<p>${esc(tr.none(mName))}</p>`;
    }

    // Other-months link list (drill-around, always present)
    body += `<h2>${esc(tr.monthsH)}</h2><div class="seo-linklist">`;
    for (let i = 0; i < 12; i++) {
      if (i === monthIdx) continue;
      const im = (MONTH_NAMES[lang] || MONTH_NAMES.en)[i];
      body += `<a href="${dir(lang)}kpop/kpop-idols-born-in-${MONTH_SLUGS[i]}.html">🎂 ${esc(im)}</a>`;
    }
    body += `</div>`;

    // FAQ — only when we have real names to cite (avoid empty/fabricated answers)
    const qa = [];
    if (entries.length) {
      const sampleNames = entries.slice(0, 6).map(e => e.name).join(', ');
      qa.push([tr.q1(mName), tr.a1(mName, sampleNames)]);
    }
    qa.push([tr.q2(mName), tr.a2()]);
    if (qa.length) {
      body += `<h2>${esc(tr.faqH)}</h2><div class="seo-faq">`
        + qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')
        + `</div>`;
    }

    // Related navigation back into the K-pop property
    body += `<h2>${esc(tr.relH)}</h2><div class="seo-linklist">`
      + `<a href="${dir(lang)}kpop/browse.html">${esc(tr.browseLabel)}</a>`
      + `<a href="/kpop">${esc(tr.hubLabel)}</a>`
      + `</div>`;

    body += affBlock({ city: 'Seoul', cat: 'general', q: '', lang });

    const hero = `<header class="seo-hero"><span class="emoji">🎂</span><h1>${esc(h1)}</h1>`
      + `<div class="meta"><span class="seo-badge">${esc(tr.badge)}</span><span class="seo-badge">K-Pop</span></div></header>`;

    // ── Schemas: ItemList of the idols (verified names) + breadcrumb + FAQ.
    // birthDate of each idol is a verified ISO date → safe to surface, but we
    // keep the primary entity an ItemList (most robust for a roster page).
    const schemas = [];
    if (entries.length) {
      const il = ld.itemListLD(
        entries.map(e => ({ name: e.name, url: `${BASEP}${dir(lang)}kpop/${e.group.id}-profile.html` })),
        { name: h1, description: tr.desc(mName) }
      );
      if (il) schemas.push(il);
    }
    const bc = ld.breadcrumbLD(trail);
    if (bc) schemas.push(bc);
    const fq = ld.faqLD(qa);
    if (fq) schemas.push(fq);

    writePage(`${dir(lang)}kpop/kpop-idols-born-in-${MONTH_SLUGS[monthIdx]}.html`, shell({
      url, title: tr.title(mName), desc: tr.desc(mName), keywords: '',
      schemas, hero, body, lang, alts: altsFor(lang, monthIdx),
      homeHref: '/kpop', brand: '🎤 Korea<span>Plus</span>',
    }));
    return url;
  }

  return {
    buildMonth,
    urls() {
      const out = [];
      for (let i = 0; i < 12; i++) {
        for (const lang of LANGS) {
          const u = buildMonth(i, lang);
          if (u) out.push({ lang, url: u });
        }
      }
      return out;
    },
  };
};
