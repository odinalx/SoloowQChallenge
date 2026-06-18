FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild better-sqlite3

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npx tsc -p tsconfig.server.json

FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps   /app/node_modules        ./node_modules
COPY --from=builder /app/dist               ./dist
COPY --from=builder /app/dist-server        ./dist-server
COPY --from=builder /app/src/constants      ./src/constants
COPY --from=builder /app/src/types          ./src/types

# Data directory (bind-mount in production for persistence)
RUN mkdir -p /data && chown app:app /data
ENV LP_FILE=/data/lp_history.json
ENV DB_PATH=/data/matches.db

USER app
EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "dist-server/index.js"]
