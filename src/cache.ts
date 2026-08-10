/**
 * Two-tier cache for the KoreaPlus Worker:
 *  Tier 1 — Cloudflare Workers KV (cross-datacenter, persistent)
 *            Used when the CACHE_KV binding is present in wrangler.toml.
 *  Tier 2 — In-memory Map (per Worker instance, resets on cold start)
 *            Automatic fallback when KV is not configured.
 *
 * Usage:
 *   const data = await withCache(env, 'weather:Seoul', 7200, () => fetchWeather());
 */

export interface CacheEnv {
  CACHE_KV?: KVNamespace;
}

interface MemEntry {
  value: string;
  expiresAt: number; // Date.now() ms
}

// Module-level in-memory store (survives across requests within same instance)
const memStore = new Map<string, MemEntry>();

/**
 * Wraps an async fetcher with a cache layer.
 * @param env        Worker environment (may contain CACHE_KV)
 * @param key        Cache key string
 * @param ttl        Time-to-live in seconds
 * @param fetcher    Async function that fetches fresh data when cache misses
 * @param opts       bypass:true skips BOTH read tiers and refills them — what a
 *                   user-pressed "refresh" needs, since a KV hit would
 *                   otherwise serve the same bytes for the whole TTL.
 * @returns          { data, cached, cacheAgeSeconds }
 */
export async function withCache<T>(
  env: CacheEnv,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  opts: { bypass?: boolean } = {},
): Promise<{ data: T; cached: boolean; cacheAgeSeconds?: number }> {
  const cacheKey = `kp:${key}`;
  const bypass = opts.bypass === true;

  // ── Try KV first ──────────────────────────────────────────────────────────
  if (env.CACHE_KV && !bypass) {
    try {
      const raw = await env.CACHE_KV.get(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: T; storedAt: number };
        const ageSeconds = Math.floor((Date.now() - parsed.storedAt) / 1000);
        return { data: parsed.data, cached: true, cacheAgeSeconds: ageSeconds };
      }
    } catch {
      // KV read failure — fall through to fetcher
    }
  }

  // ── Try in-memory ─────────────────────────────────────────────────────────
  const memEntry = bypass ? undefined : memStore.get(cacheKey);
  if (memEntry && memEntry.expiresAt > Date.now()) {
    const data = JSON.parse(memEntry.value) as T;
    const ageSeconds = Math.floor((Date.now() - (memEntry.expiresAt - ttl * 1000)) / 1000);
    return { data, cached: true, cacheAgeSeconds: ageSeconds };
  }

  // ── Cache miss — fetch fresh data ─────────────────────────────────────────
  const data = await fetcher();
  const serialized = JSON.stringify(data);
  const storedAt = Date.now();

  // Write to KV (async, don't await — non-blocking)
  if (env.CACHE_KV) {
    env.CACHE_KV.put(
      cacheKey,
      JSON.stringify({ data, storedAt }),
      { expirationTtl: ttl },
    ).catch(() => {}); // ignore write failures
  }

  // Write to in-memory store
  memStore.set(cacheKey, {
    value: serialized,
    expiresAt: Date.now() + ttl * 1000,
  });

  // Prune stale in-memory entries (keep under 200 keys)
  if (memStore.size > 200) {
    const now = Date.now();
    for (const [k, v] of memStore) {
      if (v.expiresAt <= now) memStore.delete(k);
    }
  }

  return { data, cached: false };
}

/**
 * Invalidates a specific cache key from both KV and memory.
 */
export async function invalidateCache(env: CacheEnv, key: string): Promise<void> {
  const cacheKey = `kp:${key}`;
  memStore.delete(cacheKey);
  if (env.CACHE_KV) {
    await env.CACHE_KV.delete(cacheKey).catch(() => {});
  }
}
