#!/bin/bash

# Build script for DigitalOcean static site deployment
# This copies all necessary static files to the dist directory

echo "🏗️  Building Whale Games for deployment..."

# Clean and create dist directory
rm -rf dist
mkdir -p dist

# Copy HTML files
echo "📄 Copying HTML files..."
cp *.html dist/ 2>/dev/null || true

# Copy JavaScript files
echo "📦 Copying JavaScript files..."
cp -r js dist/

# Copy CSS files
echo "🎨 Copying CSS files..."
cp -r styles dist/
cp styles.css dist/ 2>/dev/null || true

# Copy images and assets
echo "🖼️  Copying images..."
cp *.png dist/ 2>/dev/null || true
cp *.jpg dist/ 2>/dev/null || true
cp *.svg dist/ 2>/dev/null || true
cp *.ico dist/ 2>/dev/null || true

# Copy contract ABIs (needed for the frontend)
echo "📜 Copying contract ABIs..."
mkdir -p dist/contracts/build
cp -r contracts/build/abis dist/contracts/build/

# Copy deployments (needed for contract addresses)
echo "🚀 Copying deployment files..."
cp -r contracts/deployments dist/contracts/

echo "✅ Build completed successfully!"
echo "📁 Output directory: dist/"

