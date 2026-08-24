#!/bin/sh
set -e

echo "Starting BrudaPay platform..."

echo "Running Prisma migrations..."
PRISMA_MIGRATE_OUTPUT=$(npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1) || true

if echo "$PRISMA_MIGRATE_OUTPUT" | grep -q "not empty"; then
  echo "Database already has data, baselining..."
  for migration in $(find packages/prisma/prisma/migrations -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null); do
    if [ "$migration" != "README.md" ]; then
      npx prisma migrate resolve --applied "$migration" --schema=packages/prisma/prisma/schema.prisma 2>&1 || true
    fi
  done
  npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1 || true
fi

echo "Database ready."

# Build NestJS API if missing
if [ ! -f "api/dist/main.js" ]; then
  echo "NestJS API not built, installing deps and building..."
  
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci 2>&1 || npm install 2>&1
  fi
  
  echo "Building NestJS API..."
  npm run build --workspace=@p2p/config --workspace=@p2p/shared --workspace=@p2p/prisma 2>&1
  npm run build --workspace=apps/api 2>&1
  
  if [ ! -f "api/dist/main.js" ]; then
    echo "NestJS API build FAILED. Exiting."
    exit 1
  fi
  echo "NestJS API built successfully"
else
  echo "NestJS API already built"
fi

# Start NestJS API on port 3001
echo "Starting NestJS API (port 3001)..."
node api/dist/main.js &
API_PID=$!

echo "Waiting for API to start..."
sleep 5

if kill -0 $API_PID 2>/dev/null; then
  echo "NestJS API running (PID: $API_PID)"
else
  echo "NestJS API failed to start"
  exit 1
fi

# Start Next.js on port 3000
echo "Starting Next.js (port 3000)..."
exec node server.js
