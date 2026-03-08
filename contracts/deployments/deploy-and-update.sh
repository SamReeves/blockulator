#!/bin/bash

# Deploy FP128 contract and update contract registry
# Usage: PRIVATE_KEY=your_key ./deploy-and-update.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  FP128 Deployment Pipeline${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Step 1: Compile
echo -e "${YELLOW}Step 1: Compiling contract...${NC}"
./contracts/deployments/compile-huff.sh contracts/src/tools/huff/fp128/test_fp128.huff

# Verify bytecode size
RUNTIME_BYTES=$(( $(wc -c < contracts/build/huff/test_fp128.runtime.bin) / 2 ))
echo -e "${GREEN}✓ Runtime bytecode: ${RUNTIME_BYTES} bytes${NC}"

if [ $RUNTIME_BYTES -ge 24576 ]; then
    echo -e "${RED}✗ Error: Bytecode exceeds EVM limit (24,576 bytes)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Under EVM limit by $((24576 - RUNTIME_BYTES)) bytes${NC}\n"

# Step 2: Deploy
echo -e "${YELLOW}Step 2: Deploying to Sepolia...${NC}"
DEPLOY_OUTPUT=$(node contracts/deployments/deploy-fixedpoint128.js)
echo "$DEPLOY_OUTPUT"

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Contract Address:" | awk '{print $4}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}✗ Failed to extract contract address${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ Contract deployed at: ${CONTRACT_ADDRESS}${NC}\n"

# Step 3: Update contract registry
echo -e "${YELLOW}Step 3: Updating contract registry...${NC}"

# Use sed to update the Sepolia address in contract-registry.js
sed -i "s/sepolia: 'PENDING_DEPLOYMENT'/sepolia: '${CONTRACT_ADDRESS}'/" js/infrastructure/config/contract-registry.js

echo -e "${GREEN}✓ Contract registry updated${NC}\n"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "📍 Contract Address: ${GREEN}${CONTRACT_ADDRESS}${NC}"
echo -e "🔗 Sepolia Explorer: https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}"
echo -e "📝 Bytecode Size: ${RUNTIME_BYTES} bytes ($(( (24576 - RUNTIME_BYTES) * 100 / 24576 ))% under limit)\n"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Test the contract at: http://localhost:8000/#/fp128"
echo -e "  2. Verify on Etherscan (optional)"
echo -e "  3. Update mainnet address when ready for production\n"
