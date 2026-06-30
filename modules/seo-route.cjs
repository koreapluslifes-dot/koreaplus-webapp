/* ══════════════════════════════════════════════════════════════════
   modules/seo-route.cjs — Korea intercity rail/route generator (T05).

   One page family under the travel/main channel (out.main):
     buildRoute(pairSlug, lang) — a city-pair "how to get from A to B"
     guide for KTX/SRT (or express bus where rail is impractical), built
     from korea-routes.json. Slug is the JSON record's own
     "{a}-to-{b}" slug (e.g. busan-to-gyeongju). The existing Seoul-origin
     routes (guide/seoul-to-*.html, 5 of them) are NOT touched — the JSON
     deliberately excludes them, so there is zero slug overlap.

   Data source (read-only, never mutated):
     • korea-routes.json — { routes: [{ slug, from, to, from_kr, to_kr,
         mode (KTX|SRT|bus), station, duration ("약 N시간…"), fare
         ("₩a–b"), frequency, direct, transfer?, note }, ...] }.
       Durations/fares are APPROXIMATE RANGES copied verbatim — never an
       exact timetable, never a to-the-minute or live figure. The Korean
       duration/frequency tokens are localized per language via the
       DURATION_WORDS map in seo-route-l10n.js (token replacement only —
       the numeric values themselves are never altered or invented).

   schemas = [ howToLD (station → board → arrive), breadcrumbLD, faqLD ].
   Channel: travel/main → homeHref default, brand default.
   9 languages (en + ja/zh/es/ko/fr/de/pt/id); chrome from seo-route-l10n.js.

   Contract (frozen CTX interface): CommonJS factory taking the single CTX
   object; every build-seo helper is reached through ctx. urls() returns
   {lang,url} objects. No fabrication — only the objective route facts from
   the JSON are emitted; nothing is guessed.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const { T, DURATION_WORDS } = require('../seo-route-l10n.js');

module.exports = function (ctx) {
  const {
    shell, writePage, BASEP, L10N, LOCALES,
    esc, bcHtml, keyFactsBox, affBlock, ld,
  } = ctx;

  const ORIGIN = 'https://koreaplus-lifes.com';
  const LANGS = ['en', ...LOCALES].filter((l, i, a) => a.indexOf(l) === i && T[l]); // 9

  // ── load route data (defensive — module must not throw if the JSON is
  //    missing/empty; it simply emits nothing in that case) ──────────────
  function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8')); }
    catch { return null; }
  }
  const RAW = loadJSON('korea-routes.json') || {};
  const ROUTES_ARR = Array.isArray(RAW) ? RAW : (Array.isArray(RAW.routes) ? RAW.routes : []);

  // Index by slug; keep only well-formed records carrying the load-bearing
  // facts (slug, from, to). Existing Seoul-origin slugs would collide with
  // guide/seoul-to-*.html — defensively drop any that slipped in.
  const BYSLUG = {};
  for (const r of ROUTES_ARR) {
    if (!r || !r.slug || !r.from || !r.to) continue;
    if (/^seoul-to-/.test(r.slug)) continue;     // never shadow the legacy pages
    BYSLUG[r.slug] = r;
  }
  const SLUGS = Object.keys(BYSLUG);

  // ── helpers ────────────────────────────────────────────────────────────
  function langPrefix(lang) {
    if (lang === 'en') return '';
    const d = L10N[lang] && L10N[lang].dir;
    return d ? d + '/' : '';
  }
  function routeUrl(s, lang) { return `${BASEP}${langPrefix(lang)}guide/${s}.html`; }
  function routePath(s, lang) { return `${langPrefix(lang)}guide/${s}.html`; }

  // hreflang alternates — the same record renders for every language (the
  // chrome covers all 9; the route facts are language-independent).
  function routeAlts(s) { return LANGS.map(l => ({ lang: l, url: routeUrl(s, l) })); }

  // Localize a Korean duration/frequency string by token replacement. The
  // numeric values are NEVER changed — only the surrounding words ("약",
  // "시간", "분", "이상", "회"…) are swapped per language. ko = identity.
  function localizeDuration(str, lang) {
    let out = String(str || '');
    const map = DURATION_WORDS[lang];
    if (!Array.isArray(map) || !map.length) return out; // ko / unknown → as-is
    for (const [ko, tr] of map) out = out.split(ko).join(tr);
    return out;
  }

  // Localized transport-mode word for a record's mode (KTX|SRT|bus).
  function modeWord(r, t) {
    const mw = t.modeWord || {};
    return mw[r.mode] || mw.KTX || r.mode;
  }

  // ── buildRoute(pairSlug, lang) — one city-pair guide page ──────────────
  function buildRoute(pairSlug, lang) {
    const r = BYSLUG[pairSlug];
    if (!r) return null;
    const t = T[lang];
    if (!t) return null;                           // no chrome → skip safely

    const a = r.from, b = r.to;                    // display names (English)
    const url = routeUrl(pairSlug, lang);
    const mWord = modeWord(r, t);
    const dur = localizeDuration(r.duration, lang);
    const fare = r.fare || '';
    const freq = localizeDuration(r.frequency, lang);
    const station = r.station || `${a} → ${b}`;

    const trail = [
      { name: t.hub, url: `${BASEP}${langPrefix(lang)}explore.html` },
      { name: t.dir, url: `${BASEP}${langPrefix(lang)}explore.html` },
      { name: `${a} → ${b}`, url },
    ];

    // ── body ──
    let body = bcHtml(trail);
    body += `<p class="lead">${esc(t.lead(a, b, mWord))}</p>`;

    const facts = [];
    if (dur) facts.push(t.factDur(dur));
    if (fare) facts.push(t.factFare(fare));
    if (freq) facts.push(t.factFreq(freq));
    facts.push(t.factMode(mWord));
    body += keyFactsBox(facts);

    // facts table (mode / station / duration / fare / frequency)
    const rows = [
      [t.modeLabel, esc(mWord)],
      [t.stationLabel, esc(station)],
      [t.durLabel, esc(dur)],
      [t.fareLabel, esc(fare)],
      [t.freqLabel, esc(freq)],
    ].filter(([, v]) => v);
    body += `<h2>${esc(a)} → ${esc(b)}</h2>`
      + `<table class="seo-costtable"><tbody>`
      + rows.map(([k, v]) => `<tr><th style="text-align:left">${esc(k)}</th><td>${v}</td></tr>`).join('')
      + `</tbody></table>`;

    // step-by-step (mirrors the HowTo schema)
    const steps = t.steps(a, b, station);
    body += `<h2>${esc(t.stepsH)}</h2>`
      + `<ol class="steps">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;

    // how-to-book
    body += `<h2>${esc(t.bookH)}</h2><p>${esc(t.bookBody)}</p>`;

    // related links (back to the explore hub + the two cities' guides)
    body += `<h2>${esc(t.relatedH)}</h2><div class="seo-linklist">`
      + `<a href="${esc(langPrefix(lang))}explore.html">🧭 ${esc(t.dir)}</a>`
      + `</div>`;

    // FAQ
    const qa = t.faq(a, b, dur, fare);
    body += `<h2>❓ FAQ</h2><div class="seo-faq">`
      + qa.map(([q, ans]) => `<details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join('')
      + `</div>`;

    // approximate-figures disclaimer (anti-fabrication, always present)
    body += `<p style="margin:22px 0 0;font-size:12.5px;color:var(--text3,#889)">ℹ️ ${esc(t.approxNote)}</p>`;

    // monetization (central affiliate block — destination city)
    body += affBlock({ city: b, cat: 'hotel', q: '', lang });

    // ── hero ──
    const heroEmoji = r.mode === 'bus' ? '🚌' : '🚄';
    const hero = `<header class="seo-hero"><span class="emoji">${heroEmoji}</span>`
      + `<h1>${esc(t.h1(a, b))}</h1>`
      + `<div class="meta"><span class="seo-badge">${esc(mWord)}</span>`
      + `<span class="seo-badge">2026</span></div></header>`;

    // ── schemas: HowTo (station → board → arrive) + Breadcrumb + FAQ ──
    const howTo = ld.howToLD(
      steps.map((text, i) => ({ name: `${i + 1}`, text })),
      {
        name: t.h1(a, b),
        description: t.metaDesc(a, b),
        origin: ORIGIN,
      },
    );
    const schemas = [
      howTo,
      ld.breadcrumbLD(trail, { origin: ORIGIN }),
      ld.faqLD(qa),
    ].filter(Boolean);

    writePage(routePath(pairSlug, lang), shell({
      url, title: t.title(a, b), desc: t.metaDesc(a, b), keywords: '',
      schemas, hero, body, lang, alts: routeAlts(pairSlug),
    }));
    return url;
  }

  // ── urls() — {lang,url} for every page this module emits ───────────────
  function urls() {
    const out = [];
    for (const s of SLUGS) {
      for (const lang of LANGS) {
        const u = buildRoute(s, lang);
        if (u) out.push({ lang, url: u });
      }
    }
    return out;
  }

  return { buildRoute, urls };
};
