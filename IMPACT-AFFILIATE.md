# 💰 Impact.com 제휴 자동화 — 연결 가이드

시스템은 **이미 라이브로 작동 중**입니다. 지금은 "폴백 모드"(일반 링크, 수익 없음)이고,
아래 절차로 Impact 계정을 연결하면 **모든 링크가 자동으로 수익 트래킹 링크로 전환**됩니다.

---

## 🏗️ 구현된 구조 (참고)

```
[159개 페이지]  data-aff='{"city":"Jeonju","cat":"food","q":"Bibimbap"}'
      │                          (빌드 시 컨텍스트 내장)
      ▼
[modules/affiliate.js]  페이지 로드 → /api/aff 호출 → 블록 교체
      │                  + 긴 글이면 본문 중간에 컴팩트 블록 자동 삽입
      ▼                  + 클릭 시 GA4 이벤트(aff_click) 기록
[Worker /api/aff]  컨텍스트 → 브랜드/딥링크 매칭
      │            예: food+Jeonju → "Jeonju Food Tours"(Klook)
      │                hotel+Busan → "Busan Hotels"(Trip.com) 우선
      │                esim → Airalo 우선
      ▼
[Impact TrackingLinks API]  트래킹 링크 생성 → KV 7일 캐시
      └─ 자격증명/승인 없으면 → 일반 링크로 폴백 (사이트 절대 안 깨짐)
```

---

## 1️⃣ Impact 퍼블리셔 계정 만들기

1. https://impact.com → **Partners (Publisher)** 로 가입
2. 사이트 등록: `https://koreaplus-lifes.com` (미디어 자산/Property로 등록)

## 2️⃣ 브랜드 프로그램 가입 (마켓플레이스)

Impact 대시보드 → **Brands / Marketplace** 에서 검색 → **Apply**:

| 브랜드 키 | 추천 검색어 | 용도 |
|---|---|---|
| `klook` | Klook | 투어·입장권 (한국 여행 최강) |
| `airalo` | Airalo | eSIM (전환율 높음) |
| `tripcom` | Trip.com | 호텔 |
| `kkday` | KKday | 데이투어 |

> 승인은 보통 며칠 걸립니다. **승인된 것부터 하나씩 연결해도 됩니다** —
> 미승인 브랜드는 자동으로 일반 링크 폴백.

## 3️⃣ API 자격증명 확인

Impact 대시보드 → ⚙️ **Settings → API** (또는 Technical Settings):
- **Account SID** 복사
- **Auth Token** 복사 (없으면 Create Token)

각 브랜드 승인 후, 브랜드 상세(Contract/Program) 페이지 URL이나 목록에서
**Program ID**(숫자) 확인.

## 4️⃣ 워커에 시크릿 등록

```powershell
cd C:\Users\juksu\koreaplus-webapp
npx wrangler secret put IMPACT_ACCOUNT_SID    # → SID 붙여넣기
npx wrangler secret put IMPACT_AUTH_TOKEN     # → 토큰 붙여넣기
npx wrangler secret put IMPACT_PROGRAMS       # → 아래 JSON 형식으로
```

`IMPACT_PROGRAMS` 값 예시 (승인된 것만 넣으면 됨):
```json
{"klook":"12345","airalo":"67890","tripcom":"11111","kkday":"22222"}
```

(계정에 Property가 여러 개면 선택적으로: `npx wrangler secret put IMPACT_PROPERTY_ID`)

> 💡 Cloudflare 대시보드 → Workers → **koreaplus-webapp** → Settings →
> Variables and Secrets 에서 웹으로 입력해도 됩니다. **워커 재배포 불필요, 즉시 적용.**

## 5️⃣ 작동 확인

```bash
curl "https://koreaplus-webapp.jeybeeicon.workers.dev/api/aff?city=Seoul&cat=food"
```
- 연결 전: `"tracked": false` + 일반 URL
- 연결 후: `"tracked": true` + `https://....pxf.io/...` 형태의 Impact 트래킹 URL

사이트에서 확인: 아무 가이드 페이지(예: `/guide/places/bibimbap.html`) →
하단 제휴 블록 링크에 마우스 올려 URL 확인.

---

## 📊 성과 추적 & 최적화

- **클릭**: GA4 이벤트 `aff_click` (brand / cat / city / placement=bottom·inline)
  → 어떤 페이지·브랜드·위치가 클릭을 만드는지 보고 매칭 로직 개선 가능
- **전환/수익**: Impact 대시보드 → Reports
- **매칭 규칙 수정**: `src/handlers/affiliate.ts`의 `pickOffers()` —
  카테고리별 브랜드 순서/딥링크를 바꾸고 `npx wrangler deploy src/worker.ts`
- **링크 캐시**: KV 7일. 매칭을 바꿨는데 즉시 반영하고 싶으면 KV의 `aff:` 키 삭제

## ⚠️ 정책 준수 (이미 적용됨)

- 모든 제휴 링크 `rel="sponsored noopener"` ✓
- 블록 하단에 제휴 고지 문구 표시 ✓
- 페이지는 JS 없이도 일반 링크로 동작(SEO·접근성 안전) ✓
