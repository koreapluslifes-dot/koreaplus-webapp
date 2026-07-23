---
trigger: model_decision
description: "Rule for koreaplus-webapp: kpop-hub-ux.md"
---
koreaplus의 K-pop 허브는 `koreaplus-lifes.com/kpop`(루트, `kpop-standalone.html`, `<base href="/guide/">`로 자산은 /guide/에서 로드)와 `/guide/kpop.html`(`kpop.html`)이며 `modules/kpop.js`가 렌더한다. 아래는 사용자가 명시적으로 요청한 방향이라 임의로 되돌리지 말 것.

- **독립 채널**: 홈배너(로고)·브레드크럼·"K-Pop Hub" 링크는 가이드 홈이 아니라 **`/kpop`**(루트 상대경로라 base 무시)으로 간다. SEO 생성 페이지는 `shell()`의 `homeHref` 파라미터로, `buildKpopHistory`가 `homeHref:'/kpop'` + 브레드크럼 루트 `/kpop` 전달. 비-K-pop 페이지는 그대로 `index.html`.
- **내부 링크 중심(외부 이탈 최소화)**: 아티스트 모달은 "📖 전체 프로필"(→ `(<lang>/)kpop/<id>-profile.html`)을 주 동작으로, Spotify/YouTube는 작은 "듣기" 보조행으로 강등. 차트 행은 **로스터 아티스트→내부 프로필**(같은 탭), 비로스터만 외부 Apple Music. `rosterIdFor()`/`profileUrl()` 헬퍼.
- **과부하 방지**: 기본 "All" 탭은 섹션별 미리보기(CSS `.kp-cap` + "전체 보기" 드릴다운). 신규 **"✨ For You" 탭**(`#kpop-foryou`, `data-noall`→All에선 숨김, hasAttribute로 판정)에 인터랙티브 기능을 묶어 All을 깔끔하게 유지. 상시 노출은 컴팩트 펄스배너(`#kpop-pulse-slot`)+검색런처(`#kpop-search-slot`)뿐.
- **타분야 상위 웹앱 기능 10종** = `modules/kpop-plus.js`(kpop.js 뒤 로드, 자족형 IIFE들): 펄스배너(Booking.com)·⌘K검색(Linear)·데일리퀴즈(Duolingo/Wordle)·최애대결투표(Twitter)·추천(Netflix)·최근본(이커머스)·컴백/생일리마인더+ICS(GoogleCal)·그룹비교(Versus)·스탠결산(Spotify Wrapped)·업적뱃지(Duolingo). `window.KPOP_ROSTER/KPOP_ENRICH` + 공유 localStorage(`kp_kpop_follow`·`kp_kpop_since`) 읽음. 훅: `window.kpOpenArtist(id)`, window 이벤트 `kp:view`/`kp:follows`. 9개 언어 내장.
- **최신 편의 기능 10종** = `modules/kpop-ux.js`(kpop-plus.js 뒤 로드, 자족형 IIFE들, 전역 동작이라 HTML 구조 변경 없음): 스크롤진행바·맨위로FAB·자동숨김헤더·탭스와이프(모바일)·당겨새로고침·햅틱(navigator.vibrate)·스크롤리빌(IntersectionObserver)·외관설정(라이트/다크 `kp_theme` + 글자크기 `kp_fontsize` font-sm/md/lg)·오프라인인디케이터·슬라이딩탭인디케이터. reduced-motion 안전, CSS var 팔레트, 9개 언어. FAB 슬롯: 맨위로 right:16/bottom:16, 외관 right:16/bottom:74.
- **인페이지 유튜브 미니플레이어** = `modules/kpop-player.js`(`window.kpPlay(query,{title,artist,channelId})`, `?v=2`). 차트행/포디움/모달의 음악 클릭이 Apple Music으로 이탈하지 않고 좌하단 미니플레이어에서 재생(`data-play`/`data-pchannel` + kpop.js boot의 document 위임 클릭). **재생 방식(중요)**: `listType=search` 임베드는 **폐기되어 "동영상을 볼 수 없습니다" 에러** → 워커 무키 라우트 **`/api/kpop/yt?q=`**(src/router.ts, YouTube 검색HTML에서 첫 `"videoId"` 스크레이프, KV 24h 캐시)로 videoId를 받아 **`embed/<videoId>`로 ID 임베드**(확실 재생, K-pop·비K-pop 무관). 폴백: videoId 없으면 채널 업로드 임베드(roster) → 에러문구. "공식 채널" 버튼·"YouTube에서 열기" 링크 유지. 워커 배포: `npx wrangler deploy`(jeybeeicon 인증). 차트행 kp-playable(▶ 표식, 앨범아트 52px). 9개 언어.
- **차트 포디움(1·2·3위)**: loadCharts가 podium=rows[0:3]/list=rows[3:30]. kp-cap(All 축약)이 `.kp-podium`을 숨기던 버그 수정 → 포디움은 항상 노출(헤드라인). (차트가 비K-pop 곡을 보이는 건 iTunes RSS 스토어 이슈 — 별개.)
- 허브 nav에서 "여행 계획" CTA 제거(`kp-pnav-cta`) — 독립채널. 파비콘 `icons/kpop.svg`(마이크+kp그라데이션, ICON_FILES 등재).
- **헤더 여행요소 전부 제거**(되돌리지 말 것): kpop.html/standalone의 `hub-nav-links`(kp-pnav: Explore·Guides·Where to Go 여행 nav) 통째 삭제 → 헤더는 로고(→/kpop)+header.js 주입(검색⌘K·테마·언어)만. "내 여행"은 `modules/mytrip.js` `mountHeaderButton()`에 `body.kpop-page`면 return 가드 추가로 제거(공유 파일이라 다른 페이지엔 유지).
- **티커 클릭 연결**: `modules/kpop.js` renderTicker가 항목을 `<a>`로 — 카운트다운은 `data-tk-artist`(클릭 시 `window.kpOpenArtist` 모달, href=현지화 프로필), 차트는 `data-tk-play`(클릭 시 `window.kpPlay` 인페이지 재생). boot에 위임 클릭 핸들러. CSS `a.tk-item` cursor/hover. kpop.js `?v=6`, kpop.css `?v=6`, sw `kp-v56`.
- **콘텐츠 페이지 홈배너**: shell()에 `brand` 파라미터 추가 → K-pop 페이지는 좌상단 로고가 "🎤 Korea<span>Plus</span>"(→/kpop). buildKpopHistory/buildKpopBrowse가 `brand:'🎤 ...'` 전달.
- **카테고리 둘러보기 디렉터리** = `buildKpopBrowse(lang)` → `(<lang>/)kpop/browse.html`(9개 언어). 6개 카테고리(KPOP_CAT: artists/basics/legends/history/companies/global, KPOP_CAT_SLUGS 매핑; 프로필은 KPOP_ROSTER로 걸/보이/솔로 세분화) → 104개 전 슬러그 링크로 타고 들어가 전부 도달. 허브 히어로 CTA(`#kp-browse-cta`, 인라인 9언어 현지화 + href 로컬화)·각 콘텐츠 "더 보기"에 둘러보기 링크. build-seo.cjs가 KPOP_ROSTER를 require. 사이트맵 등록(main+kpop). seo.css `?v=6`, kpop.css `?v=4`, sw `kp-v53`.
- 캐시버스트 갱신: kpop.js `?v=5`, kpop.css `?v=3`, kpop-player.js `?v=1`. sw PRECACHE에 kpop-player.js, deploy whitelist에 modules/kpop-player.js.
- **9개 언어 QA 완료**: kpop-plus.js + kpop-ux.js의 8개 비영어 i18n 원어민 검토 후 38건 수정(ja Stan Wrapped 推し活まとめ, zh 本命, fr tu/vous·생일, de Design/das Fandom, pt staneiam, es 문법 등). ko/id 거의 클린.
- **인코딩 주의**: 워크플로 에이전트가 JS를 HTML 엔티티 인코딩(`&lt;`·`&amp;&amp;`)해 반환 → 조립 시 "엔티티만으로 된 문자열 리터럴(=esc맵 출력값)"은 보호하고 연산자만 디코드해야 함(esc 함수 깨짐 방지).
- 캐시버스트: kpop.js `?v=4`, kpop-plus.js `?v=1`, kpop-ux.js `?v=1`, kpop.css `?v=2`, sw `kp-v51`(PRECACHE에 kpop-plus.js·kpop-ux.js 등재). 배포 whitelist(MODULE_FILES)에 두 모듈, 루트 `/kpop/index.html`은 deploy-to-guide.ps1이 kpop-standalone.html에서 배포. 빌드 워크플로는 burst rate-limit 회피 위해 배치 3개씩.

관련: [[koreaplus-kpop-vertical]] [[koreaplus-deploy]] [[lucky-crossdomain-x10]](lucky의 동종 작업)
