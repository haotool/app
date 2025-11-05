# 🐛 待修復問題清單

**建立時間**: 2025-11-05T21:11:08+08:00  
**檢查端口**: http://localhost:4173  
**當前分支**: fix/bugs-20251105  
**檢查者**: LINUS_GUIDE Agent  
**專案版本**: 1.0.0

---

## 📋 問題總覽

| ID      | 優先級  | 類型          | 問題描述                  | 狀態      |
| ------- | ------- | ------------- | ------------------------- | --------- |
| bug-001 | 🔴 嚴重 | PWA           | Service Worker 註冊失敗   | ⏸ 待處理 |
| bug-002 | 🟡 中等 | UI/Version    | Footer 版本號顯示異常     | ⏸ 待處理 |
| bug-003 | 🟡 中等 | Logic/Version | 版本檢測誤判觸發錯誤提示  | ⏸ 待處理 |
| bug-004 | 🟠 低   | UI/Data       | 匯率數據顯示為 0.0000     | ⏸ 待處理 |
| bug-005 | ⚠️ 警告 | Dependency    | React Router 未來標誌警告 | ⏸ 待處理 |
| bug-006 | 🔍 效能 | Performance   | TTFB 970ms 需優化         | ⏸ 待處理 |
| bug-007 | 🗓️ 資料 | Data/History  | 歷史匯率資料缺失          | ⏸ 待處理 |

---

## 🔴 BUG-001: PWA Service Worker 註冊失敗

### 問題描述

開發環境下嘗試註冊 `/dev-sw.js` 時，返回 `text/html` MIME type，預期應為 `application/javascript`。

### 錯誤訊息

```
[PWA] Skip service worker registration: Error: Unsupported MIME type "text/html" for /dev-sw.js?dev-sw
    at validateServiceWorkerScript (http://localhost:4173/src/components/UpdatePrompt.tsx:56:27)
```

### 影響範圍

- 開發環境下 PWA 功能完全無法使用
- Service Worker 無法註冊，離線功能失效

### 可能原因

1. Vite 開發伺服器未正確處理 `/dev-sw.js` 路徑
2. `UpdatePrompt.tsx` 中的驗證邏輯在開發環境下不適用
3. Vite PWA Plugin 配置問題

### 修復建議

- **選項 A**: 在開發環境下跳過 Service Worker 註冊（最簡單）
- **選項 B**: 修復 Vite 開發伺服器配置，正確提供 dev-sw.js
- **選項 C**: 修改 `UpdatePrompt.tsx` 中的 MIME type 驗證邏輯

### 相關檔案

- `apps/ratewise/src/components/UpdatePrompt.tsx:56-59`
- `apps/ratewise/vite.config.ts` (PWA Plugin 配置)

---

## 🟡 BUG-002: Footer 版本號顯示異常

### 問題描述

Footer 區塊顯示 `v__APP_VERSION__` 和 `Built on Invalid Date Invalid Date`，環境變數未正確替換。

### 實際顯示

```
v__APP_VERSION__ • Built on Invalid Date Invalid Date • © 2025
```

### 預期顯示

```
v1.1.0 • Built on 2025-11-05 21:11 • © 2025
```

### 影響範圍

- 使用者無法得知當前應用版本號
- 建置時間資訊遺失
- 專業度受損

### 可能原因

1. Vite 環境變數注入配置錯誤
2. `__APP_VERSION__` 和 `__BUILD_TIME__` 變數未在 `vite.config.ts` 中定義
3. Footer 組件讀取變數的方式錯誤

### 修復建議

- 檢查 `vite.config.ts` 中的 `define` 配置
- 確保 `import.meta.env` 正確注入版本號和建置時間
- 使用 `package.json` 中的版本號作為來源

### 相關檔案

- `apps/ratewise/vite.config.ts` (環境變數定義)
- Footer 組件（需定位）
- `apps/ratewise/package.json` (版本號來源)

---

## 🟡 BUG-003: 版本檢測誤判觸發錯誤提示

### 問題描述

當前版本 `1.0.0` 與檢測到的「最新版本」`__APP_VERSION__`（未替換）比對，觸發「發現新版本」的錯誤提示彈窗。

### 錯誤訊息

```javascript
[INFO] New version detected {current: 1.0.0, latest: __APP_VERSION__}
[LOG] [PWA] Version mismatch detected via meta tag check
```

### 影響範圍

- 使用者看到不必要的「更新提示」彈窗
- 開發環境下持續干擾
- 版本比對邏輯失效

### 可能原因

1. Meta tag 中的版本號未正確注入
2. 版本比對邏輯未考慮開發環境
3. 與 BUG-002 為同一根源問題（環境變數注入）

### 修復建議

- 修復環境變數注入後，此問題應自動解決
- 增加開發環境檢測，跳過版本比對邏輯
- 使用 `import.meta.env.DEV` 判斷環境

### 相關檔案

- `apps/ratewise/src/components/UpdatePrompt.tsx:127`
- `apps/ratewise/index.html` (Meta tag 定義)
- `apps/ratewise/vite.config.ts`

---

## 🟠 BUG-004: 匯率數據顯示為 0.0000

### 問題描述

儘管 API 成功獲取匯率數據（Console 顯示「Exchange rates loaded」），但 UI 上所有貨幣在「常用貨幣」和「全部幣種」區塊均顯示為 `"0.0000"`。

### 實際 API 回應

```javascript
[INFO] Exchange rates loaded {currencies: 12, source: Taiwan Bank (臺灣銀行牌告匯率), updateTime: 2025/11/05 20:48:27}
```

### UI 顯示問題

- 常用貨幣：TWD, USD, JPY, KRW 均顯示 `0.0000`
- 全部幣種列表：所有 12 種貨幣均顯示 `0.0000`
- 轉換結果顯示正常（32.05 USD）

### 可能原因

1. 狀態管理問題：API 數據未正確傳遞至 UI 組件
2. 數據格式問題：匯率數據結構與 UI 預期不符
3. 渲染邏輯問題：組件未正確讀取匯率狀態

### 修復建議

- 檢查 `useCurrencyConverter` hook 的狀態管理
- 驗證匯率數據的傳遞鏈路
- 檢查 CurrencyCard 或類似組件的數據綁定邏輯

### 相關檔案

- `apps/ratewise/src/hooks/useCurrencyConverter.ts`
- 常用貨幣組件
- 全部幣種列表組件

---

## ⚠️ BUG-005: React Router 未來標誌警告

### 問題描述

React Router 拋出兩個未來標誌警告，提示需升級至 v7 相關配置。

### 警告訊息

```
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early.

⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early.
```

### 影響範圍

- 不影響當前功能
- v7 升級時可能引發破壞性變更
- 需提前適配

### 修復建議

- 在 Router 配置中增加 `future` 旗標：
  ```typescript
  <BrowserRouter future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }}>
  ```

### 相關檔案

- `apps/ratewise/src/main.tsx` 或 Router 配置檔案

---

## 🔍 BUG-006: TTFB 效能需優化

### 問題描述

首次位元組時間（TTFB）為 970ms，Web Vitals 評級為 `needs-improvement`（需改善），目標應 ≤ 600ms。

### 測量結果

```javascript
[INFO] ⚠️ Web Vital: TTFB {value: 970, rating: needs-improvement}
```

### 影響範圍

- 使用者感知載入速度較慢
- SEO 評分受影響
- Lighthouse Performance 分數下降

### 可能原因

1. 伺服器回應時間慢
2. 大量同步資源載入阻塞
3. CDN 配置未最佳化
4. HTML 檔案過大

### 修復建議

- 啟用 HTTP/2 Server Push
- 優化 CDN 快取策略
- 減少初始 HTML 大小
- 延遲載入非關鍵資源

### 優先級

低（不影響功能，屬效能優化項目）

---

## 🗓️ BUG-007: 歷史匯率數據缺失

### 問題描述

系統設計為載入 30 天歷史匯率資料，但實際只獲取到 22 天（2025-10-14 ~ 2025-11-05）。2025-10-13 及之前的資料返回 404。

### 錯誤訊息

```
[ERROR] Failed to load resource: the server responded with a status of 404 ()
@ https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2025-10-13.json

[INFO] Detected 22 days of historical data {service: exchangeRateHistoryService, startDate: 2025-10-14, endDate: 2025-11-05}
```

### 影響範圍

- 歷史匯率趨勢圖數據不完整
- 使用者無法查看 30 天完整趨勢
- 不影響即時匯率功能

### 可能原因

1. GitHub `data` 分支未包含 2025-10-13 之前的歷史資料
2. 資料收集機制尚未運行滿 30 天
3. 資料檔案命名或路徑錯誤

### 修復建議

- **短期**：調整前端邏輯，動態適配可用天數（已實作）
- **中期**：補齊缺失的歷史資料檔案
- **長期**：建立自動化歷史資料收集與備份機制

### 相關檔案

- `apps/ratewise/src/services/exchangeRateHistoryService.ts`
- GitHub `data` 分支：`public/rates/history/*.json`

---

## 🛠️ 修復優先級建議

### 第一優先（嚴重影響使用者體驗）

1. **BUG-002** + **BUG-003**: 版本號顯示與檢測（同一根源問題）
2. **BUG-004**: 匯率數據顯示為 0（核心功能失效）

### 第二優先（功能性問題）

3. **BUG-001**: PWA Service Worker 註冊失敗

### 第三優先（最佳化項目）

4. **BUG-005**: React Router 未來標誌警告
5. **BUG-006**: TTFB 效能優化
6. **BUG-007**: 歷史匯率資料補齊

---

## 📊 檢查環境資訊

### 伺服器資訊

- **開發伺服器**: Vite 6.4.0
- **端口**: http://localhost:4173
- **啟動時間**: 2137ms

### 應用資訊

- **當前版本**: 1.0.0
- **專案名稱**: RateWise
- **Monorepo**: pnpm workspace

### 瀏覽器 Console 統計

- **INFO**: 53 條
- **DEBUG**: 44 條
- **WARNING**: 3 條
- **ERROR**: 3 條（404 歷史資料）

---

## ✅ Linus 三問驗證

### 1. "這是個真問題還是臆想出來的？"

✅ **真問題** - 所有問題皆透過實際執行與瀏覽器檢查發現，有明確的錯誤訊息與視覺證據。

### 2. "有更簡單的方法嗎？"

- BUG-001: 開發環境跳過 Service Worker 最簡單
- BUG-002/003: 修復環境變數注入一次解決兩個問題
- BUG-004: 需深入排查數據流，無捷徑
- BUG-005: 簡單配置修改即可
- BUG-006/007: 屬優化項目，可延後處理

### 3. "會破壞什麼嗎？"

- 所有修復皆為 Bug Fix，向下相容
- BUG-005 增加未來旗標，確保 v7 升級順暢
- 無破壞性變更風險

---

## 📝 下一步行動

1. ✅ 已建立分支：`fix/bugs-20251105`
2. ⏸ 等待使用者確認開始 debug
3. 📋 建議修復順序：BUG-002/003 → BUG-004 → BUG-001 → BUG-005 → BUG-006/007

---

**最後更新**: 2025-11-05T21:11:08+08:00  
**文檔版本**: v1.0  
**狀態**: ✅ 已完成問題清單建立，待開始修復
