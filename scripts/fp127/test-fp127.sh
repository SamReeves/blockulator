#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "==> Compiling FP127 Huff contracts..."
./contracts/deployments/compile-huff.sh contracts/src/tools/huff/fp127/test_fp127.huff

echo ""
echo "==> Running FP127 tests..."
forge test --match-contract FP127Test -vv "$@"
