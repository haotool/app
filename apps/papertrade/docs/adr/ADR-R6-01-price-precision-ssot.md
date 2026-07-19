# ADR-R6-01：全站價格精度 SSOT（tick size 驅動）

- 狀態：Accepted
- 日期：2026-07-19
- 範圍：`lib/priceScale.ts`（新增）、`lib/format.ts`、`services/instruments.ts`（新增）、
  `services/marketFeed.ts`、`components/CandleChart.tsx` 與全部價格顯示消費點

## 背景

舊 `lib/format.ts` 的 `decimalsForPrice(value)` 依數值量級猜精度（純看 `Math.abs(value)`
落哪個區間），而 K 線圖表的 `CandlestickSeries` 完全未設定 `priceFormat`（沿用套件預設
`precision: 2, minMove: 0.01`）。兩者都不知道「這是哪個 symbol」，造成：

- 軸與文字顯示精度不一致：PPR 現價 0.0085 級時，K 線軸取整到 0.01（軸上所有檔位擠成同值），
  文字顯示則依量級落在 6 位，彼此漂移。
- 對小數幣不準確：精度應由交易所的最小跳動單位（tickSize）決定，與當下價格量級無關；
  BTC 在 64,000 與 120,000 都是 0.1 tick，量級推斷卻可能翻位。
- design SSOT 明令「禁止硬編碼」「全站一致」，量級猜測式屬隱性硬編碼。

## 決策

1. 新增 `lib/priceScale.ts` 為精度 SSOT：`tickSizeFor(symbol)`／`pricePrecisionFor(symbol)`／
   `priceFormatFor(symbol)`（lightweight-charts `{ type: 'price', precision, minMove }`）。
2. tickSize 來源鏈（優先序由高至低）：
   - PPR：`features/ppr/config.ts` 宣告 `PPR_TICK_SIZE = 0.00001`（`isPprSymbol` 分支，
     永不受 live 值污染）。
   - live 覆蓋：啟動時 `services/instruments.ts` 抓 Bybit
     `GET /v5/market/instruments-info?category=linear&limit=1000`（zod 寬鬆解析、失敗靜默，
     fire-and-forget 不阻塞 WS 訂閱）。
   - 靜態 fallback 表（vendored 現值）；最終 0.01 兜底。
3. 精度反推公式：`-log10(tick)` 冪次值容忍浮點誤差取最近整數；非冪次 tick（如 0.5）取
   `-floor(log10(tick))` 下一位小數；下限 0。
4. `formatPrice(value, symbol)` 簽名改必填 symbol：編譯器強制抓出全部呼叫點，
   遷移完成後刪除 `decimalsForPrice`（不留雙 SSOT）。
5. `CandleChart` 新增必填 `symbol` prop：蠟燭 series 建立時設定 `priceFormat`；symbol 切換
   走 ChartPage `key={symbol}` 全量重掛載，不需動態 applyOptions。MACD 副圖 DIF/DEA 沿用同
   priceFormat（Wave-3 報告缺口），HIST 維持 volume 型格式。
6. 價格輸入回填的獨立精度假設（限價快捷鈕、TP/SL 價格模式回填、平倉限價 placeholder 的
   硬編碼 6 位）一併改 `pricePrecisionFor(symbol)`。

## 依據

- Bybit V5 API《Get Instruments Info》：`result.list[].symbol`、
  `result.list[].priceFilter.tickSize`（string）——
  <https://bybit-exchange.github.io/docs/v5/market/instrument>（2026-07-19 查證）。
  端點預設回 500 筆、上限 1000；本案取 `limit=1000` 單請求不分頁，未涵蓋 symbol 由靜態表兜底。
- lightweight-charts series `priceFormat`：`{ type: 'price', precision, minMove }` 控制軸
  與 crosshair 顯示精度。

## 後果

- `formatPrice` 為 breaking signature change，但由 compile-time 強制遷移，無殘留呼叫點
  （`rg "decimalsForPrice" src` 零命中）。
- 驗收：PPR 0.0085 級全站（K 線軸、訂單簿、下單表單、持倉卡、圖表 header）一致 5 位小數
  不取整；BTC 維持 1 位（tick 0.1）。
- instruments-info 與既有行情同域 `https://api.bybit.com`（security SSOT 第 12 條已核准），
  CSP 不需變更。
