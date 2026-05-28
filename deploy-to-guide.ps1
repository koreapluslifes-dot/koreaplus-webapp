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
    "seasons.html", "kdrama-locations.html", "menu-translator.html", "subway.html"
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
    "modules/header.js"
)

$MESSAGE_FILES = @(
    "messages/en.json",
    "messages/ko.json",
    "messages/ja.json",
    "messages/zh.json",
    "messages/es.json"
)

$ICON_FILES = @(
    "icons/icon.svg"
)

Write-Host "Deploying KoreaPlus Guide (Phase 5) to $ServerIP..." -ForegroundColor Cyan

# Create remote directories
Write-Host "Creating remote directories..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" `
    "mkdir -p $REMOTE_DIR/modules $REMOTE_DIR/messages $REMOTE_DIR/icons && chmod 755 $REMOTE_DIR $REMOTE_DIR/modules $REMOTE_DIR/messages $REMOTE_DIR/icons"

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

# Set file permissions
Write-Host "`nSetting permissions..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" @"
  find $REMOTE_DIR -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" -o -name "*.xml" -o -name "*.txt" -o -name "*.svg" | xargs chmod 644 2>/dev/null
  echo "Permissions set."
"@

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
