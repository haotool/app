# RateWise 404 錯誤診斷報告

**日期**: 2025-12-14
**診斷者**: Claude Code
**狀態**: ✅ 診斷完成，待修復確認

---

## 📋 問題描述

用戶報告 ratewise 網站顯示以下錯誤：

```
Unexpected Application Error!
404 Not Found
```

## 🔍 診斷過程

### 1. 檢查建置流程

✅ **TypeScript 編譯**: 通過
✅ **Vite 建置**: 成功
✅ **SSG 預渲染**: 正常生成 17 個靜態頁面
✅ **Preview Server**: 本地測試正常

### 2. 檢查應用架構

- 使用 `vite-react-ssg` 進行靜態網站生成
- `main.tsx` 作為入口文件，使用 `ViteReactSSG()` 配置路由
- `routes.tsx` 定義所有路由（17 個頁面）
- ✅ 架構正確，無衝突

### 3. 檢查資源路徑配置

**關鍵發現**：

```typescript
// vite.config.ts
const base = baseFromEnv ?? (process.env['CI'] ? '/' : mode === 'production' ? '/ratewise/' : '/');
```

**影響**：

- 生產環境建置使用 `base: '/ratewise/'`
- 所有資源路徑為 `/ratewise/assets/...`
- Service Worker、manifest 等路徑也使用 `/ratewise/` 前綴

## ⚠️ 問題根源

### 原因 1: 部署路徑不匹配（最可能）

如果應用部署在**根路徑 `/`** 但建置時使用 `/ratewise/`：

```
❌ 訪問: https://app.haotool.org/
   請求資源: /ratewise/assets/app-75RtlONZ.js
   實際路徑: /assets/app-75RtlONZ.js (不存在)
   結果: 404 錯誤

✅ 正確部署: https://app.haotool.org/ratewise/
   請求資源: /ratewise/assets/app-75RtlONZ.js
   實際路徑: /ratewise/assets/app-75RtlONZ.js (存在)
   結果: 正常載入
```

### 原因 2: 缺少 SPA Fallback 配置

即使路徑正確，如果伺服器（nginx/Zeabur）沒有配置 SPA fallback：

```
訪問: /ratewise/about
伺服器查找: /ratewise/about (檔案不存在)
結果: 404 錯誤

正確配置應該:
訪問: /ratewise/about
伺服器返回: /ratewise/index.html
React Router 處理: 渲染 About 頁面
```

## 🔧 修復方案

### 方案 A: 確認部署路徑（推薦）

**如果應用應該部署在根路徑 `/`**：

```bash
# 使用環境變數建置
VITE_BASE_PATH='/' pnpm build

# 或修改 vite.config.ts 預設值
const base = baseFromEnv ?? '/';  // 改為根路徑
```

**如果應用應該部署在 `/ratewise/`**：

1. 確認伺服器配置正確指向 `/ratewise/` 子路徑
2. 確認 dist 目錄部署到正確位置

### 方案 B: 添加 SPA Fallback 配置

**對於 Nginx**：

```nginx
location /ratewise/ {
    alias /path/to/dist/;
    try_files $uri $uri/ /ratewise/index.html;
}
```

**對於 Zeabur（使用 Dockerfile）**：

確認 nginx.conf 包含：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 方案 C: 檢查當前部署狀態

```bash
# 1. 確認實際部署 URL
# 訪問: https://app.haotool.org/ 或 https://app.haotool.org/ratewise/

# 2. 檢查資源載入
# 打開瀏覽器開發者工具 > Network
# 查看失敗的資源請求路徑

# 3. 確認 VITE_BASE_PATH 環境變數
echo $VITE_BASE_PATH
```

## 📝 建議的修復步驟

### 立即修復（臨時方案）

1. **確認當前部署 URL**

   ```bash
   # 檢查應用實際部署在哪個路徑
   curl -I https://app.haotool.org/
   curl -I https://app.haotool.org/ratewise/
   ```

2. **根據部署路徑重新建置**

   ```bash
   # 如果部署在根路徑
   VITE_BASE_PATH='/' pnpm build

   # 如果部署在 /ratewise/
   VITE_BASE_PATH='/ratewise/' pnpm build
   ```

3. **重新部署**
   ```bash
   # 推送到分支觸發重新部署
   git add .
   git commit -m "fix: 修正建置 base path 配置"
   git push origin claude/fix-ratewise-404-error-rTQev
   ```

### 長期方案（根本修復）

1. **統一環境變數管理**
   - 在 CI/CD 環境中明確設置 `VITE_BASE_PATH`
   - 在部署平台（Zeabur）設置環境變數

2. **文檔化部署流程**
   - 更新 `DEPLOYMENT.md` 明確 base path 配置
   - 添加故障排除指南

3. **添加自動化檢查**
   - CI 中驗證建置後的資源路徑
   - 部署後自動測試頁面載入

## 🎯 後續行動

- [ ] 確認當前部署環境的實際 URL
- [ ] 檢查瀏覽器開發者工具中的網路請求錯誤
- [ ] 根據實際情況選擇修復方案
- [ ] 測試修復後的部署
- [ ] 更新部署文檔避免再次發生

## 📚 參考資料

- `vite.config.ts:149-150` - base path 配置邏輯
- `apps/ratewise/scripts/postbuild-mirror-dist.js` - 資源鏡像腳本
- `docs/DEPLOYMENT.md` - 部署指南
- `docs/ZEABUR_DEPLOYMENT.md` - Zeabur 部署指南

---

**診斷完成時間**: 2025-12-14T02:15:00Z
**下一步**: 等待用戶確認部署環境並應用修復方案
