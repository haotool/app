#!/bin/bash
# Docker 建置腳本 - 自動注入 Git 資訊
# [fix:2025-11-05] 解決生產環境版本號問題

set -euo pipefail

echo "🔍 Collecting Git information..."

# 取得 Git commit 數（用於版本號）
GIT_COMMIT_COUNT=$(git rev-list --count HEAD)
echo "   Git commit count: $GIT_COMMIT_COUNT"

# 取得 Git commit hash（用於追蹤）
GIT_COMMIT_HASH=$(git rev-parse --short HEAD)
echo "   Git commit hash: $GIT_COMMIT_HASH"

# 建置時間（ISO 8601 格式）
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "   Build time: $BUILD_TIME"

# 計算版本號（從 package.json 取得 major.minor）
PACKAGE_VERSION=$(node -p "require('./apps/ratewise/package.json').version")
MAJOR_MINOR=$(echo "$PACKAGE_VERSION" | cut -d. -f1-2)
VERSION="${MAJOR_MINOR}.${GIT_COMMIT_COUNT}"

echo ""
echo "📦 Building Docker image..."
echo "   Version: $VERSION"
echo ""

# 建置 Docker 映像，傳入 build args
VITE_RATEWISE_BASE_PATH="/ratewise/"
docker build \
  --build-arg GIT_COMMIT_COUNT="$GIT_COMMIT_COUNT" \
  --build-arg GIT_COMMIT_HASH="$GIT_COMMIT_HASH" \
  --build-arg BUILD_TIME="$BUILD_TIME" \
  --build-arg VITE_RATEWISE_BASE_PATH="$VITE_RATEWISE_BASE_PATH" \
  -t ratewise:latest \
  -t "ratewise:${VERSION}" \
  .

echo ""
echo "✅ Docker image built successfully!"
echo "   Tags: ratewise:latest, ratewise:${VERSION}"
echo ""
echo "🚀 To run the container:"
echo "   docker run -p 8080:8080 ratewise:latest"
