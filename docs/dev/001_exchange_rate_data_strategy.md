# 001 匯率資料更新與版本自動化整備

**版本**: 1.0.0  
**建立時間**: 2025-10-31T03:06:28+0800  
**更新時間**: 2025-10-31T03:06:28+0800  
**狀態**: ✅ 已完成並驗證

---

## 背景

- ultrathink 討論後確認主問題：匯率數據在前端背景刷新、CI data 分支供數據、趨勢圖期間限制與版本標籤流程皆需重新檢視。
- 依據 `LINUS_GUIDE.md` 的 KISS 準則，優先解決實際問題並避免過度設計。

---

## 決策摘要

- **背景匯率刷新確認**  
  檢閱 `apps/ratewise/src/features/ratewise/hooks/useExchangeRates.ts`，5 分鐘輪詢 + Page Visibility API 已防止背景耗電，未發現邏輯缺陷。保留設計並在本文檔記錄檢查結果。

- **data 分支管道驗證**  
  `update-latest-rates.yml` 與 `update-historical-rates.yml` 皆以 data 分支為唯一來源，確保 GitHub Actions 每 30 分鐘/每日產生最新與歷史檔案。實測 `raw.githubusercontent.com/haotool/app/data/...` 端點可即時取得資料。

- **趨勢圖 25 天 + 即時合併**
  - `SingleConverter.tsx` 透過 `fetchHistoricalRatesRange(25)` 取回前 25 天資料，再追加 `fetchLatestRates()` 當日最新數據，並限制圖表最多保留 25 筆。
  - 目的：保留完整歷史資料，同時確保今日即時值由 CI 最新 `latest.json` 提供。

- **版本標籤流程修復**
  - 移除 `auto-tag.yml`，改由 `release.yml` 在版本變更時執行 `pnpm changeset tag` + 自訂 `ratewise-v{version}` 標籤，並建立 GitHub Release。
  - `.changeset/config.json` 將 `privatePackages.tag` 設為 `true`，允許為私有套件產生標籤。
  - 參考 Changesets 官方建議流程 [context7:changesets/action:2025-10-30T19:04:00Z]、[context7:changesets/changesets:2025-10-30T19:04:30Z]。

---

## 實作重點

- `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
  - 新增 `MAX_TREND_DAYS = 30`。
  - 以 `Promise.all` 並行載入歷史與最新匯率，去除重複日期後限制 30 筆。
  - 允許缺失資料時優雅降級（回傳空陣列）。

- `apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.integration.test.tsx`
  - 增補 `fetchLatestRates` 模擬與相關斷言，確保趨勢圖邏輯覆蓋 25 天與今日合併情境。

- `.changeset/config.json`
  - `privatePackages.tag: true`，確保 `changeset tag` 會產生 `@app/ratewise@x.y.z`。

- `.github/workflows/release.yml`
  - 新增版本差異偵測、`changeset tag`、雙標籤推送與 `actions/create-release`。
  - 為避免重複推送，僅在版本變更時觸發。

- 刪除 `.github/workflows/auto-tag.yml` 以避免與新版流程衝突。

---

## 驗證

- `pnpm --filter @app/ratewise test SingleConverter`（局部 Vitest）✅
- 手動 `curl` 檢查 `latest.json` 與 `history/{date}.json`，確認 data 分支檔案可即時取得。

---

## 待辦 / 風險

- 需持續建立 Changeset 檔案，否則版本號不會提升、標籤不會產生。
- `fetchLatestRates()` 目前僅用於趨勢圖，未來可將 30 分鐘更新資訊同步呈現在 UI。
- GitHub Release 內容目前為固定字串，可考慮整合自動 changelog。

---

## 相關檔案

- `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
- `apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.integration.test.tsx`
- `.changeset/config.json`
- `.github/workflows/release.yml`
