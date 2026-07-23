---
trigger: model_decision
description: "Rule for koreaplus-webapp: dino-webapp-plan.md"
---
**DinoAtlas** = all-lifes.com/dino/ 공룡 백과 웹앱. **배포 완료 & LIVE.** 코드: `C:\Users\juksu\dino-webapp` (git repo alllifes77-hue/dino-webapp, main). 기획서: `C:\Users\juksu\dino-webapp-plan.md`.

**아키텍처 (hair "HairBase" 패턴 이식):** all-lifes.com = Lightsail WordPress(3.36.235.171). 워커 `dino-multilang` (CF zone a60bafdfa20ba9a6e46b6063667b7968)가 `/{lang}/dino/*` 전부 SSR, 정적 SPA는 WordPress가 `/dino/` 서빙. 배포 = `.\deploy-all.ps1 -SkipGit` (deploy.config.ps1은 hair와 공유 시크릿, gitignored). **CF 캐시 purge 권한은 토큰에 없음** → 사이트맵 등 6h TTL 자동갱신.

**핵심 파일:** `worker-dino.js`(i18n-native, 3개 data region 마커), `dinos.seed.json`(56종 + t[lang] 번역 오버레이 + 전문섹션), `chrome.i18n.json`(UI문자열 en/ko/ja/de), `questions.i18n.json`(24개 Q&A), `glossary.i18n.json`(40 용어), `build-dino-data.cjs`(3 region 굽기 + dino-data.js emit), `qa-gate.mjs`(렌더 게이트).

**i18n 규율 (1000 URL 확장 방식):** `LAUNCH_LANGS=Object.keys(CHROME)`. `C(lang,key)`는 키 단위 en 폴백. 종/질문/용어 URL은 번역 존재할 때만 그 언어 사이트맵/hreflang에 포함(liveness gating) → thin content 0. 허브/비교는 chrome만 번역하면 라이브(템플릿+데이터+라틴명). **전문섹션(classification/paleoecology/behavior/growth/significance)은 `localOnly()`로 게이팅 — 번역 안 된 언어엔 영어 노출 안 함.** 비교페이지는 famous 18종 전조합(153개)=URL 배수 엔진. 사이트맵 = index + `/dino-sitemap-{lang}.xml`.

**현재 라이브 상태 (~1071 URL):** EN 315 URL(56종×11섹션 전문화 + 40용어 용어집 + 24 Q&A + 153비교 + 허브). ko/ja/de 252씩. **KO/JA = 종 전문섹션까지 번역 완료. DE = 기본 산문만(전문섹션 게이팅됨). 신규 질문21·용어집40은 아직 en 전용(ko/ja/de에선 404 게이팅).**

**남은 번역작업 (계정 세션한도로 중단, 8:30pm KST 리셋 후):** ① DE 종 전문섹션 ② 질문 21×(ko/ja/de) ③ 용어집 40×(ko/ja/de). **재개:** `Workflow({scriptPath:"C:\tmp\dino-translate2-wf.js", resumeFromRunId:"wf_8be6bf83-0ff"})` (완료분 캐시, 실패분만 재실행) → 결과를 `scratchpad/merge-pass2.cjs <output>`로 병합 → `node build-dino-data.cjs && node qa-gate.mjs` → `.\deploy-all.ps1 -SkipGit`. 완료 시 각 언어 +61 URL → 총 ~1300+. 병합/생성 스크립트는 세션 scratchpad에 있음(gen-translate2-wf.cjs, merge-pass2.cjs, merge-content.cjs, merge-translations.cjs).

**디자인/이미지 (2026-07-06 재설계):** 세련된 매거진형 재설계 완료 — 워커 페이지는 위키미디어 실사 **포토 히어로**(그라데이션 오버레이+제목) + **이미지 카드**(썸네일), 리파인된 타이포/컬러/여백, 비교페이지 vs 이미지, OG=실사 이미지. SPA도 이미지 타일+퀴즈결과 이미지. **56종 전부 위키미디어 이미지+저작자·라이선스 저장**(fetch-wikimedia-images.cjs, 모두 CC/PD, 크레딧 표기 필수 준수). 홈에 **Record holders**(최중량/최장/최고/최소/최고령) 계산 섹션. 이미지는 upload.wikimedia.org 핫링크(트래픽 커지면 캐시/프록시 고려). CSS는 worker-dino.js의 const CSS(scratchpad/dino.css가 소스), 수정 시 octal escape(\NNNN) 금지—리터럴 문자 사용.

**광고:** 홈 제외 전 페이지 상단+하단 AdSense 2개(허브 포함), 앱 홈·SEO 홈은 0. 상하단 같은 슬롯ID(hair 재사용) 공유 — 전용 유닛 만들면 ADS_SLOT 교체 권장. **파비콘 완료**(사우루스 실루엣, forest-green squircle; favicon.svg+ico+png세트, make-favicon.py는 scratchpad). 

**미결/TODO:** AdSense 상/하단 전용 슬롯 발급, og png 정적 폴백(현재 /dino-og 라이브 생성), AFF_TAG(Amazon), 서버 robots.txt에 dino-sitemap 추가(README §4). 확장은 dinos.seed.json에 종 추가→build. 지도 만들면 non-passive wheel 금지([[scroll-perf-pc]]).

**Why/How:** 다음 세션이 재파악 없이 번역 마무리+확장 가능하도록. 공룡 앱 작업 시 ARCHITECTURE.md 먼저 읽고 데이터는 소스 JSON 수정→build-dino-data.cjs→qa-gate→deploy. [[content-coverage]] [[mobile-framework]] 참고.
