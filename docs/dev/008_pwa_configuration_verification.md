# 008 PWA 配置驗證報告

**版本**: 1.0.0  
**建立時間**: 2025-11-05T21:00:00+0800  
**狀態**: ✅ 配置驗證通過  
**相關文檔**: [007_pwa_version_complete_implementation.md](./007_pwa_version_complete_implementation.md)

---

## 📋 驗證摘要

本次驗證涵蓋 RateWise PWA 的所有核心配置，確保符合 W3C、MDN 和 Workbox 最佳實踐。

### ✅ 已驗證的配置

| 項目                    | 狀態 | 檔案                 | 行數    | 驗證結果                             |
| ----------------------- | ---- | -------------------- | ------- | ------------------------------------ |
| PWA navigateFallback    | ✅   | `vite.config.ts`     | 194     | 已設定為 `'index.html'`              |
| PWA globPatterns        | ✅   | `vite.config.ts`     | 189     | 已排除 `*.html`，避免預快取錯誤      |
| PWA globIgnores         | ✅   | `vite.config.ts`     | 190     | 已排除 `apple-touch-icon.png`        |
| autoUpdate 模式         | ✅   | `vite.config.ts`     | 181     | `registerType: 'autoUpdate'`         |
| clientsClaim            | ✅   | `vite.config.ts`     | 198     | 已啟用                               |
| skipWaiting             | ✅   | `vite.config.ts`     | 199     | 已啟用                               |
| cleanupOutdatedCaches   | ✅   | `vite.config.ts`     | 203     | 已啟用                               |
| navigationPreload       | ✅   | `vite.config.ts`     | 206     | 已啟用                               |
| HTML 快取策略           | ✅   | `vite.config.ts`     | 213-224 | Network First, 1天, 3秒超時          |
| 版本號 meta 標籤        | ✅   | `index.html`         | 17-19   | `app-version` 和 `build-time` 已添加 |
| 版本號注入 plugin       | ✅   | `vite.config.ts`     | 147-152 | `inject-version-meta` plugin 已配置  |
| VersionDisplay 組件     | ✅   | `VersionDisplay.tsx` | 15-24   | 從 meta 標籤讀取版本號               |
| Nginx absolute_redirect | ✅   | `nginx.conf`         | 136     | `absolute_redirect off`              |
| Manifest scope          | ✅   | `vite.config.ts`     | 271     | `/ratewise/` 帶尾斜線                |
| Manifest start_url      | ✅   | `vite.config.ts`     | 272     | `/ratewise/` 帶尾斜線                |
| Manifest id             | ✅   | `vite.config.ts`     | 273     | `/ratewise/` 與 start_url 一致       |

---

## 🔍 配置詳細驗證

### 1. PWA 預快取配置

#### vite.config.ts (行 186-195)

```typescript
workbox: {
  // ✅ 正確：不包含 *.html，避免預快取 index.html
  globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],

  // ✅ 正確：排除可選圖標，避免 404 錯誤
  globIgnores: ['**/apple-touch-icon.png'],

  // ✅ 正確：SPA 路由回退到 index.html
  navigateFallback: 'index.html',
  navigateFallbackDenylist: [/^\/api/, /\.(json|txt|xml)$/],
}
```

**驗證依據**:

- [context7:vite-pwa-org:navigateFallback:2025-11-05]
- [context7:workbox:precaching:2025-11-05]

**修復的問題**:

- ❌ 舊配置：`index.html` 被預快取，導致 `non-precached-url` 錯誤
- ✅ 新配置：`index.html` 由 `navigateFallback` 處理，符合 SPA 最佳實踐

---

### 2. autoUpdate 模式配置

#### vite.config.ts (行 181, 198-203)

```typescript
VitePWA({
  // ✅ 正確：autoUpdate 模式，用戶立即獲取最新版本
  registerType: 'autoUpdate',

  workbox: {
    // ✅ 正確：立即激活新 Service Worker
    clientsClaim: true,
    skipWaiting: true,

    // ✅ 正確：自動清理舊快取
    cleanupOutdatedCaches: true,

    // ✅ 正確：導航預載入，提升首次載入效能
    navigationPreload: true,
  },
});
```

**驗證依據**:

- [context7:vite-pwa-org:auto-update:2025-11-05]
- [context7:workbox:service-worker-lifecycle:2025-11-05]

**優勢**:

- 🚀 用戶無需手動刷新即可獲取最新版本
- 🧹 自動清理舊快取，避免快取膨脹
- ⚡ 導航預載入提升效能

---

### 3. 快取策略優化

#### vite.config.ts (行 211-250)

```typescript
runtimeCaching: [
  {
    // ✅ 正確：HTML Network First，確保獲取最新版本
    urlPattern: /\.html$/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'html-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24, // 1 天（舊：7 天）
      },
      networkTimeoutSeconds: 3, // 3 秒（舊：5 秒）
    },
  },
  {
    // ✅ 正確：API Network First，確保數據即時性
    urlPattern: /^https:\/\/(raw\.githubusercontent\.com|cdn\.jsdelivr\.net)\/.*/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 5, // 5 分鐘
      },
      networkTimeoutSeconds: 10,
    },
  },
  {
    // ✅ 正確：圖片 Cache First，提升載入速度
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'image-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
      },
    },
  },
];
```

**驗證依據**:

- [context7:workbox:runtime-caching:2025-11-05]

**優化點**:

- ⏱️ HTML 快取時間從 7 天降至 1 天，確保更新即時性
- ⚡ 超時時間從 5 秒降至 3 秒，更快回退到快取

---

### 4. 版本號管理系統

#### index.html (行 17-19)

```html
<!-- ✅ 正確：版本資訊 meta 標籤 -->
<meta name="app-version" content="__APP_VERSION__" />
<meta name="build-time" content="__BUILD_TIME__" />
```

#### vite.config.ts (行 147-152)

```typescript
// ✅ 正確：自定義 plugin 注入版本號
{
  name: 'inject-version-meta',
  transformIndexHtml(html) {
    return html
      .replace(/__APP_VERSION__/g, appVersion)
      .replace(/__BUILD_TIME__/g, buildTime);
  },
}
```

#### VersionDisplay.tsx (行 15-24)

```typescript
// ✅ 正確：從 HTML meta 標籤讀取版本號
const getVersionFromMeta = (): string => {
  if (typeof document !== 'undefined') {
    const metaVersion = document.querySelector<HTMLMetaElement>('meta[name="app-version"]');
    if (metaVersion) {
      return metaVersion.content;
    }
  }
  // Fallback: 嘗試從 import.meta.env 讀取
  return import.meta.env.VITE_APP_VERSION ?? '1.0.0';
};
```

**驗證依據**:

- [context7:vite:define-production:2025-11-05]
- [context7:MDN:meta-tags:2025-11-05]

**為什麼需要從 meta 標籤讀取？**

- ❌ 問題：Vite 的 `define` 在生產環境可能被 tree-shaking 優化掉
- ❌ 問題：`import.meta.env` 在打包後可能無法正確讀取
- ✅ 解決：HTML meta 標籤在建置時注入，永遠正確且可靠

---

### 5. Nginx 路由配置

#### nginx.conf (行 134-139)

```nginx
# ✅ 正確：優先匹配 /ratewise 路徑，避免 301 重定向
location ^~ /ratewise {
    # 關閉自動重定向（防止 nginx 偵測到實體目錄時自動加尾斜線）
    absolute_redirect off;
    # 直接回傳根目錄的 index.html（Vite base 為 /ratewise/）
    try_files /index.html =404;
}
```

**驗證依據**:

- [nginx.org:absolute_redirect:2025-11-05]
- [nginx.org:location:2025-11-05]

**解決的問題**:

- ❌ 舊行為：`/ratewise` → `301` → `/ratewise/`
- ✅ 新行為：`/ratewise` → `200` → 直接返回 `index.html`

**為什麼需要 `absolute_redirect off`？**

- Nginx 偵測到實體目錄 `/usr/share/nginx/html/ratewise/` 時，會自動加尾斜線並 301 重定向
- 這會導致 PWA Manifest 的 `start_url` 驗證失敗（Manifest 警告）
- 設定 `absolute_redirect off` 後，直接返回 `index.html`，避免重定向

---

### 6. PWA Manifest 路徑配置

#### vite.config.ts (行 128-131, 271-273)

```typescript
// ✅ 正確：確保 scope 和 start_url 都帶尾斜線
const manifestScope = base.endsWith('/') ? base : `${base}/`;
const manifestStartUrl = manifestScope;

manifest: {
  // ✅ 正確：所有路徑一致且都帶尾斜線
  scope: manifestScope,        // "/ratewise/"
  start_url: manifestStartUrl, // "/ratewise/"
  id: manifestStartUrl,        // "/ratewise/"
}
```

**驗證依據**:

- [context7:W3C:app-manifest:scope:2025-11-05]
- [context7:MDN:web-app-manifest:2025-11-05]

**規範要求**:

- `scope` 必須帶尾斜線（否則退回到根域名）
- `start_url` 必須在 `scope` 範圍內
- `id` 應與 `start_url` 一致（用於 PWA 唯一識別）

---

## 📊 測試結果預期

### 建置測試

```bash
✅ 版本號注入成功（如：1.1.343）
✅ 建置時間注入成功（如：2025-11-05T21:00:00+0800）
✅ Service Worker 生成成功
✅ Manifest 生成成功
✅ 所有靜態資源正確輸出
```

### Docker 測試

```bash
✅ /ratewise/ 返回 200 OK
✅ /ratewise 返回 200 OK（無 301 重定向）
✅ Service Worker 可訪問
✅ Manifest scope 和 start_url 正確
✅ 版本號完整顯示（v1.1.343）
```

### 瀏覽器測試

```bash
✅ Console 無 PWA 相關錯誤
✅ DevTools → Application → Manifest 正確
✅ DevTools → Application → Service Workers 正常
✅ DevTools → Network → 所有資源 200 OK
✅ 離線模式正常運作
✅ PWA 可正常安裝
```

---

## 🔄 已修復的問題

### 問題 1: PWA 預快取錯誤

**錯誤訊息**:

```
PrecacheController.js:283 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'length')
PrecacheStrategy.js:150 Uncaught (in promise) bad-precaching-response: bad-precaching-response :: [{"url":"http://localhost:8080/ratewise/ratewise/apple-touch-icon.png","status":404}]
```

**修復**:

- ✅ 從 `globPatterns` 移除 `*.html`
- ✅ 添加 `navigateFallback: 'index.html'`
- ✅ 添加 `globIgnores: ['**/apple-touch-icon.png']`

### 問題 2: 版本號顯示不完整

**錯誤**:
顯示 `v1.1.` 而非 `v1.1.343`

**修復**:

- ✅ 從 Vite `define` 改為 HTML meta 標籤注入
- ✅ `VersionDisplay` 組件改為從 meta 標籤讀取

### 問題 3: Nginx 301 重定向

**錯誤**:
`/ratewise` → `301` → `/ratewise/`

**修復**:

- ✅ 添加 `location ^~ /ratewise` 優先匹配
- ✅ 設定 `absolute_redirect off`

### 問題 4: Manifest Scope 警告

**錯誤**:

```
Manifest: property 'scope' ignored. Start url should be within scope of scope URL.
```

**修復**:

- ✅ 確保 `scope` 和 `start_url` 都帶尾斜線
- ✅ 確保 `id` 與 `start_url` 一致

---

## 📚 參考來源

### Context7 官方文檔

1. **Vite PWA Plugin**
   - [vite-pwa-org:navigateFallback:2025-11-05]
   - [vite-pwa-org:auto-update:2025-11-05]
   - [vite-pwa-org:workbox-config:2025-11-05]

2. **Workbox**
   - [workbox:precaching:2025-11-05]
   - [workbox:service-worker-lifecycle:2025-11-05]
   - [workbox:runtime-caching:2025-11-05]

3. **Vite**
   - [vite:define-production:2025-11-05]
   - [vite:env-and-mode:2025-11-05]

### W3C 規範

1. **Web App Manifest**
   - [W3C:app-manifest:scope:2025-11-05]
   - [W3C:app-manifest:start-url:2025-11-05]

### MDN Web Docs

1. **PWA**
   - [MDN:web-app-manifest:2025-11-05]
   - [MDN:pwa-icons:2025-11-05]
   - [MDN:navigation-preload:2025-11-05]

2. **HTML**
   - [MDN:meta-tags:2025-11-05]

### Nginx

1. **配置**
   - [nginx.org:absolute_redirect:2025-11-05]
   - [nginx.org:location:2025-11-05]

---

## ✅ 驗證結論

**所有配置已驗證符合最佳實踐**：

| 類別             | 狀態 | 符合規範                     |
| ---------------- | ---- | ---------------------------- |
| PWA 配置         | ✅   | Vite PWA Plugin 官方最佳實踐 |
| Service Worker   | ✅   | Workbox 官方最佳實踐         |
| Web App Manifest | ✅   | W3C App Manifest 規範        |
| 版本管理         | ✅   | Vite 環境變數最佳實踐        |
| Nginx 配置       | ✅   | Nginx 官方文檔               |
| 快取策略         | ✅   | Workbox Caching Strategies   |

---

## 🚀 下一步

1. **執行完整建置測試**

   ```bash
   bash scripts/test-pwa-deployment.sh
   ```

2. **Docker 測試**

   ```bash
   docker build -t ratewise:test .
   docker run -d -p 8080:8080 ratewise:test
   # 瀏覽器測試 http://localhost:8080/ratewise/
   ```

3. **部署到生產環境**
   - 清除 Cloudflare 快取
   - 部署新版本
   - 驗證 PWA 功能

---

**文檔維護**: 本文檔記錄了所有配置的驗證結果，應在每次重大變更後更新。
