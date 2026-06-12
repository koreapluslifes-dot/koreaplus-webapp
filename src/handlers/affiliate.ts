/**
 * Impact.com affiliate link service.
 *
 * GET /api/aff?city=Seoul&cat=food&q=Bibimbap
 *   → { offers: [{ brand, label, icon, url }] }
 *
 * Flow:
 *   1. Context (city/category/query) → candidate offers with brand deep links.
 *   2. For each offer, if Impact credentials + ProgramId are configured,
 *      create (or KV-cache) an Impact TrackingLink wrapping the deep link.
 *   3. Otherwise fall back to the plain brand URL — the site monetizes
 *      nothing but keeps working before program approvals.
 *
 * Secrets (wrangler secret put …):
 *   IMPACT_ACCOUNT_SID   — Impact publisher Account SID
 *   IMPACT_AUTH_TOKEN    — Impact API Auth Token
 *   IMPACT_PROGRAMS      — JSON map of brandKey → ProgramId,
 *                          e.g. {"klook":"1234","airalo":"5678","tripcom":"9012","kkday":"3456"}
 *   IMPACT_PROPERTY_ID   — (optional) MediaPartnerPropertyId if your account has several
 */

import type { WorkerEnv } from '../worker.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  // Edge/browser cache one hour — link URLs are stable thanks to KV caching.
  'Cache-Control': 'public, max-age=3600',
};

// ── Brand registry (fallback URL builders take an encoded query) ────────────
interface Brand { brand: string; icon: string; key: string; deep: (q: string) => string }
const BRANDS: Record<string, Brand> = {
  klook:   { key: 'klook',   brand: 'Klook',   icon: '🎟️', deep: q => `https://www.klook.com/search/?query=${q}` },
  kkday:   { key: 'kkday',   brand: 'KKday',   icon: '🚌', deep: q => `https://www.kkday.com/en/product/productlist?keyword=${q}` },
  airalo:  { key: 'airalo',  brand: 'Airalo',  icon: '📶', deep: () => 'https://www.airalo.com/south-korea-esim' },
  // Trip.com fallback links carry the live affiliate IDs (Trip.com Partners),
  // so hotel clicks monetize even before Impact program approval.
  tripcom: { key: 'tripcom', brand: 'Trip.com', icon: '🏨', deep: q => `https://www.trip.com/global-search/searchlist/search/?keyword=${q}&Allianceid=8536795&SID=317779078&trip_sub1=kp_api` },
};

interface OfferSpec { b: Brand; label: string; q: string }

/** Context → ordered offer candidates (max 4 rendered). */
function pickOffers(city: string, cat: string, q: string): OfferSpec[] {
  const c = city || 'Seoul';
  const enc = encodeURIComponent;
  const base: Record<string, OfferSpec[]> = {
    food: [
      { b: BRANDS.klook,   label: `${c} Food Tours`,      q: enc(`${c} food tour`) },
      { b: BRANDS.kkday,   label: 'Cooking Classes',      q: enc(`korea cooking class`) },
      { b: BRANDS.tripcom, label: `${c} Hotels`,          q: enc(`${c} hotel`) },
      { b: BRANDS.airalo,  label: 'Korea eSIM',           q: '' },
    ],
    transport: [
      { b: BRANDS.klook,   label: 'Korea Rail Pass',      q: enc('korea rail pass') },
      { b: BRANDS.klook,   label: 'AREX / Transfers',     q: enc(`${q || 'AREX incheon airport'}`) },
      { b: BRANDS.airalo,  label: 'Korea eSIM',           q: '' },
      { b: BRANDS.tripcom, label: `${c} Hotels`,          q: enc(`${c} hotel`) },
    ],
    hotel: [
      { b: BRANDS.tripcom, label: `${c} Hotels`,          q: enc(`${c} hotel`) },
      { b: BRANDS.klook,   label: `${c} Activities`,      q: enc(`${c}`) },
      { b: BRANDS.airalo,  label: 'Korea eSIM',           q: '' },
      { b: BRANDS.kkday,   label: `${c} Day Trips`,       q: enc(`${c} day trip`) },
    ],
    kbeauty: [
      { b: BRANDS.klook,   label: 'Spa & Beauty',         q: enc(`${c} spa massage`) },
      { b: BRANDS.klook,   label: `${c} Activities`,      q: enc(`${c}`) },
      { b: BRANDS.tripcom, label: `${c} Hotels`,          q: enc(`${c} hotel`) },
      { b: BRANDS.airalo,  label: 'Korea eSIM',           q: '' },
    ],
    esim: [
      { b: BRANDS.airalo,  label: 'Korea eSIM',           q: '' },
      { b: BRANDS.klook,   label: 'SIM & WiFi Pickup',    q: enc('korea sim wifi') },
      { b: BRANDS.tripcom, label: `${c} Hotels`,          q: enc(`${c} hotel`) },
      { b: BRANDS.kkday,   label: `${c} Tours`,           q: enc(`${c}`) },
    ],
  };
  if (base[cat]) return base[cat];
  // default: travel / shopping / kpop / history / general
  return [
    { b: BRANDS.klook,   label: `${c} Tours & Tickets`, q: enc(q ? `${q}` : `${c}`) },
    { b: BRANDS.kkday,   label: `${c} Day Trips`,       q: enc(`${c} day trip`) },
    { b: BRANDS.tripcom, label: `${c} Hotels`,          q: enc(`${c} hotel`) },
    { b: BRANDS.airalo,  label: 'Korea eSIM',           q: '' },
  ];
}

// ── Impact TrackingLinks API (with KV cache) ────────────────────────────────
function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

async function impactLink(env: WorkerEnv, programId: string, deepLink: string): Promise<string | null> {
  const sid = (env.IMPACT_ACCOUNT_SID || '').trim();
  const tok = (env.IMPACT_AUTH_TOKEN || '').trim();
  if (!sid || !tok || !programId) return null;

  const cacheKey = `aff:${programId}:${djb2(deepLink)}`;
  if (env.CACHE_KV) {
    const hit = await env.CACHE_KV.get(cacheKey);
    if (hit) return hit;
  }

  try {
    const params = new URLSearchParams({ Type: 'Regular', DeepLink: deepLink });
    if (env.IMPACT_PROPERTY_ID) params.set('MediaPartnerPropertyId', env.IMPACT_PROPERTY_ID.trim());
    const res = await globalThis.fetch(
      `https://api.impact.com/Mediapartners/${sid}/Programs/${programId}/TrackingLinks`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${sid}:${tok}`),
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) {
      console.error(`[Impact] ${programId} HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
      return null;
    }
    const data = await res.json() as { TrackingURL?: string; trackingUrl?: string };
    const url = data.TrackingURL || data.trackingUrl || null;
    if (url && env.CACHE_KV) {
      await env.CACHE_KV.put(cacheKey, url, { expirationTtl: 7 * 86400 }).catch(() => {});
    }
    return url;
  } catch (e) {
    console.error('[Impact] threw:', String(e).slice(0, 120));
    return null;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function handleAffiliate(request: Request, env: WorkerEnv): Promise<Response> {
  const u = new URL(request.url);
  const city = (u.searchParams.get('city') || 'Seoul').slice(0, 40);
  const cat = (u.searchParams.get('cat') || 'general').slice(0, 20);
  const q = (u.searchParams.get('q') || '').slice(0, 60);

  let programs: Record<string, string> = {};
  try { programs = JSON.parse(env.IMPACT_PROGRAMS || '{}'); } catch { /* keep empty */ }

  const specs = pickOffers(city, cat, q).slice(0, 4);
  const offers = await Promise.all(specs.map(async s => {
    const deep = s.b.deep(s.q);
    const tracked = await impactLink(env, programs[s.b.key] || '', deep);
    return { brand: s.b.brand, icon: s.b.icon, label: s.label, url: tracked || deep, tracked: !!tracked };
  }));

  return new Response(JSON.stringify({ offers, ctx: { city, cat } }), { headers: CORS });
}
