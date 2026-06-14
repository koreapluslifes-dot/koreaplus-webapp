/**
 * Ticketmaster Discovery API — global concerts / world-tour dates.
 *
 * Strong for Western legs of K-pop world tours; weak in Asia/KR (pair with the
 * already-wired KOPIS `/api/shows` for Korea shows). Free tier: 5,000 calls/day,
 * 5 req/sec. The event `url` is affiliate-ready (route through Impact for
 * commission — note: no commission on presales or the first 24h of on-sale).
 *
 * Secret: TICKETMASTER_API_KEY
 *
 * @example
 *   const client = new TicketmasterClient(env.TICKETMASTER_API_KEY);
 *   const shows = await client.getConcerts({ keyword: 'SEVENTEEN' });
 */

import type { KpopConcert } from './schema.ts';

const API = 'https://app.ticketmaster.com/discovery/v2/events.json';

interface TmImage { url?: string; width?: number; ratio?: string }
interface TmVenue {
  name?: string;
  city?: { name?: string };
  country?: { name?: string; countryCode?: string };
}
interface TmDateInfo { localDate?: string; dateTime?: string }
interface TmEvent {
  id?: string;
  name?: string;
  url?: string;
  images?: TmImage[];
  dates?: { start?: TmDateInfo; status?: { code?: string } };
  sales?: { public?: { startDateTime?: string } };
  _embedded?: { venues?: TmVenue[]; attractions?: { name?: string }[] };
}
interface TmResponse { _embedded?: { events?: TmEvent[] } }

const bestImage = (imgs?: TmImage[]): string | undefined => {
  if (!imgs?.length) return undefined;
  const wide = imgs.filter(i => i.ratio === '16_9' && (i.width ?? 0) >= 640);
  return (wide[0] || imgs[0])?.url;
};

export class TicketmasterClient {
  private readonly key: string;

  constructor(apiKey: string) {
    this.key = apiKey.trim();
  }

  /** Search upcoming K-pop concerts (defaults to the K-Pop classification). */
  async getConcerts(opts: { keyword?: string; countryCode?: string; size?: number } = {}): Promise<KpopConcert[]> {
    const params = new URLSearchParams({
      apikey: this.key,
      classificationName: 'K-Pop',
      sort: 'date,asc',
      size: String(Math.min(opts.size ?? 30, 100)),
    });
    if (opts.keyword) params.set('keyword', opts.keyword);
    if (opts.countryCode) params.set('countryCode', opts.countryCode);

    const res = await globalThis.fetch(`${API}?${params.toString()}`, {
      signal: AbortSignal.timeout(9_000),
    });
    if (!res.ok) throw new Error(`Ticketmaster HTTP ${res.status}`);
    const data = await res.json() as TmResponse;

    return (data._embedded?.events ?? []).map((e): KpopConcert => {
      const venue = e._embedded?.venues?.[0];
      return {
        id: e.id ?? '',
        name: e.name ?? '',
        artist: e._embedded?.attractions?.[0]?.name,
        venue: venue?.name,
        city: venue?.city?.name,
        country: venue?.country?.name ?? venue?.country?.countryCode,
        date: e.dates?.start?.dateTime ?? e.dates?.start?.localDate,
        onSaleDate: e.sales?.public?.startDateTime,
        url: e.url,
        image: bestImage(e.images),
        source: 'ticketmaster',
      };
    });
  }
}
