#!/bin/sh
set -e

echo "🚀 Starting BrudaPay platform..."

# Run Prisma migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma

# Start NestJS API on port 3001 in background
echo "🔌 Starting NestJS API (port 3001)..."
node api/dist/main.js &
API_PID=$!

# Wait for API to be ready
echo "⏳ Waiting for API to start..."
sleep 3

# Verify API is running
if ! kill -0 $API_PID 2>/dev/null; then
  echo "❌ NestJS API failed to start"
  exit 1
fi

echo "✅ NestJS API is running (PID: $API_PID)"

# Start Next.js on port 3000
echo "🌐 Starting Next.js (port 3000)..."
exec node server.js
