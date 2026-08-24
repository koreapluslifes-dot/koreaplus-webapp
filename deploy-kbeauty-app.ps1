# K-Beauty hub-only deploy. Does NOT upload K-pop or travel Guide files.
# Usage:
#   .\deploy-kbeauty-app.ps1
#   .\deploy-kbeauty-app.ps1 -Library
#   .\deploy-kbeauty-app.ps1 -Worker
#   .\deploy-kbeauty-app.ps1 -Messages -ServiceWorker

param(
    [string]$ServerIP = "18.207.55.50",
    [switch]$Library,
    [switch]$Worker,
    [switch]$Messages,
    [switch]$ServiceWorker
)

$PEM_KEY = "C:\Users\juksu\Documents\blog\koreaplus-lifes\LightsailDefaultKey-us-east-1.pem"
$REMOTE_USER = "bitnami"
$REMOTE_DIR = "/opt/bitnami/wordpress/guide"
$WP_ROOT = "/opt/bitnami/wordpress"
$LOCAL_DIR = "C:\Users\juksu\koreaplus-webapp"

if (-not (Test-Path $PEM_KEY)) { Write-Error "PEM not found: $PEM_KEY"; exit 1 }

$items = @(
    ".htaccess",
    "kbeauty.html",
    "kbeauty-data.js",
    "kbeauty-favicon.svg",
    "kbeauty-manifest.json",
    "kbeauty-apple-touch.png",
    "kbeauty-icon-192.png",
    "kbeauty-icon-512.png",
    "kbeauty-icon-maskable.png",
    "kbeauty-sitemap.xml",
    "kbeauty-chrome-i18n.json",
    "modules/kbeauty.js",
    "modules/kbeauty-sharecard.js",
    "assets/cosing-ingredients.json"
)

Get-ChildItem -Path (Join-Path $LOCAL_DIR "assets") -Filter "kbeauty-content*.json" -File -ErrorAction SilentlyContinue |
    ForEach-Object { $items += "assets/$($_.Name)" }
Get-ChildItem -Path $LOCAL_DIR -Filter "llms-kbeauty*.txt" -File -ErrorAction SilentlyContinue |
    ForEach-Object { $items += $_.Name }

if ($Messages) {
    Get-ChildItem -Path (Join-Path $LOCAL_DIR "messages") -Filter "*.json" -File |
        ForEach-Object { $items += "messages/$($_.Name)" }
}
if ($ServiceWorker) { $items += "sw.js" }

$present = @()
foreach ($rel in $items) {
    $full = Join-Path $LOCAL_DIR ($rel.Replace("/", [IO.Path]::DirectorySeparatorChar))
    if (Test-Path -LiteralPath $full) { $present += $rel.Replace("\", "/") }
}
$present = $present | Select-Object -Unique

if ($present.Count -eq 0) { Write-Error "No K-Beauty files found to deploy"; exit 1 }

Write-Host "K-Beauty hub deploy -> $ServerIP ($($present.Count) files)" -ForegroundColor Cyan

$listFile = Join-Path $env:TEMP "kp-kbeauty-deploy-list.txt"
$bundle   = Join-Path $env:TEMP "kp-kbeauty-deploy-bundle.tar.gz"
[System.IO.File]::WriteAllLines($listFile, [string[]]$present)
if (Test-Path $bundle) { Remove-Item $bundle -Force }

tar -czf $bundle -C $LOCAL_DIR -T $listFile
if (-not (Test-Path $bundle)) { Write-Error "tar bundle creation failed"; exit 1 }

$ssh = @("-i", $PEM_KEY, "-o", "StrictHostKeyChecking=no")
ssh @ssh "${REMOTE_USER}@${ServerIP}" "mkdir -p $REMOTE_DIR/modules $REMOTE_DIR/assets $REMOTE_DIR/messages && chmod 755 $REMOTE_DIR $REMOTE_DIR/modules $REMOTE_DIR/assets $REMOTE_DIR/messages"

# Root files under /guide are often daemon-owned; chown the hub HTML/JS we will overwrite.
$chownTargets = ($present | ForEach-Object { "$REMOTE_DIR/$_" }) -join " "
ssh @ssh "${REMOTE_USER}@${ServerIP}" "sudo chown bitnami:daemon $chownTargets 2>/dev/null; true"

scp @ssh $bundle "${REMOTE_USER}@${ServerIP}:/tmp/kp-kbeauty-deploy-bundle.tar.gz"
ssh @ssh "${REMOTE_USER}@${ServerIP}" "tar -xzf /tmp/kp-kbeauty-deploy-bundle.tar.gz -C $REMOTE_DIR && rm -f /tmp/kp-kbeauty-deploy-bundle.tar.gz && chmod 644 $chownTargets && rm -rf $REMOTE_DIR/kbeauty && echo EXTRACTED"

Remove-Item $bundle, $listFile -ErrorAction SilentlyContinue

# Standalone hub → https://koreaplus-lifes.com/kbeauty (K-Pop /kpop pattern)
$standalone = Join-Path $LOCAL_DIR "kbeauty-standalone.html"
if (-not (Test-Path $standalone)) { $standalone = Join-Path $LOCAL_DIR "kbeauty.html" }
Write-Host "`n==> /kbeauty/index.html (standalone hub)..." -ForegroundColor Yellow
ssh @ssh "${REMOTE_USER}@${ServerIP}" "sudo mkdir -p $WP_ROOT/kbeauty; sudo chown -R bitnami:daemon $WP_ROOT/kbeauty 2>/dev/null; true"
scp @ssh $standalone "${REMOTE_USER}@${ServerIP}:${WP_ROOT}/kbeauty/index.html"
ssh @ssh "${REMOTE_USER}@${ServerIP}" "sudo chown bitnami:daemon $WP_ROOT/kbeauty/index.html; sudo chmod 755 $WP_ROOT/kbeauty; sudo chmod 644 $WP_ROOT/kbeauty/index.html; rm -rf $REMOTE_DIR/kbeauty; echo STANDALONE_OK"

Write-Host "`nVerifying live..." -ForegroundColor Yellow
$cb = Get-Random
foreach ($u in @(
    "https://koreaplus-lifes.com/kbeauty",
    "https://koreaplus-lifes.com/kbeauty?lang=ko",
    "https://koreaplus-lifes.com/guide/kbeauty/",
    "https://koreaplus-lifes.com/guide/kbeauty.html",
    "https://koreaplus-lifes.com/guide/modules/kbeauty.js"
)) {
    try {
        $sep = if ($u -match '\?') { '&' } else { '?' }
        $code = [int](curl.exe -s -o NUL -w "%{http_code}" --max-time 25 "${u}${sep}cb=$cb")
        $color = if ($code -eq 200 -or $code -eq 301 -or $code -eq 302) { "Green" } else { "Red" }
        Write-Host ("  {0}  {1}" -f $code, $u) -ForegroundColor $color
    } catch {
        Write-Host "  ?    $u"
    }
}
$html = curl.exe -s --max-time 25 "https://koreaplus-lifes.com/kbeauty?cb=$cb"
if ($html -match 'id="kb-landing"' -and ($html -match 'kb-logo|kb-cta-hero')) {
    Write-Host "  OK   /kbeauty HTML has hub shell (kb-landing + branding)" -ForegroundColor Green
} else {
    Write-Host "  FAIL /kbeauty HTML missing hub markers" -ForegroundColor Red
}

if ($Library) {
    Write-Host "`nLibrary deploy (kb/)..." -ForegroundColor Cyan
  $bash = Get-Command bash -ErrorAction SilentlyContinue
  if ($bash) {
    bash deploy-kbeauty.sh --no-indexnow
  } else {
    $tarLocal = Join-Path $env:TEMP "kb.tar"
    $pageCount = (Get-ChildItem -Path (Join-Path $LOCAL_DIR "kb") -Filter *.html -Recurse -File).Count
    if ($pageCount -lt 4000) { Write-Error "ABORT: only $pageCount kb pages — build looks incomplete"; exit 1 }
    Write-Host "  $pageCount html files -> uncompressed tar + scp" -ForegroundColor DarkYellow
    if (Test-Path $tarLocal) { Remove-Item $tarLocal -Force }
    tar -cf $tarLocal -C $LOCAL_DIR kb kbeauty-sitemap.xml
    if (-not (Test-Path $tarLocal)) { Write-Error "tar creation failed"; exit 1 }
    scp @ssh $tarLocal "${REMOTE_USER}@${ServerIP}:/tmp/kb.tar"
    ssh @ssh "${REMOTE_USER}@${ServerIP}" @"
sudo tar xf /tmp/kb.tar -C $REMOTE_DIR && sudo chown -R bitnami:daemon $REMOTE_DIR/kb $REMOTE_DIR/kbeauty-sitemap.xml && rm -f /tmp/kb.tar && sudo chmod -R a+rX $REMOTE_DIR/kb && sudo chmod a+r $REMOTE_DIR/kbeauty-sitemap.xml && echo KB_EXTRACTED
"@
    Remove-Item $tarLocal -ErrorAction SilentlyContinue
    Write-Host "  Library uploaded (run node indexnow-submit.cjs to ping search engines)" -ForegroundColor DarkYellow
  }
}

if ($Worker) {
    Write-Host "`nWorker deploy..." -ForegroundColor Cyan
    & "$PSScriptRoot\deploy-worker.ps1"
}

Write-Host "`nDone. Live: https://koreaplus-lifes.com/kbeauty" -ForegroundColor Green
if ($Messages) { Write-Host "  included shared messages/*.json" -ForegroundColor Yellow }
if ($ServiceWorker) { Write-Host "  included shared sw.js" -ForegroundColor Yellow }
