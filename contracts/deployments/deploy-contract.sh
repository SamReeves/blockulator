#!/bin/bash

# One-Shot Contract Deployment
# Usage: ./deploy-contract.sh <contract-path> [contract-name]
# Example: ./deploy-contract.sh ../src/games/dice_gods.vy DICE_GODS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "         ⚡ CONTRACT DEPLOYMENT UTILITY ⚡"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Step 1: Compile
echo -e "${GREEN}Step 1: Compiling contract...${NC}"
"$SCRIPT_DIR/compile-and-prepare.sh" "$@"

if [ $? -ne 0 ]; then
    echo -e "${RED}Compilation failed!${NC}"
    exit 1
fi

# Step 2: Check if server is running
echo ""
echo -e "${GREEN}Step 2: Checking local server...${NC}"

if ! curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Local server not running on port 8000${NC}"
    echo -e "${BLUE}Starting server in background...${NC}"
    
    # Check if Python is available
    if command -v python3 &> /dev/null; then
        cd "$SCRIPT_DIR/../.."
        nohup python3 -m http.server 8000 > /tmp/blockulator-server.log 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > /tmp/blockulator-server.pid
        sleep 2
        echo -e "${GREEN}✓${NC} Server started (PID: $SERVER_PID)"
    else
        echo -e "${RED}❌ Python3 not found. Please start a local server on port 8000${NC}"
        echo "Example: python3 -m http.server 8000"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Server is running"
fi

# Step 3: Open deployment page
echo ""
echo -e "${GREEN}Step 3: Opening deployment page...${NC}"

DEPLOY_URL="http://localhost:8000/contracts/deployments/deploy.html"

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open "$DEPLOY_URL" 2>/dev/null || true
elif command -v open &> /dev/null; then
    open "$DEPLOY_URL" 2>/dev/null || true
else
    echo -e "${YELLOW}Could not auto-open browser${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Ready to Deploy!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Open: ${BLUE}$DEPLOY_URL${NC}"
echo -e "  2. Connect MetaMask"
echo -e "  3. Deploy contract"
echo -e "  4. Run: ${GREEN}./update-addresses.sh${NC} to update addresses.js"
echo ""
echo -e "${YELLOW}Note:${NC} Keep this terminal open or note the deployment info"
echo ""

