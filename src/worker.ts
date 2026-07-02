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
import { handleReact, handleView } from './handlers/reactions.ts';
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
  // are set (reuse app_key 536770 from the sibling apps; tracking_id 'luckynum'
  // — the id registered in that affiliate account; 'koreaplus' is NOT and 402s).
  ALI_APP_KEY?:           string;   // AliExpress Portals app key
  ALI_APP_SECRET?:        string;   // AliExpress Portals app secret (HMAC signing)
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// AI answer-engine crawlers (GEO). These can't run the JS that renders the
// interactive pages, so we serve them a clean static text-twin instead. NOTE:
// Googlebot/Bingbot are deliberately EXCLUDED — they render JS for ranking, so
// they get the full app (this is GEO enrichment, NOT ranking cloaking).
const AI_CRAWLER_RE = /GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|Perplexity-User|ClaudeBot|anthropic-ai|Claude-Web|CCBot|Bytespider|Google-Extended|Applebot-Extended|Amazonbot|Meta-ExternalAgent|cohere-ai|DuckAssistBot|YouBot/i;

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

// ── S14: page-ask cost guard ──────────────────────────────────────────────────
// A "page-ask" is a Q&A about a specific SEO page (body carries `page`). The
// live chatbot (free-form /chat) is untouched. The guard only kicks in for
// page-ask so that, when ask.js's gate is turned on in future, cost stays bounded:
//   (a) lang whitelist en/ko/ja/zh/es (others politely declined, no LLM call)
//   (b) KV pre-cache keyed by hash(page+question) — served answers skip the LLM
//   (c) daily global call cap (KV counter chat:count:<date>) → 429 when exceeded
//   (d) context = ONLY the client-supplied summary (token thrift)
const PAGE_ASK_LANGS = new Set(['en', 'ko', 'ja', 'zh', 'es']);
const CHAT_DAILY_CAP = 2000;              // global LLM calls/day for page-ask
const CHAT_CACHE_TTL = 7 * 86400;         // cached answers live 7 days

function djb2hex(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

async function handleChat(
  body: { message?: string; history?: { role: string; content: string }[]; lang?: string; page?: string; summary?: string; context?: string },
  env: WorkerEnv,
): Promise<Response> {
  const { message, history = [], lang } = body;
  if (!message?.trim()) return json({ error: 'No message' }, 400);

  // ── S14 page-ask cost guard (only when the request targets a specific page) ──
  const pageId = (body.page || '').trim();
  if (pageId) {
    const lc = (lang || '').slice(0, 2).toLowerCase();
    // (a) language whitelist — decline others without spending an LLM call.
    if (!PAGE_ASK_LANGS.has(lc)) {
      return json({ reply: 'Sorry — page Q&A is currently available in English, Korean, Japanese, Chinese, and Spanish only. 🙏' });
    }
    const q = message.trim().slice(0, 500);
    const cacheKey = `chat:cache:${lc}:${djb2hex(pageId.slice(0, 200))}:${djb2hex(q)}`;
    // (b) serve a cached answer with zero LLM cost.
    if (env.CACHE_KV) {
      try {
        const hit = await env.CACHE_KV.get(cacheKey);
        if (hit) return json({ reply: hit, cached: true });
      } catch { /* cache miss path */ }
    }
    // (c) daily global cap — protects the free-tier budget.
    if (env.CACHE_KV) {
      const date = new Date().toISOString().slice(0, 10);
      const countKey = `chat:count:${date}`;
      try {
        const cur = parseInt((await env.CACHE_KV.get(countKey)) || '0', 10) || 0;
        if (cur >= CHAT_DAILY_CAP) {
          return json({ reply: '⚠️ Our AI assistant is very busy right now. Please try again later.' }, 429);
        }
        // reserve a slot (best-effort; ~1-day TTL so the counter self-resets)
        await env.CACHE_KV.put(countKey, String(cur + 1), { expirationTtl: 2 * 86400 }).catch(() => {});
      } catch { /* counter unavailable — allow through */ }
    }
    // (d) context = ONLY the client-supplied summary (token thrift; no history).
    const summary = (body.summary || body.context || '').slice(0, 1500);
    const langName = LANG_NAMES[lc] || 'English';
    const askMessages = [
      { role: 'system', content: `${SYSTEM_PROMPT}\nReply in ${langName}. Answer strictly using the page context below; if the answer isn't there, say so briefly.\n\n[PAGE CONTEXT]\n${summary}` },
      { role: 'user', content: q },
    ];
    const reply = await runChatCompletion(askMessages, env);
    if (reply && env.CACHE_KV) {
      await env.CACHE_KV.put(cacheKey, reply, { expirationTtl: CHAT_CACHE_TTL }).catch(() => {});
    }
    return json({ reply: reply || 'No response.' });
  }


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

  const reply = await runChatCompletion(chatMessages, env);
  return json({ reply: reply || '⚠️ AI temporarily unavailable. Please try again in a moment.' });
}

// Shared LLM completion: Groq first (fast free tier) → OpenRouter fallback.
// Returns the trimmed reply, or '' if every provider failed. Used by both the
// free-form chatbot and the S14 guarded page-ask path.
async function runChatCompletion(messages: { role: string; content: string }[], env: WorkerEnv): Promise<string> {
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
          messages,
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (res.ok) {
        const reply = extract(await res.json() as ChatResp);
        if (reply) return reply;
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
        messages,
      }),
    });

  try {
    let res = await callOpenRouter(MODEL_PRIMARY);
    if (!res.ok) res = await callOpenRouter(MODEL_FALLBACK);
    return extract(await res.json() as ChatResp);
  } catch {
    return '';
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

// ── IndexNow ping (cron) — get new/updated URLs crawled in hours, not weeks ───
async function pingIndexNow(env: WorkerEnv): Promise<void> {
  const host = 'koreaplus-lifes.com';
  const key = 'kp7e3f1c9a2b5d48069e3f1c9a2b5d48';
  const langs = ['?lang=ko', '?lang=ja', '?lang=zh', '?lang=es', '?lang=fr', '?lang=de', '?lang=pt', '?lang=id'];
  const urlList = [
    `https://${host}/kbeauty`,
    ...langs.map(q => `https://${host}/kbeauty${q}`),
    `https://${host}/guide/`,
    `https://${host}/guide/kpop.html`,
    `https://${host}/guide/explore.html`,
    `https://${host}/guide/llms-full.txt`,
  ];
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: `https://${host}/guide/${key}.txt`, urlList }),
    });
    if (env.CACHE_KV) await env.CACHE_KV.put('freshness:lastPing', new Date().toISOString());
  } catch { /* best-effort; never throws */ }
}

// ── S20: Real User Monitoring (Core Web Vitals) ingest ────────────────────────
// POST /api/rum  {lcp,inp,cls,url,lang}. Client (rum.js) handles sampling; the
// server just keeps a tiny daily rolling aggregate per metric in KV so we never
// grow unbounded. Best-effort: any failure returns 204 anyway (never blocks the
// page). Payload is validated & clamped so a bad/huge body can't poison the KV.
async function handleRum(request: Request, env: WorkerEnv): Promise<Response> {
  const noStore = { ...CORS, 'Cache-Control': 'no-store' };
  const num = (v: unknown, max: number): number | null => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
  };
  try {
    const b = await request.json() as { lcp?: unknown; inp?: unknown; cls?: unknown; url?: unknown; lang?: unknown };
    if (env.CACHE_KV) {
      const date = new Date().toISOString().slice(0, 10);
      const metrics: Array<[string, number | null]> = [
        ['lcp', num(b.lcp, 120_000)],   // ms
        ['inp', num(b.inp, 120_000)],   // ms
        ['cls', num(b.cls, 100)],       // unitless
      ];
      // Rolling mean per metric per day: {n, sum, last}. Small (<80 bytes), 3-day TTL.
      await Promise.all(metrics.map(async ([metric, val]) => {
        if (val == null) return;
        const key = `rum:${date}:${metric}`;
        try {
          const prev = await env.CACHE_KV!.get(key);
          const agg = prev ? JSON.parse(prev) as { n: number; sum: number } : { n: 0, sum: 0 };
          const next = { n: (agg.n || 0) + 1, sum: (agg.sum || 0) + val, last: val };
          await env.CACHE_KV!.put(key, JSON.stringify(next), { expirationTtl: 3 * 86400 });
        } catch { /* per-metric failure is harmless */ }
      }));
    }
  } catch { /* bad JSON / KV down — swallow; RUM must never break a page */ }
  return new Response(null, { status: 204, headers: noStore });
}

// Minimal markdown→HTML for the AI text-twin (llms-kbeauty.txt → clean HTML).
function mdToHtml(md: string, canonical: string): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  let html = '', inList = false, title = 'K-Beauty Trend Authority — KoreaPlus', desc = '';
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    if (/^#\s+/.test(line)) { closeList(); title = line.replace(/^#\s+/, ''); html += `<h1>${esc(title)}</h1>`; }
    else if (/^##\s+/.test(line)) { closeList(); html += `<h2>${esc(line.replace(/^##\s+/, ''))}</h2>`; }
    else if (/^###\s+/.test(line)) { closeList(); html += `<h3>${esc(line.replace(/^###\s+/, ''))}</h3>`; }
    else if (/^>\s?/.test(line)) { closeList(); const tx = line.replace(/^>\s?/, ''); if (!desc) desc = tx; html += `<p><em>${esc(tx)}</em></p>`; }
    else if (/^-\s+/.test(line)) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${esc(line.replace(/^-\s+/, ''))}</li>`; }
    else if (line === '') { closeList(); }
    else { closeList(); html += `<p>${esc(line)}</p>`; }
  }
  closeList();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc.slice(0, 160))}"><link rel="canonical" href="${canonical}"></head><body>${html}<p><a href="${canonical}">Open the full interactive K-beauty hub →</a></p></body></html>`;
}

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  // Cron (wrangler.toml [triggers]) — daily IndexNow submission + freshness stamp.
  async scheduled(_event: unknown, env: WorkerEnv, ctx: { waitUntil: (p: Promise<unknown>) => void }): Promise<void> {
    ctx.waitUntil(pingIndexNow(env));
  },
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');

    // ── S13: AI-crawler text-twin for /guide SEO pages ──────────────────────
    // AI answer engines can't run the JS that renders the /guide pages, so we
    // serve them the pre-built static text-twin (/guide/llms-full.<lang>.txt,
    // emitted by the build). Googlebot/Bingbot are excluded (see AI_CRAWLER_RE)
    // so this is GEO enrichment, not cloaking. Any failure falls through to the
    // normal page. HTML pages only — never .txt/.xml/assets, and NEVER the
    // llms-full.*.txt twins themselves (infinite-loop guard).
    if ((request.method === 'GET' || request.method === 'HEAD') &&
        path.startsWith('/guide/') &&
        !/\/llms-full\./i.test(path) &&
        !/\/llms[\w.-]*\.txt$/i.test(path) &&
        /(?:\/guide\/[\w-]+)?(?:\.html)?$/i.test(path) &&
        !/\.(?:txt|xml|json|js|css|png|jpe?g|webp|svg|gif|ico|woff2?|ttf|map)$/i.test(path)) {
      const ua = request.headers.get('user-agent') || '';
      if (AI_CRAWLER_RE.test(ua)) {
        const lang = (url.searchParams.get('lang') || 'en').slice(0, 5).replace(/[^a-z-]/gi, '') || 'en';
        const twinHeaders = {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=600',
          'x-served-by': 'guide-ai-twin',
          'vary': 'User-Agent',
        };
        try {
          // Try the language-specific twin, then fall back to the English twin.
          let r = await fetch(`https://koreaplus-lifes.com/guide/llms-full.${lang}.txt`, { cf: { cacheTtl: 600, cacheEverything: true } });
          if (!r.ok && lang !== 'en') r = await fetch('https://koreaplus-lifes.com/guide/llms-full.en.txt', { cf: { cacheTtl: 600, cacheEverything: true } });
          if (r.ok) {
            if (request.method === 'HEAD') return new Response(null, { status: 200, headers: twinHeaders });
            return new Response(await r.text(), { headers: twinHeaders });
          }
        } catch { /* fall through to normal page serving below */ }
      }
    }

    // ── Pretty-URL serving ─────────────────────────────────────────────────
    // The K-Beauty hub is a static file under /guide/. We serve it at the clean
    // /kbeauty URL by PROXYING the origin file (not redirecting) so the address
    // bar stays /kbeauty. A <base href="/guide/"> is injected so the page's
    // relative asset/nav paths still resolve against /guide/ where the app lives.
    // Registered as Worker routes on koreaplus-lifes.com/kbeauty* and /k-beauty*.
    if (path === '/k-beauty') {
      return Response.redirect('https://koreaplus-lifes.com/kbeauty' + url.search, 301);
    }
    // Serve the K-beauty sitemap at the clean apex /kbeauty-sitemap.xml by proxying
    // the static source file (/guide/kbeauty-sitemap.xml). The /kbeauty* route
    // intercepts this path, so we serve it here rather than redirect. HEAD ok.
    if (path === '/kbeauty-sitemap.xml') {
      const smHeaders = { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600', 'x-served-by': 'kbeauty-sitemap' };
      if (request.method === 'HEAD') return new Response(null, { status: 200, headers: smHeaders });
      try {
        const r = await fetch('https://koreaplus-lifes.com/guide/kbeauty-sitemap.xml', { cf: { cacheTtl: 600, cacheEverything: true } });
        if (!r.ok) throw new Error('origin ' + r.status);
        return new Response(await r.text(), { headers: smHeaders });
      } catch {
        return Response.redirect('https://koreaplus-lifes.com/guide/kbeauty-sitemap.xml', 302);
      }
    }
    // ── #19 AI trust feed — clean, citeable machine-readable trust triples ──
    // Serves the enriched answer-ledger (each verdict = claim + confidence tier +
    // review date + named sources) at a stable apex URL so answer engines can fetch
    // a graded, dated, sourced version of the K-beauty verdicts. Proxies the static
    // build output (/guide/kb/answer-ledger.json). CORS-open; GET/HEAD.
    if (path === '/kbeauty/answer-ledger.json') {
      const feedHeaders = {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=600',
        'x-served-by': 'kbeauty-trust-feed',
        'access-control-allow-origin': '*',
      };
      if (request.method === 'HEAD') return new Response(null, { status: 200, headers: feedHeaders });
      try {
        const r = await fetch('https://koreaplus-lifes.com/guide/kb/answer-ledger.json', { cf: { cacheTtl: 600, cacheEverything: true } });
        if (!r.ok) throw new Error('origin ' + r.status);
        return new Response(await r.text(), { headers: feedHeaders });
      } catch {
        return Response.redirect('https://koreaplus-lifes.com/guide/kb/answer-ledger.json', 302);
      }
    }
    if (path === '/kbeauty') {
      // GEO text-twin: AI answer-engine crawlers can't run the JS that renders the
      // trend data, so serve them a clean text version (from llms-kbeauty.txt).
      // Googlebot/Bingbot are NOT included — they render JS for ranking, so they
      // get the full app (this is GEO, not ranking-cloaking).
      const ua = request.headers.get('user-agent') || '';
      if (AI_CRAWLER_RE.test(ua)) {
        try {
          const r = await fetch('https://koreaplus-lifes.com/guide/llms-kbeauty.txt', { cf: { cacheTtl: 600, cacheEverything: true } });
          if (r.ok) {
            return new Response(mdToHtml(await r.text(), 'https://koreaplus-lifes.com/kbeauty'), {
              headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'x-served-by': 'kbeauty-ai-twin' },
            });
          }
        } catch { /* fall through to the normal proxy */ }
      }
      try {
        const originResp = await fetch('https://koreaplus-lifes.com/guide/kbeauty.html', {
          cf: { cacheTtl: 300, cacheEverything: true },
          headers: { accept: 'text/html' },
        });
        if (!originResp.ok) throw new Error('origin ' + originResp.status);
        let html = await originResp.text();
        // Inject <base> right after <head> so relative URLs resolve to /guide/.
        html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n<base href="/guide/">`);
        return new Response(html, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=300',
            'x-served-by': 'kbeauty-pretty-url',
          },
        });
      } catch {
        // Graceful fallback to the canonical file if the proxy fetch fails.
        return Response.redirect('https://koreaplus-lifes.com/guide/kbeauty.html' + url.search, 302);
      }
    }

    // "Was this helpful?" reactions (GET counts, POST a vote) — element 8 UGC
    if (path.endsWith('/api/react')) return handleReact(request, env);

    // S17: page view counter — GET /api/view?slug=... increments & returns views.
    // Real counts only (react.js uses it for social proof). Session-dedup is the
    // client's job; the server just does a simple atomic-ish increment.
    if (path.endsWith('/api/view')) return handleView(request, env);

    // S20: Real User Monitoring ingest — POST /api/rum {lcp,inp,cls,url,lang}.
    if (request.method === 'POST' && path.endsWith('/api/rum')) return handleRum(request, env);

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

    // Email list (#9) — capture subscribers to KV. Double-opt-in email is sent
    // later (when Cloudflare Email DNS is configured); for now we store leads.
    if (path.endsWith('/api/subscribe')) {
      try {
        const b = await request.json() as { email?: string; lang?: string; source?: string };
        const email = (b.email || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120) return json({ error: 'invalid email' }, 400);
        if (env.CACHE_KV) {
          await env.CACHE_KV.put('sub:' + email, JSON.stringify({
            email, lang: String(b.lang || 'en').slice(0, 5), source: String(b.source || '').slice(0, 40),
            ts: new Date().toISOString(), confirmed: false,
          }));
        }
        return json({ ok: true });
      } catch {
        return json({ error: 'bad request' }, 400);
      }
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
    return handleChat(body as { message?: string; history?: { role: string; content: string }[]; lang?: string; page?: string; summary?: string; context?: string }, env);
  },
};
