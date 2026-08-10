/**
 * Bias Battle tally — the K-pop hub's daily head-to-head poll (F4).
 *
 *   GET  /api/kpop/vote?battle=YYYYMMDD:aid-vs-bid          → { a, b, total }
 *   POST /api/kpop/vote?battle=YYYYMMDD:aid-vs-bid&pick=a|b → same, after counting
 *
 * Same KV-increment shape as handlers/reactions.ts, and registered in worker.ts
 * next to it rather than in router.ts: handleApiRoute only ever sees GET, so a
 * vote posted through the router would never arrive.
 *
 * Sides are "a"/"b" because the client orders each pair by artist id — every
 * device therefore derives the same two sides from the same battle key.
 *
 * CACHE_KV read-modify-write is NOT atomic, so simultaneous votes can drop one.
 * That is why the UI says "~N votes" and never sells these as exact figures.
 * No KV binding → zeroes, and the hub simply shows no percentages.
 */
import type { WorkerEnv } from '../worker.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

export async function handleKpopVote(request: Request, env: WorkerEnv): Promise<Response> {
  const u = new URL(request.url);
  const battle = (u.searchParams.get('battle') || '').slice(0, 80).replace(/[^a-zA-Z0-9:_-]/g, '');
  if (!battle) return json({ error: 'battle required' }, 400);
  if (!env.CACHE_KV) return json({ data: { a: 0, b: 0, total: 0 }, cached: false, source: 'worker' });

  const key = `kpvote:${battle}`;
  const read = async (): Promise<{ a: number; b: number }> => {
    const raw = await env.CACHE_KV!.get(key);
    if (!raw) return { a: 0, b: 0 };
    try {
      const c = JSON.parse(raw) as { a?: number; b?: number };
      return { a: Number(c.a) || 0, b: Number(c.b) || 0 };
    } catch { return { a: 0, b: 0 }; }
  };

  if (request.method !== 'POST') {
    const c = await read();
    return json({ data: { ...c, total: c.a + c.b }, cached: false, source: 'worker' });
  }

  const pick: 'a' | 'b' = u.searchParams.get('pick') === 'b' ? 'b' : 'a';
  // One vote per IP per battle. The battle key rolls daily, so this window only
  // has to outlive a single day.
  const ip = request.headers.get('cf-connecting-ip') || '0';
  const ipKey = `kpvote:ip:${djb2(ip)}:${djb2(battle)}`;
  const already = await env.CACHE_KV.get(ipKey);
  const c = await read();
  if (!already) {
    c[pick] += 1;
    await env.CACHE_KV.put(key, JSON.stringify(c), { expirationTtl: 7 * 86400 }).catch(() => {});
    await env.CACHE_KV.put(ipKey, pick, { expirationTtl: 2 * 86400 }).catch(() => {});
  }
  return json({ data: { ...c, total: c.a + c.b, voted: already || pick }, cached: false, source: 'worker' });
}
