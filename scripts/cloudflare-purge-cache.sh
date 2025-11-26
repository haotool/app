#!/bin/bash
# Cloudflare 快取清除腳本
# 用途：部署後自動清除 Cloudflare 快取
# 使用方式：./scripts/cloudflare-purge-cache.sh
#
# 環境變數：
# - CLOUDFLARE_ZONE_ID: Cloudflare Zone ID
# - CLOUDFLARE_API_TOKEN: Cloudflare API Token（需要 Cache Purge 權限）
#
# 參考：https://developers.cloudflare.com/api/operations/zone-purge

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 環境變數檢查
if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo -e "${RED}❌ Error: CLOUDFLARE_ZONE_ID not set${NC}"
  echo "請設定環境變數: export CLOUDFLARE_ZONE_ID=your-zone-id"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo -e "${RED}❌ Error: CLOUDFLARE_API_TOKEN not set${NC}"
  echo "請設定環境變數: export CLOUDFLARE_API_TOKEN=your-api-token"
  exit 1
fi

echo -e "${YELLOW}🔄 Purging Cloudflare cache...${NC}"
echo "Zone ID: $CLOUDFLARE_ZONE_ID"

# 清除所有快取
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

# 檢查 jq 是否安裝
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️  Warning: jq not installed, cannot parse JSON response${NC}"
  echo "Response: $RESPONSE"
  exit 0
fi

# 檢查回應
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Cloudflare cache purged successfully${NC}"
  
  # 顯示詳細資訊
  PURGE_ID=$(echo "$RESPONSE" | jq -r '.result.id // "N/A"')
  echo "Purge ID: $PURGE_ID"
else
  echo -e "${RED}❌ Failed to purge cache:${NC}"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

