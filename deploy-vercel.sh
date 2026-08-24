#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🔨 Building web app..."
npm run build:web

echo "📦 Deploying to Vercel (prebuilt)..."
npx vercel deploy --prebuilt --prod
