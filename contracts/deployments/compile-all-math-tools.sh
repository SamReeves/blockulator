#!/bin/bash

# Compile All Math Tool Contracts
# Generates ABIs and bytecode for all pure math functions

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔨 Compiling All Math Tool Contracts${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$SCRIPT_DIR/../src"
BUILD_DIR="$SCRIPT_DIR/../build"

# Create build directories
mkdir -p "$BUILD_DIR/abis"
mkdir -p "$BUILD_DIR/bytecode"

# Arrays of contracts to compile
MATH_CONTRACTS=(
    "tools/math/exp.vy"
    "tools/math/ln.vy"
    "tools/math/sqrt.vy"
    "tools/math/factorial.vy"
    "tools/math/ln_factorial.vy"
    "tools/math/norm_cdf.vy"
    "tools/math/erf.vy"
    "tools/math/atan.vy"
    "tools/math/sinh.vy"
    "tools/math/cosh.vy"
    "tools/math/pow2.vy"
    "tools/math/pow10.vy"
    "tools/math/log2.vy"
    "tools/math/log10.vy"
)

CONSTANT_CONTRACTS=(
    "tools/constants/e.vy"
    "tools/constants/pi.vy"
    "tools/constants/tau.vy"
)

TRIG_CONTRACTS=(
    "tools/trig/sin.vy"
    "tools/trig/cos.vy"
    "tools/trig/tanh.vy"
)

# Function to compile a single contract
compile_contract() {
    local contract_path="$1"
    local full_path="$SRC_DIR/$contract_path"
    local contract_file=$(basename "$contract_path")
    local contract_base="${contract_file%.vy}"
    local contract_kebab=$(echo "$contract_base" | tr '_' '-')
    
    echo -e "${BLUE}📦 Compiling:${NC} $contract_file"
    
    # Compile ABI
    vyper -f abi "$full_path" > "$BUILD_DIR/abis/${contract_kebab}.json"
    
    # Compile bytecode
    local bytecode=$(vyper -f bytecode "$full_path")
    echo "{\"bytecode\":\"$bytecode\"}" > "$BUILD_DIR/bytecode/${contract_kebab}.json"
    
    # Get size
    local size=$((${#bytecode} / 2 - 1))
    echo -e "   ${GREEN}✓${NC} Size: $size bytes"
}

# Compile math tools
echo -e "${YELLOW}📐 Math Tools (14 contracts)${NC}"
echo ""
for contract in "${MATH_CONTRACTS[@]}"; do
    compile_contract "$contract"
done

echo ""
echo -e "${YELLOW}🔢 Constants (3 contracts)${NC}"
echo ""
for contract in "${CONSTANT_CONTRACTS[@]}"; do
    compile_contract "$contract"
done

echo ""
echo -e "${YELLOW}📊 Trigonometry (3 contracts)${NC}"
echo ""
for contract in "${TRIG_CONTRACTS[@]}"; do
    compile_contract "$contract"
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Compilation Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📊 Summary:${NC}"
echo "   Total contracts compiled: 20"
echo "   Math: 14 | Constants: 3 | Trig: 3"
echo ""
echo -e "${YELLOW}📁 Output:${NC}"
echo "   ABIs: $BUILD_DIR/abis/"
echo "   Bytecode: $BUILD_DIR/bytecode/"
echo ""

