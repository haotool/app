# Security Headers Worker 部署指引

## 快速部署

### 前置條件

- Cloudflare 帳號與 API Token
- Worker 名稱：`security-headers`
- 已綁定路由：`app.haotool.org/ratewise/*`, `haotool.org/*`, `www.haotool.org/*`

### 部署步驟

#### 方法 1: Wrangler CLI（推薦）

```bash
cd security-headers

# 設定環境變數
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# 部署
pnpm exec wrangler deploy
```

#### 方法 2: Cloudflare Dashboard

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 進入 Workers & Pages → `security-headers`
3. Quick Edit → 複製貼上 `src/worker.js` 內容
4. Save and Deploy

### 部署後驗證

```bash
# 1. 檢查版本號（HEAD 請求即可）
curl -sI https://app.haotool.org/ratewise/ | grep X-Security-Policy-Version
# 預期: x-security-policy-version: 3.4

# 2. 確認 CSP hashes（必須用 GET，HEAD 請求不含 hash — 這是正確行為）
curl -s --compressed https://app.haotool.org/ratewise/ -D - -o /dev/null | grep script-src
# 預期: 5 個 sha256-... hash + https://www.googletagmanager.com

# 3. 確認 connect-src 包含 googletagmanager
curl -sI https://app.haotool.org/ratewise/ | grep connect-src
# 預期: ... https://www.googletagmanager.com ...

# 4. Playwright console 驗證（預期 1 個假陽性 ERR_FAILED，0 個 CSP 違規）
```

**注意**：Playwright 顯示的 `ERR_FAILED @ gtag/js` 是測試環境假陽性（`--disable-background-networking` flag），生產環境不受影響。

## 版本歷史

### v3.4 (2026-03-06)

**修復**: GA4 XHR 請求被 CSP connect-src 阻擋；GA4 script COEP 相容性

- `connect-src` 新增 `https://www.googletagmanager.com`（gtag.js 初始化時的配置 fetch）
- `ga.ts` 動態注入 `<script>` 加上 `crossOrigin = 'anonymous'`（符合 `COEP: require-corp`）
- `__network_probe__` 版本號從 `3.2` 對齊至 `3.4`

### v3.3 (2026-03-05)

**修復**: CSP inline script hash 不匹配導致 GA4 阻擋問題

- 移除 `computeInlineScriptHashes()` 中的 `trim()` 以保留原始空白
- 解決瀏覽器 CSP 驗證與 Worker hash 計算不一致問題
- 影響: Google Analytics inline script 被 CSP 阻擋（ERR_FAILED）

### v3.2 (2026-03-04)

- 動態計算 inline script SHA-256 hash 取代 `unsafe-inline`
- 支援 GA4 / GTM-W4LKKNL
- 隱藏 Zeabur 來源標頭

### v3.0-3.1

- 初始 SSOT 架構
- RateWise A+ 安全標頭配置
- HSTS + CSP + CORS 完整防護

## 故障排除

### CSP Violation 錯誤

**症狀**: Console 顯示 "Executing inline script violates... Content Security Policy"
**解決**: 確認 Worker v3.3+ 已部署，hash 計算不使用 trim()

### GA4 無法載入

**症狀**: Console 顯示 "Failed to load resource: net::ERR_FAILED" for gtag/js
**解決**: 驗證 Worker CSP 包含 `https://www.googletagmanager.com`

### Permissions-Policy 警告

**影響**: 非關鍵警告，不影響安全性或 SEO
**來源**: `ambient-light-sensor`, `document-domain`, `vr` 為瀏覽器已廢棄特性
**處理**: 可忽略，或更新 Worker 移除這些特性（低優先度）

## 相關文件

- Cloudflare Workers 官方文檔: <https://developers.cloudflare.com/workers/>
- CSP Hash 規範: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src>
- 本專案 Security Baseline: `/Users/azlife.eth/Tools/app/docs/SECURITY_BASELINE.md`
