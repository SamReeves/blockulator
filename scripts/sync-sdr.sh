#!/usr/bin/env bash
# Pull the stylesheet and hero shader from securedataresearch.net so this site
# stays identical in style to the company site. Run when sdr-static changes.
set -euo pipefail
UPSTREAM="https://securedataresearch.net"
DEST="$(cd "$(dirname "$0")/.." && pwd)/static"
curl -sSf "$UPSTREAM/css/site.css" -o "$DEST/css/site.css"
curl -sSf "$UPSTREAM/js/hero.js"   -o "$DEST/js/hero.js"
echo "synced site.css and hero.js from $UPSTREAM"
git -C "$DEST/.." status --short static/css/site.css static/js/hero.js
