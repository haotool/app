# Multi-stage Dockerfile for RateWise
# syntax=docker/dockerfile:1

# Build stage
FROM node:24-alpine AS builder

# [fix:2025-11-05] Build arguments for version generation
# 這些參數在建置時從 Git 取得，傳遞到容器內
ARG GIT_COMMIT_COUNT
ARG GIT_COMMIT_HASH
ARG BUILD_TIME
ARG VITE_BASE_PATH=/ratewise/

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

# 安裝 git 供版本計算使用（node:alpine 預設未內建）
RUN apk add --no-cache git

WORKDIR /app

# Set pnpm store directory for cache mount
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# [fix:2025-11-05] 設定環境變數供 vite.config.ts 使用
ENV GIT_COMMIT_COUNT=${GIT_COMMIT_COUNT}
ENV GIT_COMMIT_HASH=${GIT_COMMIT_HASH}
ENV BUILD_TIME=${BUILD_TIME}
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ENV CI=true

# Copy package files and pnpm config
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ratewise/package.json ./apps/ratewise/

# Install dependencies with BuildKit cache mount (pnpm official best practice)
# Reference: https://pnpm.io/docker
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application（若外部未提供 build args，於此自動回退計算）
RUN set -eux; \
  if [ -z "${GIT_COMMIT_COUNT:-}" ]; then \
    export GIT_COMMIT_COUNT="$(git rev-list --count HEAD)"; \
  fi; \
  if [ -z "${GIT_COMMIT_HASH:-}" ]; then \
    export GIT_COMMIT_HASH="$(git rev-parse --short HEAD)"; \
  fi; \
  if [ -z "${BUILD_TIME:-}" ]; then \
    export BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"; \
  fi; \
  pnpm build:ratewise

# Production stage
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built assets
COPY --from=builder /app/apps/ratewise/dist /usr/share/nginx/html

# Mirror hashed assets與 PWA 檔案至 /ratewise 子路徑（避免 404）
RUN mkdir -p /usr/share/nginx/html/ratewise/assets \
    && cp -r /usr/share/nginx/html/assets/. /usr/share/nginx/html/ratewise/assets/ \
    && cp /usr/share/nginx/html/sw.js /usr/share/nginx/html/ratewise/sw.js \
    && cp /usr/share/nginx/html/sw.js.map /usr/share/nginx/html/ratewise/sw.js.map \
    && cp /usr/share/nginx/html/workbox-*.js /usr/share/nginx/html/ratewise/ \
    && cp /usr/share/nginx/html/workbox-*.js.map /usr/share/nginx/html/ratewise/ \
    && cp /usr/share/nginx/html/manifest.webmanifest /usr/share/nginx/html/ratewise/manifest.webmanifest

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx

# Expose port
EXPOSE 8080

# Health check - 測試 nginx 是否正常回應 HTTP 請求
# 檔案存在不代表 nginx 運作正常,必須測試實際 HTTP 回應
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Use non-root user
USER nodejs

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
