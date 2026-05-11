---
'@app/ratewise': patch
---

轉換歷史紀錄收斂為 store SSOT：每筆寫入帶 `schemaVersion=2` 與 `rateType` / `sourceKind` / `providerId` / `providerSelectionMode` 欄位，`useCurrencyConverter.addToHistory` 統一改用 store action（不再寫舊版 `conversionHistory` 個別 key）；舊資料於 hydrate 時遷移到 store 並保留 legacy 欄位（不偽造 sourceKind/providerId）。歷史上限由 hook 的 10 筆放寬到 store 的 50 筆，UI 行為不變。
