/* ══════════════════════════════════════════════════════════════════
   modules/seo-stay.cjs — "Where to Stay in {city}" accommodation-area
   guides for cities BEYOND the original Seoul/Busan/Jeju trio (those stay
   frozen in build-seo.cjs's STAY literal + buildStay; this module never
   touches them).

   CommonJS factory: module.exports = function(ctx){ ... }. The single ctx
   object is the only dependency — no build-seo helpers are required
   directly. Consumes korea-stay-areas.json (stayAreas) for the English
   source and korea-stay-l10n.json for localized frames + area prose.

   Output channel: out.main (travel/default channel, homeHref default).
   Slug: guide/where-to-stay-in-{city}.html  (+ {dir}/ prefix per locale).

   i18n contract: a localized page is emitted for a city+lang ONLY when the
   l10n file carries both the UI frame for that lang AND a per-city area
   translation (cities[key].areas) — so no mixed-language pages and
   hreflang only links real translations. English is always emitted.

   No fabrication: districts/atmosphere/transit orientation only — no hotel
   brands, no prices, no invented claims (mirrors the source JSON).
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, slug, bcHtml, keyFactsBox, affBlock, ld, TODAY } = ctx;
  const ORIGIN = 'https://koreaplus-lifes.com'; // matches build-seo ORIGIN (ld defaults to same)

  // ── Load data (graceful: missing files → no pages, never throw) ──────
  const ROOT = path.join(__dirname, '..');
  let STAY_AREAS = [];
  try { STAY_AREAS = JSON.parse(fs.readFileSync(path.join(ROOT, 'korea-stay-areas.json'), 'utf8')).stayAreas || []; } catch { STAY_AREAS = []; }
  let L10N_STAY = {};
  try { L10N_STAY = JSON.parse(fs.readFileSync(path.join(ROOT, 'korea-stay-l10n.json'), 'utf8')); } catch { L10N_STAY = {}; }

  const cityKey = c => String(c).toLowerCase();
  const urlFor = (city, lang) => `${BASEP}${lang === 'en' ? '' : L10N[lang].dir + '/'}guide/where-to-stay-in-${slug(city)}.html`;

  // Localized display name (falls back to English city name).
  const nameFor = (city, lang) => (lang === 'en' ? city : ((L10N_STAY[lang] && L10N_STAY[lang].ui && L10N_STAY[lang].ui.name && L10N_STAY[lang].ui.name[city]) || city));

  // {c}-token substitution for the localized UI strings.
  const fill = (tpl, c) => String(tpl == null ? '' : tpl).replace(/\{c\}/g, c);

  // Which languages have a usable translation for THIS city (frame + areas).
  function langsFor(city) {
    const key = cityKey(city);
    const out = ['en'];
    for (const lang of Object.keys(L10N_STAY)) {
      if (lang.startsWith('_')) continue;
      const L = L10N_STAY[lang];
      if (L && L.ui && L.cities && L.cities[key] && Array.isArray(L.cities[key].areas) && L.cities[key].areas.length) out.push(lang);
    }
    return out;
  }

  // hreflang cluster: every emitted lang for this city EXCEPT the current one.
  function altsFor(city, lang) {
    return langsFor(city).filter(l => l !== lang).map(l => ({ lang: l, url: urlFor(city, l) }));
  }

  // ── Resolve the content (areas + frame strings) for a city+lang ──────
  function resolve(rec, lang) {
    const city = rec.city;
    const dispName = nameFor(city, lang);
    if (lang === 'en') {
      return {
        dispName,
        areas: rec.areas,
        intro: rec.intro || `Choosing the right area makes ${city} far easier to explore. Here are the best neighborhoods to stay in, by travel style.`,
        h1: `Where to Stay in ${dispName}: Best Areas & Neighborhoods`,
        titleSuffix: ' (2026) | KoreaPlus',
        desc: `Where to stay in ${dispName}: the best neighborhoods for first-timers, nightlife, budget and nature lovers — with transit tips for choosing your base.`,
        areasH: `🏨 Best Areas to Stay in ${dispName}`,
        faqH: '❓ FAQ',
        q1: `What is the best area to stay in ${dispName} for first-timers?`,
        q2: `Where should I stay in ${dispName} on a budget?`,
        badge: 'areas',
        crumbStay: 'Where to Stay',
        crumbHome: 'Home',
      };
    }
    const L = L10N_STAY[lang];
    const ui = (L && L.ui) || {};
    const areas = (L.cities[cityKey(city)] || {}).areas || rec.areas;
    return {
      dispName,
      areas,
      intro: fill(ui.lead, dispName),
      h1: fill(ui.h1, dispName),
      titleSuffix: ui.titleSuffix || ' (2026) | KoreaPlus',
      desc: fill(ui.desc, dispName),
      areasH: fill(ui.areasH, dispName),
      faqH: ui.faqH || '❓ FAQ',
      q1: fill(ui.q1, dispName),
      q2: fill(ui.q2, dispName),
      badge: ui.badge || 'areas',
      crumbStay: ui.crumbStay || 'Where to Stay',
      crumbHome: ui.crumbHome || 'Home',
    };
  }

  // Best budget-leaning answer for the FAQ (objective: pick the area whose
  // why-text mentions budget/affordable/transit; else the last area).
  function budgetArea(areas) {
    const hit = areas.find(a => /budget|affordable|economic|经济|割安|저렴|économique|presupuesto/i.test(a[1]));
    return hit || areas[areas.length - 1] || areas[0];
  }

  // ── Page builder ────────────────────────────────────────────────────
  function buildStayCity(cityArg, lang) {
    const key = cityKey(cityArg);
    const rec = STAY_AREAS.find(s => cityKey(s.city) === key);
    if (!rec || !Array.isArray(rec.areas) || !rec.areas.length) return null;
    // Only emit a localized page when that lang is translated for this city.
    if (lang !== 'en' && !langsFor(rec.city).includes(lang)) return null;

    const c = resolve(rec, lang);
    const url = urlFor(rec.city, lang);
    const title = `${c.h1}${c.titleSuffix}`;
    const alts = altsFor(rec.city, lang);

    const trail = [
      { name: c.crumbHome, url: BASEP },
      { name: c.dispName, url: BASEP },
      { name: c.crumbStay, url },
    ];

    let body = bcHtml(trail);
    body += keyFactsBox([`📍 ${esc(c.dispName)} (${esc(rec.kr)})`, `🏨 ${c.areas.length} ${esc(c.badge)}`]);
    body += `<p class="lead">${esc(c.intro)}</p>`;
    body += `<h2>${c.areasH}</h2>`;
    c.areas.forEach(([area, why]) => {
      body += `<h3>${esc(area)}</h3><p>${esc(why)}</p>`;
    });

    // Hotel affiliate block (Klook). shell auto-injects when omitted, but we
    // place it explicitly with the city so the widget targets the right place.
    if (typeof affBlock === 'function') body += affBlock({ city: rec.city, cat: 'hotel', q: '', lang });

    // FAQ (objective, derived from the area list — no invented facts).
    const first = c.areas[0];
    const budget = budgetArea(c.areas);
    const qa = [
      [c.q1, `${first[0]} — ${first[1]}`],
      [c.q2, `${budget[0]} — ${budget[1]}`],
    ];
    body += `<h2>${c.faqH}</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

    const hero = `<header class="seo-hero"><span class="emoji">🏨</span><h1>${esc(c.h1)}</h1><div class="kr">${esc(rec.kr)}</div><div class="meta"><span class="seo-badge region">${c.areas.length} ${esc(c.badge)}</span></div></header>`;

    // Schemas: Article (verified dates only via ld.compareLD) + breadcrumb +
    // FAQ + an ItemList enumerating the areas. ld helpers drop nulls.
    const article = ld.compareLD({
      headline: c.h1,
      description: c.desc,
      url,
      datePublished: TODAY,
      dateModified: TODAY,
      image: ORIGIN + '/guide/og-image.jpg',
      origin: ORIGIN,
    });
    const itemList = ld.itemListLD(
      c.areas.map(([area, why]) => ({ name: area, description: why })),
      { name: c.areasH, description: c.desc, origin: ORIGIN }
    );
    const schemas = [article, itemList, ld.breadcrumbLD(trail, { origin: ORIGIN }), ld.faqLD(qa)].filter(Boolean);

    writePage(
      `${lang === 'en' ? '' : L10N[lang].dir + '/'}guide/where-to-stay-in-${slug(rec.city)}.html`,
      shell({ url, title, desc: c.desc, keywords: '', schemas, hero, body, lang, alts })
    );
    return url;
  }

  // City keys this module owns (lowercased English names from the source).
  const KEYS = STAY_AREAS.map(s => cityKey(s.city));
  // All langs that ever appear (en + any translated locale present in l10n).
  const ALL_LANGS = ['en', ...Object.keys(L10N_STAY).filter(k => !k.startsWith('_'))];

  return {
    buildStayCity,
    urls() {
      return KEYS.flatMap(k =>
        ALL_LANGS.map(l => {
          const u = buildStayCity(k, l);
          return u ? { lang: l, url: u } : null;
        })
      ).filter(Boolean);
    },
  };
};
