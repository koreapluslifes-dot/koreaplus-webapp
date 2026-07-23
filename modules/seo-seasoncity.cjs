/* ══════════════════════════════════════════════════════════════════
   modules/seo-seasoncity.cjs — programmatic SEO generator for
   "cherry-blossom-in-{city}" and "autumn-foliage-in-{city}" pages.

   One factory, CTX-only dependency (per the frozen interface contract).
   Builds, for a hand-picked set of cities whose seasonal scenery is
   genuinely differentiated, two pages per city (spring cherry blossom +
   autumn foliage) in up to 9 languages each.

   ── Anti-fabrication rules honored here ──────────────────────────────
   • Only TYPICAL (평년 / climatological) bloom & peak-color WINDOWS are
     stated — never a year-specific forecast. Every window carries an
     explicit "varies by year" hedge in body + FAQ.
   • Spot names are well-known, objectively existing public places
     (parks, lakes, mountains, fortress walls). No invented venues,
     no fabricated dates, no subjective ranking claims.
   • Cities are joined to CITY_L10N for the localized DISPLAY name and to
     pull the existing localized "things to do" reciprocal link. Seasonal
     spot lists are a curated factual subset kept here (CITY_L10N does not
     carry season-specific scenery), so they are NOT re-derived.

   Internal links point back to the existing seasons hub (seasons.html)
   and the season landing pages (guide/korea-in-{spring|autumn}.html).
   out → main channel (travel), homeHref default.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const L10N_STRINGS = require('./seo-seasoncity-l10n.js');

/* Curated, factual seasonal scenery. Each city entry:
   - cityKey : exact CITY_L10N / display key (joins for localized name)
   - emoji   : page hero emoji (season emoji used, cityKey only for join)
   - cherry  : { windowEn, spots:[..], note? }  (omit → no cherry page)
   - autumn  : { windowEn, spots:[..], note? }  (omit → no autumn page)
   windowEn is the English typical-window phrase; per-language phrasing is
   produced by WINDOW_L10N keyed on a short windowKey so we never machine-
   translate. spots are objectively existing public places. */
const WINDOW_KEYS = {
  // spring (cherry) — typical Korean blossom progresses south→north
  'late-mar-early-apr': {
    en: 'late March to early April',
    ja: '3月下旬〜4月上旬', zh: '3月下旬至4月上旬', es: 'finales de marzo a principios de abril',
    ko: '3월 말~4월 초', fr: 'fin mars à début avril', de: 'Ende März bis Anfang April',
    pt: 'fim de março a início de abril', id: 'akhir Maret hingga awal April',
  },
  'early-mid-apr': {
    en: 'early to mid-April',
    ja: '4月上旬〜中旬', zh: '4月上旬至中旬', es: 'principios a mediados de abril',
    ko: '4월 초~중순', fr: 'début à mi-avril', de: 'Anfang bis Mitte April',
    pt: 'início a meados de abril', id: 'awal hingga pertengahan April',
  },
  // autumn (foliage) — mountains color earlier, cities later
  'mid-late-oct': {
    en: 'mid to late October',
    ja: '10月中旬〜下旬', zh: '10月中旬至下旬', es: 'mediados a finales de octubre',
    ko: '10월 중순~하순', fr: 'mi à fin octobre', de: 'Mitte bis Ende Oktober',
    pt: 'meados a fim de outubro', id: 'pertengahan hingga akhir Oktober',
  },
  'late-oct-early-nov': {
    en: 'late October to early November',
    ja: '10月下旬〜11月上旬', zh: '10月下旬至11月上旬', es: 'finales de octubre a principios de noviembre',
    ko: '10월 말~11월 초', fr: 'fin octobre à début novembre', de: 'Ende Oktober bis Anfang November',
    pt: 'fim de outubro a início de novembro', id: 'akhir Oktober hingga awal November',
  },
  'late-sep-mid-oct': {
    en: 'late September to mid-October',
    ja: '9月下旬〜10月中旬', zh: '9月下旬至10月中旬', es: 'finales de septiembre a mediados de octubre',
    ko: '9월 말~10월 중순', fr: 'fin septembre à mi-octobre', de: 'Ende September bis Mitte Oktober',
    pt: 'fim de setembro a meados de outubro', id: 'akhir September hingga pertengahan Oktober',
  },
};

// Per-city curated seasonal data. cityKey must exist in CITY_L10N.
const CITIES = [
  {
    cityKey: 'Seoul',
    cherry: { windowKey: 'early-mid-apr', spots: ['Yeouido Yunjung-ro', 'Seokchon Lake', 'Namsan (Namsan Park)', 'Seoul Forest'] },
    autumn: { windowKey: 'late-oct-early-nov', spots: ['Changdeokgung Secret Garden', 'Namsan', 'Bukhansan National Park', 'Seoul Forest'] },
  },
  {
    cityKey: 'Busan',
    cherry: { windowKey: 'late-mar-early-apr', spots: ['Dalmaji Hill (Dalmaji-gil)', 'Oncheoncheon Stream', 'Samnak Ecological Park', 'Gwangalli area'] },
  },
  {
    cityKey: 'Gyeongju',
    cherry: { windowKey: 'early-mid-apr', spots: ['Bomun Lake', 'Daereungwon Tumuli Park surroundings', 'Cheomseongdae area', 'Bulguksa Temple road'] },
    autumn: { windowKey: 'late-oct-early-nov', spots: ['Bulguksa Temple', 'Donggung Palace & Wolji Pond', 'Bomun Lake', 'Daereungwon area'] },
  },
  {
    cityKey: 'Jeonju',
    cherry: { windowKey: 'early-mid-apr', spots: ['Jeonju Hanok Village lanes', 'Jeonjucheon Stream', 'Gyeonggijeon Shrine grounds', 'Omokdae'] },
  },
  {
    cityKey: 'Jinju',
    cherry: { windowKey: 'late-mar-early-apr', spots: ['Namgang River banks', 'Jinjuseong Fortress surroundings', 'Chokseongnu area'] },
  },
  {
    cityKey: 'Suwon',
    cherry: { windowKey: 'early-mid-apr', spots: ['Hwaseong Fortress walls', 'Manseok Park', 'Gwanggyo Lake Park'] },
  },
  {
    cityKey: 'Incheon',
    cherry: { windowKey: 'early-mid-apr', spots: ['Jayu Park (Freedom Park)', 'Incheon Grand Park', 'Songdo Central Park'] },
  },
  {
    cityKey: 'Sokcho',
    autumn: { windowKey: 'late-sep-mid-oct', spots: ['Seoraksan National Park', 'Ulsanbawi Rock trail', 'Sinheungsa Temple', 'Biryong Falls trail'] },
  },
  {
    cityKey: 'Damyang',
    autumn: { windowKey: 'late-oct-early-nov', spots: ['Metasequoia-lined Road', 'Juknokwon Bamboo Forest', 'Gwanbangjerim Forest', 'Soswaewon Garden'] },
  },
  {
    cityKey: 'Suncheon',
    autumn: { windowKey: 'mid-late-oct', spots: ['Suncheon Bay Wetland reeds', 'Suncheonman National Garden', 'Yongsan Observatory', 'Seonamsa Temple road'] },
  },
  {
    cityKey: 'Daegu',
    autumn: { windowKey: 'late-oct-early-nov', spots: ['Palgongsan (Donghwasa)', 'Apsan Park', 'Bullo-dong area'] },
  },
  {
    cityKey: 'Andong',
    autumn: { windowKey: 'late-oct-early-nov', spots: ['Hahoe Folk Village', 'Buyongdae Cliff', 'Dosan Seowon', 'Woryeonggyo Bridge'] },
  },
];

// Localized season word for breadcrumb / chrome where needed.
const ORIGIN = 'https://koreaplus-lifes.com';

module.exports = function (ctx) {
  const { shell, writePage, BASEP, L10N, esc, bcHtml, keyFactsBox, CITY_L10N, ld } = ctx;
  const LANGS = require("./seo-langs.cjs");

  // Localized city display name from CITY_L10N (h1 strips "Things to Do in"
  // is overkill — CITY_L10N carries no bare city name, so we fall back to the
  // English key, which is the romanized proper noun used in every language).
  function cityName(cityKey /*, lang */) {
    // The English key (e.g. "Gyeongju") is the internationally used romanization;
    // CITY_L10N localized blocks localize prose, not the bare toponym. Use the
    // key verbatim so we never fabricate a translated place name.
    return cityKey;
  }

  // Does a localized "things to do" guide exist for this city+lang? (reciprocal link)
  function hasCityGuide(cityKey, lang) {
    return !!(CITY_L10N[cityKey] && CITY_L10N[cityKey][lang]);
  }
  function cityGuideHref(cityKey, lang, citySlug) {
    // EN guide lives at guide/things-to-do-in-{slug}.html (root). Localized at {dir}/guide/...
    if (lang === 'en') return `guide/things-to-do-in-${citySlug}.html`;
    return `${L10N[lang].dir}/guide/things-to-do-in-${citySlug}.html`;
  }

  function dirPrefix(lang) {
    return lang === 'en' ? '' : L10N[lang].dir + '/';
  }
  function urlFor(season, citySlug, lang) {
    const path = `${season === 'cherry' ? 'cherry-blossom-in' : 'autumn-foliage-in'}-${citySlug}.html`;
    return `${BASEP}${dirPrefix(lang)}${path}`;
  }

  function fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  }

  // Build one page. Returns the URL string, or null if no translation/data.
  function buildPage(city, season, lang) {
    const data = city[season];
    if (!data) return null;
    const wk = WINDOW_KEYS[data.windowKey];
    if (!wk) return null;
    const windowText = wk[lang] || wk.en;

    // English strings inline; localized strings from L10N_STRINGS.
    const S = lang === 'en' ? EN_STRINGS[season] : (L10N_STRINGS[season] && L10N_STRINGS[season][lang]);
    if (!S) return null;

    const cn = cityName(city.cityKey, lang);
    const citySlug = ctx.slug(city.cityKey);
    const spotsList = data.spots;
    const spotsStr = spotsList.join(lang === 'ja' || lang === 'zh' ? '、' : ', ');
    const vars = { city: cn, window: windowText, spots: spotsStr };

    const url = urlFor(season, citySlug, lang);
    const seasonEmoji = season === 'cherry' ? '🌸' : '🍁';
    const h1 = fill(S.h1, vars);
    const title = `${h1.replace(/｜.*/, '').trim()} | ${fill(S.titleSuffix, vars)}`.length > 120
      ? `${fill(S.h1, vars)} | KoreaPlus`
      : `${fill(S.h1, vars).split('｜')[0].split(':')[0].trim()} — ${fill(S.titleSuffix, vars)}`;
    const desc = fill(S.metaDesc, vars);

    // Breadcrumb: Home → Seasons hub → this page (travel channel root = BASEP)
    const seasonHub = `${BASEP}${dirPrefix(lang)}seasons.html`;
    const trail = [
      { name: 'KoreaPlus', url: BASEP },
      { name: S.relH.replace(/^[^\p{L}]+/u, '').trim() || 'Seasons', url: seasonHub },
      { name: h1, url },
    ];

    let body = bcHtml(trail);
    body += `<p class="lead">${esc(fill(S.lead, vars))}</p>`;

    // Key facts chips
    body += keyFactsBox([
      `${seasonEmoji} ${esc(fill(S.windowH, vars))}: ${esc(windowText)}`,
      `📍 ${esc(cn)}, Korea`,
      season === 'cherry' ? '🌡️ Apr avg 10–18°C' : '🌡️ Oct avg 10–22°C',
    ]);

    // Spots
    body += `<h2>${esc(fill(S.spotsH, vars))}</h2><ul class="tips">${spotsList.map(sp => `<li>${esc(sp)}</li>`).join('')}</ul>`;

    // Typical window (with hedge)
    body += `<h2>${esc(fill(S.windowH, vars))}</h2><p>${esc(fill(S.windowP, vars))}</p>`;

    // Tips
    if (S.tips && S.tips.length) {
      body += `<h2>${esc(fill(S.tipsH, vars))}</h2><ul class="tips">${S.tips.map(t => `<li>${esc(fill(t, vars))}</li>`).join('')}</ul>`;
    }

    // FAQ
    const qa = (S.faq || []).map(([q, a]) => [fill(q, vars), fill(a, vars)]);
    if (qa.length) {
      body += `<h2>❓ FAQ</h2><div class="seo-faq">${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
    }

    // Internal links: seasons hub, the season landing page, the sibling season
    // for the same city (if it exists), and the localized city guide.
    const links = [];
    links.push(`<a href="${dirPrefix(lang)}seasons.html">${esc(S.seasonsLink)}</a>`);
    if (season === 'cherry') {
      links.push(`<a href="${dirPrefix(lang)}guide/korea-in-spring.html">${esc(fill(S.springLink, vars))}</a>`);
      if (city.autumn) links.push(`<a href="${urlFor('autumn', citySlug, lang).replace(BASEP, '')}">${esc(fill(S.foliageLink, vars))}</a>`);
    } else {
      links.push(`<a href="${dirPrefix(lang)}guide/korea-in-autumn.html">${esc(fill(S.autumnLink, vars))}</a>`);
      if (city.cherry) links.push(`<a href="${urlFor('cherry', citySlug, lang).replace(BASEP, '')}">${esc(fill(S.cherryLink, vars))}</a>`);
    }
    if (hasCityGuide(city.cityKey, lang)) {
      links.push(`<a href="${cityGuideHref(city.cityKey, lang, citySlug)}">📍 ${esc(cn)}</a>`);
    }
    body += `<h2>${esc(fill(S.relH, vars))}</h2><div class="seo-linklist">${links.join('')}</div>`;

    // ── Schemas ──────────────────────────────────────────────────────
    // Primary: an ItemList of the (objectively existing) viewing spots.
    // No Event schema — bloom/peak windows are climatological, not dated
    // events, so emitting an Event would imply a fabricated startDate.
    const itemList = ld.itemListLD(
      spotsList.map(sp => ({ name: sp })),
      { name: h1, description: desc, origin: ORIGIN }
    );
    const bc = ld.breadcrumbLD(trail.map(t => ({ name: t.name, url: t.url })), { origin: ORIGIN });
    const faq = ld.faqLD(qa);
    const schemas = [itemList, bc, faq].filter(Boolean);

    // hreflang: only languages where this city+season page is actually built
    // (every LANG has full chrome + a window translation, so all 9 qualify).
    const alts = LANGS.map(l => ({ lang: l, url: urlFor(season, citySlug, l) }));

    const hero = `<header class="seo-hero"><span class="emoji">${seasonEmoji}</span><h1>${esc(h1)}</h1><div class="meta"><span class="seo-badge">${esc(cn)}</span><span class="seo-badge">${esc(windowText)}</span></div></header>`;

    writePage(`${dirPrefix(lang)}${season === 'cherry' ? 'cherry-blossom-in' : 'autumn-foliage-in'}-${citySlug}.html`,
      shell({ url, title, desc, keywords: '', schemas, hero, body, lang, alts }));
    return url;
  }

  // English inline strings (default channel language).
  const EN_STRINGS = {
    cherry: {
      h1: 'Cherry Blossoms in {city}: Where to See Them & Typical Bloom Time',
      titleSuffix: 'cherry blossom spots & bloom season | KoreaPlus',
      metaDesc: 'Cherry blossoms in {city}, Korea: the best spots and the typical bloom window (around {window}). {spots} plus travel tips.',
      lead: '{city} is a popular place to see cherry blossoms in Korea. In a typical year the bloom peaks around {window} — though it shifts with each year\'s weather.',
      spotsH: '🌸 Where to See Cherry Blossoms in {city}',
      windowH: '📅 Typical Bloom Window',
      windowP: 'Cherry blossoms in {city} usually peak around {window}. The exact timing moves a few days to a week earlier or later depending on the year\'s temperatures, so check the latest bloom forecast before you travel — treat this window as a planning guide, not a year-specific prediction.',
      tipsH: '💡 Blossom-Viewing Tips',
      tips: ['Weekday mornings are usually the least crowded', 'Some spots run evening illuminations', 'Full bloom lasts only a few days to a week — keep your dates flexible', 'Bring a mat for a classic park picnic under the trees'],
      relH: '🌷 More Korea in Spring',
      seasonsLink: '🌸 Live bloom & foliage forecast',
      springLink: '🌸 Korea in Spring',
      foliageLink: '🍁 Autumn foliage in {city}',
      faq: [
        ['When do cherry blossoms bloom in {city}?', 'Typically around {window}. The peak shifts with each year\'s weather, so use this as a guide and check the latest forecast.'],
        ['Where are the best cherry blossom spots in {city}?', 'Well-known spots include {spots}.'],
      ],
    },
    autumn: {
      h1: 'Autumn Foliage in {city}: Where to See It & Typical Peak Time',
      titleSuffix: 'fall foliage spots & peak season | KoreaPlus',
      metaDesc: 'Autumn foliage in {city}, Korea: the best spots and the typical peak window (around {window}). {spots} plus travel tips.',
      lead: '{city} is a popular place to see autumn foliage in Korea. In a typical year the colors peak around {window} — though it shifts with each year\'s weather.',
      spotsH: '🍁 Where to See Autumn Foliage in {city}',
      windowH: '📅 Typical Peak Window',
      windowP: 'Autumn colors in {city} usually peak around {window}. The exact timing moves a few days to a week earlier or later depending on the year\'s temperatures, and mountains color earlier than city centers — so check the latest foliage forecast before you travel and treat this window as a planning guide.',
      tipsH: '💡 Foliage-Viewing Tips',
      tips: ['Weekday mornings are usually the least crowded', 'Mornings and evenings are chilly — bring a layer', 'Peak color lasts about one to two weeks; mountains and city differ', 'Higher-elevation trails turn earlier than valley floors'],
      relH: '🍂 More Korea in Autumn',
      seasonsLink: '🍁 Live bloom & foliage forecast',
      autumnLink: '🍁 Korea in Autumn',
      cherryLink: '🌸 Cherry blossoms in {city}',
      faq: [
        ['When is the best autumn foliage in {city}?', 'Typically around {window}. The peak shifts with each year\'s weather, so use this as a guide and check the latest forecast.'],
        ['Where are the best foliage spots in {city}?', 'Well-known spots include {spots}.'],
      ],
    },
  };

  function buildCity(cityKey, season, lang) {
    const city = CITIES.find(c => c.cityKey === cityKey);
    if (!city) return null;
    return buildPage(city, season, lang);
  }

  return {
    buildCity,
    urls() {
      const out = [];
      for (const city of CITIES) {
        for (const season of ['cherry', 'autumn']) {
          if (!city[season]) continue;
          for (const lang of LANGS) {
            const u = buildPage(city, season, lang);
            if (u) out.push({ lang, url: u });
          }
        }
      }
      return out;
    },
  };
};
