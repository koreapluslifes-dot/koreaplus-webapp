/**
 * LLM clients: Groq (primary) + Gemini Flash (fallback)
 *
 * Security policy: only US-based models.
 * Groq hosts Meta Llama on US infrastructure.
 * Never use DeepSeek, Qwen, GLM, MiniMax, or any Chinese-origin model.
 */

export interface LLMEnv {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

// ── Groq ──────────────────────────────────────────────────────────────────────

const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface GroqChatResponse {
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
    const data = await res.json() as GroqChatResponse;
    return data.choices[0]?.message?.content ?? '';
  }
}

// ── Gemini Flash fallback ─────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-1.5-flash';

export class GeminiClient {
  private readonly base = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private readonly key: string) {}

  async complete(prompt: string): Promise<string> {
    const res = await globalThis.fetch(
      `${this.base}/models/${GEMINI_MODEL}:generateContent?key=${this.key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(55_000),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json() as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}

// ── Unified call with fallback ────────────────────────────────────────────────

export async function callLLM(
  prompt: string,
  env: LLMEnv,
  maxTokens = 6000,
  temperature = 0.7
): Promise<string> {
  if (env.GROQ_API_KEY) {
    try {
      return await new GroqClient(env.GROQ_API_KEY).complete(prompt, maxTokens, temperature);
    } catch (err) {
      console.error('[Groq] failed, trying Gemini:', String(err).slice(0, 120));
    }
  }
  if (env.GEMINI_API_KEY) {
    try {
      return await new GeminiClient(env.GEMINI_API_KEY).complete(prompt);
    } catch (err) {
      console.error('[Gemini] also failed:', String(err).slice(0, 120));
    }
  }
  throw new Error('No LLM available — set GROQ_API_KEY or GEMINI_API_KEY');
}
