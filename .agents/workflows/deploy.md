# /deploy
1. 로컬에서 `.\deploy-to-guide.ps1 -ServerIP 18.207.55.50` 명령을 실행하여 Lightsail 인프라(WordPress 디렉터리 등)로 압축 아카이브(tar) 전송 및 동기화 수행
2. Cloudflare Worker 구성 변경 또는 추가 배포 필요 시: `wrangler deploy` 실행
3. `?v=N` 및 `sw.js` (서비스 워커) 캐시 버스트 값(`kp-vNN`)을 코드 수정 후 범프(Bump)하여 브라우저 클라이언트가 최신 변경 사항을 캐싱하도록 처리
4. 동시 세션에서 여러 에이전트가 배포하는 상황이 생기지 않도록 배포 충돌에 각별히 유의
