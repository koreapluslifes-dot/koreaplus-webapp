# 🔍 검색엔진 등록 가이드 (Search Console · Bing · Naver)

생성된 **185개 URL**(sitemap.xml)을 검색엔진에 알리는 절차입니다.
한 번만 등록하면 이후 빌드/배포 때마다 자동으로 재크롤됩니다.

---

## 1. Google Search Console (가장 중요)

1. https://search.google.com/search-console 접속 → Google 로그인
2. **속성 추가** → 유형 선택:
   - **URL 접두어** 방식 추천: `https://koreaplus-lifes.com/` 입력
3. **소유권 확인** — 가장 쉬운 방법 2가지:
   - **HTML 파일**: 구글이 주는 `googleXXXX.html` 파일을 받아서 알려주시면
     제가 서버 루트에 올려드립니다 (또는 직접 `/opt/bitnami/wordpress/`에 업로드)
   - **DNS TXT 레코드**: Cloudflare DNS에서 TXT 레코드 추가 (도메인이 Cloudflare에 있으므로 간단)
4. 확인 완료 후 → 좌측 **Sitemaps** 메뉴 →
   `https://koreaplus-lifes.com/guide/sitemap.xml` 입력 → 제출
5. **URL 검사** 도구에 대표 페이지 몇 개를 직접 넣고 "색인 생성 요청":
   - `/guide/` (홈)
   - `/guide/explore.html`
   - `/guide/guide/korea-visa-k-eta-guide.html`
   - `/guide/blog/is-korea-expensive.html`

> 색인은 보통 며칠~2주에 걸쳐 진행됩니다. **Coverage(색인 현황)** 리포트에서
> 185개 URL 중 몇 개가 색인됐는지 추적하세요.

---

## 2. Bing Webmaster Tools (5분, GSC 연동으로 끝)

1. https://www.bing.com/webmasters 접속
2. **"Google Search Console에서 가져오기"** 클릭 → 위 1번 계정 연결
3. 사이트맵·검증이 자동 복사됩니다. 끝.

> Bing 등록은 **ChatGPT/Copilot 검색 노출**에도 영향을 주므로 가치가 큽니다.

---

## 3. Naver Search Advisor (한국어 유입 + 일본/아시아권)

1. https://searchadvisor.naver.com 접속 → 네이버 로그인
2. **웹마스터 도구** → 사이트 등록: `https://koreaplus-lifes.com`
3. 소유 확인 (HTML 파일 또는 메타태그 — 파일 주시면 올려드립니다)
4. **요청 → 사이트맵 제출**: `https://koreaplus-lifes.com/guide/sitemap.xml`

---

## 4. IndexNow (이미 적용됨 ✅ — Bing·Naver·Yandex 즉시 알림)

- 키 파일이 이미 배포돼 있습니다:
  `https://koreaplus-lifes.com/guide/kp7e3f1c9a2b5d48069e3f1c9a2b5d48.txt`
- 새 페이지를 배포할 때마다 아래 한 줄로 즉시 알림(핑) 가능:

```bash
curl -s -X POST "https://api.indexnow.org/IndexNow" \
  -H "Content-Type: application/json" \
  -d '{"host":"koreaplus-lifes.com","key":"kp7e3f1c9a2b5d48069e3f1c9a2b5d48","keyLocation":"https://koreaplus-lifes.com/guide/kp7e3f1c9a2b5d48069e3f1c9a2b5d48.txt","urlList":["https://koreaplus-lifes.com/guide/"]}'
```

(첫 핑은 이번 배포에서 이미 보냈습니다)

---

## 5. 운영 루틴

| 주기 | 할 일 |
|---|---|
| 콘텐츠 추가/수정 시 | `node build-seo.cjs` → 배포 → (선택) IndexNow 핑 |
| 주 1회 | GSC **실적** 리포트에서 노출/클릭 키워드 확인 → 잘 되는 주제로 콘텐츠 보강 |
| 월 1회 | **Coverage**에서 색인 제외 페이지 점검 / 사이트맵 재제출 |

### 빠르게 효과 보는 팁
- GSC 등록 직후 **URL 검사 → 색인 요청**을 핵심 페이지 10개에 수동 실행 (가장 빠른 부스트)
- 블로그 글(`/guide/blog/`)을 Reddit r/koreatravel, 트립어드바이저 포럼 답변에 자연스럽게 인용 → 첫 백링크
- `og-image.jpg`가 이제 존재하므로 소셜 공유 시 썸네일이 정상 표시됩니다
