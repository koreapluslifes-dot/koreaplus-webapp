/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-year.cjs — "K-pop releases in <year>" archive pages.

   Cross-artist counterpart to the per-act discography table: one page per
   year, every roster release in date order, grouped by month, plus a
   most-active-act ranking derived from the same rows.

   Data: ctx.DISCOG (kpop-discog.js, Apple iTunes Lookup) joined to ctx.ROSTER
   by id. Facts only — the year, the date and the title all come from the
   snapshot; nothing is characterised or ranked editorially.

   A dated release is not a released release. The snapshot carries titles
   announced for a future date, so every count on the page (lead, stat boxes,
   the most-active table, the FAQ) is taken from the rows that are actually
   out, and the rest are listed with the same "upcoming" marker the profile
   pages use. Otherwise the page would state that something has happened.

   YEARS ARE NOT HARDCODED. A year gets a page only when the snapshot holds
   enough of it to be worth reading (MIN_ACTS / MIN_RELEASES); regenerating the
   snapshot next January therefore adds the new year on its own, and a thin
   early year never ships as a near-empty page.

   Slug: kpop-releases-<year>.  K-pop channel page (homeHref:'/kpop').

   Pure factory: receives ONLY ctx; never requires build-seo helpers.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const T = require('../seo-kpop-year-l10n.js');
const { MONTH_NAMES } = require('../seo-kpop-bmonth-l10n.js');
const media = require('./seo-kpop-media.cjs');
const chrome = require('./seo-kpop-chrome.cjs');

// The K-pop channel rolls out locales ahead of the rest of the site, so it has
// its own list. Tolerate its absence: this cluster must keep building while
// that file is being introduced.
let CHANNEL_LANGS;
try { CHANNEL_LANGS = require('./seo-langs-kpop.cjs'); }
catch { CHANNEL_LANGS = require('./seo-langs.cjs'); }

// Renderable languages = those with a complete string set. A locale listed
// upstream before its translations land would otherwise publish English prose
// under its own hreflang, which is worse than having no page at all.
const LANGS = CHANNEL_LANGS.filter(l => T[l] && MONTH_NAMES[l] && media.T[l]);

// A year page has to be worth landing on. Below these thresholds the snapshot
// is too sparse for the page to say anything (the roster's back catalogue
// thins out fast before ~2019), so no page is emitted at all.
const MIN_ACTS = 5;
const MIN_RELEASES = 12;

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, bcHtml, affBlock, ROSTER, DISCOG, ld, kpopPublicUrl } = ctx;

  // Release dates are Korean dates; against a UTC "today" a title stays flagged
  // as upcoming for nine hours after it is already out.
  const TODAY_KST = ctx.TODAY_KST || new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

  const dir = (lang) => (lang === 'en' ? '' : (L10N[lang] && L10N[lang].dir ? L10N[lang].dir + '/' : lang + '/'));
  const urlFor = (lang, year) => kpopPublicUrl(lang, `kpop-releases-${year}`);

  // ── Index every release by year ONCE (language-independent) ──────────────
  const all = media.allReleases(DISCOG, ROSTER);
  const asOf = media.snapshotDate(DISCOG);
  const byYear = new Map();
  for (const r of all) {
    const y = String(r.year || '').slice(0, 4);
    if (!/^\d{4}$/.test(y)) continue;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(r);
  }
  // The subset that has actually come out. Everything the page counts or ranks
  // reads from here; only the month tables list the announced titles too.
  const outByYear = new Map();
  for (const [y, rows] of byYear) outByYear.set(y, rows.filter(r => r.date <= TODAY_KST));

  const actsIn = (rows) => new Set(rows.map(r => r.artist.id)).size;

  // Keep only years with enough substance, newest first. A year that exists
  // purely as announcements is dropped too: every string on the page is past
  // tense, so there is nothing truthful for it to say yet.
  const allYears = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));
  const qualifies = (y) => {
    const rows = byYear.get(y);
    return rows.length >= MIN_RELEASES && actsIn(rows) >= MIN_ACTS && outByYear.get(y).length > 0;
  };
  const YEARS = allYears.filter(qualifies);
  const dropped = allYears.filter(y => !qualifies(y));

  // A thinner snapshot silently unpublishes indexed URLs — 2019 clears the bar
  // by ten releases — so the split and the counts behind it go in the log.
  const tallyOf = (y) => `${y}:${byYear.get(y).length}r/${actsIn(byYear.get(y))}a`;
  console.log(`[kpop-year] kept ${YEARS.length}/${allYears.length} years (min ${MIN_RELEASES} releases / ${MIN_ACTS} acts) × ${LANGS.length} langs`);
  console.log('  kept:', YEARS.map(tallyOf).join(' ') || '(none)');
  console.log('  dropped:', dropped.map(tallyOf).join(' ') || '(none)');

  // LANGS is already the written-languages list, so an alternate can never
  // point at a page this module declined to render (a dangling alt fails S20).
  const altsFor = (lang, year) => {
    const others = LANGS.filter(l => l !== lang);
    if (lang === 'en') return others.map(l => ({ lang: l, url: urlFor(l, year) }));
    return [{ lang: 'en', url: urlFor('en', year) },
      ...others.filter(l => l !== 'en').map(l => ({ lang: l, url: urlFor(l, year) }))];
  };

  const artistName = (a, lang) => (lang === 'ko' && a.nameKo) ? a.nameKo : (a.nameEn || a.id);

  function buildYear(year, lang) {
    const t = T[lang], mN = MONTH_NAMES[lang], mt = media.T[lang];
    if (!t || !mN || !mt) return null;        // no English text under a foreign hreflang
    const rows = byYear.get(year);
    if (!rows || !rows.length) return null;
    const out = outByYear.get(year) || [];
    if (!out.length) return null;
    const url = urlFor(lang, year);
    const acts = new Set(out.map(r => r.artist.id));
    const h1 = t.h1(year);

    const trail = [{ name: 'K-Pop', url: '/kpop' }, { name: h1, url }];
    let body = bcHtml(trail);
    body += `<p class="lead">${esc(t.lead(year, out.length, acts.size))}</p>`;
    body += `<p class="kp-asof">${esc(t.scope)}</p>`;

    // ── The year in numbers (all three figures derived from `out`) ──────────
    const perMonth = Array.from({ length: 12 }, () => 0);
    for (const r of out) {
      const mi = Number(r.date.slice(5, 7)) - 1;
      if (mi >= 0 && mi < 12) perMonth[mi] += 1;
    }
    const busiest = perMonth.indexOf(Math.max(...perMonth));
    // "<b>n</b> label" is English number shape. Arabic needs the noun out of the
    // numeral's government (عدد الإصدارات: 156), Thai needs a classifier after
    // the numeral (ผลงาน 156 ชิ้น), Russian needs a dash before the value. So a
    // stat string may instead be a template carrying {n} (or {m} for the month)
    // and, where the noun inflects, a CLDR plural object — the locale then owns
    // the whole phrase. Bundles that have not adopted that keep the old layout.
    // A sentinel marks where the value goes, so the <b> wrapper survives esc()
    // without the escaper ever seeing markup and without a fragile digit search.
    const SLOT = '\u0000';
    const statBox = (tpl, value, isNumber) => {
      const filled = isNumber
        ? chrome.countTemplate(tpl, lang, value, { n: SLOT })
        : chrome.countTemplate(tpl, lang, 1, { m: SLOT });
      if (filled != null) {
        const html = esc(filled).split(SLOT).join(`<b>${esc(String(value))}</b>`);
        return `<span class="kp-statbox">${html}</span>`;
      }
      return isNumber
        ? `<span class="kp-statbox"><b>${esc(String(value))}</b> ${esc(tpl)}</span>`
        // Label first here: the month is a value, not a unit the number counts,
        // so the "<b>n</b> unit" shape of the boxes above reads as a broken phrase.
        : `<span class="kp-statbox">${esc(tpl)} <b>${esc(String(value))}</b></span>`;
    };
    body += `<h2>${esc(t.statsH)}</h2><div class="kp-stats">`
      + statBox(t.statReleases, out.length, true)
      + statBox(t.statActs, acts.size, true)
      + statBox(t.statBusiest, mN[busiest], false)
      + `</div>`;

    // ── Releases grouped by month, newest month first ───────────────────────
    // Announced titles stay in the table — they are part of the year — but are
    // marked exactly as the discography tables mark them.
    for (let mi = 11; mi >= 0; mi--) {
      const inMonth = rows.filter(r => Number(r.date.slice(5, 7)) - 1 === mi);
      if (!inMonth.length) continue;
      body += `<h2>${esc(t.monthH(mN[mi], year))}</h2>`;
      body += `<table class="seo-table kp-disc-table"><thead><tr>`
        + `<th>${esc(t.colDate)}</th><th>${esc(t.colArtist)}</th><th>${esc(t.colTitle)}</th>`
        + `</tr></thead><tbody>`;
      for (const r of inMonth) {
        const upcoming = r.date > TODAY_KST;
        const art = r.art
          ? `<img class="kp-disc-art" src="${esc(r.art)}" alt="" width="56" height="56" loading="lazy" decoding="async">`
          : '';
        body += `<tr${upcoming ? ' class="is-upcoming"' : ''}>`
          + `<td>${esc(r.date)}${upcoming ? ` <span class="seo-badge kp-soon">${esc(mt.upcoming)}</span>` : ''}</td>`
          // Profile pages exist only in the languages kpop-history covers; the
          // artist is plain text elsewhere rather than a 404 or a jump to English.
          + `<td>${r.artist.emoji || '🎤'} ${chrome.profileLink(r.artist.id, lang, dir(lang), artistName(r.artist, lang), esc)}</td>`
          + `<td class="kp-disc-t">${art}<span>${esc(r.title)}${r.badge ? ` <span class="seo-badge">${esc(r.badge)}</span>` : ''}</span></td>`
          + `</tr>`;
      }
      body += `</tbody></table>`;
    }

    // ── Most active acts of the year ────────────────────────────────────────
    const tally = new Map();
    for (const r of out) tally.set(r.artist.id, (tally.get(r.artist.id) || 0) + 1);
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
    if (top.length) {
      const byId = Object.fromEntries(ROSTER.map(a => [a.id, a]));
      body += `<h2>${esc(t.topH(year))}</h2>`;
      body += `<table class="seo-table"><thead><tr><th>#</th><th>${esc(t.colArtist)}</th><th>${esc(t.topCol)}</th></tr></thead><tbody>`;
      top.forEach(([id, n], i) => {
        const a = byId[id]; if (!a) return;
        body += `<tr><td>${i + 1}</td>`
          + `<td>${a.emoji || '🎤'} ${chrome.profileLink(id, lang, dir(lang), artistName(a, lang), esc)}</td>`
          + `<td>${n}</td></tr>`;
      });
      body += `</tbody></table>`;
    }

    // ── Other years ─────────────────────────────────────────────────────────
    if (YEARS.length > 1) {
      body += `<h2>${esc(t.yearsH)}</h2><div class="seo-linklist">`;
      for (const y of YEARS) {
        if (y === year) continue;
        body += `<a href="${dir(lang)}kpop/kpop-releases-${y}.html">📅 ${esc(y)}</a>`;
      }
      body += `</div>`;
    }

    // ── FAQ — every answer cites rows we actually have ──────────────────────
    const first = out[out.length - 1];        // `out` is newest-first
    const qa = [
      [t.q1(year), t.a1(year, out.length, acts.size)],
      [t.q2(year), t.a2(first.title, artistName(first.artist, lang), first.date)],
      [t.q3, t.a3],
    ];
    body += `<h2>${esc(t.faqH)}</h2><div class="seo-faq">`
      + qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')
      + `</div>`;

    body += `<h2>${esc(t.relH)}</h2><div class="seo-linklist">`
      + `<a href="${dir(lang)}kpop/browse.html">${esc(t.browseLabel)}</a>`
      + `<a href="/kpop">${esc(t.hubLabel)}</a>`
      + `</div>`;
    if (asOf) body += `<p class="kp-asof">${esc(t.asOf(asOf))}</p>`;

    const hero = `<header class="seo-hero"><span class="emoji">📅</span><h1>${esc(h1)}</h1>`
      + `<div class="meta"><span class="seo-badge">${esc(t.badge)}</span><span class="seo-badge">K-Pop</span></div></header>`;

    const schemas = [];
    // ItemList mirrors the table, so it carries the announced titles too — an
    // entry is a name and a profile link, and claims nothing about availability.
    const il = ld.itemListLD(
      // url omitted, not faked, where the profile page does not exist in this
      // language: a ListItem url is an assertion, and this one would be a 404.
      rows.slice(0, 60).map(r => ({ name: `${r.title} — ${artistName(r.artist, lang)}`, url: chrome.profileUrl(r.artist.id, lang, BASEP, dir(lang)) })),
      { name: h1, description: t.desc(year, out.length, acts.size) }
    );
    if (il) schemas.push(il);
    const bc = ld.breadcrumbLD(trail); if (bc) schemas.push(bc);
    const fq = ld.faqLD(qa); if (fq) schemas.push(fq);

    writePage(`${dir(lang)}kpop/kpop-releases-${year}.html`, shell({
      url, title: t.title(year), desc: t.desc(year, out.length, acts.size), keywords: '',
      schemas, hero, body, lang, alts: altsFor(lang, year),
      homeHref: '/kpop', brand: '🎤 Korea<span>Plus</span>',
    }));
    return url;
  }

  return {
    YEARS,
    buildYear,
    urls() {
      const out = [];
      for (const y of YEARS) {
        for (const lang of LANGS) {
          const u = buildYear(y, lang);
          if (u) out.push({ lang, url: u });
        }
      }
      return out;
    },
  };
};
