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
}

const OR_PRIMARY  = 'meta-llama/llama-3.3-70b-instruct:free';
const OR_FALLBACK = 'meta-llama/llama-3.1-8b-instruct:free';
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
  if (env.GROQ_API_KEY) {
    try {
      return await new GroqClient(env.GROQ_API_KEY).complete(prompt, maxTokens, temperature);
    } catch (err) {
      console.error('[Groq] failed:', String(err).slice(0, 100));
    }
  }

  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  const or = new OpenRouterLLMClient(env.OPENROUTER_API_KEY);

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
