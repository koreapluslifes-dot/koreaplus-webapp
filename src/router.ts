/**
 * URL router for the KoreaPlus Cloudflare Worker.
 *
 * Route map:
 *  POST /chat                    → OpenRouter AI chatbot (existing)
 *  POST /place                   → Google Places proxy (existing)
 *  GET  /api/weather             → KMA current weather       ?city=Seoul
 *  GET  /api/forecast            → KMA 3-day forecast        ?city=Seoul
 *  GET  /api/airquality          → AirKorea AQI              ?city=Seoul
 *  GET  /api/festivals           → TourAPI upcoming festivals ?from=YYYYMMDD&to=YYYYMMDD&city=Seoul
 *  GET  /api/places              → TourAPI area-based list   ?city=Seoul&cat=attraction&page=1
 *  GET  /api/nearby              → TourAPI GPS-based search  ?lat=37.5&lng=126.9&radius=5000
 *  GET  /api/shows               → KOPIS performances        ?from=YYYYMMDD&to=YYYYMMDD&cat=BBBC
 *  GET  /api/boxoffice           → KOPIS box office ranking  ?type=week&date=YYYYMMDD
 *  GET  /api/subway              → Seoul subway arrivals     ?station=강남
 *  GET  /api/bikes               → 따릉이 availability       ?start=1&end=50
 *  GET  /api/exchange            → Exchange rates (KRW base)
 *  GET  /api/cities              → Supported city list
 *  GET  /api/kpop/charts         → iTunes RSS chart (no key)  ?store=kr&type=songs&limit=50
 *  GET  /api/kpop/ticker         → Live chart ticker (no key)
 *  GET  /api/kpop/bio            → Wikidata/Wikipedia bio (no key)  ?qid=Q..&lang=ko
 *  GET  /api/kpop/artist         → Aggregated profile  ?id=..&qid=..&spotify=..&channel=..&lang=ko
 *  GET  /api/kpop/feed           → Real-time news (NewsData)  ?artist=NewJeans&lang=en
 *  GET  /api/kpop/concerts       → Tour dates (Ticketmaster)  ?artist=SEVENTEEN&country=US
 *  GET  /api/health              → Health check (all services)
 */

import { TourApiClient } from './api/tourapi.ts';
import { KopisClient, KOPIS_AREA_CODES } from './api/kopis.ts';
import { WeatherClient } from './api/weather.ts';
import { AirQualityClient } from './api/airquality.ts';
import { TransitClient } from './api/transit.ts';
import { ExchangeClient } from './api/exchange.ts';
// K-Pop vertical clients
import { ItunesClient, type ItunesChartType } from './api/itunes.ts';
import { WikidataClient } from './api/wikidata.ts';
import { SpotifyClient } from './api/spotify.ts';
import { YoutubeClient } from './api/youtube.ts';
import { NewsdataClient } from './api/newsdata.ts';
import { TicketmasterClient } from './api/ticketmaster.ts';
// K-Beauty vertical client
import { AliExpressClient } from './api/aliexpress.ts';
import { withCache } from './cache.ts';
import type { ApiResponse, TickerItem, KpopArtist, DataSource } from './api/schema.ts';
import type { WorkerEnv } from './worker.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse<T>(payload: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 500): Response {
  return jsonResponse<null>({ data: null as unknown as null, cached: false, error: message }, status);
}

function qp(url: URL, key: string, fallback?: string): string {
  return url.searchParams.get(key) ?? fallback ?? '';
}

/** Today as YYYYMMDD (KST = UTC+9) */
function todayKST(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '');
}

/** Date N days from today as YYYYMMDD (KST) */
function futureDateKST(daysAhead: number): string {
  return new Date(Date.now() + 9 * 3600_000 + daysAhead * 86_400_000)
    .toISOString().slice(0, 10).replace(/-/g, '');
}

export async function handleApiRoute(request: Request, env: WorkerEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '');

  // ── GET /api/weather ──────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/weather')) {
    const city = qp(url, 'city', 'Seoul');
    if (!env.KMA_API_KEY) return errorResponse('KMA_API_KEY not configured', 503);
    const client = new WeatherClient(env.KMA_API_KEY);
    try {
      const { data, cached, cacheAgeSeconds } = await withCache(
        env, `weather:${city}`, 7200,
        () => client.getCurrentWeather(city),
      );
      return jsonResponse({ data, cached, cacheAgeSeconds, source: 'kma' });
    } catch (e) {
      return errorResponse(`Weather fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/forecast ─────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/forecast')) {
    const city = qp(url, 'city', 'Seoul');
    if (!env.KMA_API_KEY) return errorResponse('KMA_API_KEY not configured', 503);
    const client = new WeatherClient(env.KMA_API_KEY);
    try {
      const { data, cached } = await withCache(
        env, `forecast:${city}`, 10800,
        () => client.getForecast(city),
      );
      return jsonResponse({ data, cached, source: 'kma' });
    } catch (e) {
      return errorResponse(`Forecast fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/airquality ───────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/airquality')) {
    const city = qp(url, 'city', 'Seoul');
    if (!env.AIRKOREA_API_KEY) return errorResponse('AIRKOREA_API_KEY not configured', 503);
    const client = new AirQualityClient(env.AIRKOREA_API_KEY);
    try {
      const { data, cached, cacheAgeSeconds } = await withCache(
        env, `aqi:${city}`, 3600,
        () => client.getCityAqi(city),
      );
      return jsonResponse({ data, cached, cacheAgeSeconds, source: 'airkorea' });
    } catch (e) {
      return errorResponse(`AQI fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/festivals ────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/festivals')) {
    const from  = qp(url, 'from', todayKST());
    const to    = qp(url, 'to',   futureDateKST(90));
    const city  = qp(url, 'city') || undefined;
    const page  = parseInt(qp(url, 'page', '1'));
    if (!env.TOUR_API_KEY) return errorResponse('TOUR_API_KEY not configured', 503);
    const client = new TourApiClient(env.TOUR_API_KEY);
    try {
      const cacheKey = `festivals:${from}:${to}:${city ?? 'all'}:${page}`;
      const { data, cached } = await withCache(
        env, cacheKey, 43200,
        () => client.getFestivals({ eventStartDate: from, eventEndDate: to, city, page }),
      );
      return jsonResponse({ data, cached, source: 'tourapi' });
    } catch (e) {
      return errorResponse(`Festivals fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/places ───────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/places')) {
    const city = qp(url, 'city', 'Seoul');
    const cat  = qp(url, 'cat') || undefined;
    const page = parseInt(qp(url, 'page', '1'));
    if (!env.TOUR_API_KEY) return errorResponse('TOUR_API_KEY not configured', 503);
    const client = new TourApiClient(env.TOUR_API_KEY);
    try {
      const cacheKey = `places:${city}:${cat ?? 'all'}:${page}`;
      const { data, cached } = await withCache(
        env, cacheKey, 86400,
        () => client.getAreaBasedList({ city, category: cat as never, page }),
      );
      return jsonResponse({ data, cached, source: 'tourapi' });
    } catch (e) {
      return errorResponse(`Places fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/nearby ───────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/nearby')) {
    const lat    = parseFloat(qp(url, 'lat', '37.57'));
    const lng    = parseFloat(qp(url, 'lng', '126.97'));
    const radius = parseInt(qp(url, 'radius', '5000'));
    const cat    = qp(url, 'cat') || undefined;
    if (!env.TOUR_API_KEY) return errorResponse('TOUR_API_KEY not configured', 503);
    const client = new TourApiClient(env.TOUR_API_KEY);
    try {
      const cacheKey = `nearby:${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}:${cat ?? 'all'}`;
      const { data, cached } = await withCache(
        env, cacheKey, 3600,
        () => client.getLocationBased({ lat, lng, radius, category: cat as never }),
      );
      return jsonResponse({ data, cached, source: 'tourapi' });
    } catch (e) {
      return errorResponse(`Nearby fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/shows ────────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/shows')) {
    const from  = qp(url, 'from', todayKST());
    const to    = qp(url, 'to',   futureDateKST(30));
    const cat   = qp(url, 'cat') || undefined;
    const state = qp(url, 'state') as '01' | '02' | '03' | '' || undefined;
    const area  = qp(url, 'area') || undefined;
    const page  = parseInt(qp(url, 'page', '1'));
    if (!env.KOPIS_API_KEY) return errorResponse('KOPIS_API_KEY not configured', 503);
    const client = new KopisClient(env.KOPIS_API_KEY);
    const areaCode = area ? KOPIS_AREA_CODES[area] : undefined;
    try {
      const cacheKey = `shows:${from}:${to}:${cat ?? 'all'}:${areaCode ?? 'all'}:${page}`;
      const { data, cached } = await withCache(
        env, cacheKey, 21600,
        () => client.getPerformances({ stdate: from, eddate: to, shcate: cat, prfstate: state, area: areaCode, cpage: page }),
      );
      return jsonResponse({ data, cached, source: 'kopis' });
    } catch (e) {
      return errorResponse(`Shows fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/boxoffice ────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/boxoffice')) {
    const type = (qp(url, 'type', 'week') === 'month' ? 'month' : 'week') as 'week' | 'month';
    const date = qp(url, 'date', todayKST());
    const cat  = qp(url, 'cat') || undefined;
    if (!env.KOPIS_API_KEY) return errorResponse('KOPIS_API_KEY not configured', 503);
    const client = new KopisClient(env.KOPIS_API_KEY);
    try {
      const { data, cached } = await withCache(
        env, `boxoffice:${type}:${date}:${cat ?? 'all'}`, 86400,
        () => client.getBoxOffice({ ststype: type, date, catecode: cat }),
      );
      return jsonResponse({ data, cached, source: 'kopis' });
    } catch (e) {
      return errorResponse(`Box office fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/subway ───────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/subway')) {
    const station = qp(url, 'station', '강남');
    const subwayKey = env.SEOUL_SUBWAY_KEY || env.SEOUL_OPEN_DATA_KEY;
    if (!subwayKey) return errorResponse('SEOUL_SUBWAY_KEY not configured', 503);
    const client = new TransitClient(subwayKey);
    try {
      // 30-second cache — real-time data
      const { data, cached } = await withCache(
        env, `subway:${station}`, 30,
        () => client.getSubwayArrivals(station),
      );
      return jsonResponse({ data, cached, source: 'seoul' });
    } catch (e) {
      return errorResponse(`Subway fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/bikes ────────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/bikes')) {
    const lat = parseFloat(qp(url, 'lat', '0'));
    const lng = parseFloat(qp(url, 'lng', '0'));
    const radius = parseFloat(qp(url, 'radius', '1.5'));
    if (!env.SEOUL_OPEN_DATA_KEY) return errorResponse('SEOUL_OPEN_DATA_KEY not configured', 503);
    const client = new TransitClient(env.SEOUL_OPEN_DATA_KEY);
    try {
      const { data, cached } = await withCache(
        env, `bikes:${lat.toFixed(3)}:${lng.toFixed(3)}`, 120,
        () => lat && lng
          ? client.getNearbyBikeStations(lat, lng, radius)
          : client.getBikeStations(1, 50),
      );
      return jsonResponse({ data, cached, source: 'seoul' });
    } catch (e) {
      return errorResponse(`Bikes fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/exchange ─────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/exchange')) {
    if (!env.EXCHANGE_RATE_KEY) return errorResponse('EXCHANGE_RATE_KEY not configured', 503);
    const client = new ExchangeClient(env.EXCHANGE_RATE_KEY);
    try {
      const { data, cached, cacheAgeSeconds } = await withCache(
        env, 'exchange:krw', 21600,
        () => client.getRates(),
      );
      return jsonResponse({ data, cached, cacheAgeSeconds, source: 'exchangerate-api' });
    } catch (e) {
      return errorResponse(`Exchange rate fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/cities ───────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/cities')) {
    return jsonResponse({
      data: WeatherClient.supportedCities(),
      cached: false,
      source: 'static',
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // K-POP VERTICAL  (/api/kpop/*)
  // Zero-key routes (charts, ticker, bio) always work; keyed routes (feed,
  // concerts) and keyed enrichment (artist) degrade gracefully when a secret
  // is absent — identical to the weather/exchange pattern above.
  // ════════════════════════════════════════════════════════════════════════

  // ── GET /api/kpop/charts ──────────────────────────────────────────────────
  // iTunes RSS (NO key). ?store=kr&type=songs|albums|music-videos&limit=50
  if (request.method === 'GET' && path.endsWith('/api/kpop/charts')) {
    const store = qp(url, 'store', 'kr');
    const type = (qp(url, 'type', 'songs') as ItunesChartType);
    const limit = parseInt(qp(url, 'limit', '50'));
    const client = new ItunesClient();
    try {
      const { data, cached, cacheAgeSeconds } = await withCache(
        env, `kpop:charts:${store}:${type}:${limit}`, 3600,
        () => client.getChart({ store, type, limit }),
      );
      return jsonResponse({ data, cached, cacheAgeSeconds, source: 'itunes' });
    } catch (e) {
      return errorResponse(`Charts fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/kpop/yt ──────────────────────────────────────────────────────
  // Resolve the top YouTube videoId for a query (NO key — scrapes the public
  // search HTML for the first "videoId"). Lets the hub play songs IN-PAGE by id
  // instead of bouncing to Apple Music. Cached 24h.  ?q=NewJeans Super Shy
  if (request.method === 'GET' && path.endsWith('/api/kpop/yt')) {
    const q = qp(url, 'q', '').trim();
    if (!q) return errorResponse('Missing q parameter');
    try {
      const { data, cached, cacheAgeSeconds } = await withCache(
        env, `kpop:yt:${q.toLowerCase()}`, 86400,
        async (): Promise<{ videoId: string | null }> => {
          const res = await globalThis.fetch(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en&gl=US`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9', 'Cookie': 'CONSENT=YES+1' } },
          );
          const html = await res.text();
          const m = html.match(/"videoId":"([0-9A-Za-z_-]{11})"/);
          return { videoId: m ? m[1] : null };
        },
      );
      return jsonResponse({ data, cached, cacheAgeSeconds, source: 'youtube' });
    } catch (e) {
      return errorResponse(`YT search failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/kpop/ticker ──────────────────────────────────────────────────
  // Zero-key scrolling ticker built from the KR chart. Client prepends its own
  // comeback countdowns (computed from kpop-data.js) ahead of these.
  if (request.method === 'GET' && path.endsWith('/api/kpop/ticker')) {
    const client = new ItunesClient();
    try {
      const { data, cached } = await withCache(
        env, 'kpop:ticker', 1800,
        async (): Promise<TickerItem[]> => {
          const chart = await client.getChart({ store: 'kr', type: 'songs', limit: 10 });
          return chart.slice(0, 8).map((c): TickerItem => ({
            kind: 'chart',
            text: `${c.artist} — ${c.title}`,
            artist: c.artist,
            value: `#${c.rank}`,
            url: c.url,
          }));
        },
      );
      return jsonResponse({ data, cached, source: 'itunes' });
    } catch (e) {
      return errorResponse(`Ticker fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/kpop/bio ─────────────────────────────────────────────────────
  // Wikidata + Wikipedia (NO key). ?qid=Q24862373&lang=ko
  if (request.method === 'GET' && path.endsWith('/api/kpop/bio')) {
    const qid = qp(url, 'qid');
    const lang = qp(url, 'lang', 'en');
    if (!qid) return errorResponse('qid required', 400);
    const client = new WikidataClient();
    try {
      const { data, cached } = await withCache(
        env, `kpop:bio:${qid}:${lang}`, 86400,
        () => client.getBio(qid, lang),
      );
      return jsonResponse({ data, cached, source: 'wikidata' });
    } catch (e) {
      return errorResponse(`Bio fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/kpop/artist ──────────────────────────────────────────────────
  // Aggregated profile enrichment. ?id=newjeans&qid=Q..&spotify=..&channel=UC..&lang=ko
  // Wikidata always; Spotify/YouTube only when their secrets exist.
  if (request.method === 'GET' && path.endsWith('/api/kpop/artist')) {
    const id = qp(url, 'id');
    const qid = qp(url, 'qid');
    const spotifyId = qp(url, 'spotify');
    const channelId = qp(url, 'channel');
    const lang = qp(url, 'lang', 'en');
    if (!id) return errorResponse('id required', 400);
    try {
      const { data, cached } = await withCache(
        env, `kpop:artist:${id}:${lang}`, 43200,
        async (): Promise<Partial<KpopArtist>> => {
          const sources: DataSource[] = [];
          const out: Partial<KpopArtist> = { id, sources, updatedAt: new Date().toISOString() };
          if (qid) {
            try {
              const bio = await new WikidataClient().getBio(qid, lang);
              if (bio) {
                out.bio = bio.bio;
                out.bioUrl = bio.wikipediaUrl;
                if (bio.image) out.image = bio.image;
                if (bio.label) out.nameEn = bio.label;
                sources.push('wikidata');
              }
            } catch { /* bio optional */ }
          }
          if (spotifyId && env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET) {
            try {
              const sp = await new SpotifyClient(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET, env).getArtist(spotifyId);
              out.spotifyId = spotifyId;
              if (sp.spotifyPopularity != null) out.spotifyPopularity = sp.spotifyPopularity;
              if (sp.spotifyFollowers != null) out.spotifyFollowers = sp.spotifyFollowers;
              if (sp.genres) out.genres = sp.genres;
              if (sp.image) out.image = sp.image;
              sources.push('spotify');
            } catch { /* spotify optional */ }
          }
          if (channelId && env.YOUTUBE_API_KEY) {
            try {
              const yt = await new YoutubeClient(env.YOUTUBE_API_KEY).getChannelStats(channelId);
              out.youtubeChannelId = channelId;
              out.youtubeSubscribers = yt.subscribers;
              out.youtubeViews = yt.views;
              sources.push('youtube');
            } catch { /* youtube optional */ }
          }
          return out;
        },
      );
      return jsonResponse({ data, cached, source: 'kpop' });
    } catch (e) {
      return errorResponse(`Artist fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/kpop/feed ────────────────────────────────────────────────────
  // Real-time news/근황 (NewsData.io). ?artist=NewJeans&lang=en
  if (request.method === 'GET' && path.endsWith('/api/kpop/feed')) {
    const q = qp(url, 'artist') || qp(url, 'q');
    const lang = qp(url, 'lang') || undefined;
    if (!env.NEWSDATA_API_KEY) return errorResponse('NEWSDATA_API_KEY not configured', 503);
    const client = new NewsdataClient(env.NEWSDATA_API_KEY);
    try {
      const { data, cached } = await withCache(
        env, `kpop:feed:${q || 'all'}:${lang || 'any'}`, 300,
        () => client.getNews({ q, lang }),
      );
      return jsonResponse({ data, cached, source: 'newsdata' });
    } catch (e) {
      return errorResponse(`Feed fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/kpop/concerts ────────────────────────────────────────────────
  // Global tour dates (Ticketmaster). ?artist=SEVENTEEN&country=US
  // For Korea shows, use the existing /api/shows (KOPIS).
  if (request.method === 'GET' && path.endsWith('/api/kpop/concerts')) {
    const keyword = qp(url, 'artist') || qp(url, 'keyword') || undefined;
    const countryCode = qp(url, 'country') || undefined;
    if (!env.TICKETMASTER_API_KEY) return errorResponse('TICKETMASTER_API_KEY not configured', 503);
    const client = new TicketmasterClient(env.TICKETMASTER_API_KEY);
    try {
      const { data, cached } = await withCache(
        env, `kpop:concerts:${keyword || 'all'}:${countryCode || 'all'}`, 21600,
        () => client.getConcerts({ keyword, countryCode }),
      );
      return jsonResponse({ data, cached, source: 'ticketmaster' });
    } catch (e) {
      return errorResponse(`Concerts fetch failed: ${(e as Error).message}`);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // K-BEAUTY VERTICAL  (/api/kbeauty/*)
  // bio = zero-key (Wikidata). products = AliExpress affiliate (server-side
  // HMAC); returns [] when ALI_APP_* secrets are absent, so the frontend shows
  // its curated retailer strip instead of erroring — same graceful pattern.
  // ════════════════════════════════════════════════════════════════════════

  // ── GET /api/kbeauty/products ──────────────────────────────────────────────
  // AliExpress affiliate grid, geo-localized. ?q=korean+skincare&lang=ko
  if (request.method === 'GET' && path.endsWith('/api/kbeauty/products')) {
    const q = qp(url, 'q') || 'korean skincare';
    const lang = qp(url, 'lang', 'en');
    const country = (((request as unknown) as { cf?: { country?: string } }).cf?.country) || '';
    if (!env.ALI_APP_KEY || !env.ALI_APP_SECRET) {
      // No creds → empty grid (frontend falls back to curated retailers).
      return jsonResponse({ data: [], cached: false, source: 'aliexpress' });
    }
    const client = new AliExpressClient(env.ALI_APP_KEY, env.ALI_APP_SECRET);
    try {
      // Cache key carries a version (v2) so the empty results cached before the
      // tracking_id fix don't linger for their 12h TTL.
      const { data, cached, cacheAgeSeconds } = await withCache(
        env, `kbeauty:products:v2:${lang}:${country || 'XX'}:${q.toLowerCase()}`, 43200,
        () => client.searchProducts(q, lang, country),
      );
      return jsonResponse({ data, cached, cacheAgeSeconds, source: 'aliexpress' });
    } catch (e) {
      return errorResponse(`Products fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/kbeauty/bio ───────────────────────────────────────────────────
  // Brand bio via Wikidata + Wikipedia (NO key). ?qid=Q..&lang=ko
  if (request.method === 'GET' && path.endsWith('/api/kbeauty/bio')) {
    const qid = qp(url, 'qid');
    const lang = qp(url, 'lang', 'en');
    if (!qid) return errorResponse('qid required', 400);
    const client = new WikidataClient();
    try {
      const { data, cached } = await withCache(
        env, `kbeauty:bio:${qid}:${lang}`, 86400,
        () => client.getBio(qid, lang),
      );
      return jsonResponse({ data, cached, source: 'wikidata' });
    } catch (e) {
      return errorResponse(`Bio fetch failed: ${(e as Error).message}`);
    }
  }

  // ── GET /api/health ───────────────────────────────────────────────────────
  if (request.method === 'GET' && path.endsWith('/api/health')) {
    const services: Record<string, boolean> = {
      openrouter:    !!env.OPENROUTER_API_KEY,
      google_places: !!env.GOOGLE_PLACES_KEY,
      tour_api:      !!env.TOUR_API_KEY,
      kopis:         !!env.KOPIS_API_KEY,
      kma_weather:   !!env.KMA_API_KEY,
      airkorea:      !!env.AIRKOREA_API_KEY,
      seoul_transit: !!env.SEOUL_OPEN_DATA_KEY,
      exchange_rate: !!env.EXCHANGE_RATE_KEY,
    };
    const allConfigured = Object.values(services).every(Boolean);
    // K-Pop sources: itunes + wikidata need no key (always live); the rest are optional.
    const kpop: Record<string, boolean> = {
      itunes:       true,
      wikidata:     true,
      youtube:      !!env.YOUTUBE_API_KEY,
      spotify:      !!(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET),
      newsdata:     !!env.NEWSDATA_API_KEY,
      ticketmaster: !!env.TICKETMASTER_API_KEY,
    };
    // K-Beauty sources: wikidata needs no key (always live); aliexpress is optional.
    const kbeauty: Record<string, boolean> = {
      wikidata:   true,
      aliexpress: !!(env.ALI_APP_KEY && env.ALI_APP_SECRET),
    };
    return jsonResponse(
      { data: { services, kpop, kbeauty, allConfigured }, cached: false, source: 'worker' },
      allConfigured ? 200 : 206,
    );
  }

  return null; // no route matched
}
