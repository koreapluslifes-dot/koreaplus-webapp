---
trigger: model_decision
description: "Rule for koreaplus-webapp: authority-elements-airkorea-key.md"
---
The 10-element "top-authority" build (2026-06-18) is implemented + live across all ~349 SEO pages × 9 langs:
1 GEO/AEO (Speakable schema + `.seo-keyfacts` box), 2 E-E-A-T byline, 3 Korea-Now live strip (`modules/korea-now.js`), 4 set-jetting cross-links, 5 provincial city guides (Gangneung/Sokcho/Suwon/Daegu + enriched Andong/Yeosu), 6 Organization/WebSite knowledge-graph (`#org`), 7 original-data Cost Index (`guide/korea-travel-cost-index.html`, Dataset schema, 4 langs), 8 "Was this helpful?" reactions (Worker `/api/react` KV-backed + `modules/react.js`), 9 video links, 10 accessibility (skip-link, og:image:alt, aria).

**PENDING USER ACTION:** `③` Korea-Now strip shows live weather + KRW FX today, but **PM2.5/air-quality is omitted until the `AIRKOREA_API_KEY` Worker secret is set** (`npx wrangler secret put AIRKOREA_API_KEY`). The `/api/airquality` handler already exists and returns 503 "AIRKOREA_API_KEY not configured" until then — it auto-appears once set (graceful, like [[agoda-api-usd-only]]). Get the key from AirKorea/공공데이터포털.

Worker now also routes `/api/react` (helpful-counter, 1 vote/IP/page/30d). New build-seo generators: `buildCostIndex`, `REGIONAL_CITIES`, `buildBestTime`, `buildTransport`, `keyFactsBox`/`trustBlock`/`injectToc`/`ORG_LD`/`speakableLD` in `shell()`. See [[deploy-seo-pages]].

**Traffic build (2026-06-20):** 10 search-traffic levers — ToC anchors, internal-linking footer, programmatic long-tail (12 "best-time-to-visit-<city>" + 5 "seoul-to-<city>"), TouristTrip schema, CWV preconnect, freshness/Discover meta, HTML sitemap (explore), intent formats, primaryImageOfPage. **Element 6 (biggest): the 6 top city guides are now in ALL 9 languages** — `CITY_GUIDE_LANGS=['ja','zh','es','ko','fr','de','pt','id']` (decoupled from `LOCALES` which stays ja/zh/es for months/visa/faq/blog/itin).

**Element 5 (image SEO) DONE via Unsplash** (free tier, zero cost): `prefetch-images.cjs` fetches one iconic photo per city → `city-images.json` (public CDN urls + photographer attribution only; the `UNSPLASH_ACCESS_KEY` is read from env and NEVER committed). build-seo embeds a hero `<figure>` + unique `og:image`/`twitter:image` + ImageObject on city guides (all 9 langs), best-time and transport pages; `sitemap-images.xml` (~72 entries) added to robots.txt. To add city images later: `UNSPLASH_ACCESS_KEY=xxx node prefetch-images.cjs` (50 req/hr free tier). All 10 search-traffic levers are now live.
