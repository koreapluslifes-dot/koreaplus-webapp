/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-cnzodiac.cjs — "K-pop idols born in the Year of the
   {animal}" pages, one per Chinese-zodiac animal × language.

   Channel: K-pop (homeHref '/kpop', brand '🎤 KoreaPlus', breadcrumb root
   /kpop). Slug: kpop-idols-born-in-the-year-of-the-{animal}.

   DATA: every member birthday lives in ENRICH as bdays tuples
   [memberName, "YYYY-MM-DD"]; the group meta (display name, emoji) comes
   from ROSTER joined by id. Zodiac animal is derived ONLY via
   ctx.derive.cnZodiacOf (solar-year simple rule) — never re-implemented.
   That rule can misclassify Jan/early-Feb births by ±1 animal, so a body
   hedge is always rendered (per derive's caveat).

   FACTS POLICY: only verified public birthdates are listed; nothing is
   invented. A language with no l10n entry is skipped (page not generated).
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const { ANIMAL_KEYS, ANIMAL_NAMES, T } = require('./seo-kpop-cnzodiac-l10n.js');
const chrome = require('./seo-kpop-chrome.cjs');

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, ld, derive } = ctx;

  // The K-pop channel rolls out locales ahead of the rest of the site, so it
  // has its own list. Tolerate its absence: this cluster must keep building
  // while that file is being introduced.
  let CHANNEL_LANGS;
  try { CHANNEL_LANGS = require('./seo-langs-kpop.cjs'); }
  catch { CHANNEL_LANGS = require('./seo-langs.cjs'); }

  // Languages this module can emit = those with a complete string set (both
  // the prose table and the animal names) and, for non-en, a site dir.
  // altsFor() reads the same constant, so an advertised alternate always has a
  // page behind it.
  const LANGS = CHANNEL_LANGS
    .filter(l => T[l] && ANIMAL_NAMES[l] && (l === 'en' || (L10N[l] && L10N[l].dir)));

  // A missing dir falls back to the bare code rather than throwing — and never
  // to '', which is the English path: the localized page would overwrite the
  // English one and both would claim the same <loc>.
  const dirOf = (lang) => (lang === 'en' ? '' : ((L10N[lang] && L10N[lang].dir) || lang) + '/');
  const slugOf = (animal) => `kpop-idols-born-in-the-year-of-the-${animal}`;
  const pathOf = (animal, lang) => `${BASEP}${dirOf(lang)}kpop/${slugOf(animal)}.html`;

  // ── Build the animal → [{name, group, groupEmoji, bday}] index ONCE.
  // Join: ENRICH (member bdays) × ROSTER (group display meta) by id.
  // Idols are grouped by the Chinese-zodiac animal of their solar birth year.
  function buildIndex() {
    const ENRICH = ctx.ENRICH || {};
    const ROSTER = ctx.ROSTER || [];
    const rosterById = new Map(ROSTER.map(r => [r.id, r]));
    const byAnimal = {};            // animalKey → [members]
    ANIMAL_KEYS.forEach(k => { byAnimal[k] = []; });
    let anyApprox = false;

    for (const id of Object.keys(ENRICH)) {
      const e = ENRICH[id];
      const bdays = (e && Array.isArray(e.bdays)) ? e.bdays : [];
      const r = rosterById.get(id);
      // Group display name: prefer roster English name; soloists fall back to
      // the member's own name (handled per-row). Skip rows we can't attribute.
      const groupName = r ? r.nameEn : null;
      const isSolo = r ? r.type === 'soloist' : false;
      const groupEmoji = (r && r.emoji) || '🎤';
      for (const tup of bdays) {
        if (!Array.isArray(tup) || tup.length < 2) continue;
        const name = tup[0];
        const date = tup[1];
        const z = derive.cnZodiacOf(date);      // {key,name,emoji,year,approx}|null
        if (!z || !byAnimal[z.key]) continue;    // invalid/unparseable date → drop
        if (z.approx) anyApprox = true;
        byAnimal[z.key].push({
          name,
          // For soloists the "group" cell is just the act itself; for members
          // it's their group. If no roster join, omit the group cell entirely.
          group: isSolo ? null : groupName,
          groupEmoji,
          bday: date,
          year: z.year,
        });
      }
    }
    // Sort each animal's idols by birthdate (chronological).
    for (const k of ANIMAL_KEYS) byAnimal[k].sort((a, b) => a.bday < b.bday ? -1 : a.bday > b.bday ? 1 : 0);
    return { byAnimal, anyApprox };
  }

  const INDEX = buildIndex();

  // hreflang alternates: x-default = en, plus every language we actually emit.
  function altsFor(animal) {
    return LANGS.map(l => ({ lang: l, url: pathOf(animal, l) }));
  }

  function rowsHtml(members, t) {
    const head = `<tr><th>${esc(t.colName)}</th><th>${esc(t.colGroup)}</th><th>${esc(t.colBday)}</th></tr>`;
    const body = members.map(m => {
      const grp = m.group ? `${m.groupEmoji} ${esc(m.group)}` : `${m.groupEmoji} —`;
      return `<tr><td>${esc(m.name)}</td><td>${grp}</td><td>${esc(m.bday)}</td></tr>`;
    }).join('');
    return `<div style="overflow-x:auto"><table class="seo-table" style="width:100%;border-collapse:collapse;margin:8px 0 18px">`
      + `<thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  }

  // `lang` reaches this only to look the hub label up — it used to end the page
  // with a hardcoded English "🎤 K-Pop Hub" in all 14 languages, and that link
  // is the last thing a reader sees on the way out.
  function otherAnimalsHtml(animal, lang, dir, t, names) {
    const links = ANIMAL_KEYS.filter(k => k !== animal).map(k => {
      const z = derive.CN_ZODIAC.find(x => x.key === k);
      const emoji = z ? z.emoji : '🎴';
      const label = names[k] || k;
      return `<a href="${dir}kpop/${slugOf(k)}.html">${emoji} ${esc(label)}</a>`;
    }).join('');
    return `<h2>${esc(t.otherH)}</h2><div class="seo-linklist">${links}<a href="/kpop">${esc(chrome.hubLabel(lang))}</a></div>`;
  }

  /* buildAnimal(animal, lang) → url string, or null (untranslated lang). */
  function buildAnimal(animal, lang) {
    const t = T[lang];
    const names = ANIMAL_NAMES[lang];
    if (!t || !names) return null;               // no translation → drop page
    const animalName = names[animal] || ANIMAL_NAMES.en[animal];
    const z = derive.CN_ZODIAC.find(x => x.key === animal);
    const emoji = z ? z.emoji : '🎴';
    const dir = dirOf(lang);
    const url = pathOf(animal, lang);
    const members = INDEX.byAnimal[animal] || [];

    const trail = [{ name: 'K-Pop', url: '/kpop' }, { name: t.h1(animalName), url }];
    let body = ctx.bcHtml(trail);
    body += `<p class="lead">${esc(t.lead(animalName))}</p>`;

    // Count chip.
    const countLabel = members.length === 1 ? t.countOne : t.countMany(members.length);
    body += ctx.keyFactsBox([`${emoji} ${esc(animalName)}`, `👥 ${esc(countLabel)}`]);

    // Member table (or an empty-state note).
    if (members.length) body += rowsHtml(members, t);
    else body += `<p>${esc(t.none(animalName))}</p>`;

    // Hedge — the solar-year rule may misclassify Lunar-New-Year-window births.
    body += `<h2>${esc(t.hedgeH)}</h2><p>${esc(t.hedge)}</p>`;

    // Other zodiac years (internal links — every animal reachable).
    body += otherAnimalsHtml(animal, lang, dir, t, names);

    // FAQ.
    const qa = t.faq(animalName);
    if (qa.length) body += `<h2>${esc(chrome.faqHeading(lang))}</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

    // Affiliate block (shell auto-injects if omitted; explicit keeps it inline).
    body += ctx.affBlock({ city: 'Seoul', cat: 'general', q: '', lang });

    const hero = `<header class="seo-hero"><span class="emoji">${emoji}</span><h1>${esc(t.h1(animalName))}</h1>`
      + `<div class="meta"><span class="seo-badge">${esc(t.badge)}</span><span class="seo-badge">K-Pop</span></div></header>`;

    // ── Structured data. ItemList of the idols (Person nodes carry verified
    // birthDate only — every bday in ENRICH is a real ISO date, but personLD
    // re-validates). Plus breadcrumb + FAQ. No fabricated future/realtime data.
    const itemList = ld.itemListLD(
      members.map((m, i) => ({
        name: m.name,
        position: i + 1,
        description: m.group ? `${m.group} · ${m.bday}` : m.bday,
      })),
      { name: t.h1(animalName), description: t.desc(animalName) }
    );
    const schemas = [itemList, ld.breadcrumbLD(trail), ld.faqLD(qa)].filter(Boolean);

    writePage(`${dir}kpop/${slugOf(animal)}.html`, shell({
      url, title: t.title(animalName), desc: t.desc(animalName), keywords: '',
      schemas, hero, body, lang, alts: altsFor(animal),
      homeHref: '/kpop', brand: '🎤 Korea<span>Plus</span>',
    }));
    return url;
  }

  return {
    buildAnimal,
    urls() {
      const out = [];
      for (const animal of ANIMAL_KEYS) {
        for (const lang of LANGS) {
          const u = buildAnimal(animal, lang);
          if (u) out.push({ lang, url: u });
        }
      }
      return out;
    },
  };
};
