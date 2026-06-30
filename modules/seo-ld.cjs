/* ══════════════════════════════════════════════════════════════════
   modules/seo-ld.cjs — shared JSON-LD helper factory (single source of
   truth for structured data used by every seo-<name>.cjs generator).

   Pure functions. No build-seo helpers required — anything the helper
   needs (ORIGIN, BASEP) is passed as an argument so this file has zero
   coupling to build-seo.cjs internals.

   Style note: matches the existing build-seo breadcrumbLD/faqLD shape
   ('@context' + '@type', plain objects, no trailing nulls) so output is
   byte-comparable. From here on this file is the single source — the
   in-file copies in build-seo are kept only for legacy call sites.

   Every helper returns a plain object (a JSON-LD node) or `null` when it
   cannot be emitted safely (missing required, unverifiable date, etc.).
   Callers MUST drop nulls before spreading into shell({schemas}).
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const SCHEMA = 'https://schema.org';
// Default origin — overridable per-call via opts.origin so the file stays
// decoupled. build-seo's ORIGIN is 'https://koreaplus-lifes.com'.
const DEFAULT_ORIGIN = 'https://koreaplus-lifes.com';

// Absolutize a URL: pass through http(s) URLs untouched, otherwise prefix
// the origin. Returns undefined for empty input (so JSON.stringify drops it).
function abs(url, origin) {
  if (!url) return undefined;
  const s = String(url);
  if (/^https?:\/\//i.test(s)) return s;
  return (origin || DEFAULT_ORIGIN) + (s[0] === '/' ? s : '/' + s);
}

// Compact: strip undefined/null/'' values from a shallow object so emitted
// JSON-LD never carries empty keys.
function compact(obj) {
  const o = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null || v === '') continue;
    o[k] = v;
  }
  return o;
}

// Strict ISO calendar-date validator (YYYY-MM-DD, real month/day).
function isISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/* ── itemListLD ──────────────────────────────────────────────────────
   items: [{ name, url?, position?, image?, description? }]
   opts:  { name?, description?, origin? }
   Emits a schema.org ItemList. Returns null when items is empty. */
function itemListLD(items, opts = {}) {
  if (!Array.isArray(items) || !items.length) return null;
  const origin = opts.origin;
  return compact({
    '@context': SCHEMA,
    '@type': 'ItemList',
    name: opts.name,
    description: opts.description,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => compact({
      '@type': 'ListItem',
      position: it.position != null ? it.position : i + 1,
      name: it.name,
      url: abs(it.url, origin),
      image: abs(it.image, origin),
      description: it.description,
    })),
  });
}

/* ── breadcrumbLD ────────────────────────────────────────────────────
   trail: [{ name, url }]  (url is BASEP-relative-from-origin, e.g.
   "/guide/explore.html"; pass-through if already absolute). Matches the
   legacy build-seo breadcrumbLD exactly. opts: { origin? } */
function breadcrumbLD(trail, opts = {}) {
  if (!Array.isArray(trail) || !trail.length) return null;
  const origin = opts.origin;
  return {
    '@context': SCHEMA,
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => compact({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: abs(t.url, origin),
    })),
  };
}

/* ── faqLD ───────────────────────────────────────────────────────────
   qa: [[question, answerHtmlOrText], ...]  OR  [{q,a}, ...].
   Matches legacy build-seo faqLD (tuple form). Returns null if empty. */
function faqLD(qa) {
  if (!Array.isArray(qa) || !qa.length) return null;
  const norm = qa.map(x => Array.isArray(x) ? [x[0], x[1]] : [x.q, x.a])
    .filter(([q, a]) => q && a);
  if (!norm.length) return null;
  return {
    '@context': SCHEMA,
    '@type': 'FAQPage',
    mainEntity: norm.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/* ── howToLD ─────────────────────────────────────────────────────────
   steps: [{ name, text }] OR ["text", ...].
   opts: { name (required), description?, totalTime? (ISO 8601 dur),
           supply? [str], tool? [str], origin? }
   Returns null when name or steps missing. */
function howToLD(steps, opts = {}) {
  if (!opts.name || !Array.isArray(steps) || !steps.length) return null;
  const norm = steps.map((s, i) => {
    const text = typeof s === 'string' ? s : s.text;
    if (!text) return null;
    return compact({
      '@type': 'HowToStep',
      position: i + 1,
      name: typeof s === 'string' ? undefined : s.name,
      text,
      url: typeof s === 'string' ? undefined : abs(s.url, opts.origin),
    });
  }).filter(Boolean);
  if (!norm.length) return null;
  return compact({
    '@context': SCHEMA,
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    totalTime: opts.totalTime,
    supply: Array.isArray(opts.supply) && opts.supply.length
      ? opts.supply.map(s => ({ '@type': 'HowToSupply', name: s })) : undefined,
    tool: Array.isArray(opts.tool) && opts.tool.length
      ? opts.tool.map(t => ({ '@type': 'HowToTool', name: t })) : undefined,
    step: norm,
  });
}

/* ── compareLD ───────────────────────────────────────────────────────
   A "X vs Y" comparison article. Emits an Article node (most robust,
   schema-valid choice for editorial comparisons). For the side-by-side
   itself, pair this with itemListLD if you want the options enumerated.
   opts: { headline (required), description?, url?, datePublished?,
           dateModified?, image?, origin?,
           publisher? {name,logo}, author? {name} } */
function compareLD(opts = {}) {
  if (!opts.headline) return null;
  const origin = opts.origin;
  const pubName = (opts.publisher && opts.publisher.name) || 'KoreaPlus-Lifes';
  const pubLogo = (opts.publisher && opts.publisher.logo) || (origin || DEFAULT_ORIGIN) + '/guide/icons/kplus.svg';
  return compact({
    '@context': SCHEMA,
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    datePublished: isISODate(opts.datePublished) ? opts.datePublished : undefined,
    dateModified: isISODate(opts.dateModified) ? opts.dateModified
      : (isISODate(opts.datePublished) ? opts.datePublished : undefined),
    image: abs(opts.image, origin),
    author: { '@type': 'Organization', name: (opts.author && opts.author.name) || 'KoreaPlus' },
    publisher: { '@type': 'Organization', name: pubName, logo: { '@type': 'ImageObject', url: pubLogo } },
    mainEntityOfPage: abs(opts.url, origin),
  });
}

/* ── musicGroupLD ────────────────────────────────────────────────────
   A K-pop group / soloist. member-as-Person nodes are emitted ONLY for
   members carrying a verified ISO birthDate (caller passes them); members
   without one are still listed by name (no fabricated dates).
   opts: { name (required), alternateName?, genre? [str], foundingDate?,
           url?, sameAs? [str], image?, origin?,
           members? [{ name, birthDate?, url? }] }
   For soloists pass a single member or omit members. Returns null w/o name. */
function musicGroupLD(opts = {}) {
  if (!opts.name) return null;
  const origin = opts.origin;
  const members = Array.isArray(opts.members) ? opts.members.filter(m => m && m.name) : [];
  const sameAs = Array.isArray(opts.sameAs) ? opts.sameAs.filter(Boolean) : [];
  return compact({
    '@context': SCHEMA,
    '@type': 'MusicGroup',
    name: opts.name,
    alternateName: opts.alternateName,
    genre: Array.isArray(opts.genre) && opts.genre.length ? opts.genre : undefined,
    foundingDate: isISODate(opts.foundingDate) ? opts.foundingDate : undefined,
    url: abs(opts.url, origin),
    image: abs(opts.image, origin),
    sameAs: sameAs.length ? sameAs : undefined,
    member: members.length ? members.map(m => personLD({
      name: m.name, birthDate: m.birthDate, url: m.url, origin,
    }, { bare: true })).filter(Boolean) : undefined,
  });
}

/* ── personLD ────────────────────────────────────────────────────────
   A person (idol/soloist). birthDate is emitted ONLY when the caller
   supplies a VERIFIED ISO date (caller's responsibility); an invalid or
   missing date is silently omitted — never fabricated.
   opts: { name (required), birthDate?, alternateName?, url?, image?,
           sameAs? [str], jobTitle?, memberOf? (str group name), origin? }
   meta.bare=true → omit '@context' (for nesting inside another node). */
function personLD(opts = {}, meta = {}) {
  if (!opts.name) return null;
  const origin = opts.origin;
  const sameAs = Array.isArray(opts.sameAs) ? opts.sameAs.filter(Boolean) : [];
  const node = compact({
    '@context': meta.bare ? undefined : SCHEMA,
    '@type': 'Person',
    name: opts.name,
    alternateName: opts.alternateName,
    birthDate: isISODate(opts.birthDate) ? opts.birthDate : undefined,
    jobTitle: opts.jobTitle,
    url: abs(opts.url, origin),
    image: abs(opts.image, origin),
    sameAs: sameAs.length ? sameAs : undefined,
    memberOf: opts.memberOf ? { '@type': 'MusicGroup', name: opts.memberOf } : undefined,
  });
  return node;
}

/* ── eventLD ─────────────────────────────────────────────────────────
   A festival / comeback / concert. startDate is REQUIRED and must be a
   valid ISO date (or ISO datetime) — without it the helper returns null
   (Google rejects Events without a start). No fabricated future dates.
   opts: { name (required), startDate (required, ISO), endDate?,
           description?, url?, locationName?, locationAddress?,
           image?, origin?,
           eventStatus? (e.g. 'https://schema.org/EventScheduled'),
           eventAttendanceMode? } */
function eventLD(opts = {}) {
  if (!opts.name) return null;
  const start = opts.startDate;
  const okStart = isISODate(start) || (typeof start === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(start) && isISODate(start.slice(0, 10)));
  if (!okStart) return null; // no startDate → omit Event entirely
  const origin = opts.origin;
  const endOk = opts.endDate && (isISODate(opts.endDate) || (/^\d{4}-\d{2}-\d{2}T/.test(opts.endDate) && isISODate(String(opts.endDate).slice(0, 10))));
  const location = opts.locationName ? compact({
    '@type': 'Place',
    name: opts.locationName,
    address: opts.locationAddress,
  }) : undefined;
  return compact({
    '@context': SCHEMA,
    '@type': 'Event',
    name: opts.name,
    startDate: start,
    endDate: endOk ? opts.endDate : undefined,
    description: opts.description,
    url: abs(opts.url, origin),
    image: abs(opts.image, origin),
    eventStatus: opts.eventStatus,
    eventAttendanceMode: opts.eventAttendanceMode,
    location,
  });
}

/* ── definedTermSetLD ────────────────────────────────────────────────
   A glossary / term set (e.g. K-pop slang, beauty ingredients).
   terms: [{ name, description, url? }]
   opts:  { name (required), description?, url?, origin? }
   Returns null when name missing or terms empty. */
function definedTermSetLD(terms, opts = {}) {
  if (!opts.name || !Array.isArray(terms) || !terms.length) return null;
  const origin = opts.origin;
  const setUrl = abs(opts.url, origin);
  const norm = terms.filter(t => t && t.name).map(t => compact({
    '@type': 'DefinedTerm',
    name: t.name,
    description: t.description,
    url: abs(t.url, origin),
    inDefinedTermSet: setUrl,
  }));
  if (!norm.length) return null;
  return compact({
    '@context': SCHEMA,
    '@type': 'DefinedTermSet',
    name: opts.name,
    description: opts.description,
    url: setUrl,
    hasDefinedTerm: norm,
  });
}

module.exports = {
  itemListLD,
  breadcrumbLD,
  faqLD,
  howToLD,
  compareLD,
  musicGroupLD,
  personLD,
  eventLD,
  definedTermSetLD,
  // low-level helpers exposed for module authors who need them
  isISODate,
  abs,
  compact,
};
