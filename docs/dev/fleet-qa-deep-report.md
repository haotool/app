# RateWise 深度 QA 報告（fleet-qa-deep）

- 日期：2026-07-06
- 範圍：`apps/ratewise` 核心功能（匯率計算、金額輸入邊界、收藏/歷史、PWA、防呆）
- 分支：`qa/fleet-deep-qa`（獨立 worktree，未 commit，交由 PM review）
- 方法：靜態審查 + vitest 回歸（先紅後綠）
- 驗證：`pnpm typecheck` 全綠；`pnpm vitest run` 178 檔 4023 tests 全綠（新增 12 個回歸測試）

## 總結

| #   | 檢查點                   | 結論  | 摘要                                                   |
| --- | ------------------------ | ----- | ------------------------------------------------------ |
| 1   | 三種 rate mode 買賣方向  | PASS  | auto/sell/mid 方向與台銀牌告語意一致                   |
| 2   | 四捨五入與 decimals 邊界 | PASS  | `toFixed(decimals)` 依 `CURRENCY_DEFINITIONS` SSOT     |
| 3   | 零值金額顯示佔位字串     | FIXED | `'0'.padEnd(decimals+2,'0')` 產生 `"0000"`/`"00"` 亂碼 |
| 4   | sell=0 / NaN 匯率穿透    | FIXED | 無效匯率值未走 fallback，availability 判斷不一致       |
| 5   | 畸形 details 崩潰風險    | FIXED | `hasOnlyOneRateType` 非 optional 存取 `d.spot.sell`    |
| 6   | 極大金額、清空、swap     | PASS  | 計算機上限 MAX_SAFE_INTEGER；清空/swap 狀態一致        |
| 7   | 收藏排序與歷史記錄       | PASS  | TWD 置頂→收藏→字母；歷史上限 50、7 天過期              |
| 8   | localStorage 持久化      | PASS  | Zustand persist + legacy 遷移 + hydrate sanitize       |
| 9   | PWA offline fallback     | PASS  | precache + 三層兜底鏈 + iOS eviction 修復              |
| 10  | SW SKIP_WAITING 協定     | PASS  | prompt 模式三處聯動正確、離線防護到位                  |

## 檢查點詳情

### 1. 匯率計算正確性 — 三種 rate mode（PASS）

台銀牌告語意（銀行賣出 = 用戶買外幣）驗證：

- `auto` 模式（客戶視角）：FROM 外幣用買入價（客戶賣外幣給銀行）、TO 外幣用賣出價（客戶向銀行買外幣）。
  證據：`apps/ratewise/src/utils/exchangeRateCalculation.ts:364-378`（`getRateFrom` 用 `getBuyRate`、`getRateTo` 用 `getExchangeRate`=sell）。
- `sell` 模式：雙向皆用台銀賣出牌告，委派 `convertCurrencyAmount`（`exchangeRateCalculation.ts:352-361`）。
- `mid` 模式：`(buy+sell)/2`（`exchangeRateCalculation.ts:303-319`），單側缺失以可用側為準。
- 方向不變量：USD→JPY 的 JPY 數量 `auto < sell < mid`，既有測試已覆蓋
  （`src/utils/__tests__/exchangeRateCalculation.test.ts:557-588`）。
- 換錢所（MoneyBox）方向：TWD→KRW 用 `rate.sell`、KRW→TWD 用 `1/rate.buy`
  （`src/services/moneyboxRateService.ts:347-359`），hook 測試已覆蓋正反解。
- 反向求解（編輯 to 欄）：`calculateToAmount` 用 `amount / unitRate` 與正向同一報價，無雙重價差
  （`src/features/ratewise/hooks/useCurrencyConverter.ts:377-390`）。

### 2. 四捨五入與 decimals 邊界（PASS）

- 各幣別小數位以 `CURRENCY_DEFINITIONS` 為 SSOT（`src/features/ratewise/constants.ts:21-43`；JPY/KRW/VND/IDR = 0 位）。
- 顯示層 `formatCurrency`/`formatExchangeRate` 對 NaN/Infinity 均有防呆（`src/utils/currencyFormatter.ts:25-69`）。
- 計算機輸入上限 `Number.MAX_SAFE_INTEGER`（16 位）+ 8 位小數（`src/features/calculator/utils/validator.ts:268-298`），
  最壞情況 9e15 / 最小匯率仍 < 1e21，`toFixed` 不會落入科學記號。

### 3. 零值金額顯示佔位字串（FIXED）

- 問題：`converted` 為 0（輸入 0 或匯率缺失）時，fallback 佔位字串寫成
  `'0'.padEnd(decimals + 2, '0')` → 2 位小數幣別得 `"0000"`、0 位小數幣別得 `"00"`。
  雖然 `formatAmountDisplay` 在主輸入框會重新 parse 掩蓋，但原始字串直接流入
  歷史記錄 `result` 欄（`useCurrencyConverter.ts:522-539`）與剪貼簿複製
  （`src/utils/clipboard.ts:52-54` 直接輸出 `entry.result`），用戶會複製到 `100 USD = 0000 TWD`。
- 根因：佔位字串意圖是 `"0.00"`，`padEnd` 語意寫錯。
- 修復：改為 `(0).toFixed(decimals)`（`src/features/ratewise/hooks/useCurrencyConverter.ts:375,389`）。
- 回歸測試（先紅後綠）：`src/features/ratewise/hooks/__tests__/useCurrencyConverter.test.tsx`
  「零值與缺匯率時的金額顯示（#zero-placeholder 回歸）」4 案例
  （USD→TWD 輸入 0、TWD→JPY 輸入 0、目標欄輸入 0、匯率缺失輸入 100）。

### 4. sell=0 / NaN 匯率穿透（FIXED）

- 問題：`getExchangeRate` 只檢查 `rate == null`，`sell = 0` 或 `NaN` 會被當有效匯率直接回傳，
  不走 spot↔cash fallback；且與 `getBuyRate`（排除 0）、`hasOnlyOneRateType`（排除 0）行為不一致。
  `getCurrencyRateTypeAvailability` 同樣把 sell=0 判為「可用」，導致 rate type 切換 UI 與實際換算矛盾
  （換算得 0 → 多幣別顯示 N/A、單幣別顯示 0）。
  註：抓取腳本已把 0 正規化為 null（`scripts/fetch-taiwan-bank-rates.js:126-131`），
  此為縱深防禦，守住 CDN 資料異常路徑。
- 修復：新增 SSOT guard `isUsableRate`（有限正數；`src/utils/exchangeRateCalculation.ts:26-31`），
  統一套用於 `getExchangeRate` fallback 鏈（`:129-152`）、`hasValidSellRate`、`hasValidBuyRate`（`:262-263`）。
- 回歸測試（先紅後綠）：`src/utils/__tests__/exchangeRateCalculation.test.ts`
  「無效匯率值防呆（0 / NaN / Infinity）」6 案例（sell=0 fallback、NaN 回 null、
  簡化匯率 0/NaN 回 null、availability 排除 0、getBuyRate NaN fallback、畸形 details 不崩潰）。

### 5. 畸形 details 崩潰風險（FIXED）

- 問題：`hasOnlyOneRateType` 以 `d.spot.sell` 非 optional 存取；CDN payload 驗證
  （`src/services/exchangeRateService.ts:66-73` `isValidRatePayload`）只驗 `rates` 不驗 `details`，
  malformed details 缺 `spot`/`cash` 欄位時會 TypeError。
- 修復：改為 `d.spot?.sell` optional chaining + `isUsableRate`
  （`src/utils/exchangeRateCalculation.ts:458-459`）。
- 回歸測試：同上「畸形 details（缺 spot/cash 欄位）不得使 hasOnlyOneRateType 崩潰」。

### 6. 金額輸入邊界（PASS）

- 極大金額：計算機 `canAddDigit`/`isNumberOutOfRange` 擋在 MAX_SAFE_INTEGER
  （`src/features/calculator/utils/validator.ts:315-320`）；v2 版面大金額以 fit-to-container 縮放
  （`SingleConverterV2.tsx:64-87`，#590 已修）。
- 清空：`parseFloat('')` → NaN → 對向欄同步清空（`useCurrencyConverter.ts:365-369`）；
  新增回歸測試「清空來源金額時 toAmount 應同步清空」驗證通過。
- swap 一致性：store 原子互換幣別（`converterStore.ts:458-462`）+ hook 互換金額
  （`useCurrencyConverter.ts:500-503`），換算 effect 依新方向重算；
  新增回歸測試「swap 應同時互換幣別與金額」驗證通過。
- 小數：`formatAmountInput` 依幣別 decimals 截斷、單一小數點防呆（`currencyFormatter.ts:114-132`）。

### 7. 收藏與歷史（PASS）

- 排序合約：TWD 固定 index 0 → 收藏幣（用戶順序）→ 非收藏幣（字母序）；
  `useCurrencyConverter.sortedCurrencies`（`:594-601`）與 `getAllCurrenciesSorted`
  （`src/pages/favorites-utils.ts:20-33`）輸出一致，既有測試直接比對兩者相等
  （`useCurrencyConverter.test.tsx` sortedCurrencies 區塊）。
- TWD 永不入收藏：`toggleFavorite`/`reorderFavorites` 雙重過濾（`converterStore.ts:464-476`），
  hydrate sanitize 亦會剔除（`converterStore.ts:260-267`）。
- 歷史：新增置頂、上限 50 筆（`converterStore.ts:79,480-483`）、7 天過期自動清理
  （`useCurrencyConverter.ts:308-315`）、schemaVersion 2 帶 provider/rateMode 可完整重放
  （`reconvertFromHistory`，`:559-591`），均有既有測試覆蓋。

### 8. localStorage 持久化（PASS）

- Zustand persist（key = `CONVERTER_STORE_KEY`）+ `partialize` 白名單（`converterStore.ts:511-525`）。
- legacy key 一次性遷移（`buildMigrationPatch`，`:275-338`）與 legacy 歷史遷移（`:361-398`）。
- hydrate 後 `__validateAndSanitize` 修復損毀欄位（非法幣別、rateMode、providerPreference；`:196-271`），
  `src/stores/__tests__/converterStore.test.ts` 已覆蓋。

### 9. PWA offline fallback（PASS）

- precache + `setCatchHandler` 三層兜底：JS/CSS 走 precache 修復、document 走
  `resolveOfflineDocumentFallback`（index.html → offline.html 兜底鏈；`src/sw.ts:287-303`）。
- 導覽策略：暖快取 SWR、冷快取 8s bounded network-first，4xx/5xx 不直接服給用戶
  （`sw.ts:335-384`），避免 stale edge 404 與 React #418。
- iOS eviction 自我修復：`VERIFY_AND_REPAIR_PRECACHE` + `ensureOfflineHtmlCached`（`sw.ts:43-127`）。
- 測試覆蓋：`src/pwa-offline.test.ts`、`src/utils/__tests__/pwaOfflineFallback.test.ts`。

### 10. SW 更新流程 SKIP_WAITING 協定（PASS）

- 三處聯動齊備：`vite.config.ts:303` `registerType: 'prompt'`；
  `sw.ts:196-199` message handler 收到 `SKIP_WAITING` 才 `skipWaiting()`；
  `swUtils.ts:109-122` 對 `registration.waiting` 發送 `{ type: 'SKIP_WAITING' }` 並在
  `controllerchange` 後重載，防版本撕裂。
- 離線防護：offline 時拒送 SKIP_WAITING（`swUtils.ts:96-100`），有測試覆蓋
  （`src/utils/__tests__/swUtils.test.ts:178-250`）。
- 壞 SW 自動修復僅限連網 + 不健康 precache（`src/utils/swHealth.ts`），健康 SW 維持 prompt UX。

## 變更檔案清單

| 檔案                                                                                | 變更                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/ratewise/src/utils/exchangeRateCalculation.ts`                                | 新增 `isUsableRate` SSOT guard；`getExchangeRate`/`hasValidSellRate`/`hasValidBuyRate`/`hasOnlyOneRateType` 統一無效值判定與 optional chaining |
| `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`                 | 零值佔位字串 `padEnd` 改 `(0).toFixed(decimals)`（兩處）                                                                                       |
| `apps/ratewise/src/utils/__tests__/exchangeRateCalculation.test.ts`                 | 新增「無效匯率值防呆」6 個回歸測試                                                                                                             |
| `apps/ratewise/src/features/ratewise/hooks/__tests__/useCurrencyConverter.test.tsx` | 新增「零值/缺匯率顯示」4 個 + 「swap/清空一致性」2 個回歸測試                                                                                  |
| `docs/dev/fleet-qa-deep-report.md`                                                  | 本報告                                                                                                                                         |

## 驗證證據

```text
pnpm typecheck                         → 全 workspace Done（含 apps/ratewise tsc --noEmit）
pnpm vitest run（修復前基線）           → 177 passed / 3996 tests
pnpm vitest run（RED，新測試）          → 10 failed（全為預期的新回歸測試）
pnpm vitest run（GREEN，修復後全套）    → 177 passed | 1 skipped / 4023 passed | 2 skipped
```

## 未修復但建議追蹤

- `isValidRatePayload` 僅驗證 `rates` 不驗證 `details` 結構（`exchangeRateService.ts:66-73`）；
  本次已在消費端（`exchangeRateCalculation`）補防呆，若要源頭收斂可於後續 PR 擴充 payload 驗證。
- `calculateCrossRate` 目前僅測試使用，UI 已收斂到 `getUnitExchangeRate`；可於後續清理評估是否移除。
