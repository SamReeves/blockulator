#!/bin/bash

# ============================================================================
# Compile ContentFactoryV4 System
# ============================================================================
# This script compiles:
# - TextContentV4 (new blueprint)
# - ContentFactoryV4 (unified factory)
# - Reuses ImageContentV3 from V3 deployment
# ============================================================================

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         Compiling ContentFactoryV4 System                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Paths
SRC_DIR="../src/content"
BUILD_DIR="../build"
BYTECODE_DIR="$BUILD_DIR/bytecode"
ABIS_DIR="$BUILD_DIR/abis"

# Create build directories
mkdir -p "$BYTECODE_DIR"
mkdir -p "$ABIS_DIR"

# ============================================================================
# STEP 1: Compile TextContentV4 Blueprint
# ============================================================================

echo "─────────────────────────────────────────────────────────────"
echo "STEP 1: Compile TextContentV4 Blueprint"
echo "─────────────────────────────────────────────────────────────"

vyper "$SRC_DIR/text_content_v4.vy" -f blueprint_bytecode > "$BYTECODE_DIR/text_content_v4.bin"
vyper "$SRC_DIR/text_content_v4.vy" -f abi > "$ABIS_DIR/text_content_v4.json"

echo "✅ TextContentV4 compiled"
echo "   Bytecode: $BYTECODE_DIR/text_content_v4.bin"
echo "   ABI: $ABIS_DIR/text_content_v4.json"
echo "   (Blueprint preamble will be added during deployment)"

# ============================================================================
# STEP 2: Compile ContentFactoryV4
# ============================================================================

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "STEP 2: Compile ContentFactoryV4"
echo "─────────────────────────────────────────────────────────────"

vyper "$SRC_DIR/content_factory_v4.vy" -f bytecode > "$BYTECODE_DIR/content_factory_v4.bin"
vyper "$SRC_DIR/content_factory_v4.vy" -f abi > "$ABIS_DIR/content_factory_v4.json"

echo "✅ ContentFactoryV4 compiled"
echo "   Bytecode: $BYTECODE_DIR/content_factory_v4.bin"
echo "   ABI: $ABIS_DIR/content_factory_v4.json"

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✨ COMPILATION COMPLETE ✨                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "📦 Compiled Contracts:"
echo "  • TextContentV4 (blueprint)"
echo "  • ContentFactoryV4 (factory)"
echo ""

echo "📝 File Sizes:"
ls -lh "$BYTECODE_DIR/text_content_v4.bin"
ls -lh "$BYTECODE_DIR/content_factory_v4.bin"
echo ""

echo "✅ Ready for deployment!"
echo "   Run: node deploy-v4.js"
echo ""

