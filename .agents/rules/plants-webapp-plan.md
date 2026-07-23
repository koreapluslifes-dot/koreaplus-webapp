---
trigger: model_decision
description: "Rule for koreaplus-webapp: plants-webapp-plan.md"
---
2026-07-06 기획: all-lifes.com에 추가할 '식물의 모든 것' 웹앱. 기획서 `C:\Users\juksu\plants-webapp-plan.md`. 식물×인텐트×9개 언어 프로그래매틱 SEO, KoreaPlus 인프라([[mobile-framework]], [[cross-domain-growth-elements]], [[city-images-wikimedia]] 패턴) 재사용. 데이터 Wikidata+Wikimedia+ASPCA.

2026-07-06 Phase 0 구현 완료 (Opus로 전환 후 이 세션에서 직접 구현): `C:\Users\juksu\plants-webapp\` 신규 폴더 + 로컬 git repo(remote 미설정). 20종 실내식물 × EN/KO = 62 정적 페이지 빌드·검증 완료.
- `data/plants.json`(구조화 케어+ASPCA 독성 enum), `data/images.json`(Wikimedia 20/20 저작자표기), `lang/{en,ko}.js`(UI+enum+산문 템플릿, 언어별 어순), `plants.css`(라이트 그린 자체완결), `build-plants.cjs`(생성기), `fetch-wikimedia-images.cjs`·`fetch-wikidata.cjs`, `deploy.ps1`(→ /opt/bitnami/wordpress/plants).
- 핵심 차별화 = **케어 프로필 아이콘 카드**(물/빛/온도/습도/흙/난이도/크기/독성) — 피처드스니펫/AI오버뷰 타깃. Article+FAQPage+HowTo+Breadcrumb JSON-LD, 전체 hreflang, sitemap 포함. 홈·카테고리에 브라우즈 필터 칩(반려동물안전/쉬움/음지/트레일링/다육) + 검색.

애드센스 레이아웃(2026-07-09 수정 완료): 홈 제외 모든 페이지(상세·카테고리·가이드·비교)에 상단 1개(히어로 직후)+최하단 1개, 홈은 중간광고 1개. **광고 미출력 원인은 push 누락이었음** — `<ins>`만 있고 `(adsbygoogle=[]).push({})`가 없어 요청 자체가 안 나감. 수정: ① 모든 ins에 `data-ad-slot="4521899200"`(pet-webapp·KoreaPlus가 이 도메인에서 실서빙 중인 반응형 유닛) + min-height 250px ② footer에 idle-지연 활성화 스크립트(ins당 push 1회, 이미 채워진 유닛 스킵). 브라우저 검증: 전 ins `data-adsbygoogle-status="done"`. pub-id ca-pub-1378943893051810, all-lifes.com ads.txt 존재 확인.

2026-07-09 v4 글로벌 확장(배포 완료, **1,017 URL**): ① 디자인 전면 리뉴얼 — Fraunces 세리프 헤딩 + 웜페이퍼 팔레트 + **자동 다크모드**(prefers-color-scheme) + 스티키 목차 칩바 + 넘버링 번식 스텝 + 호버줌 카드 + 헤더 잎 로고(CSS v4 재작성, 클래스명 유지). ② 심도 요소 — 케어 노력 지수 미터(effortScore 0-100 파생), 데이터 기반 장단점(prosConsKeys), Wikimedia 갤러리 48종/138장(fetch-wikimedia-gallery.cjs, 저작자표기). ③ 추천 — 홈 3문항 식물 찾기 퀴즈(클라이언트, 언어별). ④ **비교 버티컬** — /compare/{a}-vs-{b}/ 41쌍+허브(COMPARE_PAIRS in build), 나란히 표+차이 하이라이트+데이터 기반 판정문+FAQ 스키마. ⑤ 아키텍처 — **언어팩 로드시 en 딥머지**(build-plants.cjs): 미번역 키는 영어 폴백이라 신규 문자열이 번역 전에도 안전 출고.
- **잔여**: de(독일어) 번역 에이전트가 세션 한도로 실패 — de는 기존 번역+신규 섹션 영어 폴백 상태(식물명은 독일어 보존). 한도 리셋 후 plantpedia-i18n 워크플로우 재실행하면 채워짐(병합 스크립트 패턴: names.json 기존값 보존 + NAME_FIXES 맵). ja 'fiddle-leaf-fig'=カシワバゴムノキ 수정 유지 필요.

2026-07-06 콘텐츠 3배 확장(배포 완료): 상세 페이지 섹션 9→13개, EN 본문 ~550→~1,780단어(3배+). 신규 전부 데이터기반 템플릿이라 9개 언어 자동 적용: Quick Facts 패널·빛&배치(창방향)·물주기 심화·계절별 케어 캘린더(4계절 표)·분갈이·**단계별 번식 5스텝(실제 HowTo 스키마)**·병해충&예방·독성 심화(ASPCA agent→증상). FAQ 5→9개. 데이터엔 growthRate만 추가(toxClass·분갈이주기는 기존 데이터에서 파생). 언어팩 문자열 220→289개, 7개 비en/ko는 workflow 재번역(en 폴백). CSS v2. URL은 여전히 639개.

2026-07-06 배포 완료 & LIVE: Phase 0(62 URL, en/ko)에 이어 **9개 언어 × 50종 = 639 URL로 확장 배포**(라이브 검증 완료, IndexNow 639 핑). [[pet-webapp]](/pet/)와 같은 Lightsail 박스(3.36.235.171)·같은 배포 패턴.

2026-07-06 확장 아키텍처(중요): **언어팩을 순수 데이터로 리팩터링**함 — lang/<code>.js는 문자열만(포맷 {token}), 보간 로직은 전부 build-plants.cjs(fmt/computeVars). 언어 추가 = 문자열 파일 추가(ALL_LANGS 배열에 코드 등록 + names.json). soil/fertilizer도 enum 토큰화. 공통명은 data/names.json(50종×9언어, en 폴백). 7개 비en/ko 언어팩은 **Workflow 병렬 번역**(plantpedia-i18n)으로 생성 → en 폴백 딥머지(~89% 커버리지). 커스텀 best-of 가이드 페이지(/guide/<slug>/) 8종 추가.
- **주의(다음 세션용)**: (1) deploy.ps1/config는 **반드시 ASCII 영문 주석**으로 — PowerShell 5.1이 BOM없는 UTF-8 한글 주석을 깨뜨림. (2) GitHub remote 미설정 — deploy는 `-SkipGit` 필요. (3) AdSense는 KoreaPlus pub-id 공유 — 콘솔에 사이트 등록 필요할 수 있음. (4) 프리뷰 스크린샷은 AdSense 403 폴링으로 타임아웃(환경 아티팩트). (5) 번역 언어팩 미번역 키(~11%)는 영어로 폴백 중 — 시간날 때 개선. ES 등 일부 prose가 이름 성(性)과 관사 불일치(예 "El Palmera") 가능 — 미세 결함.
- **1000 URL까지**: 식물 1종 = +9 URL. 현재 639 → **식물 ~40종만 더 추가하면 ~1000**(코드 변경 불필요, plants.json+names.json+이미지만). 방법은 README "Adding content" 참고.
- **다음(기획서 §8)**: Phase 2=도구(독성체커/물주기계산기/추천퀴즈). Phase 3=증상 진단. Phase 4=성장루프(트렌딩/시즌/PWA/비교/임베드).

**Why:** 다음 세션에서 Phase 1+를 이어가거나 재배포할 때 라이브 상태·배포 함정(ASCII/-SkipGit)을 알아야 함.
**How to apply:** 식물 웹앱 요청 시 `C:\Users\juksu\plants-webapp\README.md`와 기획서를 먼저 읽고 이어서 진행. 재배포는 `cd C:\Users\juksu\plants-webapp; .\deploy.ps1 -SkipGit`.
