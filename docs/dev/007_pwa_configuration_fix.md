# 007_pwa_configuration_fix.md - PWA Manifest Scope 修復指南

**建立時間**: 2025-11-05
**更新時間**: 2025-11-05
**版本**: v1.0
**狀態**: ✅ 已完成

---

## 問題描述

### 生產環境錯誤

**Console 警告**:

```
Manifest: property 'scope' ignored. Start url should be within scope of scope URL.
```

**影響範圍**:

- Service Worker 已註冊但 scope 錯誤
- PWA 安裝提示可能受阻
- 離線功能範圍不正確
- 違反 W3C/MDN PWA 規範

### 根本原因

1. **靜態檔案覆蓋動態生成**
   `apps/ratewise/public/manifest.webmanifest` 靜態檔案在 build 時覆蓋了 Vite PWA 插件動態生成的正確版本。

2. **Scope/Start URL 缺少尾斜線**

   ```json
   {
     "scope": "/ratewise", // ❌ 缺少尾斜線
     "start_url": "/ratewise", // ❌ 缺少尾斜線
     "id": "/ratewise" // ❌ 缺少尾斜線
   }
   ```

3. **瀏覽器行為**
   根據 PWA 規範，scope 無尾斜線會導致瀏覽器將 scope 退回到根域名 `/`，導致 start_url (`/ratewise`) 不在 scope 範圍內。

---

## Linus 三問驗證

### 1. 這是真問題還是臆想出來的？

**真問題** ✅

**證據**:

1. 生產環境實際警告：https://app.haotool.org/ratewise
2. 違反 PWA 規範：
   - [MDN Manifest Scope](https://developer.mozilla.org/en-US/docs/Web/Manifest/scope)
   - [W3C App Manifest](https://www.w3.org/TR/appmanifest/)
   - [PWABuilder Issue #2743](https://github.com/pwa-builder/PWABuilder/issues/2743)
3. 影響 PWA 安裝體驗和 Service Worker 功能範圍

**MDN 官方說明**:

> "Make sure to end the scope property with a trailing slash (/). example.com/app is NOT a valid scope, and browsers will silently fall back to considering your app's scope to be the root domain instead."

### 2. 有更簡單的方法嗎？

**最簡方案** ✅：刪除 `public/manifest.webmanifest`

**理由**:

- Vite PWA 插件已正確配置 (vite.config.ts line 130-131)
- 插件自動確保 scope/start_url 有尾斜線
- 消除重複配置，符合 DRY 原則
- 類似 Linus "好品味"範例：94 行配置消除為 0 行

**對比其他方案**:

- ❌ 修正靜態檔案：需手動同步 vite.config.ts，維護成本高
- ❌ Nginx 重寫：治標不治本，瀏覽器警告依舊
- ✅ 移除靜態檔案：簡潔、正確、可維護

### 3. 會破壞什麼嗎？

**向後相容性** ✅：安全

**分析**:

- Service Worker 更新機制正常運作
- Scope 從 `/ratewise` 擴展為 `/ratewise/` 是**擴展**而非限縮
- Build 時驗證，錯誤易發現且可快速回滾
- ⚠️ 已安裝的 PWA 需用戶重新安裝才能更新 scope（自主操作）

---

## 修復方案

### 採用方案

**方案 A：移除靜態 Manifest（⭐⭐⭐⭐⭐）**

**修改清單**:

```bash
# 刪除靜態檔案
rm apps/ratewise/public/manifest.webmanifest

# Vite 配置無需修改（已正確）
# vite.config.ts line 130-131:
# const manifestScope = base.endsWith('/') ? base : `${base}/`;
# const manifestStartUrl = manifestScope;
```

**技術決策**:

1. **DRY 原則**：單一真實來源（vite.config.ts）
2. **自動正確**：Vite 插件確保規範遵循
3. **環境適應**：自動適應 `VITE_BASE_PATH` 環境變數
4. **Linus 好品味**：消除特殊情況，避免條件判斷

**優點**:

- ✅ 簡潔：消除重複配置
- ✅ 可維護：單一真實來源
- ✅ 動態：自動適應環境變數
- ✅ 正確：Vite 插件確保 scope/start_url 一致性

**缺點**: 無

**風險評估**: 低（Build 時驗證，錯誤易發現）

---

## Context7 引用與技術依據

### [context7:vite-pwa/vite-plugin-pwa:2025-11-05]

**官方建議**:

- 插件自動生成 `manifest.webmanifest` 並注入到 HTML
- `public/` 中的同名檔案會覆蓋生成的檔案
- **建議**：透過 `manifest` 配置選項動態生成，而非靜態檔案

### [context7:mdn/web-docs:2025-11-05]

**MDN Manifest Scope 規範**:

- Scope 必須以 `/` 結尾
- 無尾斜線會導致瀏覽器退回 scope 到根域名 `/`
- start_url 必須在 scope 範圍內

**範例**:

```json
// ✅ 正確
{ "scope": "/app/", "start_url": "/app/" }

// ❌ 錯誤
{ "scope": "/app", "start_url": "/app" }
// 瀏覽器會將 scope 退回為 "/"，導致 start_url 不在範圍內
```

### [context7:w3c/service-workers:2025-11-05]

**W3C Service Worker Scope 匹配算法**:

- Scope 匹配是**字串前綴匹配**，非路徑匹配
- `/prefix` 會匹配 `/prefix-of/index.html`（錯誤）
- `/prefix/` 只匹配 `/prefix/` 目錄內容（正確）

### [CLAUDE.md Linus 原則]

**好品味原則**:

> "消除特殊情況永遠優於增加條件判斷。好的程式碼應該讓問題的特殊情況消失，變成正常情況。"

**應用**:

- 靜態 manifest + 動態 manifest = 特殊情況（需同步）
- 只保留動態 manifest = 消除特殊情況
- 94 行配置消除為 0 行，符合 Linus 簡潔美學

---

## 驗證結果

### Build 輸出

**環境變數**:

```bash
VITE_BASE_PATH=/ratewise/
```

**生成的 manifest.webmanifest**:

```bash
$ cat apps/ratewise/dist/manifest.webmanifest | jq '.scope, .start_url, .id'
"/ratewise/"
"/ratewise/"
"/ratewise/"
```

✅ **驗證通過**：所有欄位皆有尾斜線

### 本地測試

**啟動 preview server**:

```bash
VITE_BASE_PATH=/ratewise/ pnpm --filter @app/ratewise build
pnpm --filter @app/ratewise preview --port 4173
```

**瀏覽器檢查** (http://localhost:4173/ratewise):

- ✅ Console 無警告
- ✅ Service Worker 正常註冊
- ✅ Manifest 正確載入

**Chrome DevTools > Application > Manifest**:

```
Scope: /ratewise/
Start URL: /ratewise/
ID: /ratewise/
```

### 生產環境驗證（待部署後執行）

**檢查清單**:

- [ ] 訪問 https://app.haotool.org/ratewise
- [ ] 檢查 Console 無 manifest 警告
- [ ] DevTools > Application > Manifest 顯示正確 scope
- [ ] Service Worker 正常運作
- [ ] PWA 安裝提示正常顯示
- [ ] Lighthouse PWA 檢查通過（≥90 分）

---

## 執行步驟

### 1. 刪除靜態檔案

```bash
git checkout fix/pwa-assets
rm apps/ratewise/public/manifest.webmanifest
```

### 2. Build 並驗證

```bash
VITE_BASE_PATH=/ratewise/ pnpm --filter @app/ratewise build
cat apps/ratewise/dist/manifest.webmanifest | jq '.scope, .start_url, .id'
# 預期輸出："/ratewise/" (三次)
```

### 3. 本地測試

```bash
pnpm --filter @app/ratewise preview --port 4173
# 開啟 http://localhost:4173/ratewise
# 檢查 Chrome DevTools > Console 無警告
```

### 4. Commit

```bash
git add apps/ratewise/public/manifest.webmanifest
git commit -m "fix(pwa): remove static manifest, rely on Vite dynamic generation

- 移除 apps/ratewise/public/manifest.webmanifest 靜態檔案
- 完全依賴 vite.config.ts 動態生成 manifest
- 修正 scope/start_url 缺少尾斜線問題（/ratewise → /ratewise/）
- 消除生產環境 Console 警告：「Manifest: property 'scope' ignored」

技術決策：
- 遵循 DRY 原則，單一真實來源（vite.config.ts line 130-131）
- 自動適應 VITE_BASE_PATH 環境變數
- 符合 PWA 規範（MDN/W3C）與 Linus 好品味原則

驗證：
- Build 輸出：scope=\"/ratewise/\", start_url=\"/ratewise/\", id=\"/ratewise/\"
- 本地測試：Console 無警告
- 參考：vite-plugin-pwa 官方最佳實踐

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. 部署驗證

```bash
git push origin fix/pwa-assets
# 推送到 Zeabur 自動部署
# 檢查 https://app.haotool.org/ratewise Console 無警告
```

---

## 相關文件

- **PWA 最佳實踐**: [vite-plugin-pwa 官方文檔](https://vite-pwa-org.netlify.app/)
- **Manifest 規範**: [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- **Service Worker**: [W3C Service Workers](https://www.w3.org/TR/service-workers/)
- **Linus 好品味**: [LINUS_GUIDE.md](../LINUS_GUIDE.md)
- **開發守則**: [CLAUDE.md](../CLAUDE.md)

---

## 後續改進

### 短期（本週）

- [x] 修正 manifest scope/start_url
- [ ] 驗證生產環境部署
- [ ] Lighthouse PWA 分數檢查
- [ ] 更新部署文檔 (DEPLOYMENT.md)

### 中期（本月）

- [ ] 測試 PWA 離線功能
- [ ] 驗證 PWA 安裝提示
- [ ] 監控 Service Worker 錯誤率
- [ ] 追蹤 PWA 安裝率（Google Analytics）

### 長期（未來）

- [ ] 考慮進階 PWA 功能：
  - Background Sync（離線表單同步）
  - Push Notifications（匯率波動提醒）
  - Periodic Background Sync（定期更新匯率）

---

**最後更新**: 2025-11-05
**維護者**: Claude Code
**Commit**: 369d5c3903c84f57f7bb820b149ac3f58c1fa45a
