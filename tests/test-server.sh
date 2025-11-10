#!/bin/bash
# Quick test server script

echo "🐋 Starting WhaleGames local server..."
echo "Press Ctrl+C to stop"
echo ""

if command -v python3 &> /dev/null; then
    echo "Using Python 3 server on http://localhost:8000"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python 2 server on http://localhost:8000"
    python -m SimpleHTTPServer 8000
elif command -v php &> /dev/null; then
    echo "Using PHP server on http://localhost:8000"
    php -S localhost:8000
else
    echo "❌ No suitable server found. Install Python or PHP, or run:"
    echo "   npx http-server -p 8000"
    exit 1
fi
