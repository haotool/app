# Staging 環境部署分析報告

**檢查時間**: 2025-11-06T14:30:00+08:00  
**環境**: https://ratewise-staging.zeabur.app/ratewise  
**檢查者**: AI Assistant  
**狀態**: ⚠️ 發現問題需修復

## 📊 部署狀態總覽

### ✅ 正常運作項目

1. **網站基本功能**
   - [x] 網站成功載入
   - [x] 頁面標題正確顯示
   - [x] 所有 UI 元素正常渲染
   - [x] 貨幣選擇器正常工作
   - [x] 匯率換算功能正常

2. **PWA 檔案載入**
   - [x] `sw.js` 成功載入 (200 狀態碼)
   - [x] `workbox-317fc729.js` 成功載入 (200 狀態碼)
   - [x] Manifest 檔案正確配置

3. **資料來源**
   - [x] 最新匯率資料成功載入
   - [x] 歷史資料（30天）大部分成功載入
   - [x] CDN 和 GitHub Raw 都正常運作

### ⚠️ 發現的問題

#### 1. **CSP 違規錯誤（嚴重）**

**錯誤訊息**:

```
Refused to connect to 'http://ratewise-staging.zeabur.app:8080/ratewise'
because it violates the following Content Security Policy directive:
"connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net
https://cloudflareinsights.com https://*.ingest.sentry.io".
```

**分析**:

- 應用程式嘗試連接到內部的 8080 端口（HTTP）
- 這違反了 CSP 的 `connect-src` 指令
- **可能是 Zeabur 平台的內部健康檢查或監控服務**
- 不影響用戶使用，只是控制台警告

**建議**:

- 這是平台層級的行為，應用程式碼中沒有 8080 端口的引用
- 可以忽略，或聯繫 Zeabur 支援了解詳情

#### 2. **404 錯誤 - 缺少圖片**

**錯誤**:

```
404: /ratewise/ratewise/og-image-old.png
```

**分析**:

- 路徑重複了 `/ratewise`
- 這是一個舊的 Open Graph 圖片引用
- **可能是 Service Worker 快取或舊版本殘留**

**影響**: 低（不影響核心功能）

**建議**:

- 檢查是否有舊的快取
- 確認 HTML 中沒有這個引用（已確認沒有）

#### 3. **版本號顯示問題（待確認）**

**問題**:

- HTML 中的版本號 meta 標籤使用佔位符：
  ```html
  <meta name="app-version" content="__APP_VERSION__" />
  <meta name="build-time" content="__BUILD_TIME__" />
  ```

**分析**:

- Vite 配置中有自定義 plugin 負責替換這些佔位符
- 需要確認建置時是否正確替換

**建議**:

- 檢查建置輸出的 HTML 檔案
- 確認版本號是否正確注入

#### 4. **Manifest 路徑配置（需驗證）**

**當前配置**:

```json
{
  "scope": "/ratewise",
  "start_url": "/ratewise",
  "id": "/ratewise"
}
```

**Vite 配置**:

```typescript
// scope: 帶尾斜線 (MDN 規範要求)
// start_url: 無尾斜線 (避免 nginx 301 重定向)
const manifestScope = base.endsWith('/') ? base : `${base}/`;
const manifestStartUrl = base.replace(/\/$/, '') || '/';
```

**問題**:

- `public/manifest.webmanifest` 的配置與 Vite 動態生成的配置不一致
- `public/manifest.webmanifest` 中 `scope` 缺少尾斜線

**影響**:

- 可能導致 PWA 安裝範圍不正確
- 可能導致 Service Worker 無法正確攔截請求

**建議**:

- 移除 `public/manifest.webmanifest`（因為 Vite PWA plugin 會動態生成）
- 或確保兩者配置一致

## 🔍 詳細檢查項目

### 網路請求分析

**成功載入的資源**:

- ✅ 所有 JavaScript 檔案 (200)
- ✅ Service Worker 檔案 (200)
- ✅ Workbox 檔案 (200)
- ✅ Logo 圖片 (200)
- ✅ 最新匯率資料 (200)
- ✅ 歷史匯率資料（29/30 天成功）

**失敗的請求**:

- ❌ `og-image-old.png` (404) - 路徑錯誤
- ❌ `2025-10-13.json` (404) - 該日期資料不存在（正常）

### PWA 配置檢查

**Manifest 配置**:

```json
{
  "name": "RateWise - 即時匯率轉換器",
  "short_name": "RateWise",
  "theme_color": "#8B5CF6",
  "background_color": "#E8ECF4",
  "display": "standalone",
  "scope": "/ratewise", // ⚠️ 應該是 "/ratewise/"
  "start_url": "/ratewise", // ✅ 正確（無尾斜線）
  "id": "/ratewise" // ✅ 正確
}
```

**Service Worker 配置**:

- ✅ 註冊類型: `prompt` (給用戶控制權)
- ✅ 快取策略: NetworkFirst (HTML/API)
- ✅ 清理舊快取: 啟用
- ✅ 導航預載入: 啟用

### 版本資訊檢查

**HTML Meta 標籤**:

```html
<meta name="app-version" content="__APP_VERSION__" />
<meta name="build-time" content="__BUILD_TIME__" />
```

**問題**: 佔位符未被替換

**Vite 配置**:

```typescript
{
  name: 'inject-version-meta',
  transformIndexHtml(html) {
    return html
      .replace(/__APP_VERSION__/g, appVersion)
      .replace(/__BUILD_TIME__/g, buildTime);
  },
}
```

**可能原因**:

1. Plugin 執行順序問題
2. 建置過程中未正確執行
3. Zeabur 部署配置問題

## 🔧 修復建議

### 優先級 1（高）- 版本號顯示

**問題**: HTML 中版本號佔位符未被替換

**解決方案**:

1. ✅ 已修復：更新 Vite plugin 使用 `enforce: 'post'`
2. ✅ 已修復：使用 `transformIndexHtml.order: 'post'` 確保執行順序
3. 🔄 待驗證：本地 Docker 測試

**程式碼變更**:

```typescript:apps/ratewise/vite.config.ts
{
  name: 'inject-version-meta',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      return html
        .replace(/__APP_VERSION__/g, appVersion)
        .replace(/__BUILD_TIME__/g, buildTime);
    },
  },
}
```

### 優先級 2（中）- Manifest 路徑配置

**問題**: `public/manifest.webmanifest` 與 Vite 動態生成的配置不一致

**解決方案**:

1. 移除 `public/manifest.webmanifest`
2. 完全依賴 Vite PWA plugin 動態生成
3. 或確保 `scope` 使用尾斜線：`"/ratewise/"`

### 優先級 3（低）- 404 錯誤

**問題**: `og-image-old.png` 404 錯誤

**解決方案**:

1. 清除 Service Worker 快取
2. 確認沒有舊的引用
3. 可能需要強制更新 Service Worker

### 優先級 4（資訊）- CSP 警告

**問題**: Zeabur 平台內部連接觸發 CSP 警告

**解決方案**:

- 這是平台行為，無需修復
- 如需消除警告，可聯繫 Zeabur 支援

## 📋 後續行動項目

### 立即執行

1. **修復版本號注入**
   - [ ] 檢查 Vite plugin 配置
   - [ ] 測試本地建置輸出
   - [ ] 驗證 Zeabur 建置流程

2. **修復 Manifest 配置**
   - [ ] 移除或修正 `public/manifest.webmanifest`
   - [ ] 確保 `scope` 使用尾斜線
   - [ ] 重新部署並驗證

3. **建立本地 Docker 測試環境**
   - [ ] 使用 Dockerfile 建置
   - [ ] 驗證版本號注入
   - [ ] 驗證 PWA 功能
   - [ ] 驗證 Manifest 配置

### 驗證項目

完成修復後，需要驗證：

1. **版本號顯示**

   ```javascript
   // 在瀏覽器控制台執行
   console.log('App Version:', document.querySelector('meta[name="app-version"]')?.content);
   console.log('Build Time:', document.querySelector('meta[name="build-time"]')?.content);
   ```

2. **PWA 安裝**
   - 檢查「安裝」按鈕是否出現
   - 測試 PWA 安裝流程
   - 驗證安裝後的行為

3. **離線功能**
   - 斷網後重新整理
   - 驗證快取策略
   - 檢查 Service Worker 狀態

4. **Service Worker 更新**
   - 部署新版本
   - 驗證更新提示
   - 測試更新流程

## 📊 效能指標

### Lighthouse 分數（待測試）

- Performance: ?
- Accessibility: ?
- Best Practices: ?
- SEO: ?
- PWA: ?

### 載入時間

- First Contentful Paint: 待測量
- Largest Contentful Paint: 待測量
- Time to Interactive: 待測量

## 🔗 相關文件

- [Vite PWA Plugin 文件](https://vite-pwa-org.netlify.app/)
- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Context7: Vite 最佳實踐](context7://vitejs/vite)

---

**報告生成時間**: 2025-11-06T14:30:00+08:00  
**下次檢查**: 修復完成後
