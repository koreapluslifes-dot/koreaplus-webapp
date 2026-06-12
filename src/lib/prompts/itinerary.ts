/**
 * Prompt templates for the AI Itinerary Builder.
 * Kept separate so prompts can be tuned without touching orchestration logic.
 *
 * Two-pass strategy:
 *   1. buildDraftPrompt  → LLM generates structured itinerary JSON (fast, high-temp)
 *   2. buildPolishPrompt → LLM enriches descriptions and tips (lower-temp, editorial)
 */

// ── Shared types ──────────────────────────────────────────────────────────────

export interface ItineraryInputs {
  arrival:      string;   // YYYY-MM-DD
  departure:    string;   // YYYY-MM-DD
  airport:      'ICN' | 'GMP' | 'PUS' | 'CJU';
  travelers:    'solo' | 'couple' | 'family' | 'group';
  ageGroups:    string[]; // 'kids' | 'teens' | '20s' | '30s' | '40s' | '50plus'
  interests:    string[]; // see INTERESTS constant
  pace:         'relaxed' | 'balanced' | 'packed';
  budget:       'budget' | 'mid' | 'comfort' | 'luxury';
  specialNeeds: string[]; // 'vegetarian' | 'halal' | 'english' | 'wheelchair'
  mode:         'local' | 'foreigner';
  lang?:        string;   // UI language code (en/ko/ja/zh/es/fr/de/pt/id) — prose language of the plan
}

export interface CandidatePlace {
  id:       string;
  name:     string;
  category: string;
  lat:      number;
  lng:      number;
  address:  string;
  image?:   string;
}

// ── Label maps ────────────────────────────────────────────────────────────────

const BUDGET_DESC: Record<string, string> = {
  budget:  '$50/day — street food, free attractions, guesthouses',
  mid:     '$100/day — mix of restaurants and mid-range paid attractions',
  comfort: '$200/day — good restaurants, most attractions, comfortable hotels',
  luxury:  '$300+/day — fine dining, VIP experiences, 5-star hotels',
};

const PACE_DESC: Record<string, { spots: number; desc: string }> = {
  relaxed:  { spots: 3, desc: '3 non-meal spots/day — unhurried, long time at each place, rest built in' },
  balanced: { spots: 5, desc: '5 non-meal spots/day — energetic but not exhausting, time to enjoy each place' },
  packed:   { spots: 7, desc: '7+ non-meal spots/day — maximize every waking hour, quick efficient moves' },
};

const TRAVELER_DESC: Record<string, string> = {
  solo:   'Solo traveler',
  couple: 'Couple (romantic trip)',
  family: 'Family with children (2–4 people)',
  group:  'Group of friends (5+ people)',
};

const LANG_NAMES: Record<string, string> = {
  en: 'English', ko: 'Korean', ja: 'Japanese', zh: 'Simplified Chinese',
  es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', id: 'Indonesian',
};

/** Prose-language rule: plans read in the traveler's UI language; names stay bilingual. */
function langName(inputs: ItineraryInputs): string {
  return LANG_NAMES[(inputs.lang || 'en').slice(0, 2)] || 'English';
}

const AIRPORT_DESC: Record<string, string> = {
  ICN: 'Incheon International Airport (ICN) — near Seoul/Incheon',
  GMP: 'Gimpo Airport (GMP) — western Seoul',
  PUS: 'Gimhae International Airport (PUS) — Busan',
  CJU: 'Jeju International Airport (CJU) — Jeju Island',
};

// ── Few-shot examples embedded in the prompt ──────────────────────────────────

const GOOD_EXAMPLE = `
=== GOOD PlaceObject example ===
{
  "id": "gyeongbokgung",
  "name": "Gyeongbokgung Palace",
  "nameKr": "경복궁",
  "category": "history",
  "address": "161 Sajik-ro, Jongno-gu, Seoul",
  "lat": 37.5796, "lng": 126.9770,
  "duration": 90,
  "cost": "₩3,000 (~$2.50)",
  "description": "Korea's grandest Joseon-era palace, built in 1395 and impressively restored after Japanese colonial-era destruction. Arrive before 10am to beat the crowds and catch the Changing of the Royal Guard ceremony at the main gate (Gwanghwamun) at 10am and 2pm on weekdays.",
  "insiderTip": "Rent a hanbok at the entrance stalls for ₩15,000 — hanbok wearers get free admission. Wear it to nearby Bukchon Hanok Village for the best photos of the day.",
  "openHours": "09:00–18:00 (Nov–Feb until 17:00)",
  "closedOn": "Tuesday",
  "travelToNext": {
    "method": "subway",
    "line": "Line 3 (Orange)",
    "stops": 1,
    "duration": 6,
    "instruction": "From Gyeongbokgung Station (Exit 3), take Line 3 one stop toward Ogeum to Anguk Station. Exit 6 leads directly to Bukchon Hanok Village."
  }
}`;

const BAD_EXAMPLE = `
=== NEVER DO THIS ===
- Scheduling National Museum of Korea on Monday (it's closed Mondays).
- Putting Gyeongbokgung Palace (northwest Seoul) and COEX Mall (southeast Seoul) in the same morning — they're 45 min apart each way.
- Generic tips like "try local food" or "use the subway" — always name the specific dish, line, exit number.
- Descriptions starting with "This famous..." or "Known for its..." — write like an excited local friend, not Wikipedia.
- Fake prices or impossible opening hours.
- Leaving travelToNext.instruction as null or "Take a taxi."`;

// ── Draft prompt (Pass 1) ─────────────────────────────────────────────────────

export function buildDraftPrompt(
  inputs: ItineraryInputs,
  candidates: CandidatePlace[],
  days: number,
  arrivalDate: Date
): string {
  const budgetLabel = BUDGET_DESC[inputs.budget] ?? BUDGET_DESC.mid;
  const paceLabel   = PACE_DESC[inputs.pace]     ?? PACE_DESC.balanced;
  const modeNote = inputs.mode === 'local'
    ? 'LOCAL FAVORITES MODE: prioritize where Koreans actually go. Quirky neighborhood spots, affordable local restaurants, less-touristy. English signage OK to be limited.'
    : 'FOREIGNER-FRIENDLY MODE: prioritize English menus, credit cards accepted, multilingual staff, well-documented in English, popular with expats and international visitors.';

  const specialNote = inputs.specialNeeds.length
    ? `MANDATORY DIETARY/ACCESS REQUIREMENTS (every food recommendation MUST meet these): ${inputs.specialNeeds.join(', ')}.`
    : '';

  // Compact candidate list for prompt (first 50 to stay under token limit)
  const candidateJson = JSON.stringify(
    candidates.slice(0, 50).map(p => ({
      id: p.id, name: p.name, cat: p.category,
      lat: p.lat, lng: p.lng, addr: p.address,
    })),
    null, 0
  );

  // Build date array
  const dates: string[] = [];
  for (let d = 0; d < days; d++) {
    const dt = new Date(arrivalDate);
    dt.setDate(dt.getDate() + d);
    dates.push(dt.toISOString().split('T')[0]);
  }
  const dateList = dates.map((d, i) => `Day ${i + 1}: ${d} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d).getDay()]})`).join('\n');

  // The draft must already be in the target language: the polish pass usually
  // cannot run right after the draft (both calls in one minute exceed the
  // 70B model's TPM budget), so the draft is what most users actually get.
  const ln = langName(inputs);
  return `You are Korea's top travel planner. Generate a ${days}-day Korea itinerary as JSON.
${ln !== 'English' ? `\nOUTPUT LANGUAGE: write every descriptive string (title, summary, highlights, theme, description, insiderTip, tip, dayTip, routeReason, travelToNext.instruction) in natural native ${ln}. Keep "name" in English, "nameKr" in Korean, and all JSON keys in English. Fill every field with real content — never leave a string empty.\n` : ''}
TRAVELER PROFILE:
- Type: ${TRAVELER_DESC[inputs.travelers] ?? inputs.travelers}
- Ages: ${inputs.ageGroups.join(', ')}
- Interests: ${inputs.interests.join(', ')}
- Pace: ${paceLabel.desc}
- Budget: ${budgetLabel}
- Arrival airport: ${AIRPORT_DESC[inputs.airport]}
- Mode: ${modeNote}
${specialNote}

TRIP DATES:
${dateList}

CANDIDATE PLACES FROM KOREA TOURISM DATABASE (use these where relevant; you may also add well-known places not in this list):
${candidateJson}

MANDATORY RULES:
1. Return ONLY valid JSON — zero preamble, zero markdown, zero explanation.
2. ${langName(inputs) === 'English'
    ? 'Write ALL text in natural native English. No Konglish. No "This is a must-visit."'
    : `Write ALL descriptive prose in natural native ${langName(inputs)} as stated above. No filler like "This is a must-visit."`}
3. Every insiderTip must name specifics: subway exit number, dish name, price range, exact photo spot.
4. Cluster geographically close places on the same day (minimize cross-city commutes).
5. Day 1 must start near ${AIRPORT_DESC[inputs.airport]}.
6. Final day must end near that same airport for convenience.
7. Insert exactly one lunch (12:00–13:00) and one dinner (18:00–20:00) per day.
8. Monday-closed venues (National Museum, most government museums): NEVER schedule on Monday.
9. Temple, palace, outdoor market hours: most open 09:00–18:00.
10. Non-meal spots per day: exactly ${paceLabel.spots}.
11. Each PlaceObject MUST have: id, name, nameKr, category, address, lat, lng, duration (minutes), cost, description (${langName(inputs) === 'English' ? '3–4 sentences' : '1–2 concise sentences'}), insiderTip${langName(inputs) === 'English' ? '' : ' (1 short sentence)'}, openHours, closedOn (or null), travelToNext.

${GOOD_EXAMPLE}
${BAD_EXAMPLE}

OUTPUT SCHEMA (return only this JSON, nothing else):
{
  "title": "string — catchy trip name (max 8 words)",
  "summary": "string — 2-sentence hook describing why this trip is special",
  "highlights": ["string x5 — the 5 must-do moments of the trip"],
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "dayOfWeek": "Monday",
      "theme": "string — punchy day theme (e.g. 'Royal Seoul & Street Art')",
      "morning": [PlaceObject, ...],
      "lunch": { "name": "", "nameKr": "", "type": "", "address": "", "lat": 0, "lng": 0, "cost": "", "tip": "" },
      "afternoon": [PlaceObject, ...],
      "dinner": { "name": "", "nameKr": "", "type": "", "address": "", "lat": 0, "lng": 0, "cost": "", "tip": "" },
      "evening": [PlaceObject],
      "routeReason": "string — 1 sentence explaining why today's order minimizes travel",
      "dayTip": "string — one key insider insight for this specific day"
    }
  ]
}`;
}

// ── Polish prompt (Pass 2) ────────────────────────────────────────────────────

export function buildPolishPrompt(draftJson: string, inputs: ItineraryInputs): string {
  const pl = langName(inputs);
  return `You are a Lonely Planet senior editor${pl !== 'English' ? ` and a professional ${pl} travel writer` : ''}. Polish this Korea itinerary JSON.
${pl !== 'English' ? `\n⚠️ OUTPUT LANGUAGE: ${pl}. Translate and rewrite ALL descriptive prose (title, summary, highlights, theme, description, insiderTip, tip, dayTip, routeReason, travelToNext.instruction) into natural native ${pl}. Keep "name" in English and "nameKr" in Korean. Keep all JSON keys in English.\n` : ''}
POLISH RULES:
1. Return ONLY valid JSON — same schema, same structure. Do NOT change place names, dates, or lat/lng.
2. Upgrade descriptions to Lonely Planet quality: vivid, specific, reads like an excited local friend.
3. Make insiderTips hyper-actionable: name the exact subway exit, the specific dish under ₩15,000, the exact photo angle.
4. Add or improve routeReason for each day — explain why this geographic order makes sense.
5. Verify closedOn accuracy: National Museum = Monday, Gyeongbokgung = Tuesday, MMCA = Monday.
6. Ensure travelToNext.instruction is step-by-step with exit numbers (e.g. "Exit 3, walk 200m north on Insadong-gil, turn left at the green pharmacy").
7. Keep tone warm and knowledgeable — like a Korean friend who loves showing their country off.
8. Fix any Konglish, awkward phrasing, or generic statements.
9. Special requirements must be reflected in all food recommendations: ${inputs.specialNeeds.join(', ') || 'none'}.
10. ${langName(inputs) === 'English'
    ? 'All prose stays in natural native English.'
    : `All descriptive prose MUST remain in natural native ${langName(inputs)} (place "name" stays English, "nameKr" stays Korean). If the draft contains English prose, translate it.`}

DRAFT TO POLISH:
${draftJson}

Return the polished JSON now. Same structure, better prose.`;
}
