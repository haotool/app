# Provider SSOT Production Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 provider registry、provider quote 建立與公開 API metadata 收斂到生產級 SSOT，讓未來新增第二家銀行時只需新增 provider config、資料 adapter 與測試。

**Architecture:** Runtime 以 `RATE_PROVIDERS` 作為 provider metadata SSOT，`buildProviderQuotes()` 只枚舉 registry 並委派 adapter，不在 hook 內硬寫 provider。公開 API metadata 由 `rateProviderPublicMetadata.ts` 產生，API JSON、OpenAPI 與 Open Data 共用同一份 provider contract。

**Tech Stack:** React 19、TypeScript、Zustand、Vitest、OpenAPI 3.1。

---

### Task 1: Registry enumeration SSOT

**Files:**

- Modify: `apps/ratewise/src/config/rateProviders.ts`
- Test: `apps/ratewise/src/config/__tests__/rateProviders.test.ts`

- [x] **Step 1: Add failing test**
      Assert `getAllRateProviders()` returns all registered providers sorted by source/priority and has no separate hardcoded provider list.

- [x] **Step 2: Implement registry enumeration**
      Export `getAllRateProviders()` and derive source-kind queries from it.

### Task 2: Provider quote adapter SSOT

**Files:**

- Create: `apps/ratewise/src/features/ratewise/rateProviderQuoteAdapters.ts`
- Test: `apps/ratewise/src/features/ratewise/__tests__/rateProviderQuoteAdapters.test.ts`
- Modify: `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`

- [x] **Step 1: Add failing tests**
      Assert `buildProviderQuotes()` can include an injected future bank adapter without changing hook code.

- [x] **Step 2: Extract adapter layer**
      Move bot/MoneyBox quote construction out of `useCurrencyConverter` into adapter functions.

### Task 3: Public provider metadata SSOT

**Files:**

- Create: `apps/ratewise/src/config/rateProviderPublicMetadata.ts`
- Modify: `apps/ratewise/scripts/generate-api-json.mjs`
- Modify: `apps/ratewise/scripts/generate-openapi.mjs`
- Modify: `apps/ratewise/src/pages/OpenData.tsx`
- Test: `apps/ratewise/src/config/__tests__/build-scripts.test.ts`

- [x] **Step 1: Add failing tests**
      Assert generators and Open Data page import the shared metadata builder and do not locally enumerate `bot` / `moneybox`.

- [x] **Step 2: Implement metadata builder**
      Generate providerSelection and provider endpoint metadata from `RATE_PROVIDERS`.

### Task 4: Review and verification

**Files:**

- Modify: tests and docs as needed.

- [x] **Step 1: Run focused tests**
      Run provider registry, quote adapter and build script sentinel tests.

- [x] **Step 2: Run typecheck and formatting**
      Run RateWise typecheck, Prettier check and `git diff --check`.
