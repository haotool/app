#!/bin/bash
##
# Cloudflare 部署驗證腳本
#
# 用途：自動化驗證 Cloudflare Worker CSP 修復部署後的功能
# 使用：bash scripts/verify-cloudflare-deployment.sh
#
# 建立時間：2025-11-29
##

set -e

SITE_URL="${SITE_URL:-https://app.haotool.org/ratewise/}"

echo "🔍 開始驗證 Cloudflare 部署..."
echo ""

# 1. 檢查 CSP headers
echo "✅ 檢查 CSP headers..."
CSP=$(curl -sI "$SITE_URL" | grep -i "content-security-policy:" || true)

if [[ -z "$CSP" ]]; then
  echo "❌ 錯誤：未找到 Content-Security-Policy header"
  exit 1
fi

if [[ $CSP == *"unsafe-inline"* ]] && [[ $CSP != *"strict-dynamic"* ]]; then
  echo "✅ CSP headers 正確"
  echo "   $CSP"
else
  if [[ $CSP == *"strict-dynamic"* ]]; then
    echo "❌ CSP headers 不正確：仍包含 'strict-dynamic'"
    echo "   嚴重錯誤：strict-dynamic 會導致 SSG 環境完全失效！"
    echo "   請參考 docs/CLOUDFLARE_WORKER_CSP_FIX.md"
  else
    echo "❌ CSP headers 不正確"
    echo "   預期包含：'unsafe-inline' (不應包含 'strict-dynamic')"
  fi
  echo "   實際：$CSP"
  exit 1
fi

echo ""

# 2. 檢查頁面載入
echo "✅ 檢查頁面載入..."
HTTP_CODE=$(curl -sI "$SITE_URL" | grep "HTTP/" | awk '{print $2}')

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ 頁面正常載入 (HTTP $HTTP_CODE)"
else
  echo "❌ 頁面載入失敗 (HTTP $HTTP_CODE)"
  exit 1
fi

echo ""

# 3. 檢查 Service Worker
echo "✅ 檢查 Service Worker..."
SW_URL="${SITE_URL}sw.js"
SW_CODE=$(curl -sI "$SW_URL" | grep "HTTP/" | awk '{print $2}')

if [ "$SW_CODE" == "200" ]; then
  echo "✅ Service Worker 可用 ($SW_URL)"
else
  echo "⚠️ Service Worker 不可用 (HTTP $SW_CODE)"
  echo "   這可能不是問題（取決於部署配置）"
fi

echo ""

# 4. 檢查 manifest.webmanifest
echo "✅ 檢查 PWA Manifest..."
MANIFEST_URL="${SITE_URL}manifest.webmanifest"
MANIFEST_CODE=$(curl -sI "$MANIFEST_URL" | grep "HTTP/" | awk '{print $2}')

if [ "$MANIFEST_CODE" == "200" ]; then
  echo "✅ PWA Manifest 可用 ($MANIFEST_URL)"
else
  echo "❌ PWA Manifest 不可用 (HTTP $MANIFEST_CODE)"
  exit 1
fi

echo ""

# 5. 檢查其他安全標頭
echo "✅ 檢查其他安全標頭..."

check_header() {
  local header_name=$1
  local header_value=$(curl -sI "$SITE_URL" | grep -i "^$header_name:" || true)

  if [[ -n "$header_value" ]]; then
    echo "   ✅ $header_name: 已設定"
  else
    echo "   ⚠️ $header_name: 未設定"
  fi
}

check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "Strict-Transport-Security"
check_header "Referrer-Policy"
check_header "Permissions-Policy"

echo ""

# 6. 檢查不應洩漏的標頭
echo "✅ 檢查不應洩漏的標頭..."
SERVER_HEADER=$(curl -sI "$SITE_URL" | grep -i "^server:" || true)
X_POWERED_BY=$(curl -sI "$SITE_URL" | grep -i "^x-powered-by:" || true)

if [[ -z "$SERVER_HEADER" ]]; then
  echo "   ✅ Server header 已移除"
else
  echo "   ⚠️ Server header 未移除：$SERVER_HEADER"
fi

if [[ -z "$X_POWERED_BY" ]]; then
  echo "   ✅ X-Powered-By header 已移除"
else
  echo "   ⚠️ X-Powered-By header 未移除：$X_POWERED_BY"
fi

echo ""
echo "🎉 部署驗證完成！"
echo ""
echo "📋 下一步："
echo "1. 在瀏覽器開啟 $SITE_URL"
echo "2. 開啟 DevTools (F12) > Console"
echo "3. 確認無 CSP 錯誤"
echo "4. 測試功能："
echo "   - 頁面正常載入"
echo "   - 匯率數據顯示"
echo "   - 單/多幣別切換"
echo "   - 計算機功能"
echo "   - PWA 安裝提示"
