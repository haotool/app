# Cloudflare Worker CSP 修復部署指南

**建立時間**: 2025-11-29T01:06:36+0800  
**問題狀態**: 🚨 生產環境 CSP 阻止 Vite SSG inline scripts  
**優先級**: P0 - 緊急修復

---

## 🚨 問題診斷

### 當前生產環境 CSP（錯誤的）

```
script-src 'self' https://static.cloudflareinsights.com
```

### 需要的 CSP（修復後）

```
script-src 'self' 'unsafe-inline' 'strict-dynamic' https://static.cloudflareinsights.com
```

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
 * 最後更新：2025-11-29
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
      // [fix:2025-11-29] 允許 Vite SSG 生成的 inline scripts
      // 參考: https://web.dev/articles/strict-csp
      // 策略說明:
      // - 'unsafe-inline': 允許 SSG 動態生成的 inline scripts
      // - 'strict-dynamic': CSP L3 - 對支持的瀏覽器忽略 unsafe-inline
      'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'strict-dynamic' https://static.cloudflareinsights.com; " +
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

#### 步驟 5：驗證修復

在終端機執行：

```bash
curl -sI https://app.haotool.org/ratewise/ | grep -i "content-security-policy"
```

**預期結果**：

```
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'strict-dynamic' https://static.cloudflareinsights.com; ...
```

在瀏覽器開啟 https://app.haotool.org/ratewise/，Console 應該不再顯示 CSP 錯誤。

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

✅ 應包含：`'unsafe-inline' 'strict-dynamic'`

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

## 📚 技術背景

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

### 為什麼同時使用 'strict-dynamic'？

[CSP Level 3 的 strict-dynamic](https://web.dev/articles/strict-csp) 指令：

- 在支持的現代瀏覽器中，會忽略 `'unsafe-inline'`
- 允許由可信 script 動態加載的其他 scripts
- 提供更好的安全性與相容性平衡

### 安全考量

這個配置在以下條件下是安全的：

1. ✅ 構建過程受控（CI/CD）
2. ✅ 源代碼經過審查
3. ✅ inline scripts 是靜態生成的，非用戶輸入
4. ✅ 使用 Trusted Types 進行額外監控

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
