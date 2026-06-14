/**
 * NewsData.io — real-time global news (the live 근황 / issues feed).
 *
 * Chosen over GNews / NewsAPI.org because NewsData's free tier EXPLICITLY
 * permits commercial use (the others forbid production use). Free tier: 200
 * credits/day (10 articles/credit), 30 credits / 15 min, latest-only.
 *
 * COPYRIGHT GUARDRAIL: we store and display only title + excerpt + link +
 * thumbnail and deep-link the source — never the full article body.
 *
 * Secret: NEWSDATA_API_KEY
 *
 * @example
 *   const client = new NewsdataClient(env.NEWSDATA_API_KEY);
 *   const items = await client.getNews({ q: 'NewJeans', lang: 'en' });
 */

import type { NewsItem } from './schema.ts';

const API = 'https://newsdata.io/api/1/latest';

interface NewsdataArticle {
  title?: string;
  link?: string;
  description?: string;
  source_id?: string;
  source_icon?: string;
  image_url?: string;
  pubDate?: string;
  language?: string;
}
interface NewsdataResponse {
  status?: string;
  results?: NewsdataArticle[];
  message?: string;
}

export class NewsdataClient {
  private readonly key: string;

  constructor(apiKey: string) {
    this.key = apiKey.trim();
  }

  /**
   * Latest news. Defaults target K-pop/entertainment. When `q` is an artist
   * name the feed is artist-specific; otherwise a broad K-pop query.
   */
  async getNews(opts: { q?: string; lang?: string; country?: string } = {}): Promise<NewsItem[]> {
    const q = opts.q?.trim() || 'kpop OR "k-pop" OR kpop comeback';
    const params = new URLSearchParams({ apikey: this.key, q });
    if (opts.lang) params.set('language', opts.lang.slice(0, 2));
    if (opts.country) params.set('country', opts.country.slice(0, 2));
    params.set('category', 'entertainment');

    const res = await globalThis.fetch(`${API}?${params.toString()}`, {
      signal: AbortSignal.timeout(9_000),
    });
    if (!res.ok) throw new Error(`NewsData HTTP ${res.status}`);
    const data = await res.json() as NewsdataResponse;
    if (data.status !== 'success') throw new Error(`NewsData error: ${data.message ?? 'unknown'}`);

    return (data.results ?? [])
      .filter(a => a.title && a.link)
      .map((a): NewsItem => ({
        title: a.title ?? '',
        excerpt: a.description ? a.description.slice(0, 240) : undefined,
        link: a.link ?? '',
        source: a.source_id,
        sourceIcon: a.source_icon,
        imageUrl: a.image_url,
        publishedAt: a.pubDate,
        language: a.language,
        credibility: 'reported',
      }));
  }
}
