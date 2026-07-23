---
trigger: model_decision
description: "Rule for koreaplus-webapp: agoda-api-usd-only.md"
---
The Agoda Long Tail Search API (`affiliateapi7643.agoda.com/affiliateservice/lt_v1`, cid 1952761) **only returns hotel results when `criteria.additional.currency` is `USD`**. Requesting JPY/KRW/CNY/EUR/BRL/IDR returns `error 911: No search result` (empty), which silently falls back to deep links.

**How we handle it** (`src/handlers/affiliate.ts`): always request `currency:'USD'` from Agoda, keep `language` localized (hotel NAMES come back translated per `AGODA_HL[lang]` e.g. ja-jp, zh-cn — this works fine), then convert the USD price to the visitor's currency at render via `fmtMoney()` using KV-cached live FX (`getFxRates()` → ExchangeRate-API, key `EXCHANGE_RATE_KEY`, KV key `fx:usd:v1`, 12h TTL) with a `STATIC_FX` fallback. Display is indicative; Agoda shows the exact local price on click.

**Finding new cityIds** (live-card coverage is now 22 Korean cities in `AGODA_CITY_ID`): get a candidate numeric id from `https://r.jina.ai/https://www.agoda.com/city/<slug>.html` (e.g. `gangneung-si-kr`, `andong-si-kr` — plain curl on agoda.com is bot-blocked), then VERIFY it against the live Long Tail API and match the returned hotels' `latitude`/`longitude` + names to the city. The raw Agoda result includes lat/lng (not exposed in the normal response). A wrong id just returns empty → graceful deep-link fallback, so it never breaks.

`language` localization is unaffected by this — only `currency` is USD-locked. Diagnosed via temporary `xcur`/`xhl` query overrides + `wrangler tail`. See [[cloudflare-fronting]] (prod HTML is served `cf-cache-status: DYNAMIC`, so deployed HTML changes show immediately — no CF purge needed).
