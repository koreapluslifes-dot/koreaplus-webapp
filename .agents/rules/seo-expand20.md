---
trigger: model_decision
description: "Rule for koreaplus-webapp: seo-expand20.md"
---
koreaplus-lifes.com 트래픽 확장 **20종 전부 완료·라이브**(2026-06-30, 멀티에이전트 하네스팀, 커밋 `cc05af4`). 사이트맵 **2,821 → 5,926(+3,105)**: main 1862→2519, kpop 959→3407. K-beauty 중복 회피(다른 세션이 같은 날 kbeauty-adv 20 완료).

**20종**: K-pop 콘텐츠 8(별자리 K01·띠 K02·생일월 K03 아이돌, 기획사별 K04, 그룹비교 K05, 용어 A-Z 사전 K06, 응원봉 K07, **멤버 프로필 191명 K11**) · 여행 5(음식사전+11 T02, 도시숙박 15도시 T03, 계절×도시 벚꽃/단풍 T04, 월별축제 T01, KTX이동 T05) · AEO 3(MusicGroup schema K08, HowTo G01, 비교 ItemList G02) · 성장도구 2(아이돌 생일매처 K09, 여행예산 변환기 T07) · 성능/기술SEO 2(검증게이트 X01, 성능 P01). 전부 기존 데이터(kpop-enrich 191멤버 생일·ROSTER 34기획사) 재사용·결정론·날조0·9언어.

**모듈형 SEO 콘텐츠 아키텍처(신규 콘텐츠 추가 표준):** 각 콘텐츠형 = `modules/seo-<name>.cjs` CommonJS 팩토리 `module.exports=function(ctx){...return{buildX,urls()}}`. urls()는 `{lang,url}` 배열. build-seo.cjs에서 `const CTX={shell,writePage,BASEP,L10N,LOCALES,esc,slug,...,ROSTER,ENRICH,MONTHS,SEASONS4,CITY_L10N,COMPARES,FOOD,COST_INDEX,TODAY,ld,derive}`(약 2629행) 주입 + 마커 `=== GENERATED CONTENT MODULES ===`(약 2641)에서 `require + __out.{main|kpop}.push(...X.urls())` 1줄씩 + 단일 sitemap spread. **모듈별 독립 out 키 → 병렬구현·머지충돌0.** 공용: `modules/seo-ld.cjs`(itemListLD/breadcrumbLD/faqLD/howToLD/compareLD/musicGroupLD/personLD/eventLD/definedTermSetLD), `modules/seo-derive.cjs`(signOf/cnZodiacOf/monthOf 순수함수). 신규 데이터: korean-dishes.json·korea-stay-areas.json·korea-festivals.json·korea-routes.json. ENRICH 출처는 `kpop-enrich.js`(vm load), kpop-enrich.json/kpop-ids*.json은 orphan(미사용).

**P01 성능**: hero preload(LCP)·AdSense ins min-height(CLS)·AdSense push를 requestIdleCallback(폴백 2200ms)로 감쌈(스크립트·ins·노출 유지=수익영향0)·IndexNow가 kpop-sitemap 합산(제출 1488→4954)·sw `kp-v64`. lastmod mtime은 사이트맵 유효성 위험으로 skip.

**X01 검증게이트** `scripts/verify-seo.cjs` + `.seo-baseline.json`: 사이트맵 증가 assert·hreflang 대칭·중복/orphan·언어별 카운트. 빌드후 수동/배포 실행. **남은 권고(사전 이슈, 내 작업 아님)**: 959 URL이 sitemap.xml·kpop-sitemap.xml 양쪽 중복 등재 + sitemap.xml 내 4건 중복(andong/yeosu things-to-do·best-time, /guide/guide/ 경로) → dedup 권고.

**배포 운영 주의**: deploy-to-guide.ps1에 **sitemap 기반 루트 생성페이지 수집 + tools/embed/food 디렉터리** 추가(영어 루트판도 갱신 반영). 대량 배포 시 tar 추출 직후 **Lightsail ssh 연쇄 호출이 멈출 수 있음**(콘텐츠·사이트맵·권한은 먼저 반영 완료됨) → 멈추면 배포 중지 후 `node indexnow-submit.cjs`만 따로 실행(멱등, HTTP). 생성 SEO 출력물은 .gitignore.

관련: [[koreaplus-kpop-vertical]] [[koreaplus-kbeauty-vertical]] [[koreaplus-deploy]] [[koreaplus-growth-top10]]
