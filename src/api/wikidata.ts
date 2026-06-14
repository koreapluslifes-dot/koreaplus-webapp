/**
 * Wikidata + Wikipedia REST — multilingual artist bios & entity linking.
 *
 * No API key required (a descriptive User-Agent is MANDATORY or Wikimedia
 * throttles/429s a commercial caller). Powers 9-language bios on profile pages
 * and resolves cross-IDs (Spotify P1902 / YouTube P2397 / MusicBrainz P434) so
 * the manual roster can be stitched to every other source.
 *
 * @example
 *   const client = new WikidataClient();
 *   const bio = await client.getBio('Q24862373', 'ko'); // NewJeans, Korean
 */

const UA = 'KoreaPlus/1.0 (https://koreaplus-lifes.com; K-Pop hub; contact@koreaplus-lifes.com)';
const WD_API = 'https://www.wikidata.org/w/api.php';

interface WdLabelMap { [lang: string]: { value: string } }
interface WdSitelink { title: string; url?: string }
interface WdEntity {
  labels?: WdLabelMap;
  descriptions?: WdLabelMap;
  sitelinks?: { [wiki: string]: WdSitelink };
}
interface WdEntitiesResponse { entities?: { [qid: string]: WdEntity } }

interface WpSummary {
  extract?: string;
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
}

export interface ArtistBio {
  qid: string;
  lang: string;
  label: string;
  description: string;
  bio: string;          // Wikipedia extract (falls back to the WD description)
  image?: string;
  wikipediaUrl?: string;
}

export class WikidataClient {
  // No key — public API, UA required.

  private async fetchJson<T>(url: string): Promise<T> {
    const res = await globalThis.fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Wikimedia HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  /** Get a localized bio for a Wikidata item (QID), falling back to English. */
  async getBio(qid: string, lang = 'en'): Promise<ArtistBio | null> {
    const safeLang = /^[a-z]{2,3}$/.test(lang) ? lang : 'en';
    const url = `${WD_API}?action=wbgetentities&ids=${encodeURIComponent(qid)}`
      + `&props=labels|descriptions|sitelinks&languages=${safeLang}|en`
      + `&format=json&origin=*`;
    const data = await this.fetchJson<WdEntitiesResponse>(url);
    const entity = data.entities?.[qid];
    if (!entity) return null;

    const label = entity.labels?.[safeLang]?.value || entity.labels?.en?.value || '';
    const description = entity.descriptions?.[safeLang]?.value || entity.descriptions?.en?.value || '';

    // Prefer the language-matched Wikipedia, fall back to English.
    const sitelinks = entity.sitelinks ?? {};
    const wikiKey = sitelinks[`${safeLang}wiki`] ? `${safeLang}wiki`
      : (sitelinks.enwiki ? 'enwiki' : null);

    let bio = description;
    let image: string | undefined;
    let wikipediaUrl: string | undefined;

    if (wikiKey) {
      const wlang = wikiKey.replace(/wiki$/, '');
      const title = sitelinks[wikiKey].title;
      try {
        const summary = await this.fetchSummary(wlang, title);
        if (summary?.extract) bio = summary.extract;
        image = summary?.thumbnail?.source;
        wikipediaUrl = summary?.content_urls?.desktop?.page;
      } catch {
        // Wikipedia summary optional — keep the Wikidata description as bio.
      }
    }

    return { qid, lang: safeLang, label, description, bio, image, wikipediaUrl };
  }

  private async fetchSummary(wlang: string, title: string): Promise<WpSummary | null> {
    const t = encodeURIComponent(title.replace(/ /g, '_'));
    const url = `https://${wlang}.wikipedia.org/api/rest_v1/page/summary/${t}`;
    return this.fetchJson<WpSummary>(url);
  }
}
