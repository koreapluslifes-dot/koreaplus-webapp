/**
 * Menu Translator handler — POST /api/translate-menu
 * Accepts OCR'd Korean menu text → returns LLM-structured translation cards.
 */
import { callLLM } from '../api/groq.ts';
import type { WorkerEnv } from '../worker.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export interface MenuItem {
  korean:      string;
  english:     string;
  description: string;
  allergens:   string[];
  spice:       number;  // 0–3
  price:       string;
  vegetarian:  boolean;
}

const PROMPT = (text: string) => `You are a Korean restaurant menu expert.
Extract all menu items from the text below. For each item return JSON with:
  "korean": original Korean text (string)
  "english": English name (string)
  "description": 1-sentence English description (string)
  "allergens": subset of ["pork","beef","seafood","shellfish","egg","dairy","gluten","nuts","soy"] present (array)
  "spice": 0=none 1=mild 2=medium 3=very spicy (number)
  "price": price string if visible else "" (string)
  "vegetarian": true if no meat/seafood (boolean)

RETURN ONLY a valid JSON array, no markdown, no explanation.
If no items found, return [].

Menu text:
${text}`;

export async function handleMenuTranslate(request: Request, env: WorkerEnv): Promise<Response> {
  let body: { text?: string };
  try   { body = await request.json() as { text?: string }; }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const text = (body.text ?? '').trim();
  if (!text)             return json({ error: 'No text provided' }, 400);
  if (text.length > 4000) return json({ error: 'Text too long (max 4000 chars)' }, 400);

  try {
    const raw     = await callLLM(PROMPT(text), env, 3000, 0.1);
    const match   = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found');
    const items   = JSON.parse(match[0]) as MenuItem[];
    return json({ items, count: items.length });
  } catch (err) {
    console.error('[translate-menu] LLM error:', String(err).slice(0, 120));
    return json({ items: [], count: 0, error: 'Translation unavailable — try again' });
  }
}
