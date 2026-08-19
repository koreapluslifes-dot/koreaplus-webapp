---
name: kbeauty
description: Iterate, fix, and deploy the KoreaPlus K-Beauty webapp only (kbeauty.html hub, kb/ library, overlays, isolated Lightsail deploy). Use in the dedicated K-Beauty chat, or when the user mentions K-Beauty, kbeauty, /kbeauty, 케이뷰티, 뷰티 웹앱, or asks to deploy K-Beauty. Do not use for K-pop or travel Guide work.
---

# K-Beauty session

This chat is the **K-Beauty-only** lane. Sister chats own K-pop and Guide. Same git repo — isolate edits and deploys.

## Scope

Touch only:

- `kbeauty.html`, `kbeauty-data.js`, `kbeauty-*.json`, `kbeauty-manifest.json`, icons/favicon
- `modules/kbeauty.js`, `modules/kbeauty-sharecard.js`
- `assets/kbeauty-content.*.json`, `assets/cosing-ingredients.json`
- `kb/**` and `build-kbeauty-pages.cjs` (library is generated — change the generator or source JSON, then rebuild)
- `src/api/aliexpress.ts` and `/api/kbeauty/*` / `/kbeauty*` Worker paths when the hub API/proxy needs it
- `messages/*.json` **kbeauty.*** keys only — and only deploy messages when the user confirms (file is shared)

Do not edit `kpop.html`, `kpop/`, travel `index.html`, or other verticals unless the user explicitly asks.

Read `.agents/rules/kbeauty-vertical.md` for product history if a change conflicts with a past user decision (bottom tabs, AdSense-over-affiliate, font +1px, no global RTL).

## Edit → cache-bust → deploy

1. Make the change.
2. Bump cache tokens that match what changed:
   - JS: `kbeauty.html` script `?v=N` (`kbeauty.js` currently v29, `kbeauty-data.js` v10)
   - Overlays: `OVERLAY_VER` in `modules/kbeauty.js` (currently `12`)
   - Shared SW: bump `sw.js` `CACHE` (`kp-vNN`) only if also uploading `sw.js`
3. Deploy **K-Beauty files only**:

```powershell
.\deploy-kbeauty-app.ps1
# or: npm run deploy:kbeauty
```

Library pages (`kb/`):

```bash
bash deploy-kbeauty.sh
```

Worker proxy or `/api/kbeauty/*` — must be the **jeybeeicon** Cloudflare account (`koreaplus-webapp.jeybeeicon.workers.dev`). This machine often has `CLOUDFLARE_API_TOKEN` set to a different account; unset it first:

```powershell
Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
npx wrangler deploy
```

Or `.\deploy-kbeauty-app.ps1 -Worker`. Do not deploy while `wrangler whoami` shows any account other than `jeybeeicon@gmail.com`.

4. Verify live: `https://koreaplus-lifes.com/kbeauty` (and the specific `/guide/kb/...` URL if library). A screenshot of local HTML is not enough.

Never run `.\deploy-to-guide.ps1` from this session — it tars the whole `/guide` tree and can publish uncommitted K-pop/Guide work from the other chats.

Shared files (`sw.js`, `messages/*.json`, `hub-styles.css`, `src/worker.ts`) need an explicit user OK before deploy. Use the script flags `-ServiceWorker` / `-Messages`.

## Product constraints

- Zero-key render: page must work if Worker APIs return empty.
- `AFFILIATE_ON=false` in hub + generator until the user says otherwise. Ads = AdSense (ko may still have Coupang in older notes; current hub flag wins).
- No fabricated clinical claims, fake dermatologist names, or invented stats.
- New prose in `kbeauty-data.js` needs matching overlay keys in all 14 `assets/kbeauty-content.<lang>.json` files (missing keys fall back to English).
- New library page types go through `build-kbeauty-pages.cjs` + `HUB_META`, then `bash deploy-kbeauty.sh`. Do not hand-write `kb/**/*.html`.
