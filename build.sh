#!/usr/bin/env bash
# Build script for Render deployment
set -o errexit  # exit on error

echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "🗄️  Creating database tables & seeding admin..."
cd backend
python create_tables.py
cd ..

echo "✅ Build complete!"
