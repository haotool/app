# Rate Provider SSOT Implementation Plan

> **Status (2026-05-10)：Superseded by implementation.** 本計畫的 provider registry、
> selection domain、history metadata 與多銀行延遲啟用條件已落地；canonical provider API path
> 由 `2026-05-10-canonical-provider-rate-api.md` 接續收斂。後續請以程式碼 SSOT 與 2026-05-10
> 計畫為準，不再把下方未勾選步驟視為待辦。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 RateWise 的匯率來源架構升級為 `sourceKind + providerId + selectionMode`，現在只預留 provider 架構並維持台銀單一銀行體驗；未來銀行 provider 超過一家時，再啟用最佳匯率推薦、銀行選單與指定銀行。

**Architecture:** 新增通用 provider registry 與 provider selection domain，保留現有 `rateSource` 作相容層，再逐步把 store 與歷史切到新模型。Phase 1 只註冊 `bot` 與 `moneybox`，不顯示銀行選單、不啟用推薦；多銀行 UI 的啟用條件是 `getProvidersBySourceKind('bank').length > 1`。歷史資料存可篩選欄位，但 UI 第一版只顯示時間與 `即期` / `現金` / `換錢所`。

**Tech Stack:** React 19、TypeScript、Zustand、Vitest

---

### Task 1: 建立來源領域型別

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/types.ts`
- Create: `apps/ratewise/src/features/ratewise/rateProviderTypes.ts`
- Test: `apps/ratewise/src/features/ratewise/__tests__/rateProviderTypes.test.ts`

- [ ] **Step 1: 新增 provider 型別**
      建立 `RateSourceKind`、`RateProviderId`、`ProviderSelectionMode`、`RateProviderRef`、`RateProviderPreference`、`ResolvedRateProvider`。

- [ ] **Step 2: 保留相容型別**
      `RateSource = 'bank' | 'exchange-shop'` 先保留，並標註為 legacy compatibility。新功能不得再以 `RateSource` 表達 provider。

- [ ] **Step 3: 新增相容轉換函式**
      新增 `toLegacyRateSource(ref)` 與 `fromLegacyRateSource(rateSource)`，讓現有 UI 分支可漸進遷移。

### Task 2: 建立 provider registry SSOT

**Files:**

- Create: `apps/ratewise/src/config/rateProviders.ts`
- Modify: `apps/ratewise/src/config/exchangeShopProviders.ts`
- Test: `apps/ratewise/src/config/__tests__/rateProviders.test.ts`

- [ ] **Step 1: 新增通用 provider registry**
      建立 `RATE_PROVIDERS`，第一階段包含：
  - `bot`: `sourceKind='bank'`
  - `moneybox`: `sourceKind='exchange-shop'`

- [ ] **Step 2: 將換錢所 registry 接到 provider registry**
      `exchangeShopProviders.ts` 保留資料解析職責，但 provider metadata 以 `rateProviders.ts` 為 SSOT。

- [ ] **Step 3: 補 provider 查詢 API**
      實作 `getRateProvider(providerId)`、`getProvidersBySourceKind(sourceKind)`、`getDefaultProvider(sourceKind)`、`isProviderSupportedForCurrency(providerId, currency)`。

- [ ] **Step 4: 新增多銀行啟用條件**
      實作 `shouldEnableBankProviderChoice()`，目前因為只有 `bot` 一家銀行，應回傳 `false`。

### Task 3: 建立推薦與排序純函式（預留，不接 UI）

**Files:**

- Create: `apps/ratewise/src/features/ratewise/rateProviderRanking.ts`
- Test: `apps/ratewise/src/features/ratewise/__tests__/rateProviderRanking.test.ts`

- [ ] **Step 1: 定義 ProviderQuote**
      quote 必須包含 provider、rateType、unitRate、resultAmount、isAvailable。

- [ ] **Step 2: 實作排序函式**
      `rankProviderQuotes()` 依實際 `resultAmount` 排序，最大結果為最佳。

- [ ] **Step 3: 實作 resolved provider 函式**
      `resolveProviderPreference()` 支援：
  - `mode='manual'`: 回使用者指定 provider
  - `mode='best'`: 回 ranked quotes 第一名
  - 沒有可用 quote: 回預設 provider 與 `reason='fallback-default'`

- [ ] **Step 4: Phase 1 不接 UI**
      此任務只建立純函式與測試。`shouldEnableBankProviderChoice() === false` 時，UI 不顯示 provider 選單或推薦入口。

### Task 4: Store schema 漸進遷移

**Files:**

- Modify: `apps/ratewise/src/stores/converterStore.ts`
- Modify: `apps/ratewise/src/stores/__tests__/converterStore.test.ts`

- [ ] **Step 1: 新增 provider preference state**
      在 store 加入：
  - `providerPreference: RateProviderPreference`

- [ ] **Step 2: 保留 rateSource 相容欄位**
      第一階段保留 `rateSource`，但 store action 以 `setProviderPreference()` 為新入口。`setRateSource()` 只做相容轉換。

- [ ] **Step 3: 遷移舊 rateSource**
      legacy migration 規則：
  - `bank` -> `manual bot`
  - `exchange-shop` -> `manual moneybox`

- [ ] **Step 4: 維持 exchange-shop cash invariant**
      若 resolved provider 的 `sourceKind='exchange-shop'`，store 仍需強制 `rateType='cash'`。

- [ ] **Step 5: Phase 1 固定 manual**
      目前 migration 與預設值都使用 `mode='manual'`。`best` 僅為未來多銀行預留，不暴露給使用者。

### Task 5: 計算核心接入 provider selection（保持現有體驗）

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`
- Modify: `apps/ratewise/src/utils/exchangeRateCalculation.ts`
- Test: `apps/ratewise/src/features/ratewise/hooks/__tests__/useCurrencyConverter.test.tsx`
- Test: `apps/ratewise/src/utils/__tests__/exchangeRateCalculation.test.ts`

- [ ] **Step 1: 建立 provider quote adapter**
      台銀 provider 先包現有 `details/exchangeRates`；MoneyBox provider 先包現有 `moneyBoxRate`。

- [ ] **Step 2: 主匯率只使用 resolved provider**
      `getUnitExchangeRate()` 或其包裝層必須只使用已 resolved 的 provider，不在元件內再決定來源。

- [ ] **Step 3: Phase 1 resolved provider 固定現有來源**
      銀行來源 resolved provider 固定為 `bot`；換錢所來源 resolved provider 固定為 `moneybox`。主匯率行為不得因引入 provider model 而改變。

- [ ] **Step 4: best 模式只回傳資料，不啟用 UI**
      在 `useCurrencyConverter()` 回傳：
  - `resolvedProvider`
  - `providerQuotes`
  - `rankedProviderQuotes`
    但 Phase 1 不顯示推薦 UI。

### Task 6: UI 選單與主匯率呈現（Phase 2 條件啟用）

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/components/RateSelector.tsx`
- Create: `apps/ratewise/src/features/ratewise/components/RateProviderMenu.tsx`
- Modify: `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
- Modify: `apps/ratewise/src/features/ratewise/components/MultiConverter.tsx`
- Test: `apps/ratewise/src/features/ratewise/components/__tests__/RateProviderMenu.test.tsx`

- [ ] **Step 1: 新增 provider 選單但以條件保護**
      選單顯示：
  - 推薦最佳
  - 台銀
  - MoneyBox
  - 未來其他銀行
    但只有 `shouldEnableBankProviderChoice() === true` 時才顯示銀行選單。Phase 1 只有台銀一家銀行，因此不顯示。

- [ ] **Step 2: 主匯率顯示 resolved provider**
      主畫面只顯示 resolved provider 的匯率；如果使用者指定某銀行，主匯率不再顯示推薦 provider。

- [ ] **Step 3: 保持歷史 UI 簡潔**
      歷史列表只顯示時間與分類，不展示 provider 名稱。

### Task 7: 歷史資料 SSOT 與分類篩選

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/types.ts`
- Modify: `apps/ratewise/src/stores/converterStore.ts`
- Modify: `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`
- Modify: `apps/ratewise/src/features/ratewise/components/ConversionHistory.tsx`
- Test: `apps/ratewise/src/stores/__tests__/converterStore.test.ts`
- Test: `apps/ratewise/src/features/ratewise/components/__tests__/ConversionHistory.test.tsx`

- [ ] **Step 1: 擴充 ConversionHistoryEntry**
      新紀錄加入：
  - `rateType`
  - `sourceKind`
  - `providerId`
  - `providerSelectionMode`
  - `schemaVersion`

- [ ] **Step 2: 歷史寫入來源改為 store SSOT**
      移除 hook local history 與 `CONVERSION_HISTORY` 雙軌寫入，改由 store action 管理。

- [ ] **Step 3: 舊資料 migration**
      缺欄位的舊歷史只補安全預設，不推測換錢所。

- [ ] **Step 4: 分類篩選基礎**
      新增可由 UI 使用的分類 derive 函式：
  - `spot`
  - `cash`
  - `exchange-shop`
  - `legacy`

### Task 8: 文件與驗證

**Files:**

- Modify: `docs/superpowers/plans/2026-05-08-conversion-history-ssot.md`
- Modify: `.changeset/*.md`
- Modify: `docs/dev/002_development_reward_penalty_log.md`

- [ ] **Step 1: 同步歷史計劃**
      將既有歷史計劃更新為 `sourceKind + providerId` 架構。

- [ ] **Step 2: 新增 changeset**
      使用 patch 或 minor 依實際 UI 影響決定。

- [ ] **Step 3: 驗證**
      執行：
  - `pnpm vitest run apps/ratewise/src/features/ratewise/__tests__/rateProviderRanking.test.ts`
  - `pnpm vitest run apps/ratewise/src/stores/__tests__/converterStore.test.ts`
  - `pnpm vitest run apps/ratewise/src/features/ratewise/components/__tests__/ConversionHistory.test.tsx`
  - `pnpm --filter @app/ratewise typecheck`

## Implementation Order

1. 先做型別與 registry，不改 UI。
2. 再遷移 store 與歷史，仍固定台銀單一銀行體驗。
3. 再做 ranking 純函式，但不接 UI。
4. 再接計算核心，確保 resolved provider 不改現有結果。
5. 最後預留 UI 選單元件，但以 `bank provider count > 1` 條件關閉。

這個順序讓每一步都能用小型測試驗證，不需要一次改完整頁互動。

## Phase Gate

多銀行推薦功能的啟用條件是：

```ts
getProvidersBySourceKind('bank').length > 1;
```

目前只有台灣銀行 `bot`，因此計劃中的推薦與銀行選單只作為預留架構，不在使用者介面啟用。
