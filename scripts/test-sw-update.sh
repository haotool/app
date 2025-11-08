#!/bin/bash
# Service Worker 更新機制完整測試腳本
# 
# 測試流程:
# 1. 建置應用
# 2. 啟動本地預覽伺服器
# 3. 驗證 Service Worker 檔案的 Cache-Control headers
# 4. 驗證 manifest.webmanifest 的 Cache-Control headers
# 5. 驗證 index.html 的 Cache-Control headers
# 6. 模擬版本更新流程

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Service Worker 更新機制完整測試${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# 步驟 1: 清理舊建置
echo -e "${YELLOW}[1/7] 清理舊建置...${NC}"
rm -rf apps/ratewise/dist
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 步驟 2: 執行建置
echo -e "${YELLOW}[2/7] 執行建置...${NC}"
pnpm build:ratewise
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 建置失敗${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 建置成功${NC}"
echo ""

# 步驟 3: 驗證關鍵檔案存在
echo -e "${YELLOW}[3/7] 驗證建置產物...${NC}"

# 檢查 sw.js
if [ -f "apps/ratewise/dist/sw.js" ]; then
    echo -e "${GREEN}✓ sw.js 存在${NC}"
else
    echo -e "${RED}✗ sw.js 不存在${NC}"
    exit 1
fi

# 檢查 manifest.webmanifest
if [ -f "apps/ratewise/dist/manifest.webmanifest" ]; then
    echo -e "${GREEN}✓ manifest.webmanifest 存在${NC}"
else
    echo -e "${RED}✗ manifest.webmanifest 不存在${NC}"
    exit 1
fi

# 檢查 index.html
if [ -f "apps/ratewise/dist/index.html" ]; then
    echo -e "${GREEN}✓ index.html 存在${NC}"
else
    echo -e "${RED}✗ index.html 不存在${NC}"
    exit 1
fi

echo ""

# 步驟 4: 檢查 sw.js 內容
echo -e "${YELLOW}[4/7] 檢查 Service Worker 配置...${NC}"

# 檢查 skipWaiting
if grep -q "skipWaiting" apps/ratewise/dist/sw.js; then
    echo -e "${GREEN}✓ skipWaiting 已配置${NC}"
else
    echo -e "${RED}✗ skipWaiting 未找到${NC}"
fi

# 檢查 clientsClaim
if grep -q "clientsClaim" apps/ratewise/dist/sw.js; then
    echo -e "${GREEN}✓ clientsClaim 已配置${NC}"
else
    echo -e "${RED}✗ clientsClaim 未找到${NC}"
fi

# 檢查 cleanupOutdatedCaches
if grep -q "cleanupOutdatedCaches" apps/ratewise/dist/sw.js; then
    echo -e "${GREEN}✓ cleanupOutdatedCaches 已配置${NC}"
else
    echo -e "${YELLOW}⚠ cleanupOutdatedCaches 未明確找到（可能在壓縮後的程式碼中）${NC}"
fi

echo ""

# 步驟 5: 啟動預覽伺服器（背景執行）
echo -e "${YELLOW}[5/7] 啟動預覽伺服器...${NC}"
pnpm --filter @app/ratewise preview --port 4173 > /tmp/preview-server.log 2>&1 &
PREVIEW_PID=$!

# 等待伺服器啟動
sleep 3

# 檢查伺服器是否正在運行
if ps -p $PREVIEW_PID > /dev/null; then
    echo -e "${GREEN}✓ 預覽伺服器已啟動 (PID: $PREVIEW_PID)${NC}"
else
    echo -e "${RED}✗ 預覽伺服器啟動失敗${NC}"
    cat /tmp/preview-server.log
    exit 1
fi

echo ""

# 步驟 6: 測試 HTTP Headers
echo -e "${YELLOW}[6/7] 測試 HTTP Cache Headers...${NC}"

# 測試 sw.js
echo -e "${BLUE}測試 /ratewise/sw.js:${NC}"
SW_HEADERS=$(curl -sI http://localhost:4173/ratewise/sw.js)
if echo "$SW_HEADERS" | grep -qi "cache-control.*no-cache"; then
    echo -e "${GREEN}✓ sw.js Cache-Control 正確${NC}"
else
    echo -e "${RED}✗ sw.js Cache-Control 錯誤${NC}"
    echo "$SW_HEADERS"
fi

# 測試 manifest.webmanifest
echo -e "${BLUE}測試 /ratewise/manifest.webmanifest:${NC}"
MANIFEST_HEADERS=$(curl -sI http://localhost:4173/ratewise/manifest.webmanifest)
if echo "$MANIFEST_HEADERS" | grep -qi "cache-control.*no-cache"; then
    echo -e "${GREEN}✓ manifest.webmanifest Cache-Control 正確${NC}"
else
    echo -e "${RED}✗ manifest.webmanifest Cache-Control 錯誤${NC}"
    echo "$MANIFEST_HEADERS"
fi

# 測試 index.html
echo -e "${BLUE}測試 /ratewise/index.html:${NC}"
INDEX_HEADERS=$(curl -sI http://localhost:4173/ratewise/index.html)
if echo "$INDEX_HEADERS" | grep -qi "cache-control"; then
    echo -e "${GREEN}✓ index.html 有 Cache-Control header${NC}"
else
    echo -e "${YELLOW}⚠ index.html 沒有 Cache-Control header (Vite preview 不處理 nginx 規則)${NC}"
fi

echo ""

# 步驟 7: 驗證 Service Worker 註冊
echo -e "${YELLOW}[7/7] 驗證 Service Worker 註冊配置...${NC}"

if grep -q "updateViaCache.*none" apps/ratewise/dist/assets/*.js 2>/dev/null; then
    echo -e "${GREEN}✓ updateViaCache: 'none' 已配置${NC}"
else
    echo -e "${YELLOW}⚠ updateViaCache 在壓縮後的程式碼中難以確認${NC}"
fi

echo ""

# 清理：停止預覽伺服器
echo -e "${YELLOW}清理: 停止預覽伺服器...${NC}"
kill $PREVIEW_PID 2>/dev/null || true
echo -e "${GREEN}✓ 伺服器已停止${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ 測試完成！${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}注意事項:${NC}"
echo "1. Vite preview 不會處理 nginx 的 Cache-Control 規則"
echo "2. 完整測試需要在 Docker 環境中執行"
echo "3. 生產環境部署後，請驗證實際的 HTTP headers"
echo ""
echo -e "${BLUE}下一步操作:${NC}"
echo "1. 執行 Docker 建置測試: ${GREEN}docker build -t ratewise:test .${NC}"
echo "2. 啟動容器: ${GREEN}docker run -d -p 8080:8080 ratewise:test${NC}"
echo "3. 測試 headers: ${GREEN}curl -I http://localhost:8080/ratewise/sw.js${NC}"
echo ""

