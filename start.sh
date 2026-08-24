#!/bin/sh
set -e

echo "🚀 Starting BrudaPay platform..."

# Run Prisma migrations (handle "database not empty" gracefully)
echo "📦 Running Prisma migrations..."
MIGRATE_OUTPUT=$(npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1) || true
if echo "$MIGRATE_OUTPUT" | grep -q "not empty"; then
  echo "⚠️  Database already has data, baseling existing migrations..."
  # Mark all existing migrations as applied
  npx prisma migrate resolve --applied --schema=packages/prisma/prisma/schema.prisma 2>&1 || true
  # Try deploy again
  npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1 || true
fi

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
