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
    # K-Beauty vertical
    "kbeauty.html", "kbeauty-data.js"
)

$MODULE_FILES = @(
    "modules/api-client.js",
    "modules/dashboard.js",
    "modules/week-section.js",
    "modules/planner.js",
    # Phase 5 modules
    "modules/i18n.js",
    "modules/theme.js",
    "modules/search.js",
    "modules/analytics.js",
    "modules/header.js",
    # Phase 7 - My Trip personal record system
    "modules/mytrip.js",
    # extra runtime modules used by hub pages
    "modules/nav.js",
    "modules/pwa.js",
    "modules/affiliate.js",
    # K-Pop vertical
    "modules/kpop.js",
    "modules/kpop-plus.js",
    "modules/kpop-ux.js",
    "modules/mobile.js",
    "modules/kpop-player.js",
    "modules/kpop-sharecard.js",
    "modules/topads.js",
    # K-Beauty vertical
    "modules/kbeauty.js",
    "modules/kbeauty-sharecard.js"
)

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
    "assets/kbeauty-content.id.json"
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
    "messages/id.json"
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

# Upload root files
Write-Host "`nUploading root files..." -ForegroundColor Yellow
foreach ($file in $ROOT_FILES) {
    Write-Host "  $file" -ForegroundColor DarkYellow
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\$file" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/"
}

# Upload module files
Write-Host "`nUploading modules..." -ForegroundColor Yellow
foreach ($file in $MODULE_FILES) {
    Write-Host "  $file" -ForegroundColor DarkYellow
    $localPath = "$LOCAL_DIR\$($file.Replace('/', '\'))"
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$localPath" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/modules/"
}

# Upload static data assets
Write-Host "`nUploading assets..." -ForegroundColor Yellow
foreach ($file in $ASSET_FILES) {
    Write-Host "  $file" -ForegroundColor DarkYellow
    $localPath = "$LOCAL_DIR\$($file.Replace('/', '\'))"
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$localPath" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/assets/"
}

# Upload message files
Write-Host "`nUploading i18n messages..." -ForegroundColor Yellow
foreach ($file in $MESSAGE_FILES) {
    Write-Host "  $file" -ForegroundColor DarkYellow
    $localPath = "$LOCAL_DIR\$($file.Replace('/', '\'))"
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$localPath" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/messages/"
}

# Upload icon files
Write-Host "`nUploading icons..." -ForegroundColor Yellow
foreach ($file in $ICON_FILES) {
    Write-Host "  $file" -ForegroundColor DarkYellow
    $localPath = "$LOCAL_DIR\$($file.Replace('/', '\'))"
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$localPath" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/icons/"
}

# Upload generated SEO pages (build-seo.cjs output) — recursive directories
# These are NOT git-tracked; regenerate with `node build-seo.cjs` before deploying.
$SEO_DIRS = @("places", "guide", "itinerary", "faq", "blog", "kpop", "ja", "zh", "es", "ko", "fr", "de", "pt", "id")
$SEO_ROOT_FILES = @("explore.html", "sitemap.xml", "robots.txt", "llms.txt", "blog/feed.xml")
Write-Host "`nUploading SEO pages (recursive dirs)..." -ForegroundColor Yellow
foreach ($dir in $SEO_DIRS) {
    $localPath = "$LOCAL_DIR\$dir"
    if (Test-Path $localPath) {
        Write-Host "  $dir/  (recursive)" -ForegroundColor DarkYellow
        scp -i $PEM_KEY -o "StrictHostKeyChecking=no" -r "$localPath" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/"
    }
}
Write-Host "`nUploading SEO root files..." -ForegroundColor Yellow
foreach ($file in $SEO_ROOT_FILES) {
    $localPath = "$LOCAL_DIR\$($file.Replace('/', '\'))"
    if (Test-Path $localPath) {
        Write-Host "  $file" -ForegroundColor DarkYellow
        $remoteSub = if ($file -match '/') { "$REMOTE_DIR/" + ($file -replace '/[^/]+$', '') } else { $REMOTE_DIR }
        scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$localPath" "${REMOTE_USER}@${ServerIP}:${remoteSub}/"
    }
}
# IndexNow key file (Bing/Naver/Yandex instant indexing)
Get-ChildItem -Path $LOCAL_DIR -Filter "kp*.txt" -File | ForEach-Object {
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$($_.FullName)" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/"
}

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
