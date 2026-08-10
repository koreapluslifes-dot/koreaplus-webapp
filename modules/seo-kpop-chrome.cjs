/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-chrome.cjs — cross-cutting helpers shared by every
   seo-kpop-*.cjs generator. Pure data + string helpers; no ctx, no I/O
   beyond reading the same snapshots build-seo already reads.

   IT EXISTS FOR FOUR REASONS, all of them defects the 14-language QA pass
   found duplicated across eight generator files:

   1. LINK EXISTENCE.  `<lang>/kpop/<id>-profile.html` is written by
      build-seo from kpop-history.json, which carries 9 of the channel's 14
      languages. Four generators emitted that href unconditionally, so an
      Arabic/Hindi/Russian/Vietnamese/Thai reader clicking a group name got a
      hard 404 (src/worker.ts has no language fallback). hasProfile() is the
      single predicate they all consult now. Deliberately NOT "fall back to
      the English URL": dropping a reader into another language mid-page is
      worse than plain text and it leaks the wrong hreflang.

   2. ENUM VALUES ARE NOT UI TEXT.  ROSTER `type`/`gender` are English data
      ("group", "boy"). They were being printed raw inside otherwise fully
      localized pages ("Тип: Boy group", "<td>group</td>"). typeLabel() routes
      them through the girl/boy/group/soloist strings that already ship in
      seo-kpop-agency-l10n.js for all 14 languages — the same words the agency
      pages already render correctly, so the site stops saying it two ways.

   3. ONE LABEL PER CONCEPT.  "FAQ" and "🎤 K-Pop Hub" were hardcoded English
      inside three generators, so the same section was labelled two or three
      different ways within one locale. faqHeading()/hubLabel() read the
      canonical strings out of the bundles that already have them.

   4. PUNCTUATION AND NUMBER SHAPE ARE LOCALE FACTS.  An ASCII comma inside
      Arabic prose, a nominative Russian month after a day number, an ISO date
      in a Vietnamese chip and a bare numeral after a Thai person-noun are all
      ungrammatical, and all four were produced by generator code rather than
      by a translation. They are fixed here, once.

   Every vocabulary item below is either read from an existing l10n bundle or
   transcribed from the binding per-language style contract — nothing here is
   newly invented copy. Where a bundle genuinely lacks the key a fix needs, the
   generator degrades to its previous output and the missing key is reported
   upstream rather than written into someone else's file.
   ══════════════════════════════════════════════════════════════════ */
'use strict';

// Bundles we borrow canonical vocabulary from. All three are plain data
// modules (no requires of their own), so there is no cycle risk.
const AGENCY_L10N = require('./seo-kpop-agency-l10n.js');   // girl/boy/group/soloist × 14
const MEMBER_L10N = require('./seo-kpop-member-l10n.js');   // SIGN_NAMES, T.hFaq × 14
const BMONTH_L10N = require('../seo-kpop-bmonth-l10n.js');  // T.hubLabel × 14

// ── 1. Which <id>-profile.html pages actually exist ───────────────────────
// build-seo writes one per (slug × language) present in kpop-history.json, so
// that file is the source of truth. Reading it here keeps the guard live: the
// day a profile is translated into Arabic, the Arabic links come back on their
// own, with no generator change.
let HIST = {};
try { HIST = require('../kpop-history.json'); } catch { HIST = {}; }
const HIST_LOADED = !!HIST && Object.keys(HIST).length > 0;

// Only consulted if kpop-history.json cannot be read at all. Assuming the
// historical 9 keeps the established languages linked and still refuses to
// emit a link for the 5 new ones — i.e. it fails toward the safe answer.
const HIST_FALLBACK_LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'id'];

/** True when <lang>/kpop/<id>-profile.html is written by this build. */
function hasProfile(id, lang) {
  if (!id || !lang) return false;
  if (!HIST_LOADED) return HIST_FALLBACK_LANGS.indexOf(lang) !== -1;
  const rec = HIST[`${id}-profile`];
  return !!(rec && rec[lang]);
}

/**
 * Anchor the label at the profile page when that page exists, otherwise render
 * the label as plain text. `esc` is the build's escaper (passed in so this file
 * never reaches into ctx). `dir` is the caller's locale prefix ('' or 'ar/').
 */
function profileLink(id, lang, dir, label, esc) {
  const text = esc(label);
  if (!hasProfile(id, lang)) return text;
  return `<a href="${dir}kpop/${esc(id)}-profile.html">${text}</a>`;
}

/**
 * Absolute profile URL for structured data, or undefined when the page does
 * not exist. Schema `url` fields are assertions to a crawler; pointing one at
 * a 404 is worse than omitting it (ld.compact drops undefined).
 */
function profileUrl(id, lang, base, dir) {
  return hasProfile(id, lang) ? `${base}${dir}kpop/${id}-profile.html` : undefined;
}

// ── 2. Group-type enum → localized label ──────────────────────────────────
/**
 * ROSTER type/gender → the reader-facing words. Gender-aware on purpose: the
 * roster knows it, every language already has the pair, and the lightstick
 * strip and the vs table now agree with the agency pages on the same act.
 * Returns '' for an unknown/absent type so callers can drop the row entirely
 * rather than print a guess.
 */
function typeLabel(lang, type, gender) {
  const ty = String(type || '').trim();
  if (!ty) return '';
  const t = AGENCY_L10N[lang] || AGENCY_L10N.en;
  const en = AGENCY_L10N.en;
  if (ty !== 'group') return t.soloist || en.soloist;
  if (gender === 'girl') return t.girl || en.girl;
  if (gender === 'boy') return t.boy || en.boy;
  return t.group || en.group;
}

// ── 3. Chrome labels that were hardcoded English ──────────────────────────
/** Localized star-sign name for a derive.signOf() key ("♓ Pisces" → "♓ الحوت"). */
function signName(lang, key, fallback) {
  const map = MEMBER_L10N.SIGN_NAMES[lang] || MEMBER_L10N.SIGN_NAMES.en;
  return (map && map[key]) || MEMBER_L10N.SIGN_NAMES.en[key] || fallback || key;
}

/** "❓ الأسئلة الشائعة" / "❓ Частые вопросы" … — the form the member, agency,
 *  month and vs clusters already use, so one locale stops having three. */
function faqHeading(lang) {
  const t = MEMBER_L10N.T[lang] || MEMBER_L10N.T.en;
  return (t && t.hFaq) || MEMBER_L10N.T.en.hFaq || '❓ FAQ';
}

/** "🎤 مركز K-Pop" / "🎤 Trung tâm K-pop" … — the birthday-month bundle holds
 *  the canonical hub label in all 14 languages. */
function hubLabel(lang) {
  const t = BMONTH_L10N.T[lang] || BMONTH_L10N.T.en;
  return (t && t.hubLabel) || '🎤 K-Pop Hub';
}

// ── 4. Locale-correct punctuation, dates and counts ───────────────────────
// The Arabic style contract bans the ASCII comma inside Arabic prose; the
// Arabic comma also sits correctly in the bidi flow between Latin name runs.
const LIST_SEP = { ar: '، ' };

/** Join a list of items with the separator the locale actually uses. */
function listJoin(lang, items) {
  return (Array.isArray(items) ? items : []).join(LIST_SEP[lang] || ', ');
}

// Russian dates take the genitive month — «11 апреля 2000», never «11 апрель
// 2000». The nominative table in the l10n bundle is for headings, so the date
// formatter needs its own. Transcribed from the binding ru style contract; an
// l10n-owned MONTH_NAMES_GEN wins over it the moment one appears.
const MONTH_GEN = Object.assign({
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
}, MEMBER_L10N.MONTH_NAMES_GEN || {});

/** Genitive month name for locales that inflect dates, else null. */
function monthGenitive(lang, monthIndex0) {
  const tbl = MONTH_GEN[lang];
  return (tbl && tbl[monthIndex0]) || null;
}

/**
 * A date shown inside a fact chip. Vietnamese writes d/m/yyyy; an ISO string
 * there is not Vietnamese. Every other locale keeps the ISO form its tables
 * use, so chips and tables still agree.
 */
function chipDate(lang, iso) {
  const s = String(iso == null ? '' : iso);
  if (lang !== 'vi') return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${Number(m[3])}/${Number(m[2])}/${m[1]}` : s;
}

/**
 * A count of PEOPLE. Thai counts noun + numeral + classifier, and คน is
 * mandatory after a person-noun; a bare numeral reads as machine output.
 * Everything else returns the plain number and lets the label do the work.
 */
function countPeople(lang, n) {
  return lang === 'th' ? `${n} คน` : String(n);
}

/**
 * CLDR plural category for n in this locale ('one'|'few'|'many'|'other'|…).
 * Used only to select among plural forms a bundle supplies — never to build a
 * word here. Russian needs three branches; an English `n===1?a:b` is wrong for
 * four of its five bands.
 */
function pluralCategory(lang, n) {
  try { return new Intl.PluralRules(lang).select(Number(n)); }
  catch { return Number(n) === 1 ? 'one' : 'other'; }
}

/**
 * Render an l10n value that MAY be a count template.
 *   - string containing {n}  → filled and returned (the locale owns word order)
 *   - object of CLDR plural categories → the right branch, filled
 *   - anything else          → null, so the caller keeps its legacy layout
 * This is how a generator lets a bundle move the number without the generator
 * having to know that e.g. Arabic puts the noun first and Thai puts a
 * classifier last.
 */
function countTemplate(tpl, lang, n, extra) {
  let s = tpl;
  if (s && typeof s === 'object' && !Array.isArray(s)) {
    s = s[pluralCategory(lang, n)] != null ? s[pluralCategory(lang, n)] : s.other;
  }
  if (typeof s !== 'string' || s.indexOf('{') === -1) return null;
  return s.replace(/\{(\w+)\}/g, (m, k) => {
    // extra wins, so a caller can substitute a placeholder for the number and
    // wrap it in markup after escaping without re-scanning the filled string.
    if (extra && extra[k] != null) return String(extra[k]);
    return k === 'n' ? String(n) : m;
  });
}

module.exports = {
  hasProfile, profileLink, profileUrl,
  typeLabel, signName, faqHeading, hubLabel,
  listJoin, monthGenitive, chipDate, countPeople,
  pluralCategory, countTemplate,
  HIST_LOADED,
};
