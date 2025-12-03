#!/bin/bash
# CDN 快取清除腳本 - Service Worker 更新專用
#
# 用途: 在部署新版本後，確保 Service Worker 檔案立即生效
# 執行時機: 每次 push 到 main 後，或手動執行 `pnpm purge:cdn`
#
# 參考:
# - https://web.dev/articles/service-worker-lifecycle
# - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[CDN Purge] Starting CDN cache purge...${NC}"

# 需要清除的關鍵檔案與前綴
# [fix:2025-12-04] 新增 nihonname 路徑支援
CRITICAL_FILES=(
  "/ratewise/sw.js"
  "/ratewise/registerSW.js"
  "/ratewise/manifest.webmanifest"
  "/ratewise/index.html"
  "/nihonname/sw.js"
  "/nihonname/registerSW.js"
  "/nihonname/manifest.webmanifest"
  "/nihonname/index.html"
)
CRITICAL_PREFIXES=(
  "/ratewise/workbox-"
  "/ratewise/assets/"
  "/nihonname/workbox-"
  "/nihonname/assets/"
)

success=false

# 方法 1: 使用 Zeabur CLI (如果可用)
if command -v zeabur >/dev/null 2>&1; then
  echo -e "${GREEN}[CDN Purge] Zeabur CLI detected. Executing targeted purge...${NC}"
  zeabur_success=true
  for file in "${CRITICAL_FILES[@]}"; do
    echo "  Purging: $file"
    if ! zeabur cache purge "$file"; then
      echo -e "    ${RED}✗ Failed to purge $file via Zeabur${NC}"
      zeabur_success=false
    fi
  done
  if $zeabur_success; then
    echo -e "${GREEN}[CDN Purge] ✅ Zeabur purge completed${NC}"
    success=true
  else
    echo -e "${YELLOW}[CDN Purge] ⚠️  Zeabur purge finished with warnings${NC}"
  fi
fi

# 方法 2: 使用 Cloudflare API (如果使用 Cloudflare)
if ! $success && [[ -n "${CLOUDFLARE_ZONE_ID:-}" && -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo -e "${GREEN}[CDN Purge] Cloudflare credentials detected. Triggering API purge...${NC}"

  cloudflare_payload=$(
    cat <<JSON
{
  "files": [
    "https://app.haotool.org/ratewise/sw.js",
    "https://app.haotool.org/ratewise/registerSW.js",
    "https://app.haotool.org/ratewise/manifest.webmanifest",
    "https://app.haotool.org/ratewise/index.html",
    "https://app.haotool.org/nihonname/sw.js",
    "https://app.haotool.org/nihonname/registerSW.js",
    "https://app.haotool.org/nihonname/manifest.webmanifest",
    "https://app.haotool.org/nihonname/index.html"
  ],
  "prefixes": [
    "https://app.haotool.org/ratewise/workbox-",
    "https://app.haotool.org/ratewise/assets/",
    "https://app.haotool.org/nihonname/workbox-",
    "https://app.haotool.org/nihonname/assets/"
  ]
}
JSON
  )

  if curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$cloudflare_payload" >/tmp/cloudflare-purge.log; then
    echo -e "${GREEN}[CDN Purge] ✅ Cloudflare purge request accepted${NC}"
    success=true
  else
    echo -e "${RED}[CDN Purge] ❌ Cloudflare purge request failed${NC}"
    cat /tmp/cloudflare-purge.log || true
  fi
fi

if $success; then
  echo -e "${GREEN}[CDN Purge] Done. Users should get the latest Service Worker immediately.${NC}"
  exit 0
fi

# 方法 3: 手動提示
echo -e "${YELLOW}[CDN Purge] ⚠️  No CDN API configured. No purge was performed.${NC}"
echo -e "${YELLOW}[CDN Purge] Please purge the following URLs (and workbox/assets prefixes) via your CDN dashboard:${NC}"
echo ""
for file in "${CRITICAL_FILES[@]}"; do
  echo "  - https://app.haotool.org$file"
done
for prefix in "${CRITICAL_PREFIXES[@]}"; do
  echo "  - https://app.haotool.org${prefix}*"
done
echo ""
echo -e "${YELLOW}[CDN Purge] Or set environment variables:${NC}"
echo "  export CLOUDFLARE_ZONE_ID=your_zone_id"
echo "  export CLOUDFLARE_API_TOKEN=your_api_token"
echo ""
echo -e "${GREEN}[CDN Purge] ℹ️  Hint: nginx 已設定 sw.js / index.html 為 no-cache，但 CDN 仍需手動清除${NC}"
exit 1
