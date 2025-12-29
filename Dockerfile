# Multi-stage Dockerfile for HAOTOOL.ORG Portfolio
# Includes: haotool (root), ratewise (/ratewise/), nihonname (/nihonname/), quake-school (/quake-school/)
# syntax=docker/dockerfile:1

# Build stage
FROM node:24-alpine AS builder

# [fix:2025-12-13] Build arguments for version generation
# 這些參數在建置時從 Git 取得，傳遞到容器內
ARG GIT_COMMIT_COUNT
ARG GIT_COMMIT_HASH
ARG BUILD_TIME
ARG VITE_HAOTOOL_BASE_PATH=/
ARG VITE_RATEWISE_BASE_PATH=/ratewise/
ARG VITE_NIHONNAME_BASE_PATH=/nihonname/
ARG VITE_QUAKE_SCHOOL_BASE_PATH=/quake-school/

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
COPY apps/haotool/package.json ./apps/haotool/
COPY apps/quake-school/package.json ./apps/quake-school/

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
# [fix:2025-12-13] 分別為每個專案設置對應的 base 變數，避免相互污染
# 新增 haotool 作為根路徑首頁
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
  VITE_HAOTOOL_BASE_PATH=/ pnpm build:haotool && \
  VITE_RATEWISE_BASE_PATH=/ratewise/ pnpm build:ratewise && \
  VITE_NIHONNAME_BASE_PATH=/nihonname/ pnpm build:nihonname && \
  VITE_QUAKE_SCHOOL_BASE_PATH=/quake-school/ pnpm build:quake-school

# Production stage
# [fix:2025-12-09] 使用 nginx:alpine 並升級系統包以修復 libpng 漏洞
# CVE-2025-64720, CVE-2025-65018, CVE-2025-66293
FROM nginx:alpine

# [fix:2025-12-09] 更新所有系統包並安裝 wget（用於 healthcheck）
# 這確保獲取最新的安全修補，包括 libpng
RUN apk upgrade --no-cache && apk add --no-cache wget

# [fix:2025-12-13] 新架構：haotool 作為根路徑首頁
# 複製 haotool 作為根目錄（首頁）
COPY --from=builder /app/apps/haotool/dist /usr/share/nginx/html

# Copy built assets for ratewise 到子目錄
COPY --from=builder /app/apps/ratewise/dist /usr/share/nginx/html/ratewise-app

# Copy built assets for nihonname 到子目錄
COPY --from=builder /app/apps/nihonname/dist /usr/share/nginx/html/nihonname-app

# [fix:2025-12-29] Copy built assets for quake-school 到子目錄
COPY --from=builder /app/apps/quake-school/dist /usr/share/nginx/html/quake-school-app

# 創建符號連結以支援路由
RUN ln -s /usr/share/nginx/html/ratewise-app /usr/share/nginx/html/ratewise && \
    ln -s /usr/share/nginx/html/nihonname-app /usr/share/nginx/html/nihonname && \
    ln -s /usr/share/nginx/html/quake-school-app /usr/share/nginx/html/quake-school

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
