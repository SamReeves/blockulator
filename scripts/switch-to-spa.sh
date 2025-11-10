#!/bin/bash
# Switch from MPA back to SPA architecture

set -e

echo "🔄 Switching to SPA architecture..."
echo ""

# Check if backups exist
if [ ! -f "index-spa-backup.html" ]; then
    echo "❌ No SPA backup found. Cannot restore."
    echo "   You may need to restore from git."
    exit 1
fi

echo "📦 Restoring SPA files from backup..."

# Backup current MPA files
mv index.html index-mpa.html 2>/dev/null || true
mv discussions.html discussions-mpa-temp.html 2>/dev/null || true
mv factory.html factory-mpa.html 2>/dev/null || true
mv badges.html badges-mpa.html 2>/dev/null || true
mv about.html about-mpa.html 2>/dev/null || true

# Copy discussions/index.html back
if [ -f "discussions-mpa-temp.html" ]; then
    mv discussions-mpa-temp.html discussions/index.html
fi

# Restore SPA backups
cp index-spa-backup.html index.html
cp discussions-redirect-backup.html discussions.html 2>/dev/null || true
cp factory-redirect-backup.html factory.html 2>/dev/null || true

echo "✅ SPA restored!"
echo ""
echo "🎉 Done! Your app is now using SPA architecture."
echo ""
echo "Test it:"
echo "  ./test-server.sh"
echo "  Open http://localhost:8000"
echo ""
echo "To switch back to MPA:"
echo "  ./scripts/switch-to-mpa.sh"

