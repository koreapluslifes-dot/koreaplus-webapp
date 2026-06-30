/* ══════════════════════════════════════════════════════════════════
   modules/seo-derive.cjs — pure date-derivation helpers shared by every
   seo-<name>.cjs generator (zodiac sign, Chinese zodiac, month index).

   Single source of truth — derive logic must NOT be re-implemented inside
   individual modules. All functions are pure and validate input robustly:
   any malformed / out-of-range / non-string input returns null (never
   throws), so callers can `return null` to silent-drop a page.

   ── Caveat (heged, by design) ─────────────────────────────────────────
   cnZodiacOf uses the SOLAR birth YEAR only (simple mod-12 rule). The real
   Chinese zodiac year flips at Lunar New Year (late Jan – mid Feb), so a
   person born in Jan/early-Feb may be misclassified by ±1 animal. Modules
   surfacing this value MUST add a one-line body hedge (see hedgeNote()).
   ══════════════════════════════════════════════════════════════════ */
'use strict';

// Parse "YYYY-MM-DD" (optionally with a trailing time) into a validated
// {y,m,d} or return null. Rejects impossible calendar dates (e.g. 02-30).
function parseDate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const m = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

// Western (tropical) sun-sign date table. Each entry: the sign that STARTS
// on [startMonth, startDay]. Capricorn wraps the year boundary.
const SIGNS = [
  { key: 'capricorn',   name: 'Capricorn',   emoji: '♑', from: [12, 22] },
  { key: 'aquarius',    name: 'Aquarius',    emoji: '♒', from: [1, 20] },
  { key: 'pisces',      name: 'Pisces',      emoji: '♓', from: [2, 19] },
  { key: 'aries',       name: 'Aries',       emoji: '♈', from: [3, 21] },
  { key: 'taurus',      name: 'Taurus',      emoji: '♉', from: [4, 20] },
  { key: 'gemini',      name: 'Gemini',      emoji: '♊', from: [5, 21] },
  { key: 'cancer',      name: 'Cancer',      emoji: '♋', from: [6, 21] },
  { key: 'leo',         name: 'Leo',         emoji: '♌', from: [7, 23] },
  { key: 'virgo',       name: 'Virgo',       emoji: '♍', from: [8, 23] },
  { key: 'libra',       name: 'Libra',       emoji: '♎', from: [9, 23] },
  { key: 'scorpio',     name: 'Scorpio',     emoji: '♏', from: [10, 23] },
  { key: 'sagittarius', name: 'Sagittarius', emoji: '♐', from: [11, 22] },
];

/* signOf(dateStr) → { key, name, emoji } | null
   Standard tropical zodiac by Gregorian month/day. */
function signOf(dateStr) {
  const p = parseDate(dateStr);
  if (!p) return null;
  const md = p.m * 100 + p.d; // e.g. April 20 → 420
  // Capricorn spans Dec 22 – Jan 19 (wraps the year).
  if (md >= 1222 || md <= 119) return { ...SIGNS[0] };
  for (let i = 1; i < SIGNS.length; i++) {
    const [fm, fd] = SIGNS[i].from;
    const start = fm * 100 + fd;
    const next = SIGNS[i + 1] ? SIGNS[i + 1].from[0] * 100 + SIGNS[i + 1].from[1] : 1231;
    if (md >= start && md < next) return { ...SIGNS[i] };
  }
  return { ...SIGNS[0] };
}

// Chinese-zodiac animals indexed so that year % 12 === 0 → Monkey (2016,
// 2004, 1992 are Monkey years; the canonical anchor 4 → Rat). Order below
// is by (year % 12).
const CN_ZODIAC = [
  { key: 'monkey',  name: 'Monkey',  emoji: '🐵' }, // year % 12 === 0
  { key: 'rooster', name: 'Rooster', emoji: '🐓' }, // 1
  { key: 'dog',     name: 'Dog',     emoji: '🐕' }, // 2
  { key: 'pig',     name: 'Pig',     emoji: '🐖' }, // 3
  { key: 'rat',     name: 'Rat',     emoji: '🐀' }, // 4
  { key: 'ox',      name: 'Ox',      emoji: '🐂' }, // 5
  { key: 'tiger',   name: 'Tiger',   emoji: '🐅' }, // 6
  { key: 'rabbit',  name: 'Rabbit',  emoji: '🐇' }, // 7
  { key: 'dragon',  name: 'Dragon',  emoji: '🐉' }, // 8
  { key: 'snake',   name: 'Snake',   emoji: '🐍' }, // 9
  { key: 'horse',   name: 'Horse',   emoji: '🐎' }, // 10
  { key: 'goat',    name: 'Goat',    emoji: '🐐' }, // 11
];

/* cnZodiacOf(dateStr) → { key, name, emoji, year, approx } | null
   SOLAR-YEAR simple rule. `approx:true` flags Jan/early-Feb births that
   may straddle the Lunar New Year boundary (modules should hedge these).
   Accepts a 4-digit year string/number too (e.g. cnZodiacOf("1992")). */
function cnZodiacOf(dateStr) {
  let y, m = null, d = null;
  if (typeof dateStr === 'number' && Number.isInteger(dateStr) && dateStr >= 1000 && dateStr <= 9999) {
    y = dateStr;
  } else if (typeof dateStr === 'string' && /^\d{4}$/.test(dateStr.trim())) {
    y = +dateStr.trim();
  } else {
    const p = parseDate(dateStr);
    if (!p) return null;
    y = p.y; m = p.m; d = p.d;
  }
  const animal = CN_ZODIAC[((y % 12) + 12) % 12];
  // Lunar New Year falls between ~Jan 21 and ~Feb 21; births in that window
  // could belong to the previous animal year — flag as approximate.
  const approx = m !== null && (m === 1 || (m === 2 && d <= 20));
  return { ...animal, year: y, approx };
}

/* monthOf(dateStr) → { index, num, name, short } | null
   index 0-11, num 1-12. English month names (callers localize as needed). */
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
function monthOf(dateStr) {
  const p = parseDate(dateStr);
  if (!p) {
    // also accept a bare "YYYY-MM" prefix
    if (typeof dateStr === 'string') {
      const mm = dateStr.trim().match(/^\d{4}-(\d{2})/);
      if (mm) { const n = +mm[1]; if (n >= 1 && n <= 12) return { index: n - 1, num: n, name: MONTH_NAMES[n - 1], short: MONTH_NAMES[n - 1].slice(0, 3) }; }
    }
    return null;
  }
  return { index: p.m - 1, num: p.m, name: MONTH_NAMES[p.m - 1], short: MONTH_NAMES[p.m - 1].slice(0, 3) };
}

// Convenience for modules that surface cnZodiacOf — a ready-made English
// hedge string. Modules localize their own wording; this is a fallback.
function hedgeNote(z) {
  if (!z || !z.approx) return '';
  return `Born near Lunar New Year — the Chinese zodiac year may shift by one animal depending on the exact lunar date.`;
}

module.exports = {
  signOf,
  cnZodiacOf,
  monthOf,
  hedgeNote,
  parseDate,   // exposed for modules that need raw validated {y,m,d}
  SIGNS,
  CN_ZODIAC,
  MONTH_NAMES,
};
