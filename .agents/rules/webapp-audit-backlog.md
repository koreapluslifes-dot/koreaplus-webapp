---
trigger: model_decision
description: "Rule for koreaplus-webapp: webapp-audit-backlog.md"
---
A 20-agent audit of the live app (2026-06) produced 25 actionable findings in my editable surface. **DONE (deployed):** Noto-KR font gated to /ko/, localized nav/city links (localizeLinks in build-seo.cjs), header.js defer + FOUC-guard, hero alt contextual + fetchpriority, removed ?lang= hreflang from 16 hand pages, restored Andong/Yeosu + wrote full Daejeon content, varied card emojis (placeEmoji/foodEmoji), .seo-toc styling + tap targets (seo.css?v=4), de-duplicated "Plan your [City]" h2, bucket-list role=checkbox + keyboard.

**DONE round 2 (2026-06-26, deployed):** skip-link + `id="main"` on hand pages (trending/quiz/compare/bucket) AND all 12 hubs (4 use `.hub-content`, 8 anchor on `.hub-hero`); compare.html `aria-pressed`/`scope`/`<caption>`; EN Article+dateModified JSON-LD on buildCity; lang="ko" on `.kr` spans; og+twitter+JSON-LD on the 12 hubs; about.html expanded; `sourcesBlock()` on YMYL (visa EN+ja/zh/es, cost) — emergency.html already cites 119/1330/embassy; **FAQ People-Also-Ask** (faq-paa.json: slug→[[q,a]×3], merged onto FAQS at build, rendered + 4-Question FAQPage schema on all 20 FAQ pages); **hub bylines** (KoreaPlus Editorial Team · Updated 2026 · Fact-checked) on all 12; **gradient-emoji hero badge** in seo.css?v=5 (closes the "text wall/zero imagery" finding for FAQ+place+all SEO heroes).

**REMAINING (lower priority):**
- per-place thumbnail images on city cards (CITY_IMAGES/imgUrl infra exists) beyond the emoji pass — needs real image URLs (Unsplash key not committed) so deferred.
- localize FAQ PAA into ja/zh/es (FAQ_L10N twins currently single-Q); localize hub bylines.

PAA generation note: ran via workflow faq-paa-expand (sequential + per-FAQ 3-retry). Transient "Server is temporarily limiting requests" rate-limits killed ~12/20 on the first pass even sequentially — a second run of just the missing slugs completed them. Audit transcript: tasks/wuiyizpmo.output. See [[affiliate-layout]], [[app-redesign-and-detail-l10n]], [[deploy-seo-pages]].
