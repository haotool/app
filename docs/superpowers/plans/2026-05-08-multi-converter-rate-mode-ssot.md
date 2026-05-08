# Multi Converter Rate Mode / Rate Source SSOT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓多幣別頁面的匯率顯示、實際金額換算與換錢所來源選擇共用同一套 `rateMode` / `rateSource` SSOT，避免 `auto` 顯示錯誤與單幣別/多幣別在 exchange-shop 邏輯上的漂移。

**Architecture:** 保留既有 `useCurrencyConverter` 作為單幣別與多幣別共用換算入口，將 `MultiConverter` 內自算的匯率顯示收斂到 `exchangeRateCalculation.ts` 的共用 API；換錢所匯率則以 `moneyboxRateService` 的 pair resolver 與多幣別 rates map 統一注入。畫面層只負責傳遞 `rateMode` / `rateSource` 與格式化，不再手寫 `sell/sell`、TWD 特判與另一套來源選擇規則。

**Tech Stack:** React 19、TypeScript、Vitest、Testing Library、Zustand

---

### Task 1: 補出會失敗的多幣別匯率模式顯示測試

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/components/__tests__/MultiConverter.test.tsx`
- Reference: `apps/ratewise/src/utils/exchangeRateCalculation.ts`

- [ ] **Step 1: 新增 auto 模式顯示測試**
      驗證 `baseCurrency=USD`、`target=TWD/JPY` 時，顯示必須依 `auto` 使用 `USD.buy / JPY.sell`，不能落回 `sell/sell`。

- [ ] **Step 2: 執行單檔測試確認先失敗**
      Run: `pnpm vitest run apps/ratewise/src/features/ratewise/components/__tests__/MultiConverter.test.tsx`

### Task 2: 讓多幣別顯示改走共用匯率核心

**Files:**

- Modify: `apps/ratewise/src/pages/MultiConverter.tsx`
- Modify: `apps/ratewise/src/features/ratewise/components/MultiConverter.tsx`
- Reference: `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`
- Reference: `apps/ratewise/src/utils/exchangeRateCalculation.ts`

- [ ] **Step 1: page 層把 `rateMode` 傳入 MultiConverter**
      多幣別頁從 `useCurrencyConverter()` 取出 `rateMode`，避免元件自己再猜。

- [ ] **Step 2: 用 `getUnitExchangeRate()` 收斂顯示邏輯**
      移除 `MultiConverter` 內部 `TWD` 特判與 `sell/sell` 交叉匯率計算，統一改成 `1 * getUnitExchangeRate(base, target, ...)`。

- [ ] **Step 3: 對缺資料情況維持既有 UX**
      共用核心回傳 `0` 時仍顯示「無資料」或「計算中」，不改壞現有行為。

### Task 3: 驗證與回歸

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/components/__tests__/MultiConverter.test.tsx`

- [ ] **Step 1: 重跑目標測試**
      Run: `pnpm vitest run apps/ratewise/src/features/ratewise/components/__tests__/MultiConverter.test.tsx`

- [ ] **Step 2: 視需要補跑共用匯率測試**
      Run: `pnpm vitest run apps/ratewise/src/utils/__tests__/exchangeRateCalculation.test.ts`

- [ ] **Step 3: 確認沒有新增不必要的顯示邏輯分叉**
      檢查 `MultiConverter` 是否只做格式化與渲染，不再持有另一份匯率規則。
