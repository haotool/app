# Cloudflare 配置最佳實踐指南

**建立時間**: 2025-11-26  
**適用方案**: Free Plan  
**專案階段**: 活躍開發階段  
**維護者**: DevOps Team

---

## 📋 快速開始檢查清單

### 必須配置項目（Free Plan）

- [ ] **快取規則（Cache Rules）**: 設定靜態資產快取策略
- [ ] **安全標頭（Transform Rules）**: 配置 CSP、HSTS 等安全標頭
- [ ] **Brotli 壓縮**: 啟用 Brotli 壓縮（優於 Gzip）
- [ ] **Auto Minify**: 啟用 JS/CSS/HTML 自動壓縮
- [ ] **Early Hints**: 啟用 Early Hints（提前發送 preload headers）
- [ ] **Rocket Loader**: 停用（避免 CSP 衝突）
- [ ] **自動 HTTPS 重寫**: 啟用 Automatic HTTPS Rewrites

### 建議配置項目（Free Plan）

- [ ] **Always Use HTTPS**: 強制 HTTPS 重定向
- [ ] **Minimum TLS Version**: 設定為 TLS 1.2
- [ ] **HTTP/2**: 確保啟用（預設開啟）
- [ ] **HTTP/3 (QUIC)**: 啟用（Free Plan 支援）
- [ ] **0-RTT Connection Resumption**: 啟用（減少 TLS 握手時間）

---

## 1. 快取規則配置（Cache Rules）

### 為何使用 Cache Rules 而非 Page Rules？

| 特性               | Cache Rules        | Page Rules |
| ------------------ | ------------------ | ---------- |
| **狀態**           | ✅ 推薦（新標準）  | ⚠️ 已過時  |
| **Free Plan 限制** | 10 條規則          | 3 條規則   |
| **靈活性**         | 高（支援複雜條件） | 低         |
| **效能**           | 更快               | 較慢       |
| **未來支援**       | 持續更新           | 逐步淘汰   |

### 配置步驟

1. 登入 Cloudflare Dashboard
2. 選擇網域 > **Caching** > **Cache Rules**
3. 點擊 **Create rule**

### Rule 1: 靜態資產快取（活躍開發階段）

**規則名稱**: `Static Assets - Development Phase`

**條件（When incoming requests match）**:

```
Hostname equals app.haotool.org
AND
URI Path matches regex: \.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|ico|webp|avif|br|gz)$
```

**動作（Then）**:

- **Cache eligibility**: Eligible for cache
- **Edge TTL**: 1 day
- **Browser TTL**: 1 day
- **Respect Origin Cache-Control**: No（忽略 Nginx 的 Cache-Control）

**理由**:

- 活躍開發階段，頻繁部署，1 天快取平衡效能與更新速度
- 避免 CDN 邊緣節點快取不一致
- 無需手動清除快取

**穩定生產階段後調整為**:

- **Edge TTL**: 1 year
- **Browser TTL**: 1 year
- 添加 `immutable` 標記（需透過 Transform Rules）

### Rule 2: HTML 不快取

**規則名稱**: `HTML No Cache`

**條件（When incoming requests match）**:

```
Hostname equals app.haotool.org
AND
URI Path matches regex: \.html?$
```

**動作（Then）**:

- **Cache eligibility**: Bypass cache

**理由**:

- 確保 HTML 更新即時生效
- 避免使用者看到舊版本頁面

### Rule 3: Service Worker 不快取

**規則名稱**: `Service Worker No Cache`

**條件（When incoming requests match）**:

```
Hostname equals app.haotool.org
AND
URI Path matches regex: /(sw\.js|workbox-.*\.js)$
```

**動作（Then）**:

- **Cache eligibility**: Bypass cache

**理由**:

- 防止 PWA 快取問題
- 確保 Service Worker 更新即時

### Rule 4: API 資料不快取

**規則名稱**: `API No Cache`

**條件（When incoming requests match）**:

```
Hostname equals app.haotool.org
AND
URI Path starts with: /api/
```

**動作（Then）**:

- **Cache eligibility**: Bypass cache

**理由**:

- API 資料動態變化，不應快取

---

## 2. 安全標頭配置（Transform Rules）

### 配置步驟

1. Cloudflare Dashboard > **Rules** > **Transform Rules**
2. 選擇 **Modify Response Header**
3. 點擊 **Create rule**

### Rule 1: Content Security Policy (CSP)

**規則名稱**: `Security Headers - CSP`

**條件（When incoming requests match）**:

```
Hostname equals app.haotool.org
```

**動作（Then）**:

**Set static** `Content-Security-Policy`:

```
default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;
```

**CSP 指令說明**:

| 指令                        | 值                                                    | 說明                                     |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------- |
| `default-src`               | `'self'`                                              | 預設只允許同源資源                       |
| `script-src`                | `'self' https://static.cloudflareinsights.com`        | 允許自己的 JS 和 Cloudflare Insights     |
| `style-src`                 | `'self' 'unsafe-inline' https://fonts.googleapis.com` | 允許內聯樣式（Vite 需要）和 Google Fonts |
| `font-src`                  | `'self' https://fonts.gstatic.com`                    | 允許 Google Fonts 字體                   |
| `img-src`                   | `'self' data: https:`                                 | 允許所有 HTTPS 圖片和 data URI           |
| `connect-src`               | `'self' https://...`                                  | 允許 API 連接                            |
| `frame-ancestors`           | `'self'`                                              | 防止 Clickjacking                        |
| `base-uri`                  | `'self'`                                              | 限制 `<base>` 標籤                       |
| `form-action`               | `'self'`                                              | 限制表單提交目標                         |
| `object-src`                | `'none'`                                              | 禁止 `<object>`, `<embed>`, `<applet>`   |
| `upgrade-insecure-requests` | -                                                     | 自動升級 HTTP 到 HTTPS                   |

### Rule 2: 其他安全標頭

**規則名稱**: `Security Headers - Additional`

**條件（When incoming requests match）**:

```
Hostname equals app.haotool.org
```

**動作（Then）**:

**Set static** 以下標頭:

1. `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
2. `X-Frame-Options`: `SAMEORIGIN`
3. `X-Content-Type-Options`: `nosniff`
4. `Referrer-Policy`: `strict-origin-when-cross-origin`
5. `Permissions-Policy`: `geolocation=(), microphone=(), camera=(), payment=()`

### Rule 3: Trusted Types Report-Only

**規則名稱**: `Security Headers - Trusted Types`

**條件（When incoming requests match）**:

```
Hostname equals app.haotool.org
```

**動作（Then）**:

**Set static** `Content-Security-Policy-Report-Only`:

```
require-trusted-types-for 'script'; trusted-types default ratewise#default 'allow-duplicates';
```

**理由**:

- Report-Only 模式：監控但不阻擋
- 收集 Trusted Types 違規資訊
- 未來可升級為強制模式

---

## 3. 效能優化配置

### 3.1 Brotli 壓縮

**路徑**: Dashboard > **Speed** > **Optimization**

**設定**:

- **Brotli**: ✅ On

**效益**:

- 比 Gzip 小 15-20%
- 更快的傳輸速度
- 無額外成本（Free Plan 支援）

### 3.2 Auto Minify

**路徑**: Dashboard > **Speed** > **Optimization**

**設定**:

- **JavaScript**: ✅ On
- **CSS**: ✅ On
- **HTML**: ✅ On

**注意事項**:

- Vite 已做 minify，此為雙重保險
- 對已壓縮資源影響不大

### 3.3 Early Hints

**路徑**: Dashboard > **Speed** > **Optimization**

**設定**:

- **Early Hints**: ✅ On

**效益**:

- 提前發送 `Link: <url>; rel=preload` headers
- 減少 TTFB（Time to First Byte）
- 瀏覽器可提前載入關鍵資源

### 3.4 Rocket Loader

**路徑**: Dashboard > **Speed** > **Optimization**

**設定**:

- **Rocket Loader**: ❌ Off

**理由**:

- 與嚴格的 CSP 衝突（需要 `unsafe-inline`）
- Vite 已優化 bundle splitting
- 避免 Trusted Types 違規

### 3.5 HTTP/3 (QUIC)

**路徑**: Dashboard > **Network**

**設定**:

- **HTTP/3 (with QUIC)**: ✅ On

**效益**:

- 更快的連接建立
- 更好的行動網路效能
- Free Plan 支援

### 3.6 0-RTT Connection Resumption

**路徑**: Dashboard > **Network**

**設定**:

- **0-RTT Connection Resumption**: ✅ On

**效益**:

- 減少 TLS 握手時間
- 重複訪問更快

---

## 4. SSL/TLS 配置

### 4.1 SSL/TLS 加密模式

**路徑**: Dashboard > **SSL/TLS** > **Overview**

**建議設定**:

- **Encryption mode**: Full (strict)

**模式說明**:

| 模式          | 說明                                                            | 建議            |
| ------------- | --------------------------------------------------------------- | --------------- |
| Off           | 不加密                                                          | ❌ 絕不使用     |
| Flexible      | Cloudflare ↔ 使用者加密，Cloudflare ↔ Origin 不加密             | ❌ 不安全       |
| Full          | Cloudflare ↔ 使用者加密，Cloudflare ↔ Origin 加密（自簽證書可） | ⚠️ 可用但不推薦 |
| Full (strict) | Cloudflare ↔ 使用者加密，Cloudflare ↔ Origin 加密（需有效證書） | ✅ 推薦         |

### 4.2 Minimum TLS Version

**路徑**: Dashboard > **SSL/TLS** > **Edge Certificates**

**建議設定**:

- **Minimum TLS Version**: TLS 1.2

**理由**:

- TLS 1.0/1.1 已過時且不安全
- TLS 1.2 廣泛支援
- TLS 1.3 更好但部分舊瀏覽器不支援

### 4.3 Always Use HTTPS

**路徑**: Dashboard > **SSL/TLS** > **Edge Certificates**

**建議設定**:

- **Always Use HTTPS**: ✅ On

**效益**:

- 自動重定向 HTTP 到 HTTPS
- 提升安全性
- 改善 SEO

### 4.4 Automatic HTTPS Rewrites

**路徑**: Dashboard > **SSL/TLS** > **Edge Certificates**

**建議設定**:

- **Automatic HTTPS Rewrites**: ✅ On

**效益**:

- 自動將 HTTP 資源 URL 改為 HTTPS
- 避免 Mixed Content 警告

---

## 5. 自動清除快取（CI/CD 整合）

### 5.1 建立 Cloudflare API Token

**步驟**:

1. Cloudflare Dashboard > **My Profile** > **API Tokens**
2. 點擊 **Create Token**
3. 選擇 **Custom token**
4. 設定權限:
   - **Zone** > **Cache Purge** > **Purge**
   - **Zone Resources**: Include > Specific zone > 選擇你的網域
5. 複製 Token（只顯示一次）

### 5.2 建立快取清除腳本

**檔案**: `scripts/cloudflare-purge-cache.sh`

```bash
#!/bin/bash
# Cloudflare 快取清除腳本
# 用途：部署後自動清除 Cloudflare 快取

set -e

# 環境變數檢查
if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "❌ Error: CLOUDFLARE_ZONE_ID not set"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ Error: CLOUDFLARE_API_TOKEN not set"
  exit 1
fi

echo "🔄 Purging Cloudflare cache..."

# 清除所有快取
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

# 檢查回應
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Cloudflare cache purged successfully"
else
  echo "❌ Failed to purge cache:"
  echo "$RESPONSE" | jq '.'
  exit 1
fi
```

**賦予執行權限**:

```bash
chmod +x scripts/cloudflare-purge-cache.sh
```

### 5.3 整合到 GitHub Actions

**檔案**: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Deploy to server
        run: |
          # 你的部署指令
          echo "Deploying..."

      - name: Purge Cloudflare Cache
        run: ./scripts/cloudflare-purge-cache.sh
        env:
          CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**設定 GitHub Secrets**:

1. GitHub Repository > **Settings** > **Secrets and variables** > **Actions**
2. 點擊 **New repository secret**
3. 添加以下 secrets:
   - `CLOUDFLARE_ZONE_ID`: 你的 Zone ID（在 Cloudflare Dashboard 右側欄可找到）
   - `CLOUDFLARE_API_TOKEN`: 剛才建立的 API Token

---

## 6. 監控與分析

### 6.1 查看快取效能

**路徑**: Dashboard > **Analytics** > **Caching**

**關鍵指標**:

- **Cache Hit Ratio**: 目標 > 80%
- **Cached Requests**: 越高越好
- **Bandwidth Saved**: 節省的頻寬

### 6.2 查看安全事件

**路徑**: Dashboard > **Security** > **Events**

**關注項目**:

- WAF 攔截的請求
- Rate Limiting 觸發次數
- Bot 流量分析

### 6.3 查看效能指標

**路徑**: Dashboard > **Analytics** > **Performance**

**關鍵指標**:

- **Time to First Byte (TTFB)**: 目標 < 200ms
- **DNS Query Time**: 目標 < 50ms
- **TCP Connection Time**: 目標 < 100ms

---

## 7. 故障排除

### 7.1 快取未生效

**症狀**: 資源每次都從 Origin 載入

**檢查步驟**:

1. **確認 Cache Rules 已啟用**:
   - Dashboard > Caching > Cache Rules
   - 檢查規則狀態是否為 "Active"

2. **檢查 Response Headers**:

   ```bash
   curl -I https://app.haotool.org/ratewise/assets/app-WXj5k8UU.js
   ```

   - 查看 `cf-cache-status` header:
     - `HIT`: 快取命中 ✅
     - `MISS`: 快取未命中（首次請求）
     - `BYPASS`: 快取被繞過 ⚠️
     - `EXPIRED`: 快取過期

3. **確認 Origin 沒有設定 `Cache-Control: no-cache`**:
   - 檢查 `nginx.conf` 的 Cache-Control 設定

### 7.2 CSP 違規錯誤

**症狀**: 瀏覽器 Console 出現 CSP 錯誤

**檢查步驟**:

1. **查看錯誤訊息**:

   ```
   Refused to load the script 'https://example.com/script.js' because it violates the following Content Security Policy directive: "script-src 'self'".
   ```

2. **確認資源來源**:
   - 檢查被阻擋的資源 URL
   - 確認是否在 CSP 允許清單中

3. **更新 CSP**:
   - Dashboard > Rules > Transform Rules
   - 修改 CSP 規則，添加允許的來源

### 7.3 HTTPS 重定向循環

**症狀**: 網站無限重定向

**原因**: Cloudflare 與 Origin 之間的 HTTPS 配置不一致

**解決方案**:

1. **檢查 SSL/TLS 模式**:
   - Dashboard > SSL/TLS > Overview
   - 確認為 "Full (strict)"

2. **檢查 Origin 證書**:
   - 確保 Origin 有有效的 SSL 證書
   - 如果使用自簽證書，改用 "Full" 模式

3. **停用 Always Use HTTPS**（暫時）:
   - Dashboard > SSL/TLS > Edge Certificates
   - 關閉 "Always Use HTTPS"
   - 測試是否解決問題

---

## 8. 階段性升級路徑

### Phase 1: 活躍開發階段（當前）

**快取策略**:

- 靜態資產: 1 day
- HTML: no-cache

**部署流程**:

- 手動清除快取（可選）
- 或等待 1 天自動過期

### Phase 2: Beta 測試階段

**快取策略**:

- 靜態資產: 7 days
- HTML: no-cache

**部署流程**:

- 自動清除快取（CI/CD）

### Phase 3: 穩定生產階段

**快取策略**:

- 靜態資產: 1 year + immutable
- HTML: no-cache

**部署流程**:

- 自動清除快取（CI/CD）
- 監控快取命中率

### Phase 4: 成熟生產階段

**快取策略**:

- 靜態資產: 1 year + immutable
- HTML: short cache (5 minutes)

**部署流程**:

- 自動清除快取（CI/CD）
- 藍綠部署
- Canary 部署

---

## 9. 參考資料

### Cloudflare 官方文檔

- [Cache Rules Documentation](https://developers.cloudflare.com/cache/how-to/cache-rules/)
- [Transform Rules Documentation](https://developers.cloudflare.com/rules/transform/)
- [SSL/TLS Documentation](https://developers.cloudflare.com/ssl/)
- [Speed Optimization](https://developers.cloudflare.com/speed/)

### 最佳實踐

- [web.dev: HTTP Cache](https://web.dev/articles/http-cache)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: Secure Headers](https://owasp.org/www-project-secure-headers/)

### 工具

- [Security Headers Scanner](https://securityheaders.com/)
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## 10. 附錄：Cloudflare Workers 範例

如果需要更複雜的邏輯（如動態 CSP、A/B 測試等），可使用 Cloudflare Workers。

**檔案**: `cloudflare-worker.js`

```javascript
/**
 * Cloudflare Worker - Security Headers & Cache Control
 *
 * 部署方式：
 * 1. Cloudflare Dashboard > Workers & Pages > Create Worker
 * 2. 複製此程式碼並部署
 * 3. 設定 Route: app.haotool.org/ratewise/*
 */

export default {
  async fetch(request, env, ctx) {
    // 獲取原始回應
    const response = await fetch(request);

    // 建立新回應以添加標頭
    const newResponse = new Response(response.body, response);

    // 安全標頭
    const securityHeaders = {
      'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' https://static.cloudflareinsights.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io; " +
        "frame-ancestors 'self'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "object-src 'none'; " +
        'upgrade-insecure-requests;',

      'Content-Security-Policy-Report-Only':
        "require-trusted-types-for 'script'; " +
        "trusted-types default ratewise#default 'allow-duplicates';",

      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    };

    // 添加安全標頭
    Object.entries(securityHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  },
};
```

---

**維護者**: DevOps Team  
**最後更新**: 2025-11-26  
**下次審查**: 2026-02-26（每 3 個月審查一次）
