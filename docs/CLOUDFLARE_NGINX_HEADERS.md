# Cloudflare & Nginx 安全標頭策略

**建立時間**: 2025-10-18  
**原則**: 分層防禦，避免重複配置

---

## 責任分界

### Cloudflare（邊緣層）- 主要防禦線

Cloudflare 在邊緣處理以下安全標頭，提供全域保護：

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.frankfurter.app
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
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
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' https://api.frankfurter.app;
```

### 為何允許 'unsafe-inline'

1. **Vite 內聯樣式**：Vite 在開發模式使用內聯樣式，strict CSP 會破壞 HMR
2. **漸進增強**：現階段優先功能穩定，後續可採用 nonce-based CSP
3. **實際威脅評估**：匯率工具無 UGC，XSS 風險相對較低

### 未來改進（Phase 2）

- 使用 `nonce-{random}` 替代 `unsafe-inline`
- Vite plugin 自動注入 nonce 到 script/style tags
- 參考：https://vite-pwa-org.netlify.app/guide/inject-manifest.html#content-security-policy

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
curl -I https://ratewise.app/ | grep -E "(Content-Security|Strict-Transport|X-Frame|X-Content-Type|Referrer|Permissions)"
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
**下次審查**: 2025-11-18
