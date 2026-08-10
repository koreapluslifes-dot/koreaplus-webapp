# KoreaPlus Guide 배포 스크립트
# koreaplus-lifes.com/guide/ 에 정적 파일 업로드
# 사용법: .\deploy-to-guide.ps1 -ServerIP "YOUR_LIGHTSAIL_IP"

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP
)

$PEM_KEY = "C:\Users\juksu\Documents\blog\koreaplus-lifes\LightsailDefaultKey-us-east-1.pem"
$REMOTE_USER = "bitnami"
$REMOTE_DIR = "/opt/bitnami/wordpress/guide"
$LOCAL_DIR = "C:\Users\juksu\koreaplus-webapp"

$ROOT_FILES = @(
    # Core
    "index.html", "style.css", "app.js", "data.js", "config.js",
    # Phase 7 - rich detail panel + My Trip
    "detail-data.js", "detail-panel.js",
    # Phase 2 shared
    "hub-styles.css", "sitemap.xml", "robots.txt",
    # Hub pages
    "festivals.html", "culture.html", "temples.html", "nightviews.html",
    # Phase 3 - Planner
    "plan.html", "plan-styles.css",
    # Phase 5 - PWA + Legal
    "manifest.json", "sw.js", "theme.css",
    "about.html", "privacy.html", "terms.html", "contact.html",
    # Phase 6 - Killer Features
    "emergency.html", "phrases.html", "currency.html", "etiquette.html",
    "seasons.html", "kdrama-locations.html", "menu-translator.html", "subway.html",
    # K-Pop vertical
    "kpop.html", "kpop.css", "kpop-data.js", "kpop-enrich.js", "seo.css", "mobile.css",
    # K-Pop build-time snapshots (tools/gen-kpop-images.cjs / gen-kpop-discog.cjs)
    "kpop-images.js", "kpop-discog.js",
    # Service-improvement 20 (site-wide UX layer)
    "feature.css",
    # K-Beauty vertical
    "kbeauty.html", "kbeauty-data.js"
)

# ALL runtime modules (modules/*.js) — globbed so every current + future runtime
# module deploys automatically. Excludes build-only *.cjs (seo generators) which
# must NOT ship to the server. Replaces the old hand-maintained whitelist that had
# drifted (foryou/react/korea-now/… were loaded by pages but never re-uploaded).
$MODULE_FILES = @(Get-ChildItem -Path "$LOCAL_DIR\modules" -Filter "*.js" -File | ForEach-Object { "modules/$($_.Name)" })

# Static data assets (bundled JSON, etc.) served under /guide/assets/
$ASSET_FILES = @(
    "assets/cosing-ingredients.json",
    # K-Beauty per-language content overlays (localized data tier)
    "assets/kbeauty-content.en.json",
    "assets/kbeauty-content.ko.json",
    "assets/kbeauty-content.ja.json",
    "assets/kbeauty-content.zh.json",
    "assets/kbeauty-content.es.json",
    "assets/kbeauty-content.fr.json",
    "assets/kbeauty-content.de.json",
    "assets/kbeauty-content.pt.json",
    "assets/kbeauty-content.id.json",
    # ar/hi/ru/vi/th expansion. modules/kbeauty.js already lists all 14 codes in
    # _SUPPORTED and fetches assets/kbeauty-content.<lang>.json at runtime, so a
    # file missing here 404s and the overlay silently falls back to English.
    "assets/kbeauty-content.ar.json",
    "assets/kbeauty-content.hi.json",
    "assets/kbeauty-content.ru.json",
    "assets/kbeauty-content.vi.json",
    "assets/kbeauty-content.th.json"
)

$MESSAGE_FILES = @(
    "messages/en.json",
    "messages/ko.json",
    "messages/ja.json",
    "messages/zh.json",
    "messages/es.json",
    # Phase 7 - 4 additional languages (9 total)
    "messages/fr.json",
    "messages/de.json",
    "messages/pt.json",
    "messages/id.json",
    # ar/hi/ru/vi/th expansion (14 total)
    "messages/ar.json",
    "messages/hi.json",
    "messages/ru.json",
    "messages/vi.json",
    "messages/th.json"
)

$ICON_FILES = @(
    "icons/kplus.svg",
    "icons/icon.svg",
    "icons/kpop.svg"
)

Write-Host "Deploying KoreaPlus Guide (Phase 5) to $ServerIP..." -ForegroundColor Cyan

# Create remote directories
Write-Host "Creating remote directories..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" `
    "mkdir -p $REMOTE_DIR/modules $REMOTE_DIR/messages $REMOTE_DIR/icons $REMOTE_DIR/assets && chmod 755 $REMOTE_DIR $REMOTE_DIR/modules $REMOTE_DIR/messages $REMOTE_DIR/icons $REMOTE_DIR/assets"

# ── FAST BULK UPLOAD (single tar bundle) ──────────────────────────────────
# Every web asset is packed into ONE gzip'd tar, sent in a single scp, and
# extracted remotely. This replaces thousands of per-file scp round-trips
# (each a full SSH handshake over a Korea→US-East link) with one stream —
# typically 20-50x faster. The local tree mirrors the remote /guide layout,
# so every path extracts 1:1 under $REMOTE_DIR. tar overwrites in place
# (same as scp); it never deletes remote-only files.
$SEO_DIRS = @("places", "guide", "itinerary", "faq", "blog", "kpop", "ja", "zh", "zh-hant", "es", "ko", "fr", "de", "pt", "id", "ar", "hi", "ru", "vi", "th", "tools", "embed", "food")
$SEO_ROOT_FILES = @("explore.html", "sitemap.xml", "robots.txt", "llms.txt", "blog/feed.xml")
$KP_TXT = @(Get-ChildItem -Path $LOCAL_DIR -Filter "kp*.txt" -File | ForEach-Object { $_.Name })
# Runtime data files fetched by client modules + GEO text-twin (built to repo root -> /guide/).
# page-summaries.json is a build-time cache only (not client-fetched) -> intentionally excluded.
$DATA_FILES = @()
$DATA_FILES += @(Get-ChildItem -Path $LOCAL_DIR -Filter "search-index.*.json" -File | ForEach-Object { $_.Name })  # S02 on-page search
$DATA_FILES += @(Get-ChildItem -Path $LOCAL_DIR -Filter "llms*.txt" -File | ForEach-Object { $_.Name })             # S13 GEO text-twin
foreach ($d in @("related.json", "llms-index.json")) { if (Test-Path (Join-Path $LOCAL_DIR $d)) { $DATA_FILES += $d } }  # S04 read-next, S13 index

$BUNDLE_ITEMS = @()
$BUNDLE_ITEMS += $ROOT_FILES
$BUNDLE_ITEMS += $MODULE_FILES
$BUNDLE_ITEMS += $ASSET_FILES
$BUNDLE_ITEMS += $MESSAGE_FILES
$BUNDLE_ITEMS += $ICON_FILES
$BUNDLE_ITEMS += $SEO_DIRS
$BUNDLE_ITEMS += $SEO_ROOT_FILES
$BUNDLE_ITEMS += $KP_TXT
$BUNDLE_ITEMS += $DATA_FILES

# ── Sitemap-driven coverage ───────────────────────────────────────────────
# Generated SEO pages emitted to the repo ROOT (kpop-idols-*.html,
# cherry-blossom-in-*.html, food-dictionary.html, korea-festivals-in-*.html,
# destinations.html, …) are not in any whitelist or $SEO_DIR. Parse both
# sitemaps and add every referenced ROOT-level (non-$SEO_DIR) file so the
# canonical pages always deploy/update. Language + kpop/food/tools subdir files
# are already covered by the recursive $SEO_DIRS entries, so we skip those.
$BASE_URL = "https://koreaplus-lifes.com/guide/"
$seoDirSet = @{}; foreach ($d in $SEO_DIRS) { $seoDirSet[$d] = $true }
foreach ($sm in @("sitemap.xml", "kpop-sitemap.xml")) {
    $smPath = Join-Path $LOCAL_DIR $sm
    if (Test-Path $smPath) {
        $raw = Get-Content -LiteralPath $smPath -Raw
        foreach ($mm in [regex]::Matches($raw, '<loc>\s*([^<]+?)\s*</loc>')) {
            $u = $mm.Groups[1].Value.Trim()
            if ($u.StartsWith($BASE_URL)) {
                $rel = $u.Substring($BASE_URL.Length)
                if ($rel) {
                    $top = ($rel -split '/')[0]
                    if (-not $seoDirSet.ContainsKey($top)) { $BUNDLE_ITEMS += $rel }
                }
            }
        }
    }
}

# Keep only paths that exist locally; normalize to forward slashes for tar.
$present = $BUNDLE_ITEMS |
    Where-Object { Test-Path (Join-Path $LOCAL_DIR ($_ -replace '/', '\')) } |
    ForEach-Object { $_ -replace '\\', '/' } |
    Select-Object -Unique

Write-Host "`nPacking $($present.Count) items into one tar bundle..." -ForegroundColor Yellow
$listFile = Join-Path $env:TEMP "kp-deploy-list.txt"
$bundle   = Join-Path $env:TEMP "kp-deploy-bundle.tar.gz"
[System.IO.File]::WriteAllLines($listFile, [string[]]$present)
if ([System.IO.File]::Exists($bundle)) { [System.IO.File]::Delete($bundle) }
# Windows bsdtar: -C sets the base dir, -T reads the member list (relative paths).
tar -czf $bundle -C $LOCAL_DIR -T $listFile
if (-not (Test-Path $bundle)) { Write-Error "tar bundle creation failed"; exit 1 }
$mb = [math]::Round((Get-Item $bundle).Length / 1MB, 2)
Write-Host "  bundle = $mb MB  ->  single scp + one remote extract" -ForegroundColor DarkYellow

scp -i $PEM_KEY -o "StrictHostKeyChecking=no" $bundle "${REMOTE_USER}@${ServerIP}:/tmp/kp-deploy-bundle.tar.gz"
ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" "mkdir -p $REMOTE_DIR && tar -xzf /tmp/kp-deploy-bundle.tar.gz -C $REMOTE_DIR && rm -f /tmp/kp-deploy-bundle.tar.gz"
foreach ($tmp in @($bundle, $listFile)) { try { [System.IO.File]::Delete($tmp) } catch {} }

# Independent K-pop sitemap → DOMAIN ROOT (served at /kpop-sitemap.xml, NOT /guide/).
# Generated by build-seo.cjs; covers the /kpop hub + all K-pop history pages (9 langs) + kpop-themed pages.
if (Test-Path "$LOCAL_DIR\kpop-sitemap.xml") {
    Write-Host "`nDeploying kpop-sitemap.xml to domain root..." -ForegroundColor Yellow
    $WP_ROOT = ($REMOTE_DIR -replace '/guide$', '')   # /opt/bitnami/wordpress
    ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" "sudo chown bitnami:daemon $WP_ROOT/kpop-sitemap.xml 2>/dev/null; sudo chmod ug+rw $WP_ROOT/kpop-sitemap.xml 2>/dev/null; true"
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\kpop-sitemap.xml" "${REMOTE_USER}@${ServerIP}:${WP_ROOT}/kpop-sitemap.xml"
    ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" "sudo chown bitnami:daemon $WP_ROOT/kpop-sitemap.xml && chmod 644 $WP_ROOT/kpop-sitemap.xml"
}

# Standalone K-Pop hub → DOMAIN ROOT (served at /kpop/). Operates as its own
# channel: kpop-standalone.html keeps <base href="/guide/"> so its CSS/JS/data load
# from /guide/, but its home banner + hub links point to /kpop so it never funnels
# users into the travel-guide home.
if (Test-Path "$LOCAL_DIR\kpop-standalone.html") {
    Write-Host "`nDeploying kpop-standalone.html to /kpop/index.html (domain root)..." -ForegroundColor Yellow
    $WP_ROOT = ($REMOTE_DIR -replace '/guide$', '')   # /opt/bitnami/wordpress
    ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" "sudo mkdir -p $WP_ROOT/kpop; sudo chown -R bitnami:daemon $WP_ROOT/kpop 2>/dev/null; true"
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\kpop-standalone.html" "${REMOTE_USER}@${ServerIP}:${WP_ROOT}/kpop/index.html"
    ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" "sudo chown bitnami:daemon $WP_ROOT/kpop/index.html; chmod 755 $WP_ROOT/kpop; chmod 644 $WP_ROOT/kpop/index.html"
}

# Set file permissions
# Directories MUST be 755 (o+x) so Apache/daemon can traverse into them — scp -r
# can create nested SEO dirs (places/, kpop/, ko/ …) without world-execute, which
# makes every file inside return 403. Set dir perms BEFORE file perms.
Write-Host "`nSetting permissions..." -ForegroundColor Yellow
# Keep the remote command quote-free and paren-free: PowerShell strips embedded
# double quotes when passing a here-string to native ssh, which broke a quoted
# echo and a `\( -name ... \)` find group. chmod 644 on ALL files (the guide tree
# is web assets only) avoids the -name filter entirely.
ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" @"
  find $REMOTE_DIR -type d -exec chmod 755 {} + 2>/dev/null
  find $REMOTE_DIR -type f -exec chmod 644 {} + 2>/dev/null
  echo Permissions set: dirs 755 files 644
"@

# ── IndexNow instant indexing (Bing / Naver / Yandex) ──
Write-Host "`nSubmitting URLs to IndexNow (Bing/Naver/Yandex)..." -ForegroundColor Yellow
node "$LOCAL_DIR\indexnow-submit.cjs"

Write-Host ""
Write-Host "Done! Phase 5 + 6 deployed:" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/"                       -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/emergency.html"          -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/phrases.html"            -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/currency.html"           -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/etiquette.html"          -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/seasons.html"            -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/kdrama-locations.html"   -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/menu-translator.html"    -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/subway.html"             -ForegroundColor Green
Write-Host ""
Write-Host "Phase 6 Features:" -ForegroundColor Cyan
Write-Host "  Emergency  : offline cards, hospitals, embassy contacts + TTS"  -ForegroundColor White
Write-Host "  Phrases    : 6-category survival Korean + Web Speech TTS"       -ForegroundColor White
Write-Host "  Currency   : live exchange rates + price guide + budget calc"   -ForegroundColor White
Write-Host "  Etiquette  : Do/Don't rules + interactive quiz"                 -ForegroundColor White
Write-Host "  Seasons    : cherry blossom + foliage forecast Leaflet map"     -ForegroundColor White
Write-Host "  K-Drama    : 25+ filming locations Leaflet map + YouTube links" -ForegroundColor White
Write-Host "  Menu       : Tesseract.js OCR + AI translation (Worker)"        -ForegroundColor White
Write-Host "  Subway     : Seoul metro live arrivals via Worker /api/subway"  -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Set GA4 ID: edit modules/analytics.js, GA4_ID = 'G-YOUR_ID'"
Write-Host "  2. Set Clarity ID: edit modules/analytics.js, CLARITY_ID = 'your_id'"
Write-Host "  3. Set Formspree ID: edit contact.html, replace YOUR_FORM_ID"
Write-Host "  4. Push Worker to GitHub to trigger deploy (translator.ts endpoint)"
Write-Host "  5. Run PageSpeed: https://pagespeed.web.dev/?url=https://koreaplus-lifes.com/guide/"
