# Deploy the Guide/K-Pop/K-Beauty Cloudflare Worker (koreaplus-webapp).
# Unsets CLOUDFLARE_API_TOKEN so a different-account env token cannot 403
# the jeybeeicon account that hosts koreaplus-webapp.jeybeeicon.workers.dev.
# Usage: .\deploy-worker.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
$env:CLOUDFLARE_ACCOUNT_ID = "9ba6054d0b8a97457cd23dfe558e915e"
Write-Host "Deploying koreaplus-webapp Worker via Wrangler OAuth (jeybeeicon)..." -ForegroundColor Cyan
& npx.cmd wrangler deploy src/worker.ts
if ($LASTEXITCODE -ne 0) { throw "wrangler deploy failed" }
Write-Host "Live: https://koreaplus-webapp.jeybeeicon.workers.dev/api/health" -ForegroundColor Green
