---
trigger: model_decision
description: "KoreaPlus Guide travel webapp — session map, SEO, deploy"
---
# Guide webapp (`koreaplus-lifes.com/guide/`)

Dedicated session for the Korea travel Guide. Do not modify K-Pop (`kpop.html`, `kpop/`) or K-Beauty (`kbeauty.html`, `kb/`) unless the user explicitly switches scope.

**Live:** https://koreaplus-lifes.com/guide/
**Entry:** `index.html` (canonical `/guide/`)
**SEO:** generated `guide/` **144** pages + hubs + `busan/` **22** insider pages. Output dirs `guide/` `places/` `itinerary/` `faq/` `food/` `blog/` `busan/` are gitignored; rebuild with `node build-seo.cjs`. City pages serve at `/guide/guide/…` because `BASEP='/guide/'`.

**Deploy (Lightsail, not Pages):** `.\deploy-to-guide.ps1 -ServerIP "18.207.55.50"`
PEM `C:\Users\juksu\Documents\blog\koreaplus-lifes\LightsailDefaultKey-us-east-1.pem` → `/opt/bitnami/wordpress/guide`. Script packs working-tree files (uncommitted changes go live). After JS/CSS: bump `?v=N` and `sw.js` `kp-vNN`. Worker: `.\deploy-worker.ps1` (OAuth `jeybeeicon@gmail.com`, account `9ba6054d…`; unset env `CLOUDFLARE_API_TOKEN` first — it belongs to a different CF account and 403s). IndexNow: `node indexnow-submit.cjs`. Git: `origin` = `https://github.com/koreapluslifes-dot/koreaplus-webapp.git`, branch `main` tracks `origin/main`.

**Shared-tree warning:** K-Pop and K-Beauty sessions write the same `/guide` remote dir. Check `git status` and concurrent `sftp-server` before a full deploy.

Related: [[deploy-seo-pages]] [[content-coverage]] [[seo-expand20]] [[affiliate-layout]].
