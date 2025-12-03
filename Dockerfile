# Multi-stage Dockerfile for RateWise & NihonName
# syntax=docker/dockerfile:1

# Build stage
FROM node:24-alpine AS builder

# [fix:2025-11-05] Build arguments for version generation
# 這些參數在建置時從 Git 取得，傳遞到容器內
ARG GIT_COMMIT_COUNT
ARG GIT_COMMIT_HASH
ARG BUILD_TIME
ARG VITE_BASE_PATH=/ratewise/
ARG VITE_NIHONNAME_BASE_PATH=/nihonname/

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

# 安裝 git 供版本計算使用（node:alpine 預設未內建）
RUN apk add --no-cache git

WORKDIR /app

# Set pnpm store directory for cache mount
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# [fix:2025-11-05] 設定環境變數供 vite.config.ts 使用
# [fix:2025-12-04] 移除全局 VITE_BASE_PATH，改在建置時分別設置
ENV GIT_COMMIT_COUNT=${GIT_COMMIT_COUNT}
ENV GIT_COMMIT_HASH=${GIT_COMMIT_HASH}
ENV BUILD_TIME=${BUILD_TIME}
ENV CI=true

# Copy package files and pnpm config
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ratewise/package.json ./apps/ratewise/
COPY apps/nihonname/package.json ./apps/nihonname/

# [fix:2025-11-06] 安裝依賴時禁用 Husky 並清空 NODE_ENV
# Zeabur 可能自動設置 NODE_ENV=production，導致 devDependencies 被跳過
# Builder 階段需要 devDependencies（TypeScript, Vite 等構建工具）
# 參考: https://typicode.github.io/husky/#/?id=disable-husky-in-cidockerprod
# Reference: https://pnpm.io/docker
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  NODE_ENV= HUSKY=0 pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build applications（若外部未提供 build args，於此自動回退計算）
# [fix:2025-12-04] 分別為每個專案設置對應的 base 變數，避免相互污染
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
  VITE_BASE_PATH=/ratewise/ pnpm build:ratewise && \
  VITE_NIHONNAME_BASE_PATH=/nihonname/ pnpm build:nihonname

# Production stage
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built assets for ratewise
COPY --from=builder /app/apps/ratewise/dist /usr/share/nginx/html

# Copy built assets for nihonname
# [fix:2025-12-03] 將 nihonname 的 dist 複製到 /nihonname 子目錄
COPY --from=builder /app/apps/nihonname/dist /usr/share/nginx/html/nihonname-app

# Ensure /ratewise/* 路徑指向同一份資源（避免 404）
RUN rm -rf /usr/share/nginx/html/ratewise && ln -s /usr/share/nginx/html /usr/share/nginx/html/ratewise

# [fix:2025-12-03] 設置 nihonname 路徑
# nihonname 的資源已經在 /nihonname-app 目錄，需要創建符號連結
RUN ln -s /usr/share/nginx/html/nihonname-app /usr/share/nginx/html/nihonname

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
