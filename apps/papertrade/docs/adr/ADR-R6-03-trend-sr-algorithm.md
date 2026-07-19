# ADR-R6-03：趨勢線與大支撐大阻力演算法選型

- 狀態：Accepted
- 日期：2026-07-19
- 範圍：`lib/chartAnalysis.ts`、`components/CandleChart.tsx`、`pages/ChartPage.tsx`

## 背景

R6-6 需求為圖表自動疊加趨勢線與「大支撐大阻力」價位。Wave-0 調研（RS-B，
`.claude/epics/papertrade/r6-research.md`）比較四類方案：swing high/low（fractal）、
pivot points（floor trader）、線性回歸通道、S/R 價位聚類。

## 決策

- **pivot 偵測**：標準 fractal——中心 K 棒 high／low 嚴格高／低於左右各 5 根鄰棒，
  `rightBars` 根後確認即不再重繪。理由：O(n) 複雜度、無參數擬合、確認後穩定
  （R6-5 增量更新可安全跳過已確認區段）。
- **趨勢線**：取最近兩個已確認同型 pivot 為錨點（lows→支撐線、highs→壓力線），
  線性外推至最新 bar 作第三點。捨棄線性回歸通道：回歸線隨每 tick 漂移，違反
  「確認後不重繪」的順暢度契約。
- **大支撐大阻力**：pivot 價位聚類，容差 `0.3 × ATR(14)`；觸碰數 ≥ 2 的群按觸碰數
  （tie 以新近度）取前 4 檔，畫水平 priceLine。理由：觸碰數即「大」的量化依據，
  ATR 容差自適應各 symbol 波動幅度，免每幣調參。
- **不做**：手動畫線編輯器、對數座標擬合、多時間框架共振（R6 明確不做範圍）。

## 後果

- 全部純函式落 `lib/chartAnalysis.ts`，已知序列單元測試鎖行為。
- `analyzeChart` 以 bar 數為 memo 鍵：pivot 於確認後不變，最新 tick 不重跑 O(n) 掃描。
- 疊加渲染由 `CandleChart` 以 LineSeries（虛線）＋ createPriceLine 實作，
  toggle 關閉即移除 series 與 priceLine。
