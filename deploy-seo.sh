#!/usr/bin/env bash
# Deploy generated SEO pages + modified root HTML to Lightsail prod.
# SEO dirs are NOT git-tracked; this tars them, scps to /tmp, and sudo-extracts.
# Usage: bash deploy-seo.sh
set -euo pipefail

IP="${KP_PROD_IP:-18.207.55.50}"
PEM="/c/Users/juksu/Documents/blog/koreaplus-lifes/LightsailDefaultKey-us-east-1.pem"
REMOTE="/opt/bitnami/wordpress/guide"
SSH="ssh -i $PEM -o StrictHostKeyChecking=no bitnami@$IP"

# Top-level SEO dirs + modified root files to ship.
DIRS="guide ja zh es ko fr de pt id places itinerary faq blog"
ROOTS="explore.html sitemap.xml about.html festivals.html seasons.html culture.html temples.html nightviews.html kdrama-locations.html phrases.html currency.html subway.html menu-translator.html etiquette.html emergency.html bucket-list.html trending.html quiz.html compare.html seo.css"
KEYS=$(ls kp*.txt 2>/dev/null | tr '\n' ' ')

echo "==> Tarring $(echo $DIRS | wc -w) dirs + root files…"
tar czf /c/tmp/kp.tgz $DIRS $ROOTS modules/klook-cards.js modules/page-ads.js $KEYS

echo "==> Uploading tarball…"
scp -i "$PEM" -o StrictHostKeyChecking=no /c/tmp/kp.tgz "bitnami@$IP:/tmp/kp.tgz"

echo "==> Extracting + fixing perms on prod…"
$SSH "sudo tar xzf /tmp/kp.tgz -C $REMOTE && sudo chown -R bitnami:daemon $REMOTE && sudo find $REMOTE -type d -exec chmod 755 {} + && sudo find $REMOTE -type f -exec chmod 644 {} + && rm -f /tmp/kp.tgz && echo OK"

echo "==> IndexNow ping…"
node indexnow-submit.cjs || true

echo "==> Done."
