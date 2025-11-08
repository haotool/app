# 即時更新策略文檔

**版本**: 1.0.0  
**建立時間**: 2025-10-18  
**狀態**: ✅ 已完成並驗證

---

## 核心哲學：Linus KISS 原則

> "不要重複造輪子。如果現有的代碼已經正確運作，就不要修改它。"

本文檔記錄 RateWise 專案的即時更新策略，遵循 **Keep It Simple, Stupid** 原則，避免過度工程化。

---

## 一、即時匯率自動更新

### 1.1 SWR 自動輪詢機制

**檔案**: `apps/ratewise/src/features/ratewise/hooks/useExchangeRates.ts`

**實作細節**:

```typescript
// Line 92-96: 5 分鐘自動輪詢
useEffect(() => {
  const interval = setInterval(
    () => {
      if (!document.hidden) {
        mutate();
      }
    },
    5 * 60 * 1000,
  ); // 5 分鐘

  return () => clearInterval(interval);
}, [mutate]);

// Line 99-105: Page Visibility API
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      mutate();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [mutate]);
```

**特點**:

- ✅ 每 5 分鐘自動刷新（用戶無感知）
- ✅ 頁面隱藏時跳過刷新（節省資源）
- ✅ 用戶返回頁面時立即刷新
- ✅ SWR 內建快取與去重

**Context7 驗證**: [vercel/swr](https://context7.com/vercel/swr) - 官方推薦的自動重新驗證策略

---

### 1.2 記憶體快取策略

**檔案**: `apps/ratewise/src/services/exchangeRateHistoryService.ts`

```typescript
// Line 56: 快取時長
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘
```

**特點**:

- ✅ 避免重複請求
- ✅ 與 SWR 輪詢週期一致
- ✅ 記憶體快取，無需 localStorage

---

## 二、歷史匯率數據管理

### 2.1 GitHub Actions 自動化

**職責分離設計**（2025-10-18 優化）:

#### 工作流 1: 即時匯率更新

**檔案**: `.github/workflows/update-latest-rates.yml`

**執行頻率**: 每 30 分鐘

**職責**: 更新 `latest.json`（即時匯率）

**資料來源**: 台灣銀行 CSV API  
`https://rate.bot.com.tw/xrt/flcsv/0/day`

#### 工作流 2: 歷史匯率快照

**檔案**: `.github/workflows/update-historical-rates.yml`

**執行頻率**: 每日 0:00 UTC (台北時間 8:00)

**職責**: 複製 `latest.json` 到 `history/YYYY-MM-DD.json`

**資料結構**:

```
public/rates/
├── latest.json          # 最新匯率（即時更新）
└── history/
    ├── 2025-10-18.json  # 每日歷史快照
    ├── 2025-10-17.json
    └── ...              # 永久保存
```

**優點**（職責分離設計）:

- ✅ **單一職責**: 每個工作流只做一件事
- ✅ **減少浪費**: 歷史快照不需要每 30 分鐘檢查
- ✅ **清晰日誌**: 即時更新和歷史快照分開記錄
- ✅ **易於 debug**: 問題定位更快速
- ✅ **完全自動化**: 無需人工介入
- ✅ **獨立 data 分支**: main 分支保持乾淨
- ✅ **jsDelivr CDN**: 全球快取加速
- ✅ **永久保存**: 所有歷史數據不清理

---

### 2.2 CDN 分發策略

**主要 CDN**: jsDelivr  
**備援 CDN**: GitHub Raw

**URL 格式**:

```
# 最新匯率
https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json

# 歷史匯率
https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/YYYY-MM-DD.json
```

**特點**:

- ✅ 全球 CDN 加速
- ✅ 自動快取管理
- ✅ 雙重備援機制
- ✅ 免費且穩定

---

## 三、PWA 背景更新

### 3.1 Service Worker 策略

**檔案**: `apps/ratewise/public/sw.js`

**快取策略**:

```javascript
// NetworkFirst: API 請求（優先網路）
if (url.includes('/rates/')) {
  return networkFirst(event);
}

// CacheFirst: Google Fonts（優先快取）
if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
  return cacheFirst(event);
}

// StaleWhileRevalidate: 其他資源（快取優先，背景更新）
return staleWhileRevalidate(event);
```

**自動更新機制**:

**檔案**: `apps/ratewise/vite.config.ts`

```typescript
VitePWA({
  registerType: 'autoUpdate', // 自動更新
  devOptions: { enabled: true },
  workbox: {
    clientsClaim: true,
    skipWaiting: true,
  },
});
```

**特點**:

- ✅ 自動檢測新版本
- ✅ 背景靜默更新
- ✅ 無需用戶手動刷新
- ✅ 匯率數據優先使用最新網路資料

---

### 3.2 用戶體驗優化

**無刷新更新流程**:

1. **用戶開啟 App** → SWR 立即獲取最新匯率
2. **5 分鐘後** → SWR 自動背景刷新
3. **用戶切換分頁返回** → Page Visibility API 觸發刷新
4. **Service Worker** → 背景更新 App 版本（無感知）

**結果**: 用戶永遠看到最新數據，無需手動刷新

---

## 四、最佳實踐驗證

### 4.1 Linus 三問驗證

**1. "這是個真問題還是臆想出來的？"**

✅ **真問題**:

- 用戶需要即時匯率（真實需求）
- 歷史數據用於趨勢分析（真實需求）
- PWA 背景更新提升用戶體驗（真實需求）

**2. "有更簡單的方法嗎？"**

✅ **已是最簡方案**:

- SWR 內建輪詢（無需自己實作 WebSocket）
- GitHub Actions + jsDelivr（無需自建伺服器）
- Service Worker autoUpdate（無需手動提示）

**3. "會破壞什麼嗎？"**

✅ **零破壞性**:

- 不修改現有 API
- 不破壞現有快取
- 向後相容

---

### 4.2 瀏覽器測試結果

**測試環境**: Playwright MCP  
**測試時間**: 2025-10-18  
**測試 URL**: http://localhost:4177

**測試結果**:

✅ **功能正常**:

- 即時匯率載入成功（12 種貨幣）
- 數據時間戳正確（2025/10/18 02:25:56）
- 單幣別換算功能正常
- 多幣別列表顯示正常
- 趨勢圖載入正常

✅ **Console 無錯誤**:

- 無 JavaScript 錯誤
- 無 React 錯誤
- 404 錯誤僅為歷史數據（debug level，預期行為）

✅ **PWA 功能**:

- Service Worker 註冊成功
- 快取策略正常運作
- 離線支援正常

---

## 五、技術債務評估

### 5.1 已完成項目

- ✅ 移除 25 天清理邏輯（永久保存）
- ✅ 驗證綠色狀態指示器已移除
- ✅ 確認 SWR 5 分鐘輪詢正常
- ✅ 確認 Service Worker autoUpdate 正常
- ✅ 瀏覽器測試通過

### 5.2 無需修改項目

- ✅ SWR 更新機制（已完美運作）
- ✅ Service Worker 快取策略（已符合最佳實踐）
- ✅ GitHub Actions 工作流（已自動化）

### 5.3 已知限制

- ⚠️ 歷史數據 404 錯誤（預期行為，隨時間累積）
- ⚠️ 台銀無直接歷史 CSV API（使用每日快照替代）

---

## 六、維護指南

### 6.1 監控指標

**GitHub Actions**:

- 檢查每 30 分鐘執行狀態
- 確認 `data` 分支提交正常

**jsDelivr CDN**:

- 監控 CDN 回應時間（應 < 500ms）
- 確認快取更新正常（1-5 分鐘延遲）

**SWR 輪詢**:

- 確認 5 分鐘輪詢正常
- 監控 API 請求頻率

### 6.2 故障排除

**問題 1**: 匯率未更新

```bash
# 檢查 GitHub Actions 狀態
gh workflow view "Update Exchange Rates with History"

# 手動觸發
gh workflow run "Update Exchange Rates with History"
```

**問題 2**: CDN 快取過期

```bash
# 清除 jsDelivr 快取
curl -X PURGE https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
```

**問題 3**: Service Worker 未更新

```javascript
// 開發者工具 Console
navigator.serviceWorker.getRegistrations().then((regs) => {
  regs.forEach((reg) => reg.unregister());
});
location.reload();
```

---

## 七、參考資料

### 7.1 官方文檔

- [SWR - Auto Revalidation](https://swr.vercel.app/docs/revalidation) [context7:vercel/swr:2025-10-18]
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)

### 7.2 台灣銀行 API

- 即時匯率 CSV: `https://rate.bot.com.tw/xrt/flcsv/0/day`
- 歷史匯率頁面: `https://rate.bot.com.tw/xrt/history?Lang=zh-TW`

### 7.3 相關文檔

- `docs/HISTORICAL_RATES_IMPLEMENTATION.md` - 歷史匯率實作指南
- `docs/PWA_IMPLEMENTATION.md` - PWA 實作指南
- `.github/workflows/update-exchange-rates-historical.yml` - 自動化工作流

---

## 八、總結

本專案的即時更新策略遵循 Linus KISS 原則：

1. **不重複造輪子**: 使用 SWR 內建功能，而非自己實作 WebSocket
2. **簡單有效**: GitHub Actions + jsDelivr，無需自建伺服器
3. **零破壞性**: 所有更新都是增量式，不破壞現有功能
4. **用戶無感知**: 自動背景更新，無需手動刷新

**核心信念**: "如果代碼已經正確運作，就不要修改它。"

---

**最後更新**: 2025-10-18  
**驗證狀態**: ✅ 已通過瀏覽器 MCP 測試  
**維護者**: RateWise Team
