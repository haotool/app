#!/bin/bash
# 
# 歷史匯率功能快速部署腳本
# 
# 功能：
# - 自動建立 data 分支
# - 啟用歷史資料 workflow
# - 執行初次測試
# 
# 使用方式：
#   chmod +x scripts/setup-historical-rates.sh
#   ./scripts/setup-historical-rates.sh
# 
# @author s123104
# @created 2025-10-13T22:59:32+08:00

set -e  # 遇到錯誤立即停止

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 檢查必要工具
check_prerequisites() {
    log_info "檢查必要工具..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安裝，請先安裝 Git"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq 未安裝，部分驗證功能可能無法使用"
        log_info "安裝方式: brew install jq"
    fi
    
    log_success "工具檢查完成"
}

# 確認當前狀態
confirm_setup() {
    echo ""
    log_info "即將執行以下操作："
    echo "  1. 建立 data 分支（如果不存在）"
    echo "  2. 啟用歷史資料 workflow"
    echo "  3. 手動觸發首次執行"
    echo ""
    read -p "是否繼續？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "已取消部署"
        exit 0
    fi
}

# 階段 1：建立 data 分支
setup_data_branch() {
    log_info "階段 1/3: 建立 data 分支..."
    
    # 確保在專案根目錄
    if [ ! -f "package.json" ]; then
        log_error "請在專案根目錄執行此腳本"
        exit 1
    fi
    
    # 確保 main 分支是最新的
    log_info "更新 main 分支..."
    git checkout main
    git pull origin main
    
    # 檢查 data 分支是否已存在
    if git rev-parse --verify data &> /dev/null; then
        log_warning "data 分支已存在，跳過建立步驟"
    else
        log_info "建立 data 分支..."
        git checkout -b data main
        
        # 確保目錄結構
        mkdir -p public/rates/history
        
        # 如果存在 latest.json，建立初始歷史檔案
        CURRENT_DATE=$(TZ=Asia/Taipei date +%Y-%m-%d)
        if [ -f "public/rates/latest.json" ]; then
            log_info "複製最新匯率到歷史檔案..."
            cp public/rates/latest.json "public/rates/history/${CURRENT_DATE}.json"
        else
            log_warning "latest.json 不存在，將由 workflow 自動建立"
        fi
        
        # 提交
        git add public/rates/
        git commit -m "chore(data): initialize data branch for exchange rates

- Create isolated branch for rate updates
- Preserve 25-day historical data
- Keep main branch clean"
        
        # 推送
        log_info "推送 data 分支到遠端..."
        git push -u origin data
        
        log_success "data 分支建立完成"
    fi
    
    # 切回 main 分支
    git checkout main
}

# 階段 2：啟用新的 workflow
setup_workflow() {
    log_info "階段 2/3: 啟用歷史資料 workflow..."
    
    # 檢查舊 workflow 是否存在
    if [ -f ".github/workflows/update-exchange-rates.yml" ]; then
        log_info "備份舊的 workflow..."
        mv .github/workflows/update-exchange-rates.yml \
           .github/workflows/update-exchange-rates.yml.backup
    fi
    
    # 檢查新 workflow 是否存在
    if [ ! -f ".github/workflows/update-exchange-rates-historical.yml" ]; then
        log_error "找不到 update-exchange-rates-historical.yml"
        exit 1
    fi
    
    # 啟用新 workflow
    log_info "啟用新的 workflow..."
    cp .github/workflows/update-exchange-rates-historical.yml \
       .github/workflows/update-exchange-rates.yml
    
    # 提交變更
    git add .github/workflows/
    git commit -m "chore(ci): activate historical rate tracking workflow

- Replace old workflow with historical version
- Backup old workflow for reference
- Enable 25-day data retention" || log_warning "沒有需要提交的變更"
    
    # 推送
    log_info "推送 workflow 變更到遠端..."
    git push origin main
    
    log_success "Workflow 啟用完成"
}

# 階段 3：測試與驗證
test_setup() {
    log_info "階段 3/3: 測試與驗證..."
    
    # 檢查是否安裝 gh CLI
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI (gh) 未安裝，跳過自動測試"
        log_info "請手動前往 GitHub Actions 頁面觸發 workflow："
        log_info "https://github.com/haotool/app/actions/workflows/update-exchange-rates.yml"
        return
    fi
    
    # 手動觸發 workflow
    log_info "手動觸發 workflow（首次執行）..."
    gh workflow run update-exchange-rates.yml
    
    log_success "Workflow 已觸發"
    log_info "等待 10 秒讓 workflow 開始執行..."
    sleep 10
    
    # 查看執行狀態
    log_info "最近的執行記錄："
    gh run list --workflow=update-exchange-rates.yml --limit 3
    
    echo ""
    log_info "監控 workflow 執行："
    log_info "  gh run watch"
    echo ""
    log_info "查看執行詳情："
    log_info "  gh run list --workflow=update-exchange-rates.yml --limit 1"
}

# 完成提示
show_completion_message() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    log_success "歷史匯率功能部署完成！"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    log_info "下一步："
    echo ""
    echo "  1. 等待 Workflow 執行完成（約 2-3 分鐘）"
    echo "     監控：gh run watch"
    echo ""
    echo "  2. 驗證 data 分支資料："
    echo "     git checkout data"
    echo "     ls -la public/rates/history/"
    echo ""
    echo "  3. 測試 CDN（需等待 2-5 分鐘 CDN 快取更新）："
    echo "     curl https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | jq ."
    echo ""
    echo "  4. 查看完整文檔："
    echo "     docs/HISTORICAL_RATES_IMPLEMENTATION.md"
    echo "     docs/dev/HISTORICAL_RATES_DEPLOYMENT_PLAN.md"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
}

# 主流程
main() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  歷史匯率功能快速部署腳本"
    echo "  版本: 1.0.0"
    echo "  時間: $(TZ=Asia/Taipei date +"%Y-%m-%d %H:%M:%S")"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    check_prerequisites
    confirm_setup
    
    echo ""
    setup_data_branch
    echo ""
    setup_workflow
    echo ""
    test_setup
    echo ""
    show_completion_message
}

# 執行主流程
main
