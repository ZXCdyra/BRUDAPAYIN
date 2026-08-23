FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages packages
COPY apps apps

RUN npm install
RUN npm run build:web

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/apps/web/.next .next
COPY --from=builder /app/apps/web/public public
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/node_modules ./node_modules

EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
