/**
 * Apple iTunes / Apple Music RSS — the only FREE, LEGAL, real-time chart source.
 *
 * No API key required (never 503s — guarantees baseline chart content).
 * Generator: https://rss.marketingtools.apple.com/
 * Feed URL:  https://rss.marketingtools.apple.com/api/v2/{store}/music/{feed}/{limit}/{type}.json
 *   store = storefront code (kr, us, jp, ...)
 *   feed  = most-played | new-releases-... (we use most-played = top songs/albums/MVs)
 *   type  = songs | albums | music-videos
 *
 * The KR storefront top-songs feed is heavily K-pop; the client cross-references
 * entries against KPOP_ROSTER for highlighting. Charts update slowly → cache ≥1h.
 *
 * @example
 *   const client = new ItunesClient();
 *   const chart = await client.getChart({ store: 'kr', type: 'songs', limit: 50 });
 */

import type { ChartEntry } from './schema.ts';

const BASE_URL = 'https://rss.marketingtools.apple.com/api/v2';

interface AppleFeedResult {
  artistName?: string;
  id?: string;
  name?: string;
  releaseDate?: string;
  kind?: string;
  artistUrl?: string;
  artworkUrl100?: string;
  url?: string;
}

interface AppleFeedResponse {
  feed?: {
    title?: string;
    country?: string;
    updated?: string;
    results?: AppleFeedResult[];
  };
}

export type ItunesChartType = 'songs' | 'albums' | 'music-videos';

export class ItunesClient {
  // No key — public RSS.

  /**
   * Fetch a most-played chart for a storefront.
   * @returns ChartEntry[] ranked 1..N
   */
  async getChart(opts: { store?: string; type?: ItunesChartType; limit?: number } = {}): Promise<ChartEntry[]> {
    const store = (opts.store || 'kr').toLowerCase().slice(0, 2);
    const type: ItunesChartType = opts.type || 'songs';
    const limit = Math.min(Math.max(opts.limit || 50, 1), 100);

    const url = `${BASE_URL}/${store}/music/most-played/${limit}/${type}.json`;
    const res = await globalThis.fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`iTunes RSS HTTP ${res.status} (${store}/${type})`);

    const data = await res.json() as AppleFeedResponse;
    const results = data.feed?.results ?? [];
    return results.map((r, i): ChartEntry => ({
      rank: i + 1,
      title: r.name ?? '',
      artist: r.artistName ?? '',
      // upgrade the thumbnail resolution (Apple lets us swap 100x100 → 300x300)
      artworkUrl: r.artworkUrl100 ? r.artworkUrl100.replace('100x100', '300x300') : undefined,
      url: r.url,
      releaseDate: r.releaseDate,
      kind: r.kind ?? type,
      store,
    }));
  }
}
