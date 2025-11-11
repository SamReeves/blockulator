#!/bin/bash

# Pre-Deployment Checklist Script
# Verifies everything is ready for zero-fee protocol deployment

set -e

echo "🔍 ═══════════════════════════════════════════════════════"
echo "🔍  ZERO-FEE PROTOCOL PRE-DEPLOYMENT CHECKLIST"
echo "🔍 ═══════════════════════════════════════════════════════"
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check 1: Node.js installed
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    success "Node.js installed: $NODE_VERSION"
else
    error "Node.js not installed!"
fi
echo ""

# Check 2: npm installed
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    success "npm installed: $NPM_VERSION"
else
    error "npm not installed!"
fi
echo ""

# Check 3: ethers.js installed
echo "📚 Checking ethers.js..."
if [ -f "package.json" ]; then
    if grep -q "ethers" package.json; then
        success "ethers.js found in package.json"
    else
        error "ethers.js not in package.json! Run: npm install ethers@5.7.2"
    fi
else
    warning "package.json not found in current directory"
fi
echo ""

# Check 4: Vyper installed
echo "🐍 Checking Vyper compiler..."
if command -v vyper &> /dev/null; then
    VYPER_VERSION=$(vyper --version)
    success "Vyper installed: $VYPER_VERSION"
else
    error "Vyper not installed! See: https://docs.vyperlang.org/en/stable/installing-vyper.html"
fi
echo ""

# Check 5: Build directory exists
echo "🏗️  Checking compiled contracts..."
if [ -d "contracts/build/abis" ] && [ -d "contracts/build/bytecode" ]; then
    ABI_COUNT=$(ls -1 contracts/build/abis/*.json 2>/dev/null | wc -l)
    BYTECODE_COUNT=$(ls -1 contracts/build/bytecode/*.json 2>/dev/null | wc -l)
    
    if [ "$ABI_COUNT" -gt 0 ] && [ "$BYTECODE_COUNT" -gt 0 ]; then
        success "Contracts compiled: $ABI_COUNT ABIs, $BYTECODE_COUNT bytecode files"
    else
        error "Contracts not compiled! Run: ./contracts/deployments/compile-and-prepare.sh"
    fi
else
    error "Build directory missing! Run: ./contracts/deployments/compile-and-prepare.sh"
fi
echo ""

# Check 6: Environment variables
echo "🔐 Checking environment variables..."
if [ -z "$PRIVATE_KEY" ]; then
    error "PRIVATE_KEY not set! Run: export PRIVATE_KEY=your_key_here"
else
    success "PRIVATE_KEY is set"
fi

if [ -z "$RPC_URL" ]; then
    warning "RPC_URL not set (will use default Sepolia RPC)"
else
    success "RPC_URL is set: $RPC_URL"
fi

if [ -z "$NETWORK" ]; then
    info "NETWORK not set (will use default: sepolia)"
else
    success "NETWORK is set: $NETWORK"
fi
echo ""

# Check 7: Verify zero-fee constants in source files
echo "💰 Verifying zero-fee constants in contracts..."

check_fee_in_file() {
    local file=$1
    local pattern=$2
    local expected=$3
    local description=$4
    
    if [ -f "$file" ]; then
        if grep -q "$pattern.*$expected" "$file"; then
            success "$description"
        else
            error "$description - Expected: $expected"
        fi
    else
        warning "$description - File not found: $file"
    fi
}

check_fee_in_file "contracts/src/market/future_factory.vy" "CREATION_FEE_PERCENT" "0" "Future Factory creation fee = 0"
check_fee_in_file "contracts/src/market/future_factory.vy" "MARKET_FEE_PERCENT" "0" "Future Factory market fee = 0"
check_fee_in_file "contracts/src/discussions/board.vy" "BOARD_FEE_PERCENT" "0" "Discussion Board fee = 0"
check_fee_in_file "contracts/src/games/time_to_make_the_donuts.vy" "WINNER_PERCENTAGE" "100" "Time to Make the Donuts winner = 100%"
check_fee_in_file "contracts/src/games/last_call.vy" "WINNER_PERCENTAGE" "100" "Last Call winner = 100%"

echo ""

# Check 8: Verify withdrawal functions removed
echo "🚫 Verifying withdrawal functions removed..."

check_no_withdrawal() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        if grep -q "def withdraw" "$file"; then
            error "$description still has withdrawal function!"
        else
            success "$description - No withdrawal function ✓"
        fi
    fi
}

check_no_withdrawal "contracts/src/market/future_factory.vy" "Future Factory"
check_no_withdrawal "contracts/src/discussions/board.vy" "Discussion Board"
check_no_withdrawal "contracts/src/content/content_factory.vy" "Content Factory"
check_no_withdrawal "contracts/src/identity/badge_factory.vy" "Badge Factory"
check_no_withdrawal "contracts/src/games/message_board.vy" "Message Board"

echo ""

# Check 9: Verify deployment scripts exist
echo "📜 Checking deployment scripts..."
if [ -f "contracts/deployments/deploy-zero-fee-complete.js" ]; then
    success "Complete deployment script exists"
else
    error "Complete deployment script missing!"
fi

if [ -f "contracts/deployments/deploy-games-only.js" ]; then
    success "Games-only deployment script exists"
else
    warning "Games-only deployment script missing"
fi
echo ""

# Check 10: Git status (optional)
echo "📋 Git status..."
if command -v git &> /dev/null; then
    if [ -d ".git" ]; then
        UNCOMMITTED=$(git status --porcelain | wc -l)
        if [ "$UNCOMMITTED" -gt 0 ]; then
            warning "$UNCOMMITTED uncommitted changes detected"
            info "Consider committing changes before deploying"
        else
            success "Working directory clean"
        fi
    else
        info "Not a git repository"
    fi
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════"
echo "📊 SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    success "All checks passed! Ready to deploy! 🚀"
    echo ""
    echo "To deploy:"
    echo "  Complete protocol: node contracts/deployments/deploy-zero-fee-complete.js"
    echo "  Games only:        node contracts/deployments/deploy-games-only.js"
elif [ $ERRORS -eq 0 ]; then
    warning "$WARNINGS warnings detected"
    echo ""
    echo "⚠️  You can proceed with deployment, but review the warnings above."
else
    error "$ERRORS errors, $WARNINGS warnings detected"
    echo ""
    echo "❌ Fix the errors above before deploying!"
    exit 1
fi

echo ""

