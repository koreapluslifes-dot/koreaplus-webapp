---
trigger: model_decision
description: "Rule for koreaplus-webapp: ad-monetization.md"
---
koreaplus-webapp(`build-seo.cjs`)가 만드는 모든 SEO 페이지는 광고 3종이 **shell()/injectToc 공통 경로에 중앙화**돼 있어, 빌더가 따로 신경 쓰지 않아도 현재·미래 모든 페이지에 자동으로 붙는다.

- **AdSense 배너 1개(상단만)** — `shell()`에 정적 하드코딩(hero 직후). client `ca-pub-1378943893051810`. **2026-07-02 정책 변경: 페이지당 AdSense 배너 1개로 통일 — 인아티클(mid) 유닛 제거**(injectToc는 이제 섹션ID/TOC만, 광고 주입 안 함). 사용자 요청("페이지당 AdSense 배너 1 + AliExpress 1").
- **AliExpress 머치 스트립 1개** — `shell()`의 `#kp-topads`(data-ads="off" → AdSense 중복 안 띄우고 스트립만), `modules/topads.js`가 Worker 프록시로 지오 현지화 렌더, 상품/키 없으면 self-remove.
- **홈은 광고 0** — `index.html`(가이드 홈, `/guide/`)은 kp-topads·topads.js 제거해 광고 없음. 커밋 51e479d. 라이브 검증: 전 비홈 K-pop·여행 페이지 AdSense=1·mid=0·AliExpress=1, 홈 0.
- **Agoda 어필리에이트 블록** — 대부분 빌더가 `affBlock()`/`affHtml()`를 본문에 직접 호출. **누락 방지 세이프티넷**: `shell()`이 `!/class="seo-aff"/.test(body)`면 기본 Agoda 블록을 append → category/index/미래 빌더 전부 자동 보장, 중복 없음.

**미래 자동화:** 중앙 shell()이 상단 AdSense 배너 + AliExpress 스트립을 전 생성 페이지에 자동 주입하므로, 앞으로 생성되는 페이지도 별도 작업 없이 1+1 자동 세팅(홈만 제외).

**K-뷰티는 별개:** kbeauty.html/`/guide/kb` 라이브러리는 **다른 세션이 build-kbeauty-pages.cjs로 관리**하며 자체 광고 메커니즘(`modules/kbeauty.js` #kb-topads, `AFFILIATE_ON=false`로 제휴 보류·AdSense 우선, 뷰티 제휴는 YesStyle/Amazon/쿠팡·AliExpress 아님). build-seo.cjs 광고 정책과 무관 — 건드리지 말 것.

관련: [[koreaplus-kpop-vertical]] [[koreaplus-deploy]] [[koreaplus-growth-top10]]
