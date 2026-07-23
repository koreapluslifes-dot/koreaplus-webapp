---
trigger: always_on
description: "koreaplus-webapp memory index"
---
# KoreaPlus — Memory Index

- [Religion webapp](religion-webapp.md) — all-lifes.com/religion "종교의 모든것" DEPLOYED LIVE, **1017 URLs/9 langs** (v4 global redesign: Wikimedia hero imagery 73장 + timeline/statistics/places depth pages + compare auto-analysis); 12 religions ENCYCLOPEDIA-GRADE (en+ko). Repo C:\Users\juksu\religion-webapp, deploy `bash deploy-religion.sh`.
- [PetPlus webapp](pet-webapp.md) — all-lifes.com/pet/ GLOBAL platform, **3,498 URLs / 6 langs (en·ko·ja·es·pt·de)** LIVE: v4 redesign+다크모드, Wikimedia 실사 109장+og:image, 109 breed profiles + matcher + guides + compare + programmatic analytics. Seoul Lightsail (3.36.235.171).
- [Calculator Hub webapp](calc-webapp.md) — all-lifes.com/calc DEPLOYED & LIVE, **1,146 URLs**: 11 calculators (en/ko, incl. statistics·quadratic) + **scientific calculator ×9 langs** (shunting-yard engine, keypad, usage guide) + conversion engine (12 measures × 108 pairwise × 9 langs) + design system v2. Lightsail-direct `.\deploy.ps1`.

- [Cloudflare fronting](cloudflare-fronting.md) — prod is behind Cloudflare + Cloudflare Fonts; strips gstatic preconnect, so prod HTML ≠ deployed source for fonts (not a bug).
- [Agoda API USD-only](agoda-api-usd-only.md) — Agoda Long Tail API returns results only for currency=USD (others → error 911); we request USD + localize language, convert price via live FX.
- [Affiliate layout](affiliate-layout.md) — Agoda (hotels) sitewide; Klook (activities) split across dispatch's klook.js (#id, hand pages) + my klook-cards.js (.class lazy, SEO city/itinerary pages) — never touch dispatch's klook.js.
- [Deploying SEO pages](deploy-seo-pages.md) — SEO subdirs aren't git-tracked; deploy via tar→/tmp→sudo extract on Lightsail (bitnami lacks write perm on /guide subdirs); Worker via wrangler.
- [Authority elements + AIRKOREA key](authority-elements-airkorea-key.md) — 10 top-authority elements live; only pending action is setting AIRKOREA_API_KEY secret to enable PM2.5 in the Korea-Now strip.
- [Cross-domain growth elements](cross-domain-growth-elements.md) — 9 cross-industry traffic elements live (quiz, share card, bucket list, countdown, compare, for-you, embed widgets, trending hub, PWA install); email capture excluded by user.
- [Content coverage](content-coverage.md) — 24 city/destination guides, ALL full-9-language + live (incl. Jinju/Suncheon/Boseong/Mokpo/Gongju + 7 newly-localized regional cities + Korea Hiking topic guide); how to add more.
- [City images via Wikimedia](city-images-wikimedia.md) — city hero/OG photos now from Wikimedia Commons (accurate), not Unsplash; refresh via fetch-wikimedia-images.cjs.
- [Browse nav hierarchy](browse-nav-hierarchy.md) — top-left home banner on every SEO page + Explore tiles → 7 category hubs → page drill-down (buildHub/buildBrowseHubs).
- [Mobile framework](mobile-framework.md) — Toss-style bottom tab bar + mobile-first CSS on SEO pages (seo.css v9) + hub/info hand-pages (hub-styles v10); dispatch verticals excluded.
- [Webapp audit backlog](webapp-audit-backlog.md) — 2026-06 multi-agent audit: 10 high-value fixes shipped (font perf, localized links, a11y, hub hreflang, Andong/Yeosu+Daejeon content, card emojis); medium backlog remains to continue autonomously.
- [PC scroll perf](scroll-perf-pc.md) — wheel jank root causes: non-passive wheel listener over full-screen hero map + fixed-header backdrop-blur (not just global smooth-scroll); diagnostic checklist inside.
- [Dino webapp plan](dino-webapp-plan.md) — '공룡의 모든것' = DinoAtlas, DEPLOYED & LIVE at all-lifes.com/dino/ (en/ko/ja/de, **~1071 sitemap URLs**, 56종×전문섹션11개 + 40용어 용어집 + 24 Q&A + 153 비교페이지 + 크기비교기/퀴즈 SPA). ko/ja 전문섹션 번역완료; de전문섹션·질문21·용어40 번역은 세션한도로 잔여(재개법=메모). 코드 C:\Users\juksu\dino-webapp.
- [Plants webapp plan](plants-webapp-plan.md) — '식물의 모든 것'(PlantPedia): LIVE at all-lifes.com/plants/, **v4 글로벌 리디자인 · 1,017 URL/9개 언어** (비교 41쌍+허브, Wikimedia 갤러리 138장, 홈 식물찾기 퀴즈, 노력지수·장단점, Fraunces+다크모드, 상세 13섹션). de 신규문자열만 영어 폴백(워크플로우 재실행 필요). 소스 C:\Users\juksu\plants-webapp\; 재배포 `.\deploy.ps1 -SkipGit`.
- [Supplements webapp plan](supplements-webapp-plan.md) — '영양제의 모든것' = SupplementPlus, DEPLOYED LIVE at https://all-lifes.com/supplements/ — **v3 글로벌 리디자인 · 1,008 URLs** (모던 디자인시스템+다크모드, Wikimedia 실사 30장+출처, 성분페이지 15섹션: 이미지히어로·퀵팩트·핵심결론·누구에게·고르는법+약물상호작용+오해와사실, 435 combos verdict-hero, /picks/ 추천 컬렉션 3종, en/ko). Repo C:\Users\juksu\supplements-webapp\ (deploy-supplements.sh). Plan: C:\Users\juksu\supplements-webapp-plan.md.
- [App redesign + detail l10n](app-redesign-and-detail-l10n.md) — core-surface CSS redesign + homepage AdSense off + 9-language detail-panel content (detail-l10n.<lang>.js) + localized price ranges; MERGED to main and live. Hub pages (festivals/seasons/etc.) tone-unified too (hub-styles?v=9, :root untouched so SEO unaffected) + mobile drawer overflow fixed.

## 異붽? ?댁떇??硫붾え由?(湲곗〈 lucky-webapp ?쇱옱遺?
- [KoreaPlus 愿묎퀬 ?섏씡??(ad-monetization.md) ??AdSense, AliExpress, Agoda 愿묎퀬 ?먮룞 ?곸슜 硫붿빱?덉쬁
- [KoreaPlus 諛고룷 諛⑹떇](deploy-pipeline.md) (湲곗〈 koreaplus-deploy.md) ??deploy-to-guide.ps1 諛?Lightsail ?꾩넚 ?쒗??- [KoreaPlus ?몃옒??10? ?덈쾭](growth-top10.md) ???쇰꼸怨꾩륫 諛?IndexNow cron, 30/60/90 ?ㅽ뻾?쒖꽌
- [KoreaPlus K酉고떚 ?띻린??20](kbeauty-groundbreaking20.md) ??PWA, AI?몃윭?ㅽ듃?쇰뱶 ??kbeauty.js 援ъ꽦
- [KoreaPlus K酉고떚 踰꾪떚而?(kbeauty-vertical.md) ??1003 URL 肄섑뀗痢??쇱씠釉뚮윭由?諛?留덉뒪?곗깮?깃린 ?ㅽ럺
- [KoreaPlus Kpop ?덈툕 UX](kpop-hub-ux.md) ??/kpop ?낅┰梨꾨꼸 諛?UX 寃곗젙?ы빆
- [KoreaPlus Kpop UI/UX 16](kpop-uiux16.md) ??紐⑤컮???꾪꽣?덉씪 諛??곗튂?寃?媛쒖꽑 湲곕줉
- [KoreaPlus Kpop 踰꾪떚而?(kpop-vertical.md) ??936媛?K-pop 梨꾨꼸 ?섏씠吏 鍮뚮뱶 援ъ“ 諛??щ윭洹?洹쒖튃
- [KoreaPlus ?몃옒???뺤옣 20](seo-expand20.md) ??紐⑤뱢??SEO ?꾪궎?띿쿂 諛?寃利앷쾶?댄듃
- [KoreaPlus ?쒕퉬??UX 20](service-ux20.md) ??prefetch, ?⑦럹?댁? 寃????shell 以묒븰?곸슜 ?ㅽ럺