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
ROOTS="index.html app.js style.css explore.html destinations.html experiences.html when-to-visit.html travel-basics.html itineraries.html tools.html sitemap.xml about.html festivals.html seasons.html culture.html temples.html nightviews.html kdrama-locations.html phrases.html currency.html subway.html menu-translator.html etiquette.html emergency.html bucket-list.html trending.html quiz.html compare.html seo.css hub-styles.css contact.html plan.html privacy.html terms.html"
KEYS=$(ls kp*.txt 2>/dev/null | tr '\n' ' ')

echo "==> Tarring $(echo $DIRS | wc -w) dirs + root files…"
tar czf /c/tmp/kp.tgz $DIRS $ROOTS modules/klook-cards.js modules/page-ads.js modules/week-section.js modules/korea-now.js modules/kp-enhance.js $KEYS

echo "==> Uploading tarball…"
scp -i "$PEM" -o StrictHostKeyChecking=no /c/tmp/kp.tgz "bitnami@$IP:/tmp/kp.tgz"

echo "==> Extracting + fixing perms on prod…"
# NOTE: docroot is /opt/bitnami/wordpress; the app lives at web /guide/ = $REMOTE.
# tar recreates nested dir entries with the local (Windows) 700 perms, which makes
# Apache (daemon) 403 everything under them. `chmod -R a+rX` is the robust fix:
# it adds o+rx to EVERY dir (traversable) + o+r to files, without setting +x on
# files. The per-find `-exec chmod 755 {} +` form missed some nested dirs (ja/guide).
$SSH "sudo tar xzf /tmp/kp.tgz -C $REMOTE && sudo chown -R bitnami:daemon $REMOTE && rm -f /tmp/kp.tgz && echo EXTRACTED"

echo "==> Fixing perms (chmod a+rX) + verifying no dir is left non-traversable…"
# Loop: a+rX, then check for any dir missing world-execute (octal 001). Re-run if
# any remain (a single chmod -R has been observed to miss some nested dirs). Apache
# (daemon) 403s every page under a 700 dir, so this MUST end with 0 stragglers.
$SSH '
  for i in 1 2 3; do
    sudo chmod -R a+rX '"$REMOTE"'
    left=$(sudo find '"$REMOTE"' -type d ! -perm -001 | wc -l)
    echo "pass $i: $left non-traversable dirs remain"
    [ "$left" = "0" ] && break
  done
  bad=$(sudo find '"$REMOTE"' -type d ! -perm -001 | head; sudo find '"$REMOTE"' -type f ! -perm -004 | head)
  [ -z "$bad" ] && echo "PERMS_OK" || { echo "PERMS_FAIL: $bad"; exit 1; }
'

echo "==> IndexNow ping…"
node indexnow-submit.cjs || true

echo "==> Done."
