# Cloudflare Worker CSP 修復部署指南

**建立時間**: 2025-11-29T01:06:36+0800
**最後更新**: 2025-11-29T02:00:00+0800
**問題狀態**: 🚨 Critical P0 - strict-dynamic 導致生產環境完全失效
**優先級**: P0 - 緊急修復

---

## 🚨 問題診斷

### 錯誤的 CSP 配置（2025-11-29 部署版本）

```javascript
// ❌ 錯誤：strict-dynamic 在 SSG 環境中完全失效
script-src 'self' 'unsafe-inline' 'strict-dynamic' https://static.cloudflareinsights.com
```

**為什麼失效**：

1. **`strict-dynamic` 忽略 `'self'` 和 domain whitelist**
   - 這是 CSP Level 3 的設計行為
   - 所有非 nonce/hash 的來源都被停用
   - 結果：`'self'` 和 `https://static.cloudflareinsights.com` 完全無效

2. **SSG 無法使用 strict-dynamic**
   - Nonce-based CSP 需要 server-side runtime 為每個 request 生成隨機 nonce
   - Vite SSG 是純靜態輸出，沒有 server-side execution
   - Hash-based CSP 無法處理動態載入的 scripts（Vite chunk splitting）

3. **生產環境實際影響**：
   ```
   ❌ Loading script 'https://app.haotool.org/ratewise/assets/app-z_BtAXh2.js' violates CSP
   ❌ Loading script 'https://app.haotool.org/ratewise/registerSW.js' violates CSP
   ❌ Executing inline script violates CSP
   ❌ 頁面完全無法載入
   ```

### 正確的 CSP 配置（修復後）

```javascript
// ✅ 正確：移除 strict-dynamic，適合 SSG 環境
script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com
```

**為什麼安全**：

- ✅ `'self'` 只允許同源 scripts（https://app.haotool.org）
- ✅ `'unsafe-inline'` 允許 Vite SSG 生成的 inline scripts（`__staticRouterHydrationData`）
- ✅ `https://static.cloudflareinsights.com` 允許 Cloudflare Analytics
- ✅ 所有其他第三方來源被阻擋
- ✅ 與 nginx.conf 配置一致

### 錯誤訊息

```
Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://static.cloudflareinsights.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-...'), or a nonce ('nonce-...') is required to enable inline execution. The action has been blocked.
```

### 根本原因

Vite SSG 在構建時會生成兩個 inline scripts：

1. `window.__staticRouterHydrationData = JSON.parse(...)`
2. `window.__VITE_REACT_SSG_HASH__ = '...'`

這些 scripts 的 hash 會隨每次構建變化，因此無法使用固定的 hash 白名單。

---

## ✅ 修復步驟

### 方法一：更新 Cloudflare Worker（推薦）

#### 步驟 1：登入 Cloudflare Dashboard

1. 前往 https://dash.cloudflare.com/
2. 選擇您的帳戶
3. 點擊左側選單的 **Workers & Pages**

#### 步驟 2：找到現有的 Worker

1. 在 Workers 列表中找到 `ratewise-security-headers` 或類似名稱的 Worker
2. 點擊進入 Worker 詳情頁

#### 步驟 3：更新 Worker 代碼

1. 點擊 **Quick edit** 或 **Edit code**
2. 將現有代碼**完全替換**為以下內容：

```javascript
/**
 * Cloudflare Worker - Security Headers
 *
 * 分層防禦策略：Cloudflare 邊緣層設定安全標頭
 * 與 nginx.conf 保持一致，提供全域保護
 *
 * 最後更新：2025-11-29T02:00:00+0800
 * 修復：移除 strict-dynamic（不適用於 SSG 環境）
 */

export default {
  async fetch(request, _env, _ctx) {
    // 取得原始回應
    const response = await fetch(request);

    // 建立新的回應以添加標頭
    const newResponse = new Response(response.body, response);

    // 安全標頭配置
    const securityHeaders = {
      // Content Security Policy - 防止 XSS 攻擊
      // [fix:2025-11-29] 移除 strict-dynamic（SSG 無 server runtime）
      // 參考: https://web.dev/articles/strict-csp
      //       https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
      // 策略說明:
      // - 'self': 只允許同源 scripts
      // - 'unsafe-inline': 允許 Vite SSG 生成的 inline scripts (__staticRouterHydrationData)
      // - https://static.cloudflareinsights.com: Cloudflare Analytics
      'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io; " +
        "frame-ancestors 'self'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "object-src 'none'; " +
        'upgrade-insecure-requests;',

      // Trusted Types Report-Only
      'Content-Security-Policy-Report-Only':
        "require-trusted-types-for 'script'; " +
        "trusted-types default ratewise#default 'allow-duplicates';",

      // 基礎安全標頭
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // HSTS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

      // Permissions Policy
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    };

    // 應用安全標頭
    Object.entries(securityHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    // 移除可能洩漏資訊的標頭
    newResponse.headers.delete('Server');
    newResponse.headers.delete('X-Powered-By');

    return newResponse;
  },
};
```

#### 步驟 4：保存並部署

1. 點擊 **Save and deploy**
2. 等待部署完成（通常 1-2 分鐘）

#### 步驟 5：清除 CDN 快取（重要！）

部署 Worker 後，**必須清除 Cloudflare CDN 快取**以確保新的 CSP 標頭立即生效：

1. 在 Cloudflare Dashboard 中選擇您的網域
2. 前往 **Caching** > **Configuration**
3. 點擊 **Purge Everything**（或使用 Custom Purge 只清除 `/ratewise/*`）
4. 等待 1-2 分鐘讓快取失效傳播到所有邊緣節點

> ⚠️ **注意**：如果不清除快取，舊的 HTML 頁面可能仍被 CDN 提供服務，導致瀏覽器看到舊的 CSP 標頭。

#### 步驟 6：驗證修復

在終端機執行：

```bash
curl -sI https://app.haotool.org/ratewise/ | grep -i "content-security-policy"
```

**預期結果**：

```
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; ...
```

⚠️ **重要**：應該**沒有** `'strict-dynamic'`！

在瀏覽器開啟 https://app.haotool.org/ratewise/（建議使用無痕/隱私模式），Console 應該不再顯示 CSP 錯誤。

---

### 方法二：如果沒有現有 Worker

#### 步驟 1：創建新 Worker

1. 前往 **Workers & Pages** > **Create**
2. 點擊 **Create Worker**
3. 輸入名稱：`ratewise-security-headers`
4. 點擊 **Deploy**

#### 步驟 2：編輯代碼

1. 點擊 **Edit code**
2. 貼上上方的完整代碼
3. 點擊 **Save and deploy**

#### 步驟 3：設定路由

1. 前往您的網域設定
2. 選擇 **Workers Routes**
3. 點擊 **Add route**
4. 設定：
   - **Route**: `app.haotool.org/ratewise/*`
   - **Worker**: `ratewise-security-headers`
5. 點擊 **Save**

---

## 🔍 驗證清單

部署後，請執行以下驗證：

### 1. CSP 標頭檢查

```bash
curl -sI https://app.haotool.org/ratewise/ | grep -i "content-security-policy"
```

✅ 應包含：`'self' 'unsafe-inline' https://static.cloudflareinsights.com`
❌ 不應包含：`'strict-dynamic'`（這會導致所有 scripts 被阻擋！）

### 2. 瀏覽器 Console 檢查

1. 開啟 https://app.haotool.org/ratewise/
2. 開啟 DevTools (F12) > Console
3. ✅ 不應有 CSP 相關錯誤

### 3. 功能測試

1. ✅ 頁面正常載入（不再停留在「載入匯率資料中...」）
2. ✅ 匯率數據正確顯示
3. ✅ 單幣別/多幣別切換正常
4. ✅ 計算機功能正常

---

## 📦 環境變數配置

### Vite 環境變數

RateWise 部署時支援以下環境變數（**所有都是選填**）：

| 變數名稱            | 用途                          | 預設值                              | 必要性    |
| ------------------- | ----------------------------- | ----------------------------------- | --------- |
| `VITE_SITE_URL`     | 網站基礎 URL                  | `https://app.haotool.org/ratewise/` | ❌ 選填   |
| `VITE_BASE_PATH`    | 應用基礎路徑                  | `/ratewise/`                        | ❌ 選填   |
| `VITE_LHCI_OFFLINE` | Lighthouse CI 離線模式        | `false`                             | ❌ CI專用 |
| `GIT_COMMIT_COUNT`  | Git commit 數量（版本號生成） | 自動取得                            | ❌ 選填   |
| `GIT_COMMIT_HASH`   | Git commit hash（版本號生成） | 自動取得                            | ❌ 選填   |

### Cloudflare 環境變數

**Worker 不需要任何環境變數！** 所有配置都寫在 Worker 代碼中。

### 何時需要設定環境變數？

**一般不需要！** 專案已設定合理的預設值。

只在以下情況需要設定：

- 🔹 更改部署路徑（例如從 `/ratewise/` 改為 `/currency/`）
- 🔹 CI/CD 環境測試（例如 Lighthouse CI 使用 `/` 路徑）
- 🔹 多環境部署（例如 staging 與 production 使用不同 URL）

---

## 🌐 DNS & SSL 配置需求

### DNS 設定

確保您的網域 DNS 記錄正確設定：

| 類型              | 名稱                  | 值                    | 狀態                   |
| ----------------- | --------------------- | --------------------- | ---------------------- |
| **A** 或 **AAAA** | `app.haotool.org`     | Cloudflare IP（自動） | 🟠 Proxied（橙色雲朵） |
| **CNAME** (可選)  | `www.app.haotool.org` | `app.haotool.org`     | 🟠 Proxied             |

### SSL/TLS 設定

在 Cloudflare Dashboard → **SSL/TLS** 設定：

| 設定項目                     | 建議值            | 原因                                    |
| ---------------------------- | ----------------- | --------------------------------------- |
| **Encryption mode**          | **Full (strict)** | 確保端到端加密（Cloudflare ↔ 源伺服器） |
| **Always Use HTTPS**         | **開啟**          | 自動將 HTTP 重導向到 HTTPS              |
| **Automatic HTTPS Rewrites** | **開啟**          | 自動升級混合內容到 HTTPS                |
| **Minimum TLS Version**      | **TLS 1.2**       | 平衡安全性與相容性                      |
| **TLS 1.3**                  | **開啟**          | 現代瀏覽器效能提升                      |

### 檢查清單

- [ ] DNS A/AAAA 記錄指向 Cloudflare（橙色雲朵）
- [ ] SSL/TLS Encryption mode = **Full (strict)**
- [ ] Always Use HTTPS = **開啟**
- [ ] Worker Route 設定：`app.haotool.org/ratewise/*`
- [ ] CNAME 平展（Cloudflare 自動處理）

---

## 📚 技術背景

### 為什麼移除 'strict-dynamic'？

**strict-dynamic 的設計目的**：

- CSP Level 3 引入，用於 **server-side rendered** 應用
- 需要 server 為每個 request 生成隨機 nonce
- 或使用 hash，但只適用於靜態 inline scripts

**為什麼不適用於 Vite SSG**：

1. **SSG 沒有 server-side runtime**
   - Vite SSG 在 build time 生成靜態 HTML
   - 部署後沒有 server 可以生成動態 nonce

2. **Vite 的動態 chunk splitting**
   - Vite 會根據 imports 動態產生多個 chunk files
   - 每個 chunk 的 filename 包含 hash（如 `app-z_BtAXh2.js`）
   - 無法預先計算所有 script 的 hash

3. **strict-dynamic 的致命行為**
   - 當使用 `strict-dynamic` 時，瀏覽器會**忽略** `'self'` 和 domain whitelist
   - 所有沒有 nonce/hash 的 scripts 都被阻擋
   - 結果：**整個應用完全無法載入**

**結論**：對於 SSG 應用，應該使用 `'self' 'unsafe-inline'` 而非 `strict-dynamic`。

### 為什麼需要 'unsafe-inline'？

Vite SSG 會在構建時生成包含 hydration 數據的 inline scripts：

```html
<script>
  window.__staticRouterHydrationData = JSON.parse('{...}');
</script>
<script>
  window.__VITE_REACT_SSG_HASH__ = 'abc123';
</script>
```

這些 scripts 的 hash 會隨每次構建變化，因此無法使用靜態 hash 白名單。

### 安全性評估

**`'self' 'unsafe-inline'` 配置的安全性**：

1. ✅ **構建過程受控（CI/CD）**
   - 所有 scripts 來自可信的構建流程
   - 源代碼經過 code review 和自動化測試

2. ✅ **Inline scripts 是靜態生成的**
   - Vite SSG 在 build time 生成
   - 非用戶輸入，無 XSS 風險

3. ✅ **Same-origin 限制**
   - `'self'` 只允許同源 scripts
   - 第三方 scripts 必須明確白名單

4. ✅ **額外監控**
   - Trusted Types Report-Only 監控潛在風險
   - Sentry 錯誤追蹤

**與 nginx.conf 一致**：

```nginx
# apps/ratewise/nginx.conf (line 42-46)
add_header Content-Security-Policy
  "default-src 'self';
   script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com;
   ...";
```

**結論**：對於 SSG 應用，這是最適合的 CSP 配置。

---

## 🔗 相關資源

- [MDN: Content-Security-Policy/script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
- [web.dev: Strict CSP](https://web.dev/articles/strict-csp)
- [Cloudflare Workers: Security Headers](https://developers.cloudflare.com/workers/examples/security-headers/)
- [Vite React SSG](https://github.com/Daydreamer-riri/vite-react-ssg)

---

## 📞 問題回報

如果部署後仍有問題，請：

1. 檢查 Cloudflare Worker 路由是否正確設定
2. 確認 Worker 已成功部署（無錯誤訊息）
3. 清除瀏覽器快取後重新載入
4. 在 GitHub Issues 回報詳細錯誤訊息
