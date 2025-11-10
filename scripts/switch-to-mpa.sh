#!/bin/bash
# Switch from SPA to MPA architecture

set -e

echo "🔄 Switching to MPA architecture..."
echo ""

# Check if backups exist
if [ -f "index-spa-backup.html" ]; then
    echo "⚠️  Backups already exist. Remove them first if you want to re-backup."
    echo "   Or use --force to overwrite."
    if [ "$1" != "--force" ]; then
        exit 1
    fi
fi

# Backup SPA files
echo "📦 Backing up SPA files..."
cp index.html index-spa-backup.html
cp discussions.html discussions-redirect-backup.html 2>/dev/null || true
cp factory.html factory-redirect-backup.html 2>/dev/null || true

echo "✅ Backups created:"
echo "   - index-spa-backup.html"
echo "   - discussions-redirect-backup.html"
echo "   - factory-redirect-backup.html"
echo ""

# Switch to MPA
echo "🚀 Activating MPA..."
mv index-mpa.html index.html 2>/dev/null || echo "⚠️  index-mpa.html not found (may already be switched)"
mv discussions/index.html discussions.html 2>/dev/null || echo "⚠️  discussions/index.html not found"
mv factory-mpa.html factory.html 2>/dev/null || echo "⚠️  factory-mpa.html not found"
mv badges-mpa.html badges.html 2>/dev/null || echo "⚠️  badges-mpa.html not found"
mv about-mpa.html about.html 2>/dev/null || echo "⚠️  about-mpa.html not found"

echo "✅ MPA activated!"
echo ""
echo "🎉 Done! Your app is now using MPA architecture."
echo ""
echo "Test it:"
echo "  ./test-server.sh"
echo "  Open http://localhost:8000"
echo ""
echo "To restore SPA:"
echo "  ./scripts/switch-to-spa.sh"

