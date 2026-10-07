#!/bin/sh
# Builds the site into public/. Used by DigitalOcean App Platform, which has no Zola on its build image.
set -eu
ZOLA_VERSION="0.23.6"
if ! command -v zola >/dev/null 2>&1; then
  curl -sSL "https://github.com/getzola/zola/releases/download/v${ZOLA_VERSION}/zola-v${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz" | tar xz zola
  ZOLA=./zola
else
  ZOLA=zola
fi
"$ZOLA" build
