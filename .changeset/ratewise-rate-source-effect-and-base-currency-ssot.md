---
'@app/ratewise': patch
---

延續 PR378 SSOT 收斂，三項內部架構整理與一項使用者可感知的持久化修正：

- **rateSource auto-fallback 收斂**：`RateWise.tsx` 與 `MultiConverter.tsx` 過去各自持有「換錢所→銀行」回退 effect，預測式不一致；改由 `useCurrencyConverter` 提供唯一 mode-aware fallback effect，並修正 `effectiveRateSource` 寫死 `mode: 'single'` 的 bug，讓多幣別模式也走相同 derived state 路徑。
- **baseCurrency 收進 store SSOT**：把多幣別頁的基準貨幣從 hook local state 收進 `converterStore`（與 `partialize`、`__validateAndSanitize` 同步），使用者切換的 base currency 重新整理或重啟 PWA 後不再 reset 為 TWD。新增 3 個 store 單元測試守住 setBaseCurrency 與單/多幣別欄位隔離不變式。
- **state.mode dead state 清理**：`mode` 欄位、`setMode` action 與 MultiConverter 的 `setMode('multi')` mount effect 全數移除——頁面 mode 由 route 決定（route 即 SSOT），不再雙寫。`removeLegacyKeys` 仍清掉舊版 `currencyConverterMode` localStorage。

行為相容：除了 baseCurrency 持久化的小幅 UX 改善外，UI 行為與既有快照／測試完全一致。
