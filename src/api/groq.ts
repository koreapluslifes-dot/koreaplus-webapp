/**
 * LLM clients: Groq (primary, fastest) + OpenRouter free (fallback)
 *
 * Security policy: US-based models only.
 * Never use DeepSeek, Qwen, GLM, MiniMax, or any Chinese-origin model.
 *
 * Primary:  Groq  — llama-3.3-70b-versatile   (30 req/min, 14400/day free)
 * Fallback: OpenRouter — llama-3.3-70b-instruct:free  (same model, different infra)
 *           Reuses the existing OPENROUTER_API_KEY — no extra secret needed.
 */

export interface LLMEnv {
  GROQ_API_KEY?:        string;
  OPENROUTER_API_KEY?:  string;  // also used as itinerary LLM fallback
}

// ── Groq (primary) ────────────────────────────────────────────────────────────

const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string }; finish_reason: string }>;
}

export class GroqClient {
  private readonly base = 'https://api.groq.com/openai/v1';

  constructor(private readonly key: string) {}

  async complete(prompt: string, maxTokens = 6000, temperature = 0.7): Promise<string> {
    const res = await globalThis.fetch(`${this.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json() as OpenAIChatResponse;
    return data.choices[0]?.message?.content ?? '';
  }
}

// ── OpenRouter free fallback ──────────────────────────────────────────────────
// Uses the same OPENROUTER_API_KEY already configured for the chatbot.
// llama-3.3-70b-instruct:free — Meta (US), identical model family to Groq primary.
// No JSON mode param needed; JSON enforcement is handled via prompt wording.

const OR_FALLBACK_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

export class OpenRouterLLMClient {
  private readonly base = 'https://openrouter.ai/api/v1';

  constructor(private readonly key: string) {}

  async complete(prompt: string, maxTokens = 6000, temperature = 0.7): Promise<string> {
    const res = await globalThis.fetch(`${this.base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization':   `Bearer ${this.key}`,
        'Content-Type':    'application/json',
        'HTTP-Referer':    'https://koreaplus-lifes.com',
        'X-Title':         'KoreaPlus Itinerary Builder',
      },
      body: JSON.stringify({
        model: OR_FALLBACK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json() as OpenAIChatResponse;
    return data.choices[0]?.message?.content ?? '';
  }
}

// ── Unified call with fallback ────────────────────────────────────────────────

export async function callLLM(
  prompt: string,
  env: LLMEnv,
  maxTokens = 6000,
  temperature = 0.7
): Promise<string> {
  // 1. Try Groq (fastest, purpose-built inference hardware)
  if (env.GROQ_API_KEY) {
    try {
      return await new GroqClient(env.GROQ_API_KEY).complete(prompt, maxTokens, temperature);
    } catch (err) {
      console.error('[Groq] failed, falling back to OpenRouter:', String(err).slice(0, 120));
    }
  }
  // 2. Fallback: OpenRouter free tier (same model, reuses existing key)
  if (env.OPENROUTER_API_KEY) {
    try {
      return await new OpenRouterLLMClient(env.OPENROUTER_API_KEY).complete(prompt, maxTokens, temperature);
    } catch (err) {
      console.error('[OpenRouter fallback] also failed:', String(err).slice(0, 120));
    }
  }
  throw new Error('No LLM available — configure GROQ_API_KEY (primary) or OPENROUTER_API_KEY (fallback)');
}
