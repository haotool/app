# 路徑配置審計報告

**日期**: 2025-11-06  
**審計範圍**: 全局 `/ratewise/` 和 `/ratewise` 配置  
**執行者**: AI Assistant  
**狀態**: ✅ 已完成修復

---

## 📋 執行摘要

本次審計檢查了整個專案中 `/ratewise/` 和 `/ratewise` 的使用，確保所有配置符合最佳實踐。發現並修復了 1 個配置不一致問題。

---

## 🔍 審計發現

### ✅ 正確配置

#### 1. Vite 配置 (`vite.config.ts`)

```typescript:apps/ratewise/vite.config.ts
// ✅ 正確：使用環境變數，帶尾斜線
const base = process.env['VITE_BASE_PATH'] || '/';

// ✅ 正確：Manifest scope 帶尾斜線
const manifestScope = base.endsWith('/') ? base : `${base}/`;

// ✅ 正確：Manifest start_url 無尾斜線（避免 nginx 301）
const manifestStartUrl = base.replace(/\/$/, '') || '/';
```

**說明**:

- `base`: 使用環境變數 `VITE_BASE_PATH`，預設為 `/`
- `manifestScope`: 確保帶尾斜線（MDN 規範要求）
- `manifestStartUrl`: 移除尾斜線（避免 nginx 301 重定向）

#### 2. Manifest 配置 (`public/manifest.webmanifest`)

```json:apps/ratewise/public/manifest.webmanifest
{
  "scope": "/ratewise/",      // ✅ 正確：帶尾斜線
  "start_url": "/ratewise",   // ✅ 正確：無尾斜線
  "id": "/ratewise"           // ✅ 正確：PWA 唯一識別符
}
```

**說明**:

- 符合 MDN Web App Manifest 規範
- `scope` 帶尾斜線定義 PWA 作用範圍
- `start_url` 無尾斜線避免 nginx 重定向

#### 3. Dockerfile 配置

```dockerfile:Dockerfile
# ✅ 正確：預設值帶尾斜線，可配置
ARG VITE_BASE_PATH=/ratewise/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
```

**說明**:

- 預設值為 `/ratewise/`（生產環境）
- 支援透過 build args 覆蓋（測試環境可用 `/`）

---

### ❌ 發現的問題

#### 問題 1: React Router basename 配置不一致

**位置**: `apps/ratewise/src/App.tsx`

**原始配置**:

```typescript
// ❌ 問題：硬編碼路徑，與 vite.config.ts 不一致
const basename = import.meta.env.DEV ? '/' : '/ratewise';
```

**問題分析**:

1. 硬編碼 `/ratewise` 無法適應不同環境
2. 與 Vite 的 `base` 配置不一致
3. 無法透過環境變數動態配置

**修復方案**:

```typescript
// ✅ 修復：使用 Vite 的 BASE_URL，確保一致性
const base = import.meta.env.BASE_URL || '/';
const basename = base.replace(/\/$/, '') || '/';
```

**修復說明**:

- 使用 `import.meta.env.BASE_URL`（Vite 自動注入）
- 移除尾斜線以符合 React Router 要求
- 與 `vite.config.ts` 的 `base` 配置保持一致

---

## 📊 配置一致性矩陣

| 配置項目              | 位置                          | 值                            | 尾斜線 | 狀態      |
| --------------------- | ----------------------------- | ----------------------------- | ------ | --------- |
| Vite base             | `vite.config.ts`              | `VITE_BASE_PATH` 或 `/`       | ✅ 帶  | ✅ 正確   |
| Manifest scope        | `public/manifest.webmanifest` | `/ratewise/`                  | ✅ 帶  | ✅ 正確   |
| Manifest start_url    | `public/manifest.webmanifest` | `/ratewise`                   | ❌ 無  | ✅ 正確   |
| Manifest id           | `public/manifest.webmanifest` | `/ratewise`                   | ❌ 無  | ✅ 正確   |
| React Router basename | `src/App.tsx`                 | `BASE_URL.replace(/\/$/, '')` | ❌ 無  | ✅ 已修復 |
| Dockerfile ARG        | `Dockerfile`                  | `/ratewise/`                  | ✅ 帶  | ✅ 正確   |

---

## 🎯 最佳實踐總結

### 1. 尾斜線使用規則

#### 帶尾斜線 `/ratewise/`

- ✅ Vite `base` 配置
- ✅ PWA Manifest `scope`
- ✅ Dockerfile `VITE_BASE_PATH` 預設值
- ✅ 環境變數 `VITE_BASE_PATH`

#### 無尾斜線 `/ratewise`

- ✅ PWA Manifest `start_url`（避免 nginx 301）
- ✅ PWA Manifest `id`
- ✅ React Router `basename`（框架要求）

### 2. 配置優先級

```
環境變數 VITE_BASE_PATH
    ↓
Vite base 配置
    ↓
import.meta.env.BASE_URL (自動注入)
    ↓
React Router basename
```

### 3. 環境變數配置

#### 開發環境

```bash
# 不設定，使用預設值
VITE_BASE_PATH=/
```

#### 生產環境（Zeabur）

```bash
# 必須設定，帶尾斜線
VITE_BASE_PATH=/ratewise/
```

#### 測試環境（Staging）

```bash
# 選項 A: 與生產環境一致（推薦）
VITE_BASE_PATH=/ratewise/

# 選項 B: 使用根路徑（簡化測試）
VITE_BASE_PATH=/
```

---

## 🔧 修復清單

### 已修復

- [x] `src/App.tsx` - React Router basename 改用 `BASE_URL`
- [x] 驗證所有配置一致性
- [x] 建立配置審計報告

### 驗證項目

- [ ] 本地開發環境測試
- [ ] 本地建置測試
- [ ] Docker 建置測試
- [ ] Staging 環境測試
- [ ] 生產環境驗證

---

## 🧪 測試計畫

### 1. 本地開發測試

```bash
# 啟動開發伺服器
pnpm --filter @app/ratewise dev

# 驗證項目：
# - 路由導航正常
# - 靜態資源載入正常
# - PWA manifest 可訪問
```

### 2. 本地建置測試

```bash
# 建置應用
pnpm --filter @app/ratewise build

# 預覽建置結果
pnpm --filter @app/ratewise preview

# 驗證項目：
# - 所有路由正常
# - 資源路徑正確
# - PWA 功能正常
```

### 3. Docker 建置測試

```bash
# 使用測試腳本
./scripts/test-docker-build.sh  # Linux/macOS
.\scripts\test-docker-build.ps1 # Windows

# 驗證項目：
# - 版本號注入正確
# - PWA manifest 配置正確
# - 所有資源可訪問
```

### 4. 瀏覽器測試

```bash
# 啟動預覽伺服器
pnpm --filter @app/ratewise preview

# 使用瀏覽器測試：
# - 導航至 http://localhost:4173/ratewise
# - 檢查所有路由
# - 測試 PWA 安裝
# - 驗證離線功能
```

---

## 📚 參考文件

### 內部文檔

- `docs/dev/STAGING_DEPLOYMENT_ANALYSIS.md` - 部署分析
- `docs/dev/DEPLOYMENT_FIX_SUMMARY_2025-11-06.md` - 修復總結
- `apps/ratewise/docs/VERSION_MANAGEMENT.md` - 版本管理

### 外部資源

- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MDN: start_url](https://developer.mozilla.org/en-US/docs/Web/Manifest/start_url)
- [W3C: Web App Manifest](https://www.w3.org/TR/appmanifest/)
- [Vite: Base Option](https://vitejs.dev/config/shared-options.html#base)
- [React Router: basename](https://reactrouter.com/en/main/router-components/browser-router)

### Context7 查詢

- [context7:vitejs/vite:2025-11-06] - Vite 配置
- [context7:vite-pwa/vite-plugin-pwa:2025-11-06] - PWA Plugin
- [context7:reactrouter/react-router:2025-11-06] - React Router

---

## 🎓 學習要點

### 1. 為什麼 scope 需要尾斜線？

根據 MDN 規範：

> If the scope does not end with a slash, the browser will treat it as a file path and remove the last segment.

**範例**:

- `"scope": "/ratewise"` → 實際作用範圍: `/` (錯誤！)
- `"scope": "/ratewise/"` → 實際作用範圍: `/ratewise/` (正確！)

### 2. 為什麼 start_url 不需要尾斜線？

避免 nginx 301 重定向：

```nginx
# nginx 預設行為
/ratewise/ → 200 OK
/ratewise  → 301 Redirect to /ratewise/
```

如果 `start_url: "/ratewise/"`，用戶點擊 PWA 圖標會先經過 301 重定向，增加載入時間。

### 3. 為什麼 React Router basename 不需要尾斜線？

React Router 官方文檔要求：

> The basename should not have a trailing slash.

**範例**:

```typescript
// ❌ 錯誤
<Router basename="/ratewise/">

// ✅ 正確
<Router basename="/ratewise">
```

---

## 🚀 後續行動

### 立即執行

1. **執行本地測試**

   ```bash
   pnpm --filter @app/ratewise dev
   ```

2. **執行建置測試**

   ```bash
   pnpm --filter @app/ratewise build
   pnpm --filter @app/ratewise preview
   ```

3. **執行瀏覽器測試**
   - 導航測試
   - PWA 安裝測試
   - 離線功能測試

4. **提交變更**
   ```bash
   git add .
   git commit -m "fix: 統一 React Router basename 配置使用 BASE_URL"
   git push
   ```

### 驗證清單

- [ ] 本地開發環境正常
- [ ] 本地建置正常
- [ ] Docker 建置正常
- [ ] 所有路由可訪問
- [ ] PWA manifest 正確
- [ ] PWA 安裝功能正常
- [ ] 離線功能正常
- [ ] 版本號顯示正確

---

**報告生成時間**: 2025-11-06T16:00:00+08:00  
**執行者**: AI Assistant  
**遵循規範**: AGENTS.md, LINUS_GUIDE.md, Linus 三問
