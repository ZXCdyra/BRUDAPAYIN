#!/bin/sh
set -e

export API_ORIGIN="${API_ORIGIN:-http://localhost:3001}"

echo "Starting BrudaPay platform..."

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma 2>&1 || true

echo "Database ready."

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
