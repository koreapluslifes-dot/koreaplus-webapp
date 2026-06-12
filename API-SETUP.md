# 🔑 KoreaPlus — API Setup Guide

This is the **single checklist** to make every feature live. The app's code is
already complete and type-checks cleanly — it just needs the right worker
deployed and the API keys registered as Cloudflare secrets.

> **⚠️ Most important finding first:** The worker currently live at
> `koreaplus-webapp.jeybeeicon.workers.dev` is the **old `worker.js`** (only
> `/chat` + `/place`). The full backend (`src/worker.ts` — trip planner,
> weather, exchange, festivals, subway, menu translator, etc.) **has never been
> deployed**. That is why the Trip Planner returns *"Generation failed"* and the
> live dashboard shows *"unavailable"* in production. **Step 1 below fixes this.**

---

## 0. Prerequisites (once)

```bash
cd koreaplus-webapp
npm install
npx wrangler login          # authenticate with your Cloudflare account
npm run typecheck           # should print nothing and exit 0  ✅ (already passing)
```

---

## 1. Deploy the REAL worker  ⬅️ do this first

`wrangler.toml` already points to `src/worker.ts`, so just:

```bash
npm run deploy
```

Verify the new routes exist (these return JSON, **not** "Method not allowed"):

```bash
curl https://koreaplus-webapp.jeybeeicon.workers.dev/api/health
```

Once deployed, `/api/health` reports which keys are configured.

---

## 2. Create the KV namespace (Trip Planner cache + share links)

The planner uses KV for: 24h result cache, the 3/day rate-limit, and **share
links** (sharing is disabled without it).

```bash
npx wrangler kv namespace create CACHE_KV
npx wrangler kv namespace create CACHE_KV --preview
```

Then **uncomment + fill** this block in `wrangler.toml` with the ids it prints:

```toml
[[kv_namespaces]]
binding = "CACHE_KV"
id = "<production-id-from-command>"
preview_id = "<preview-id-from-command>"
```

Re-deploy after editing: `npm run deploy`.

---

## 3. Register the secrets

Each is set with `npx wrangler secret put <NAME>` (it prompts for the value).
All are **free** to obtain. The app **degrades gracefully** — any feature whose
key is missing simply shows "unavailable", so you can add them incrementally.

| Secret | Powers | Where to get it (free) | Priority |
|---|---|---|---|
| `OPENROUTER_API_KEY` | AI chatbot **and** Trip Planner LLM | https://openrouter.ai/keys | 🔴 core |
| `GOOGLE_PLACES_KEY` | Ratings & reviews in place panels | Google Cloud Console → Places API | 🔴 core |
| `TOUR_API_KEY` | Festivals, attractions, planner candidate spots | https://www.data.go.kr/data/15101578/openapi.do | 🟠 high |
| `EXCHANGE_RATE_KEY` | Live currency rates | https://app.exchangerate-api.com/sign-up | 🟠 high |
| `KMA_API_KEY` | Live weather (dashboard, "This Week") | https://www.data.go.kr/data/15084084/openapi.do | 🟡 nice |
| `AIRKOREA_API_KEY` | Air quality / fine dust (PM2.5) | https://www.data.go.kr/data/15073861/openapi.do | 🟡 nice |
| `SEOUL_SUBWAY_KEY` | Real-time subway arrivals | https://data.seoul.go.kr (실시간 지하철 인증키) | 🟡 nice |
| `SEOUL_OPEN_DATA_KEY` | Ddareungi public-bike availability | https://data.seoul.go.kr (일반 인증키) | 🟢 optional |
| `KOPIS_API_KEY` | Performances & box office | https://www.kopis.or.kr/por/cs/openapi/openApiInfo.do | 🟢 optional |
| `GROQ_API_KEY` | Faster planner inference (optional speed boost) | https://console.groq.com/keys | 🟢 optional |

Example:

```bash
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put GOOGLE_PLACES_KEY
npx wrangler secret put TOUR_API_KEY
# …repeat for each key you have
```

### ⚠️ Google Places key — important gotcha
The current Places key is **HTTP-referer-restricted**, which **cannot** be used
from a server (the worker). Test confirms:
`"API keys with referer restrictions cannot be used with this API."`

Fix in Google Cloud Console → Credentials → your key:
- For **`GOOGLE_PLACES_KEY`** (used by the worker): set *Application restrictions*
  to **None** or **IP addresses**, and enable **Places API**.
- Use a **separate** key for the browser map embed (next step) with referer
  restrictions — never reuse the server key in the browser.

---

## 4. Client-side Maps key (browser map embeds)

The embedded Google map inside place panels is rendered in the browser, so it
needs a **public, referer-restricted** key set in `config.js` (gitignored):

```js
// config.js  (copy from config.example.js)
window.WORKER_URL = 'https://koreaplus-webapp.jeybeeicon.workers.dev';
window.MAPS_KEY   = 'AIza...your-browser-key';   // Maps Embed API
```

For this key in Google Cloud Console:
- *Application restrictions* → **HTTP referrers** → add `https://koreaplus-lifes.com/*`
- Enable **Maps Embed API**.

> Without `MAPS_KEY` the app still works — place panels show a tasteful
> "Tap to view on the map" card plus **Naver / Kakao** map links (which have the
> best coverage in Korea anyway), so this key is optional polish.

---

## 5. Verify everything

```bash
curl https://koreaplus-webapp.jeybeeicon.workers.dev/api/health
```

Expected (all true once keys are set):

```json
{ "data": { "services": {
    "openrouter": true, "google_places": true, "tour_api": true,
    "kopis": true, "kma_weather": true, "airkorea": true,
    "seoul_transit": true, "exchange_rate": true
  }, "allConfigured": true } }
```

Then in the app:
- **AI Guide** chat replies → `OPENROUTER_API_KEY` ✅
- **Plan Trip** generates an itinerary → worker deployed + KV + LLM key ✅
- **Currency** shows "Updated: …" (not "Offline rates") → `EXCHANGE_RATE_KEY` ✅
- **"Korea Now"** widget shows weather/air → `KMA_API_KEY` / `AIRKOREA_API_KEY` ✅
- Place panels show ⭐ ratings → `GOOGLE_PLACES_KEY` (unrestricted) ✅

---

## TL;DR for the owner

1. `npm run deploy` (this alone unbreaks the Trip Planner & live data) ← **biggest win**
2. Create `CACHE_KV`, paste ids into `wrangler.toml`, redeploy.
3. `wrangler secret put` the keys you have (start with `OPENROUTER_API_KEY`,
   `GOOGLE_PLACES_KEY` *unrestricted*, `TOUR_API_KEY`, `EXCHANGE_RATE_KEY`).
4. Put a browser `MAPS_KEY` in `config.js` (optional).
5. `curl …/api/health` → confirm `allConfigured: true`.
