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
 *  GET  /api/health              → Health check (all services)
 */

import { TourApiClient } from './api/tourapi.ts';
import { KopisClient, KOPIS_AREA_CODES } from './api/kopis.ts';
import { WeatherClient } from './api/weather.ts';
import { AirQualityClient } from './api/airquality.ts';
import { TransitClient } from './api/transit.ts';
import { ExchangeClient } from './api/exchange.ts';
import { withCache } from './cache.ts';
import type { ApiResponse } from './api/schema.ts';
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
    if (!env.SEOUL_OPEN_DATA_KEY) return errorResponse('SEOUL_OPEN_DATA_KEY not configured', 503);
    const client = new TransitClient(env.SEOUL_OPEN_DATA_KEY);
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
    return jsonResponse(
      { data: { services, allConfigured }, cached: false, source: 'worker' },
      allConfigured ? 200 : 206,
    );
  }

  return null; // no route matched
}
