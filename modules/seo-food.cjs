/* ══════════════════════════════════════════════════════════════════
   modules/seo-food.cjs — Korean Food Dictionary generator (T02).

   Two page families, all under the travel/main channel (out.main):
     1) buildFoodDictionary(lang) — one A–Z index page per language. Lists
        the frozen FOOD-16 (linking to their existing /places/<slug>.html
        guides — NOT regenerated here) PLUS the new dishes from
        korean-dishes.json (linking to /food/<slug>.html). Always emits
        for all 9 languages (chrome strings live in korean-dishes-l10n.json).
     2) buildDish(slug, lang) — one full guide page per new dish per language
        that has a translation in korean-dishes.json. Follows the buildPlace
        shape (lead, taste, how-to-eat, where, maps, FAQ, related).

   Data sources (consumed read-only, never mutated):
     • ctx.FOOD                  — frozen 16-item food pool ({name,kr,slug,…})
     • korean-dishes.json        — NEW dishes, parallel-generated. OPTIONAL:
       if absent or empty the module still emits the 9 index pages (showing
       only the frozen 16). Expected shape (object keyed by dish slug):
         { "<slug>": { "<lang>": { name, kr?, romaja?, desc, taste?,
             howToEat?[str], whereTo?, region?, mapQ?, tags?[str],
             emoji?, faq?[[q,a]] }, ... }, ... }
       Per-language objects are read defensively (missing fields skipped).
     • korean-dishes-l10n.json   — this module's 9-language UI chrome.

   Contract (frozen CTX interface): module is a CommonJS factory taking the
   single CTX object; every build-seo helper is reached through ctx. No
   fabrication — only objective, verifiable facts from the data files; prices
   / counts are never invented here. urls() returns {lang,url} objects.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (ctx) {
  const {
    shell, writePage, BASEP, L10N, LOCALES,
    esc, slug, enc, bcHtml, keyFactsBox, FOOD, ld,
  } = ctx;

  const ORIGIN = 'https://koreaplus-lifes.com';
  const LANGS = ['en', ...LOCALES];               // 9 languages (en + 8 locales)

  // ── load data files (defensive — module must not throw if a parallel
  //    generator hasn't produced korean-dishes.json yet) ────────────────
  function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8')); }
    catch { return null; }
  }
  const L10N_UI = loadJSON('korean-dishes-l10n.json') || {};
  const DISHES_RAW = loadJSON('korean-dishes.json') || {};

  // Normalize the new-dishes source into a slug->{lang->entry} map. Accept
  // either an object keyed by slug, or an array of {slug,...lang...} rows.
  const DISHES = {};
  if (Array.isArray(DISHES_RAW)) {
    for (const row of DISHES_RAW) {
      if (!row) continue;
      const s = row.slug || (row.en && row.en.name && slug(row.en.name));
      if (!s) continue;
      const byLang = {};
      for (const l of LANGS) if (row[l] && typeof row[l] === 'object') byLang[l] = row[l];
      if (Object.keys(byLang).length) DISHES[s] = byLang;
    }
  } else if (DISHES_RAW && typeof DISHES_RAW === 'object') {
    for (const s of Object.keys(DISHES_RAW)) {
      const v = DISHES_RAW[s];
      if (!v || typeof v !== 'object') continue;
      const byLang = {};
      for (const l of LANGS) if (v[l] && typeof v[l] === 'object') byLang[l] = v[l];
      if (Object.keys(byLang).length) DISHES[s] = byLang;
    }
  }
  const DISH_SLUGS = Object.keys(DISHES);

  // ── helpers ──────────────────────────────────────────────────────────
  const ui = (lang) => L10N_UI[lang] || L10N_UI.en || {};
  // URL prefix path-part for a language ('' for en, '<dir>/' otherwise).
  function langPrefix(lang) {
    if (lang === 'en') return '';
    const d = L10N[lang] && L10N[lang].dir;
    return d ? d + '/' : '';
  }
  function dishUrl(s, lang) { return `${BASEP}${langPrefix(lang)}food/${s}.html`; }
  function dishPath(s, lang) { return `${langPrefix(lang)}food/${s}.html`; }
  function dictUrl(lang) { return `${BASEP}${langPrefix(lang)}food-dictionary.html`; }
  function dictPath(lang) { return `${langPrefix(lang)}food-dictionary.html`; }
  function fill(tpl, name) { return String(tpl || '').replace(/\{name\}/g, name); }

  // Languages in which a given new dish actually has a translation.
  function dishLangs(s) { return LANGS.filter(l => DISHES[s] && DISHES[s][l]); }

  // hreflang alternates for a new-dish page (only langs with a translation).
  function dishAlts(s) {
    return dishLangs(s).map(l => ({ lang: l, url: dishUrl(s, l) }));
  }
  // hreflang alternates for the index (all 9 langs — chrome covers them all).
  function dictAlts() { return LANGS.map(l => ({ lang: l, url: dictUrl(l) })); }

  // First letter for the A–Z grouping (uppercase Latin; non-Latin → '#').
  function azKey(name) {
    const c = String(name || '').trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(c) ? c : '#';
  }

  // Display name for a frozen FOOD-16 item in `lang`. We only translate
  // chrome, not the dish names themselves (English romanized names are the
  // canonical, searchable forms), so the English name is shown universally —
  // Hangul (kr) is shown alongside for all languages. No fabrication.
  function frozenEntries() {
    return FOOD.map(it => ({
      name: it.name,
      kr: it.kr || '',
      emoji: it.emoji || '🍽️',
      url: `${BASEP}places/${it.slug}.html`,    // existing guide — not regenerated
      desc: (it.desc || '').replace(/\s+/g, ' ').trim(),
    }));
  }
  // Display entries for the new dishes in `lang` (fall back to en, then any).
  function newEntries(lang) {
    return DISH_SLUGS.map(s => {
      const e = DISHES[s][lang] || DISHES[s].en || DISHES[s][dishLangs(s)[0]];
      if (!e || !e.name) return null;
      // link to the localized page when available, else the English page,
      // else the index drops it (handled by filter) — never a dead link.
      const linkLang = DISHES[s][lang] ? lang : (DISHES[s].en ? 'en' : dishLangs(s)[0]);
      if (!linkLang) return null;
      return {
        name: e.name,
        kr: e.kr || '',
        emoji: e.emoji || '🍲',
        url: dishUrl(s, linkLang),
        desc: (e.desc || '').replace(/\s+/g, ' ').trim(),
      };
    }).filter(Boolean);
  }

  // ── (1) A–Z DICTIONARY INDEX ─────────────────────────────────────────
  function buildFoodDictionary(lang) {
    const t = ui(lang);
    if (!t.indexH1) return null;                  // chrome missing → skip safely
    const url = dictUrl(lang);

    const entries = [...frozenEntries(), ...newEntries(lang)]
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));

    const trail = [
      { name: t.home, url: BASEP },
      { name: t.food, url: `${BASEP}${langPrefix(lang)}guide/best-korean-food.html` },
      { name: t.dictionary, url },
    ];

    const card = (e) => `<a class="seo-card" href="${esc(e.url.replace(BASEP, ''))}">`
      + `<span class="ce">${e.emoji}</span>`
      + `<div class="cn">${esc(e.name)}</div>`
      + (e.kr ? `<div class="ck">${esc(e.kr)}</div>` : '')
      + (e.desc ? `<div class="cd">${esc(e.desc.slice(0, 90))}</div>` : '')
      + `</a>`;

    // group A–Z
    const groups = {};
    for (const e of entries) { const k = azKey(e.name); (groups[k] = groups[k] || []).push(e); }
    const letters = Object.keys(groups).sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));

    let body = bcHtml(trail);
    body += `<p class="lead">${esc(t.indexLead)}</p>`;
    body += keyFactsBox([
      `🍽️ ${entries.length} ${esc(t.allDishes)}`,
      `🅰️ ${esc(t.browse)}`,
      `🗓️ ${esc(t.updated)}`,
    ]);
    // quick A–Z jump bar
    body += `<nav class="seo-azbar">${letters.map(L =>
      `<a href="#az-${L === '#' ? 'misc' : L}">${esc(L)}</a>`).join('')}</nav>`;
    for (const L of letters) {
      body += `<h2 id="az-${L === '#' ? 'misc' : L}">${esc(L)}</h2>`;
      body += `<div class="seo-grid">${groups[L].map(card).join('')}</div>`;
    }

    const hero = `<header class="seo-hero"><span class="emoji">📖</span>`
      + `<h1>${esc(t.indexH1)}</h1>`
      + `<div class="meta"><span class="seo-badge">${entries.length} ${esc(t.allDishes)}</span>`
      + `<span class="seo-badge">${esc(t.updated)}</span></div></header>`;

    // ItemList over every dictionary entry (absolute URLs).
    const itemList = ld.itemListLD(
      entries.map(e => ({ name: e.name, url: e.url, description: e.desc ? e.desc.slice(0, 120) : undefined })),
      { name: t.indexH1, description: t.indexDesc, origin: ORIGIN }
    );
    const schemas = [itemList, ld.breadcrumbLD(trail, { origin: ORIGIN })].filter(Boolean);

    writePage(dictPath(lang), shell({
      url, title: t.indexTitle, desc: t.indexDesc, keywords: '',
      schemas, hero, body, lang, alts: dictAlts(),
    }));
    return url;
  }

  // ── (2) NEW-DISH GUIDE PAGE ──────────────────────────────────────────
  function buildDish(dishSlug, lang) {
    const byLang = DISHES[dishSlug];
    if (!byLang) return null;
    const e = byLang[lang];
    if (!e || !e.name) return null;               // no translation → skip
    const t = ui(lang);
    const url = dishUrl(dishSlug, lang);
    const name = e.name;
    const kr = e.kr || '';
    const emoji = e.emoji || '🍲';
    const overview = (e.desc || '').replace(/\s+/g, ' ').trim();
    const desc = overview.slice(0, 155);

    const trail = [
      { name: t.home, url: BASEP },
      { name: t.dictionary, url: dictUrl(lang) },
      { name, url },
    ];

    let body = bcHtml(trail);
    if (overview) body += `<p class="lead">${esc(overview)}</p>`;

    const facts = [];
    if (kr) facts.push(`🇰🇷 ${esc(t.hangul || 'Korean')}: ${esc(kr)}`);
    if (e.romaja) facts.push(`🔤 ${esc(t.romaja || 'Romanization')}: ${esc(e.romaja)}`);
    if (e.region) facts.push(`📍 ${esc(e.region)}`);
    if (Array.isArray(e.tags) && e.tags.length) facts.push(`🏷️ ${e.tags.slice(0, 3).map(esc).join(' · ')}`);
    if (facts.length) body += keyFactsBox(facts);

    if (e.taste) body += `<h2>${esc(t.tasteH || 'Taste & texture')}</h2><p>${esc(e.taste)}</p>`;

    const howto = Array.isArray(e.howToEat) ? e.howToEat.filter(Boolean) : [];
    if (howto.length) {
      body += `<h2>${esc(t.howToEat || 'How to eat it')}</h2>`
        + `<ol class="steps">${howto.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
    }

    if (e.whereTo) body += `<h2>${esc(t.whereTo || 'Where to try it')}</h2><p>${esc(e.whereTo)}</p>`;

    // maps — only when a search query is given (no fabricated coordinates)
    if (e.mapQ) {
      const mq = enc(e.mapQ);
      body += `<h2>🗺️ ${esc(t.whereTo || 'Where to try it')}</h2>`
        + `<div class="seo-map-frame"><iframe src="https://maps.google.com/maps?q=${mq}&z=13&hl=${lang}&output=embed" loading="lazy" title="${esc(name)} map"></iframe></div>`;
    }

    // FAQ — from data when present, else two safe template questions
    let qa = Array.isArray(e.faq)
      ? e.faq.map(x => Array.isArray(x) ? [x[0], x[1]] : [x.q, x.a]).filter(([q, a]) => q && a)
      : [];
    if (!qa.length && overview) {
      qa = [[fill(t.qWhat, name), overview.slice(0, 280)]];
      const whereA = (e.whereTo || e.region || '').toString().trim();
      if (whereA) qa.push([fill(t.qWhere, name), whereA.slice(0, 280)]);
    }
    if (qa.length) {
      body += `<h2>${esc(t.faqH || 'FAQ')}</h2><div class="seo-faq">`
        + qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')
        + `</div>`;
    }

    // related — other new dishes in same lang + a link back to the index
    const peers = DISH_SLUGS.filter(s => s !== dishSlug && DISHES[s][lang])
      .slice(0, 4)
      .map(s => {
        const pe = DISHES[s][lang];
        return `<a class="seo-card" href="${esc(dishPath(s, lang))}">`
          + `<span class="ce">${pe.emoji || '🍲'}</span><div class="cn">${esc(pe.name)}</div>`
          + (pe.kr ? `<div class="ck">${esc(pe.kr)}</div>` : '') + `</a>`;
      });
    if (peers.length) body += `<h2>${esc(t.relatedH || 'More dishes')}</h2><div class="seo-grid">${peers.join('')}</div>`;
    body += `<div class="seo-linklist"><a href="${esc(dictPath(lang))}">📖 ${esc(t.dictionary)}</a>`
      + `<a href="${esc(langPrefix(lang))}guide/best-korean-food.html">🍜 ${esc(t.food)}</a></div>`;

    const hero = `<header class="seo-hero"><span class="emoji">${emoji}</span>`
      + `<h1>${esc(name)}</h1>`
      + (kr ? `<div class="kr">${esc(kr)}</div>` : '')
      + `<div class="meta">${e.region ? `<span class="seo-badge region">📍 ${esc(e.region)}</span>` : ''}`
      + `${Array.isArray(e.tags) ? e.tags.slice(0, 3).map(tg => `<span class="seo-badge">${esc(tg)}</span>`).join('') : ''}</div></header>`;

    // Primary entity: Article describing the dish (objective, verifiable).
    const article = ld.compareLD({
      headline: `${name}${kr ? ' (' + kr + ')' : ''}`,
      description: desc,
      url, datePublished: ctx.TODAY, dateModified: ctx.TODAY,
      origin: ORIGIN,
    });
    const schemas = [
      article,
      ld.breadcrumbLD(trail, { origin: ORIGIN }),
      qa.length ? ld.faqLD(qa) : null,
    ].filter(Boolean);

    writePage(dishPath(dishSlug, lang), shell({
      url, title: `${name}${kr ? ' (' + kr + ')' : ''} — ${(t.dictionary || 'Korean Food')} | KoreaPlus`,
      desc, keywords: '', schemas, hero, body, lang, alts: dishAlts(dishSlug),
    }));
    return url;
  }

  // ── urls() — {lang,url} for every page this module emits ─────────────
  function urls() {
    const out = [];
    // index pages (one per language with chrome)
    for (const lang of LANGS) { const u = buildFoodDictionary(lang); if (u) out.push({ lang, url: u }); }
    // new-dish pages (each dish × langs it has a translation for)
    for (const s of DISH_SLUGS) {
      for (const lang of LANGS) { const u = buildDish(s, lang); if (u) out.push({ lang, url: u }); }
    }
    return out;
  }

  return { buildFoodDictionary, buildDish, urls };
};
