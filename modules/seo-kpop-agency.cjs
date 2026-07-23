/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-agency.cjs — K-pop agency artist-guide generator.

   One page per agency × 9 languages, on the K-pop channel (homeHref
   '/kpop', breadcrumb root /kpop). Each page is a factual roster guide:
   the agency's groups & soloists with debut date, members, fandom and
   (when known) lightstick — all sourced from the frozen ROSTER/ENRICH
   data, never fabricated.

   HYBE umbrella: ROSTER labels carry a parent "(HYBE)" suffix for several
   sub-labels (ADOR, BIGHIT MUSIC, PLEDIS, BELIFT LAB, Source Music). These
   are folded under a single "HYBE" agency here. Other agencies map to
   themselves. Agencies with fewer than the minimum roster size are skipped
   (avoids thin single-artist "guide" pages — quality over page count).

   CommonJS factory: module.exports = function(ctx){ ... }.
   Everything comes via ctx — no direct build-seo require.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const L10N_CONTENT = require('./seo-kpop-agency-l10n.js');

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, slug, bcHtml, keyFactsBox, ROSTER, ENRICH, ld } = ctx;

  // Languages this generator can emit (intersection of content l10n + site L10N).
  // en is base; the rest must exist in both L10N (for dir) and L10N_CONTENT.
  const LANGS = require("./seo-langs.cjs")
    .filter(l => L10N_CONTENT[l] && (l === 'en' || (L10N[l] && L10N[l].dir)));

  // Minimum acts for an agency to get its own guide page (thin-content guard).
  const MIN_ACTS = 2;

  // ── Agency umbrella mapping ───────────────────────────────────────
  // Map a raw ROSTER agency string → { key, name } canonical agency.
  // HYBE sub-labels (recognised by the "(HYBE)" parent suffix) all fold
  // into one HYBE agency; everything else maps to itself.
  function umbrella(rawAgency) {
    const raw = String(rawAgency || '').trim();
    if (!raw) return null;
    if (/\(HYBE\)/i.test(raw)) return { key: 'hybe', name: 'HYBE' };
    // Otherwise canonical name = raw string, key = slugified.
    return { key: slug(raw), name: raw };
  }

  // ── Build agency groups from ROSTER (id-joined to ENRICH) ─────────
  // GROUPS: { key: { key, name, acts:[rosterItem...] } }, ordered by acts desc.
  const GROUPS = (() => {
    const byKey = {};
    for (const r of (ROSTER || [])) {
      const u = umbrella(r.agency);
      if (!u) continue;
      if (!byKey[u.key]) byKey[u.key] = { key: u.key, name: u.name, acts: [] };
      byKey[u.key].acts.push(r);
    }
    return byKey;
  })();

  // Eligible agency keys (>= MIN_ACTS), sorted by roster size then name for
  // stable, deterministic output.
  const KEYS = Object.keys(GROUPS)
    .filter(k => GROUPS[k].acts.length >= MIN_ACTS)
    .sort((a, b) => GROUPS[b].acts.length - GROUPS[a].acts.length || GROUPS[a].name.localeCompare(GROUPS[b].name));

  // ── helpers ───────────────────────────────────────────────────────
  const dirOf = lang => (lang === 'en' ? '' : L10N[lang].dir + '/');
  // Page path & url for an agency on the K-pop channel.
  const pathOf = (key, lang) => `${dirOf(lang)}kpop/${key}-kpop-artists-guide.html`;
  const urlOf = (key, lang) => `${BASEP}${pathOf(key, lang)}`;

  // ENRICH join: id → { lightstick?, bdays:[[name,iso]] }.
  const enrichOf = id => (ENRICH && ENRICH[id]) || null;

  // First verified ISO debut date for foundingDate (only emitted if valid).
  function memberLD(rosterItem) {
    // For groups: list member Person nodes; attach a verified birthDate when
    // ENRICH has a matching tuple. For soloists: the single member is the act.
    const e = enrichOf(rosterItem.id);
    const bdayMap = {};
    if (e && Array.isArray(e.bdays)) for (const t of e.bdays) { if (Array.isArray(t) && t[0]) bdayMap[String(t[0]).toLowerCase()] = t[1]; }
    const names = Array.isArray(rosterItem.members) && rosterItem.members.length
      ? rosterItem.members
      : [rosterItem.nameEn];
    return names.map(nm => ({ name: nm, birthDate: bdayMap[String(nm).toLowerCase()] }));
  }

  // ── per-page builder. Returns url or null (no translation / empty). ──
  function buildAgency(key, lang) {
    const grp = GROUPS[key];
    if (!grp || grp.acts.length < MIN_ACTS) return null;
    const T = L10N_CONTENT[lang];
    if (!T) return null;

    const dir = dirOf(lang);
    const url = urlOf(key, lang);
    const acts = grp.acts.slice().sort((a, b) => String(a.debut).localeCompare(String(b.debut)));
    const groups = acts.filter(a => a.type === 'group');
    const solos = acts.filter(a => a.type !== 'group');
    const count = acts.length;

    // ── breadcrumb (K-pop channel root) ──
    const trail = [
      { name: T.crumbHome, url: '/kpop' },
      { name: grp.name, url },
    ];

    // ── body ──
    let body = bcHtml(trail);
    body += `<header class="seo-hero"><span class="emoji">🏢</span><h1>${esc(T.h1(grp.name))}</h1><div class="meta"><span class="seo-badge">K-pop</span><span class="seo-badge">${esc(grp.name)}</span></div></header>`;
    body += `<p class="lead">${esc(T.lead(grp.name))}</p>`;

    // key facts chips
    const facts = [T.factActs(count)];
    if (groups.length) facts.push(T.factGroups(groups.length));
    if (solos.length) facts.push(T.factSolo(solos.length));
    body += keyFactsBox(facts.map(esc));

    // roster cards renderer
    const card = (a) => {
      const e = enrichOf(a.id);
      const rows = [];
      rows.push(`<div><b>${esc(T.type)}:</b> ${esc(a.type === 'group' ? (a.gender === 'girl' ? T.girl : a.gender === 'boy' ? T.boy : T.group) : T.soloist)}</div>`);
      if (a.debut) rows.push(`<div><b>${esc(T.debut)}:</b> ${esc(a.debut)}</div>`);
      if (a.type === 'group' && Array.isArray(a.members) && a.members.length) {
        rows.push(`<div><b>${esc(T.members)}:</b> ${esc(a.members.join(', '))}</div>`);
      }
      if (a.fandom) rows.push(`<div><b>${esc(T.fandom)}:</b> ${esc(a.fandom)}</div>`);
      if (e && e.lightstick) rows.push(`<div><b>${esc(T.lightstick)}:</b> ${esc(e.lightstick)}</div>`);
      const profileHref = `${dir}kpop/${a.id}-profile.html`;
      return `<article class="seo-card" style="display:block;padding:14px 16px;margin:0 0 12px;background:var(--card,rgba(255,255,255,.04));border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px">`
        + `<h3 style="margin:0 0 8px">${a.emoji ? esc(a.emoji) + ' ' : ''}${esc(a.nameEn)}${a.nameKo ? ` <span style="color:var(--text2,#9fb0c3);font-weight:400">${esc(a.nameKo)}</span>` : ''}</h3>`
        + `<div style="font-size:13.5px;line-height:1.7;display:flex;flex-direction:column;gap:2px">${rows.join('')}</div>`
        + `<p style="margin:9px 0 0"><a href="${profileHref}">${esc(T.coGuide)} →</a></p>`
        + `</article>`;
    };

    body += `<h2>${esc(T.rosterH)}</h2>`;
    if (groups.length) {
      body += `<h3>${esc(T.groupsH)}</h3>` + groups.map(card).join('');
    }
    if (solos.length) {
      body += `<h3>${esc(T.soloistsH)}</h3>` + solos.map(card).join('');
    }

    // FAQ (objective only)
    const actNames = acts.map(a => a.nameEn).join(', ');
    const qaRaw = T.faq(grp.name, actNames);
    // Drop the HYBE-specific Q for non-HYBE agencies.
    const qa = qaRaw.filter((pair, i) => !(i === 1 && key !== 'hybe'));
    if (qa.length) {
      body += `<h2>${esc(T.faqH)}</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
    }

    // sourcing/scope note
    body += `<p style="font-size:12.5px;color:var(--text2,#9fb0c3);margin:18px 0 0">${esc(T.note)}</p>`;

    // related links — sibling agency guides + hub
    const sibs = KEYS.filter(k => k !== key).slice(0, 8);
    body += `<h2>${esc(T.relH)}</h2><div class="seo-linklist">`
      + sibs.map(k => `<a href="${urlOf(k, lang).replace(BASEP, '')}">🏢 ${esc(GROUPS[k].name)}</a>`).join('')
      + `<a href="/kpop">🎤 ${esc(T.relHub)}</a></div>`;

    // ── schemas: ItemList of MusicGroup-style entries + breadcrumb + FAQ ──
    const items = acts.map(a => ({
      name: a.nameEn,
      url: urlOf(key, lang).replace(BASEP, BASEP) + `#${slug(a.id)}`,
      description: [a.type === 'group' ? (a.gender === 'girl' ? T.girl : a.gender === 'boy' ? T.boy : T.group) : T.soloist,
        a.debut ? `${T.debut} ${a.debut}` : ''].filter(Boolean).join(' · '),
    }));
    const itemList = ld.itemListLD(items, { name: T.h1(grp.name), description: T.desc(grp.name, count) });

    // Per-act MusicGroup nodes (verified members/birthDates only).
    const musicNodes = acts.map(a => ld.musicGroupLD({
      name: a.nameEn,
      alternateName: a.nameKo || undefined,
      genre: Array.isArray(a.genres) && a.genres.length ? a.genres : undefined,
      foundingDate: a.debut,
      sameAs: a.wikidataId ? [`https://www.wikidata.org/wiki/${a.wikidataId}`] : undefined,
      members: memberLD(a),
    })).filter(Boolean);

    const schemas = [itemList, ...musicNodes, ld.breadcrumbLD(trail)];
    if (qa.length) schemas.push(ld.faqLD(qa));
    const cleanSchemas = schemas.filter(Boolean);

    // ── hreflang alts: only languages we actually emit ──
    const others = LANGS.filter(l => l !== lang);
    const altUrl = l => urlOf(key, l);
    const alts = lang === 'en'
      ? others.map(l => ({ lang: l, url: altUrl(l) }))
      : [{ lang: 'en', url: altUrl('en') }, ...others.filter(l => l !== 'en').map(l => ({ lang: l, url: altUrl(l) }))];

    writePage(pathOf(key, lang), shell({
      url,
      title: `${grp.name} — ${T.titleSuffix}`,
      desc: T.desc(grp.name, count),
      keywords: '',
      schemas: cleanSchemas,
      hero: '',
      body,
      lang,
      alts,
      homeHref: '/kpop',
      brand: '🎤 Korea<span>Plus</span>',
    }));
    return url;
  }

  return {
    buildAgency,
    AGENCY_KEYS: KEYS,
    urls() {
      const out = [];
      for (const key of KEYS) {
        for (const lang of LANGS) {
          const u = buildAgency(key, lang);
          if (u) out.push({ lang, url: u });
        }
      }
      return out;
    },
  };
};
