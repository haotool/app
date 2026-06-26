# RateWise 2026 產品級 UX 規格（韓式 Fintech 對標）

> **狀態**：Active（設計 SSOT）  
> **建立日期**：2026-06-12  
> **適用範圍**：`apps/ratewise/` 單幣別主流程、多幣別差異化、首頁 IA、Settings a11y  
> **產品北極星**：`DESIGN.md` — **The Quiet Exchange Desk**  
> **審查依據**：20 線並行 UX 審查（2026-06）、`docs/prompt/UIUX.md`、`docs/dev/044_ratewise_uiux_token_refactor_spec.md`  
> **關聯實作計畫**：`docs/superpowers/plans/2026-06-12-ratewise-ux-phase1.md`（Phase 1 任務拆解）

---

## 0. 執行摘要

### 現況定位

RateWise 在**工程與資料 SSOT**（三態匯率、雙向換算、OpenData、PWA、design-tokens）上已達企業級，但使用者體感仍是「精緻 PWA 工具站」，尚未達 **Toss / Wowpass 級 native 產品感**。

| 維度                 | 現況評分                 | 2026 目標      |
| -------------------- | ------------------------ | -------------- |
| 綜合韓式體驗         | **7.1–7.4 / 10**         | **≥ 8.5**      |
| Toss「無需解釋」     | **5 / 10**               | **≥ 8**        |
| 單幣輸入效率（手機） | **6+ tap**（Modal 路徑） | **≤ 3 tap**    |
| 首屏資訊密度         | 過高、重複               | 7 項唯一資訊集 |
| TDS / DS 一致性      | **62 / 100**             | **≥ 85**       |

### 核心痛點（使用者主訴驗證）

**單幣別主路徑過長**：金額欄為 `<button>` → 必開 `CalculatorKeyboard` Bottom Sheet → 按 `=` 才寫回 → 雖有 `useCurrencyConverter` 即時換算，**UI 被 Modal 閘門阻斷**。

同時首屏資訊**重複雜亂**：雙輸入、雙 quick amounts、匯率卡（RateSelector + 雙向匯率 + 趨勢圖）、全寬「加入歷史」、SEO 區塊再三解釋台銀／現金／即期。

### 設計一句話

> **開屏即見匯率故事 → 同屏雙向金額 → 拇指區操作；次要一律 Bottom Sheet；SEO 教育內容折疊不刪 DOM。**

---

## 1. 2026 UX 與韓式 Fintech 設計原則

### 1.1 全球 2026 Fintech UX（外部對照）

| 原則                  | 含義                            | RateWise 落地                                 |
| --------------------- | ------------------------------- | --------------------------------------------- |
| **Thumb zone**        | 主互動在螢幕下 1/3              | Thumb CTA + inline numpad 錨定 BottomNav 上方 |
| **Bottom sheet**      | 次要選擇不佔首屏                | 幣別、匯率三態詳情、完整趨勢                  |
| **Data storytelling** | 先答「現在多少、走向如何」      | Hero Story Band（匯率 + Δ% + sparkline）      |
| **Minimal steps**     | 每多 1 tap 流失                 | 打掉 Modal 閘門；quick chip 全斷點可見        |
| **Proactive UX**      | 預測意圖、可關閉                | 收藏 chips、歷史續接、stale 分級（見 §8）     |
| **Inclusive design**  | KWCAG 2.2：200% 字級、44px 觸控 | Settings 大字模式、focus trap（見 §7）        |

### 1.2 韓式標竿對照

| 標竿                                    | 可借鑑                                               | RateWise 不複製       |
| --------------------------------------- | ---------------------------------------------------- | --------------------- |
| **Toss** TDS「설명이 필요 없는 디자인」 | ListRow、segmented pill、大數字 hero、無邊框 surface | 預付卡、KYC、帳戶體系 |
| **Wowpass**                             | 餘額 hero 語法、旅行情境、一鍵面額、比價一眼化       | 封閉錢包、儲值        |
| **KakaoBank**                           | 任務清晰度優先於模組堆疊                             | —                     |

### 1.3 產品不變式（MUST NOT 破壞）

- Google 匯率模式：上原幣、下目標幣；雙向兩行；UI **不**標「買入／賣出」
- 三態匯率（即期／現金／換錢所）+ 無資料灰顯 + fallback
- `converterStore` 為 rateType / rateSource / favorites SSOT
- 極簡 UI：卡片與主按鈕**無外框**；primary 前景 `text-primary-foreground`
- SEO 文案 SSOT：`seo-metadata.ts`；首頁**不**輸出 `FAQPage` JSON-LD

---

## 2. 現況分析

### 2.1 單幣別輸入漏斗（SSOT 行為）

| 路徑                   | 互動次數             | 說明                                     |
| ---------------------- | -------------------- | ---------------------------------------- |
| 接受預設 TWD→JPY、1000 | **0 tap**            | 開頁即見匯率與結果                       |
| 桌機 quick amount      | **1 tap**            | `fromVisibility: short:hidden` 僅 >700px |
| 手機 Modal 輸入 1000   | **1 tap + 5 鍵 = 6** | 開 sheet → 4 鍵 → `=`                    |
| Toss / Wowpass 理想    | **1–2**              | inline 或 chip                           |

**根因錨點**：

- `SingleConverter.tsx` L429–444、L638–653：金額為 `button` + `openCalculator`
- `useCalculatorModal.ts`：僅 `handleConfirm` 寫回
- `design-tokens.ts`：`fromVisibility: 'short:hidden'`、`swap.visibility: 'micro:hidden'`
- `amountInput`：`nano:text-sm` 與 inclusive 方向相反

### 2.2 資訊重複矩陣（首頁）

| 資訊             | 重複次數   | 位置                                               |
| ---------------- | ---------- | -------------------------------------------------- |
| 台銀／買賣價敘述 | 5+         | SEO intro、highlights、AnswerCapsule、FAQ、eyebrow |
| 現金／即期說明   | 3–4        | RateSelector + SEO howTo + AnswerCapsule           |
| 匯率數字         | 2+         | 匯率卡 + toAmount + 趨勢 tooltip                   |
| 資料來源／時間   | 卡外 + SEO | `RateWise` data-source（`nano:hidden`）            |
| 收藏幣匯率       | ×2         | 桌機 `FavoritesList` + `CurrencyList`              |
| 產品標題         | ×2         | sr-only h1 + SEO h2 同文                           |

### 2.3 Toss「無需解釋」差距 Top 5

1. 邊框堆疊（`border-2` 金額框、匯率卡、swap）
2. from/to **label** + hover 才見提示（觸控無效）
3. 原生 `<select>` 疊在金額列
4. 金額欄無「可編輯」affordance
5. `micro:hidden` 使 swap 在小屏消失

---

## 3. 目標資訊架構（2026 單屏）

### 3.1 一屏唯一資訊集（7 項）

離開前使用者必須能回答：

1. 幣別對（A → B）
2. 主匯率 `1 A = X B`
3. 倒數匯率 `1 B = Y A`
4. 輸入金額
5. 換算結果
6. 匯率語境（類型 + 來源 + 新鮮度）— **Trust Line**
7. 走向暗示（sparkline + 可選 Δ%）

**排除於一屏外**（sheet / 他頁）：完整趨勢圖、RateSelector 全展開、來源幣 quick、加入歷史全寬 CTA、桌機側欄列表。

### 3.2 垂直結構（行動 · 390×760）

```
AppLayout Header (48px)
├── ① Hero Story Band (~88px)
│     主匯率 + 倒數 + sparkline + Trust Line
├── ② Conversion Stack (~168px)
│     From chip+金額 → Swap → To chip+金額 → To quick chips
├── ③ Thumb Action Bar (~48px)
│     ＋記錄 | 匯率來源 | 更多
├── [編輯態] Inline Numpad (~260–320px，取代 thumb bar)
BottomNavigation (56px + safe-area)
```

### 3.3 Sheet 分工

| 觸發             | Sheet                      | 內容                               |
| ---------------- | -------------------------- | ---------------------------------- |
| 幣別 chip        | `CurrencyPickerSheet`      | 搜尋、最近、收藏、全列表           |
| Hero / trust tap | `RateDetailSheet`          | RateSelector、完整趨勢、換錢所詳情 |
| 金額 tap         | `InlineNumpad`（非 modal） | 共用 `CalculatorKeypad`            |
| 更多             | `MoreSheet`                | 來源幣 quick、複製、分享連結       |

### 3.4 漸進揭露三層

| 層級      | 預設可見                                     | 摺疊                                    | 移出主流程                                         |
| --------- | -------------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| Primary   | 雙向金額、主匯率、Trust Line、To quick chips | —                                       | —                                                  |
| Secondary | sparkline 摘要                               | RateSelector 全展開、完整趨勢、加入歷史 | —                                                  |
| Tertiary  | —                                            | 來源幣 quick                            | `rateMode`（Settings）、收藏全列表（`/favorites`） |

---

## 4. 功能規格（Phase 對照）

### Phase 1 — MVP 韓式化（0–3 月）P0

**目標**：TTTQ P75 ≤ 2.0s；MTTQ P50 ≤ 3 taps；K-UX ≥ 85。

| ID    | 功能                        | 規格要點                                                                                                                             | 主要檔案                                                                    |
| ----- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| P1-01 | **Inline Numpad**           | 抽出 `CalculatorKeypad`；`InlineNumpad` 固定於 nav 上；`commitStrategy: confirm`（單幣別）；桌面可保留 `CalculatorKeyboard` fallback | `calculator/*`, `SingleConverter.tsx`, `design-tokens` `inlineNumpadTokens` |
| P1-02 | **零 Modal 快速路徑**       | 並行支援：`inputMode=decimal` 直寫 **或** chip 一鍵；移除手機 `short:hidden` 來源 quick                                              | `SingleConverter`, `singleConverterLayoutTokens`                            |
| P1-03 | **Swap 全斷點**             | 移除 `micro:hidden`；內嵌中線 swap                                                                                                   | `design-tokens.ts` L1006–1011                                               |
| P1-04 | **Hero Story + Trust Line** | 匯率敘事帶置頂；合併 `ratewise-data-source` + `ExchangeShopBadge` 為 `TrustLine`；取消 `nano:hidden` 藏信任訊息                      | 新 `HeroStoryBand.tsx`, `RateWise.tsx`                                      |
| P1-05 | **Currency Bottom Sheet**   | 取代 `<select>`；搜尋 + 收藏 + `recentCurrencies`（store 新增）                                                                      | 新 `CurrencyPickerSheet.tsx`, `converterStore`                              |
| P1-06 | **趨勢預設收合**            | Hero 僅 sparkline + Δ%；點擊才 lazy 載入 `MiniTrendChart`                                                                            | `SingleConverter` trend 區                                                  |
| P1-07 | **歷史 CTA 降級**           | 全寬 primary → Thumb「＋記錄」；2–3s 去抖動自動記錄 + 去重                                                                           | `useCurrencyConverter`, `SingleConverter`                                   |
| P1-08 | **資訊去重**                | 桌機 `FavoritesList`+`CurrencyList` 合併單一列表；SEO 區 howTo/FAQ 改 `<details>`                                                    | `RateWise.tsx`, `HomepageSEOSection.tsx`                                    |
| P1-09 | **術語口語化**              | 即期→「匯款／網銀」、現金→「臨櫃現鈔」、自動方向→「依換算估算」                                                                      | `i18n/*`, `RateSelector`                                                    |
| P1-10 | **多幣 description**        | 渲染 `multiConverter.description`；頁面級 `RateSelector`                                                                             | `MultiConverter.tsx`                                                        |

### Phase 2 — 旅行與 Proactive（3–6 月）P1

| ID    | 功能               | 規格要點                                       |
| ----- | ------------------ | ---------------------------------------------- |
| P2-01 | 旅行情境 Hero      | 「我要去日本」預設 JPY↔TWD + 現金              |
| P2-02 | 多來源比價卡       | `rankProviderQuotes` 並排 UI                   |
| P2-03 | 收藏 chips（手機） | 補 `hidden lg` 側欄缺口                        |
| P2-04 | 歷史續接 chip      | 4h 內可關閉建議                                |
| P2-05 | Stale 分級 L0–L3   | 擴展 `ratesWarning`                            |
| P2-06 | 金額輸入帶 SSOT    | 單列 chip + 計算機入口；移除雙列 from/to quick |
| P2-07 | Layout 行動底導    | FAQ 等內容頁共用 `BottomNavigation`            |
| P2-08 | App 內匯率提醒     | localStorage 門檻                              |

### Phase 3 — TDS 收斂與 a11y（6–12 月）P2

| ID    | 功能                  | 規格要點                                         |
| ----- | --------------------- | ------------------------------------------------ |
| P3-01 | Settings 大字模式     | `data-text-scale`；停用 `nano:text-sm` 反向縮字  |
| P3-02 | 44px 觸控 SSOT        | `quickAmountButtonTokens`、`RateSelector` 命中區 |
| P3-03 | `useFocusTrap`        | `CalculatorKeyboard`、`RatingModal`、彩蛋        |
| P3-04 | 單一 RootLayout       | 合併 AppLayout / Layout 路由樹                   |
| P3-05 | GA4 漏斗事件          | `quote_view`、`quote_task_complete` 等（見 §6）  |
| P3-06 | Web Push 匯率（選配） | VAPID + edge                                     |

---

## 5. 元件與檔案對應

### 5.1 新建

| 檔案                                                   | 職責                        |
| ------------------------------------------------------ | --------------------------- |
| `features/ratewise/components/ConversionHero.tsx`      | 單幣別 2026 版面殼          |
| `features/ratewise/components/HeroStoryBand.tsx`       | 匯率敘事 + sparkline        |
| `features/ratewise/components/TrustLine.tsx`           | 來源 + 時間 + fallback 標記 |
| `features/ratewise/components/ThumbActionBar.tsx`      | 拇指 CTA 三鍵               |
| `features/ratewise/components/CurrencyChip.tsx`        | 幣別觸發器                  |
| `features/ratewise/components/CurrencyPickerSheet.tsx` | 幣別 bottom sheet           |
| `features/ratewise/components/AmountFieldTrigger.tsx`  | 金額觸發 + active 態        |
| `features/calculator/components/CalculatorKeypad.tsx`  | 無殼層鍵盤核心              |
| `features/calculator/components/InlineNumpad.tsx`      | inline 殼層                 |
| `features/ratewise/hooks/useAmountNumpad.ts`           | 升級 `useCalculatorModal`   |

### 5.2 修改

| 檔案                            | 變更                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `SingleConverter.tsx`           | 重排為 ConversionHero 子樹或逐步替換                                               |
| `RateWise.tsx`                  | 移除外層 data-source section                                                       |
| `design-tokens.ts`              | `heroStoryTokens`, `thumbZoneTokens`, `inlineNumpadTokens`, 移除 swap micro:hidden |
| `converterStore.ts`             | `recentCurrencies`                                                                 |
| `HomepageSEOSection.tsx`        | 折疊 howTo/FAQ；精簡 content 面板                                                  |
| `MultiConverter.tsx`            | description + 頁面級 RateSelector                                                  |
| `Layout.tsx` 或 `AppLayout.tsx` | Phase 2 底導共用                                                                   |

### 5.3 複用不變

`useCurrencyConverter.ts`、`exchangeRateCalculation.ts`、`RateSelector.tsx`（移入 sheet）、`MiniTrendChart.tsx`、`CalculatorKey.tsx`、`useCalculator.ts`

---

## 6. 成功指標與驗收

### 6.1 North Star：TTTQ（Time to Trusted Quote）

進站至看見「正確幣對 + 金額 + 來源標示 + 結果」的 P75 時間。

| 情境                              | 目標       |
| --------------------------------- | ---------- |
| 冷啟動                            | ≤ **2.0s** |
| PWA 再訪                          | ≤ **0.8s** |
| QSR（5s 內有效換算 session 比例） | ≥ **80%**  |

### 6.2 任務 KPI（Phase 1 必驗）

| 任務                    | Tap P50 | 時間 P75 |
| ----------------------- | ------- | -------- |
| T0 預設換算             | 0       | ≤ 2.0s   |
| T1 快速金額             | 1       | ≤ 1.5s   |
| T2 計算機（若保留算式） | ≤ 4     | ≤ 8s     |
| T7 Swap                 | 1       | ≤ 0.5s   |

### 6.3 K-UX Score（滿分 100，Ship ≥ 85）

速度 30 + 效率 25 + 清晰 20 + 一致 15 + 信任 10

### 6.4 GA4 核心事件（Phase 3 埋點）

`quote_view`, `quote_task_complete`, `quick_amount_select`, `calculator_open`/`confirm`, `currency_change`, `rate_type_change`, `rate_source_change`, `trend_toggle`

### 6.5 自動化閘門（不得退步）

- `impeccable detect --fast`：0 issues
- axe E2E：serious/critical = 0
- Lighthouse a11y ≥ 0.95；LCP ≤ 2500ms
- 390/768/1440：horizontal overflow = 0；互動目標 ≥ 44px

### 6.6 人工驗收（無需解釋測試）

未說明完成：改幣別 → 輸入金額 → 交換 → 讀懂匯率來源；**成功率 ≥ 90%**。

---

## 7. 無障礙（KWCAG 2.2 對齊）

- **大字模式**：Settings 三態 `standard | large | xlarge`；`amountInput` 小視窗字級下限 `text-lg`
- **44×44px**：`quickAmountButtonTokens`、`RateSelector` 擴大命中區、`notificationTokens` 關閉鈕
- **Focus trap**：共用 `useFocusTrap`；modal 關閉 restore 至觸發金額欄
- **Trust Line**：矮視窗仍顯示（廢除 `nano:hidden` 藏來源）

---

## 8. 內容與 SEO 收斂（不傷索引）

- **首屏**：僅 `RateWise` 轉換器 + 一行信任 + AnswerCapsule + 熱門幣對內鏈
- **折疊**：howTo + FAQ 用 `<details>`，全文留 DOM
- **刪減**：`content.intro` + `highlights[0]` 與 AnswerCapsule 重疊句
- **H1/H2**：可見 H2 改與 sr-only H1 **不同文案**

---

## 9. 風險與決策記錄

| 決策     | 選擇                                         | 不採用                          |
| -------- | -------------------------------------------- | ------------------------------- |
| 金額輸入 | Inline numpad + chip + 可選 native decimal   | 僅保留 Modal                    |
| 趨勢圖   | 預設收合                                     | 永久刪除（保留 SEO 二級頁能力） |
| 歷史     | 自動記錄 + thumb 觸發                        | 全寬 primary CTA                |
| 多幣     | 基準幣唯讀 + 頁面級 RateSelector             | 列級假切換                      |
| SemVer   | Hero/numpad/sheet 為使用者可感知 → **minor** | —                               |

---

## 10. 參考來源

- Toss TDS：<https://developers-apps-in-toss.toss.im/design/components.html>
- 2026 Fintech UX：<https://fuselabcreative.com/fintech-ux-design-guide-2026-user-experience/>
- 內部：`docs/prompt/UIUX.md`、`docs/dev/014_mobile_numeric_keypad_bdd_spec.md`、`docs/dev/044_ratewise_uiux_token_refactor_spec.md`
- 並行審查：2026-06-12 二十線 agent 報告（單幣漏斗、資訊重複、Hero IA、inline numpad、韓式差距等）

---

## 11. 修訂紀錄

| 日期       | 版本 | 變更                                                                  |
| ---------- | ---- | --------------------------------------------------------------------- |
| 2026-06-12 | v1.0 | 初版：整合 20 線 UX 審查、2026 原則、三階段路線圖、元件對應與驗收指標 |
