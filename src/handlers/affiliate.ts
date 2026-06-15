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
  Gyeongju: 'gyeongju-kr', Jeonju: 'jeonju-kr', Andong: 'andong-si-kr', Yeosu: 'yeosu-si-kr',
  Daegu: 'daegu-kr', Daejeon: 'daejeon-kr', Gwangju: 'gwangju-metropolitan-city-kr',
  Suwon: 'suwon-si-kr', Sokcho: 'sokcho-si-kr', Gangneung: 'gangneung-si-kr',
  Chuncheon: 'chuncheon-si-kr', Changwon: 'changwon-si-kr', Cheongju: 'cheongju-si-kr',
  Pohang: 'pohang-si-kr', Mokpo: 'mokpo-si-kr', Tongyeong: 'tongyeong-si-kr',
  Pyeongchang: 'pyeongchang-gun-kr', Gapyeong: 'gapyeong-gun-kr',
};
// Agoda numeric cityId for Long Tail city search (live-card tier). Only cities
// listed here can return live price cards; everything else uses deep links.
// Confirm/extend in the Agoda partner portal or via AGODA_CITY_IDS env override
// — a wrong id just yields no results and falls back, so it never breaks.
// Agoda numeric cityIds (same as the agoda.com /city/<slug> "city=" param,
// verified against the live Long Tail API). Public values, not secret.
// Numeric Agoda cityIds verified against the live Long Tail API by probing each
// candidate and matching the returned hotels' lat/lng (and names) to the city.
const AGODA_CITY_ID: Record<string, number> = {
  Seoul: 14690, Busan: 17172, Jeju: 16901, Incheon: 17234, Gyeongju: 17179, Jeonju: 17831,
  Daegu: 17232, Daejeon: 17233, Gwangju: 19042, Suwon: 3818, Sokcho: 17236, Gangneung: 19041,
  Chuncheon: 17829, Changwon: 17828, Cheongju: 21471, Pohang: 106064, Andong: 256452, Yeosu: 213193,
  Mokpo: 18093, Tongyeong: 213092, Pyeongchang: 17235, Gapyeong: 212458,
};
const AGODA_HL: Record<string, string> = {
  en: 'en-us', ko: 'ko-kr', ja: 'ja-jp', zh: 'zh-cn', es: 'es-es',
  fr: 'fr-fr', de: 'de-de', pt: 'pt-br', id: 'id-id',
};

// Per-market currency + native price formatting. Prices feel local: a Japanese
// visitor sees ¥12,000, a Brazilian R$600, a Korean ₩150,000 — not always USD.
// We request `cur` from Agoda (Long Tail API echoes the rate in that currency)
// and format with the right symbol / grouping / position. Manual formatting
// (no Intl locale data) keeps it deterministic on Workers' limited ICU.
interface Money { cur: string; sym: string; pos: 'before' | 'after'; sep: string }
const CURRENCY: Record<string, Money> = {
  en: { cur: 'USD', sym: '$',  pos: 'before', sep: ',' },
  ko: { cur: 'KRW', sym: '₩',  pos: 'before', sep: ',' },
  ja: { cur: 'JPY', sym: '¥',  pos: 'before', sep: ',' },
  zh: { cur: 'CNY', sym: '¥',  pos: 'before', sep: ',' },
  es: { cur: 'EUR', sym: '€',  pos: 'before', sep: '.' },
  fr: { cur: 'EUR', sym: '€',  pos: 'before', sep: ' ' },
  de: { cur: 'EUR', sym: '€',  pos: 'after',  sep: '.' },
  pt: { cur: 'BRL', sym: 'R$', pos: 'before', sep: '.' },
  id: { cur: 'IDR', sym: 'Rp', pos: 'before', sep: '.' },
};
// Agoda's Long Tail API only returns results when asked for USD (other
// currencies → "No search result"). So we always price in USD upstream and
// convert to the visitor's currency here, using live KV-cached FX with a static
// fallback. Indicative only — Agoda shows the exact local price on its page.
const STATIC_FX: Record<string, number> = {
  USD: 1, KRW: 1500, JPY: 160, CNY: 6.8, EUR: 0.86, BRL: 5.1, IDR: 17800,
};
async function getFxRates(env: WorkerEnv): Promise<Record<string, number>> {
  const KV_KEY = 'fx:usd:v1';
  if (env.CACHE_KV) {
    const hit = await env.CACHE_KV.get(KV_KEY);
    if (hit) { try { return JSON.parse(hit) as Record<string, number>; } catch { /* refetch */ } }
  }
  const apiKey = (env.EXCHANGE_RATE_KEY || '').trim();
  if (apiKey) {
    try {
      const res = await globalThis.fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`, { signal: AbortSignal.timeout(6_000) });
      if (res.ok) {
        const data = await res.json() as { result?: string; conversion_rates?: Record<string, number> };
        if (data.result === 'success' && data.conversion_rates) {
          const out: Record<string, number> = {};
          for (const c of ['USD', 'KRW', 'JPY', 'CNY', 'EUR', 'BRL', 'IDR']) {
            if (data.conversion_rates[c]) out[c] = data.conversion_rates[c];
          }
          if (out.USD && Object.keys(out).length >= 4) {
            if (env.CACHE_KV) await env.CACHE_KV.put(KV_KEY, JSON.stringify(out), { expirationTtl: 12 * 3600 }).catch(() => {});
            return out;
          }
        }
      }
    } catch { /* fall through to static */ }
  }
  return STATIC_FX;
}
// Convert a USD amount to the lang's display currency and format it natively.
function fmtMoney(usdAmount: number, lang: string, fx: Record<string, number>): string {
  const m = CURRENCY[lang] || CURRENCY.en;
  const rate = fx[m.cur] || STATIC_FX[m.cur] || 1;
  const grouped = String(Math.round(usdAmount * rate)).replace(/\B(?=(\d{3})+(?!\d))/g, m.sep);
  return m.pos === 'before' ? `${m.sym}${grouped}` : `${grouped} ${m.sym}`;
}

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

  const reqHl = AGODA_HL[lang] || 'en-us';
  const checkIn = isoPlus(30), checkOut = isoPlus(31);
  // v3: hotel NAMES are localized (language=reqHl) and the price is converted to
  // the visitor's currency at render — both vary by lang, so key by lang.
  const cacheKey = `agoda:v3:${cityId}:${lang}:${checkIn}:${djb2(siteId)}`;
  if (env.CACHE_KV) {
    const hit = await env.CACHE_KV.get(cacheKey);
    if (hit) { try { return JSON.parse(hit) as Offer[]; } catch { /* refetch */ } }
  }

  const body = {
    criteria: {
      additional: {
        // Always request USD: Agoda's Long Tail API returns no results for other
        // currencies. We convert to the local currency in fmtMoney() below.
        currency: 'USD', discountOnly: false, language: reqHl,
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
    // Convert USD rates → visitor currency (skip the FX call when it's USD anyway).
    const fx = (CURRENCY[lang] || CURRENCY.en).cur === 'USD' ? STATIC_FX : await getFxRates(env);
    const offers: Offer[] = data.results.slice(0, 4).map(r => {
      const name = (r.hotelName || 'Hotel').slice(0, 48);
      return {
        brand: 'Agoda', icon: '🏨',
        label: name,                                   // back-compat
        name,
        url: (r.landingURL || deepLink(city, lang)).replace(/^http:/, 'https:'),
        img: (r.imageURL || '').replace(/^http:/, 'https:'),  // avoid mixed-content block on HTTPS
        // ja/zh place the "from" particle (〜 / 起) AFTER the amount; others before.
        price: (r.dailyRate != null)
          ? ((lang === 'ja' || lang === 'zh') ? `${fmtMoney(r.dailyRate, lang, fx)}${t.from}` : `${t.from} ${fmtMoney(r.dailyRate, lang, fx)}`)
          : '',
        was: (r.crossedOutRate != null && r.crossedOutRate > (r.dailyRate || 0)) ? fmtMoney(r.crossedOutRate, lang, fx) : '',
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
