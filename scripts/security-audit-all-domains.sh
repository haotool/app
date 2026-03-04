#!/bin/bash
# Security Audit Script for Multiple Domains
# 自動檢查多個網域的安全配置、SSL/TLS、Headers 等
#
# Usage: ./scripts/security-audit-all-domains.sh
# Output: 生成詳細的評分報告

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置：要檢查的網域列表
DOMAINS=(
  "https://app.haotool.org/ratewise/"
  "https://app.haotool.org/nihonname/"
  "https://app.haotool.org/quake-school/"
  "https://app.haotool.org/"
  "https://app.haotool.org/park-keeper/"
)

# 評分基準
PERFECT_SCORE=100
CURRENT_TOTAL_SCORE=0

# 輸出檔案
OUTPUT_DIR="$(pwd)/security-audit-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${OUTPUT_DIR}/security-audit-${TIMESTAMP}.md"

# 創建輸出目錄
mkdir -p "${OUTPUT_DIR}"

# 初始化報告
init_report() {
  cat > "${REPORT_FILE}" << EOF
# Security Audit Report - Multi-Domain

**生成時間**: $(date +"%Y-%m-%d %H:%M:%S %Z")
**檢查工具**: curl, openssl, custom scoring
**評分標準**: OWASP + Mozilla Observatory + SSL Labs

---

EOF
}

# 打印標題
print_header() {
  local text="$1"
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  ${text}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# 打印成功訊息
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# 打印警告訊息
print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# 打印錯誤訊息
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# 檢查 HTTP 基本資訊
check_http_basics() {
  local url="$1"
  local domain=$(echo "$url" | sed -E 's|https?://([^/]+).*|\1|')

  echo "### HTTP 基本資訊" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_header "檢查 HTTP 基本資訊: ${domain}"

  # HTTP 狀態碼
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [[ "$status_code" == "200" ]]; then
    print_success "HTTP Status: ${status_code}"
    echo "- ✅ HTTP Status: ${status_code}" >> "${REPORT_FILE}"
  else
    print_error "HTTP Status: ${status_code}"
    echo "- ❌ HTTP Status: ${status_code}" >> "${REPORT_FILE}"
    return 1
  fi

  # HTTP 版本
  local http_version=$(curl -sI "$url" | head -1 | awk '{print $1}')
  if [[ "$http_version" == "HTTP/2" ]] || [[ "$http_version" == "HTTP/3" ]]; then
    print_success "HTTP Version: ${http_version}"
    echo "- ✅ HTTP Version: ${http_version}" >> "${REPORT_FILE}"
  else
    print_warning "HTTP Version: ${http_version} (建議升級到 HTTP/2 或 HTTP/3)"
    echo "- ⚠️ HTTP Version: ${http_version}" >> "${REPORT_FILE}"
  fi

  # 回應時間
  local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url")
  echo "- ℹ️ Response Time: ${response_time}s" >> "${REPORT_FILE}"
  print_success "Response Time: ${response_time}s"

  echo "" >> "${REPORT_FILE}"
}

# 檢查 Security Headers
check_security_headers() {
  local url="$1"
  local domain=$(echo "$url" | sed -E 's|https?://([^/]+).*|\1|')
  local score=0
  local max_score=70

  echo "### Security Headers 評分" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_header "檢查 Security Headers: ${domain}"

  # 獲取所有 headers
  local headers=$(curl -sI "$url")

  # 1. Strict-Transport-Security (HSTS)
  if echo "$headers" | grep -qi "strict-transport-security.*max-age=31536000.*includesubdomains.*preload"; then
    print_success "HSTS: 完美配置 (+10分)"
    echo "- ✅ **HSTS**: 完美配置 (max-age=1年 + includeSubDomains + preload) +10分" >> "${REPORT_FILE}"
    ((score+=10))
  elif echo "$headers" | grep -qi "strict-transport-security"; then
    print_warning "HSTS: 存在但不完美 (+5分)"
    echo "- ⚠️ **HSTS**: 存在但不完美 +5分" >> "${REPORT_FILE}"
    ((score+=5))
  else
    print_error "HSTS: 缺失 (0分)"
    echo "- ❌ **HSTS**: 缺失 0分" >> "${REPORT_FILE}"
  fi

  # 2. Content-Security-Policy (CSP)
  if echo "$headers" | grep -qi "content-security-policy:" | grep -v "report-only"; then
    if echo "$headers" | grep -i "content-security-policy:" | grep -qv "unsafe-inline.*unsafe-eval"; then
      print_success "CSP: 嚴格策略 (+25分)"
      echo "- ✅ **CSP**: 嚴格策略（無 unsafe-inline/unsafe-eval 或使用 nonce/hash） +25分" >> "${REPORT_FILE}"
      ((score+=25))
    else
      print_warning "CSP: 存在但使用 unsafe 指令 (+15分)"
      echo "- ⚠️ **CSP**: 存在但使用 unsafe-inline/unsafe-eval +15分" >> "${REPORT_FILE}"
      ((score+=15))
    fi
  else
    print_error "CSP: 缺失 (0分)"
    echo "- ❌ **CSP**: 缺失 0分" >> "${REPORT_FILE}"
  fi

  # 3. X-Frame-Options
  if echo "$headers" | grep -qi "x-frame-options:.*\(deny\|sameorigin\)"; then
    print_success "X-Frame-Options: 已設定 (+5分)"
    echo "- ✅ **X-Frame-Options**: 已設定 +5分" >> "${REPORT_FILE}"
    ((score+=5))
  else
    print_error "X-Frame-Options: 缺失 (0分)"
    echo "- ❌ **X-Frame-Options**: 缺失 0分" >> "${REPORT_FILE}"
  fi

  # 4. X-Content-Type-Options
  if echo "$headers" | grep -qi "x-content-type-options:.*nosniff"; then
    print_success "X-Content-Type-Options: nosniff (+5分)"
    echo "- ✅ **X-Content-Type-Options**: nosniff +5分" >> "${REPORT_FILE}"
    ((score+=5))
  else
    print_error "X-Content-Type-Options: 缺失 (0分)"
    echo "- ❌ **X-Content-Type-Options**: 缺失 0分" >> "${REPORT_FILE}"
  fi

  # 5. Referrer-Policy
  if echo "$headers" | grep -qi "referrer-policy:.*\(strict-origin-when-cross-origin\|no-referrer\|same-origin\)"; then
    print_success "Referrer-Policy: 安全配置 (+5分)"
    echo "- ✅ **Referrer-Policy**: 安全配置 +5分" >> "${REPORT_FILE}"
    ((score+=5))
  else
    print_warning "Referrer-Policy: 缺失或不安全 (0分)"
    echo "- ⚠️ **Referrer-Policy**: 缺失或不安全 0分" >> "${REPORT_FILE}"
  fi

  # 6. Permissions-Policy
  if echo "$headers" | grep -qi "permissions-policy:"; then
    print_success "Permissions-Policy: 已設定 (+5分)"
    echo "- ✅ **Permissions-Policy**: 已設定 +5分" >> "${REPORT_FILE}"
    ((score+=5))
  else
    print_warning "Permissions-Policy: 缺失 (0分)"
    echo "- ⚠️ **Permissions-Policy**: 缺失 0分" >> "${REPORT_FILE}"
  fi

  # 7. Cross-Origin Headers (COEP, COOP, CORP)
  local cross_origin_score=0
  if echo "$headers" | grep -qi "cross-origin-embedder-policy:"; then
    ((cross_origin_score+=5))
  fi
  if echo "$headers" | grep -qi "cross-origin-opener-policy:"; then
    ((cross_origin_score+=5))
  fi
  if echo "$headers" | grep -qi "cross-origin-resource-policy:"; then
    ((cross_origin_score+=5))
  fi

  if [[ $cross_origin_score -eq 15 ]]; then
    print_success "Cross-Origin Isolation: 完整配置 (+15分)"
    echo "- ✅ **Cross-Origin Isolation**: 完整配置 (COEP + COOP + CORP) +15分" >> "${REPORT_FILE}"
    ((score+=15))
  elif [[ $cross_origin_score -gt 0 ]]; then
    print_warning "Cross-Origin Isolation: 部分配置 (+${cross_origin_score}分)"
    echo "- ⚠️ **Cross-Origin Isolation**: 部分配置 +${cross_origin_score}分" >> "${REPORT_FILE}"
    ((score+=cross_origin_score))
  else
    print_warning "Cross-Origin Isolation: 未配置 (0分)"
    echo "- ⚠️ **Cross-Origin Isolation**: 未配置 0分" >> "${REPORT_FILE}"
  fi

  # 計算等級
  local percentage=$((score * 100 / max_score))
  local grade=""
  if [[ $percentage -ge 90 ]]; then
    grade="A+"
  elif [[ $percentage -ge 80 ]]; then
    grade="A"
  elif [[ $percentage -ge 70 ]]; then
    grade="B+"
  elif [[ $percentage -ge 60 ]]; then
    grade="B"
  else
    grade="C"
  fi

  echo "" >> "${REPORT_FILE}"
  echo "**Security Headers 總分**: ${score}/${max_score} (${percentage}%) - **等級: ${grade}**" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_success "Security Headers 總分: ${score}/${max_score} (${percentage}%) - 等級: ${grade}"

  return $score
}

# 檢查 SSL/TLS 配置
check_ssl_tls() {
  local url="$1"
  local domain=$(echo "$url" | sed -E 's|https?://([^/]+).*|\1|')
  local score=0
  local max_score=30

  echo "### SSL/TLS 配置評分" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_header "檢查 SSL/TLS 配置: ${domain}"

  # 使用 openssl 檢查 TLS
  local ssl_info=$(echo | openssl s_client -connect "${domain}:443" -servername "${domain}" -brief 2>&1)

  # 檢查 TLS 版本
  if echo "$ssl_info" | grep -q "TLSv1.3"; then
    print_success "TLS Version: 1.3 (+10分)"
    echo "- ✅ **TLS Version**: 1.3 +10分" >> "${REPORT_FILE}"
    ((score+=10))
  elif echo "$ssl_info" | grep -q "TLSv1.2"; then
    print_warning "TLS Version: 1.2 (+7分，建議升級到 1.3)"
    echo "- ⚠️ **TLS Version**: 1.2 +7分" >> "${REPORT_FILE}"
    ((score+=7))
  else
    print_error "TLS Version: 過舊 (0分)"
    echo "- ❌ **TLS Version**: 過舊或不支援 0分" >> "${REPORT_FILE}"
  fi

  # 檢查加密套件
  if echo "$ssl_info" | grep -qE "(AES_256_GCM|CHACHA20)"; then
    print_success "Cipher Suite: 強加密 (+10分)"
    echo "- ✅ **Cipher Suite**: 強加密 (AES-256-GCM 或 ChaCha20) +10分" >> "${REPORT_FILE}"
    ((score+=10))
  elif echo "$ssl_info" | grep -q "AES_128_GCM"; then
    print_warning "Cipher Suite: 中等強度 (+7分)"
    echo "- ⚠️ **Cipher Suite**: 中等強度 +7分" >> "${REPORT_FILE}"
    ((score+=7))
  else
    print_error "Cipher Suite: 弱加密 (0分)"
    echo "- ❌ **Cipher Suite**: 弱加密 0分" >> "${REPORT_FILE}"
  fi

  # 檢查證書
  local cert_info=$(echo | openssl s_client -connect "${domain}:443" -servername "${domain}" 2>/dev/null | openssl x509 -noout -text 2>/dev/null)

  if echo "$cert_info" | grep -q "Public Key Algorithm: id-ecPublicKey"; then
    print_success "Certificate: ECC (+5分，效能最佳)"
    echo "- ✅ **Certificate**: ECC +5分" >> "${REPORT_FILE}"
    ((score+=5))
  elif echo "$cert_info" | grep -q "Public Key Algorithm: rsaEncryption"; then
    print_warning "Certificate: RSA (+3分，建議使用 ECC)"
    echo "- ⚠️ **Certificate**: RSA +3分" >> "${REPORT_FILE}"
    ((score+=3))
  fi

  # 檢查 HTTP/3 支援
  if curl -sI "$url" | grep -qi "alt-svc:.*h3="; then
    print_success "HTTP/3: 已啟用 (+5分)"
    echo "- ✅ **HTTP/3**: 已啟用 +5分" >> "${REPORT_FILE}"
    ((score+=5))
  else
    print_warning "HTTP/3: 未啟用 (0分)"
    echo "- ⚠️ **HTTP/3**: 未啟用 0分" >> "${REPORT_FILE}"
  fi

  # 計算等級
  local percentage=$((score * 100 / max_score))
  local grade=""
  if [[ $percentage -ge 90 ]]; then
    grade="A+"
  elif [[ $percentage -ge 80 ]]; then
    grade="A"
  elif [[ $percentage -ge 70 ]]; then
    grade="B+"
  else
    grade="B"
  fi

  echo "" >> "${REPORT_FILE}"
  echo "**SSL/TLS 總分**: ${score}/${max_score} (${percentage}%) - **等級: ${grade}**" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_success "SSL/TLS 總分: ${score}/${max_score} (${percentage}%) - 等級: ${grade}"

  return $score
}

# 檢查 HSTS Preload 狀態
check_hsts_preload() {
  local url="$1"
  local domain=$(echo "$url" | sed -E 's|https?://([^/]+).*|\1|' | sed 's/^www\.//')

  echo "### HSTS Preload 狀態" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_header "檢查 HSTS Preload: ${domain}"

  # 檢查 preload 狀態
  local preload_status=$(curl -s "https://hstspreload.org/api/v2/status?domain=${domain}")
  local status=$(echo "$preload_status" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

  if [[ "$status" == "preloaded" ]]; then
    print_success "HSTS Preload: 已加入 preload list"
    echo "- ✅ **HSTS Preload**: 已加入瀏覽器 preload list" >> "${REPORT_FILE}"
  elif [[ "$status" == "pending" ]]; then
    print_warning "HSTS Preload: 等待審核中"
    echo "- ⏳ **HSTS Preload**: 等待加入 preload list" >> "${REPORT_FILE}"
  else
    # 檢查是否符合 preload 條件
    local preloadable=$(curl -s "https://hstspreload.org/api/v2/preloadable?domain=${domain}")
    local errors=$(echo "$preloadable" | grep -o '"errors":\[[^]]*\]')

    if [[ "$errors" == '"errors":[]' ]]; then
      print_warning "HSTS Preload: 未提交（但符合條件）"
      echo "- 🟡 **HSTS Preload**: 未提交，但符合所有條件" >> "${REPORT_FILE}"
      echo "  - 建議前往 https://hstspreload.org/?domain=${domain} 提交" >> "${REPORT_FILE}"
    else
      print_error "HSTS Preload: 不符合條件"
      echo "- ❌ **HSTS Preload**: 不符合 preload 條件" >> "${REPORT_FILE}"
    fi
  fi

  echo "" >> "${REPORT_FILE}"
}

# 檢查壓縮和效能優化
check_performance() {
  local url="$1"
  local domain=$(echo "$url" | sed -E 's|https?://([^/]+).*|\1|')

  echo "### 效能優化檢查" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_header "檢查效能優化: ${domain}"

  # 檢查壓縮
  local headers=$(curl -sI -H "Accept-Encoding: br, gzip, deflate" "$url")

  if echo "$headers" | grep -qi "content-encoding:.*br"; then
    print_success "Compression: Brotli (最佳)"
    echo "- ✅ **Compression**: Brotli (最佳壓縮率)" >> "${REPORT_FILE}"
  elif echo "$headers" | grep -qi "content-encoding:.*gzip"; then
    print_warning "Compression: Gzip (建議啟用 Brotli)"
    echo "- ⚠️ **Compression**: Gzip" >> "${REPORT_FILE}"
  else
    print_error "Compression: 未啟用"
    echo "- ❌ **Compression**: 未啟用" >> "${REPORT_FILE}"
  fi

  # 檢查 HTTP/2
  if echo "$headers" | head -1 | grep -q "HTTP/2"; then
    print_success "HTTP/2: 已啟用"
    echo "- ✅ **HTTP/2**: 已啟用" >> "${REPORT_FILE}"
  else
    print_warning "HTTP/2: 未啟用"
    echo "- ⚠️ **HTTP/2**: 未啟用" >> "${REPORT_FILE}"
  fi

  # 檢查 Cache-Control
  if echo "$headers" | grep -qi "cache-control:"; then
    local cache_control=$(echo "$headers" | grep -i "cache-control:" | head -1)
    print_success "Cache-Control: 已設定"
    echo "- ✅ **Cache-Control**: 已設定" >> "${REPORT_FILE}"
    echo "  \`\`\`${cache_control}\`\`\`" >> "${REPORT_FILE}"
  else
    print_warning "Cache-Control: 未設定"
    echo "- ⚠️ **Cache-Control**: 未設定" >> "${REPORT_FILE}"
  fi

  echo "" >> "${REPORT_FILE}"
}

# 執行單一網域的完整檢查
audit_domain() {
  local url="$1"
  local domain=$(echo "$url" | sed -E 's|https?://([^/]+).*|\1|')

  echo "" >> "${REPORT_FILE}"
  echo "## 🌐 Domain: ${url}" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_header "開始檢查: ${url}"

  # 執行各項檢查
  check_http_basics "$url"
  check_security_headers "$url"
  local security_score=$?

  check_ssl_tls "$url"
  local ssl_score=$?

  check_hsts_preload "$url"
  check_performance "$url"

  # 計算總分
  local total_score=$((security_score + ssl_score))
  echo "**總分**: ${total_score}/100" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"
  echo "---" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"

  print_success "完成檢查: ${url} - 總分: ${total_score}/100"
}

# 主函數
main() {
  print_header "Security Audit - Multi-Domain Scanner"
  echo "檢查 ${#DOMAINS[@]} 個網域..."
  echo ""

  init_report

  for domain in "${DOMAINS[@]}"; do
    audit_domain "$domain"
    sleep 1  # 避免請求過於頻繁
  done

  echo "" >> "${REPORT_FILE}"
  echo "---" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"
  echo "## 總結" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"
  echo "✅ 檢查完成！共檢查 ${#DOMAINS[@]} 個網域。" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"
  echo "**報告生成時間**: $(date +"%Y-%m-%d %H:%M:%S %Z")" >> "${REPORT_FILE}"

  print_header "檢查完成"
  print_success "報告已生成: ${REPORT_FILE}"
  echo ""
  echo "使用以下命令查看報告："
  echo "  cat ${REPORT_FILE}"
  echo ""
}

# 執行主函數
main
