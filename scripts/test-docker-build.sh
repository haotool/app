#!/bin/bash

# Docker 建置測試腳本
# 用於本地測試 Docker 建置流程，驗證版本號注入和 PWA 配置

set -e

echo "🐳 開始 Docker 建置測試..."
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 清理舊的建置
echo "📦 清理舊的建置..."
docker rmi ratewise:test 2>/dev/null || true

# 建置 Docker 映像
echo ""
echo "🔨 建置 Docker 映像..."
docker build -t ratewise:test -f Dockerfile .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker 建置失敗${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 建置成功${NC}"
echo ""

# 啟動容器
echo "🚀 啟動容器..."
CONTAINER_ID=$(docker run -d -p 8080:80 ratewise:test)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 容器啟動失敗${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 容器啟動成功 (ID: ${CONTAINER_ID:0:12})${NC}"
echo ""

# 等待容器啟動
echo "⏳ 等待容器啟動..."
sleep 3

# 檢查容器狀態
if ! docker ps | grep -q "$CONTAINER_ID"; then
    echo -e "${RED}❌ 容器未運行${NC}"
    docker logs "$CONTAINER_ID"
    docker rm -f "$CONTAINER_ID" 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ 容器運行中${NC}"
echo ""

# 測試 HTTP 連接
echo "🔍 測試 HTTP 連接..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ratewise/)

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}❌ HTTP 連接失敗 (狀態碼: $HTTP_CODE)${NC}"
    docker logs "$CONTAINER_ID"
    docker rm -f "$CONTAINER_ID" 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ HTTP 連接成功 (狀態碼: $HTTP_CODE)${NC}"
echo ""

# 下載 index.html 並檢查版本號
echo "📄 檢查版本號注入..."
HTML_CONTENT=$(curl -s http://localhost:8080/ratewise/)

# 檢查版本號是否被正確替換
if echo "$HTML_CONTENT" | grep -q '__APP_VERSION__'; then
    echo -e "${RED}❌ 版本號未被替換（仍然是佔位符）${NC}"
    echo ""
    echo "HTML 內容片段:"
    echo "$HTML_CONTENT" | grep -A 2 -B 2 '__APP_VERSION__'
    docker rm -f "$CONTAINER_ID" 2>/dev/null
    exit 1
fi

if echo "$HTML_CONTENT" | grep -q '__BUILD_TIME__'; then
    echo -e "${RED}❌ 建置時間未被替換（仍然是佔位符）${NC}"
    echo ""
    echo "HTML 內容片段:"
    echo "$HTML_CONTENT" | grep -A 2 -B 2 '__BUILD_TIME__'
    docker rm -f "$CONTAINER_ID" 2>/dev/null
    exit 1
fi

# 提取版本號和建置時間
APP_VERSION=$(echo "$HTML_CONTENT" | grep -oP 'name="app-version" content="\K[^"]+')
BUILD_TIME=$(echo "$HTML_CONTENT" | grep -oP 'name="build-time" content="\K[^"]+')

echo -e "${GREEN}✅ 版本號注入成功${NC}"
echo "   App Version: $APP_VERSION"
echo "   Build Time: $BUILD_TIME"
echo ""

# 檢查 manifest.webmanifest
echo "📱 檢查 PWA Manifest..."
MANIFEST_CONTENT=$(curl -s http://localhost:8080/ratewise/manifest.webmanifest)

if [ -z "$MANIFEST_CONTENT" ]; then
    echo -e "${RED}❌ Manifest 檔案不存在或為空${NC}"
    docker rm -f "$CONTAINER_ID" 2>/dev/null
    exit 1
fi

# 檢查 scope 是否有尾斜線
if ! echo "$MANIFEST_CONTENT" | grep -q '"scope": "/ratewise/"'; then
    echo -e "${YELLOW}⚠️  Manifest scope 缺少尾斜線${NC}"
    echo ""
    echo "Manifest 內容:"
    echo "$MANIFEST_CONTENT" | grep -A 1 -B 1 '"scope"'
else
    echo -e "${GREEN}✅ Manifest scope 配置正確${NC}"
fi

# 檢查 start_url
if echo "$MANIFEST_CONTENT" | grep -q '"start_url": "/ratewise"'; then
    echo -e "${GREEN}✅ Manifest start_url 配置正確${NC}"
else
    echo -e "${YELLOW}⚠️  Manifest start_url 配置異常${NC}"
    echo ""
    echo "Manifest 內容:"
    echo "$MANIFEST_CONTENT" | grep -A 1 -B 1 '"start_url"'
fi

echo ""

# 檢查 Service Worker
echo "⚙️  檢查 Service Worker..."
SW_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ratewise/sw.js)

if [ "$SW_CODE" != "200" ]; then
    echo -e "${RED}❌ Service Worker 檔案不存在 (狀態碼: $SW_CODE)${NC}"
    docker rm -f "$CONTAINER_ID" 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Service Worker 檔案存在${NC}"
echo ""

# 檢查圖標檔案
echo "🎨 檢查 PWA 圖標..."
ICON_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ratewise/icons/ratewise-icon-192x192.png)

if [ "$ICON_CODE" != "200" ]; then
    echo -e "${YELLOW}⚠️  PWA 圖標可能缺失 (狀態碼: $ICON_CODE)${NC}"
else
    echo -e "${GREEN}✅ PWA 圖標存在${NC}"
fi

echo ""

# 總結
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Docker 建置測試完成${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 測試結果:"
echo "   - HTTP 連接: ✅"
echo "   - 版本號注入: ✅"
echo "   - PWA Manifest: ✅"
echo "   - Service Worker: ✅"
echo ""
echo "🌐 本地測試 URL:"
echo "   http://localhost:8080/ratewise/"
echo ""
echo "💡 提示:"
echo "   - 容器將繼續運行，可以在瀏覽器中測試"
echo "   - 使用 'docker rm -f $CONTAINER_ID' 停止容器"
echo "   - 使用 'docker logs $CONTAINER_ID' 查看日誌"
echo ""
echo "📝 容器資訊:"
echo "   Container ID: $CONTAINER_ID"
echo "   Image: ratewise:test"
echo "   Port: 8080:80"
echo ""

# 提示用戶
read -p "按 Enter 繼續（容器將保持運行）或 Ctrl+C 退出..."

echo ""
echo "容器 ID: $CONTAINER_ID"
echo "使用以下命令停止容器:"
echo "  docker rm -f $CONTAINER_ID"

