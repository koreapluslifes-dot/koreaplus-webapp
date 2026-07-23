---
trigger: model_decision
description: "Rule for koreaplus-webapp: kbeauty-groundbreaking20.md"
---
koreaplus-lifes.com **K-Beauty 허브 "핵심+획기적 20종" 전부 완료·라이브**(사용자 요청: 획기적 요소 20 선정→즉시 적용→전 언어개선). 스펙 전문: 세션 tasks/kb_gb20.json. 14개 언어, 사이트맵 2055(kbeauty-sitemap.xml).

**전달(배치별, 모두 라이브·커밋):**
- Batch 0~2 (앞선 세션): 공유런타임 **kb/kb.js**(shell()에서 1줄 `<script defer src=/guide/kb/kb.js?v=JS_VER>`로 전 2050 페이지 주입) — 검색(Fuse+kb-search.json)·14언어 스위처·프로필콜아웃·읽어주기TTS·TOC/진행바·저장/최근·a11y툴바·프린트. 이게 라이브러리 사이트와이드 레버.
- Batch 3 허브지능(modules/kbeauty.js, 신규 👤'you' 카테고리): #4 INCI 분석기(runDecoder→성분바 hydration/soothing/actives/barrier+플래그+포지션+판정) · #9 루틴오디터 · #10 스마트매처(프로필+예산→충돌없는 순서정렬 루틴) · #16 스킨저니(체크인+스트릭+14일차트) · #18 K뷰티랩드(공유카드).
- Batch 4 PWA(initPWAExtras() @ boot): #12 루틴리마인더 .ics(VCALENDAR AM/PM RRULE+VALARM) · #13 Web Share Target(manifest share_target GET→?share=→INCI 분석기 자동실행) · #17 첫방문 온보딩(스킨타입 픽, kb_onboarded 1회).
- Batch 5 데이터비즈+머신트러스트(생성기 리빌드+워커): #11 **성분 별자리**(build-kbeauty-pages.cjs constellationSVG() — pairsWith/avoidWith→방사형 정적SVG, 노드=내부링크, 27/27) · #14 **PAA**(shell()이 39개 ASK뱅크를 h1/title 토큰매칭→'People also ask' 아코디언+FAQPage 병합(단일노드), 품질게이트 2+매칭, 396페이지) · #19 **AI 트러스트피드**(build-llms.cjs → answer-ledger.json 트러스트트리플 {claim,confidenceTier high/emerging/mixed/low,reviewedAt,sources[]} 22개; 워커 라우트 **/kbeauty/answer-ledger.json** JSON서빙 x-served-by:kbeauty-trust-feed).

**핵심 파일/버전:** kbeauty.js **v27**, kb.css **CSS_VER=3**(.kb-constel/.kb-paa), sw **kp-v66**, manifest 14언어. 커밋 352b5eb(B3)·04537f4(B4)·a9aa25f(B5, kb/ 1862파일)·f33204e(IndexNow에 kbeauty-sitemap 추가→6999 URL 제출).

**배포:** 라이브러리 2050파일은 foreground `tar cf`(무압축)→scp→서버 `tar xf` + chown bitnami:daemon + find chmod(dir755/file644). 워커는 `npx wrangler deploy` 별도. [[koreaplus-deploy]] 참고. 백그라운드 tar는 파일경합으로 잘릴 수 있으니 동기실행.

**주의:** 성분 슬러그는 짧은 id(`hyaluronic`, `niacinamide`), `hyaluronic-acid` 아님. 라이브러리는 라이트테마·영문슬러그(14언어 콘텐츠는 section-15 클러스터 별도). 앱 UX 명시결정([[lucky-app-ux-decisions]] 유형)은 되돌리지 말 것. 광고=홈제외 전페이지 AdSense([[koreaplus-ad-monetization]]). 무광고 게이트 adsOk>=300자 유지. 의료주장·날조 스키마 금지(구조기능 표현만).
