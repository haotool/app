# Conversion History SSOT Plan

> **Status (2026-05-09)：已由 `2026-05-09-rate-provider-ssot.md` Task 7 一併落地。** 歷史欄位（`schemaVersion=2` + `rateType` / `sourceKind` / `providerId` / `providerSelectionMode`）、單一寫入路徑（`useConverterStore.addToHistory`）、legacy `STORAGE_KEYS.CONVERSION_HISTORY` 遷移（不偽造 sourceKind/providerId）、`categorizeHistoryEntry` 分類、reconvert 只重置幣別/金額不重播匯率等行為皆已實作完成。實作落點：`apps/ratewise/src/features/ratewise/types.ts`、`apps/ratewise/src/stores/converterStore.ts`、`apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`。後續 UI 篩選與 Phase 2 銀行明細可直接讀 `categorizeHistoryEntry` 的結果。
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓轉換歷史收斂成單一真實來源，同時維持簡潔 UI：使用者只看到時間與「即期 / 現金 / 換錢所」分類，不顯示多餘技術資訊，並能銜接未來多銀行 provider 與最佳匯率推薦。

**Architecture:** 歷史記錄改為單一路徑管理，避免 `useCurrencyConverter` local state 與 store/localStorage 雙軌漂移。歷史資料補足可篩選欄位：`rateType`、`sourceKind`、`providerId`、`providerSelectionMode`；畫面維持兩層資訊結構，上層是換算結果，下層只顯示時間與分類 tag，不顯示 `rateMode`、`unitRate`、provider 明細等技術細節。從歷史重新帶入換算時，語意維持「帶入幣別與金額重新算一次」，不是重播舊匯率。

**Tech Stack:** React 19、TypeScript、Zustand、Vitest

---

### Task 1: 定義歷史資料 SSOT

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/types.ts`
- Modify: `apps/ratewise/src/stores/converterStore.ts`
- Modify: `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`

- [ ] **Step 1: 收斂歷史資料模型**
      將歷史資料模型統一成單一型別，至少包含：
  - `from`
  - `to`
  - `amount`
  - `result`
  - `timestamp`
  - `rateType`
  - `sourceKind`
  - `providerId`
  - `providerSelectionMode`
  - `schemaVersion`

- [ ] **Step 2: 明確定義不納入列表展示的欄位**
      `providerId` 只作為資料層與未來篩選使用；第一版歷史列表不顯示 `providerId`、`rateMode`、`unitRate`、provider 名稱或 fallback 狀態。

- [ ] **Step 3: 歷史資料只保留單一路徑**
      選定 store 或單一 storage adapter 作為唯一寫入來源，移除 hook local state 與平行 localStorage 管理。

### Task 2: 收斂寫入與重新帶入行為

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`
- Modify: `apps/ratewise/src/pages/Favorites.tsx`

- [ ] **Step 1: addToHistory 寫入當下分類與 provider**
      歷史寫入時同步帶上當下的 `rateType` / `sourceKind` / `providerId` / `providerSelectionMode`，確保列表分類與未來 provider 篩選都能對齊當次換算。

- [ ] **Step 2: reconvert 維持「重新帶入，不重播舊匯率」**
      從歷史重新換算時，只帶回 `from/to/amount`；新的結果仍依目前全域設定計算，避免使用者誤解歷史項目會鎖住舊匯率。

- [ ] **Step 3: migration 與相容舊資料**
      舊歷史若缺 `rateType` / `sourceKind` / `providerId`，以保守預設補齊：
  - `rateType: 'spot'`
  - `sourceKind: 'bank'`
  - `providerId: 'bot'`
  - `providerSelectionMode: 'manual'`

### Task 3: 簡潔 UI 呈現

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/components/ConversionHistory.tsx`
- Modify: `apps/ratewise/src/pages/Favorites.tsx`

- [ ] **Step 1: 保留主行資訊**
      主行只顯示：
  - `amount from`
  - `result to`

- [ ] **Step 2: 次行只顯示時間與分類**
      次行顯示：
  - 相對或絕對時間
  - `即期` 或 `現金`
  - 若 `sourceKind='exchange-shop'`，顯示 `換錢所`

- [ ] **Step 3: 不顯示額外技術細節**
      第一版不顯示：
  - `rateMode`
  - `unitRate`
  - provider 名稱
  - fallback 狀態

### Task 4: 測試與驗證

**Files:**

- Modify/Test: `apps/ratewise/src/features/ratewise/hooks/__tests__/useCurrencyConverter.test.tsx`
- Modify/Test: `apps/ratewise/src/features/ratewise/components/__tests__/ConversionHistory*.test.tsx`
- Modify/Test: `apps/ratewise/src/stores/__tests__/converterStore.test.ts`

- [ ] **Step 1: 歷史寫入測試**
      驗證 `addToHistory()` 會帶上 `rateType` / `sourceKind` / `providerId`。

- [ ] **Step 2: reconvert 行為測試**
      驗證 `reconvertFromHistory()` 只恢復幣別與金額，不覆蓋目前全域設定。

- [ ] **Step 3: UI 顯示測試**
      驗證歷史列表只顯示時間與分類，不露出額外技術資訊。

- [ ] **Step 4: migration 測試**
      驗證舊歷史資料缺欄位時可安全補預設值。
