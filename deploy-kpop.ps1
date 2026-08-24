# KoreaPlus K-Pop channel deploy — hub + generated kpop pages only.
# Does NOT tar the travel / k-beauty trees, so other sessions' WIP stays off prod.
#
# Usage:
#   .\deploy-kpop.ps1              # hub + kpop/ trees + sitemap + /kpop
#   .\deploy-kpop.ps1 -HubOnly     # hub runtime only (kpop.html / modules / data)
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
    Write-Host "==> Rebuild: node build-seo.cjs (full SEO generator — travel pages too)" -ForegroundColor Yellow
    node build-seo.cjs
    if ($LASTEXITCODE -ne 0) { throw "build-seo.cjs failed" }
}

$hub = @(
    ".htaccess",
    "kpop.html", "kpop.css", "kpop-data.js", "kpop-enrich.js",
    "kpop-images.js", "kpop-discog.js",
    "modules/kpop.js", "modules/kpop-plus.js", "modules/kpop-ux.js",
    "modules/kpop-player.js", "modules/kpop-sharecard.js",
    "icons/kpop.svg", "og", "seo.css",
    "guide/k-pop-and-culture-guide.html"
)

$items = New-Object System.Collections.Generic.List[string]
foreach ($p in $hub) {
    if (Test-Path (Join-Path $LOCAL_DIR ($p -replace '/', '\'))) { $items.Add($p) }
    else { Write-Host "  skip missing hub file: $p" -ForegroundColor DarkYellow }
}

$enPages = 0
if (-not $HubOnly) {
    $kpopDir = Join-Path $LOCAL_DIR "kpop"
    if (-not (Test-Path $kpopDir)) { throw "kpop/ missing — run node build-seo.cjs first, or use -HubOnly" }
    $enPages = @(Get-ChildItem -Path $kpopDir -Filter "*.html" -File).Count
    if ($enPages -lt 300) { throw "ABORT: kpop/ has only $enPages HTML files (want >=300). Incomplete build?" }
    $items.Add("kpop")
    if (Test-Path (Join-Path $LOCAL_DIR "kpop-vs")) { $items.Add("kpop-vs") }
    foreach ($l in $LANGS) {
        if (Test-Path (Join-Path $LOCAL_DIR "$l\kpop")) { $items.Add("$l/kpop") }
        if (Test-Path (Join-Path $LOCAL_DIR "$l\kpop-vs")) { $items.Add("$l/kpop-vs") }
    }
    Get-ChildItem -Path $LOCAL_DIR -File | Where-Object {
        $_.Name -like "kpop-idols-*.html" -or
        $_.Name -like "kpop-lightstick*.html" -or
        $_.Name -like "kpop-glossary*.html" -or
        $_.Name -like "*-kpop-artists-guide.html"
    } | ForEach-Object { $items.Add($_.Name) }
}

$present = $items | Select-Object -Unique
Write-Host "==> Packing $($present.Count) items (HubOnly=$HubOnly, en kpop pages=$enPages)..." -ForegroundColor Cyan

$listFile = Join-Path $env:TEMP "kp-kpop-deploy-list.txt"
$bundle   = Join-Path $env:TEMP "kp-kpop-deploy.tar"
[System.IO.File]::WriteAllLines($listFile, [string[]]($present | ForEach-Object { $_ -replace '\\', '/' }))
if (Test-Path $bundle) { Remove-Item $bundle -Force }
# Uncompressed: gzip on this many tiny HTML files is slower than the extra bytes.
tar -cf $bundle -C $LOCAL_DIR -T $listFile
if (-not (Test-Path $bundle)) { throw "tar bundle creation failed" }
$mb = [math]::Round((Get-Item $bundle).Length / 1MB, 2)
Write-Host "  bundle = $mb MB" -ForegroundColor DarkYellow

Write-Host "==> Uploading..." -ForegroundColor Yellow
& scp.exe -i $PEM_KEY -o "StrictHostKeyChecking=no" $bundle "${REMOTE_USER}@${ServerIP}:/tmp/kp-kpop-deploy.tar"

Write-Host "==> Extracting on prod (kpop paths only)..." -ForegroundColor Yellow
& ssh.exe @SSH "sudo mkdir -p $REMOTE_DIR && sudo tar xf /tmp/kp-kpop-deploy.tar -C $REMOTE_DIR && sudo rm -f /tmp/kp-kpop-deploy.tar && echo EXTRACTED"

# Perms only on what we touched — never chmod the whole /guide tree (other sessions race).
Write-Host "==> Fixing permissions on kpop paths..." -ForegroundColor Yellow
$permScript = @"
set -e
R=$REMOTE_DIR
chmod_tree() { [ -e `"`$1`" ] && sudo chmod -R a+rX `"`$1`"; }
chmod_file() { [ -f `"`$1`" ] && sudo chmod a+r `"`$1`"; }
chmod_tree `$R/kpop
chmod_tree `$R/kpop-vs
for l in $($LANGS -join ' '); do
  chmod_tree `$R/`$l/kpop
  chmod_tree `$R/`$l/kpop-vs
done
for f in kpop.html kpop.css kpop-data.js kpop-enrich.js kpop-images.js kpop-discog.js icons/kpop.svg modules/kpop.js modules/kpop-plus.js modules/kpop-ux.js modules/kpop-player.js modules/kpop-sharecard.js; do
  chmod_file `$R/`$f
done
sudo chown -R bitnami:daemon `$R/kpop `$R/kpop.html `$R/kpop.css `$R/kpop-data.js `$R/kpop-enrich.js `$R/kpop-images.js `$R/kpop-discog.js `$R/modules/kpop.js `$R/modules/kpop-plus.js `$R/modules/kpop-ux.js `$R/modules/kpop-player.js `$R/modules/kpop-sharecard.js `$R/icons/kpop.svg 2>/dev/null || true
echo PERMS_OK
"@
& ssh.exe @SSH $permScript

# Standalone hub → https://koreaplus-lifes.com/kpop
if (Test-Path (Join-Path $LOCAL_DIR "kpop-standalone.html")) {
    Write-Host "==> /kpop/index.html (standalone hub)..." -ForegroundColor Yellow
    & ssh.exe @SSH "sudo mkdir -p $WP_ROOT/kpop; sudo chown -R bitnami:daemon $WP_ROOT/kpop 2>/dev/null; true"
    & scp.exe -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\kpop-standalone.html" "${REMOTE_USER}@${ServerIP}:${WP_ROOT}/kpop/index.html"
    & ssh.exe @SSH "sudo chown bitnami:daemon $WP_ROOT/kpop/index.html; sudo chmod 755 $WP_ROOT/kpop; sudo chmod 644 $WP_ROOT/kpop/index.html"
}

if (-not $HubOnly -and (Test-Path (Join-Path $LOCAL_DIR "kpop-sitemap.xml"))) {
    Write-Host "==> /kpop-sitemap.xml (domain root)..." -ForegroundColor Yellow
    & ssh.exe @SSH "sudo chown bitnami:daemon $WP_ROOT/kpop-sitemap.xml 2>/dev/null; sudo chmod ug+rw $WP_ROOT/kpop-sitemap.xml 2>/dev/null; true"
    & scp.exe -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\kpop-sitemap.xml" "${REMOTE_USER}@${ServerIP}:${WP_ROOT}/kpop-sitemap.xml"
    & ssh.exe @SSH "sudo chown bitnami:daemon $WP_ROOT/kpop-sitemap.xml && sudo chmod 644 $WP_ROOT/kpop-sitemap.xml"
}

foreach ($tmp in @($bundle, $listFile)) { try { [System.IO.File]::Delete($tmp) } catch {} }

Write-Host "==> Live check..." -ForegroundColor Yellow
$checks = @(
    "https://koreaplus-lifes.com/kpop",
    "https://koreaplus-lifes.com/guide/kpop",
    "https://koreaplus-lifes.com/guide/kpop/bts-profile",
    "https://koreaplus-lifes.com/guide/kpop/jungkook-bts-member"
)
$cb = Get-Random
foreach ($u in $checks) {
    $code = & curl.exe -s -o NUL -w "%{http_code}" --max-time 20 "$u`?cb=$cb"
    $color = if ($code -eq "200") { "Green" } else { "Red" }
    Write-Host ("  {0}  {1}" -f $code, $u) -ForegroundColor $color
}

if ($Worker) {
    Write-Host "==> Worker (unset CLOUDFLARE_API_TOKEN so local OAuth wins)..." -ForegroundColor Yellow
    Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
    & npx.cmd wrangler deploy src/worker.ts
    if ($LASTEXITCODE -ne 0) { throw "wrangler deploy failed" }
}

if (-not $SkipIndexNow -and -not $HubOnly) {
    Write-Host "==> IndexNow..." -ForegroundColor Yellow
    node indexnow-submit.cjs
}

Write-Host ""
Write-Host "K-Pop channel live:" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/kpop" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/kpop.html" -ForegroundColor Green
if (-not $HubOnly) {
    Write-Host "  https://koreaplus-lifes.com/guide/kpop/ (EN $enPages pages)" -ForegroundColor Green
}
