#!/bin/sh
set -e

export API_ORIGIN="${API_ORIGIN:-http://localhost:3001}"

echo "Starting BrudaPay platform..."

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1 || true

echo "Database ready."

# Build NestJS API if missing
if [ ! -f "apps/api/dist/main.js" ]; then
  echo "NestJS API not built, building dependencies..."
  
  npm run build --workspace=@p2p/config 2>&1
  npm run build --workspace=@p2p/shared 2>&1
  npx prisma generate --schema=packages/prisma/prisma/schema.prisma 2>&1
  
  echo "Building NestJS API..."
  cd apps/api
  ../../../node_modules/.bin/nest build 2>&1
  cd ../..
  
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

# Start Next.js on PORT
echo "Starting Next.js (standalone server on port $PORT)..."
exec node server.js
