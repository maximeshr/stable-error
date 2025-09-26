#!/bin/bash

# Pre-publish script to ensure everything is ready for publishing
set -e

echo "🔍 Running pre-publish checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed. Please install Bun first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# Run linter
echo "🔍 Running linter..."
bun run lint

# Run tests
echo "🧪 Running tests..."
bun test

# Build package
echo "🔨 Building package..."
bun run build

# Check build artifacts
echo "✅ Checking build artifacts..."
if [ ! -f "dist/index.cjs.js" ]; then
    echo "❌ Error: dist/index.cjs.js not found"
    exit 1
fi

if [ ! -f "dist/index.esm.js" ]; then
    echo "❌ Error: dist/index.esm.js not found"
    exit 1
fi

if [ ! -f "dist/index.d.ts" ]; then
    echo "❌ Error: dist/index.d.ts not found"
    exit 1
fi

# Check if version exists on npm
echo "🔍 Checking if version exists on npm..."
VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME=$(node -p "require('./package.json').name")

if npm view "$PACKAGE_NAME@$VERSION" version &> /dev/null; then
    echo "❌ Error: Version $VERSION already exists on npm"
    echo "💡 Consider bumping the version in package.json"
    exit 1
fi

echo "✅ All pre-publish checks passed!"
echo "📦 Package is ready for publishing"
echo "🚀 Version: $VERSION"
echo "📋 Package: $PACKAGE_NAME"
