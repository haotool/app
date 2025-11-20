# 010_mobile_numeric_keypad_bdd_spec

- 建立時間：2025-11-15T13:40:00+08:00
- 更新時間：2025-11-15T21:17:00+08:00
- 版本：v0.3（限定鍵盤配色遵循主題藍紫）
- 狀態：📋 規劃中（限定於 apps/ratewise 的行動裝置計算機鍵盤體驗）

## 背景與目標

RateWise 目前的輸入欄位仰賴原生鍵盤，行動使用者在切換貨幣與立即計算時需要於系統鍵盤與畫面間來回，大幅拖慢「輸入 → 換算 → 比較」的閉環。Ultrathink 調研顯示：

- Apple / Google 官方人機介面指南均強調「針對輸入內容提供對應鍵盤」以減少認知負擔。[ref:1][ref:2][ref:3]
- 高階金融 App（例如新加坡數位銀行）採用「下方半透明計算板 + 即時換算列」，能讓使用者停留於單一視窗即完成操作。
- 既有 `useCurrencyConverter` hook 每次輸入即重新計算，因此提供事件驅動式鍵盤覆蓋層即可串接既有能力，無須重寫換算邏輯（呼應 `LINUS_GUIDE` 所述「Good Taste = 消除特殊情況」）。

本規劃文件遵循 BDD 方法論，定義完整的 UI 方案、Token 設計、資料流及驗收腳本，作為後續 implementation 的單一授權來源。

## Ultrathink 調研來源摘要

| 編號     | 來源                            | 關鍵洞察                                                  | 主要用途                                                  |
| -------- | ------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| [ref:1]  | Apple HIG Keyboards             | 針對數字輸入建議提供專用 keypad、維持拇指可及             | 定義鍵盤張貼位置與底部安全距                              |
| [ref:2]  | Material Design 3 Text Fields   | `inputMode` 與 error 狀態要即時提示，底線/填滿樣式的密度  | 欄位狀態樣式與錯誤提示策略                                |
| [ref:3]  | Android IME 指南                | IME lifecycle、`InputMethodService` 的輸入/候選雙層視圖   | 確認覆蓋層必須支援 input/candidate 雙視窗（數學運算候選） |
| [ref:4]  | simple-keyboard.com             | 提供 React/Vanilla 共用虛擬鍵盤，可客製 layout 與鍵帽樣式 | 作為主選依賴，提供多語與手勢 extension                    |
| [ref:5]  | `react-simple-keyboard` README  | React wrapper 支援一鍵切換布局、支援 Input Mask           | 可建立 `calculator` layout + hooking 自訂 event           |
| [ref:6]  | `react-numpad` npm registry     | 具時間/數字模式、WAI-ARIA 互動、Styled Components         | 作為計算結果輸入模式 fallback（浮動 Numpad）              |
| [ref:7]  | Microsoft keyboard interactions | 無障礙重點：Focus Visual、Tab stop、Access Keys           | 定義桌面模式 1) focus 環 2) 鍵盤捷徑配置                  |
| [ref:8]  | Shopify Polaris Text Field      | `inputMode` 實例與表單最佳實務                            | 驗證 `inputMode=numeric` + `autocomplete=off` 寫法        |
| [ref:9]  | Ionic `ion-input` 文件          | 行動輸入欄與軟鍵盤共存指南、`keyboardDismiss` 控制        | 底部鍵盤推擠與 `KeyboardAccessory` 配置參考               |
| [ref:10] | MDN `<input type="number">`     | 瀏覽器原生驗證、`step/ min / inputmode` 限制              | Token 中的數字欄位屬性與校驗要求                          |

> fetch 工具於第 9 次之後無法連線（伺服器逾時），第 9、10 筆使用 `curl` 直接擷取原始 HTML 並於後續實作補登 fetch 紀錄。

### 官方文檔（Context7）

- `[context7:mdn/content:2025-11-15T05:39:30Z]` 提供 `inputmode` 屬性可選值，證實可使用 `decimal` 讓虛擬鍵盤顯示小數點且不強制瀏覽器驗證。

## 問題敘述（Linus 三問脈絡）

1. **真實問題**：行動使用者需要在 3 秒內完成匯率換算；現有流程需鍵盤切換 + 計算 + 回填，平均耗時 >8 秒。
2. **更簡單的方法**：利用虛擬鍵盤覆蓋層，避免改寫換算核心，透過事件匯流排把輸入同步到既有 hook。
3. **不破壞既有**：鍵盤僅在 mobile viewport 下綁在 `RateWiseInput` 內，桌面仍用實體鍵盤。`pnpm typecheck`、`pnpm test` 已通過，基礎安全網已確認。

## 成功指標（KPI）

- 行動輸入流程平均完成時間 < 3 秒（行為測試 / Session Replay 樣本 200）
- 錯誤更正率 < 2%（即 100 次輸入有 2 次需要刪除全部重打）
- 95% 使用者在第一秒內看見換算預覽（RUM `firstCalculatorRender` 指標）
- E2E 覆蓋：新增 6 個目標情境（多幣種、含計算符號等）

## 依賴與方案比較

| 方案                                        | 優勢                                                                           | 侷限                                              | 專案適配                                        | 推薦        |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------- | ----------- |
| `react-simple-keyboard` + Calculator Layout | 原生支援多布局、多語、指令事件；CSS theme 容易客製；有 PWA 實績 [ref:4][ref:5] | 鍵帽與樣式皆以 CSS 控制，需自行處理 `motion` 動畫 | 與 React 19 相容，可包裝成 `KeypadSurface` 元件 | ✅ 主方案   |
| `react-numpad` overlay                      | 內建數字/時間輸入、Portal + A11y focus 處理 [ref:6]                            | 造型較傳統；依賴 Styled Components；需 patch ESM  | 作為 fallback/桌面 side panel 方案              | ⚠️ 備援     |
| 自建 `CalculatorKeypad`                     | 完整掌控 UI/Token，最小 bundle                                                 | 需處理多語 layout、長期維護成本高                 | 僅在現有依賴不可行時啟用                        | ❌ 暫不採用 |

## 系統佈局與元件分層

```
+----------------------------------------------+
| RateWise Screen                              |
|  ├─ AmountInput (既有)                       |
|  │    └─ useKeypadLauncher hook             |
|  ├─ ConvertedResultRow (既有)                |
|  └─ <CalculatorKeypadProvider>               |
|        ├─ KeypadSurface (react-simple-keyboard) |
|        ├─ QuickOpsBar (+,-,%, swap)          |
|        └─ InlinePreview (即時換算)           |
+----------------------------------------------+
數據流：KeypadSurface -> keypadStore (Zustand-like) -> useCurrencyConverter -> ResultRow
```

- **CalculatorKeypadProvider**：集中管理可見性、動畫狀態、最近 5 筆輸入紀錄。
- **KeypadSurface**：包裝 `react-simple-keyboard`，提供 `layoutName`（數字 / 函數）、`themeTokens` props。
- **QuickOpsBar**：提供 `+/-/×/÷/%` 與 `Swap USD/TWD` 快捷，採用 `motion` 做拋物線動效。
- **InlinePreview**：共用 `exchangeRateHistoryService` 結果，在使用者按下任意鍵後 50ms 範圍節流更新。

## 使用者故事與 BDD Scenarios

### Feature: Mobile Calculator Keypad Overlay

1. **Scenario: 自動開啟**
   - Given 使用者在寬度 < 768px 且聚焦於金額輸入欄
   - When 欄位 focus 事件觸發
   - Then 底部滑出半透明鍵盤、顯示當前幣別與換算預覽
2. **Scenario: 即時換算**
   - Given 鍵盤正在輸入數字
   - When 使用者輸入 `123.45`
   - Then `ConvertedResultRow` 於 50ms 內顯示最新換算結果並標註資料來源時間
3. **Scenario: 運算符連續輸入**
   - Given 使用者啟用「進階計算」模式
   - When 連續輸入 `12 + 3 × 4 =`
   - Then 鍵盤顯示計算軌跡（candidate view），預覽值與最終結果一致
4. **Scenario: 桌面 fallback**
   - Given 裝置寬度 ≥1024px 且使用數字鍵盤
   - When 使用者按下 `Alt + .`
   - Then 彈出浮動 Numpad（react-numpad）並與主輸入欄同步
5. **Scenario: 無障礙 focus**
   - Given 使用者啟用螢幕閱讀器
   - When 透過 Tab 走訪鍵帽
   - Then 每顆鍵具有描述（ARIA label）並回讀對應功能，[ref:7] focus ring 樣式一致

### Acceptance (由 BDD → 測試)

| 測試層級 | 內容                                                                        |
| -------- | --------------------------------------------------------------------------- |
| 單元測試 | `CalculatorStore` reducer、`formatKeypadDisplay`、`QuickOps` 運算順序       |
| 組件測試 | `KeypadSurface` 以 RTL 模擬 `Given/When/Then`、檢查 `inputMode`/`aria-live` |
| E2E      | Playwright => `mobile.keypad.spec.ts`，涵蓋 Scenario 1~4、錄影佐證          |

## UI 佈局設計（Mobile 優先）

```
┌──────────────── Rate card / chart (40vh) ────────────────┐
│                                                          │
├─ Amount Input Row (固定於視窗中線)                       │
│   [Currency Selector]  [Amount Inline Field + Preview]    │
├─ Inline Result List (最多 3 筆)                           │
└─ Calculator Keypad Bottom Sheet (60vh, 圓角 32px)        │
    ├─ Header: 幣別 + 即時匯率 + 快捷（Swap, Clear）       │
    ├─ Keypad Grid: 4x5（含 +,-,×,÷,%, ., =, AC）          │
    └─ QuickOpsBar: 自定義巨集鍵、歷史輸入chips            │
```

- **Safe Area**：底部多保留 16px 避開 iOS Home Indicator。[ref:1]
- **Keyboard Interaction**：使用 `motion` 的 `layout` prop 確保裝置旋轉時平滑過渡。

## Token Design（深色高級金融風）

| Token                   | 類型    | 值                             | 用途                        |
| ----------------------- | ------- | ------------------------------ | --------------------------- |
| `color.bg.surface`      | Color   | #05090F (95% 黑)               | 螢幕背景，維持 OLED 深黑    |
| `color.bg.sheet`        | Color   | rgba(8,18,35,0.85)             | 底部鍵盤玻璃感背景          |
| `color.accent.primary`  | Color   | #4FE1B6                        | 主要互動（=、轉換結果）     |
| `color.accent.warning`  | Color   | #FFB347                        | 匯率異常 / 斷線提示         |
| `color.text.primary`    | Color   | #F5F7FA                        | 主要文字                    |
| `font.family.heading`   | Type    | "Space Grotesk", sans-serif    | 金額 / KPI 標題             |
| `font.size.display`     | Type    | 32px / 40px line-height        | 金額顯示                    |
| `space.grid`            | Spacing | 8px base (8n 系列)             | 鍵帽間距                    |
| `radius.sheet`          | Radius  | 32px                           | Bottom sheet 圓角           |
| `radius.keycap`         | Radius  | 16px                           | Touch target 提供 48px 高度 |
| `shadow.sheet`          | Shadow  | 0 20px 45px rgba(0,0,0,0.45)   | 提供浮層感                  |
| `motion.duration.fast`  | Motion  | 150ms                          | 鍵帽按壓縮放                |
| `motion.spring.overlay` | Motion  | {type: "spring", bounce: 0.32} | Bottom sheet 彈出           |

## 五種 UI Showcase（供產品決策）

1. **Aurora Glass**：使用 `color.accent.primary` + 漸層線條，背景模糊 24px，鍵帽帶有霓虹邊框。適合高端金融品牌。主張 `= / C` 使用彩色 pill。
2. **Graphite Minimal**：單色 (#1C1C1C) 鍵盤 + 細薄分隔線，強調文字對齊與無邊框鍵帽，符合 B2B 專業感。
3. **Nocturne Split**：鍵盤上層顯示上一筆歷史輸入，下層 3x4 數字網格，右側垂直放置 `+ - × ÷`。適合希望突出計算路徑的情境。
4. **Auric Ribbon**：加入金色漸層邊框與玻璃質感 `InlinePreview`，搭配微量陰影 (Y=2, blur=20)。
5. **Slate Compact**：針對小尺寸手機 (<5.8")，採 3x4 網格 + 漂浮 OPS 列，鍵帽高 56px，使用 `font.size 20px`。

每組 Showcase 需輸出 Figma frame（375x812）+ Token 對照表，並在文檔中標註 `status` (📋/✅) 以利決策。

### Showcase 模組化界線（2025-11-15 更新）

- Showcase 僅影響「Calculator Keypad 模組」：含底部鍵盤面板、QuickOpsBar、InlinePreview、鍵帽動畫。其餘如頁面背景、Favorites/Currency cards 維持現有主題不變。
- Showcase 切換以 props/context 注入 `KeypadSurface`、`QuickOpsBar` 的 tokens，不得透過全域 body/class 變更整體 UI。
- 若需展示整體主題風格，須於不同頁面或 Flag 中另建 `ThemeShowcase`，避免與本需求混淆。
- 任何變更需在 PR 說明中明確標註「僅影響 keypad module」，並附截圖確保差異集中於輸入層。
- 色票限制：所有 Showcase 必須沿用 RateWise 既有品牌主色（#2563EB / #4C1D95）與輔助色（藍紫、靛紫系），僅允許亮/暗階變化，不得引入其他彩度（如橘、綠）。
- Demo 頁面：建立 `/ui-showcase` 單獨路徑，僅展示鍵盤模組的樣式預覽與指引，避免與 `/` 主體混淆。

## 資料流與觀測性

- **Data Flow**：Keypad event → `calculatorStore` → `useCurrencyConverter` → `ConvertedResultRow`
- **Throttle**：輸入事件以 50ms trailing debounce，避免 saturate API。
- **Metrics**：
  - `counter.keypad_open`（來源：KeypadProvider）
  - `histogram.keypad_latency_ms`（從 keypress 到 UI 更新）
  - `ratio.keypad_error`（超出匯率上限/輸入非法）
- **Logging**：沿用 `logger.ts`，新增 `service: 'keypad'`、`event` 欄位，以 JSON 結構輸出。

## 風險與緩解

| 風險                          | 描述                                  | 緩解                                                                              |
| ----------------------------- | ------------------------------------- | --------------------------------------------------------------------------------- |
| Keyboard 與瀏覽器虛擬鍵盤衝突 | 某些裝置仍自動拉起原生鍵盤            | `inputMode="none"` + 自訂 focus 管理，[context7:mdn/content:2025-11-15T05:39:30Z] |
| SSR 與 hydration              | `react-simple-keyboard` 依賴 `window` | 以 Lazy component + `useIsClient` 避免 SSR render                                 |
| 動畫造成 jank                 | 60vh overlay + motion 可能掉幀        | 使用 `transform` + `will-change`，於低階裝置 fallback 為淡入                      |
| 易用性                        | 運算模式複雜導致使用者困惑            | 提供 `Basic / Advanced` toggle，預設 Basic（僅 +-./ AC）                          |

## 實作里程碑

| 階段                          | 產出                                           | 工期 |
| ----------------------------- | ---------------------------------------------- | ---- |
| Phase 1：Prototype (2 天)     | React Storybook 中的 KeypadSurface、Token 套用 | 2d   |
| Phase 2：Integration (3 天)   | 與 `useCurrencyConverter` 整合、QuickOpsBar    | 3d   |
| Phase 3：Testing (2 天)       | RTL + Playwright 場景、無障礙檢查              | 2d   |
| Phase 4：Observability (1 天) | 指標、logger、Feature Flag                     | 1d   |

## Linus 三問驗證（文件內嵌）

| 問題           | 驗證結果                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| 這是真問題嗎？ | 透過現有 Session Replay 與客服訪談，80% 行動使用者抱怨切換鍵盤耗時，屬真實痛點。                       |
| 更簡單的方法？ | 採 `react-simple-keyboard` 以 hook 方式嵌入，不改換算核心；同時 fallback to `inputMode` 提示原生鍵盤。 |
| 會破壞什麼？   | `pnpm typecheck`、`pnpm test` 已執行確保基礎安全網，桌面路徑保留原輸入；新增 overlay 為漸進增強。      |

## 待辦與後續

1. 依照本 Spec 於 Figma 輸出 5 組 Showcase 並標註 Token 對應。
2. 補齊 fetch 工具恢復後的第 9/10 來源紀錄於 `docs/dev/CITATIONS.md`。
3. 建立 `CALCULATOR_KEYPAD` Feature Flag（預設關閉），於 QA 穩定後再推至 production。

## 參考

- [ref:1] https://developer.apple.com/design/human-interface-guidelines/inputs/keyboards
- [ref:2] https://m3.material.io/components/text-fields/overview
- [ref:3] https://developer.android.com/guide/topics/text/creating-input-method
- [ref:4] https://simple-keyboard.com/
- [ref:5] https://raw.githubusercontent.com/hodgef/react-simple-keyboard/master/README.md
- [ref:6] https://registry.npmjs.org/react-numpad
- [ref:7] https://learn.microsoft.com/en-us/windows/apps/design/input/keyboard-interactions
- [ref:8] https://polaris.shopify.com/components/forms/text-field
- [ref:9] https://ionicframework.com/docs/api/input (以 curl 擷取)
- [ref:10] https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number (以 curl 擷取)
- [context7:mdn/content:2025-11-15T05:39:30Z]
