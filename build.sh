#!/usr/bin/env bash
set -e

echo "=== Viktor RAG Build Script ==="

# 1. Install Node.js dependencies and build frontend
echo ">>> Installing Node.js dependencies..."
npm install

echo ">>> Building Vite frontend..."
npm run build

echo ">>> Frontend built successfully in dist/"

# 2. Install Python dependencies
echo ">>> Installing Python dependencies..."
pip install -r backend-py/requirements.txt

echo "=== Build complete ==="
