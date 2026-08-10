---
trigger: model_decision
description: "K-pop 14-language rollout — what shipped, and the exact remaining work"
---

# K-pop 14언어 확장 — 인계 문서 (2026-08-10)

`/kpop` 채널을 9개 → **14개 언어**(ar·hi·ru·vi·th 추가)로 확장하고, 빌드타임 스냅샷 2종을
SEO 페이지에 연결한 작업의 현재 상태와 **남은 작업**이다.

## 지금 라이브인 것

- **kpop-sitemap.xml 3,407 → 약 4,879 URL** (신규 언어당 280페이지 × 5).
- 34개 아티스트 프로필(9언어)에 **커먼즈 실사진 + 저작자·라이선스 크레딧 + 구조화 디스코그래피
  테이블 + MusicAlbum 스키마**.
- 신규 클러스터 **`kpop-releases-<year>`** (연도 8개 × 언어). 미발매 예약분은 집계에서 제외하고
  "발매 예정" 배지로만 표시한다 — 이 규칙을 되돌리지 말 것.
- ar RTL: `<html lang="ar" dir="rtl">`, Noto Sans Arabic, `og:locale ar_AR`,
  스킵링크는 clip-rect 방식(`left:-9999px`는 RTL에서 9999px 가로 스크롤을 만든다).

## 절대 되돌리면 안 되는 설계 결정

1. **`modules/seo-langs.cjs`에 언어를 추가하지 말 것.** 이 파일은 여행 콘텐츠 모듈
   (`seo-festivals.cjs`, `seo-seasoncity.cjs`)도 읽는다. 붙이면 seasoncity가 TypeError로 죽고
   festivals는 영어 폴백 페이지를 찍어낸다. K-pop 채널은 **`modules/seo-langs-kpop.cjs`**를 쓴다.
2. **`LOCALES`(build-seo.cjs)는 9언어 그대로.** `buildMonthL10n`/`buildVisaL10n`이 무가드로
   `L.months`/`L.visa`를 읽어 즉시 크래시한다. `L10N`에는 dir 전용 스텁만 들어간다.
3. **`localizeLinks()`는 `LOCALES` 기준으로 게이트**되어야 한다. `L10N` 존재 여부로 판단하면
   신규 언어 페이지의 푸터·내비 링크가 존재하지 않는 여행 URL로 재작성된다.
4. **모듈은 문자열이 없는 언어의 페이지도, hreflang 대체도 만들면 안 된다.** 예전에는 세 모듈이
   미지 언어에서 디렉터리를 빈 문자열로 폴백해 **영어 페이지를 덮어썼다**. 각 모듈은 이제
   필터링된 `LANGS` 상수 하나에서 페이지와 alts를 함께 유도한다.

## 남은 작업 (우선순위 순)

### 1. `kpop-history.json` 5개 언어 번역 — 최대 잔여 항목
104개 슬러그(34 프로필 + 70 역사/토픽)가 **9개 언어뿐**이다. 그래서 신규 5개 언어에는
아티스트 프로필과 역사 문서가 없다. 생성기에는 이미 가드가 들어가 있어 **죽은 링크는 0**이지만,
팬이 가장 많이 찾는 페이지가 비어 있는 상태다.

- 분량: 34 프로필 × 5 = 170편(약 188k 단어), 70 토픽 × 5 = 350편.
- **작업 방식(중요): 샤드로 쓰고 나중에 머지.** `kpop-history.json`은 8.8MB이고 여러 에이전트가
  동시에 쓰면 충돌한다. 언어·배치별로 `scratchpad/hist-<lang>-<n>.json`에
  `{ "<slug>": { "<lang>": {…} } }` 형태로 쓴 뒤 병합한다.
- 스타일 계약: `scratchpad/kpop-vocab.json`의 언어별 `notes`가 구속력을 가진다(복수 규칙,
  외래어 정책, 정직성 문구의 승인된 표현). 이미 5개 언어분이 작성돼 있다.
- 사실 동결: 데뷔일·멤버수·이름·차트 성적은 원문 그대로. 번역 후 en과 숫자 다중집합을 비교해
  검증할 것.
- 프로필이 들어오면 `kpopHasPages()`가 통과해 페이지가 자동 생성되고, 생성기의 프로필 링크
  가드도 자동으로 풀린다.

### 2. 중단된 QA 수정 잔여분
2026-08-10 QA에서 나온 지적 중 **high 3종(영어 내비·영어 제휴문구·browse.html 누락)은 해결**됐다.
남은 medium/low는 QA 원본에 있다:
`.../tasks/w9uyqepkm.output` (JSON: `result.qa[]`에 언어별 `findings[]`, 각 항목에
`file`/`current`/`suggested`/`why`). 네이티브 검수자가 대체 문구까지 써 두었으므로 그대로 적용하면 된다.
언어별 점수는 ar 7 · hi 7 · ru 6 · vi 7 · th 7.

특히 러시아어가 가장 낮다 — 날짜 생격(`11 апреля`), 수사 3형태 일치가 핵심.

### 3. 빌드 게이트에 없는 검사 하나
S20은 hreflang 대상의 존재만 확인하고 **본문 링크는 보지 않는다**. 그래서 죽은 내부 링크
5,995개가 빌드를 통과했다. 생성 페이지의 모든 `<a href>`가 디스크에 존재하는지 확인하는
검사를 추가하면 같은 부류의 사고를 다시 막을 수 있다.

## 재생성·배포

```bash
node build-seo.cjs                 # S20 게이트 포함, exit 0 이어야 함
```
정적 배포는 개별 scp가 불신이라 **tarball 단일 전송**을 쓴다. `kpop-sitemap.xml`은
`/guide/`가 아니라 **도메인 루트**에 올라간다. 배포 스크립트의 디렉터리 화이트리스트
(`deploy-seo.sh` DIRS, `deploy-to-guide.ps1` $SEO_DIRS)에 ar/hi/ru/vi/th는 이미 추가돼 있다.

## 이번에 발견된, 이 작업 범위 밖의 실제 버그

- `deploy-to-guide.ps1`이 `messages/{ar,hi,ru,vi,th}.json`과
  `assets/kbeauty-content.*.json`을 업로드한 적이 없다(지금 고쳐 넣었으나 K-beauty 쪽 확인 필요).
- `scripts/verify-seo.cjs`의 고아 페이지 스캔이 존재하지 않는 경로를 훑고 있어 **아무것도 검사하지
  않고 있었다**(수정됨).
- `zh-hant`는 디스크에 페이지가 있는데 두 사이트맵 어디에도 `<loc>`가 없어 SEO 게이트에 보이지 않는다.
- `kb/`는 두 배포 스크립트의 화이트리스트에 없다 — K-beauty 라이브러리는 별도 경로로 올라가는 듯하나
  확인 필요.

관련: [[koreaplus-kpop-vertical]] [[koreaplus-kpop-hub-ux]] [[koreaplus-deploy]]
