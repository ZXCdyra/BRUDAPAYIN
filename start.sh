#!/bin/sh
set -e

export API_ORIGIN="${API_ORIGIN:-http://localhost:3001}"

echo "Starting BrudaPay platform..."

echo "Running Prisma migrations..."

# Resolve stuck failed migrations (Prisma error P3009 blocks all new migrations).
# migrate resolve is idempotent-safe here: unknown/applied migrations just error out and are ignored.
./node_modules/.bin/prisma migrate resolve --rolled-back 20260415000000_payout_pool_referral --schema=packages/prisma/prisma/schema.prisma 2>&1 || true

./node_modules/.bin/prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1 || true

echo "Database ready."

# Build NestJS API if missing
if [ ! -f "apps/api/dist/main.js" ]; then
  echo "NestJS API not built, building dependencies..."

  npm run build --workspace=@p2p/config 2>&1
  npm run build --workspace=@p2p/shared 2>&1
  ./node_modules/.bin/prisma generate --schema=packages/prisma/prisma/schema.prisma 2>&1

  echo "Building NestJS API..."
  npm run build --workspace=apps/api 2>&1

  if [ ! -f "apps/api/dist/main.js" ]; then
    echo "NestJS API build FAILED. Exiting."
    exit 1
  fi
  echo "NestJS API built successfully"
else
  echo "NestJS API already built"
fi

# Start NestJS API on port 3001
echo "Starting NestJS API (port 3001)..."
node apps/api/dist/main.js &
API_PID=$!

echo "Waiting for API to start..."
sleep 5

if kill -0 $API_PID 2>/dev/null; then
  echo "NestJS API running (PID: $API_PID)"
else
  echo "NestJS API failed to start"
  exit 1
fi

# Start Next.js standalone server on $PORT
WEB_STANDALONE_DIR="apps/web/.next/standalone"

if [ ! -f "$WEB_STANDALONE_DIR/server.js" ]; then
  echo "Next.js standalone server not found at $WEB_STANDALONE_DIR/server.js. Exiting."
  exit 1
fi

# Copy static assets into the standalone bundle
mkdir -p "$WEB_STANDALONE_DIR/.next"
rm -rf "$WEB_STANDALONE_DIR/.next/static" "$WEB_STANDALONE_DIR/public"
cp -r apps/web/.next/static "$WEB_STANDALONE_DIR/.next/static"
if [ -d apps/web/public ]; then
  cp -r apps/web/public "$WEB_STANDALONE_DIR/public"
fi

echo "Starting Next.js (standalone server on port $PORT)..."
cd "$WEB_STANDALONE_DIR"
exec node server.js
