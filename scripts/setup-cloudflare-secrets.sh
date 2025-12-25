#!/bin/bash
# ============================================================================
# Cloudflare GitHub Secrets 設定輔助腳本
# ============================================================================
# 生成時間: 2025-12-25T15:14:58+08:00
# 
# 用途: 輔助設定 GitHub Secrets 以啟用 CDN 快取清除功能
# 參考: Context7 /websites/developers_cloudflare_api
# ============================================================================

set -euo pipefail

echo "🔧 Cloudflare GitHub Secrets 設定輔助"
echo "=================================================="
echo ""

# 檢查 GitHub CLI 是否已安裝
if ! command -v gh &> /dev/null; then
    echo "❌ 錯誤: GitHub CLI (gh) 未安裝"
    echo "請先安裝: brew install gh"
    exit 1
fi

# 檢查是否已登入 GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ 錯誤: 尚未登入 GitHub CLI"
    echo "請先登入: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI 已就緒"
echo ""

# 提供選項
echo "請選擇操作:"
echo "  1. 查看現有 secrets 狀態"
echo "  2. 設定 Cloudflare secrets"
echo "  3. 顯示 Cloudflare 設定指南"
echo "  4. 測試 secrets 是否已設定"
echo ""
read -p "請輸入選項 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📋 現有 Repository Secrets:"
        gh secret list 2>/dev/null || echo "無法讀取 secrets 或無 secrets"
        ;;
    2)
        echo ""
        echo "📝 設定 Cloudflare Secrets"
        echo ""
        echo "請在 Cloudflare Dashboard 獲取以下資訊:"
        echo "  1. Zone ID: Dashboard → haotool.org → Overview 頁面右側"
        echo "  2. API Token: My Profile → API Tokens → Create Token"
        echo "     權限: Zone.Cache Purge (Edit), Zone.Zone (Read)"
        echo ""
        
        read -p "請輸入 CLOUDFLARE_ZONE_ID: " zone_id
        if [ -z "$zone_id" ]; then
            echo "❌ Zone ID 不能為空"
            exit 1
        fi
        
        read -p "請輸入 CLOUDFLARE_API_TOKEN: " api_token
        if [ -z "$api_token" ]; then
            echo "❌ API Token 不能為空"
            exit 1
        fi
        
        echo ""
        echo "🔄 設定 secrets..."
        echo "$zone_id" | gh secret set CLOUDFLARE_ZONE_ID
        echo "$api_token" | gh secret set CLOUDFLARE_API_TOKEN
        
        echo ""
        echo "✅ Secrets 設定完成!"
        echo "下次 Release 工作流程將自動清除 CDN 快取"
        ;;
    3)
        echo ""
        echo "📖 Cloudflare 設定指南"
        echo "=================================================="
        echo ""
        echo "步驟 1: 獲取 Zone ID"
        echo "  1. 登入 https://dash.cloudflare.com/"
        echo "  2. 選擇 haotool.org 網域"
        echo "  3. 在 Overview 頁面右側找到 'Zone ID'"
        echo "  4. 複製該 32 字元的 ID"
        echo ""
        echo "步驟 2: 創建 API Token"
        echo "  1. 點擊右上角帳戶圖示 → My Profile"
        echo "  2. 選擇 'API Tokens' 標籤"
        echo "  3. 點擊 'Create Token'"
        echo "  4. 選擇 'Edit zone DNS' 模板或自訂:"
        echo "     - Permissions:"
        echo "       * Zone → Cache Purge → Edit"
        echo "       * Zone → Zone → Read"
        echo "     - Zone Resources:"
        echo "       * Include → Specific zone → haotool.org"
        echo "  5. 點擊 'Continue to summary' → 'Create Token'"
        echo "  6. 複製生成的 Token (只會顯示一次!)"
        echo ""
        echo "步驟 3: 設定 GitHub Secrets"
        echo "  重新執行此腳本並選擇選項 2"
        echo "  或手動前往: https://github.com/haotool/app/settings/secrets/actions"
        ;;
    4)
        echo ""
        echo "🔍 檢查 Secrets 設定狀態..."
        
        has_zone=$(gh secret list 2>/dev/null | grep -c "CLOUDFLARE_ZONE_ID" || echo "0")
        has_token=$(gh secret list 2>/dev/null | grep -c "CLOUDFLARE_API_TOKEN" || echo "0")
        
        if [ "$has_zone" -gt 0 ] && [ "$has_token" -gt 0 ]; then
            echo "✅ 兩個 Cloudflare secrets 都已設定!"
            echo ""
            echo "若要驗證 CDN 快取清除功能:"
            echo "  1. 推送任何變更到 main 分支"
            echo "  2. 查看 Release 工作流程日誌"
            echo "  3. 確認 'Purge Cloudflare Cache' 步驟顯示成功"
        else
            echo "⚠️ Secrets 設定不完整:"
            [ "$has_zone" -eq 0 ] && echo "  ❌ CLOUDFLARE_ZONE_ID 未設定"
            [ "$has_token" -eq 0 ] && echo "  ❌ CLOUDFLARE_API_TOKEN 未設定"
            echo ""
            echo "請重新執行此腳本並選擇選項 2 或 3"
        fi
        ;;
    *)
        echo "❌ 無效選項"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "完成!"

