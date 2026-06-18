/**
 * Lightweight "Was this helpful?" reactions (element 8: UGC / social proof).
 * No free text → no moderation needed. Counts stored in CACHE_KV; one vote per
 * IP per page per 30 days (basic anti-abuse). Safe, fallback-quiet.
 *
 * GET  /api/react?slug=<page>          → { up, down }
 * POST /api/react?slug=<page> {v:up|down} → { up, down, voted }
 */
import type { WorkerEnv } from '../worker.ts';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (o: unknown) => new Response(JSON.stringify(o), { headers: CORS });

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
async function getCounts(env: WorkerEnv, key: string): Promise<{ up: number; down: number }> {
  if (!env.CACHE_KV) return { up: 0, down: 0 };
  const raw = await env.CACHE_KV.get(key);
  if (!raw) return { up: 0, down: 0 };
  try { const c = JSON.parse(raw); return { up: c.up || 0, down: c.down || 0 }; } catch { return { up: 0, down: 0 }; }
}

export async function handleReact(request: Request, env: WorkerEnv): Promise<Response> {
  const u = new URL(request.url);
  const slug = (u.searchParams.get('slug') || '').slice(0, 120).replace(/[^a-zA-Z0-9/_.-]/g, '');
  if (!slug || !env.CACHE_KV) return json({ up: 0, down: 0 });
  const key = `react:${slug}`;

  if (request.method !== 'POST') return json(await getCounts(env, key));

  let v: 'up' | 'down' = 'up';
  try { const b = await request.json() as { v?: string }; if (b && b.v === 'down') v = 'down'; } catch { /* default up */ }
  const ip = request.headers.get('cf-connecting-ip') || '0';
  const ipKey = `react:ip:${djb2(ip)}:${djb2(slug)}`;
  const already = await env.CACHE_KV.get(ipKey);
  const c = await getCounts(env, key);
  if (!already) {
    c[v] += 1;
    await env.CACHE_KV.put(key, JSON.stringify(c)).catch(() => {});
    await env.CACHE_KV.put(ipKey, v, { expirationTtl: 30 * 86400 }).catch(() => {});
  }
  return json({ ...c, voted: already || v });
}
