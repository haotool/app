# Cloudflare 安全標頭配置指南

> **最後更新**: 2026-01-07
> **適用範圍**: 所有 haotool.org 網域下的應用
> **部署平台**: Zeabur (後端代理至 Cloudflare)

---

## 📋 目錄

1. [架構概覽](#架構概覽)
2. [安全標頭說明](#安全標頭說明)
3. [Cloudflare Dashboard 設定](#cloudflare-dashboard-設定)
4. [Cloudflare Worker 配置](#cloudflare-worker-配置)
5. [驗證方法](#驗證方法)
6. [常見問題](#常見問題)
7. [參考資源](#參考資源)

---

## 架構概覽

### 分層防禦策略

```
┌─────────────────────────────────────────────────────────────┐
│                    用戶瀏覽器                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Cloudflare Edge (CDN)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✅ HSTS (Dashboard > SSL/TLS > Edge Certificates)  │   │
│  │  ✅ Transform Rules / Worker (CSP, 其他安全標頭)    │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Zeabur (Origin)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ❌ 不要在應用層設定安全標頭                         │   │
│  │  ✅ 只負責提供靜態檔案和 API                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 為什麼在 Cloudflare 設定？

| 原因             | 說明                                           |
| ---------------- | ---------------------------------------------- |
| **集中管理**     | 一處設定，所有子網域自動生效                   |
| **即時生效**     | 不需要重新部署應用                             |
| **快取優化**     | Cloudflare Edge 直接添加標頭，減少 Origin 負擔 |
| **高可用性**     | 即使 Origin 故障，安全標頭仍然生效             |
| **HSTS Preload** | 只有 Cloudflare 能正確設定 HSTS preload        |

---

## 安全標頭說明

### 1. HTTP Strict Transport Security (HSTS)

**作用**: 強制瀏覽器只使用 HTTPS 連線

**推薦設定**:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| 參數                | 說明                         |
| ------------------- | ---------------------------- |
| `max-age=31536000`  | 1 年（符合 preload 要求）    |
| `includeSubDomains` | 包含所有子網域               |
| `preload`           | 申請加入瀏覽器 HSTS 預載清單 |

⚠️ **警告**: 啟用 HSTS 後，確保所有子網域都支援 HTTPS，否則會導致存取失敗！

### 2. Content Security Policy (CSP)

**作用**: 防止 XSS、資料注入等攻擊

**推薦設定** (適用於 SSG 靜態網站):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://static.cloudflareinsights.com;
  style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io;
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
```

**注意**: SSG 網站無法使用 `nonce` 或 `strict-dynamic`，因為沒有 Server Runtime。

### 3. 其他安全標頭

| 標頭                           | 推薦值                                                 | 作用               |
| ------------------------------ | ------------------------------------------------------ | ------------------ |
| `X-Content-Type-Options`       | `nosniff`                                              | 防止 MIME 類型嗅探 |
| `X-Frame-Options`              | `SAMEORIGIN`                                           | 防止點擊劫持       |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`                      | 控制 Referrer 資訊 |
| `Permissions-Policy`           | `geolocation=(), microphone=(), camera=(), payment=()` | 限制瀏覽器功能     |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                          | 跨域隔離           |
| `Cross-Origin-Embedder-Policy` | `require-corp`                                         | 跨域嵌入策略       |
| `Cross-Origin-Resource-Policy` | `same-origin`                                          | 跨域資源策略       |

---

## Cloudflare Dashboard 設定

### Step 1: 啟用 HSTS

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇網域 `haotool.org`
3. 進入 **SSL/TLS** > **Edge Certificates**
4. 找到 **HTTP Strict Transport Security (HSTS)**
5. 點擊 **Enable HSTS**
6. 設定以下選項：

   | 選項               | 值                      |
   | ------------------ | ----------------------- |
   | Max Age Header     | 12 months (31536000 秒) |
   | Include subdomains | ✅ 啟用                 |
   | Preload            | ✅ 啟用                 |
   | No-Sniff Header    | ✅ 啟用                 |

7. 點擊 **Save**

### Step 2: 設定 Transform Rules (推薦)

如果不想使用 Worker，可以使用 Transform Rules：

1. 進入 **Rules** > **Transform Rules**
2. 點擊 **Create transform rule**
3. 選擇 **Modify Response Header**
4. 設定規則：

   **Rule name**: Security Headers

   **When incoming requests match**:
   - Field: `Hostname`
   - Operator: `contains`
   - Value: `haotool.org`

   **Then... Set response headers**:

   | Operation  | Header name               | Value                                                  |
   | ---------- | ------------------------- | ------------------------------------------------------ |
   | Set static | `X-Content-Type-Options`  | `nosniff`                                              |
   | Set static | `X-Frame-Options`         | `SAMEORIGIN`                                           |
   | Set static | `Referrer-Policy`         | `strict-origin-when-cross-origin`                      |
   | Set static | `Permissions-Policy`      | `geolocation=(), microphone=(), camera=(), payment=()` |
   | Set static | `Content-Security-Policy` | (見下方完整值)                                         |

5. 點擊 **Deploy**

**CSP 完整值** (複製時去掉換行):

```
default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://*.ingest.sentry.io; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;
```

---

## Cloudflare Worker 配置

如果需要更精細的控制（例如不同路徑不同 CSP），使用 Worker：

### 部署步驟

1. 進入 **Workers & Pages** > **Create application**
2. 選擇 **Create Worker**
3. 命名為 `security-headers`
4. 複製以下程式碼：

```javascript
/**
 * Cloudflare Worker - Security Headers
 *
 * 集中管理所有安全標頭
 * 部署路由: *.haotool.org/*
 *
 * 最後更新: 2026-01-07
 */

export default {
  async fetch(request, _env, _ctx) {
    // 取得原始回應
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);

    // 解析 URL
    const url = new URL(request.url);

    // 判斷是否為 OG 圖片（需要跨域存取）
    const isOgImage = url.pathname.match(/\/(og-image|twitter-image)\.png$/);

    // 安全標頭配置
    const securityHeaders = {
      // CSP - 邊緣僅保留無法由 <meta> 生效的指令
      'Content-Security-Policy':
        "frame-ancestors 'self'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "object-src 'none'; " +
        'upgrade-insecure-requests;',

      // 基礎安全標頭
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Permissions Policy
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',

      // Cross-Origin 隔離標頭
      'Cross-Origin-Embedder-Policy': isOgImage ? 'unsafe-none' : 'require-corp',
      'Cross-Origin-Opener-Policy': isOgImage ? 'unsafe-none' : 'same-origin',
      'Cross-Origin-Resource-Policy': isOgImage ? 'cross-origin' : 'same-origin',
    };

    // OG 圖片額外添加 CORS header
    if (isOgImage) {
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
    }

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

5. 點擊 **Save and Deploy**
6. 設定 **Routes**:
   - 進入 Worker 設定 > **Triggers**
   - 添加 Route: `*haotool.org/*`

---

## 驗證方法

### 1. 使用 curl 檢查

```bash
# 檢查 HSTS
curl -sI https://app.haotool.org/ratewise/ | grep -i strict-transport

# 檢查所有安全標頭
curl -sI https://app.haotool.org/ratewise/ | grep -iE "^(strict-transport|content-security|x-content|x-frame|referrer|permissions|cross-origin)"
```

### 2. 線上工具

| 工具                    | 網址                             | 用途                   |
| ----------------------- | -------------------------------- | ---------------------- |
| **Security Headers**    | https://securityheaders.com      | 全面檢查安全標頭       |
| **Mozilla Observatory** | https://observatory.mozilla.org  | 安全性評分             |
| **SSL Labs**            | https://www.ssllabs.com/ssltest/ | SSL/TLS 配置           |
| **HSTS Preload**        | https://hstspreload.org          | 檢查 HSTS preload 狀態 |

### 3. 瀏覽器開發者工具

1. 開啟 DevTools (F12)
2. 進入 **Network** 標籤
3. 重新載入頁面
4. 點擊任一請求，查看 **Headers** > **Response Headers**

---

## 常見問題

### Q1: 為什麼 CSP 要分開設定？

**A**: SSG 網站無法使用 nonce-based CSP（沒有 Server Runtime）。因此：

- **Cloudflare Worker/Transform Rules**: 設定 `frame-ancestors`, `base-uri`, `form-action` 等無法由 `<meta>` 生效的指令
- **HTML `<meta>` 標籤**: 設定 `script-src`, `style-src` 等需要 hash 的指令（由 vite-plugin-csp-guard 自動生成）

### Q2: 啟用 HSTS 後可以停用嗎？

**A**: 可以，但需要等待 `max-age` 過期。建議：

1. 先設定較短的 `max-age`（如 1 天）測試
2. 確認沒問題後再改為 1 年
3. 如果已申請 preload，需要從 preload list 移除（需數月時間）

### Q3: OG 圖片為什麼需要特殊處理？

**A**: 社群媒體爬蟲（Facebook、Twitter、LinkedIn）需要跨域存取 OG 圖片。如果設定 `Cross-Origin-Resource-Policy: same-origin`，爬蟲會被阻擋。

### Q4: 為什麼不在 Zeabur/應用層設定？

**A**:

1. Cloudflare 是請求的第一站，在這裡設定最有效
2. 集中管理，一處修改全部生效
3. 即使 Origin 故障，安全標頭仍然生效
4. 避免標頭衝突（Cloudflare 和 Origin 都設定同樣的標頭會導致重複）

---

## 參考資源

### 官方文檔

- [Cloudflare: HTTP Strict Transport Security](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)
- [Cloudflare: Security Headers Worker](https://developers.cloudflare.com/workers/examples/security-headers/)
- [Cloudflare: Transform Rules](https://developers.cloudflare.com/rules/transform/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: Secure Headers](https://owasp.org/www-project-secure-headers/)

### 檢測工具

- [Security Headers](https://securityheaders.com)
- [Mozilla HTTP Observatory](https://observatory.mozilla.org)
- [HSTS Preload](https://hstspreload.org)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## 變更歷史

| 日期       | 變更                                        |
| ---------- | ------------------------------------------- |
| 2026-01-07 | 初始版本，整合所有安全標頭配置到 Cloudflare |

---

> **維護者**: haotool DevOps Team
> **相關文檔**: `SECURITY_BASELINE.md`, `DEPLOYMENT.md`
