#!/bin/bash
# Google Search Console 驗證檔案部署腳本
# 用法: ./scripts/add-search-console-verification.sh <驗證檔案路徑> <專案名稱>
# 範例: ./scripts/add-search-console-verification.sh ~/Downloads/google123.html ratewise

set -e

VERIFICATION_FILE=$1
PROJECT=${2:-ratewise}

if [ -z "$VERIFICATION_FILE" ]; then
    echo "❌ 請提供驗證檔案路徑"
    echo "用法: $0 <驗證檔案路徑> [專案名稱]"
    echo "範例: $0 ~/Downloads/googleXXX.html ratewise"
    exit 1
fi

if [ ! -f "$VERIFICATION_FILE" ]; then
    echo "❌ 驗證檔案不存在: $VERIFICATION_FILE"
    exit 1
fi

# 確定目標目錄
case $PROJECT in
    ratewise)
        TARGET_DIR="apps/ratewise/public"
        ;;
    nihonname)
        TARGET_DIR="apps/nihonname/public"
        ;;
    *)
        echo "❌ 不支援的專案: $PROJECT"
        echo "支援的專案: ratewise, nihonname"
        exit 1
        ;;
esac

# 複製驗證檔案
FILENAME=$(basename "$VERIFICATION_FILE")
cp "$VERIFICATION_FILE" "$TARGET_DIR/$FILENAME"
echo "✅ 已複製 $FILENAME 到 $TARGET_DIR/"

# Git 操作
git add "$TARGET_DIR/$FILENAME"
git commit -m "chore($PROJECT): add Google Search Console verification file"
git push origin main

echo ""
echo "🎉 驗證檔案已部署！"
echo "請等待 Zeabur 部署完成（約 2-3 分鐘），然後回到 Search Console 點擊「驗證」"

