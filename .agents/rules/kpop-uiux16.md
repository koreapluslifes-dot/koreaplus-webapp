---
trigger: model_decision
description: "Rule for koreaplus-webapp: kpop-uiux16.md"
---
koreaplus-lifes.com **K-pop 허브 UI/UX 16종**(2026-07-03, 설계+구현 하네스팀). 스코프: kpop.html·kpop-standalone.html·kpop.css(386→506줄)·modules/kpop.js·kpop-plus.js·kpop-player.js·kpop-ux.js만 — **동시 편집 중이던 다른 세션의 홈·네비·shell 표면(index/hub-styles/seo.css/build-seo/kp-enhance)은 세션 분담 합의로 무접촉**(사용자 선택: "K-pop 버티컬만 이 세션").

**16종**: KP-01 라이트모드 AA 대비(듀얼토큰 #d6155f/#7c3aed/#a97a00 + 조작버튼 전용 `--kp-grad-btn`) · KP-02 필터 활성칩 ::before 시프트 제거 · KP-03 All뷰 캡 min-height 정합(유령공백) · KP-04 모바일 필터 1줄 스냅레일(스티키 160→65px)+활성칩 scrollIntoView 센터링 · KP-05 미니플레이어/토스트 bottom에 var(--mnav-h)+safe-area(탭바 겹침 해소)+재생중 FAB 숨김(body.kp-playing) · KP-06 터치타깃 44px(@media hover:none 블록) · KP-07 **검색 오연결 수정** — 하단 검색탭·⌘K를 kpop-plus 캡처 리스너로 가로채 아티스트 검색만 오픈(여행검색 오픈 버그·이중 오픈 제거, 금지파일 무수정) · KP-08 모바일 히어로 압축(285px)+≥360px 포디움 3열 · KP-09 PC(≥900px) Charts탭 차트 grid-auto-flow:column 3열 신문식 · KP-10 main 1100→1240px+리드카드 span2(.kpop-empty 가드) · KP-11 타이포 `--kp-fs-*` rem 스케일(9px 근절·11px 하한 → theme.css 글자크기 3단 복원) · KP-12 재생중 행 .is-playing+EQ(kpop-player가 [data-play] 역추적) · KP-13 차트 보합 = 배지(.kp-delta-eq)+시각스탬프+새로고침+aria-busy 펄스 · KP-14 티커 .tk-dup(aria-hidden·reduced-motion/hover:none 숨김·focus 일시정지) · KP-15 모달 불투명+overscroll-behavior:contain · KP-16 언팔로우 Undo 토스트+풀투리프레시 kux_tab 탭 보존.

**주의/함정**: (1) topads.js가 런타임 `<style>`로 `.kp-ad-tag{font-size:9px}` 주입(문서순서로 링크CSS를 이김) → kpop.css `.kpop-page .kp-ad-tag` 구체성 오버라이드로 해결(공유 모듈 무수정). (2) **동시 세션의 git add 스윕**: k-뷰티 세션 커밋 `a9aa25f`가 이 작업의 in-flight 파일들을 자기 커밋에 쓸어담음 — 내용은 안전, 마무리는 `d9f5b42`(HTML 캐시버스트 v7/v2/v3+1240px)·sw `kp-v67`(0fd089f). 다세션 레포에서 커밋 귀속은 신뢰 불가, 파일 내용 기준으로 확인할 것. (3) 검증: 로컬 프리뷰(launch.json `kpop-preview` :8893, http-server 레포루트)에서 preview_eval로 computed 확인 — 스크린샷은 티커 마퀴 때문에 타임아웃, eval/inspect가 정답. hover:none 규칙은 데스크톱 프리뷰에서 미적용이 정상(실기기용).

관련: [[koreaplus-kpop-hub-ux]](확정UX — 준수함) [[koreaplus-deploy]] [[koreaplus-service-ux20]]
