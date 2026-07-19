# ADR-R6-04：引擎價格源一致性與標記價觀察面

- 狀態：Accepted
- 日期：2026-07-19
- 範圍：`stores/marketStore.ts`（`markRevision`）、`components/trade/PositionCard.tsx`（uPnL/ROE flash 與標記價 caption）；引擎觸發語意零改動

## 背景

R6-4 症狀回報：1000x 高槓桿下 uPnL／保證金率／強平觸發「疑似延遲」。初始假說為引擎以
`ticker.markPrice` 觸發，而 Bybit tickers delta 的 `markPrice` 更新節奏系統性慢於 `lastPrice`。

RS-D tracer 以直連 Bybit WS 抽樣（BTCUSDT，90s／120s）與靜態鏈路分析
（WS→`patchTicker`→`applyTick`→render）查證後，證據不支持初始假說：

- mark 推送頻率並非系統性慢於 last；Bybit delta 缺欄位＝該欄未變，mark 與 last 常分屬不同訊息。
- 真根因是**價格來源分叉＋UI 無對應可視化**：header／訂單簿的 `PriceFlash` 以 `lastPrice`
  的 `revision` 驅動閃爍，而持倉卡 uPnL 讀 `markPrice` 卻是純文字——last 跳動頻繁、mark 靜默更新，
  1000x 強平緩衝僅 ~0.05%，使用者看見「價格在動、損益沒動」的錯位感被高槓桿放大成「延遲」體感。

## 決策

1. **維持 `markPrice` 為引擎／強平觸發的單一 SSOT，不改用 `lastPrice`。**
   `applyTick`／`processTick` 的觸發語意零改動。
2. `MarketTicker` 新增 `markRevision`：與既有 `revision`（lastPrice）同構、獨立計數，
   僅 `markPrice` 變化時遞增（`setTicker`／`patchTicker` 兩路皆判）。
3. 持倉卡 uPnL／ROE 改以 `PriceFlash` 包裝並以 `markRevision` 驅動，色相隨損益方向；
   uPnL 旁新增「標記價 {value}」caption，讓使用者直接對照強平依據的數值。

## 論證

- 觸發價改 last 只換得虛假流暢感：mark 為交易所強平與資金費率的官方依據
  （Bybit 亦以 mark price 觸發強平），模擬器改用 last 反而偏離教育目標。
- mark/last 分叉在 1000x 下被放大屬真實交易所行為；如實呈現（並讓 mark 的變動「可見」）
  比掩蓋分叉更有教育價值。
- 觀察面修法不動任何交易語意：回歸風險為零，`markRevision` 有獨立單元測試鎖定
  「僅 last 變化不遞增／mark 真變化才遞增」。

## 後果

- 持倉卡數字每次因 mark 變動刷新時有一次 flash，與 header last 的 flash 節奏可能不同步——
  這是兩個價格源的真實節奏差，屬預期行為。
- 後續若引入 mark/last 混合觸發（不在 R6 範圍），本 ADR 需重新裁決。
