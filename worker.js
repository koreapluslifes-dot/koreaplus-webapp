// Cloudflare Worker — KoreaPlus AI Guide + Google Places proxy
// Secrets: GROQ_API_KEY, GOOGLE_PLACES_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `You are "Korea AI Guide" — a friendly expert on South Korea for international visitors.
Answer concisely in 2-3 short paragraphs. Use emojis naturally (🍜🇰🇷🚄).
Give specific, practical tips. Mention Korean words when helpful (감사합니다 = thank you).
If asked in Korean, reply in Korean.
Topics: food, travel spots, transportation, K-beauty, K-pop, shopping, history, culture, companies, practical tips.
Keep answers under 200 words. Always end with one quick practical tip.`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

// Route: POST /chat
async function handleChat(body, env) {
  const { message, history = [] } = body;
  if (!message?.trim()) return json({ error: 'No message' }, 400);

  const messages = [
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',   // Best free Groq model
      max_tokens: 350,
      temperature: 0.75,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Groq error:', err);
    return json({ error: 'AI service error' }, 502);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || 'No response.';
  return json({ reply });
}

// Route: POST /place  — Google Places proxy (keeps API key server-side)
async function handlePlace(body, env) {
  const { query } = body;
  if (!query) return json({ error: 'No query' }, 400);
  if (!env.GOOGLE_PLACES_KEY) return json({ error: 'No Places key' }, 500);

  // 1. Text Search to get place_id
  const searchRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${env.GOOGLE_PLACES_KEY}`
  );
  const searchData = await searchRes.json();
  const place = searchData.results?.[0];
  if (!place) return json({ rating: null, reviews: [] });

  // 2. Place Details for reviews
  const detailRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,user_ratings_total,reviews,opening_hours&key=${env.GOOGLE_PLACES_KEY}`
  );
  const detailData = await detailRes.json();
  const detail = detailData.result || {};

  const reviews = (detail.reviews || []).map(r => ({
    authorName: r.author_name,
    rating: r.rating,
    text: r.text,
    relativeTime: r.relative_time_description,
  }));

  return json({
    rating: detail.rating || place.rating,
    userRatingsTotal: detail.user_ratings_total || place.user_ratings_total,
    reviews,
    isOpen: detail.opening_hours?.open_now ?? null,
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    const url = new URL(request.url);
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    if (url.pathname.endsWith('/chat')) return handleChat(body, env);
    if (url.pathname.endsWith('/place')) return handlePlace(body, env);

    // Default: treat as /chat for backwards compatibility
    return handleChat(body, env);
  }
};
