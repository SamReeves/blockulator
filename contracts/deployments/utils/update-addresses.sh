#!/bin/bash

# Update addresses.js with deployed contract address
# Usage: ./update-addresses.sh <contract-name> <address> [network]
# Example: ./update-addresses.sh DICE_GODS 0x1234...5678 sepolia

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADDRESSES_FILE="$SCRIPT_DIR/addresses.js"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}❌ Error: Contract name and address required${NC}"
    echo "Usage: $0 <contract-name> <address> [network]"
    echo "Example: $0 DICE_GODS 0x1234567890123456789012345678901234567890 sepolia"
    exit 1
fi

CONTRACT_NAME="$1"
ADDRESS="$2"
NETWORK="${3:-sepolia}"

# Validate address format
if [[ ! "$ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}❌ Error: Invalid Ethereum address format${NC}"
    echo "Address must be 42 characters starting with 0x"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📝 Updating Addresses${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Contract:${NC} $CONTRACT_NAME"
echo -e "${YELLOW}Address:${NC} $ADDRESS"
echo -e "${YELLOW}Network:${NC} $NETWORK"
echo ""

# Check if addresses.js exists
if [ ! -f "$ADDRESSES_FILE" ]; then
    echo -e "${RED}❌ Error: addresses.js not found at $ADDRESSES_FILE${NC}"
    exit 1
fi

# Create backup
BACKUP_FILE="${ADDRESSES_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ADDRESSES_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓${NC} Created backup: $BACKUP_FILE"

# Determine which section to update
if [ "$NETWORK" = "sepolia" ]; then
    SECTION="SEPOLIA_ADDRESSES"
elif [ "$NETWORK" = "mainnet" ]; then
    SECTION="MAINNET_ADDRESSES"
else
    echo -e "${RED}❌ Error: Unknown network. Use 'sepolia' or 'mainnet'${NC}"
    exit 1
fi

# Update the address using sed
# Look for the pattern: CONTRACT_NAME: '0x...'
if grep -q "${CONTRACT_NAME}:" "$ADDRESSES_FILE"; then
    # Pattern exists, replace it
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed
        sed -i '' "/${SECTION}/,/^};/ s/${CONTRACT_NAME}: '0x[a-fA-F0-9]*'/${CONTRACT_NAME}: '${ADDRESS}'/" "$ADDRESSES_FILE"
    else
        # Linux sed
        sed -i "/${SECTION}/,/^};/ s/${CONTRACT_NAME}: '0x[a-fA-F0-9]*'/${CONTRACT_NAME}: '${ADDRESS}'/" "$ADDRESSES_FILE"
    fi
    echo -e "${GREEN}✓${NC} Updated existing address"
else
    echo -e "${YELLOW}⚠️  Contract name not found in addresses.js${NC}"
    echo -e "${YELLOW}Please manually add:${NC}"
    echo -e "${BLUE}${CONTRACT_NAME}: '${ADDRESS}',${NC}"
    echo ""
    exit 1
fi

# Verify the update
if grep -q "${CONTRACT_NAME}: '${ADDRESS}'" "$ADDRESSES_FILE"; then
    echo -e "${GREEN}✅ Address updated successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Updated line:${NC}"
    grep "${CONTRACT_NAME}:" "$ADDRESSES_FILE" | head -1
    echo ""
else
    echo -e "${RED}❌ Update verification failed${NC}"
    echo -e "${YELLOW}Restoring backup...${NC}"
    mv "$BACKUP_FILE" "$ADDRESSES_FILE"
    exit 1
fi

# Log deployment
DEPLOY_LOG="$SCRIPT_DIR/deployments.log"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | $NETWORK | $CONTRACT_NAME | $ADDRESS" >> "$DEPLOY_LOG"
echo -e "${GREEN}✓${NC} Logged to deployments.log"

echo ""
echo -e "${GREEN}🎉 Done!${NC}"
echo ""

