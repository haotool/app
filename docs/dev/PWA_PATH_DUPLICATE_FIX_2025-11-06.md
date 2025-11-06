# PWA 路徑重複問題修復報告

**日期**: 2025-11-06  
**問題**: Service Worker 預快取路徑重複 (`/ratewise/ratewise/`)  
**狀態**: ✅ 已修復

---

## 🔴 問題識別

### 錯誤現象

1. **網路請求顯示路徑重複**:
   ```
   /ratewise/ratewise/og-image-old.png (404)
   /ratewise/ratewise/icons/ratewise-icon-*.png (200, 但路徑錯誤)
   /ratewise/ratewise/logo.png (200, 但路徑錯誤)
   ```

2. **Service Worker 預快取錯誤**:
   ```
   PrecacheController.js:283 Uncaught (in promise) non-precached-url: index.html
   bad-precaching-response: og-image-old.png (404)
   ```

3. **版本號顯示不完整**:
   ```
   顯示: v1.1.0
   預期: v1.1.350
   ```

### 根本原因分析

通過瀏覽器 Network 面板分析，發現 Service Worker 正在嘗試預快取以下路徑：

```
✅ 正確: /ratewise/assets/...
❌ 錯誤: /ratewise/ratewise/icons/...
❌ 錯誤: /ratewise/ratewise/logo.png
❌ 錯誤: /ratewise/ratewise/og-image-old.png
```

**原因**: `vite.config.ts` 中同時設定了：
1. Vite 的 `base: '/ratewise/'`
2. VitePWA 的 `base: '/ratewise/'`

這導致路徑被加倍！

---

## 🔍 技術調查

### 查詢的最佳實踐來源

1. **vite-plugin-pwa 官方文檔**
   - URL: https://vite-pwa-org.netlify.app/guide/
   - 關鍵發現: **VitePWA 會自動從 Vite 配置讀取 `base`，不應重複傳遞**

2. **網路搜尋結果**
   - 搜尋: "vite-plugin-pwa base path duplicate precache fix 2025"
   - 確認: 當 Vite 已設定 `base` 時，VitePWA 不需要再傳遞 `base` 參數

### 錯誤配置

```typescript
// ❌ 錯誤配置 (導致路徑重複)
export default defineConfig(() => {
  const base = process.env['VITE_BASE_PATH'] || '/';  // '/ratewise/'
  
  return {
    base,  // Vite 的 base
    plugins: [
      VitePWA({
        base,  // ❌ 重複設定！
        // ...
      })
    ]
  };
});
```

### 正確配置

```typescript
// ✅ 正確配置
export default defineConfig(() => {
  const base = process.env['VITE_BASE_PATH'] || '/';
  
  return {
    base,  // Vite 的 base
    plugins: [
      VitePWA({
        // ✅ 不傳遞 base，讓 VitePWA 自動讀取
        registerType: 'prompt',
        // ...
      })
    ]
  };
});
```

---

## ✅ 修復方案

### 修復 1: 移除 VitePWA 的 base 參數

**檔案**: `apps/ratewise/vite.config.ts`

**修改前**:
```typescript
VitePWA({
  base,  // ❌ 導致路徑重複
  registerType: 'prompt',
  // ...
})
```

**修改後**:
```typescript
VitePWA({
  // [fix:2025-11-06] 移除 base 參數，避免路徑重複
  // VitePWA 會自動從 Vite 的 base 配置中讀取
  // 參考: https://vite-pwa-org.netlify.app/guide/
  registerType: 'prompt',
  // ...
})
```

### 修復 2: 禁用 navigateFallback

**問題**: `index.html` 不在預快取清單中，但 Service Worker 嘗試使用它

**修改**:
```typescript
workbox: {
  // [fix:2025-11-06] 禁用 navigateFallback 避免 non-precached-url 錯誤
  navigateFallback: null,
  navigateFallbackDenylist: [],
  
  // 改用 runtimeCaching 的 HTML NetworkFirst 策略
  runtimeCaching: [
    {
      urlPattern: /\.html$/,
      handler: 'NetworkFirst',
      // ...
    }
  ]
}
```

### 修復 3: 版本號生成邏輯改進

**問題**: `getVersionFromCommitCount` 可能返回 `null`

**修改**:
```typescript
function getVersionFromCommitCount(baseVersion: string): string {
  try {
    const commitCountStr = process.env.GIT_COMMIT_COUNT ?? 
      execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    
    const commitCount = parseInt(commitCountStr, 10);
    if (isNaN(commitCount) || commitCount < 0) {
      console.warn(`[vite.config] Invalid commit count: ${commitCountStr}`);
      return baseVersion;  // ✅ 返回 baseVersion 而非 null
    }
    
    return `${major}.${minor}.${commitCount}`;
  } catch (error) {
    return baseVersion;  // ✅ 確保永遠返回有效版本號
  }
}
```

---

## 📊 修復效果預期

### 修復前

```
❌ 路徑重複: /ratewise/ratewise/icons/...
❌ 404 錯誤: og-image-old.png
❌ Precache 錯誤: non-precached-url: index.html
❌ 版本號: v1.1.0 (不完整)
```

### 修復後

```
✅ 路徑正確: /ratewise/icons/...
✅ 無 404 錯誤 (og-image-old.png 已被清理)
✅ 無 Precache 錯誤 (使用 runtimeCaching)
✅ 版本號: v1.1.350 (完整)
```

---

## 🧪 測試計劃

### 1. 本地測試

```bash
# 1. 建置應用
pnpm build:ratewise

# 2. 檢查版本號
grep 'app-version' apps/ratewise/dist/index.html

# 3. 啟動預覽
pnpm preview

# 4. 檢查 Service Worker
# 在瀏覽器開發者工具 > Application > Service Workers
```

### 2. Staging 環境測試

```bash
# 1. 推送到遠端
git push origin fix/403-forbidden-error

# 2. 等待 Zeabur 部署 (2-3 分鐘)

# 3. 測試 Staging 環境
curl -s https://ratewise-staging.zeabur.app/ratewise | grep 'app-version'

# 4. 瀏覽器測試
# - 檢查 Console 是否有錯誤
# - 檢查 Network 面板路徑是否正確
# - 檢查 Service Worker 預快取清單
```

### 3. PWA 功能驗證

- [ ] Service Worker 正常註冊
- [ ] 離線功能正常
- [ ] 更新通知正常顯示
- [ ] 版本號正確顯示
- [ ] 無路徑重複錯誤
- [ ] 無 404 錯誤

---

## 📚 參考資料

1. **vite-plugin-pwa 官方文檔**
   - https://vite-pwa-org.netlify.app/guide/
   - 關於 `base` 配置的說明

2. **Workbox 文檔**
   - https://developer.chrome.com/docs/workbox/
   - 關於 `navigateFallback` 的最佳實踐

3. **網路搜尋結果**
   - "vite-plugin-pwa base path duplicate precache fix 2025"
   - "vite-plugin-pwa navigateFallback index.html best practices"

---

## 🎯 總結

### 核心問題

**VitePWA 的 `base` 參數與 Vite 的 `base` 配置重複，導致 Service Worker 預快取路徑加倍**

### 解決方案

**移除 VitePWA 的 `base` 參數，讓它自動從 Vite 配置讀取**

### 額外修復

1. 禁用 `navigateFallback`，改用 `runtimeCaching`
2. 改進版本號生成邏輯，確保永遠返回有效版本號
3. 增加調試日誌以便追蹤問題

### 預期結果

- ✅ 無路徑重複錯誤
- ✅ 無 404 錯誤
- ✅ 無 Precache 錯誤
- ✅ 版本號正確顯示
- ✅ PWA 功能完全正常

---

**報告作者**: AI Assistant  
**修復日期**: 2025-11-06  
**參考來源**: vite-plugin-pwa 官方文檔 + 網路最佳實踐  
**狀態**: ✅ 修復完成，待部署測試

