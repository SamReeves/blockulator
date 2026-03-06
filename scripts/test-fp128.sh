#!/bin/bash
set -e

echo "==> Compiling FP128 Huff contracts..."
./contracts/deployments/compile-huff.sh contracts/src/tools/huff/fp128/test_fp128.huff

echo ""
echo "==> Running FP128 tests..."
forge test --match-contract FP128Test -vv "$@"
