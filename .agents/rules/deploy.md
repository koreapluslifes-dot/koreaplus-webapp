---
trigger: model_decision
description: "Rule for koreaplus-webapp: deploy.md"
---
koreaplus-webapp(`koreaplus-lifes.com/guide/`)는 **Lightsail/Bitnami WordPress 서버에 업로드**로 배포한다 (Cloudflare Pages 아님).

- 명령: `cd C:\Users\juksu\koreaplus-webapp; .\deploy-to-guide.ps1 -ServerIP "18.207.55.50"` (US-East Lightsail 퍼블릭IP, 안정적으로 재사용 중).
- PEM 키(`C:\Users\juksu\Documents\blog\koreaplus-lifes\LightsailDefaultKey-us-east-1.pem`)·원격경로(`/opt/bitnami/wordpress/guide`)는 스크립트에 하드코딩, **ServerIP만 인자로 필요**.
- **전송 방식(2026-06-27 개선, 커밋 4f58321):** 예전엔 파일별 scp(수천 회 SSH 핸드셰이크 → 수 분 소요)였으나, 이제 **전 자산을 gzip tar 1개로 묶어 1회 scp → 원격 1회 추출**(`tar -czf -C $LOCAL_DIR -T list` → `ssh tar -xzf -C $REMOTE_DIR`). 실측 ~55초. 로컬 트리가 원격 /guide와 1:1이라 그대로 추출됨. tar는 in-place 덮어쓰기(scp와 동일, 원격 단독 파일 삭제 안 함). kpop-sitemap·standalone 허브는 도메인루트(/kpop-sitemap.xml, /kpop/index.html)로 별도 단일 scp.
- 스크립트는 git HEAD가 아니라 **working tree 파일을 전송**한다 → 미커밋/진행중 파일도 함께 올라가니 배포 전 working tree 상태 확인 필수. (특히 같은 레포를 K-pop·k-뷰티 등 **여러 CCD 세션이 동시 편집** — 한 세션에서 배포하면 다른 세션의 미커밋 변경도 라이브로 나간다.)
- 배포할 파일은 `$ROOT_FILES`/`$MODULE_FILES`/`$ASSET_FILES`/`$SEO_DIRS` 등 화이트리스트에 등재돼 있어야 업로드됨. 생성 SEO 출력(`kpop/ ko/ fr/ de/ pt/ id/`·여행 허브 HTML·kpop-sitemap)은 `.gitignore` 처리, `node build-seo.cjs`로 재생성 후 배포.
- **PowerShell 직접 명령에 `'/','` 같은 문자열(예: `-replace '/','\'`)이 있으면 샌드박스가 경로삭제로 오인하는 오탐** → 로컬 PS 테스트 시 회피하거나 `dangerouslyDisableSandbox` 사용.

- **tar 패킹 stall 폴백(2026-06-30 실측):** 전 트리(수천 small HTML)를 매 배포마다 재-tar하므로 머신/AV 상황에 따라 패킹 단계에서 10분+ I/O 정체(스크립트는 scp 전이라 아무것도 안 올라간 상태)할 수 있음. **단일/소수 파일 변경(예: sitemap만)이면 전체 배포 대신 타깃 scp가 정답:** `scp -i $PEM sitemap.xml bitnami@IP:/opt/bitnami/wordpress/guide/sitemap.xml` (+ kpop-sitemap은 도메인루트 `/opt/bitnami/wordpress/kpop-sitemap.xml`) → `ssh chmod 644` → `node indexnow-submit.cjs`. stall 시 부모 powershell+tar 프로세스트리를 죽이고 **반쯤 쓰인 bundle을 삭제**해야 함(안 그러면 손상된 tar가 scp/추출돼 원격 깨짐). 사용자 가이드 "ssh 멈추면 중지 후 indexnow만"은 *업로드가 끝난 뒤* 전제 — 패킹 단계 stall이면 sitemap 타깃 scp를 먼저 해야 새 sitemap이 라이브됨.

**캐시 무효화 2중 관례:** (1) HTML script/link 태그에 `?v=N` 쿼리 (예: `app.js?v=21`, `kbeauty.js?v=1`) — 변경 시 N 증가. (2) `sw.js`의 `const CACHE = 'kp-vNN'` 버전 범프 (커밋 메시지에 "sw vNN"으로 표기). JS 변경 후 둘 다 갱신해야 캐시된 옛 파일이 교체됨.

관련: [[koreaplus-kbeauty-vertical]] [[koreaplus-kpop-vertical]]. lucky-webapp은 별도 파이프라인 [[lucky-deploy-pipeline]].
