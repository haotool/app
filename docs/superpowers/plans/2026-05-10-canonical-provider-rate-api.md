# Canonical Provider Rate API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將尚未正式上線的換錢所匯率 API 改為 provider-centric canonical path，避免 `moneybox.json` 特例成為長期技術債。

**Architecture:** `RATE_PROVIDERS` 持續作為 provider API path 的 SSOT。台銀既有公開端點 `latest.json` / `history/{date}.json` 保留；MoneyBox 改為 `/public/rates/providers/moneybox/latest.json` 與 `/public/rates/providers/moneybox/history/{YYYY-MM-DD}.json`，不保留舊 `moneybox.json` alias。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、GitHub Actions、OpenAPI 3.1、靜態 JSON open data。

---

### Task 1: Provider Path SSOT

**Files:**

- Modify: `apps/ratewise/src/config/rateProviders.ts`
- Modify: `apps/ratewise/src/config/api-endpoints.ts`
- Modify: `apps/ratewise/src/config/exchangeShopProviders.ts`
- Test: `apps/ratewise/src/config/__tests__/rateProviders.test.ts`
- Test: `apps/ratewise/src/config/__tests__/exchangeShopProviders.test.ts`

- [ ] **Step 1: Write failing tests**

Add expectations that MoneyBox provider paths and CDN URLs use:

```text
providers/moneybox/latest.json
providers/moneybox/history/{YYYY-MM-DD}.json
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @app/ratewise vitest run src/config/__tests__/rateProviders.test.ts src/config/__tests__/exchangeShopProviders.test.ts
```

Expected: fail because current paths still contain `moneybox.json` and `moneybox-history`.

- [ ] **Step 3: Implement provider path SSOT**

Update MoneyBox `apiPaths` to canonical provider paths and derive exchange shop CDN URLs from the same convention.

- [ ] **Step 4: Run GREEN**

Run the same Vitest command and expect pass.

### Task 2: Runtime History Fetch

**Files:**

- Modify: `apps/ratewise/src/services/moneyboxRateService.ts`
- Test: `apps/ratewise/src/services/__tests__/moneyboxRateService.test.ts`

- [ ] **Step 1: Write failing test**

Update `fetches MoneyBox history through provider metadata endpoints` to expect:

```text
https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/providers/moneybox/history/2026-05-10.json
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @app/ratewise vitest run src/services/__tests__/moneyboxRateService.test.ts
```

Expected: fail on old `moneybox-history` URL.

- [ ] **Step 3: Implement runtime path update**

No service-specific hardcode should remain; service should keep consuming provider metadata endpoints.

- [ ] **Step 4: Run GREEN**

Run the same test and expect pass.

### Task 3: Data Workflow Canonical Output

**Files:**

- Modify: `scripts/fetch-moneybox-rates.js`
- Modify: `.github/workflows/update-moneybox-rates.yml`
- Test: `apps/ratewise/src/config/__tests__/build-scripts.test.ts`

- [ ] **Step 1: Write failing tests**

Update workflow guardrails to require:

```text
public/rates/providers/moneybox/latest.json
public/rates/providers/moneybox/history/
```

and reject:

```text
public/rates/moneybox.json
public/rates/moneybox-history/
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts
```

Expected: fail because workflow still writes old MoneyBox paths.

- [ ] **Step 3: Implement workflow update**

Write latest and daily history under canonical provider path. Purge only canonical URLs.

- [ ] **Step 4: Run GREEN**

Run the same test and expect pass.

### Task 4: Public API Metadata and OpenAPI

**Files:**

- Modify: `apps/ratewise/scripts/generate-api-json.mjs`
- Modify: `apps/ratewise/scripts/generate-openapi.mjs`
- Modify: `apps/ratewise/src/pages/OpenData.tsx`
- Generated: `apps/ratewise/public/api/latest.json`
- Generated: `apps/ratewise/public/openapi.json`
- Test: `apps/ratewise/src/config/__tests__/build-scripts.test.ts`
- Test: `apps/ratewise/src/pages/OpenData.test.tsx`
- Test: `apps/ratewise/src/seo-best-practices.test.ts`

- [ ] **Step 1: Write failing tests**

Assert public metadata and OpenAPI expose `/public/rates/providers/{providerId}/latest.json` and `/public/rates/providers/{providerId}/history/{date}.json`, and do not expose old MoneyBox aliases.

- [ ] **Step 2: Verify RED**

Run targeted tests:

```bash
pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts src/pages/OpenData.test.tsx src/seo-best-practices.test.ts
```

- [ ] **Step 3: Implement generator and page updates**

Keep台銀 legacy endpoints visible. Make provider endpoints canonical and provider-derived.

- [ ] **Step 4: Regenerate public artifacts**

Run:

```bash
pnpm --filter @app/ratewise prebuild
```

- [ ] **Step 5: Run GREEN**

Run targeted tests again.

### Task 5: Verification and Audit

**Files:**

- Modify: `docs/dev/002_development_reward_penalty_log.md`

- [ ] **Step 1: Run focused checks**

```bash
node scripts/verify-ssot-sync.mjs
pnpm --filter @app/ratewise typecheck
pnpm format
git diff --check
```

- [ ] **Step 2: Run PR review audit**

```bash
node scripts/audit-codex-review-threads.mjs --filter unresolved --pr-limit 20 --json
```

- [ ] **Step 3: Update 002**

Add one neutral/reward entry describing canonical provider API convergence and update total score.

- [ ] **Step 4: Commit**

Use a commitlint-compliant Traditional Chinese message.
