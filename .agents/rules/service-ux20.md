---
trigger: model_decision
description: "Rule for koreaplus-webapp: service-ux20.md"
---
koreaplus-lifes.com 서비스/UX 개선 **20종**(2026-07-02, 멀티에이전트, 커밋 `1a59655`). 트래픽 콘텐츠가 아니라 **사용성·정보전달·신뢰·성능·접근성·AI서비스 품질**을 build-seo.cjs `shell()`·공용 모듈·`feature.css`에 중앙 적용 → **9~14개 언어 전 페이지 일괄 개선**. 사이트맵 1556/3407 유지. **17/20 클라이언트+빌드 라이브·검증 완료**, 3종(S14 챗·S17 view++·S20 /api/rum)은 워커 백엔드 필요.

**20종**: (탐색)S01 문서 prefetch(speculationrules)·S02 전페이지 Cmd/K 검색·S03 브레드크럼 시맨틱·S04 다음글 자동추천 / (개인화)S05 관심 재정렬·S06 언어 자동제안 배너·S07 이어여행 / (정보신뢰)S08 TL;DR 결정론요약·S09 실제 신선도·S10 인라인 SVG 차트 / (성능접근성)S11 px→rem+링크+focus·S12 렌더블로킹완화(**보류**-hub-styles 백색플래시 위험)·S19 ARIA 14언어+한글lang·S20 hreflang게이트+RUM / (AI)S13 GEO 텍스트트윈·S14 페이지챗 / (참여소셜)S15 선택인용·S16 미니퀴즈·S17 감정반응·S18 D-day+.ics.

**site-wide UX 아키텍처(신규 기능 추가 표준):**
- **STEP0 shell 훅**(build-seo.cjs shell() 833~): head에 `feature.css?v=1`, foot(kp-enhance.js 다음)에 `<script type=speculationrules>` + 신규 모듈 defer 로더, body에 `#kp-tldr`(hero직후, 빌드타임 정적 주입)·**`.kp-nextsteps`(단일 하단 통합 컨테이너, </article>직후·#kp-react앞)**. **신규 모듈은 modules/<name>.js 파일만 만들면 자동 로드**. `.kp-nextsteps`에 각 모듈이 `<section>` 하나 append(첫 모듈이 hidden 제거, 자체 border 금지). ARIA/한글 lang/reduced-motion은 shell에서 T[lang] 현지화.
- **STEP1 빌드타임 공용 JSON**(build-seo.cjs, OUT=repo root→배포 /guide/): `search-index.<lang>.json`(S02)·`related.json`(S04)·`page-summaries.json`(S08 TL;DR 해시캐시). 결정론 추출(**빌드타임 LLM 금지·환각0**). build-llms.cjs가 `llms-full.<lang>.txt` GEO 텍스트트윈(S13).
- **STEP2 클라이언트 모듈**(modules/*.js): IIFE+try/catch+중복가드+no-op. 14언어 STR 인라인, kp_lang=?lang||localStorage||navigator. 신규: readnext·highlight·microquiz(+l10n)·countdown·rum·ask; 재작성 search(Fuse제거·동적인덱스); 확장 foryou(S05/S07)·react(S17)·i18n(S06). **fetch 경로 주의**: 페이지가 `/guide/`+`<base href=/guide/>`라 데이터는 절대경로 `/guide/related.json`·`/guide/search-index.<lang>.json`으로(도메인루트 `/related.json`은 404).

**계약(엄수):** 광고 절대 비훼손(px→rem 광고 슬롯 px 화이트리스트)·과부하방지(above-fold 삽입 최대1·하단 단일 .kp-nextsteps)·확정UX 무간섭([[koreaplus-kpop-hub-ux]])·기존기능 비중복(kp-enhance·PWA·공유카드·bcHtml 이미 렌더)·소셜프루프/카운트는 KV 실측만·신선도 실제 수정시각.

**배포:** deploy-to-guide.ps1의 `$MODULE_FILES`를 **`modules/*.js` 글롭으로 교체**(누락 수정, .cjs 빌드파일 제외)·`feature.css`·검색인덱스·related·llms를 번들 추가. 생성 데이터(search-index/related/page-summaries/llms)는 .gitignore. **이 PC는 Defender+세션부하로 파일 I/O가 느려** ~6천 파일 tar가 ~25분 걸림(코드 문제 아님·완주함). 도시/숙박 페이지 정규 URL은 `/guide/guide/...`(이중), 콘텐츠 페이지는 `/guide/...`(단일).

**워커(src/worker.ts, `wrangler deploy` OAuth 인증됨 jeybeeicon, 커밋 c9cf467):** **배포 완료 ver eabcc2f1**, CACHE_KV 재사용, 기존 라우트 회귀0. workers.dev 검증: `/api/rum`→204, `/api/view`→{views}, `/api/react`(기존)→정상. **클라는 워커를 `WORKER_URL='https://koreaplus-webapp.jeybeeicon.workers.dev'`로 호출**(메인도메인 /api/*는 WP로 감·워커 라우팅 안 됨). 주의: (1) rum.js 상대경로 버그 수정했으나 **라이브 반영은 다음 정적배포 시**. (2) react.js는 /api/view 미호출(조회수 소셜프루프 미연결·반응위젯은 동작). (3) **S13 크롤러 서빙은 워커에 `/guide/*` 라우트 미등록이라 비활성**(정적 llms-full.<lang>.txt는 직접 접근 가능). (4) **S14 ask.js 게이트 OFF**(window.KP_ASK_ENABLED=false) — 켜면 LLM 지속비용(일일상한 2000), 명시적 opt-in 필요.

⚠️ **보안**: git remote URL에 GitHub 토큰 평문 노출(.git/config) — 폐기·credential helper 권고(미조치).

관련: [[koreaplus-seo-expand20]] [[koreaplus-kpop-hub-ux]] [[koreaplus-deploy]] [[koreaplus-ad-monetization]]
