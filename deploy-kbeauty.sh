#!/usr/bin/env bash
# Deploy the generated K-beauty library (/guide/kb/) + its sitemap to Lightsail prod.
#
# Why this is separate from deploy-seo.sh: the library is ~4,500 small files and
# deploy-seo.sh does not ship kb/ at all. Uncompressed `tar cf` then a single scp
# is dramatically faster here than scp -r over thousands of files, and gzip on
# Windows has been observed to be pathologically slow on this tree.
#
# Usage: bash deploy-kbeauty.sh [--no-build] [--no-indexnow]
set -euo pipefail

IP="${KP_PROD_IP:-18.207.55.50}"
PEM="${KP_PEM:-/c/Users/juksu/Documents/blog/koreaplus-lifes/LightsailDefaultKey-us-east-1.pem}"
REMOTE="/opt/bitnami/wordpress/guide"
SSH="ssh -i $PEM -o StrictHostKeyChecking=no bitnami@$IP"
TAR_LOCAL="/c/tmp/kb.tar"

DO_BUILD=1; DO_INDEXNOW=1
for a in "$@"; do
  case "$a" in
    --no-build) DO_BUILD=0 ;;
    --no-indexnow) DO_INDEXNOW=0 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

[ -f "$PEM" ] || { echo "PEM not found at $PEM — set KP_PEM" >&2; exit 1; }
mkdir -p /c/tmp

if [ "$DO_BUILD" = "1" ]; then
  echo "==> Building library…"
  node build-kbeauty-pages.cjs
fi

# Refuse to ship a half-built tree. A partial deploy is worse than no deploy:
# the sitemap would advertise URLs that 404.
PAGES=$(find kb -name '*.html' | wc -l | tr -d ' ')
SITEMAP_URLS=$(grep -c '<loc>' kbeauty-sitemap.xml)
echo "==> Local: $PAGES html files, $SITEMAP_URLS sitemap URLs"
[ "$PAGES" -gt 4000 ] || { echo "ABORT: only $PAGES pages on disk — build looks incomplete" >&2; exit 1; }

echo "==> Tarring kb/ (uncompressed — fastest for this tree)…"
rm -f "$TAR_LOCAL"
tar cf "$TAR_LOCAL" kb kbeauty-sitemap.xml

echo "==> Uploading $(du -h "$TAR_LOCAL" | cut -f1)…"
scp -i "$PEM" -o StrictHostKeyChecking=no "$TAR_LOCAL" "bitnami@$IP:/tmp/kb.tar"

echo "==> Extracting on prod…"
$SSH "sudo tar xf /tmp/kb.tar -C $REMOTE && sudo chown -R bitnami:daemon $REMOTE/kb $REMOTE/kbeauty-sitemap.xml && rm -f /tmp/kb.tar && echo EXTRACTED"

# Apache (running as daemon) 403s everything under a directory that is not
# world-traversable. tar recreates dirs with the local Windows perms, so this
# is not optional — and it must end with zero stragglers.
echo "==> Fixing permissions…"
$SSH '
  for i in 1 2 3; do
    sudo chmod -R a+rX '"$REMOTE"'/kb
    left=$(sudo find '"$REMOTE"'/kb -type d ! -perm -001 | wc -l)
    echo "pass $i: $left non-traversable dirs remain"
    [ "$left" = "0" ] && break
  done
  sudo chmod a+r '"$REMOTE"'/kbeauty-sitemap.xml
  bad=$(sudo find '"$REMOTE"'/kb -type d ! -perm -001 | head; sudo find '"$REMOTE"'/kb -type f ! -perm -004 | head)
  [ -z "$bad" ] && echo PERMS_OK || { echo "PERMS_FAIL: $bad"; exit 1; }
'

echo "==> Verifying live…"
REMOTE_PAGES=$($SSH "sudo find $REMOTE/kb -name '*.html' | wc -l" | tr -d ' \r')
echo "prod has $REMOTE_PAGES html files (local $PAGES)"
[ "$REMOTE_PAGES" -ge "$PAGES" ] || echo "WARNING: prod has fewer files than local"

for u in "/guide/kb/" "/guide/kb/ingredient/niacinamide.html" "/kbeauty-sitemap.xml"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://koreaplus-lifes.com$u")
  echo "  $code  $u"
done

if [ "$DO_INDEXNOW" = "1" ]; then
  echo "==> IndexNow ping…"
  node indexnow-submit.cjs || true
fi

echo "==> Done."
