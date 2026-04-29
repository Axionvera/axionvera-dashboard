#!/bin/bash

# Setup script for Playwright E2E testing
# This script helps developers get started with E2E tests

set -e

echo "🎭 Setting up Playwright E2E Testing"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
echo "   This may take a few minutes on first run..."
npx playwright install --with-deps

echo ""
echo "✅ Playwright setup complete!"
echo ""
echo "📚 Quick Start Commands:"
echo "   npm run test:e2e          - Run all E2E tests"
echo "   npm run test:e2e:ui       - Run tests in interactive UI mode"
echo "   npm run test:e2e:headed   - Run tests with visible browser"
echo "   npm run test:e2e:debug    - Run tests in debug mode"
echo ""
echo "📖 Documentation:"
echo "   tests/e2e/README.md       - Full E2E testing documentation"
echo "   tests/e2e/TESTING_GUIDE.md - Quick testing guide"
echo ""
echo "🚀 Ready to test! Try running: npm run test:e2e:ui"
