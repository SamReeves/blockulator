#!/usr/bin/env bash
# Refresh SDR design system assets from upstream securedataresearch.net.
# Run manually when the parent design system updates.

set -euo pipefail

UPSTREAM="https://securedataresearch.net/lib"
DEST="$(dirname "$0")/../vendor/sdr/lib"

mkdir -p "$DEST/particles"

echo "Syncing SDR tokens and particles from $UPSTREAM..."

curl -sSf "$UPSTREAM/tokens.css"           -o "$DEST/tokens.css"
curl -sSf "$UPSTREAM/tokens.js"            -o "$DEST/tokens.js"
curl -sSf "$UPSTREAM/particles/index.js"   -o "$DEST/particles/index.js"
curl -sSf "$UPSTREAM/particles/palette.js" -o "$DEST/particles/palette.js"
curl -sSf "$UPSTREAM/particles/config.js"  -o "$DEST/particles/config.js"

echo "Done. Files updated:"
ls -lh "$DEST"/*.* "$DEST/particles/"
