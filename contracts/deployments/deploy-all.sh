#!/bin/bash

# Complete Deployment Script for Discussion Board System
# This script compiles and deploys both contracts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🐋 WhaleGames - Discussion Board Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v vyper &> /dev/null; then
    echo -e "${RED}❌ Error: vyper is not installed${NC}"
    echo "Install with: pip install vyper==0.4.3"
    exit 1
fi

VYPER_VERSION=$(vyper --version | head -n 1)
echo -e "${GREEN}✓${NC} Vyper found: $VYPER_VERSION"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: node is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node.js found: $NODE_VERSION"

if [ ! -f "$SCRIPT_DIR/deploy-discussions.js" ]; then
    echo -e "${RED}❌ Error: deploy-discussions.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Deployment script found"
echo ""

# Step 1: Compile Discussion (Blueprint)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📝 Step 1: Compiling Discussion Contract (Blueprint)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

"$SCRIPT_DIR/compile-and-prepare.sh" "$SCRIPT_DIR/../src/discussions/discussion.vy" DISCUSSION

# Verify blueprint bytecode was generated
if [ ! -f "$SCRIPT_DIR/../build/bytecode/discussion-blueprint.json" ]; then
    echo -e "${RED}❌ Error: Blueprint bytecode not generated!${NC}"
    echo "The discussion contract must have @deploy decorator"
    exit 1
fi

echo ""

# Step 2: Compile Board
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📝 Step 2: Compiling Board Contract${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

"$SCRIPT_DIR/compile-and-prepare.sh" "$SCRIPT_DIR/../src/discussions/board.vy" BOARD

echo ""

# Check if deployment config is set
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔍 Step 3: Checking Deployment Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if grep -q "YOUR_INFURA_KEY" "$SCRIPT_DIR/deploy-discussions.js" || grep -q "YOUR_PRIVATE_KEY" "$SCRIPT_DIR/deploy-discussions.js"; then
    echo -e "${YELLOW}⚠️  Warning: Deployment configuration not set!${NC}"
    echo ""
    echo "Please edit deploy-discussions.js and set:"
    echo "  - RPC_URL (line 11)"
    echo "  - PRIVATE_KEY (line 12)"  
    echo "  - NETWORK (line 13)"
    echo ""
    echo -e "${RED}Cannot proceed with deployment.${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tip: Use environment variables for security:${NC}"
    echo "  export DEPLOYER_PRIVATE_KEY='0x...'"
    echo "  export RPC_URL='https://...'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} Deployment configuration appears to be set"
echo ""

# Step 4: Deploy
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 Step 4: Deploying to Network${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}This will:${NC}"
echo "  1. Deploy Discussion Blueprint (EIP-5202) to network"
echo "  2. Deploy Discussion Board factory contract"
echo "  3. Verify deployment"
echo "  4. Save addresses to addresses.js"
echo ""

# Prompt for confirmation
read -p "$(echo -e ${YELLOW}Continue with deployment? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
node "$SCRIPT_DIR/deploy-discussions.js"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Verify contracts on Etherscan (if mainnet/testnet)"
echo "  2. Update frontend config if needed"
echo "  3. Test creating a discussion"
echo ""

