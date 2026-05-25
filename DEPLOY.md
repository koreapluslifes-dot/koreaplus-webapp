# KoreaPlus Webapp 배포 가이드

## 파일 구조
```
koreaplus-webapp/
├── index.html       ← 메인 페이지
├── style.css        ← 스타일
├── app.js           ← 3D 지도 + UI 로직
├── data.js          ← 한국 데이터 (음식/여행/교통/기업)
├── worker.js        ← Cloudflare Worker (AI 챗봇 백엔드)
└── wrangler.toml    ← Worker 배포 설정
```

## Step 1: 정적 파일 업로드 (WordPress)
`index.html`, `style.css`, `app.js`, `data.js` 4개 파일을 
koreaplus-lifes.com 서버 (AWS Lightsail)에 업로드

SSH 접속:
```bash
ssh -i LightsailDefaultKey-us-east-1.pem bitnami@<서버IP>
scp -i LightsailDefaultKey-us-east-1.pem index.html style.css app.js data.js bitnami@<서버IP>:/opt/bitnami/wordpress/korea-guide/
```

또는 WordPress 관리자에서 새 페이지 생성 후 iframe으로 임베드:
```html
<iframe src="/korea-guide/index.html" width="100%" height="100vh" frameborder="0"></iframe>
```

## Step 2: Cloudflare Worker 배포 (AI 챗봇)
```bash
# Wrangler CLI 설치
npm install -g wrangler

# 로그인
wrangler login

# API 키 설정
wrangler secret put ANTHROPIC_API_KEY
# → Anthropic API 키 입력

# 배포
cd koreaplus-webapp
wrangler deploy worker.js --name koreaplus-ai
```

배포 후 Worker URL 확인 (예: `https://koreaplus-ai.alllifes77-hue.workers.dev`)

## Step 3: app.js에서 Worker URL 업데이트
`app.js` 파일에서 다음 줄을 실제 Worker URL로 변경:
```javascript
const WORKER_URL = 'https://koreaplus-ai.alllifes77-hue.workers.dev';
```

## Step 4: 커스텀 도메인 (선택)
Cloudflare 대시보드에서 Worker에 커스텀 도메인 추가:
- `koreaplus-lifes.com/ai-guide` 또는
- `ai.koreaplus-lifes.com`

## 테스트
브라우저에서 `koreaplus-lifes.com/korea-guide/` 접속
- 3D 지도 회전 확인
- 카테고리 탭 전환 확인  
- AI 챗봇 작동 확인
