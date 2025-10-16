# PWA 實作文檔

**建立時間**: 2025-10-17T01:52:00+08:00  
**狀態**: ✅ 已完成  
**版本**: 1.0.0

## 📋 實作概述

RateWise 已成功實作為漸進式網頁應用程式（PWA），支援離線使用、應用程式安裝和快速載入。

## 🎯 技術實作

### 1. Web App Manifest

**位置**: `/public/manifest.webmanifest`

```json
{
  "name": "RateWise - 即時匯率轉換器",
  "short_name": "RateWise",
  "description": "快速、準確的即時匯率轉換工具",
  "theme_color": "#8B5CF6",
  "background_color": "#E8ECF4",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/pwa-512x512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2. Service Worker

**位置**: `/public/sw.js`

**策略**:

- **靜態資源**: Cache First（快取優先）
- **API 請求**: Network First（網路優先）with fallback to cache

**快取管理**:

- `ratewise-v1`: 預快取的靜態資源
- `ratewise-runtime-v1`: 執行時快取的動態資源

**關鍵功能**:

- 離線支援
- 自動更新（skipWaiting）
- 即時接管（clientsClaim）
- API 請求快取（Frankfurter API）

### 3. Service Worker 註冊

**位置**: `/index.html`

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

## 📱 PWA 圖標

所有圖標已正確配置並放置在 `/public/` 目錄：

- `pwa-192x192.png` (33KB) - 基礎圖標
- `pwa-384x384.png` (146KB) - 中等圖標
- `pwa-512x512.png` (282KB) - 大型圖標
- `pwa-512x512-maskable.png` (154KB) - 自適應圖標（Android）
- `apple-touch-icon.png` (29KB) - iOS 圖標
- `favicon.ico` (4.2KB) - 瀏覽器圖標
- `favicon.svg` (254B) - SVG 圖標

## ✅ 瀏覽器支援

| 功能           | Chrome | Firefox | Safari         | Edge |
| -------------- | ------ | ------- | -------------- | ---- |
| Manifest       | ✅     | ✅      | ✅             | ✅   |
| Service Worker | ✅     | ✅      | ✅             | ✅   |
| 離線支援       | ✅     | ✅      | ✅             | ✅   |
| 安裝提示       | ✅     | ❌      | ✅ (iOS 16.4+) | ✅   |

## 🧪 測試方法

### 本地測試

```bash
# 建置專案
pnpm build

# 啟動預覽服務器
pnpm preview

# 訪問 http://localhost:4173
```

### 驗證清單

1. ✅ 開啟 Chrome DevTools > Application > Manifest
2. ✅ 檢查 Service Worker 已註冊
3. ✅ 測試離線模式（DevTools > Network > Offline）
4. ✅ 驗證安裝提示（桌面版 Chrome）
5. ✅ 檢查快取策略（Application > Cache Storage）

## 📈 效能指標

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Lighthouse PWA Score**: 100/100 (目標)

## 🔧 技術債務與改進

### 已解決

- ✅ vite-plugin-pwa 相容性問題（改用手動配置）
- ✅ Service Worker 註冊邏輯
- ✅ Manifest 配置完整性

### 未來改進

- [ ] 實作更新通知 UI
- [ ] 添加背景同步（Background Sync）
- [ ] 實作推播通知（Push Notifications）
- [ ] 優化快取策略（Workbox strategies）

## 📚 參考資料

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) [context7:mdn/pwa:2025-10-17T01:52:00+08:00]
- [Web.dev - PWA](https://web.dev/learn/pwa/) [context7:web.dev/pwa:2025-10-17T01:52:00+08:00]
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) [context7:mdn/sw:2025-10-17T01:52:00+08:00]

## 📝 維護指南

### 更新 Service Worker

編輯 `/public/sw.js` 並更新 `CACHE_NAME` 版本：

```javascript
const CACHE_NAME = 'ratewise-v2'; // 遞增版本號
```

### 更新 Manifest

編輯 `/public/manifest.webmanifest` 並重新建置專案。

### 監控與除錯

使用 Chrome DevTools:

1. Application > Service Workers
2. Application > Cache Storage
3. Console 查看 SW 日誌

---

**最後更新**: 2025-10-17T01:52:00+08:00  
**作者**: RateWise Development Team
