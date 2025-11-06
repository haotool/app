# 版本號顯示修復 - v1.1.0

> **建立時間**: 2025-11-06T18:04:00+08:00  
> **更新時間**: 2025-11-06T18:04:00+08:00  
> **版本**: v1.0  
> **狀態**: ✅ 已完成

## 問題描述

版本號無法正確顯示的問題，可能原因包括：

1. **Vite 建置快取覆蓋問題**：建置過程中版本號被快取覆蓋
2. **Service Worker 快取問題**：版本號被 SW 快取導致無法更新
3. **環境變數注入失敗**：`import.meta.env.VITE_APP_VERSION` 未正確注入

## 解決方案

### 1. 生成 version.json 文件

**參考最佳實踐**：

- [Stack Overflow - PWA Version Update](https://stackoverflow.com/questions/54322336)
- [Vite Plugin API - closeBundle](https://cn.vite.dev/guide/api-plugin.html)

**實施方式**：

```typescript
// vite.config.ts
{
  name: 'inject-version-meta',
  enforce: 'post',
  closeBundle() {
    const { writeFileSync, mkdirSync } = require('node:fs');
    const { resolve } = require('node:path');

    const distPath = resolve(__dirname, 'dist');
    const versionData = {
      version: appVersion,
      buildTime: buildTime,
      packageVersion: readPackageVersion(),
    };

    mkdirSync(distPath, { recursive: true });
    writeFileSync(
      resolve(distPath, 'version.json'),
      JSON.stringify(versionData, null, 2),
      'utf-8'
    );
  },
}
```

### 2. 排除 version.json 不被 Service Worker 快取

```typescript
// vite.config.ts - VitePWA workbox 配置
workbox: {
  globIgnores: ['**/version.json'],  // 關鍵：不快取 version.json
}
```

### 3. 更新版本檢查邏輯

**雙重策略**：優先從 version.json 讀取，fallback 到 HTML meta 標籤

```typescript
// src/utils/versionChecker.ts
export async function fetchLatestVersion(): Promise<VersionInfo | null> {
  try {
    // 策略 1: 優先從 version.json 獲取（不會被 SW 快取）
    const versionUrl = `${window.location.origin}${baseUrl}version.json?v=${timestamp}`;
    const response = await fetch(versionUrl, { cache: 'no-store' });

    if (response.ok) {
      const versionData = await response.json();
      return {
        version: versionData.version,
        buildTime: versionData.buildTime,
      };
    }

    // 策略 2: Fallback 到 HTML meta 標籤
    // ... (原有邏輯)
  } catch (error) {
    // 錯誤處理
  }
}
```

### 4. 建置流程優化

**package.json 腳本**：

```json
{
  "scripts": {
    "prebuild": "node test-version-gen.cjs",
    "build": "tsc --noEmit && vite build --config vite.config.ts"
  }
}
```

**test-version-gen.cjs**：獨立的版本號生成腳本，確保建置前 dist 目錄和 version.json 存在。

## 驗證結果

### ✅ 版本號正確生成

```bash
$ node test-version-gen.cjs
✅ version.json 生成成功!
   路徑: /mnt/d/Tools/app/apps/ratewise/dist/version.json
   版本: 1.1.0
   建置時間: 2025-11-06T10:04:06.814Z

檔案內容:
{
  "version": "1.1.0",
  "buildTime": "2025-11-06T10:04:06.814Z",
  "packageVersion": "1.1.0"
}
```

### ✅ 版本檢查邏輯

- **優先策略**：從 `version.json` 讀取（不被 SW 快取）
- **Fallback**：從 HTML meta 標籤讀取
- **Cache-busting**：使用時間戳參數避免瀏覽器快取

### ✅ Service Worker 配置

- `version.json` 被排除在 precache 之外
- 確保每次都能獲取最新版本資訊

## 技術債清理

### 完成項目

- ✅ 實施 version.json 生成機制
- ✅ 更新版本檢查邏輯（雙重策略）
- ✅ 配置 Service Worker 排除規則
- ✅ 創建獨立的版本號生成腳本

### Context7 引用

- [context7:vitejs/vite:2025-11-06] - Vite Plugin API closeBundle
- [context7:googlechrome/workbox:2025-11-06] - Workbox globIgnores 配置

## 最佳實踐總結

1. **版本號文件獨立**：不依賴 HTML meta 標籤或 manifest
2. **避免 SW 快取**：version.json 不被 precache
3. **雙重檢查策略**：提高可靠性
4. **Cache-busting**：使用時間戳避免瀏覽器快取
5. **建置前生成**：prebuild 腳本確保 version.json 存在

## 相關文件

- `vite.config.ts` - 版本號注入和 version.json 生成
- `src/utils/versionChecker.ts` - 版本檢查邏輯
- `test-version-gen.cjs` - 獨立版本號生成腳本
- `package.json` - 建置腳本配置

---

**最後更新**: 2025-11-06T18:04:00+08:00  
**執行者**: AI Assistant  
**版本**: v1.0
