/**
 * Agoda-only affiliate service. All other networks (Klook, KKday, Trip.com,
 * Impact) have been removed — KoreaPlus monetizes exclusively via the owner's
 * Agoda affiliate account (cid 1952761).
 *
 * GET /api/aff?city=Seoul&cat=hotel&q=&lang=en
 *   → { offers: [{ brand:'Agoda', icon, label, url, price?, img? }] }
 *
 * Two tiers, graceful:
 *   1. Deep links (always on, no key) — city-targeted Agoda landing pages with
 *      the cid, so every click monetizes even with JS/API off.
 *   2. Live hotel cards (Long Tail Search API) — only when AGODA_API_KEY is set
 *      AND the city has a known Agoda numeric cityId. Any failure (no key,
 *      unknown city, API error, no results) silently falls back to tier 1.
 *
 * Secret (wrangler secret put AGODA_API_KEY):
 *   AGODA_API_KEY  — the Long Tail Search API key paired with the site id (cid).
 * Optional vars:
 *   AGODA_SITE_ID     — overrides the cid used for API auth (default 1952761)
 *   AGODA_CITY_IDS    — JSON map to add/override Agoda cityIds, e.g.
 *                       {"Busan":12345,"Jeju":67890}
 */

import type { WorkerEnv } from '../worker.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600',
};

const AGODA_CID = '1952761';
const AGODA_ENDPOINT = 'https://affiliateapi7643.agoda.com/affiliateservice/lt_v1';

// Agoda canonical city landing-page slugs (deep-link tier — always works).
const AGODA_SLUG: Record<string, string> = {
  Seoul: 'seoul-kr', Busan: 'busan-kr', Jeju: 'jeju-kr', Incheon: 'incheon-kr',
  Gyeongju: 'gyeongju-kr', Jeonju: 'jeonju-kr', Andong: 'andong-kr', Yeosu: 'yeosu-kr',
};
// Agoda numeric cityId for Long Tail city search (live-card tier). Only cities
// listed here can return live price cards; everything else uses deep links.
// Confirm/extend in the Agoda partner portal or via AGODA_CITY_IDS env override
// — a wrong id just yields no results and falls back, so it never breaks.
// Agoda numeric cityIds (same as the agoda.com /city/<slug> "city=" param,
// verified against the live Long Tail API). Public values, not secret.
const AGODA_CITY_ID: Record<string, number> = {
  Seoul: 14690, Busan: 17172, Jeju: 16901, Incheon: 17234, Gyeongju: 17179, Jeonju: 17831,
};
const AGODA_HL: Record<string, string> = {
  en: 'en-us', ko: 'ko-kr', ja: 'ja-jp', zh: 'zh-cn', es: 'es-es',
  fr: 'fr-fr', de: 'de-de', pt: 'pt-br', id: 'id-id',
};

function deepLink(city: string, lang: string): string {
  const slug = AGODA_SLUG[city];
  const path = slug ? `city/${slug}.html` : 'country/south-korea.html';
  const hl = AGODA_HL[lang] ? `&hl=${AGODA_HL[lang]}` : '';
  return `https://www.agoda.com/${path}?cid=${AGODA_CID}${hl}`;
}

// Localized labels for the deep-link offers.
const L: Record<string, { hotels: (c: string) => string; deals: (c: string) => string; from: string }> = {
  en: { hotels: c => `🛏️ ${c} Hotels`,   deals: c => `🏨 Best ${c} deals`,  from: 'from' },
  ko: { hotels: c => `🛏️ ${c} 호텔`,     deals: c => `🏨 ${c} 최저가`,      from: '최저' },
  ja: { hotels: c => `🛏️ ${c}のホテル`,   deals: c => `🏨 ${c}のお得な宿`,    from: '〜' },
  zh: { hotels: c => `🛏️ ${c}酒店`,       deals: c => `🏨 ${c}超值优惠`,      from: '起' },
  es: { hotels: c => `🛏️ Hoteles en ${c}`, deals: c => `🏨 Ofertas en ${c}`, from: 'desde' },
  fr: { hotels: c => `🛏️ Hôtels à ${c}`,  deals: c => `🏨 Offres à ${c}`,    from: 'dès' },
  de: { hotels: c => `🛏️ Hotels in ${c}`, deals: c => `🏨 ${c} Angebote`,    from: 'ab' },
  pt: { hotels: c => `🛏️ Hotéis em ${c}`, deals: c => `🏨 Ofertas em ${c}`,  from: 'a partir de' },
  id: { hotels: c => `🛏️ Hotel di ${c}`,  deals: c => `🏨 Penawaran ${c}`,   from: 'mulai' },
};

interface Offer {
  brand: string; icon: string; label: string; url: string;
  price?: string; img?: string;
  name?: string; was?: string; discount?: number; star?: number; review?: number;
}

function deepOffers(city: string, lang: string): Offer[] {
  const t = L[lang] || L.en;
  const url = deepLink(city, lang);
  return [
    { brand: 'Agoda', icon: '🏨', label: t.hotels(city), url },
    { brand: 'Agoda', icon: '🛏️', label: t.deals(city),  url: url + '&sort=priceasc' },
  ];
}

// ── Long Tail Search API (live hotel cards, optional) ───────────────────────
function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function isoPlus(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

interface AgodaResult {
  hotelName?: string; dailyRate?: number; crossedOutRate?: number; discountPercentage?: number;
  currency?: string; starRating?: number; reviewScore?: number; reviewCount?: number;
  landingURL?: string; imageURL?: string;
}

async function liveCards(env: WorkerEnv, city: string, lang: string): Promise<Offer[] | null> {
  // Accept either a bare API key, or the combined "siteId:apiKey" string (the
  // exact value Agoda's portal shows for the Authorization header) — split it.
  const raw = (env.AGODA_API_KEY || '').trim();
  if (!raw) return null;
  let siteId = (env.AGODA_SITE_ID || AGODA_CID).trim();
  let apiKey = raw;
  if (raw.includes(':')) {
    const i = raw.indexOf(':');
    siteId = raw.slice(0, i).trim() || siteId;
    apiKey = raw.slice(i + 1).trim();
  }
  if (!apiKey) return null;

  let ids = AGODA_CITY_ID;
  try { if (env.AGODA_CITY_IDS) ids = { ...ids, ...JSON.parse(env.AGODA_CITY_IDS) }; } catch { /* ignore */ }
  const cityId = ids[city];
  if (!cityId) return null;

  const checkIn = isoPlus(30), checkOut = isoPlus(31);
  const cacheKey = `agoda:v2:${cityId}:${lang}:${checkIn}:${djb2(siteId)}`;
  if (env.CACHE_KV) {
    const hit = await env.CACHE_KV.get(cacheKey);
    if (hit) { try { return JSON.parse(hit) as Offer[]; } catch { /* refetch */ } }
  }

  const body = {
    criteria: {
      additional: {
        currency: 'USD', discountOnly: false, language: AGODA_HL[lang] || 'en-us',
        maxResult: 4, minimumReviewScore: 0, minimumStarRating: 0,
        occupancy: { numberOfAdult: 2, numberOfChildren: 0 }, sortBy: 'PriceAsc',
      },
      checkInDate: checkIn, checkOutDate: checkOut, cityId,
    },
  };

  try {
    const res = await globalThis.fetch(AGODA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `${siteId}:${apiKey}`,
        'Accept-Encoding': 'gzip,deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) { console.error(`[Agoda] HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`); return null; }
    const data = await res.json() as { results?: AgodaResult[]; error?: { message?: string; id?: number } };
    if (data.error) console.error(`[Agoda] api error ${data.error.id}: ${data.error.message}`);
    if (!data.results || !data.results.length) return null;

    const t = L[lang] || L.en;
    const offers: Offer[] = data.results.slice(0, 4).map(r => {
      const name = (r.hotelName || 'Hotel').slice(0, 48);
      return {
        brand: 'Agoda', icon: '🏨',
        label: name,                                   // back-compat
        name,
        url: (r.landingURL || deepLink(city, lang)).replace(/^http:/, 'https:'),
        img: (r.imageURL || '').replace(/^http:/, 'https:'),  // avoid mixed-content block on HTTPS
        price: (r.dailyRate != null) ? `${t.from} $${Math.round(r.dailyRate)}` : '',
        was: (r.crossedOutRate != null && r.crossedOutRate > (r.dailyRate || 0)) ? `$${Math.round(r.crossedOutRate)}` : '',
        discount: (r.discountPercentage && r.discountPercentage >= 5) ? Math.round(r.discountPercentage) : 0,
        star: r.starRating || 0,
        review: r.reviewScore || 0,
      };
    });
    if (env.CACHE_KV) await env.CACHE_KV.put(cacheKey, JSON.stringify(offers), { expirationTtl: 6 * 3600 }).catch(() => {});
    return offers;
  } catch (e) {
    console.error('[Agoda] threw:', String(e).slice(0, 120));
    return null;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function handleAffiliate(request: Request, env: WorkerEnv): Promise<Response> {
  const u = new URL(request.url);
  const city = (u.searchParams.get('city') || 'Seoul').slice(0, 40);
  const lang = (u.searchParams.get('lang') || 'en').slice(0, 2);

  const live = await liveCards(env, city, lang);
  const offers = (live && live.length) ? live : deepOffers(city, lang);

  // Cache real API cards for an hour; cache deep-link fallbacks only briefly so
  // a transient fallback never sticks at the edge (recovers to live cards fast).
  const headers = { ...CORS, 'Cache-Control': live ? 'public, max-age=3600' : 'public, max-age=60' };
  return new Response(JSON.stringify({ offers, ctx: { city }, src: live ? 'api' : 'link' }), { headers });
}
