# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache wget tini \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 -G nodejs

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

FROM base AS build

COPY . .

RUN npm run build \
  && chown -R nodejs:nodejs /app/uploads /app/logs 2>/dev/null || true \
  && mkdir -p uploads/images uploads/documents logs \
  && chown -R nodejs:nodejs uploads logs

FROM base AS production

COPY --from=build --chown=nodejs:nodejs /app/src ./src
COPY --from=build --chown=nodejs:nodejs /app/scripts ./scripts
COPY --from=build --chown=nodejs:nodejs /app/docker ./docker
COPY --from=build --chown=nodejs:nodejs /app/openapi.json ./openapi.json
COPY --from=build --chown=nodejs:nodejs /app/uploads ./uploads
COPY --from=build --chown=nodejs:nodejs /app/logs ./logs

RUN chmod +x docker/entrypoint.sh

USER nodejs

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/app/docker/entrypoint.sh"]
CMD ["node", "src/server.js"]
