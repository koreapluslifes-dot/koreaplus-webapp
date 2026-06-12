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
  // Defensive defaults so optional array fields never crash prompt building (.join/.map/spread)
  inputs.ageGroups    = Array.isArray(inputs.ageGroups)    ? inputs.ageGroups    : [];
  inputs.specialNeeds = Array.isArray(inputs.specialNeeds) ? inputs.specialNeeds : [];
  inputs.interests    = Array.isArray(inputs.interests)    ? inputs.interests    : [];
  inputs.mode         = inputs.mode || 'local';
  inputs.pace         = inputs.pace || 'balanced';
  inputs.budget       = inputs.budget || 'mid';
  inputs.travelers    = inputs.travelers || 'solo';
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

  // Stored permanently so the public page stays crawlable/indexable.
  await env.CACHE_KV.put(`share:${id}`, JSON.stringify(body.itinerary));

  const base = new URL(request.url).origin;
  return corsJson({ id, url: `${base}/i/${id}`, appUrl: `plan.html?share=${id}` });
}

export async function handleShareGet(id: string, env: WorkerEnv): Promise<Response> {
  if (!env.CACHE_KV) return corsJson({ error: 'Share storage not configured' }, 503);
  const data = await env.CACHE_KV.get(`share:${id}`);
  if (!data) return corsJson({ error: 'Share not found or expired' }, 404);
  return corsJson({ itinerary: JSON.parse(data) });
}

// ── Public, crawlable HTML page for a shared itinerary (GET /i/{id}) ───────────

const SITE = 'https://koreaplus-lifes.com/guide';

function escH(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface Place { name?: string; nameKr?: string; description?: string; insiderTip?: string; cost?: string; duration?: number; }
interface Meal { name?: string; nameKr?: string; type?: string; cost?: string; tip?: string; }
interface Day { day?: number; date?: string; title?: string; morning?: Place[]; lunch?: Meal; afternoon?: Place[]; dinner?: Meal; evening?: Place[]; }
interface Itin { title?: string; summary?: string; highlights?: string[]; days?: Day[]; }

function slotBlock(icon: string, label: string, p?: Place): string {
  if (!p || !p.name) return '';
  return `<div class="seo-slot"><span class="si">${icon}</span><div><div class="st">${label}</div>` +
    `<div class="sn">${escH(p.name)}${p.nameKr ? ` <span style="color:var(--gold,#C8973A);font-weight:400">${escH(p.nameKr)}</span>` : ''}</div>` +
    `<div class="sd">${escH(p.description || '')}${p.insiderTip ? `<br><strong>💡 ${escH(p.insiderTip)}</strong>` : ''}</div></div></div>`;
}
function mealBlock(icon: string, label: string, m?: Meal): string {
  if (!m || !m.name) return '';
  return `<div class="seo-slot"><span class="si">${icon}</span><div><div class="st">${label}</div>` +
    `<div class="sn">${escH(m.name)}${m.nameKr ? ` <span style="color:var(--gold,#C8973A);font-weight:400">${escH(m.nameKr)}</span>` : ''}</div>` +
    `<div class="sd">${escH([m.type, m.cost].filter(Boolean).join(' · '))}${m.tip ? `<br>${escH(m.tip)}` : ''}</div></div></div>`;
}

function renderItineraryHTML(it: Itin, id: string, origin: string): string {
  const title = it.title || 'My Korea Itinerary';
  const summary = (it.summary || `A personalized Korea travel itinerary with ${(it.days || []).length} days of attractions, food and tips.`).slice(0, 300);
  const canonical = `${origin}/i/${id}`;
  const days = it.days || [];

  let daysHtml = '';
  days.forEach((d, i) => {
    daysHtml += `<div class="seo-day"><div class="dh">Day ${d.day || i + 1}${d.title ? ` — ${escH(d.title)}` : ''}</div>` +
      (d.date ? `<div class="ds">${escH(d.date)}</div>` : '') +
      (d.morning || []).map(p => slotBlock('☀️', 'Morning', p)).join('') +
      mealBlock('🍱', 'Lunch', d.lunch) +
      (d.afternoon || []).map(p => slotBlock('🌤️', 'Afternoon', p)).join('') +
      mealBlock('🌙', 'Dinner', d.dinner) +
      (d.evening || []).map(p => slotBlock('🌃', 'Evening', p)).join('') +
      `</div>`;
  });

  const schema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: title, description: summary, datePublished: new Date().toISOString().slice(0, 10),
    author: { '@type': 'Organization', name: 'KoreaPlus' },
    publisher: { '@type': 'Organization', name: 'KoreaPlus-Lifes', logo: { '@type': 'ImageObject', url: `${SITE}/icons/kplus.svg` } },
    image: `${SITE}/og-image.jpg`, mainEntityOfPage: canonical,
  };

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escH(title)} — Korea Itinerary | KoreaPlus</title>
<meta name="description" content="${escH(summary)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="${SITE}/icons/kplus.svg">
<meta property="og:type" content="article"><meta property="og:title" content="${escH(title)}">
<meta property="og:description" content="${escH(summary)}"><meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-image.jpg"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${SITE}/hub-styles.css">
<link rel="stylesheet" href="${SITE}/theme.css">
<link rel="stylesheet" href="${SITE}/seo.css">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body>
<nav class="hub-nav"><a class="hub-nav-logo" href="${SITE}/index.html">Korea<span>Plus</span></a>
<div class="hub-nav-links"><a class="hub-nav-link" href="${SITE}/index.html">🏠 Home</a><a class="hub-nav-link" href="${SITE}/explore.html">🧭 Explore</a><a class="hub-nav-link" href="${SITE}/plan.html">🗺️ Plan Your Own</a></div></nav>
<main class="seo-wrap">
<header class="seo-hero"><span class="emoji">🗺️</span><h1>${escH(title)}</h1>
<div class="meta"><span class="seo-badge region">${days.length}-day itinerary</span><span class="seo-badge">AI-generated</span></div></header>
<article class="seo-body">
<p class="lead">${escH(summary)}</p>
${(it.highlights && it.highlights.length) ? `<h2>✨ Trip Highlights</h2><ul>${it.highlights.map(h => `<li>${escH(h)}</li>`).join('')}</ul>` : ''}
<h2>📅 Day-by-Day Plan</h2>
${daysHtml}
<div class="seo-cta"><h2>Want your own Korea itinerary?</h2><p>Build a free, personalized day-by-day plan with AI in 30 seconds.</p>
<div class="btns"><a class="primary" href="${SITE}/plan.html">🗺️ Build My Free Itinerary</a><a class="ghost" href="${SITE}/index.html">💬 Ask the AI Guide</a></div></div>
</article></main>
<footer class="footer" style="text-align:center;padding:40px 20px;border-top:1px solid var(--border,rgba(255,255,255,.08));margin-top:40px">
<p style="font-size:13px;color:var(--text2,#aaa)">🇰🇷 <strong>KoreaPlus-Lifes.com</strong> · Your complete guide to everything Korea</p></footer>
</body></html>`;
}

export async function handleShareHtml(id: string, env: WorkerEnv, request: Request): Promise<Response> {
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' };
  if (!env.CACHE_KV) return new Response('<h1>Sharing not configured</h1>', { status: 503, headers });
  const data = await env.CACHE_KV.get(`share:${id}`);
  if (!data) return new Response('<!DOCTYPE html><meta charset=utf-8><title>Not found</title><h1>Itinerary not found or expired</h1><p><a href="https://koreaplus-lifes.com/guide/plan.html">Build a new one →</a></p>', { status: 404, headers });
  const origin = new URL(request.url).origin;
  return new Response(renderItineraryHTML(JSON.parse(data) as Itin, id, origin), { status: 200, headers });
}
