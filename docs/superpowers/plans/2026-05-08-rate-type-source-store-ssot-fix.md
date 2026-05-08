# Rate Type / Rate Source Store SSOT Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修復 `rateType` / `rateSource` 收斂到 `converterStore` 後的兩個行為回歸，並校正文檔敘述飄移。

**Architecture:** 把 `exchange-shop => cash` 從頁面層習慣做法提升為 store 層不變式，由 `setRateType`、migration patch 與 hydrate sanitize 共同保證。頁面保留現有訂閱方式，只依賴 store action，不再各自補 guard。文檔只描述實際已收斂的範圍，避免把 Favorites 說成也共用 `rateSource`。

**Tech Stack:** React 19、TypeScript、Zustand、Vitest

---

### Task 1: 補出 store 不變式回歸測試

**Files:**

- Modify: `apps/ratewise/src/stores/__tests__/converterStore.test.ts`
- Reference: `apps/ratewise/src/stores/converterStore.ts`

- [ ] **Step 1: 新增 `exchange-shop` 下禁止切回 `spot` 的測試**
      驗證當前 `rateSource='exchange-shop'` 時，就算直接呼叫 `setRateType('spot')`，store 也必須維持 `cash`。

- [ ] **Step 2: 新增 legacy migration 自動收斂到 cash 的測試**
      驗證舊 key 只有 `rateSource='exchange-shop'` 或搭配 `rateType='spot'` 時，hydrate migration 後必須得到 `rateType='cash'`。

- [ ] **Step 3: 新增 sanitize 修復非法組合的測試**
      驗證已 hydrate state 若為 `exchange-shop + spot`，執行 `__validateAndSanitize()` 後會被修正成 `cash`。

### Task 2: 修正 store invariant 與 hydrate 流程

**Files:**

- Modify: `apps/ratewise/src/stores/converterStore.ts`

- [ ] **Step 1: 讓 `setRateType` 尊重 exchange-shop invariant**
      若目前 `rateSource='exchange-shop'`，任何 `setRateType(...)` 都只能落在 `cash`。

- [ ] **Step 2: 讓 sanitize 補齊跨欄位 invariant**
      若 state 為 `rateSource='exchange-shop'` 且 `rateType !== 'cash'`，sanitize patch 必須把 `rateType` 修正為 `cash`。

- [ ] **Step 3: 讓 migration patch 不產生非法組合**
      若 legacy key 顯示 `exchange-shop`，migration patch 必須直接輸出 `rateType='cash'`。

- [ ] **Step 4: 調整 hydrate 後執行順序**
      先 migrate，再 sanitize，避免 migration 把剛修正好的狀態再次改壞。

### Task 3: 修正文檔敘述飄移

**Files:**

- Modify: `.changeset/multi-converter-rate-source-ssot.md`
- Modify: `docs/dev/002_development_reward_penalty_log.md`

- [ ] **Step 1: 修正 Favorites 的敘述範圍**
      保留 Favorites 共用 `rateType` 的事實，但不要把它寫成也共用 `rateSource`，除非真的實作。

- [ ] **Step 2: 保持 002 與 changeset 對同一事實的敘述一致**
      避免 release note 和內部記錄互相打架。

### Task 4: 驗證

**Files:**

- Test: `apps/ratewise/src/stores/__tests__/converterStore.test.ts`
- Test: `apps/ratewise/src/features/ratewise/components/__tests__/MultiConverter.test.tsx`

- [ ] **Step 1: 跑 converterStore 單測**
      Run: `pnpm vitest run apps/ratewise/src/stores/__tests__/converterStore.test.ts`

- [ ] **Step 2: 跑多幣別目標回歸測試**
      Run: `pnpm vitest run apps/ratewise/src/features/ratewise/components/__tests__/MultiConverter.test.tsx -t "(auto 模式應依共用核心顯示基準幣對 TWD 與交叉匯率|exchange-shop 模式應在多幣別顯示換錢所 TWD 配對匯率)"`

- [ ] **Step 3: 跑 `@app/ratewise` typecheck**
      Run: `pnpm --filter @app/ratewise typecheck`
