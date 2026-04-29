# Setup script for Playwright E2E testing (PowerShell)
# This script helps developers get started with E2E tests on Windows

$ErrorActionPreference = "Stop"

Write-Host "🎭 Setting up Playwright E2E Testing" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js >= 18" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Install Playwright browsers
Write-Host "🌐 Installing Playwright browsers..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes on first run..." -ForegroundColor Gray
npx playwright install --with-deps

Write-Host ""
Write-Host "✅ Playwright setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Quick Start Commands:" -ForegroundColor Cyan
Write-Host "   npm run test:e2e          - Run all E2E tests"
Write-Host "   npm run test:e2e:ui       - Run tests in interactive UI mode"
Write-Host "   npm run test:e2e:headed   - Run tests with visible browser"
Write-Host "   npm run test:e2e:debug    - Run tests in debug mode"
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   tests/e2e/README.md       - Full E2E testing documentation"
Write-Host "   tests/e2e/TESTING_GUIDE.md - Quick testing guide"
Write-Host ""
Write-Host "🚀 Ready to test! Try running: npm run test:e2e:ui" -ForegroundColor Green
