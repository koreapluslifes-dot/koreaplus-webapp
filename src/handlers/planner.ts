/**
 * AI Itinerary Builder — main orchestration handler.
 *
 * POST /api/plan        → generate itinerary (rate-limited, cached)
 * POST /api/plan/share  → store itinerary in KV, return UUID
 * GET  /api/plan/share/:id → retrieve shared itinerary from KV
 *
 * Pipeline:
 *   1. Validate inputs & check rate limit
 *   2. Check 24h cache (same inputs → same result)
 *   3. Fetch candidate places from TourAPI (by interest category)
 *   4. Build draft prompt → Groq LLM → parse JSON
 *   5. Apply NN route optimisation per day
 *   6. Polish pass → Groq LLM (lower temperature)
 *   7. Store in cache, return to client
 */

import { TourApiClient } from '../api/tourapi.ts';
import { callLLM } from '../api/groq.ts';
import { buildDraftPrompt, buildPolishPrompt } from '../lib/prompts/itinerary.ts';
import type { ItineraryInputs, CandidatePlace } from '../lib/prompts/itinerary.ts';
import type { PlaceCategory } from '../api/schema.ts';
import { nearestNeighborSort } from '../api/routing.ts';
import type { WorkerEnv } from '../worker.ts';

// ── Constants ─────────────────────────────────────────────────────────────────

const RATE_LIMIT = 3; // free generations per IP per day
const CACHE_TTL  = 86_400; // 24h

const AIRPORT_CITIES: Record<string, string[]> = {
  ICN: ['Seoul', 'Incheon'],
  GMP: ['Seoul'],
  PUS: ['Busan'],
  CJU: ['Jeju'],
};

// Interest → PlaceCategory[] mapping (aligned with TourApiClient categories)
const INTEREST_CATS: Record<string, PlaceCategory[]> = {
  kpop:      ['culture', 'shopping'],
  kdrama:    ['attraction', 'culture'],
  food:      ['food', 'attraction'],
  history:   ['culture', 'attraction'],
  nature:    ['attraction', 'leisure'],
  shopping:  ['shopping'],
  nightlife: ['leisure', 'shopping'],
  wellness:  ['leisure'],
  temples:   ['culture'],
  art:       ['culture'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

function inputHash(inputs: ItineraryInputs): string {
  const raw = [
    inputs.airport,
    daysBetween(inputs.arrival, inputs.departure),
    [...inputs.interests].sort().join(','),
    inputs.pace,
    inputs.budget,
    inputs.mode,
    inputs.travelers,
    [...inputs.specialNeeds].sort().join(','),
  ].join('|');
  // Simple djb2-like hash → hex string
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = (h * 33 ^ raw.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

function safeParseJSON(text: string): unknown {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(stripped); } catch { /* fall through */ }
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* fall through */ } }
  throw new Error('LLM returned non-JSON response');
}

function corsJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

// ── Rate limiting (KV-backed, graceful degradation without KV) ────────────────

async function checkAndIncrementRateLimit(env: WorkerEnv, ip: string): Promise<boolean> {
  if (!env.CACHE_KV) return true; // no KV → no enforcement
  const today = new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
  const key = `rl:${ip}:${today}`;
  const count = parseInt(await env.CACHE_KV.get(key) ?? '0', 10);
  if (count >= RATE_LIMIT) return false;
  await env.CACHE_KV.put(key, String(count + 1), { expirationTtl: 86_400 });
  return true;
}

// ── TourAPI candidate fetching ────────────────────────────────────────────────

async function fetchCandidates(
  env: WorkerEnv,
  inputs: ItineraryInputs
): Promise<CandidatePlace[]> {
  if (!env.TOUR_API_KEY) return [];
  const client = new TourApiClient(env.TOUR_API_KEY);
  const cities = AIRPORT_CITIES[inputs.airport] ?? ['Seoul'];

  // Collect unique (city, category) pairs from interests
  const pairs = new Set<string>();
  for (const interest of inputs.interests) {
    for (const cat of INTEREST_CATS[interest] ?? ['attraction']) {
      for (const city of cities) {
        pairs.add(`${city}|${cat}`);
      }
    }
  }
  // Always include food
  for (const city of cities) pairs.add(`${city}|food`);

  const seen = new Set<string>();
  const results: CandidatePlace[] = [];

  // Fetch in parallel (max 8 concurrent)
  const pairArr = [...pairs].slice(0, 8);
  await Promise.allSettled(pairArr.map(async pair => {
    const [city, cat] = pair.split('|');
    try {
      const { places } = await client.getAreaBasedList({
        city,
        category: cat as PlaceCategory,
        rows: 20,
        page: 1,
      });
      for (const p of places) {
        if (seen.has(p.id) || !p.lat || !p.lng) continue;
        seen.add(p.id);
        results.push({
          id:       p.id,
          name:     p.nameEn || p.nameKo,
          category: p.category,
          lat:      p.lat,
          lng:      p.lng,
          address:  p.address ?? '',
          image:    p.image,
        });
      }
    } catch (err) {
      console.error(`TourAPI ${city}/${cat}:`, String(err).slice(0, 80));
    }
  }));

  return results;
}

// ── Route optimisation ────────────────────────────────────────────────────────

interface DaySlot {
  morning?: unknown[];
  afternoon?: unknown[];
  evening?: unknown[];
  [key: string]: unknown;
}

interface GeoLike { lat?: number; lng?: number; id?: string; [k: string]: unknown }

function optimiseDayRoutes(itinerary: { days?: DaySlot[] }): void {
  if (!itinerary.days) return;
  for (const day of itinerary.days) {
    const slots = ['morning', 'afternoon', 'evening'] as const;
    for (const slot of slots) {
      const places = (day[slot] as GeoLike[] | undefined) ?? [];
      if (places.length < 3) continue;
      const valid = places.filter(p => p.lat && p.lng) as (GeoLike & { lat: number; lng: number; id: string })[];
      if (valid.length < 3) continue;
      const sorted = nearestNeighborSort(valid.map(p => ({ ...p, id: p.id ?? '' })));
      // Preserve any items that lacked lat/lng at the end
      const invalid = places.filter(p => !p.lat || !p.lng);
      (day[slot] as unknown[]) = [...sorted, ...invalid];
    }
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handlePlanRequest(request: Request, env: WorkerEnv, clientIP: string): Promise<Response> {
  let inputs: ItineraryInputs;
  try {
    inputs = await request.json() as ItineraryInputs;
  } catch {
    return corsJson({ error: 'Invalid JSON body' }, 400);
  }

  // Basic validation
  if (!inputs.arrival || !inputs.departure || !inputs.airport || !inputs.interests?.length) {
    return corsJson({ error: 'Missing required fields: arrival, departure, airport, interests' }, 400);
  }
  const days = daysBetween(inputs.arrival, inputs.departure);
  if (days < 1 || days > 14) {
    return corsJson({ error: 'Trip must be 1–14 days' }, 400);
  }

  // Rate limit check
  const allowed = await checkAndIncrementRateLimit(env, clientIP);
  if (!allowed) {
    return corsJson({
      error: 'Daily limit reached',
      detail: `You can generate ${RATE_LIMIT} itineraries per day. Try again tomorrow (KST).`,
      code: 'RATE_LIMITED',
    }, 429);
  }

  // Cache check
  const cacheKey = `plan:${inputHash(inputs)}`;
  if (env.CACHE_KV) {
    const hit = await env.CACHE_KV.get(cacheKey);
    if (hit) {
      return corsJson({ itinerary: JSON.parse(hit), cached: true });
    }
  }

  // Fetch TourAPI candidates
  const candidates = await fetchCandidates(env, inputs);

  // Build draft prompt
  const arrivalDate = new Date(inputs.arrival);
  const draftPrompt = buildDraftPrompt(inputs, candidates, days, arrivalDate);

  // Draft LLM call
  let itinerary: Record<string, unknown>;
  try {
    const draftRaw = await callLLM(draftPrompt, env, 6000, 0.75);
    itinerary = safeParseJSON(draftRaw) as Record<string, unknown>;
  } catch (err) {
    return corsJson({ error: 'Itinerary generation failed', detail: String(err).slice(0, 200) }, 503);
  }

  // Route optimisation
  optimiseDayRoutes(itinerary as { days?: DaySlot[] });

  // Polish pass (lower temperature for editorial quality)
  try {
    const polishPrompt = buildPolishPrompt(JSON.stringify(itinerary, null, 2), inputs);
    const polishedRaw = await callLLM(polishPrompt, env, 6000, 0.3);
    const polished = safeParseJSON(polishedRaw) as Record<string, unknown>;
    // Only adopt polish if it has the expected structure
    if (polished && typeof polished === 'object' && Array.isArray((polished as { days?: unknown }).days)) {
      itinerary = polished as Record<string, unknown>;
    }
  } catch (err) {
    // Polish failure is non-fatal — use the draft
    console.error('[Polish] failed, using draft:', String(err).slice(0, 80));
  }

  // Attach metadata
  itinerary._meta = {
    generatedAt: new Date().toISOString(),
    days,
    airport: inputs.airport,
    interests: inputs.interests,
    pace: inputs.pace,
    budget: inputs.budget,
    mode: inputs.mode,
    candidateCount: candidates.length,
  };

  // Store in cache
  if (env.CACHE_KV) {
    await env.CACHE_KV.put(cacheKey, JSON.stringify(itinerary), { expirationTtl: CACHE_TTL }).catch(() => {});
  }

  return corsJson({ itinerary, cached: false });
}

// ── Share handlers ────────────────────────────────────────────────────────────

export async function handleSharePost(request: Request, env: WorkerEnv): Promise<Response> {
  if (!env.CACHE_KV) {
    return corsJson({ error: 'Share requires KV storage — not configured' }, 503);
  }
  let body: { itinerary?: unknown };
  try {
    body = await request.json() as { itinerary?: unknown };
  } catch {
    return corsJson({ error: 'Invalid JSON' }, 400);
  }
  if (!body.itinerary) return corsJson({ error: 'Missing itinerary' }, 400);

  // Generate UUID-like share ID
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const id = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  await env.CACHE_KV.put(`share:${id}`, JSON.stringify(body.itinerary), { expirationTtl: 60 * 60 * 24 * 30 }); // 30 days

  return corsJson({ id, url: `plan.html?share=${id}` });
}

export async function handleShareGet(id: string, env: WorkerEnv): Promise<Response> {
  if (!env.CACHE_KV) return corsJson({ error: 'Share storage not configured' }, 503);
  const data = await env.CACHE_KV.get(`share:${id}`);
  if (!data) return corsJson({ error: 'Share not found or expired' }, 404);
  return corsJson({ itinerary: JSON.parse(data) });
}
