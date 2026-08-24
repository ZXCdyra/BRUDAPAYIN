# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# ─── DEPS ───
FROM base AS deps
COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/config/package.json ./packages/config/
RUN npm ci

# ─── GENERATE PRISMA CLIENT ───
FROM deps AS prisma-gen
COPY packages/prisma/prisma ./packages/prisma/prisma
RUN npx prisma generate --schema=packages/prisma/prisma/schema.prisma

# ─── BUILD ───
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=packages/prisma/prisma/schema.prisma
RUN npm run build --workspace=@p2p/config --workspace=@p2p/shared --workspace=@p2p/prisma
RUN npm run build --workspace=apps/api
RUN npm run build:web

# ─── RUNNER ───
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy Next.js standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy NestJS API
COPY --from=builder /app/apps/api/dist ./api

# Copy Prisma schema and client
COPY --from=builder /app/packages/prisma/prisma ./prisma
COPY --from=builder /app/packages/prisma/dist ./packages/prisma/dist
COPY --from=builder /app/packages/prisma/package.json ./packages/prisma/package.json

# Install Prisma client for runtime
RUN npm install --omit=dev @prisma/client

EXPOSE 3000
ENV PORT=3000

# Start Next.js, then NestJS API in background
CMD sh -c "npx prisma migrate deploy --schema=packages/prisma/prisma/schema.prisma && node server.js & sleep 2 && node api/dist/main.js"
