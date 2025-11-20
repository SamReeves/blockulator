#!/bin/bash

# Compile V3 Compression Contracts

set -e

# Navigate to contracts root directory (parent of deployments)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "🔨 Compiling V3 Compression Contracts..."

# Check if vyper is installed
if ! command -v vyper &> /dev/null; then
    echo "❌ Vyper not found. Please install: pip install vyper"
    exit 1
fi

# Check vyper version
VYPER_VERSION=$(vyper --version)
echo "📦 Using Vyper: $VYPER_VERSION"

# Create output directories
mkdir -p build/abis
mkdir -p build/bytecode

echo ""
echo "📝 Compiling ImageContentV3 (Blueprint)..."
vyper --evm-version paris \
      -f abi \
      src/content/image_content_v3.vy > build/abis/image_content_v3.json

# Get runtime bytecode (not initcode) for blueprint
vyper --evm-version paris \
      -f bytecode_runtime \
      src/content/image_content_v3.vy > build/bytecode/image_content_v3_runtime.bin

# Prepare blueprint with EIP-5202 preamble
node deployments/prepare-blueprint.js

echo "✅ ImageContentV3 compiled (blueprint ready)"

echo ""
echo "📝 Compiling ContentFactoryV3..."
vyper --evm-version paris \
      -f abi \
      src/content/content_factory_v3.vy > build/abis/content_factory_v3.json

vyper --evm-version paris \
      -f bytecode \
      src/content/content_factory_v3.vy > build/bytecode/content_factory_v3.bin

echo "✅ ContentFactoryV3 compiled"

echo ""
echo "📊 Contract Sizes:"
echo "ImageContentV3:    $(wc -c < build/bytecode/image_content_v3.bin) bytes"
echo "ContentFactoryV3:  $(wc -c < build/bytecode/content_factory_v3.bin) bytes"

echo ""
echo "🎉 Compilation complete!"
echo "   ABIs:      build/abis/"
echo "   Bytecode:  build/bytecode/"

