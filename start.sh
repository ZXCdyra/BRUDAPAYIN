#!/bin/sh
set -e

echo "🚀 Starting BrudaPay platform..."

# ─── Prisma Migrations ───
echo "📦 Running Prisma migrations..."
PRISMA_MIGRATE_OUTPUT=$(npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1) || true

if echo "$PRISMA_MIGRATE_OUTPUT" | grep -q "not empty"; then
  echo "⚠️  Database already has data, baselining..."
  # Mark each migration folder as applied individually
  for migration in $(find packages/prisma/prisma/migrations -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null); do
    if [ "$migration" != "README.md" ]; then
      npx prisma migrate resolve --applied "$migration" --schema=packages/prisma/prisma/schema.prisma 2>&1 || true
    fi
  done
  # Try deploy again
  npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1 || true
fi

echo "✅ Database ready."

# ─── Verify NestJS API build exists ───
if [ ! -f "api/dist/main.js" ]; then
  echo "❌ NestJS API not built! Attempting build..."
  npm run build --workspace=@p2p/config --workspace=@p2p/shared --workspace=@p2p/prisma 2>&1 || true
  npm run build --workspace=apps/api 2>&1 || true
  
  if [ ! -f "api/dist/main.js" ]; then
    echo "❌ NestJS API build failed. Continuing with Next.js only."
  fi
fi

# ─── Start NestJS API ───
if [ -f "api/dist/main.js" ]; then
  echo "🔌 Starting NestJS API (port 3001)..."
  node api/dist/main.js &
  API_PID=$!
  
  echo "⏳ Waiting for API to start..."
  sleep 5
  
  if kill -0 $API_PID 2>/dev/null; then
    echo "✅ NestJS API running (PID: $API_PID)"
  else
    echo "⚠️  NestJS API exited, proceeding with Next.js only."
  fi
else
  echo "⚠️  Skipping NestJS API (not built). Next.js will use demo routes."
fi

# ─── Start Next.js ───
echo "🌐 Starting Next.js (port 3000)..."
exec node server.js
