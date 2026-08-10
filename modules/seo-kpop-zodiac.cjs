/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-zodiac.cjs — "K-pop idols by Western star sign".

   12 sun signs × every channel language with a complete string set.
   Slug: kpop-idols-with-<sign>-star-sign  (e.g. kpop-idols-with-aries-star-sign)

   DATA JOIN (zero fabrication):
     • ENRICH (ctx.ENRICH, keyed by group id) carries member birthdays as
       `bdays: [[memberName, "YYYY-MM-DD"], ...]`.
     • ctx.derive.signOf(birthday) → {key,name,emoji} buckets each member.
     • ROSTER (ctx.ROSTER) is joined by the same group `id` to get the group's
       display name (nameEn) + emoji. Members with no resolvable group or no
       valid date are dropped (never guessed).
   Only objective facts are listed (idol stage name, group, birthday). The
   personality "traits" are explicitly framed as popular-astrology archetypes
   for the SIGN, not factual claims about any person.

   schemas = [ itemListLD (the idol list), breadcrumbLD, faqLD ].
   Channel: K-pop → homeHref '/kpop', breadcrumb root '/kpop',
            brand '🎤 Korea<span>Plus</span>'.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const { T, TRAITS, SIGN_NAMES, DATE_RANGES } = require('../seo-kpop-zodiac-l10n.js');

// The K-pop channel rolls out locales ahead of the rest of the site, so it has
// its own list. Tolerate its absence: this cluster must keep building while
// that file is being introduced.
let CHANNEL_LANGS;
try { CHANNEL_LANGS = require('./seo-langs-kpop.cjs'); }
catch { CHANNEL_LANGS = require('./seo-langs.cjs'); }

// Canonical sign order (matches ctx.derive.SIGNS keys; this is also the
// page-iteration / slug order).
const SIGN_ORDER = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, ld, derive } = ctx;
  const ORIGIN = 'https://koreaplus-lifes.com';
  const KPOP_HOME = '/kpop';
  const KPOP_BRAND = '🎤 Korea<span>Plus</span>';

  // Languages we can fully render: every string map this page reads must be
  // present. One short of that and the page ships English prose (traits, sign
  // name, date range) under its own hreflang. altsFor() reads the same
  // constant, so an advertised alternate always has a page behind it.
  const LANGS = CHANNEL_LANGS.filter(l => T[l] && TRAITS[l] && SIGN_NAMES[l] && DATE_RANGES[l]);

  // ── Build the sign→members index ONCE (language-independent facts) ──
  // Each bucket: [{ idol, group, groupEmoji, groupId, birthday }] sorted by
  // birthday (month/day then year), deduped on idol+group.
  const ROSTER = Array.isArray(ctx.ROSTER) ? ctx.ROSTER : [];
  const ENRICH = ctx.ENRICH && typeof ctx.ENRICH === 'object' ? ctx.ENRICH : {};
  const rosterById = {};
  for (const g of ROSTER) { if (g && g.id) rosterById[g.id] = g; }

  const bySign = {};
  for (const k of SIGN_ORDER) bySign[k] = [];

  for (const groupId of Object.keys(ENRICH)) {
    const grp = rosterById[groupId];
    if (!grp) continue; // no verified group meta → skip (no fabrication)
    const bdays = ENRICH[groupId] && ENRICH[groupId].bdays;
    if (!Array.isArray(bdays)) continue;
    for (const tup of bdays) {
      if (!Array.isArray(tup) || tup.length < 2) continue;
      const idol = String(tup[0] || '').trim();
      const birthday = String(tup[1] || '').trim();
      if (!idol) continue;
      const sign = derive.signOf(birthday); // null on invalid date
      if (!sign || !bySign[sign.key]) continue;
      bySign[sign.key].push({
        idol,
        group: grp.nameEn || grp.id,
        groupEmoji: grp.emoji || '',
        groupId,
        birthday, // verified ISO "YYYY-MM-DD"
      });
    }
  }
  // Sort each bucket by month/day (then year) for stable, calendar-ordered tables.
  for (const k of SIGN_ORDER) {
    bySign[k].sort((a, b) => {
      const am = a.birthday.slice(5), bm = b.birthday.slice(5); // MM-DD
      if (am !== bm) return am < bm ? -1 : 1;
      return a.birthday < b.birthday ? -1 : (a.birthday > b.birthday ? 1 : 0);
    });
  }

  // localized sign object {key,name,emoji}
  function signObj(key, lang) {
    const base = derive.SIGNS.find(s => s.key === key);
    const name = (SIGN_NAMES[lang] && SIGN_NAMES[lang][key]) || (base && base.name) || key;
    return { key, name, emoji: base ? base.emoji : '⭐' };
  }

  // path/url for a given sign + lang (dir hardcoding forbidden → via L10N).
  // A missing dir falls back to the bare code, never to '': '' is the English
  // path, so the localized page would overwrite the English one and both would
  // claim the same <loc>.
  function pathFor(key) { return `kpop-idols-with-${key}-star-sign.html`; }
  function urlFor(key, lang) {
    const dir = lang === 'en' ? '' : (L10N[lang] && L10N[lang].dir ? L10N[lang].dir + '/' : lang + '/');
    return `${BASEP}${dir}${pathFor(key)}`;
  }

  // hreflang alternates. A sign with no verified members is dropped in every
  // language, so the cluster is all-of-LANGS or nothing — same set the build
  // loop writes.
  function altsFor(key) {
    if (!bySign[key] || !bySign[key].length) return [];
    return LANGS.map(l => ({ lang: l, url: urlFor(key, l) }));
  }

  function buildZodiac(key, lang) {
    const t = T[lang];
    const dates = DATE_RANGES[lang];
    if (!t || !dates) return null;             // no translation → drop
    const members = bySign[key];
    if (!members || !members.length) return null; // nothing verified → drop

    const s = signObj(key, lang);
    const n = members.length;
    const groupCount = new Set(members.map(m => m.groupId)).size;
    const url = urlFor(key, lang);
    const alts = altsFor(key);
    const traitStr = (TRAITS[lang] && TRAITS[lang][key]) || (TRAITS.en[key] || '');

    // ── Hero ──
    const hero = `<header class="seo-hero">
      <div class="seo-hero-emoji" aria-hidden="true" style="font-size:46px">${s.emoji}🎤</div>
      <h1>${esc(t.h1(s))}</h1>
      <p class="seo-hero-sub">${esc(t.lead(s, n))}</p>
    </header>`;

    // ── Breadcrumb (K-pop channel root) ──
    const trail = [
      { name: t.hub, url: KPOP_HOME },
      { name: t.dir, url },
    ];

    // ── Key facts chips ──
    const facts = ctx.keyFactsBox([
      t.factSign(s),
      t.factN(n),
      t.factGroups(groupCount),
      `📅 ${esc(t.datesLabel)}: ${esc(dates[key])}`,
    ]);

    // ── Traits chip line (clearly archetype, not personal claim) ──
    const traitsHtml = traitStr
      ? `<p style="margin:0 0 18px;font-size:14px;color:var(--text2,#aab)"><strong>${esc(t.traitsLabel)}:</strong> ${esc(traitStr)}</p>`
      : '';

    // ── Idol table (objective facts only) ──
    const rows = members.map(m => `<tr>
      <td>${esc(m.idol)}</td>
      <td>${m.groupEmoji ? esc(m.groupEmoji) + ' ' : ''}${esc(m.group)}</td>
      <td>${esc(m.birthday)}</td>
    </tr>`).join('');
    const table = `<div style="overflow-x:auto;margin:0 0 22px">
      <table class="seo-table" style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr>
          <th style="text-align:left;padding:8px 10px;border-bottom:2px solid var(--border,rgba(255,255,255,.12))">${esc(t.colIdol)}</th>
          <th style="text-align:left;padding:8px 10px;border-bottom:2px solid var(--border,rgba(255,255,255,.12))">${esc(t.colGroup)}</th>
          <th style="text-align:left;padding:8px 10px;border-bottom:2px solid var(--border,rgba(255,255,255,.12))">${esc(t.colBday)}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

    // ── FAQ (examples = up to 3 "Idol (Group)") ──
    const examples = members.slice(0, 3).map(m => `${m.idol} (${m.group})`);
    const qa = t.faq(s, n, examples);
    const faqHtml = `<section><h2>FAQ</h2>` + qa.map(([q, a]) =>
      `<details class="seo-faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('') + `</section>`;

    // ── Disclaimer (sun signs = popular astrology) ──
    const note = `<p style="margin:22px 0 0;font-size:12.5px;color:var(--text3,#889)">ℹ️ ${esc(t.astroNote)}</p>`;

    const body = `${ctx.bcHtml(trail)}
${facts}
${traitsHtml}
<h2>${esc(t.memberH(s))}</h2>
${table}
${faqHtml}
${note}`;

    // ── Schemas: ItemList (idols) + Breadcrumb + FAQ. itemList carries the
    //    objective idol facts (name + description "Group · birthday"). ──
    const listLD = ld.itemListLD(
      members.map(m => ({
        name: m.idol,
        description: `${m.group} · ${m.birthday}`,
      })),
      { name: t.h1(s), description: t.metaDesc(s, n), origin: ORIGIN },
    );
    const bcLD = ld.breadcrumbLD(trail, { origin: ORIGIN });
    const fLD = ld.faqLD(qa);
    const schemas = [listLD, bcLD, fLD].filter(Boolean);

    const html = shell({
      url, title: t.title(s), desc: t.metaDesc(s, n), keywords: '',
      schemas, hero, body, lang, alts,
      homeHref: KPOP_HOME, brand: KPOP_BRAND,
    });
    writePage(url.replace(BASEP, ''), html);
    return url;
  }

  return {
    buildZodiac,
    urls() {
      const out = [];
      for (const key of SIGN_ORDER) {
        for (const lang of LANGS) {
          const u = buildZodiac(key, lang);
          if (u) out.push({ lang, url: u });
        }
      }
      return out;
    },
  };
};
