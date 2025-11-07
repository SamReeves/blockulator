#!/bin/bash

# Compile and Prepare Contract for Deployment
# Usage: ./compile-and-prepare.sh <contract-path> [contract-name]
# Example: ./compile-and-prepare.sh ../src/games/dice_gods.vy DICE_GODS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if vyper is installed
if ! command -v vyper &> /dev/null; then
    echo -e "${RED}❌ Error: vyper is not installed${NC}"
    echo "Install with: pip install vyper"
    exit 1
fi

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Contract path is required${NC}"
    echo "Usage: $0 <contract-path> [contract-name]"
    echo "Example: $0 ../src/games/dice_gods.vy DICE_GODS"
    exit 1
fi

CONTRACT_PATH="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_FILE=$(basename "$CONTRACT_PATH")
CONTRACT_BASE="${CONTRACT_FILE%.vy}"

# Convert snake_case to kebab-case for file names
CONTRACT_KEBAB=$(echo "$CONTRACT_BASE" | tr '_' '-')

# If contract name not provided, try to infer it
if [ -z "$2" ]; then
    # Convert to SCREAMING_SNAKE_CASE for contract name
    CONTRACT_NAME=$(echo "$CONTRACT_BASE" | tr '[:lower:]' '[:upper:]')
else
    CONTRACT_NAME="$2"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔨 Compiling Contract${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Contract:${NC} $CONTRACT_FILE"
echo -e "${YELLOW}Name:${NC} $CONTRACT_NAME"
echo ""

# Check if contract file exists
if [ ! -f "$CONTRACT_PATH" ]; then
    echo -e "${RED}❌ Error: Contract file not found: $CONTRACT_PATH${NC}"
    exit 1
fi

# Create build directories if they don't exist
mkdir -p "$SCRIPT_DIR/../build/abis"
mkdir -p "$SCRIPT_DIR/../build/bytecode"

# Compile to ABI
echo -e "${BLUE}📝 Generating ABI...${NC}"
ABI_PATH="$SCRIPT_DIR/../build/abis/${CONTRACT_KEBAB}.json"
vyper -f abi "$CONTRACT_PATH" > "$ABI_PATH"
echo -e "${GREEN}✓${NC} ABI saved to: $ABI_PATH"

# Compile to bytecode
echo -e "${BLUE}📦 Generating bytecode...${NC}"
BYTECODE_PATH="$SCRIPT_DIR/../build/bytecode/${CONTRACT_KEBAB}.json"
BYTECODE=$(vyper -f bytecode "$CONTRACT_PATH")
echo "{\"bytecode\":\"$BYTECODE\"}" > "$BYTECODE_PATH"
echo -e "${GREEN}✓${NC} Bytecode saved to: $BYTECODE_PATH"

# Check if contract has @deploy decorator (for blueprints)
if grep -q "@deploy" "$CONTRACT_PATH"; then
    echo -e "${BLUE}🔷 Generating blueprint bytecode (EIP-5202)...${NC}"
    BLUEPRINT_PATH="$SCRIPT_DIR/../build/bytecode/${CONTRACT_KEBAB}-blueprint.json"
    BLUEPRINT_BYTECODE=$(vyper -f blueprint_bytecode "$CONTRACT_PATH")
    echo "{\"bytecode\":\"$BLUEPRINT_BYTECODE\"}" > "$BLUEPRINT_PATH"
    echo -e "${GREEN}✓${NC} Blueprint bytecode saved to: $BLUEPRINT_PATH"
fi

# Get bytecode size
BYTECODE_SIZE=$((${#BYTECODE} / 2 - 1))
echo -e "${YELLOW}📊 Contract size:${NC} $BYTECODE_SIZE bytes"

if [ $BYTECODE_SIZE -gt 24576 ]; then
    echo -e "${RED}⚠️  Warning: Contract size exceeds 24KB limit!${NC}"
fi

# Create deployment config
DEPLOY_CONFIG="$SCRIPT_DIR/deploy-config.json"
cat > "$DEPLOY_CONFIG" << EOF
{
  "contractName": "$CONTRACT_NAME",
  "contractFile": "$CONTRACT_FILE",
  "abiPath": "contracts/build/abis/${CONTRACT_KEBAB}.json",
  "bytecodePath": "contracts/build/bytecode/${CONTRACT_KEBAB}.json",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo -e "${GREEN}✅ Compilation complete!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Next Steps${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}1.${NC} Open the deployment page:"
echo -e "   ${BLUE}http://localhost:8000/contracts/deployments/deploy.html${NC}"
echo -e "${YELLOW}2.${NC} Connect your MetaMask wallet"
echo -e "${YELLOW}3.${NC} Click 'Deploy Contract'"
echo -e "${YELLOW}4.${NC} Confirm the transaction in MetaMask"
echo ""
echo -e "${YELLOW}💡 Tip:${NC} Make sure you're on the correct network in MetaMask!"
echo ""

