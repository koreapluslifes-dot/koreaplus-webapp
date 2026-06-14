/**
 * KoreaPlus Cloudflare Worker — main entry point
 *
 * Handles all inbound requests:
 *  - OPTIONS preflight → CORS 204
 *  - GET  /api/*       → public API aggregation routes (router.ts)
 *  - POST /chat        → OpenRouter AI chatbot
 *  - POST /place       → Google Places proxy
 *
 * Secrets (set via `npx wrangler secret put <NAME>`):
 *   OPENROUTER_API_KEY, GOOGLE_PLACES_KEY, TOUR_API_KEY, KOPIS_API_KEY,
 *   KMA_API_KEY, AIRKOREA_API_KEY, SEOUL_OPEN_DATA_KEY, EXCHANGE_RATE_KEY
 */

import { handleApiRoute } from './router.ts';
import { handlePlanRequest, handleSharePost, handleShareGet, handleShareHtml } from './handlers/planner.ts';
import { handleAffiliate } from './handlers/affiliate.ts';
import { handleMenuTranslate } from './handlers/translator.ts';
import type { CacheEnv } from './cache.ts';
import type { LLMEnv } from './api/groq.ts';

// ── Worker environment type ───────────────────────────────────────────────────

export interface WorkerEnv extends CacheEnv, LLMEnv {
  // Existing chat/places keys
  OPENROUTER_API_KEY: string;
  GOOGLE_PLACES_KEY:  string;
  // Phase 1 public API keys
  TOUR_API_KEY:           string;
  KOPIS_API_KEY:          string;
  KMA_API_KEY:            string;
  AIRKOREA_API_KEY:       string;
  SEOUL_OPEN_DATA_KEY:    string;   // 일반 인증키 (따릉이 등)
  SEOUL_SUBWAY_KEY:       string;   // 실시간 지하철 인증키
  EXCHANGE_RATE_KEY:      string;
  // Phase 3: GROQ_API_KEY (primary LLM). Fallback reuses OPENROUTER_API_KEY above.
  // Agoda affiliate (only network). /api/aff falls back to cid deep links without a key.
  AGODA_API_KEY?:         string;   // Long Tail Search API key (live hotel cards)
  AGODA_SITE_ID?:         string;   // overrides the cid for API auth (default 1952761)
  AGODA_CITY_IDS?:        string;   // JSON map: {"Busan":12345,"Jeju":67890}
  // ── K-Pop vertical (all optional — each route degrades to 503 without its key) ──
  // iTunes RSS + Wikidata need NO key. These light up the keyed enrichment:
  YOUTUBE_API_KEY?:       string;   // MV views, channel stats (quota 10k/day)
  SPOTIFY_CLIENT_ID?:     string;   // artist popularity/artwork (Client Credentials)
  SPOTIFY_CLIENT_SECRET?: string;
  NEWSDATA_API_KEY?:      string;   // real-time 근황/news feed
  TICKETMASTER_API_KEY?:  string;   // global concert/tour dates
  LASTFM_API_KEY?:        string;   // (P2) supplementary popularity signal
  // ── K-Beauty vertical (optional) ──────────────────────────────────────────
  // Wikidata bio needs NO key. AliExpress affiliate grid lights up when these
  // are set (reuse app_key 536770 from the sibling apps; tracking_id 'koreaplus').
  ALI_APP_KEY?:           string;   // AliExpress Portals app key
  ALI_APP_SECRET?:        string;   // AliExpress Portals app secret (HMAC signing)
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── AI system prompt (unchanged from original) ────────────────────────────────

const SYSTEM_PROMPT = `You are "Korea AI Guide" — a friendly expert on South Korea for international visitors.
Answer concisely in 2-3 short paragraphs max. Use emojis naturally 🍜🇰🇷🚄.
Give specific, practical tips. Mention Korean words when helpful.
ALWAYS reply in the same language as the user's message. Keep answers under 200 words.
Always end with one quick practical tip 💡.
Topics: Korean food, travel, transportation, K-beauty, K-pop, shopping, history, culture, companies.`;

// US-based models only (security policy: no Chinese-origin models)
const MODEL_PRIMARY  = 'meta-llama/llama-3.2-3b-instruct:free';
const MODEL_FALLBACK = 'openai/gpt-oss-20b:free';

// ── Chat handler ──────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  en: 'English', ko: 'Korean', ja: 'Japanese', zh: 'Chinese (Simplified)',
  es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', id: 'Indonesian',
};

async function handleChat(body: { message?: string; history?: { role: string; content: string }[]; lang?: string }, env: WorkerEnv): Promise<Response> {
  const { message, history = [], lang } = body;
  if (!message?.trim()) return json({ error: 'No message' }, 400);

  // The UI language is the default reply language; mirroring the user's own
  // language still wins if they write in something else.
  const langName = LANG_NAMES[(lang || '').slice(0, 2)] || '';
  const systemContent = langName
    ? `${SYSTEM_PROMPT}\nThe user's interface language is ${langName} — reply in ${langName} unless their message is clearly written in a different language.`
    : SYSTEM_PROMPT;

  const chatMessages = [
    { role: 'system', content: systemContent },
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  type ChatResp = { choices?: { message?: { content?: string } }[] };
  const extract = (data: ChatResp) => data.choices?.[0]?.message?.content?.trim() || '';

  // 1. Groq first (Meta llama-3.1-8b-instant — fast, generous free tier).
  //    Accept either GROQ_API_KEY or groq_api_key (CF secret names are case-sensitive).
  const gk = (env.GROQ_API_KEY || env.groq_api_key || '').trim();
  if (gk) {
    try {
      const res = await globalThis.fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gk}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 320,
          temperature: 0.6,
          messages: chatMessages,
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (res.ok) {
        const reply = extract(await res.json() as ChatResp);
        if (reply) return json({ reply });
        console.error('[Groq chat] ok but empty content');
      } else {
        console.error(`[Groq chat] HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
    } catch (e) { console.error('[Groq chat] threw:', String(e).slice(0, 150)); }
  }

  // 2. OpenRouter fallback
  const callOpenRouter = async (model: string) =>
    globalThis.fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://koreaplus-lifes.com',
        'X-Title': 'KoreaPlus AI Guide',
      },
      body: JSON.stringify({
        model,
        max_tokens: 220,
        temperature: 0.6,
        messages: chatMessages,
      }),
    });

  try {
    let res = await callOpenRouter(MODEL_PRIMARY);
    if (!res.ok) res = await callOpenRouter(MODEL_FALLBACK);
    const reply = extract(await res.json() as ChatResp) || 'No response.';
    return json({ reply });
  } catch {
    return json({ reply: '⚠️ AI temporarily unavailable. Please try again in a moment.' });
  }
}

// ── Google Places proxy ───────────────────────────────────────────────────────

async function handlePlace(body: { query?: string }, env: WorkerEnv): Promise<Response> {
  const { query } = body;
  if (!query) return json({ error: 'No query' }, 400);
  if (!env.GOOGLE_PLACES_KEY) return json({ rating: null, reviews: [], _debug: 'no_key' });

  const searchRes = await globalThis.fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=en&key=${env.GOOGLE_PLACES_KEY}`,
  );
  const searchData = await searchRes.json() as {
    results?: { place_id?: string; name?: string; rating?: number; user_ratings_total?: number }[];
    error_message?: string;
    status?: string;
  };
  if (searchData.error_message) return json({ rating: null, reviews: [], _debug: searchData.error_message });
  const place = searchData.results?.[0];
  if (!place) return json({ rating: null, reviews: [], _debug: 'no_place_found', status: searchData.status });

  const detailRes = await globalThis.fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,user_ratings_total,reviews,opening_hours&language=en&key=${env.GOOGLE_PLACES_KEY}`,
  );
  const detailData = await detailRes.json() as {
    result?: {
      name?: string; rating?: number; user_ratings_total?: number;
      opening_hours?: { open_now?: boolean };
      reviews?: { author_name?: string; rating?: number; text?: string; relative_time_description?: string }[];
    };
  };
  const detail = detailData.result ?? {};

  return json({
    name: detail.name ?? place.name,
    rating: detail.rating ?? place.rating,
    userRatingsTotal: detail.user_ratings_total ?? place.user_ratings_total,
    isOpen: detail.opening_hours?.open_now ?? null,
    reviews: (detail.reviews ?? []).slice(0, 3).map(r => ({
      authorName: r.author_name,
      rating: r.rating,
      text: r.text,
      relativeTime: r.relative_time_description,
    })),
  });
}

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');

    // ── GET routes ────────────────────────────────────────────────────────
    if (request.method === 'GET') {
      // Public, crawlable HTML page for a shared itinerary:  /i/{id}
      const htmlMatch = path.match(/\/i\/([a-f0-9]{24})$/);
      if (htmlMatch) return handleShareHtml(htmlMatch[1], env, request);

      // Shared itinerary retrieval (JSON, for the app)
      const shareMatch = path.match(/\/api\/plan\/share\/([a-f0-9]{24})$/);
      if (shareMatch) return handleShareGet(shareMatch[1], env);

      // Context-matched affiliate offers (Impact.com, fallback-safe)
      if (path.endsWith('/api/aff')) return handleAffiliate(request, env);

      // Sitemap of public shared itineraries (/i/{id}) so they get indexed
      if (path.endsWith('/i-sitemap.xml')) {
        const origin = url.origin;
        let entries = '';
        if (env.CACHE_KV) {
          const list = await env.CACHE_KV.list({ prefix: 'share:', limit: 1000 });
          const today = new Date().toISOString().slice(0, 10);
          entries = list.keys.map(k =>
            `  <url><loc>${origin}/i/${k.name.slice(6)}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`
          ).join('\n');
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
        return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } });
      }

      const apiResponse = await handleApiRoute(request, env);
      if (apiResponse) return apiResponse;
      return new Response('Not found', { status: 404, headers: CORS });
    }

    // ── POST routes ───────────────────────────────────────────────────────
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    // Itinerary generation
    if (path.endsWith('/api/plan') && !path.endsWith('/api/plan/share')) {
      const clientIP = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'unknown';
      return handlePlanRequest(request, env, clientIP);
    }

    // Share storage
    if (path.endsWith('/api/plan/share')) {
      return handleSharePost(request, env);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    // Menu translator
    if (path.endsWith('/api/translate-menu')) return handleMenuTranslate(request, env);

    // Existing: /place and /chat
    if (path.endsWith('/place')) return handlePlace(body as { query?: string }, env);
    return handleChat(body as { message?: string; history?: { role: string; content: string }[] }, env);
  },
};
