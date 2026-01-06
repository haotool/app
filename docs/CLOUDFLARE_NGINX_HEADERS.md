# Cloudflare & Nginx 安全標頭策略

> ⚠️ **已過時**：本文檔已被取代
>
> 請參考：**[CLOUDFLARE_SECURITY_HEADERS_GUIDE.md](./CLOUDFLARE_SECURITY_HEADERS_GUIDE.md)**
>
> **重要變更**：安全標頭現在完全由 Cloudflare 處理，Nginx 不再設定安全標頭。

**建立時間**: 2025-10-18  
**更新時間**: 2026-01-07 (標記為已過時)
**原則**: 分層防禦，避免重複配置

---

## 責任分界

### Cloudflare（邊緣層）- 主要防禦線

Cloudflare 在邊緣處理以下安全標頭，提供全域保護：

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```

**配置方式**：

- Cloudflare Workers（推薦）
- Transform Rules（UI 配置）
- Page Rules（較舊方式）

### Nginx（應用層）- Fallback 防護

Nginx 僅保留最小標頭作為 fallback（當流量未經 Cloudflare 或本地測試時）：

```nginx
# /Users/azlife.eth/Tools/app/nginx.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
```

**不在 Nginx 重複的標頭**：

- ❌ Content-Security-Policy（由 Cloudflare 管理）
- ❌ Strict-Transport-Security（由 Cloudflare 管理）
- ❌ Permissions-Policy（由 Cloudflare 管理）
- ❌ Referrer-Policy（由 Cloudflare 管理）

---

## Cloudflare Workers 範例

```javascript
// cloudflare-worker.js
export default {
  async fetch(request, env, ctx) {
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);

    // Security headers
    const securityHeaders = {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.frankfurter.app",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };

    Object.entries(securityHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  },
};
```

---

## Content Security Policy 說明

### 當前 CSP 策略

```
default-src 'self';
script-src 'self' https://static.cloudflareinsights.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io;
frame-ancestors 'self';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
```

### 為何允許 'unsafe-inline'（僅限 style-src）

1. **Vite 內聯樣式**：Vite 在開發模式使用內聯樣式，strict CSP 會破壞 HMR
2. **漸進增強**：現階段優先功能穩定，後續可採用 nonce-based CSP
3. **實際威脅評估**：匯率工具無 UGC，XSS 風險相對較低
4. **script-src 已移除 unsafe-inline**：腳本層面已達到嚴格 CSP 標準

### CSP 指令說明

| 指令                        | 值                                                    | 說明                                   |
| --------------------------- | ----------------------------------------------------- | -------------------------------------- |
| `default-src`               | `'self'`                                              | 預設只允許同源資源                     |
| `script-src`                | `'self' https://static.cloudflareinsights.com`        | ✅ 已移除 unsafe-inline                |
| `style-src`                 | `'self' 'unsafe-inline' https://fonts.googleapis.com` | ⚠️ 保留 unsafe-inline（Vite 需要）     |
| `font-src`                  | `'self' https://fonts.gstatic.com`                    | 允許 Google Fonts 字體                 |
| `img-src`                   | `'self' data: https:`                                 | 允許所有 HTTPS 圖片                    |
| `connect-src`               | `'self' https://...`                                  | 允許 API 連接                          |
| `frame-ancestors`           | `'self'`                                              | 防止 Clickjacking                      |
| `base-uri`                  | `'self'`                                              | 限制 `<base>` 標籤                     |
| `form-action`               | `'self'`                                              | 限制表單提交目標                       |
| `object-src`                | `'none'`                                              | 禁止 `<object>`, `<embed>`, `<applet>` |
| `upgrade-insecure-requests` | -                                                     | 自動升級 HTTP 到 HTTPS                 |

### 未來改進（Phase 2）

- 使用 `nonce-{random}` 替代 `style-src 'unsafe-inline'`
- Vite plugin 自動注入 nonce 到 style tags
- 參考：https://vite-pwa-org.netlify.app/guide/inject-manifest.html#content-security-policy

---

## Cloudflare Rocket Loader

**狀態**: ❌ 已停用（2025-11-26）

**原因**: 與嚴格的 CSP 和 Trusted Types 衝突

Rocket Loader 會攔截並修改 inline scripts，需要 `script-src 'unsafe-inline'` 才能運作。
為了維持嚴格的 CSP 策略，我們選擇停用 Rocket Loader。

**停用方式**:

1. **HTML Meta Tag** - 在 `index.html` 的 `<head>` 中添加：

   ```html
   <meta name="cloudflare-rocket-loader" content="off" />
   ```

2. **Script Attribute** - 在 script tags 添加 `data-cfasync="false"`（開發時）：

   ```html
   <script type="module" data-cfasync="false" src="./src/main.tsx"></script>
   ```

3. **Cloudflare Dashboard** - 手動停用（推薦）：
   - 登入 Cloudflare Dashboard
   - 選擇網域 > Speed > Optimization
   - Rocket Loader = Off

**效能影響**:

- ✅ 無顯著影響：Vite 已優化 bundle splitting 和 lazy loading
- ✅ 避免 CSP 違規：減少瀏覽器 console 錯誤
- ✅ 提升安全性：維持嚴格的 `script-src 'self'` 策略

**參考資料**:

- [Cloudflare: Disable Rocket Loader](https://developers.cloudflare.com/speed/optimization/content/rocket-loader/)
- [CSP: script-src Directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)

---

## 驗證方式

### 本地測試（Nginx）

```bash
# 啟動 preview server
pnpm --filter @app/ratewise build && pnpm --filter @app/ratewise preview

# 檢查標頭
curl -I http://localhost:4173/ | grep -E "(X-Content-Type|X-Frame)"
```

### Cloudflare 測試（生產環境）

```bash
curl -I https://app.haotool.org/ratewise/ | grep -E "(Content-Security|Strict-Transport|X-Frame|X-Content-Type|Referrer|Permissions)"
```

### 自動化檢查（Lighthouse CI）

Lighthouse 會自動檢測以下項目：

- CSP 存在性與有效性
- HSTS 配置
- Mixed Content 問題
- Insecure origins

---

## OWASP 合規性

根據 [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)：

| Header                       | 狀態      | 分層               |
| ---------------------------- | --------- | ------------------ |
| Content-Security-Policy      | ✅ 已配置 | Cloudflare         |
| Strict-Transport-Security    | ✅ 已配置 | Cloudflare         |
| X-Frame-Options              | ✅ 已配置 | Cloudflare + Nginx |
| X-Content-Type-Options       | ✅ 已配置 | Cloudflare + Nginx |
| Referrer-Policy              | ✅ 已配置 | Cloudflare         |
| Permissions-Policy           | ✅ 已配置 | Cloudflare         |
| Cross-Origin-Opener-Policy   | ⚠️ 未配置 | 考慮中（Phase 2）  |
| Cross-Origin-Embedder-Policy | ⚠️ 未配置 | 考慮中（Phase 2）  |

---

## 參考資料

- [Cloudflare Security Headers](https://developers.cloudflare.com/workers/examples/security-headers/)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Security Headers Scanner](https://securityheaders.com/)

---

**維護者**: DevOps Team  
**最後更新**: 2025-11-26  
**下次審查**: 2026-02-26

---

## 相關文檔

- [Cloudflare 配置最佳實踐指南](./CLOUDFLARE_CONFIGURATION_GUIDE.md) - 完整的 Cloudflare 配置步驟與最佳實踐
- [安全基線](./SECURITY_BASELINE.md) - 整體安全策略與責任分界
