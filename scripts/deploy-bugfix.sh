#!/bin/bash

# Deploy TransactionHandler bugfix to production
# Run this after verifying the fix works locally

set -e

echo "🐋 Whale Games - Transaction Handler Fix Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Show what's being committed
echo "📝 Files to be committed:"
git status --short js/domain/games/*.js
echo ""

# Confirm
read -p "❓ Ready to commit and push? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Stage the game files
echo "📦 Staging game files..."
git add js/domain/games/dice-gods.js
git add js/domain/games/king-of-the-hill.js
git add js/domain/games/last-call.js
git add js/domain/games/message-board.js
git add js/domain/games/pay-it-backward.js
git add js/domain/games/pay-it-forward.js
git add js/domain/games/pissing-contest.js
git add js/domain/games/satan-moloch-baal.js
git add js/domain/games/time-to-make-the-donuts.js

# Stage documentation
git add BUGFIX_TRANSACTION_HANDLER.md
git add tests/test-module-imports.js

# Commit
echo "💾 Committing changes..."
git commit -m "Fix: Add missing TransactionHandler imports to all games

- Added explicit TransactionHandler imports to 9 game modules
- Fixes 'TransactionHandler is not defined' error
- All games now have proper ES6 module dependencies
- Critical fix for blockchain transaction functionality

Games fixed:
- King of the Hill
- Last Call
- Pissing Contest
- Message Board
- Pay It Forward
- Pay It Backward
- Dice Gods
- Time to Make the Donuts
- Satan, Moloch, Baal

See BUGFIX_TRANSACTION_HANDLER.md for full details."

echo "✅ Changes committed"
echo ""

# Show commit
git log -1 --stat

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Ready to push!"
echo ""
echo "Run: git push origin $CURRENT_BRANCH"
echo ""
echo "After pushing, deploy to production:"
echo "  1. Build: npm run build (if applicable)"
echo "  2. Deploy to whalegames.net"
echo "  3. Test King of the Hill throne claiming"
echo "  4. Verify other games' transaction functions"
echo ""
echo "👑 Then go dethrone that king!"

