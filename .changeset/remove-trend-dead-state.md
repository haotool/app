---
'@app/ratewise': patch
---

移除 trend dead state 與 generateTrends no-op

- 刪除 `seedTrends`、`const [trend]`、`generateTrends` useCallback 及其在 effect 中的呼叫
- 移除 `TrendDirection`、`TrendState` 型別定義（`types.ts`）
- 清理 `FavoritesList`、`CurrencyList`、`RateWise`、`Favorites` 頁面中所有 trend prop 與趨勢圖示
- 移除 `CurrencyList` 的重新整理趨勢按鈕（no-op 入口）
- 同步更新 `CurrencyList.test.tsx`：移除 trend/refresh 相關測試與 props
