/**
 * LLM client for AI Itinerary Builder — OpenRouter free tier only.
 *
 * Security policy: US-based models only.
 * Never use DeepSeek, Qwen, GLM, MiniMax, or any Chinese-origin model.
 *
 * Primary:  meta-llama/llama-3.3-70b-instruct:free  — Meta (US), capable, free
 * Fallback: meta-llama/llama-3.1-8b-instruct:free   — Meta (US), fastest, free
 * Optional: Groq llama-3.3-70b-versatile (if GROQ_API_KEY set, used first for speed)
 *
 * Both primary and fallback reuse OPENROUTER_API_KEY — no new secrets needed.
 */

export interface LLMEnv {
  OPENROUTER_API_KEY?: string;
  GROQ_API_KEY?:       string;  // optional: Groq hardware-accelerated path
  groq_api_key?:       string;  // accept lowercase secret name too (case-sensitive on CF)
}

/** Resolve the Groq key regardless of secret-name casing, trimmed of stray BOM/whitespace. */
export function groqKey(env: LLMEnv): string {
  return (env.GROQ_API_KEY || env.groq_api_key || '').trim();
}

const OR_PRIMARY  = 'meta-llama/llama-3.3-70b-instruct:free';
// 3.1-8b:free was removed from OpenRouter (404 "No endpoints found").
// 3.2-3b:free is the proven-working free model (same one /chat uses).
const OR_FALLBACK = 'meta-llama/llama-3.2-3b-instruct:free';
// Meta Llama 3.3 70B Versatile — the itinerary request is large (long prompt +
// up to 6000 output tokens). On Groq's free tier 70B has a HIGHER per-minute
// token limit (12,000 TPM) than 8B-instant (6,000 TPM), so the big request fits
// here where 8B returns 413 "request too large". (Chat uses 8B — small + fast.)
const GROQ_MODEL  = 'llama-3.3-70b-versatile';

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string }; finish_reason: string }>;
  error?:  { message: string; code?: string };
}

// ── OpenRouter client ─────────────────────────────────────────────────────────

export class OpenRouterLLMClient {
  private readonly base = 'https://openrouter.ai/api/v1';

  constructor(private readonly key: string) {}

  async complete(
    prompt: string,
    model: string,
    maxTokens = 6000,
    temperature = 0.7
  ): Promise<string> {
    const res = await globalThis.fetch(`${this.base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.key}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://koreaplus-lifes.com',
        'X-Title':       'KoreaPlus Itinerary Builder',
      },
      body: JSON.stringify({
        model,
        messages:   [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenRouter [${model}] ${res.status}: ${body.slice(0, 180)}`);
    }
    const data = await res.json() as OpenAIChatResponse;
    if (data.error) throw new Error(`OpenRouter error: ${data.error.message}`);
    const content = data.choices?.[0]?.message?.content ?? '';
    if (!content) throw new Error('OpenRouter returned empty content');
    return content;
  }
}

// ── Optional Groq client (hardware-accelerated) ───────────────────────────────

export class GroqClient {
  private readonly base = 'https://api.groq.com/openai/v1';

  constructor(private readonly key: string) {}

  async complete(prompt: string, maxTokens = 6000, temperature = 0.7): Promise<string> {
    const res = await globalThis.fetch(`${this.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:           GROQ_MODEL,
        messages:        [{ role: 'user', content: prompt }],
        max_tokens:      maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq ${res.status}: ${body.slice(0, 180)}`);
    }
    const data = await res.json() as OpenAIChatResponse;
    return data.choices?.[0]?.message?.content ?? '';
  }
}

// ── Unified call: Groq (optional) → OR 70B → OR 8B ───────────────────────────

export async function callLLM(
  prompt: string,
  env: LLMEnv,
  maxTokens = 6000,
  temperature = 0.7
): Promise<string> {
  // 0. Groq (optional — fastest hardware inference, if key configured)
  const gk = groqKey(env);
  if (gk) {
    try {
      return await new GroqClient(gk).complete(prompt, maxTokens, temperature);
    } catch (err) {
      console.error('[Groq] failed:', String(err).slice(0, 100));
    }
  }

  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  const or = new OpenRouterLLMClient(env.OPENROUTER_API_KEY.trim());

  // 1. Primary: llama-3.3-70b (capable enough for complex itinerary JSON)
  try {
    return await or.complete(prompt, OR_PRIMARY, maxTokens, temperature);
  } catch (err) {
    console.error('[OR 70B] failed:', String(err).slice(0, 100));
  }

  // 2. Fallback: llama-3.1-8b (fastest, lighter, may produce shorter output)
  try {
    return await or.complete(prompt, OR_FALLBACK, Math.min(maxTokens, 4096), temperature);
  } catch (err) {
    console.error('[OR 8B] failed:', String(err).slice(0, 100));
  }

  throw new Error('All LLM providers failed');
}
