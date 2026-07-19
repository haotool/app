# ADR-R6-02：全倉（cross）保證金模式簡化模型

- 狀態：Accepted
- 日期：2026-07-19
- 範圍：`engine/{types,math,engine,execution}.ts`、`stores/tradeStore.ts`（persist v4）、
  `pages/TradePage.tsx`（模式切換）、`components/trade/{OrderForm,PositionCard}.tsx`

## 背景

R6 需求引入全倉保證金模式。既有引擎為純逐倉架構：`Account.balance` 語意＝「錢包現金，
已扣除全部持倉 IM 與掛單凍結」；`liquidationPrice(side, entry, leverage)` 為單倉封閉公式，
不看帳戶其餘資金；`processTick` 每次僅收單一 symbol 的 mark。

模式語義採 **per-position 快照制**：開倉當下的表單選定值寫入 `Position.marginMode`，
之後不可轉換；與真實交易所（Bybit 為 per-symbol、可雙向轉換）存在簡化偏差。
同 symbol 同向加倉沿用既有持倉模式（與既有「加倉沿用 TP/SL」裁決一致），
不允許加倉時切換模式，避免合併倉語意混亂。

## 決策（公式）

以本專案欄位名表述（RS-A 查證 Bybit UTA 官方文檔後由 PM 換算核定）：

```
crossIM        = Σ(cross 持倉.margin)
crossUpnl      = Σ(cross 持倉 uPnL，各自 symbol 當前 mark，全額計入不夾 min(0,·))
crossAvailable = balance + crossUpnl                    （顯示與開倉資金檢查用）
crossMarginBalance = balance + crossIM + crossUpnl     （聚合強平判定用）
crossMM        = Σ(cross 持倉：qty × mark × effectiveMaintenanceMarginRate(leverage))
聚合強平觸發   ：crossMarginBalance ≤ crossMM
```

- `effectiveMaintenanceMarginRate(leverage) = min(0.005, 0.5/leverage)`（ADR-R5-03，
  全模式共用不變）。
- 觸發後逐一強平 **uPnL 最小（最虧）** 的 cross 持倉一筆（`closeSlice(..., 'liquidation')`，
  損失＝該倉保證金），重算 `crossMarginBalance`／`crossMM`，重複直到恢復（>）或 cross 持倉全平。
- 任一 cross 持倉的 symbol 缺 mark 時整輪略過，不以殘缺行情誤判。
- 單倉估算強平價（僅 UI 顯示，非真實觸發）：

```
MM_this  = 該倉 qty × mark × effectiveMMR(leverage)
buffer   = crossMarginBalance − MM_this
refPrice = 該倉現時 uPnL ≥ 0 ? entryPrice : mark
long ：liqPriceEst = refPrice − buffer/qty （結果 ≤ 0 → 無意義，顯示 --）
short：liqPriceEst = refPrice + buffer/qty
```

- 開倉資金檢查（`openMarket`／`placeLimitOrder`）改以 `crossAvailableBalance` 為上限：
  cross 未實現虧損即時扣減可用、未實現盈利可作開倉依據（現金可暫為負）；
  無 cross 持倉時恆等於裸 `balance`，逐倉行為零回歸。

## 手算範例（已寫成單元測試）

balance=10000，開 BTC long cross qty=0.1 entry=60000 leverage=10x
（IM=600、fee=3.3，開倉後 balance=9396.7）。mark 漲到 61000：

- uPnL=100；crossIM=600；crossUpnl=100；crossAvailable=9496.7
- MM_this=0.1×61000×0.005=30.5；crossMarginBalance=9396.7+600+100=10096.7（遠高於 MM，不觸發）
- buffer=10096.7−30.5=10066.2；uPnL≥0 用 entry：60000−10066.2/0.1=負值 → 顯示 `--`
  （帳戶餘額遠大於這筆小倉位，合理結果）

## 依據（RS-A 查證出處）

- Bybit UTA Wallet Balance API：<https://bybit-exchange.github.io/docs/v5/account/wallet-balance>
- Bybit UTA FAQ：<https://www.bybit.com/en/help-center/article/FAQ-Unified-Trading-Account>
- Bybit 強平價說明：<https://www.bybitglobal.com/en/help-center/article/?id=000001067>

## 簡化聲明

- 單倉估算強平價僅供參考（假設其他倉靜態、以 buffer 線性外推）；真實觸發一律為聚合 MM 檢查。
- 強平以「損失該倉保證金」結算（沿用引擎既有 liquidation 語意），未模擬穿倉扣減現金與
  保險基金；教育模擬用途下以逐倉一致的帳本規則換取可驗證性。
- 未模擬真所的風險限額梯度（MMR 檔位）與 per-symbol 模式轉換。

## 後果

- isolated 路徑零改動：`processTick` 單倉強平僅對 `marginMode === 'isolated'` 執行；
  cross 由 store 層在 `processTick` 後追加 `evaluateCrossMargin` 聚合評估。
- TP/SL/trailing/限價成交對兩模式一視同仁（持倉自身條件，不涉帳戶聚合）。
- persist v3→v4：舊持倉／掛單無損補 `marginMode: 'isolated'`。
