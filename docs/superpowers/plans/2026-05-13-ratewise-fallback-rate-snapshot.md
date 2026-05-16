# RateWise Fallback Rate Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 RateWise build 保持可重現，同時用明確指令與排程持續更新 runtime fallback 匯率快照。

**Architecture:** `prebuild` 只產生 deterministic artifacts，不抓取會漂移的 live market data。`refresh:fallback-rates` 才允許寫入 tracked `build-time-rates.json`，runtime 離線 fallback 讀同一份 generated snapshot，避免硬編碼匯率漂移。

**Tech Stack:** pnpm scripts, Node.js 24 ESM scripts, Vitest, GitHub Actions.

---

### Task 1: 鎖定 package script 契約

**Files:**

- Modify: `apps/ratewise/src/config/__tests__/build-scripts.test.ts`
- Modify: `apps/ratewise/package.json`

- [ ] **Step 1: Write the failing test**

```ts
expect(packageJson.scripts?.['prebuild']).toBe(
  'pnpm generate:deterministic && pnpm verify:artifacts && pnpm refresh:rating',
);
expect(packageJson.scripts?.['refresh:rates']).toBe('node scripts/prebuild-fetch-rates.mjs');
expect(packageJson.scripts?.['refresh:fallback-rates']).toBe(
  'RATEWISE_WRITE_FALLBACK_RATES=1 node scripts/prebuild-fetch-rates.mjs',
);
expect(packageJson.scripts?.['refresh:data']).toBe(
  'pnpm refresh:fallback-rates && pnpm update:seo-examples && pnpm refresh:rating',
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts`

- [ ] **Step 3: Write minimal implementation**

Update `apps/ratewise/package.json` scripts only; do not add dependencies.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts`

### Task 2: 讓 fallback snapshot 寫入變成顯式行為

**Files:**

- Modify: `apps/ratewise/scripts/prebuild-fetch-rates.mjs`
- Modify: `apps/ratewise/src/config/__tests__/build-scripts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(prebuildRatesScript).toContain(
  "const SHOULD_WRITE_FALLBACK_SNAPSHOT = process.env.RATEWISE_WRITE_FALLBACK_RATES === '1';",
);
expect(prebuildRatesScript).toContain('if (SHOULD_WRITE_FALLBACK_SNAPSHOT)');
expect(prebuildRatesScript).toContain("rates.source === 'Default fallback rates'");
expect(prebuildRatesScript).toContain("fs.writeFileSync(BUILD_TIME_RATES_PATH, payload, 'utf-8');");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts`

- [ ] **Step 3: Write minimal implementation**

Gate `BUILD_TIME_RATES_PATH` writes behind `RATEWISE_WRITE_FALLBACK_RATES=1` and fail snapshot updates when the data is script default fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts`

### Task 3: 收斂 runtime fallback SSOT

**Files:**

- Modify: `apps/ratewise/src/services/exchangeRateService.ts`

- [ ] **Step 1: Write the failing test**

Extend the existing static build script test to assert `exchangeRateService.ts` no longer declares `const FALLBACK_RATES`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts`

- [ ] **Step 3: Write minimal implementation**

Use `getBuildTimeExchangeRates()` for the final offline fallback response instead of the hardcoded rate map.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts`

### Task 4: 同步排程與文件

**Files:**

- Modify: `.github/workflows/update-seo-rate-examples.yml`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `apps/ratewise/README.md`
- Modify: `docs/dev/002_development_reward_penalty_log.md`

- [ ] **Step 1: Update the daily workflow**

Run `pnpm --filter @app/ratewise refresh:fallback-rates` before `update-seo-rate-examples.mjs` and add `build-time-rates.json` to `add-paths`.

- [ ] **Step 2: Update docs**

Document that `prebuild` is deterministic, `refresh:data` is an explicit live-data refresh, and committed fallback snapshots are updated by `refresh:fallback-rates`.

- [ ] **Step 3: Verify**

Run:

```bash
pnpm --filter @app/ratewise vitest run src/config/__tests__/build-scripts.test.ts
pnpm --filter @app/ratewise typecheck
pnpm --filter @app/ratewise build
git diff --check
```
