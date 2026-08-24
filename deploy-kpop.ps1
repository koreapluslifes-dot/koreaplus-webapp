# KoreaPlus K-Pop channel deploy — standalone at /kpop (not /guide/kpop).
# Hub runtime (CSS/JS/data) stays under /guide/ for shared assets; SEO pages
# deploy to the domain root (/kpop/, /ko/kpop/, /kpop-vs/, …).
#
# Usage:
#   .\deploy-kpop.ps1              # hub runtime + standalone pages + sitemap
#   .\deploy-kpop.ps1 -HubOnly     # hub runtime only
#   .\deploy-kpop.ps1 -Worker      # also wrangler-deploy /api/kpop
#   .\deploy-kpop.ps1 -SkipIndexNow
param(
    [string]$ServerIP = "18.207.55.50",
    [switch]$HubOnly,
    [switch]$Worker,
    [switch]$SkipIndexNow,
    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"
$PEM_KEY = "C:\Users\juksu\Documents\blog\koreaplus-lifes\LightsailDefaultKey-us-east-1.pem"
$REMOTE_USER = "bitnami"
$REMOTE_DIR = "/opt/bitnami/wordpress/guide"
$WP_ROOT = "/opt/bitnami/wordpress"
$LOCAL_DIR = "C:\Users\juksu\koreaplus-webapp"
$SSH = @("-i", $PEM_KEY, "-o", "StrictHostKeyChecking=no", "${REMOTE_USER}@${ServerIP}")
$LANGS = @("ko","ja","zh","zh-hant","es","fr","de","pt","id","ar","hi","ru","vi","th")

if (-not (Test-Path -LiteralPath $PEM_KEY)) { throw "PEM not found: $PEM_KEY" }
Set-Location $LOCAL_DIR

if ($Rebuild) {
    Write-Host "==> Rebuild: node build-seo.cjs" -ForegroundColor Yellow
    node build-seo.cjs
    if ($LASTEXITCODE -ne 0) { throw "build-seo.cjs failed" }
    node scripts/migrate-kpop-standalone.cjs
}

$hubItems = @(
    ".htaccess",
    "kpop.html", "kpop.css", "kpop-data.js", "kpop-enrich.js",
    "kpop-images.js", "kpop-discog.js",
    "modules/kpop.js", "modules/kpop-plus.js", "modules/kpop-ux.js",
    "modules/kpop-player.js", "modules/kpop-sharecard.js",
    "modules/scroll-guard.js",
    "icons/kpop.svg", "og", "seo.css", "hub-styles.css", "theme.css", "mobile.css",
    "modules/header.js", "modules/i18n.js", "modules/theme.js", "modules/analytics.js",
    "guide/k-pop-and-culture-guide.html"
)

$pageItems = New-Object System.Collections.Generic.List[string]
$enPages = 0
if (-not $HubOnly) {
    $kpopDir = Join-Path $LOCAL_DIR "kpop"
    if (-not (Test-Path $kpopDir)) { throw "kpop/ missing — run node build-seo.cjs first, or use -HubOnly" }
    $enPages = @(Get-ChildItem -Path $kpopDir -Filter "*.html" -File).Count
    if ($enPages -lt 300) { throw "ABORT: kpop/ has only $enPages HTML files (want >=300). Incomplete build?" }
    $pageItems.Add("kpop")
    if (Test-Path (Join-Path $LOCAL_DIR "kpop-vs")) { $pageItems.Add("kpop-vs") }
    foreach ($l in $LANGS) {
        if (Test-Path (Join-Path $LOCAL_DIR "$l\kpop")) { $pageItems.Add("$l/kpop") }
        if (Test-Path (Join-Path $LOCAL_DIR "$l\kpop-vs")) { $pageItems.Add("$l/kpop-vs") }
    }
    Get-ChildItem -Path $LOCAL_DIR -File | Where-Object {
        $_.Name -like "kpop-idols-*.html" -or
        $_.Name -like "kpop-lightstick*.html" -or
        $_.Name -like "kpop-glossary*.html" -or
        $_.Name -like "*-kpop-artists-guide.html"
    } | ForEach-Object { $pageItems.Add($_.Name) }
}

function Deploy-TarBundle($itemList, $remoteDest, $label) {
    if (-not $itemList -or $itemList.Count -eq 0) { return }
    $present = $itemList | Where-Object { Test-Path (Join-Path $LOCAL_DIR ($_ -replace '/', '\')) } | Select-Object -Unique
    if ($present.Count -eq 0) { return }
    $listFile = Join-Path $env:TEMP ("kp-kpop-{0}-list.txt" -f [guid]::NewGuid().ToString('N'))
    $bundle   = Join-Path $env:TEMP ("kp-kpop-{0}.tar" -f [guid]::NewGuid().ToString('N'))
    [System.IO.File]::WriteAllLines($listFile, [string[]]($present | ForEach-Object { $_ -replace '\\', '/' }))
    tar -cf $bundle -C $LOCAL_DIR -T $listFile
    if (-not (Test-Path $bundle)) { throw "tar bundle creation failed ($label)" }
    $mb = [math]::Round((Get-Item $bundle).Length / 1MB, 2)
    Write-Host "  $label bundle = $mb MB ($($present.Count) items)" -ForegroundColor DarkYellow
    & scp.exe -i $PEM_KEY -o "StrictHostKeyChecking=no" $bundle "${REMOTE_USER}@${ServerIP}:/tmp/kp-kpop-deploy.tar"
    & ssh.exe @SSH "sudo mkdir -p $remoteDest && sudo tar xf /tmp/kp-kpop-deploy.tar -C $remoteDest && sudo rm -f /tmp/kp-kpop-deploy.tar && echo EXTRACTED_$label"
    foreach ($tmp in @($bundle, $listFile)) { try { [System.IO.File]::Delete($tmp) } catch {} }
}

Write-Host "==> Deploy hub runtime -> $REMOTE_DIR" -ForegroundColor Cyan
Deploy-TarBundle $hubItems $REMOTE_DIR "hub"

if (-not $HubOnly) {
    Write-Host "==> Deploy K-Pop pages -> $WP_ROOT (standalone channel)" -ForegroundColor Cyan
    Deploy-TarBundle @($pageItems) $WP_ROOT "pages"
}

# Standalone hub + clean URLs
if (Test-Path (Join-Path $LOCAL_DIR "kpop-standalone.html")) {
    Write-Host "==> /kpop/index.html (standalone hub)..." -ForegroundColor Yellow
    & ssh.exe @SSH "sudo mkdir -p $WP_ROOT/kpop; sudo chown -R bitnami:daemon $WP_ROOT/kpop 2>/dev/null; true"
    & scp.exe -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\kpop-standalone.html" "${REMOTE_USER}@${ServerIP}:${WP_ROOT}/kpop/index.html"
    & ssh.exe @SSH "sudo chown bitnami:daemon $WP_ROOT/kpop/index.html; sudo chmod 755 $WP_ROOT/kpop; sudo chmod 644 $WP_ROOT/kpop/index.html"
}
if (Test-Path (Join-Path $LOCAL_DIR "kpop-channel.htaccess")) {
    Write-Host "==> /kpop/.htaccess (extensionless URLs)..." -ForegroundColor Yellow
    & scp.exe -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\kpop-channel.htaccess" "${REMOTE_USER}@${ServerIP}:${WP_ROOT}/kpop/.htaccess"
    & ssh.exe @SSH "sudo chown bitnami:daemon $WP_ROOT/kpop/.htaccess; sudo chmod 644 $WP_ROOT/kpop/.htaccess"
}

if (-not $HubOnly -and (Test-Path (Join-Path $LOCAL_DIR "kpop-sitemap.xml"))) {
    Write-Host "==> /kpop-sitemap.xml (domain root)..." -ForegroundColor Yellow
    & scp.exe -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\kpop-sitemap.xml" "${REMOTE_USER}@${ServerIP}:${WP_ROOT}/kpop-sitemap.xml"
    & ssh.exe @SSH "sudo chown bitnami:daemon $WP_ROOT/kpop-sitemap.xml && sudo chmod 644 $WP_ROOT/kpop-sitemap.xml"
}

Write-Host "==> Fixing permissions..." -ForegroundColor Yellow
$permScript = @"
set -e
G=$REMOTE_DIR
W=$WP_ROOT
chmod_tree() { [ -e `"`$1`" ] && sudo chmod -R a+rX `"`$1`"; }
chmod_file() { [ -f `"`$1`" ] && sudo chmod a+r `"`$1`"; }
chmod_tree `$W/kpop
chmod_tree `$W/kpop-vs
for l in $($LANGS -join ' '); do
  chmod_tree `$W/`$l/kpop
  chmod_tree `$W/`$l/kpop-vs
done
for f in kpop.html kpop.css kpop-data.js kpop-enrich.js kpop-images.js kpop-discog.js icons/kpop.svg modules/kpop.js modules/kpop-plus.js modules/kpop-ux.js modules/kpop-player.js modules/kpop-sharecard.js modules/scroll-guard.js; do
  chmod_file `$G/`$f
done
sudo chown -R bitnami:daemon `$W/kpop `$G/kpop.html `$G/kpop.css `$G/modules/kpop.js `$G/modules/kpop-plus.js `$G/modules/kpop-ux.js 2>/dev/null || true
echo PERMS_OK
"@
& ssh.exe @SSH $permScript

Write-Host "==> Live check..." -ForegroundColor Yellow
$checks = @(
    "https://koreaplus-lifes.com/kpop",
    "https://koreaplus-lifes.com/kpop/bts-profile",
    "https://koreaplus-lifes.com/kpop/browse"
)
$cb = Get-Random
foreach ($u in $checks) {
    $code = & curl.exe -s -o NUL -w "%{http_code}" --max-time 20 "$u`?cb=$cb"
    $color = if ($code -match "^(200|301|302)$") { "Green" } else { "Red" }
    Write-Host ("  {0}  {1}" -f $code, $u) -ForegroundColor $color
}

if ($Worker) {
    Write-Host "==> Worker..." -ForegroundColor Yellow
    Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
    & npx.cmd wrangler deploy src/worker.ts
    if ($LASTEXITCODE -ne 0) { throw "wrangler deploy failed" }
}

if (-not $SkipIndexNow -and -not $HubOnly) {
    Write-Host "==> IndexNow..." -ForegroundColor Yellow
    node indexnow-submit.cjs
}

Write-Host ""
Write-Host "K-Pop standalone channel live:" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/kpop" -ForegroundColor Green
if (-not $HubOnly) {
    Write-Host "  https://koreaplus-lifes.com/kpop/bts-profile (EN $enPages pages under /kpop/)" -ForegroundColor Green
}
