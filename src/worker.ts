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
import type { CacheEnv } from './cache.ts';

// ── Worker environment type ───────────────────────────────────────────────────

export interface WorkerEnv extends CacheEnv {
  // Existing
  OPENROUTER_API_KEY: string;
  GOOGLE_PLACES_KEY:  string;
  // New public API keys
  TOUR_API_KEY:           string;
  KOPIS_API_KEY:          string;
  KMA_API_KEY:            string;
  AIRKOREA_API_KEY:       string;
  SEOUL_OPEN_DATA_KEY:    string;
  EXCHANGE_RATE_KEY:      string;
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
If asked in Korean, reply in Korean. Keep answers under 200 words.
Always end with one quick practical tip 💡.
Topics: Korean food, travel, transportation, K-beauty, K-pop, shopping, history, culture, companies.`;

// US-based models only (security policy: no Chinese-origin models)
const MODEL_PRIMARY  = 'meta-llama/llama-3.2-3b-instruct:free';
const MODEL_FALLBACK = 'openai/gpt-oss-20b:free';

// ── Chat handler ──────────────────────────────────────────────────────────────

async function handleChat(body: { message?: string; history?: { role: string; content: string }[] }, env: WorkerEnv): Promise<Response> {
  const { message, history = [] } = body;
  if (!message?.trim()) return json({ error: 'No message' }, 400);

  const messages = [
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const callOpenRouter = async (model: string) =>
    globalThis.fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://koreaplus-lifes.com',
        'X-Title': 'KoreaPlus AI Guide',
      },
      body: JSON.stringify({
        model,
        max_tokens: 220,
        temperature: 0.6,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });

  try {
    let res = await callOpenRouter(MODEL_PRIMARY);
    if (!res.ok) res = await callOpenRouter(MODEL_FALLBACK);
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content ?? 'No response.';
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

    // ── GET routes (new public API layer) ─────────────────────────────────
    if (request.method === 'GET') {
      const apiResponse = await handleApiRoute(request, env);
      if (apiResponse) return apiResponse;
      return new Response('Not found', { status: 404, headers: CORS });
    }

    // ── POST routes (existing chatbot + places) ────────────────────────────
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const url = new URL(request.url);
    if (url.pathname.endsWith('/place')) {
      return handlePlace(body as { query?: string }, env);
    }
    return handleChat(body as { message?: string; history?: { role: string; content: string }[] }, env);
  },
};
