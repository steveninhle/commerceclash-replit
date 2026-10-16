# syntax=docker/dockerfile:1

# --- Builder stage ---
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client (make sure prisma + @prisma/client are in dependencies)
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# Remove devDependencies to slim down for production
RUN npm prune --omit=dev


# --- Production stage ---
FROM node:22-alpine AS production
WORKDIR /usr/src/app

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="Commerce Clash ZoomApp" \
      org.opencontainers.image.description="Commerce Clash backend service running on Node.js" \
      org.opencontainers.image.url="https://github.com/Texagon-Dev/zach-backend/" \
      org.opencontainers.image.source="https://github.com/Texagon-Dev/zach-backend/" \
      org.opencontainers.image.revision="$VCS_REF" \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.created="$BUILD_DATE"

# Copy built dist + node_modules + prisma folder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma

# Create non-root user
RUN addgroup -S nodeuser && adduser -S nodeuser -G nodeuser \
    && mkdir -p /usr/src/app/logs \
    && chown -R nodeuser:nodeuser /usr/src/app

USER nodeuser

# Default port and environment
ENV PORT=4000
ENV NODE_ENV=production
EXPOSE 4000

# Healthcheck (using wget since Alpine has it)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/system/health || exit 1

CMD ["node", "dist/main.js"]
