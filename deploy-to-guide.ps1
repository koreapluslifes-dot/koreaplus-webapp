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
$FILES = @(
    "index.html", "style.css", "app.js", "data.js",
    # Phase 2 shared
    "config.js", "hub-styles.css", "sitemap.xml",
    # Hub pages
    "festivals.html", "culture.html", "temples.html", "nightviews.html", "api-test.html"
)
$MODULE_FILES = @(
    "modules/api-client.js",
    "modules/dashboard.js",
    "modules/week-section.js"
)

Write-Host "Deploying KoreaPlus Guide to $ServerIP..." -ForegroundColor Cyan

# Create /guide directory on server
Write-Host "Creating /guide directory..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" "mkdir -p $REMOTE_DIR && chmod 755 $REMOTE_DIR"

# Upload root files
foreach ($file in $FILES) {
    Write-Host "Uploading $file..." -ForegroundColor Yellow
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$LOCAL_DIR\$file" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/"
}

# Create modules directory and upload module files
Write-Host "Creating modules directory..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" "mkdir -p $REMOTE_DIR/modules && chmod 755 $REMOTE_DIR/modules"
foreach ($file in $MODULE_FILES) {
    Write-Host "Uploading $file..." -ForegroundColor Yellow
    $localPath = "$LOCAL_DIR\$($file.Replace('/', '\'))"
    scp -i $PEM_KEY -o "StrictHostKeyChecking=no" "$localPath" "${REMOTE_USER}@${ServerIP}:${REMOTE_DIR}/modules/"
}

# Set permissions
Write-Host "Setting file permissions..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o "StrictHostKeyChecking=no" "${REMOTE_USER}@${ServerIP}" "chmod 644 $REMOTE_DIR/*.html $REMOTE_DIR/*.css $REMOTE_DIR/*.js $REMOTE_DIR/*.xml $REMOTE_DIR/modules/*.js"

Write-Host ""
Write-Host "Done! Files deployed:" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/festivals.html" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/culture.html" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/temples.html" -ForegroundColor Green
Write-Host "  https://koreaplus-lifes.com/guide/nightviews.html" -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: If the page returns a 404, add this rule to your .htaccess:" -ForegroundColor Yellow
Write-Host '  RewriteCond %{REQUEST_URI} !^/guide/'
