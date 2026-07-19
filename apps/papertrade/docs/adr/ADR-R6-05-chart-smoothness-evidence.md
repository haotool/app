# ADR-R6-05：K 線順暢度量測證據與增量更新契約

- 狀態：Accepted
- 日期：2026-07-19
- 範圍：`components/CandleChart.tsx`、`lib/indicators.ts`、`lib/chartAnalysis.ts`、`pages/ChartPage.tsx`

## 背景

R6-7（MACD 副圖＋背離）與 R6-6（趨勢線＋支撐阻力）為圖表新增多條 series 與 O(n) 分析計算。
R6-5 要求先量測後優化：確認新增計算不把 tick 更新推入 >16ms 長任務，並保住 R5-4 快取行為。

## 量測方法

Vitest ＋ `performance.now()` 包裝純函式與元件重渲路徑（lib 層量測，圖表庫 mock）。
資料：1000 根合成 K 線（LCG 決定性隨機走勢）、MA/EMA 五線全開、MACD／趨勢線／支撐阻力全開。

## 量測數據（Apple Silicon、jsdom、單位 ms）

| 路徑                                                         | avg   | p50   | p95   | max   | >16ms |
| ------------------------------------------------------------ | ----- | ----- | ----- | ----- | ----- |
| TF 切換全量計算（K 線+成交量 map、5 指標線、MACD、analysis） | 0.664 | 0.364 | 2.388 | 3.579 | 0     |
| 100 tick／基線：每 tick 全量 analysis（無鍵控）              | 0.343 | 0.225 | 0.724 | 2.268 | 0     |
| 100 tick／現行：analysis 以 bars.length 鍵控 skip            | 0.277 | 0.149 | 0.630 | 2.692 | 0     |
| 新 bar 收線（MACD＋analysis 全量，每根一次）                 | 0.162 | 0.095 | 0.764 | 0.796 | 0     |
| 元件層 100 tick 重渲（React＋memo＋effects＋series 寫入）    | 1.686 | 1.177 | 5.744 | 8.951 | 0     |

## 決策

1. **analysis memo 鍵在 `seriesKey` ＋ `bars.length`**：pivot 於 rightBars 根後確認即不再變動、
   pivot 位置的 DIF 不受末根跳動影響，tick（參照變、長度不變）不重跑 O(n) pivot 掃描。
   對照基線 p50 由 0.225ms 降至 0.149ms（−34%），並使背離／趨勢線／S/R 的 extras effect 於 tick 幀完全跳過。
2. **MACD 每 tick 重算但寫入走增量**：computeMacd 為 O(n) 輕量（三段 EMA），tick 幀對
   DIF/DEA/HIST 三條 series 僅 `.update()` 末點，禁全量 `setData`（與既有 K 線/指標線同一契約）。
3. **不引入 rAF 節流**：兩種變體 100 tick 均 0 次 >16ms 長任務（max 8.951ms 含 React 重渲），
   無證據支撐額外複雜度；若未來 bars 上限或 series 數量大增再重新量測。
4. **ticker 訂閱粒度複查（唯讀）**：ChartPage 內僅 `SymbolHeader` 與 OrderBookPanel 的中間價列
   訂閱 `tickers[symbol]`，後者已隔離為獨立子元件且消費 lastPrice/direction/revision（同 tick 更新），
   無不必要整 ticker 訂閱，不動。

## 回歸守護

- R5-4 快取行為（TF 二次切換零 skeleton、背景 revalidate 恰一次）：`useKlines.test.ts` 保持綠。
- 增量路徑與鍵控行為：`CandleChart.test.tsx` 以 series stub 斷言 tick 幀零 `setData`、
  bars 參照變而長度不變時 analysis 不重算（markers／趨勢線／priceLine 呼叫次數不增）。
