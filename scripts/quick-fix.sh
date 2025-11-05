#!/bin/bash
# Quick Fix Script - 立即修復生產環境問題
# 執行時間：約 20 分鐘
# 建立時間：2025-11-06T00:04:56+08:00

set -e

echo "🚀 開始 PWA 生產環境快速修復流程..."

# === 步驟 1：強制 Zeabur 重新部署 ===
echo "📦 步驟 1/3：觸發 Zeabur 重新部署"
echo "請選擇部署方式："
echo "  1) 使用空 Commit 觸發 CI/CD（推薦）"
echo "  2) 手動在 Zeabur Dashboard 點擊 Redeploy"
read -p "選擇 (1/2): " deploy_choice

if [ "$deploy_choice" == "1" ]; then
  git commit --allow-empty -m "chore(deploy): force production rebuild for PWA fixes

Trigger Zeabur redeploy to sync latest build artifacts
- Fixes manifest.webmanifest scope/start_url/id consistency
- Resolves 404 error for index-HiiysA25.js
- Ensures Service Worker registration

Refs: commits 369d5c3, 59bf117, 4f871d4
Related: docs/dev/007, docs/dev/008"
  
  git push origin main
  
  echo "✅ 已觸發 CI/CD 部署，等待 Zeabur 完成..."
  echo "⏳ 預計等待時間：5-10 分鐘"
  
  # 等待部署
  sleep 300  # 5 分鐘
  
  echo "⏳ 繼續等待..."
  sleep 300  # 再等 5 分鐘
else
  echo "📋 請執行以下步驟："
  echo "  1. 訪問 https://dash.zeabur.com"
  echo "  2. 找到 app 專案 > ratewise 服務"
  echo "  3. 點擊 'Redeploy' 按鈕"
  echo "  4. 等待 5-10 分鐘直到部署完成"
  read -p "完成後按 Enter 繼續..."
fi

# === 步驟 2：清除 Cloudflare 快取 ===
echo "🗑️  步驟 2/3：清除 Cloudflare CDN 快取"

if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  echo "使用 API 自動清除..."
  
  RESPONSE=$(curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{
      "files": [
        "https://app.haotool.org/ratewise/",
        "https://app.haotool.org/ratewise/index.html",
        "https://app.haotool.org/manifest.webmanifest"
      ]
    }')
  
  if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Cloudflare 快取已清除"
  else
    echo "❌ API 清除失敗，請手動操作"
    echo "$RESPONSE"
  fi
else
  echo "📋 請手動清除 Cloudflare 快取："
  echo "  1. 訪問 Cloudflare Dashboard"
  echo "  2. 選擇 haotool.org 域名"
  echo "  3. Caching > Configuration > Purge Cache"
  echo "  4. Custom Purge 以下 URLs:"
  echo "     - https://app.haotool.org/ratewise/*"
  echo "     - https://app.haotool.org/manifest.webmanifest"
  read -p "完成後按 Enter 繼續..."
fi

# === 步驟 3：驗證修復結果 ===
echo "✅ 步驟 3/3：驗證生產環境"

echo "檢查 Manifest 配置..."
MANIFEST_JSON=$(curl -s https://app.haotool.org/manifest.webmanifest)
SCOPE=$(echo "$MANIFEST_JSON" | jq -r '.scope')
START_URL=$(echo "$MANIFEST_JSON" | jq -r '.start_url')
ID=$(echo "$MANIFEST_JSON" | jq -r '.id')

echo "  scope: $SCOPE"
echo "  start_url: $START_URL"
echo "  id: $ID"

if [ "$SCOPE" == "/ratewise/" ] && [ "$START_URL" == "/ratewise/" ] && [ "$ID" == "/ratewise/" ]; then
  echo "✅ Manifest 配置正確"
else
  echo "⚠️  Manifest 配置仍有問題，可能需要等待更長時間或手動檢查"
fi

echo ""
echo "🎉 快速修復流程完成！"
echo ""
echo "📋 請手動驗證以下項目："
echo "  1. 訪問 https://app.haotool.org/ratewise"
echo "  2. 開啟 DevTools > Console，確認無警告/錯誤"
echo "  3. 開啟 DevTools > Application > Manifest，確認配置正確"
echo "  4. 開啟 DevTools > Application > Service Workers，確認已註冊"
echo "  5. 測試 PWA 安裝提示是否出現"
echo ""
echo "如果問題仍存在，請查看 docs/dev/008_pwa_production_deployment_fix.md 執行方案 C"

