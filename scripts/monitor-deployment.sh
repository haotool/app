#!/bin/bash

# 監控部署狀態腳本
# 用途：檢查 GitHub Actions, Git 同步狀態, CDN 快取狀態

set -e

echo "🔍 Deployment Monitor"
echo "===================="
echo ""

# 1. 檢查 GitHub Actions 狀態
echo "📊 GitHub Actions Status:"
echo "------------------------"
gh run list --workflow="Update Exchange Rates" --limit 5 || echo "⚠️  gh CLI not available"
echo ""

# 2. 檢查 Git 狀態
echo "📦 Git Repository Status:"
echo "------------------------"
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
BASE=$(git merge-base @ @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Up to date with remote"
elif [ "$LOCAL" = "$BASE" ]; then
    echo "⚠️  Need to pull (behind by $(git rev-list --count HEAD..@{u}) commits)"
    git log --oneline HEAD..@{u} | head -5
elif [ "$REMOTE" = "$BASE" ]; then
    echo "⚠️  Need to push (ahead by $(git rev-list --count @{u}..HEAD) commits)"
else
    echo "⚠️  Diverged!"
fi
echo ""

# 3. 檢查最新的 commit
echo "📝 Latest Commits:"
echo "------------------------"
git log --oneline -5
echo ""

# 4. 檢查本地匯率資料
echo "💱 Local Rate Data:"
echo "------------------------"
if [ -f "public/rates/latest.json" ]; then
    UPDATE_TIME=$(jq -r '.updateTime' public/rates/latest.json)
    CURRENCIES=$(jq -r '.rates | length' public/rates/latest.json)
    USD_RATE=$(jq -r '.rates.USD' public/rates/latest.json)
    echo "  Update Time: $UPDATE_TIME"
    echo "  Currencies: $CURRENCIES"
    echo "  USD Rate: $USD_RATE TWD"
else
    echo "  ❌ File not found"
fi
echo ""

# 5. 檢查 CDN 狀態
echo "🌐 CDN Status:"
echo "------------------------"

# jsdelivr CDN
echo "📡 jsdelivr CDN:"
JSDELIVR_TIME=$(curl -s "https://cdn.jsdelivr.net/gh/haotool/app@main/public/rates/latest.json" | jq -r '.updateTime')
echo "  Update Time: $JSDELIVR_TIME"

# GitHub Raw
echo "📡 GitHub Raw:"
GITHUB_TIME=$(curl -s "https://raw.githubusercontent.com/haotool/app/main/public/rates/latest.json" | jq -r '.updateTime')
echo "  Update Time: $GITHUB_TIME"
echo ""

# 6. 比較時間差異
echo "⏰ Time Comparison:"
echo "------------------------"
if [ "$JSDELIVR_TIME" = "$GITHUB_TIME" ]; then
    echo "  ✅ CDN is in sync with GitHub"
else
    echo "  ⚠️  CDN is out of sync!"
    echo "  jsdelivr: $JSDELIVR_TIME"
    echo "  GitHub:   $GITHUB_TIME"
    echo ""
    echo "  💡 Tip: jsdelivr CDN may take 1-5 minutes to update"
    echo "  💡 Tip: Use ?timestamp parameter to bust cache"
fi
echo ""

# 7. 檢查生產環境
echo "🚀 Production Status:"
echo "------------------------"
PROD_URL="https://ratewise.zeabur.app"
if curl -s -I "$PROD_URL" | grep -q "200 OK"; then
    echo "  ✅ Site is online: $PROD_URL"
else
    echo "  ❌ Site is down: $PROD_URL"
fi
echo ""

# 8. 建議操作
echo "💡 Recommended Actions:"
echo "------------------------"
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "  🔄 Run: git pull origin main"
fi
if [ "$JSDELIVR_TIME" != "$GITHUB_TIME" ]; then
    echo "  ⏳ Wait 1-5 minutes for CDN to sync"
    echo "  🔗 Or use cache-busted URL: ${PROD_URL}?t=\$(date +%s)"
fi
echo ""

echo "✅ Monitor complete!"
