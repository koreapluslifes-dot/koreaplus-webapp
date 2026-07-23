---
trigger: model_decision
description: "Rule for koreaplus-webapp: affiliate-layout.md"
---
Two affiliate partners, placed to stay helpful not excessive (≤1 of each per page, travel-intent pages only — never /kbeauty):

**Agoda — REMOVED sitewide (2026-06, owner request: cookie window too short).** `affBlock()/affHtml()` in build-seo.cjs were repurposed to delegate to the city-matched `klookBlock` (so all ~25 call sites switched with no per-site edits); `modules/affiliate.js` + AGODA_CID + agodaUrl are now dead code (left in place, harmless). `kp-agoda-mini` removed from the 12 hand hub pages; Agoda CTA removed from `modules/page-ads.js`. `agoda.com`/`seo-aff` = 0 across the site. (Old Agoda API note kept for history: [[agoda-api-usd-only]].)

**Klook is now the SOLE affiliate, CITY-MATCHED.** `CITY_KLOOK` map in build-seo.cjs picks the dynamic-widget adid by the page's city: **Seoul 1310693 (=default), Busan 1313869, Jeju 1313871, Gyeongju 1313873, Daejeon 1313876, Incheon 1313877**. The 1313876 widget is Daejeon-based, so it lives on a NEW dedicated Daejeon city guide (added Daejeon to REGIONAL_CITIES → guide/things-to-do-in-daejeon.html); **Jeonju is NOT in the map → uses default Seoul** (Jeonju isn't searchable on Klook). Non-city / unmapped pages → default Seoul. `klookBlock(lang, {city})` emits `data-adid`; `modules/klook-cards.js?v=2` reads it (`el.getAttribute('data-adid')`). The shell safety-net dedups on `class="kp-klook"` → exactly ONE Klook block per page (641 pages × 9 langs). Category-specific widgets (food/transport/shopping/culture) NOT yet created by owner — add their adids to CITY_KLOOK-style map when provided.

**Klook (activities, eSIM, airport transport, tours)** — adid **1310693**, dynamic_widget, `data-lang/currency` blank (auto-localizes). Snippet = `<ins class="klk-aff-widget" …>` + `https://affiliate.klook.com/widget/fetch-iframe-init.js` (scans for `.klk-aff-widget`, renders an iframe `affiliate.klook.com/widget/render?adid=1310693`). Split across **two intentionally separate loaders that never collide** (different selectors):
- **`modules/klook.js`** — the DISPATCH session's file (tracked, commit 3f2267b, precached in sw v42). Targets `#kp-klook` (by id), loads immediately on DOM-ready, light-theme colors (#444/#999). On ~13 hand-built travel pages + planner. **Do NOT touch this file.**
- **`modules/klook-cards.js`** — MINE (2026-06-20). Targets `.kp-klook[data-klook="1"]` (by class), **lazy-loads** the iframe via IntersectionObserver (rootMargin 400px), dark-theme styled. Emitted by `klookBlock(lang)` in build-seo.cjs ONLY on **city guides (EN + 8 langs) + itineraries** (after the Agoda block). Wired as `<script defer src="modules/klook-cards.js?v=1">` in the SEO shell (no-ops on pages without the block).

Verified the injection produces a real Klook iframe (inline preview test). IntersectionObserver doesn't fire in the headless Claude preview (viewport innerHeight reports 0; SEO shell pages also 404 their modules locally due to `<base href="/guide/">`) — that's an environment limit, not a bug; standard in real browsers. See [[cross-domain-growth-elements]], [[deploy-seo-pages]].

**AdSense** — client `ca-pub-1378943893051810`, slot `4521899200` (one slot reused sitewide). On the home page (index.html) it was REMOVED per owner request (both the top topads unit via `data-ads="off"` and the bottom in-content unit). SEO pages get it via the build-seo shell (a top unit + an in-article `midAd` + `#kp-topads` with `data-ads="off"` so topads only adds AliExpress). Hub pages have a capped `<ins>` (max-height ~110px) + topads.

**Ad coverage map / future pages (2026-06):**
- **SEO pages** (build-seo.cjs shell): AdSense (top + mid in-article) + Agoda (affHtml) + Klook (klookBlock on city/itinerary). Future generated pages auto-covered — no action needed.
- **Hub pages** (festivals/seasons/etc.): AdSense ins + `.kp-agoda-mini` + `#kp-klook` (klook.js) via header.js stack.
- **New hand/tool pages**: use **`modules/page-ads.js`** — a self-contained drop-in (no header.js/hub-styles needed) that injects ONE section before the footer = Agoda CTA + Klook widget + a single AdSense unit, FTC-disclosed, dark-inline, 9-lang, loaded ~1.5s after page load (post-LCP, no IntersectionObserver so it always renders). Added to quiz/bucket-list/compare/trending. Opt out with `data-noads` on `<body>` (embed.html is intentionally ad-free — B2B widget showcase).
- **To monetize any FUTURE hand page**: add `<script defer src="modules/page-ads.js?v=1"></script>` before `</body>`.
