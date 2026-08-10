/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-member.cjs — individual K-pop member profile pages.

   ONE page per (member × language). Members come from CTX.ENRICH `bdays`
   tuples — [[memberName, "YYYY-MM-DD"], ...] keyed by group id — joined to
   the group/act metadata in CTX.ROSTER on the shared `id`. ~191 members ×
   every K-pop channel language that has a complete string set.

   CONTENT POLICY — fabrication 0:
   - Only verified, publicly known facts are surfaced: member name, birthday
     (from ENRICH), the act they belong to, agency and group debut (ROSTER).
   - Western zodiac sign + Chinese-zodiac animal are DERIVED purely from the
     verified birthday via ctx.derive (never re-implemented here).
   - Chinese zodiac uses the solar birth year (simple rule); Jan/early-Feb
     births are flagged `approx` and a localized hedge line is added.
   - No private/biographical speculation, no rankings, no opinions.

   JSON-LD: ctx.ld.personLD (birthDate emitted ONLY when verified ISO),
   with memberOf set to the MusicGroup, + breadcrumbLD + (FAQ) faqLD.

   Channel: K-pop (homeHref '/kpop', brand '🎤 KoreaPlus', breadcrumb root
   /kpop). Output accumulates into __out.kpop.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const { T, SIGN_NAMES, ANIMAL_NAMES, MONTH_NAMES } = require('./seo-kpop-member-l10n.js');
const chrome = require('./seo-kpop-chrome.cjs');

// The K-pop channel rolls out locales ahead of the rest of the site, so it has
// its own list. Tolerate its absence: this cluster must keep building while
// that file is being introduced.
let CHANNEL_LANGS;
try { CHANNEL_LANGS = require('./seo-langs-kpop.cjs'); }
catch { CHANNEL_LANGS = require('./seo-langs.cjs'); }

// Renderable languages, en first (x-default): every string map a profile reads
// must be present. One short of that and the page ships an English birthday,
// sign or animal under its own hreflang. The alts list is built from this same
// constant, so an advertised alternate always has a page behind it.
const LANGS = CHANNEL_LANGS.filter(l => T[l] && SIGN_NAMES[l] && ANIMAL_NAMES[l] && MONTH_NAMES[l]);

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, slug, bcHtml, keyFactsBox, affBlock, ROSTER, ENRICH, ld, derive } = ctx;

  // dir prefix for a language (en → '', else '<dir>/'). Never hardcode.
  const dir = (lang) => lang === 'en' ? '' : ((L10N[lang] && L10N[lang].dir) || lang) + '/';

  // Build the flat member list once: join ENRICH bdays × ROSTER meta.
  // Each entry: { mid (slug key for member), name, birthday|null, act:ROSTER row }.
  const MEMBERS = [];
  for (const act of (ROSTER || [])) {
    const enr = (ENRICH || {})[act.id];
    const bdays = (enr && Array.isArray(enr.bdays)) ? enr.bdays : [];
    if (!bdays.length) continue;
    for (const tup of bdays) {
      const name = Array.isArray(tup) ? tup[0] : (tup && tup.name);
      const birthday = Array.isArray(tup) ? tup[1] : (tup && tup.birthday);
      if (!name) continue;
      MEMBERS.push({
        name,
        birthday: (typeof birthday === 'string' && derive.parseDate(birthday)) ? birthday : null,
        act,
      });
    }
  }

  // Stable unique slug per member: "<member>-<group>-member".
  // Group id is included so same-named members across acts never collide
  // (e.g. Mark/Haechan in nct127 vs nctdream).
  const memberSlug = (mem) => `${slug(mem.name)}-${slug(mem.act.id)}-member`;

  // Format a YYYY-MM-DD birthday into localized "Month D, YYYY" style text.
  // The generic "D Month YYYY" tail is not universal, and this is the single
  // most-read fact on the page: two locales need their own shape.
  function fmtBday(birthday, lang) {
    const p = derive.parseDate(birthday);
    if (!p) return null;
    const mn = (MONTH_NAMES[lang] || MONTH_NAMES.en)[p.m - 1];
    if (lang === 'ja' || lang === 'zh') return `${p.y}年${mn}${p.d}日`;
    if (lang === 'ko') return `${p.y}년 ${mn} ${p.d}일`;
    // Russian: a day number governs the GENITIVE month, and the year is closed
    // with "года". «11 апрель 2000» (nominative) is flatly ungrammatical.
    if (lang === 'ru') {
      const gen = chrome.monthGenitive('ru', p.m - 1);
      if (gen) return `${p.d} ${gen} ${p.y} года`;
    }
    // Vietnamese: MONTH_NAMES.vi already contains the word "Tháng", so the
    // generic tail produced "16 Tháng 1 1996" — three numerals with no grammar
    // holding them together, and ambiguous when the day is small. Vietnamese
    // writes d/m/yyyy.
    if (lang === 'vi') return `${p.d}/${p.m}/${p.y}`;
    // Western style: Month D, YYYY (en) / D Month YYYY (others)
    if (lang === 'en') return `${mn} ${p.d}, ${p.y}`;
    return `${p.d} ${mn} ${p.y}`;
  }

  // The act's localized display name. ROSTER carries nameEn / nameKo; for
  // ko we prefer the Korean name when present, otherwise the English name.
  const actName = (act, lang) => (lang === 'ko' && act.nameKo) ? act.nameKo : act.nameEn;

  // Build one member page for one language. Returns the URL, or null when the
  // language is missing any of the string maps this page reads — the same test
  // LANGS applies, restated here because buildMember is also called directly.
  function buildMember(mem, lang) {
    const t = T[lang];
    if (!t || !SIGN_NAMES[lang] || !ANIMAL_NAMES[lang] || !MONTH_NAMES[lang]) return null;

    const isSolo = mem.act.type === 'soloist';
    const m = mem.name;
    const g = actName(mem.act, lang);
    const url = `${BASEP}${dir(lang)}kpop/${memberSlug(mem)}.html`;
    const enUrl = `${BASEP}kpop/${memberSlug(mem)}.html`;

    // ── derived facts (pure, from verified birthday only) ──
    const sign = mem.birthday ? derive.signOf(mem.birthday) : null;
    const cz = mem.birthday ? derive.cnZodiacOf(mem.birthday) : null;
    const signName = sign ? ((SIGN_NAMES[lang] || SIGN_NAMES.en)[sign.key] || sign.name) : null;
    const animalName = cz ? ((ANIMAL_NAMES[lang] || ANIMAL_NAMES.en)[cz.key] || cz.name) : null;

    // ── hero / heads ──
    const h1 = isSolo ? `${m} — ${t.badge}` : t.h1(m, g);
    const title = isSolo ? `${m}: ${t.fBirthday} · ${t.fSign} | KoreaPlus` : t.title(m, g);
    const desc = isSolo ? t.soloDesc(m) : t.desc(m, g);

    // ── breadcrumb (root = /kpop hub) ──
    const trail = [{ name: 'K-Pop', url: '/kpop' }, { name: isSolo ? m : `${m} (${g})`, url }];
    let body = bcHtml(trail);
    body += `<p class="lead">${esc(isSolo ? t.soloLead(m) : t.lead(m, g))}</p>`;

    // ── key facts box ──
    const facts = [];
    if (!isSolo) facts.push(`🎤 ${esc(t.fGroup)}: ${esc(g)}`);
    facts.push(`🏢 ${esc(t.fAgency)}: ${esc(mem.act.agency)}`);
    if (mem.birthday) facts.push(`🎂 ${esc(t.fBirthday)}: ${esc(fmtBday(mem.birthday, lang))}`);
    if (signName && sign) facts.push(`${sign.emoji} ${esc(t.fSign)}: ${esc(signName)}`);
    if (animalName && cz) facts.push(`${cz.emoji} ${esc(t.fZodiac)}: ${esc(animalName)}`);
    facts.push(`🗓️ ${esc(isSolo ? t.fActDebut : t.fDebut)}: ${esc(chrome.chipDate(lang, mem.act.debut))}`);
    if (mem.act.fandom) facts.push(`💗 ${esc(t.fFandom)}: ${esc(mem.act.fandom)}`);
    body += keyFactsBox(facts);

    // ── birthday section ──
    body += `<h2>${t.hBirthday}</h2>`;
    if (mem.birthday) body += `<p>${esc(t.bornLine(m, fmtBday(mem.birthday, lang)))}</p>`;
    else body += `<p>${esc(t.noBday(m))}</p>`;

    // ── zodiac section (only when we have a verified birthday) ──
    if (sign || cz) {
      body += `<h2>${t.hZodiac}</h2>`;
      if (sign && signName) body += `<p>${t.signLine(esc(m), esc(signName), sign.emoji)}</p>`;
      if (cz && animalName) {
        body += `<p>${t.zodiacLine(esc(m), esc(animalName), cz.emoji)}</p>`;
        if (cz.approx) body += `<p style="color:var(--text2,#9fb0c3);font-size:13.5px">⚠️ ${esc(t.hedge)}</p>`;
      }
    }

    // ── group / career section ──
    if (isSolo) {
      body += `<h2>${t.hSolo}</h2><p>${t.soloCareer(esc(m), esc(mem.act.agency), esc(chrome.chipDate(lang, mem.act.debut)))}</p>`;
    } else {
      body += `<h2>${t.hGroup}</h2><p>${t.groupLine(esc(m), esc(g), esc(mem.act.agency), esc(chrome.chipDate(lang, mem.act.debut)))}</p>`;
      // Cross-links to the other members of the same act (internal linking).
      const sibs = MEMBERS.filter(o => o.act.id === mem.act.id && o.name !== mem.name);
      if (sibs.length) {
        body += `<h2>${t.hMore}</h2><div class="seo-linklist">`
          + sibs.map(o => `<a href="${dir(lang)}kpop/${memberSlug(o)}.html">${mem.act.emoji || '🎤'} ${esc(o.name)}</a>`).join('')
          + `<a href="${dir(lang)}kpop/browse.html">📚 ${esc(g)}</a></div>`;
      }
    }

    // ── FAQ ──
    const qa = [];
    if (mem.birthday) qa.push([t.qBday(m), t.aBday(m, fmtBday(mem.birthday, lang))]);
    else qa.push([t.qBday(m), t.aBdayNone(m)]);
    if (signName) qa.push([t.qSign(m), t.aSign(m, signName)]);
    qa.push([t.qGroup(m), isSolo ? t.aSolo(m) : t.aGroup(m, g)]);
    body += `<h2>${t.hFaq}</h2><div class="seo-faq">`
      + qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')
      + `</div>`;

    body += affBlock({ city: 'Seoul', cat: 'general', q: '', lang });

    // ── JSON-LD: Person (birthDate only when verified), memberOf MusicGroup ──
    const person = ld.personLD({
      name: m,
      birthDate: mem.birthday || undefined,
      jobTitle: isSolo ? 'Singer' : 'Singer',
      memberOf: isSolo ? undefined : mem.act.nameEn,
      url,
    });
    const schemas = [person, ld.breadcrumbLD(trail), ld.faqLD(qa)].filter(Boolean);

    // ── hreflang alts: en is x-default; LANGS only, so every alt has a page ──
    const others = LANGS.filter(l => l !== lang);
    const alts = lang === 'en'
      ? others.map(l => ({ lang: l, url: `${BASEP}${dir(l)}kpop/${memberSlug(mem)}.html` }))
      : [{ lang: 'en', url: enUrl }, ...others.filter(l => l !== 'en').map(l => ({ lang: l, url: `${BASEP}${dir(l)}kpop/${memberSlug(mem)}.html` }))];

    const hero = `<header class="seo-hero"><span class="emoji">${mem.act.emoji || '🎤'}</span><h1>${esc(h1)}</h1>`
      + `<div class="meta"><span class="seo-badge">${esc(t.badge)}</span>`
      + (signName ? `<span class="seo-badge">${sign.emoji} ${esc(signName)}</span>` : '')
      + `</div></header>`;

    writePage(`${dir(lang)}kpop/${memberSlug(mem)}.html`, shell({
      url, title, desc, keywords: '', schemas, hero, body, lang, alts,
      homeHref: '/kpop', brand: '🎤 Korea<span>Plus</span>',
    }));
    return url;
  }

  return {
    buildMember,
    // Diagnostics for the integrator: how many members were joined.
    memberCount: MEMBERS.length,
    urls() {
      return MEMBERS.flatMap(mem => LANGS.map(lang => {
        const u = buildMember(mem, lang);
        return u ? { lang, url: u } : null;
      })).filter(Boolean);
    },
  };
};
