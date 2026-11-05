# ==========================================
# Multi-Stage Production Hardened Dockerfile
# Security Guardrails:
#  - Minimal base image (Alpine Linux)
#  - Non-root execution (USER node)
#  - Clean production dependencies only
#  - Tini init process for signal handling
#  - Removal of build tools and global npm from runner
#  - Native container healthcheck
# ==========================================

# Stage 1: Dependencies Builder
FROM node:20-alpine AS dependencies
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production Hardened Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Upgrade base packages to patch OS vulnerabilities, install tini, and remove unnecessary tooling
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tini wget && \
    rm -rf /var/cache/apk/* /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Copy node_modules with secure non-root permissions
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node index.js ./

# Switch to non-privileged user (node: UID 1000)
USER node

EXPOSE 3000

# Docker native healthcheck aligned with SRE availability standards
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
