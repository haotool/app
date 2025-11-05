#!/bin/bash
#
# PWA 部署測試腳本
# 
# 用途：自動化測試 PWA 配置和部署
# 作者：RateWise Team
# 日期：2025-11-05
# 版本：1.0.0
#
# [ref:docs/dev/007_pwa_version_complete_implementation.md]
#

set -e  # 遇到錯誤立即退出

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 輸出函數
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 檢查必要工具
check_tools() {
    info "檢查必要工具..."
    
    local tools=("pnpm" "docker" "curl" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool 未安裝"
            exit 1
        fi
        success "$tool 已安裝"
    done
}

# 清除舊建置
clean_build() {
    info "清除舊建置..."
    rm -rf apps/ratewise/dist
    success "舊建置已清除"
}

# 建置應用程式
build_app() {
    info "建置應用程式..."
    VITE_BASE_PATH=/ratewise/ pnpm --filter @app/ratewise build
    
    if [ ! -d "apps/ratewise/dist" ]; then
        error "建置失敗：dist 目錄不存在"
        exit 1
    fi
    
    success "應用程式建置成功"
}

# 檢查版本號
check_version() {
    info "檢查版本號..."
    
    local version=$(grep "app-version" apps/ratewise/dist/index.html | sed -n 's/.*content="\([^"]*\)".*/\1/p')
    
    if [ -z "$version" ]; then
        error "版本號未找到"
        return 1
    fi
    
    # 檢查版本號格式 (應該是 1.1.xxx)
    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
        error "版本號格式錯誤：$version"
        return 1
    fi
    
    success "版本號正確：$version"
}

# 檢查資源路徑
check_resource_paths() {
    info "檢查資源路徑..."
    
    # 檢查 JS bundle 路徑
    local js_path=$(grep -o 'src="/ratewise/assets/[^"]*\.js"' apps/ratewise/dist/index.html | head -1)
    if [ -z "$js_path" ]; then
        error "JS bundle 路徑錯誤"
        return 1
    fi
    success "JS 路徑正確：$js_path"
    
    # 檢查 CSS 路徑
    local css_path=$(grep -o 'href="/ratewise/assets/[^"]*\.css"' apps/ratewise/dist/index.html | head -1)
    if [ -z "$css_path" ]; then
        error "CSS 路徑錯誤"
        return 1
    fi
    success "CSS 路徑正確：$css_path"
}

# 建置 Docker 映像
build_docker() {
    info "建置 Docker 映像..."
    docker build -t ratewise:test . > /dev/null 2>&1
    success "Docker 映像建置成功"
}

# 啟動容器
start_container() {
    info "啟動測試容器..."
    
    # 清理舊容器
    docker rm -f ratewise_pwa_test > /dev/null 2>&1 || true
    
    # 啟動新容器
    docker run -d -p 8080:8080 --name ratewise_pwa_test ratewise:test > /dev/null
    
    # 等待容器健康
    info "等待容器啟動..."
    sleep 10
    
    # 檢查容器狀態
    if ! docker ps | grep -q "ratewise_pwa_test.*healthy"; then
        error "容器未正常啟動"
        docker logs ratewise_pwa_test
        exit 1
    fi
    
    success "容器已啟動並健康"
}

# 測試 HTTP 回應
test_http() {
    info "測試 HTTP 回應..."
    
    # 測試 /ratewise/ 路徑
    local status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/ratewise/")
    if [ "$status" != "200" ]; then
        error "/ratewise/ 返回 $status 而非 200"
        return 1
    fi
    success "/ratewise/ 返回 200 OK"
    
    # 測試 HTML 內容
    local html=$(curl -s "http://localhost:8080/ratewise/")
    if [[ ! "$html" =~ app-version ]]; then
        error "HTML 缺少 app-version meta 標籤"
        return 1
    fi
    success "HTML meta 標籤正確"
}

# 測試 Service Worker
test_service_worker() {
    info "測試 Service Worker..."
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/ratewise/sw.js")
    if [ "$status" != "200" ]; then
        error "Service Worker 返回 $status"
        return 1
    fi
    success "Service Worker 可訪問"
}

# 測試 Manifest
test_manifest() {
    info "測試 Web App Manifest..."
    
    # 獲取 manifest
    local manifest=$(curl -s "http://localhost:8080/ratewise/manifest.webmanifest")
    
    # 檢查 scope
    local scope=$(echo "$manifest" | jq -r '.scope')
    if [ "$scope" != "/ratewise/" ]; then
        error "Manifest scope 錯誤：$scope"
        return 1
    fi
    success "Manifest scope 正確：$scope"
    
    # 檢查 start_url
    local start_url=$(echo "$manifest" | jq -r '.start_url')
    if [ "$start_url" != "/ratewise/" ]; then
        error "Manifest start_url 錯誤：$start_url"
        return 1
    fi
    success "Manifest start_url 正確：$start_url"
    
    # 檢查 id
    local id=$(echo "$manifest" | jq -r '.id')
    if [ "$id" != "/ratewise/" ]; then
        error "Manifest id 錯誤：$id"
        return 1
    fi
    success "Manifest id 正確：$id"
}

# 測試靜態資源
test_static_assets() {
    info "測試靜態資源..."
    
    # 獲取 JS 檔案路徑
    local js_file=$(docker exec ratewise_pwa_test ls /usr/share/nginx/html/assets/index-*.js | head -1 | xargs basename)
    
    # 測試 /ratewise/assets/ 路徑
    local status1=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/ratewise/assets/$js_file")
    if [ "$status1" != "200" ]; then
        error "/ratewise/assets/$js_file 返回 $status1"
        return 1
    fi
    success "/ratewise/assets/ 路徑可訪問"
    
    # 測試 /assets/ 路徑
    local status2=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/assets/$js_file")
    if [ "$status2" != "200" ]; then
        error "/assets/$js_file 返回 $status2"
        return 1
    fi
    success "/assets/ 路徑可訪問"
}

# 清理測試環境
cleanup() {
    info "清理測試環境..."
    docker rm -f ratewise_pwa_test > /dev/null 2>&1 || true
    success "測試環境已清理"
}

# 主函數
main() {
    echo ""
    info "======================================"
    info "  RateWise PWA 部署測試"
    info "======================================"
    echo ""
    
    # 檢查工具
    check_tools
    echo ""
    
    # 建置測試
    info "======================================"
    info "  建置測試"
    info "======================================"
    echo ""
    clean_build
    build_app
    check_version
    check_resource_paths
    echo ""
    
    # Docker 測試
    info "======================================"
    info "  Docker 測試"
    info "======================================"
    echo ""
    build_docker
    start_container
    echo ""
    
    # HTTP 測試
    info "======================================"
    info "  HTTP 測試"
    info "======================================"
    echo ""
    test_http
    test_service_worker
    test_manifest
    test_static_assets
    echo ""
    
    # 總結
    echo ""
    success "======================================"
    success "  所有測試通過！✨"
    success "======================================"
    echo ""
    
    info "準備部署到生產環境"
    info "建議步驟："
    echo "  1. 清除 Cloudflare 快取"
    echo "  2. 部署到生產環境"
    echo "  3. 執行生產環境驗證"
    echo ""
    
    # 清理
    cleanup
}

# 捕獲錯誤並清理
trap cleanup EXIT

# 執行主函數
main

