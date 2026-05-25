// Cloudflare Worker — KoreaPlus AI Guide (OpenRouter free LLM) + Google Places proxy
// Secret 필요: OPENROUTER_API_KEY, GOOGLE_PLACES_KEY
// v2 — Places API enabled

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ====== 미국 기반 무료 OpenRouter 모델 (모두 $0) ======
// Primary: Meta Llama 3.2 3B — 빠른 응답용 경량 모델
const MODEL = 'meta-llama/llama-3.2-3b-instruct:free';
// 대체 모델:
// const MODEL = 'meta-llama/llama-3.3-70b-instruct:free';  // 고품질이나 느림
// const MODEL = 'openai/gpt-oss-20b:free';                 // OpenAI (US)
// ❌ 제외 (중국): deepseek/*, qwen/*, zhipuai/*, minimax/*

const SYSTEM_PROMPT = `You are "Korea AI Guide" — a friendly expert on South Korea for international visitors.
Answer concisely in 2-3 short paragraphs max. Use emojis naturally 🍜🇰🇷🚄.
Give specific, practical tips. Mention Korean words when helpful.
If asked in Korean, reply in Korean. Keep answers under 200 words.
Always end with one quick practical tip 💡.
Topics: Korean food, travel, transportation, K-beauty, K-pop, shopping, history, culture, companies.`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

// /chat — OpenRouter free LLM
async function handleChat(body, env) {
  const { message, history = [] } = body;
  if (!message?.trim()) return json({ error: 'No message' }, 400);

  const messages = [
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://koreaplus-lifes.com',
      'X-Title': 'KoreaPlus AI Guide',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 220,
      temperature: 0.6,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('OpenRouter error:', err);
    // 오류 시 다른 무료 모델로 자동 폴백
    return fallbackChat(messages, env);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || 'No response.';
  return json({ reply, model: MODEL });
}

// 폴백: DeepSeek 실패 시 Llama 3.3 70B 시도
async function fallbackChat(messages, env) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://koreaplus-lifes.com',
        'X-Title': 'KoreaPlus AI Guide',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',   // OpenAI US — fallback
        max_tokens: 220,
        temperature: 0.6,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Service temporarily unavailable.';
    return json({ reply, model: 'meta-llama/llama-3.3-70b-instruct:free (fallback)' });
  } catch {
    return json({ reply: '⚠️ AI service is temporarily unavailable. Please try again in a moment.' });
  }
}

// /place — Google Places API 프록시 (API 키 서버사이드 보관)
async function handlePlace(body, env) {
  const { query } = body;
  if (!query) return json({ error: 'No query' }, 400);
  if (!env.GOOGLE_PLACES_KEY) return json({ rating: null, reviews: [], _debug: 'no_key' });

  // 1. 장소 검색
  const searchRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${env.GOOGLE_PLACES_KEY}`
  );
  const searchData = await searchRes.json();
  if (searchData.error_message) return json({ rating: null, reviews: [], _debug: searchData.error_message });
  const place = searchData.results?.[0];
  if (!place) return json({ rating: null, reviews: [], _debug: 'no_place_found', status: searchData.status });

  // 2. 상세 정보 (리뷰 포함)
  const detailRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,user_ratings_total,reviews,opening_hours&language=en&key=${env.GOOGLE_PLACES_KEY}`
  );
  const detailData = await detailRes.json();
  const detail = detailData.result || {};

  return json({
    name: detail.name || place.name,
    rating: detail.rating || place.rating,
    userRatingsTotal: detail.user_ratings_total || place.user_ratings_total,
    isOpen: detail.opening_hours?.open_now ?? null,
    reviews: (detail.reviews || []).slice(0, 3).map(r => ({
      authorName: r.author_name,
      rating: r.rating,
      text: r.text,
      relativeTime: r.relative_time_description,
    })),
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS });

    const url = new URL(request.url);
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    if (url.pathname.endsWith('/place')) return handlePlace(body, env);
    return handleChat(body, env); // /chat 또는 기본
  }
};
