/* ══════════════════════════════════════════════════════════════════
   modules/seo-kpop-media.cjs — shared renderers for the two build-time
   K-pop snapshots, so generated pages and the SPA hub never disagree.

     ctx.IMAGES  kpop-images.js  { "<id>": { src, artist, license, page } }
     ctx.DISCOG  kpop-discog.js  { "<id>": { artistName, asOf, albums:[…] } }

   Both are produced by tools/gen-kpop-{images,discog}.cjs from Wikidata P18 /
   Wikimedia Commons and the Apple iTunes Lookup API. Everything here is real,
   dated and attributable — nothing is inferred or filled in.

   TWO RULES THIS FILE EXISTS TO ENFORCE:
   1. A Commons photo may only be shown together with its author + licence.
      photoFigure() emits both or emits nothing; there is no "image only" path.
   2. A snapshot is not live data. Every discography block carries an
      "as of <date>" stamp, and unreleased titles are labelled as upcoming
      rather than presented as available. Markup has no way to carry that
      caveat, so albumSchema() drops future-dated titles instead of claiming
      a datePublished for a record that does not exist yet — which is why it
      needs the build's `today`.

   WHAT CALLERS MUST PASS (build-seo.cjs / seo-kpop-year.cjs):
     discogSection(DISCOG, id, lang, TODAY_KST, esc [, yearPages, dir])
     albumSchema(DISCOG, id, limit, TODAY_KST)
   TODAY_KST is an ISO yyyy-mm-dd string so every page in one run agrees on
   "today". `yearPages`/`dir` are optional; see discogSection().
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const T = require('../seo-kpop-media-l10n.js');

/** "How Sweet - EP" → { title:'How Sweet', badge:'EP' }. Apple's suffix is
 *  formatting, not part of the release name. */
function splitAlbumTitle(raw) {
  const m = String(raw || '').match(/^(.*?)\s+-\s+(Single|EP)$/i);
  return m ? { title: m[1], badge: m[2].toUpperCase() } : { title: String(raw || ''), badge: '' };
}

/** One act's releases, newest first, Apple's duplicate editions collapsed. */
function releasesFor(DISCOG, id) {
  const d = DISCOG && DISCOG[id];
  if (!d || !Array.isArray(d.albums)) return [];
  const out = [], seen = new Set();
  for (const al of d.albums) {
    if (!al || !al.date) continue;
    const sp = splitAlbumTitle(al.title);
    const k = (sp.title + '|' + al.date).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ title: sp.title, badge: sp.badge, date: al.date, year: String(al.year || al.date.slice(0, 4)), art: al.art || '' });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * Every roster release across all acts, newest first. Powers the year pages.
 *
 * Deduped GLOBALLY, not just per act: Apple files a collaboration or a label
 * compilation under each act that appears on it, so "K-POP SCREAM 1" sits in
 * four roster catalogues. Emitting it four times would inflate the year page's
 * release count, repeat the row, repeat the ItemList entry and hand each act a
 * release it did not put out alone. One record = one row.
 *
 * The row carries every crediting act in `artists` and keeps `artist` as the
 * first of them, so callers that show a single act still work. `artists` is in
 * snapshot key order, i.e. roster order — the generator's ordering decides
 * which act is treated as the releasing one, so a caller that can show more
 * than one name should read `artists` rather than assume `artist` is the whole
 * credit. Nothing is dropped from the data; only the rendering picks one.
 */
function allReleases(DISCOG, ROSTER) {
  const byId = Object.fromEntries((ROSTER || []).map(a => [a.id, a]));
  const out = [], byKey = new Map();
  for (const id of Object.keys(DISCOG || {})) {
    const artist = byId[id];
    if (!artist) continue;                       // never surface an act we can't link
    for (const r of releasesFor(DISCOG, id)) {
      const k = (r.title + '|' + r.date).toLowerCase();
      const dup = byKey.get(k);
      if (dup) { dup.artists.push(artist); continue; }
      const row = Object.assign({ artist, artists: [artist] }, r);
      byKey.set(k, row);
      out.push(row);
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * The snapshot date, taken from the data itself rather than build time —
 * the NEWEST asOf across every act, not whichever act happens to come first.
 *
 * An incremental refresh can leave the file with mixed or missing stamps, and
 * reading only the first entry made the "as of" caveat depend on key order:
 * one stampless act sorting to the top would strip the honesty line off every
 * profile and year page with nothing in the build log to show for it. So a
 * partial gap warns, and a file that can produce no stamp at all fails the
 * build rather than shipping undated pages that read as live.
 */
const _snapCache = new WeakMap();
function snapshotDate(DISCOG) {
  if (!DISCOG) return '';
  if (_snapCache.has(DISCOG)) return _snapCache.get(DISCOG);
  const ids = Object.keys(DISCOG);
  const missing = [];
  let max = '';
  for (const id of ids) {
    const asOf = DISCOG[id] && DISCOG[id].asOf;
    if (!asOf) { missing.push(id); continue; }
    if (asOf > max) max = asOf;
  }
  if (ids.length && !max) {
    throw new Error('[seo-kpop-media] no act in kpop-discog.js carries an "asOf" date, so the '
      + '"as of <date>" stamp cannot be rendered. Regenerate with tools/gen-kpop-discog.cjs — '
      + 'shipping the discography undated would present a snapshot as live data.');
  }
  if (missing.length) {
    console.warn(`[seo-kpop-media] ${missing.length} of ${ids.length} discography entries have no "asOf" `
      + `date (${missing.join(', ')}); pages are stamped ${max} from the rest. Regenerate with `
      + 'tools/gen-kpop-discog.cjs.');
  }
  _snapCache.set(DISCOG, max);
  return max;
}

/** Fallback "today" (KST) for callers that predate the parameter. The build
 *  passes its own TODAY_KST so all pages in a run agree; this only guarantees
 *  the unreleased-title guard can never be skipped by omitting an argument. */
function kstToday() {
  return new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
}

const tr = (lang) => T[lang] || T.en;

/**
 * Artist photo + the attribution its licence requires.
 * Returns '' when there is no verified image — the caller keeps its emoji.
 *
 * Eager + high priority, never lazy: this is the first element in the body on
 * every profile page, so it IS the LCP element. Deferring it defers the metric.
 */
function photoFigure(IMAGES, id, name, lang, esc) {
  const im = IMAGES && IMAGES[id];
  if (!im || !im.src) return '';
  const t = tr(lang);
  const who = im.artist || 'Wikimedia Commons';
  const lic = im.license || '';
  const credit = `${esc(who)}${lic ? ' · ' + esc(lic) : ''} · Wikimedia Commons`;
  return `<figure class="kp-figure">`
    + `<img src="${esc(im.src)}" alt="${esc(name)}" width="480" height="320" loading="eager" fetchpriority="high" decoding="async">`
    + `<figcaption class="kp-figcredit">📷 ${esc(t.photo)}: `
    + (im.page ? `<a href="${esc(im.page)}" target="_blank" rel="noopener nofollow">${credit}</a>` : credit)
    + `</figcaption></figure>`;
}

/**
 * Full discography table for one act, newest first, with an honest snapshot
 * stamp and unreleased titles flagged rather than listed as out.
 * `today` is an ISO yyyy-mm-dd string (KST) supplied by the caller.
 *
 * `yearPages` (optional) is the set of years that actually have a
 * kpop-releases-<year> page — a Set or an array; the Year cell links only for
 * those and stays plain text otherwise, so the table can never invent a 404.
 * It is a parameter rather than an import because seo-kpop-year.cjs already
 * imports this module, and asking it back would close the cycle. `dir` is the
 * language path prefix ('' for en, 'ja/' …); omit both to keep plain text.
 */
function discogSection(DISCOG, id, lang, today, esc, yearPages, dir) {
  const rows = releasesFor(DISCOG, id);
  if (!rows.length) return '';
  const t = tr(lang);
  const asOf = snapshotDate(DISCOG);
  const linkYears = yearPages ? new Set(Array.from(yearPages, String)) : null;
  const prefix = dir || '';
  let html = `<h2>${esc(t.discogH)} <span class="seo-badge">${esc(t.nReleases(rows.length))}</span></h2>`;
  html += `<table class="seo-table kp-disc-table"><thead><tr>`
    + `<th>${esc(t.colYear)}</th><th>${esc(t.colTitle)}</th><th>${esc(t.colDate)}</th>`
    + `</tr></thead><tbody>`;
  for (const r of rows) {
    const upcoming = r.date > today;
    const art = r.art
      ? `<img class="kp-disc-art" src="${esc(r.art)}" alt="" width="56" height="56" loading="lazy" decoding="async">`
      : '';
    const yearCell = linkYears && linkYears.has(r.year)
      ? `<a href="${esc(prefix)}kpop/kpop-releases-${esc(r.year)}.html">${esc(r.year)}</a>`
      : esc(r.year);
    html += `<tr${upcoming ? ' class="is-upcoming"' : ''}>`
      + `<td>${yearCell}</td>`
      + `<td class="kp-disc-t">${art}<span>${esc(r.title)}${r.badge ? ` <span class="seo-badge">${esc(r.badge)}</span>` : ''}</span></td>`
      + `<td>${esc(r.date)}${upcoming ? ` <span class="seo-badge kp-soon">${esc(t.upcoming)}</span>` : ''}</td>`
      + `</tr>`;
  }
  html += `</tbody></table>`;
  if (asOf) html += `<p class="kp-asof">${esc(t.asOf.replace('%d', asOf))}</p>`;
  return html;
}

/**
 * MusicAlbum entries for an act, for the MusicGroup schema's `album` property.
 * Capped: schema should summarise, not mirror the whole table.
 *
 * Announced-but-unreleased titles are excluded. The visible table can flag one
 * as upcoming; `datePublished` cannot be hedged, so emitting a future date
 * there tells search engines a record shipped when it has not. Filtered before
 * the cap, so the limit still yields `limit` real albums.
 *
 * `today` is the caller's ISO yyyy-mm-dd (KST); it falls back to the current
 * KST date so an un-updated call site still cannot leak an unreleased album.
 */
function albumSchema(DISCOG, id, limit, today) {
  const cutoff = today || kstToday();
  return releasesFor(DISCOG, id)
    .filter(r => r.date <= cutoff)
    .slice(0, limit || 12)
    .map(r => ({
      '@type': 'MusicAlbum',
      name: r.title,
      datePublished: r.date,
      ...(r.art ? { image: r.art } : {}),
    }));
}

module.exports = { T, tr, splitAlbumTitle, releasesFor, allReleases, snapshotDate, photoFigure, discogSection, albumSchema };
