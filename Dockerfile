FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages packages
COPY apps apps

RUN npm install --legacy-peer-deps
RUN npm run build:config --workspace=@p2p/config
RUN npm run build --workspace=@p2p/shared
RUN npx --workspace=@p2p/api nest build
RUN npm run build:web

FROM node:22-alpine

WORKDIR /app

# Next.js standalone app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

# NestJS API
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

CMD ["./start.sh"]
