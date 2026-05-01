#!/bin/bash

# Lighthouse CI 監測腳本
# 用途: 掃描 RateWise 主要頁面，確保 SEO/Performance 分數不下降
# 作者: Claude Code
# 日期: 2026-05-02
# 版本: v1.0.0

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置（預設從 app.config.mjs SSOT 取得，可用 LIGHTHOUSE_BASE_URL 覆寫）
BASE_URL="${LIGHTHOUSE_BASE_URL:-$(node --input-type=module -e "import { APP_CONFIG } from './apps/ratewise/app.config.mjs'; console.log(APP_CONFIG.siteUrl.replace(/\\/$/, ''))")}"
REPORT_DIR="./reports/lighthouse"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CHROME_FLAGS="--headless --no-sandbox --disable-dev-shm-usage"

# Baseline 分數 (v2026.2)
BASELINE_PERFORMANCE=95
BASELINE_ACCESSIBILITY=95
BASELINE_BEST_PRACTICES=95
BASELINE_SEO=98

# 警告閾值 (降低超過此值觸發警告)
WARNING_THRESHOLD=5

# 待掃描頁面：從 APP_CONFIG.seoPaths 取 smoke subset，避免維護第二份 URL 清單。
mapfile -t PAGES < <(node --input-type=module -e "import { APP_CONFIG } from './apps/ratewise/app.config.mjs'; const preferred = new Set(['/', '/faq/', '/about/', '/guide/', '/usd-twd/', '/jpy-twd/']); console.log(APP_CONFIG.seoPaths.filter((path) => preferred.has(path)).join('\\n'))")

# 函數：打印帶顏色的訊息
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# 函數：檢查 lighthouse 是否安裝
check_lighthouse() {
  if ! command -v lighthouse &> /dev/null; then
    print_error "Lighthouse 未安裝"
    print_info "請執行: npm install -g lighthouse"
    exit 1
  fi
  print_success "Lighthouse 已安裝 ($(lighthouse --version))"
}

# 函數：建立報告目錄
create_report_dir() {
  mkdir -p "$REPORT_DIR/$TIMESTAMP"
  print_success "報告目錄已建立: $REPORT_DIR/$TIMESTAMP"
}

# 函數：執行 Lighthouse 掃描
run_lighthouse() {
  local page=$1
  local page_name=$(echo "$page" | sed 's/\//_/g' | sed 's/^_//')
  [ -z "$page_name" ] && page_name="home"

  local url="${BASE_URL}${page}"
  local output_path="$REPORT_DIR/$TIMESTAMP/lighthouse-${page_name}"

  print_info "掃描中: $url"

  lighthouse "$url" \
    --output json \
    --output html \
    --output-path "$output_path" \
    --chrome-flags="$CHROME_FLAGS" \
    --quiet \
    || {
      print_error "掃描失敗: $url"
      return 1
    }

  print_success "完成: $page_name"
}

# 函數：分析分數並比對 baseline
analyze_scores() {
  local json_file=$1
  local page_name=$2

  if [ ! -f "$json_file" ]; then
    print_error "找不到報告檔案: $json_file"
    return 1
  fi

  # 提取分數 (使用 node 來解析 JSON)
  local performance=$(node -e "console.log(Math.round(require('$json_file').categories.performance.score * 100))")
  local accessibility=$(node -e "console.log(Math.round(require('$json_file').categories.accessibility.score * 100))")
  local best_practices=$(node -e "console.log(Math.round(require('$json_file').categories['best-practices'].score * 100))")
  local seo=$(node -e "console.log(Math.round(require('$json_file').categories.seo.score * 100))")

  echo ""
  print_info "=== $page_name 分數 ==="
  echo "  Performance:     $performance / 100 (baseline: $BASELINE_PERFORMANCE)"
  echo "  Accessibility:   $accessibility / 100 (baseline: $BASELINE_ACCESSIBILITY)"
  echo "  Best Practices:  $best_practices / 100 (baseline: $BASELINE_BEST_PRACTICES)"
  echo "  SEO:             $seo / 100 (baseline: $BASELINE_SEO)"

  # 檢查是否有分數下降
  local has_warning=false

  if [ $((BASELINE_PERFORMANCE - performance)) -ge $WARNING_THRESHOLD ]; then
    print_warning "Performance 下降 $((BASELINE_PERFORMANCE - performance)) 分！"
    has_warning=true
  fi

  if [ $((BASELINE_ACCESSIBILITY - accessibility)) -ge $WARNING_THRESHOLD ]; then
    print_warning "Accessibility 下降 $((BASELINE_ACCESSIBILITY - accessibility)) 分！"
    has_warning=true
  fi

  if [ $((BASELINE_BEST_PRACTICES - best_practices)) -ge $WARNING_THRESHOLD ]; then
    print_warning "Best Practices 下降 $((BASELINE_BEST_PRACTICES - best_practices)) 分！"
    has_warning=true
  fi

  if [ $((BASELINE_SEO - seo)) -ge $WARNING_THRESHOLD ]; then
    print_warning "SEO 下降 $((BASELINE_SEO - seo)) 分！"
    has_warning=true
  fi

  if [ "$has_warning" = true ]; then
    echo ""
    print_warning "建議行動："
    echo "  1. 查看 HTML 報告: $REPORT_DIR/$TIMESTAMP/lighthouse-${page_name}.report.html"
    echo "  2. 比對 git diff，找出可能原因"
    echo "  3. 使用 Context7 查詢官方最佳實踐"
    echo "  4. 如無法修正 → 考慮回滾變更"
    echo "  5. 記錄於 docs/dev/002_development_reward_penalty_log.md (-1 分)"
    return 1
  else
    print_success "所有分數符合或超過 baseline ✨"
    return 0
  fi
}

# 主程式
main() {
  print_info "🚀 Lighthouse CI 監測開始"
  print_info "Base URL: $BASE_URL"
  print_info "報告時間: $TIMESTAMP"
  echo ""

  # 檢查 lighthouse
  check_lighthouse

  # 建立報告目錄
  create_report_dir

  # 掃描所有頁面
  print_info "開始掃描 ${#PAGES[@]} 個頁面..."
  echo ""

  local all_passed=true

  for page in "${PAGES[@]}"; do
    local page_name=$(echo "$page" | sed 's/\//_/g' | sed 's/^_//')
    [ -z "$page_name" ] && page_name="home"

    # 執行掃描
    if run_lighthouse "$page"; then
      # 分析分數
      local json_file="$REPORT_DIR/$TIMESTAMP/lighthouse-${page_name}.report.json"
      if ! analyze_scores "$json_file" "$page_name"; then
        all_passed=false
      fi
    else
      all_passed=false
    fi

    echo ""
  done

  # 總結
  print_info "=== 掃描完成 ==="
  echo "  報告位置: $REPORT_DIR/$TIMESTAMP/"
  echo ""

  if [ "$all_passed" = true ]; then
    print_success "🎉 所有頁面通過檢查！"
    exit 0
  else
    print_error "⚠️  部分頁面有分數下降，請檢查報告"
    exit 1
  fi
}

# 執行主程式
main
