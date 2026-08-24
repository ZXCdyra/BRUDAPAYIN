FROM node:22-alpine AS base

# Install Prisma CLI globally
RUN npm install -g prisma

FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace config first
COPY package.json package-lock.json* ./

# Install deps with cached layer optimization
RUN npm install --legacy-peer-deps

# Copy source code
COPY packages packages
COPY apps apps

# Build dependencies
RUN npm run build:config --workspace=@p2p/config
RUN npm run build --workspace=@p2p/shared
RUN npx prisma generate --schema=packages/prisma/prisma/schema.prisma

# Build NestJS API
RUN npx --workspace=@p2p/api nest build

# Build Next.js with standalone output
RUN npm run build:web

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_RUNTIME=nodejs
ENV API_ORIGIN="http://localhost:3001"

# Copy Next.js standalone app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

# Copy NestJS API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy Prisma schema and generated client
COPY --from=builder /app/packages/prisma/prisma ./packages/prisma/prisma
COPY --from=builder /app/packages/prisma/node_modules ./packages/prisma/node_modules
COPY --from=builder /app/packages/prisma/package.json ./packages/prisma/package.json

COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

COPY --from=builder /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=builder /app/packages/config/package.json ./packages/config/package.json

# Copy start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

CMD ["./start.sh"]
