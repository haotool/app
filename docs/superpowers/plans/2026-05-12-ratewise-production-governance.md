# RateWise Production Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring RateWise back to a production-grade baseline by fixing delivery gates, removing internal production surface area, restoring error observability, tightening QA gates, clarifying build artifacts, and reducing route/SEO drift risk.

**Architecture:** Execute in phases with minimal behavioral blast radius. Start with hard quality gates and public route surface, then improve error classification, QA coverage, artifact policy, and finally route registry convergence. Each phase should be independently reviewable and shippable.

**Tech Stack:** React 19, TypeScript, Vite 8, vite-react-ssg, Vitest, Playwright, pnpm workspace, existing RateWise SEO/PWA scripts.

---

## File Map

- Modify: `apps/ratewise/src/features/ratewise/__tests__/rateProviderRanking.test.ts`
  - Fix ESLint `consistent-type-imports` warning.
- Modify: `apps/ratewise/src/features/ratewise/components/__tests__/RateProviderMenu.test.tsx`
  - Fix ESLint `consistent-type-imports` warnings in dynamic import mock typing.
- Modify: `apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.trend.test.tsx`
  - Fix ESLint `consistent-type-imports` warning around `importOriginal` typing.
- Modify: `apps/ratewise/src/routes.tsx`
  - Gate internal-only routes out of production route table.
- Modify: `apps/ratewise/src/config/seo-paths.ts`
  - Split app-only public noindex routes from internal-only routes, and remove internal-only routes from production prerender paths.
- Modify or create: `apps/ratewise/src/config/__tests__/route-surface.test.ts`
  - Assert internal-only routes are not in production public/prerender surface.
- Modify: `apps/ratewise/src/main.tsx`
  - Replace broad `Failed to fetch` suppression with precise error classification.
- Modify: `apps/ratewise/src/suppress-hydration-warning.ts`
  - Restrict or remove production global console monkey patch.
- Create: `apps/ratewise/src/utils/errorClassification.ts`
  - Centralize chunk/history/generic fetch classification helpers.
- Create: `apps/ratewise/src/utils/__tests__/errorClassification.test.ts`
  - Cover expected and non-expected rejection classification.
- Modify: `apps/ratewise/tests/e2e/accessibility.spec.ts`
  - Convert critical skipped/fixme accessibility checks into scoped assertions.
- Modify: `apps/ratewise/tests/e2e/offline-pwa.spec.ts`
  - Restore at least one reliable offline indicator scenario or explicitly move it into scheduled gate.
- Modify: `apps/ratewise/tests/e2e/trend-chart-latency.spec.ts`
  - Convert skipped trend latency test into a runnable scheduled/performance test or document gate ownership in config.
- Modify: `apps/ratewise/tests/e2e/cloudflare-cache.spec.ts`
  - Keep production guard but make it workflow-friendly.
- Modify or create: `.github/workflows/ratewise-production-governance.yml`
  - Scheduled/release gate for live production checks if no existing workflow owns this.
- Modify: `apps/ratewise/package.json`
  - Add explicit artifact/data refresh scripts only if needed.
- Modify: `apps/ratewise/README.md`
  - Align quality and artifact policy with actual gates.
- Modify: `AGENTS.md`, `CLAUDE.md`
  - Sync route, QA, and generated artifact policies if implementation changes those rules.
- Modify: `docs/dev/002_development_reward_penalty_log.md`
  - Required before any commit, per repo SOP.
- Create later: `apps/ratewise/src/config/currencyLandingRouteRegistry.ts`
  - Registry for currency landing route metadata.
- Create later: `apps/ratewise/src/config/__tests__/currencyLandingRouteRegistry.test.ts`
  - Consistency tests before route generation refactor.

## Task 0: Baseline Cleanup

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/__tests__/rateProviderRanking.test.ts`
- Modify: `apps/ratewise/src/features/ratewise/components/__tests__/RateProviderMenu.test.tsx`
- Modify: `apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.trend.test.tsx`
- Modify: `docs/dev/002_development_reward_penalty_log.md` before commit

- [ ] **Step 1: Reproduce the failing gate**

Run:

```bash
pnpm --filter @app/ratewise lint
```

Expected: FAIL with 4 `@typescript-eslint/consistent-type-imports` warnings and exit status 1.

- [ ] **Step 2: Fix dynamic import type annotations in tests**

Replace inline `typeof import('...')` type annotations with top-level type-only aliases.

For `RateProviderMenu.test.tsx`, add near imports:

```ts
import type * as RateProvidersModule from '../../../../config/rateProviders';
```

Then change mocked import blocks from:

```ts
const actual = await vi.importActual<typeof import('../../../../config/rateProviders')>(
  '../../../../config/rateProviders',
);
```

to:

```ts
const actual = await vi.importActual<typeof RateProvidersModule>(
  '../../../../config/rateProviders',
);
```

For `SingleConverter.trend.test.tsx`, add near imports:

```ts
import type * as MoneyboxRateServiceModule from '../../../../services/moneyboxRateService';
```

Then change:

```ts
const actual = await importOriginal<typeof import('../../../../services/moneyboxRateService')>();
```

to:

```ts
const actual = await importOriginal<typeof MoneyboxRateServiceModule>();
```

For `rateProviderRanking.test.ts`, locate the reported line and apply the same pattern: convert inline `typeof import('...')` to a top-level `import type * as ...Module from '...'`.

- [ ] **Step 3: Verify lint is clean**

Run:

```bash
pnpm --filter @app/ratewise lint
```

Expected: PASS with 0 warnings.

- [ ] **Step 4: Verify typecheck still passes**

Run:

```bash
pnpm --filter @app/ratewise typecheck
```

Expected: PASS.

- [ ] **Step 5: Update 002 log for baseline cleanup**

Append one neutral or reward entry using the current four-line format in `docs/dev/002_development_reward_penalty_log.md`.

Entry content:

```markdown
- 日期：2026-05-12
- ID：reward-ratewise-lint-baseline
- 原因：RateWise lint gate 因 test type import warning 無法通過
- 解法：修正測試檔 type-only import 寫法並恢復 0 warning baseline
```

Also update the file's score summary according to its current SSOT formula.

- [ ] **Step 6: Commit baseline cleanup**

Run:

```bash
git add apps/ratewise/src/features/ratewise/__tests__/rateProviderRanking.test.ts \
  apps/ratewise/src/features/ratewise/components/__tests__/RateProviderMenu.test.tsx \
  apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.trend.test.tsx \
  docs/dev/002_development_reward_penalty_log.md
git commit -m "fix(ratewise): 修復 lint 基線

- 修正測試檔動態 import type annotation 警告
- 恢復 RateWise lint 0 warning 品質閘門

測試：pnpm --filter @app/ratewise lint；pnpm --filter @app/ratewise typecheck"
```

Expected: commit succeeds and commitlint passes.

## Task 1: Product Surface Governance

**Files:**

- Modify: `apps/ratewise/src/routes.tsx`
- Modify: `apps/ratewise/src/config/seo-paths.ts`
- Create: `apps/ratewise/src/config/__tests__/route-surface.test.ts`
- Modify: `docs/dev/002_development_reward_penalty_log.md` before commit

- [ ] **Step 1: Write failing route surface tests**

Create `apps/ratewise/src/config/__tests__/route-surface.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { APP_ONLY_NOINDEX_PATHS, DEV_ONLY_PATHS, PRERENDER_PATHS, APP_CONFIG } from '../seo-paths';

const internalOnlyRoutes = [
  '/theme-showcase/',
  '/color-scheme/',
  '/update-prompt-test/',
  '/ui-showcase/',
] as const;

describe('RateWise public route surface', () => {
  it('keeps only real user app routes in public noindex app paths', () => {
    expect(APP_ONLY_NOINDEX_PATHS).toEqual(['/multi/', '/favorites/', '/settings/']);
  });

  it('keeps internal-only routes out of production prerender paths', () => {
    for (const route of internalOnlyRoutes) {
      expect(PRERENDER_PATHS).not.toContain(route);
    }
  });

  it('keeps internal-only routes out of production app shell paths', () => {
    for (const route of internalOnlyRoutes) {
      expect(APP_CONFIG.appShellPaths).not.toContain(route);
    }
  });

  it('tracks internal-only routes separately for development tooling', () => {
    expect(DEV_ONLY_PATHS).toEqual([...internalOnlyRoutes]);
  });
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
pnpm --filter @app/ratewise exec vitest run src/config/__tests__/route-surface.test.ts
```

Expected: FAIL because internal-only routes are currently included in `PRERENDER_PATHS` / `APP_CONFIG.appShellPaths`.

- [ ] **Step 3: Split public app paths and internal paths**

In `apps/ratewise/src/config/seo-paths.ts`, replace the current `APP_ONLY_PATHS` block with:

```ts
export const APP_ONLY_NOINDEX_PATHS = ['/multi/', '/favorites/', '/settings/'] as const;

export const DEV_ONLY_PATHS = [
  '/theme-showcase/',
  '/color-scheme/',
  '/update-prompt-test/',
  '/ui-showcase/',
] as const;

export const APP_ONLY_PATHS = [...APP_ONLY_NOINDEX_PATHS] as const;

export const APP_ONLY_PRERENDER_PATHS = [...APP_ONLY_NOINDEX_PATHS] as const;
```

Keep `DEV_ONLY_PATHS` exported so robots/dev tooling can still reference it.

- [ ] **Step 4: Gate internal-only route records in `routes.tsx`**

Add near route helpers:

```ts
const shouldEnableInternalRoutes =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_INTERNAL_ROUTES === 'true';
```

Replace the internal route entries at the bottom with a spread:

```tsx
  ...(shouldEnableInternalRoutes
    ? [
        createLazyRoute(
          '/color-scheme',
          () => import('./pages/ColorSchemeComparison'),
          'src/pages/ColorSchemeComparison.tsx',
        ),
        createLazyRoute(
          '/update-prompt-test',
          () => import('./pages/UpdatePromptTest'),
          'src/pages/UpdatePromptTest.tsx',
        ),
        createLazyRoute('/ui-showcase', () => import('./pages/UIShowcase'), 'src/pages/UIShowcase.tsx'),
      ]
    : []),
```

Gate `theme-showcase` child route the same way inside `children`:

```tsx
      ...(shouldEnableInternalRoutes
        ? [
            {
              path: 'theme-showcase',
              lazy: async () => {
                try {
                  const module = await import('./pages/ThemeShowcase');
                  return { Component: module.default };
                } catch (error) {
                  return { Component: () => <OfflineAwareFallback error={error} /> };
                }
              },
            },
          ]
        : []),
```

- [ ] **Step 5: Run route surface tests**

Run:

```bash
pnpm --filter @app/ratewise exec vitest run src/config/__tests__/route-surface.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run SEO surface tests**

Run:

```bash
pnpm --filter @app/ratewise exec vitest run src/__tests__/seo-public-surface.test.ts src/prerender.test.ts
```

Expected: PASS. If a test expects internal routes to be prerendered, update that test to reflect this spec: production prerender excludes internal-only routes.

- [ ] **Step 7: Build smoke**

Run:

```bash
pnpm --filter @app/ratewise build
```

Expected: PASS. After build, inspect `git status --short`; only deterministic generated changes expected by build policy may appear.

- [ ] **Step 8: Update 002 log and commit**

Append:

```markdown
- 日期：2026-05-12
- ID：reward-ratewise-public-surface-governance
- 原因：內部展示與測試頁仍存在於正式路由與 prerender surface
- 解法：將 internal-only routes 從 production route/prerender surface 移除並補測試
```

Commit:

```bash
git add apps/ratewise/src/routes.tsx \
  apps/ratewise/src/config/seo-paths.ts \
  apps/ratewise/src/config/__tests__/route-surface.test.ts \
  docs/dev/002_development_reward_penalty_log.md
git commit -m "fix(ratewise): 收斂正式公開路由表面

- 將內部展示與測試頁排除於 production route surface
- 補上 route surface 測試避免 prerender 與 app shell 漂移

測試：pnpm --filter @app/ratewise exec vitest run src/config/__tests__/route-surface.test.ts src/__tests__/seo-public-surface.test.ts src/prerender.test.ts；pnpm --filter @app/ratewise build"
```

## Task 2: Error Observability And Hydration Policy

**Files:**

- Create: `apps/ratewise/src/utils/errorClassification.ts`
- Create: `apps/ratewise/src/utils/__tests__/errorClassification.test.ts`
- Modify: `apps/ratewise/src/main.tsx`
- Modify: `apps/ratewise/src/suppress-hydration-warning.ts`
- Modify: `docs/dev/002_development_reward_penalty_log.md` before commit

- [ ] **Step 1: Write error classification helper tests**

Create `apps/ratewise/src/utils/__tests__/errorClassification.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classifyUnhandledRejection, isHydrationSuppressionEnabled } from '../errorClassification';

describe('classifyUnhandledRejection', () => {
  it('classifies chunk load errors before generic fetch errors', () => {
    expect(
      classifyUnhandledRejection(new TypeError('Failed to fetch dynamically imported module')),
    ).toBe('chunk-load');
  });

  it('classifies verified history endpoint 404 as expected history miss', () => {
    expect(
      classifyUnhandledRejection(
        new Error(
          'GET https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2026-05-12.json 404',
        ),
      ),
    ).toBe('expected-history-miss');
  });

  it('does not classify generic Failed to fetch as expected history miss', () => {
    expect(classifyUnhandledRejection(new TypeError('Failed to fetch'))).toBe(
      'generic-fetch-failure',
    );
  });

  it('classifies unrelated errors as unknown', () => {
    expect(classifyUnhandledRejection(new Error('Unexpected application state'))).toBe('unknown');
  });
});

describe('isHydrationSuppressionEnabled', () => {
  it('only enables suppression for explicit non-production diagnostics', () => {
    expect(isHydrationSuppressionEnabled({ prod: true, flag: 'true' })).toBe(false);
    expect(isHydrationSuppressionEnabled({ prod: false, flag: 'true' })).toBe(true);
    expect(isHydrationSuppressionEnabled({ prod: false, flag: undefined })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the new tests and verify they fail**

Run:

```bash
pnpm --filter @app/ratewise exec vitest run src/utils/__tests__/errorClassification.test.ts
```

Expected: FAIL because `errorClassification.ts` does not exist.

- [ ] **Step 3: Implement `errorClassification.ts`**

Create `apps/ratewise/src/utils/errorClassification.ts`:

```ts
import { isChunkLoadError } from './chunkLoadRecovery';

export type UnhandledRejectionKind =
  | 'chunk-load'
  | 'expected-history-miss'
  | 'generic-fetch-failure'
  | 'unknown';

function getErrorMessage(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  if (typeof reason === 'string') {
    return reason;
  }
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const message = (reason as { message: unknown }).message;
    return typeof message === 'string' ? message : JSON.stringify(reason);
  }
  return '';
}

function isVerifiedHistoryMiss(message: string): boolean {
  return /\/rates\/history\/[^/\s]+\.json/i.test(message) && /\b404\b/.test(message);
}

export function classifyUnhandledRejection(reason: unknown): UnhandledRejectionKind {
  const error = reason instanceof Error ? reason : new Error(getErrorMessage(reason));
  const message = getErrorMessage(reason);

  if (isChunkLoadError(error)) {
    return 'chunk-load';
  }

  if (isVerifiedHistoryMiss(message)) {
    return 'expected-history-miss';
  }

  if (message.includes('Failed to fetch')) {
    return 'generic-fetch-failure';
  }

  return 'unknown';
}

export function getUnhandledRejectionMessage(reason: unknown): string {
  return getErrorMessage(reason);
}

export function toError(reason: unknown): Error {
  return reason instanceof Error
    ? reason
    : new Error(getErrorMessage(reason) || 'Unhandled rejection');
}

export function isHydrationSuppressionEnabled(input: {
  prod: boolean;
  flag: string | undefined;
}): boolean {
  return !input.prod && input.flag === 'true';
}
```

- [ ] **Step 4: Replace broad classification in `main.tsx`**

Import helpers:

```ts
import {
  classifyUnhandledRejection,
  getUnhandledRejectionMessage,
  toError,
} from './utils/errorClassification';
```

In the `unhandledrejection` listener, replace manual string classification with:

```ts
const reason: unknown = event.reason;
const errorMessage = getUnhandledRejectionMessage(reason);
const errorObject = toError(reason);
const rejectionKind = classifyUnhandledRejection(reason);

if (rejectionKind === 'chunk-load') {
  logger.warn('Chunk load error captured by global handler', { reason: errorMessage });
  recordPwaDiagnostic('chunk-load-error', errorMessage, 'error');
  event.preventDefault();
  void recoverFromChunkLoadError();
  return;
}

if (rejectionKind === 'expected-history-miss') {
  logger.debug('Historical data fetch failed (expected)', { reason: errorMessage });
  event.preventDefault();
  return;
}

if (rejectionKind === 'generic-fetch-failure') {
  logger.warn('Generic fetch failure captured by global handler', { reason: errorMessage });
  recordPwaDiagnostic('generic-fetch-failure', errorMessage, 'warn');
  return;
}

logger.error('Unhandled promise rejection', errorObject);
recordPwaDiagnostic('unhandled-rejection', errorMessage || errorObject.message, 'error');
```

- [ ] **Step 5: Restrict hydration suppression**

In `apps/ratewise/src/suppress-hydration-warning.ts`, import:

```ts
import { isHydrationSuppressionEnabled } from './utils/errorClassification';
```

Wrap the existing suppression body:

```ts
if (
  typeof window !== 'undefined' &&
  isHydrationSuppressionEnabled({
    prod: import.meta.env.PROD,
    flag: import.meta.env.VITE_SUPPRESS_HYDRATION_WARNINGS,
  })
) {
  // existing suppression body
}
```

This keeps an explicit non-production diagnostic escape hatch but prevents production from hiding hydration errors.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @app/ratewise exec vitest run src/utils/__tests__/errorClassification.test.ts src/utils/__tests__/chunkLoadRecovery.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run broader app startup tests**

Run:

```bash
pnpm --filter @app/ratewise typecheck
pnpm --filter @app/ratewise exec vitest run src/__tests__/sw.test.ts src/bootstrap/pwa-recovery-bootstrap.test.ts
```

Expected: PASS.

- [ ] **Step 8: Update 002 log and commit**

Append:

```markdown
- 日期：2026-05-12
- ID：reward-ratewise-error-observability
- 原因：hydration 與 fetch 類錯誤被全域 suppression 遮蔽
- 解法：集中錯誤分類並限制 production hydration suppression
```

Commit:

```bash
git add apps/ratewise/src/utils/errorClassification.ts \
  apps/ratewise/src/utils/__tests__/errorClassification.test.ts \
  apps/ratewise/src/main.tsx \
  apps/ratewise/src/suppress-hydration-warning.ts \
  docs/dev/002_development_reward_penalty_log.md
git commit -m "fix(ratewise): 改善全域錯誤可觀測性

- 將 unhandled rejection 改為集中分類
- 限制 production hydration suppression 避免遮蔽真錯誤

測試：pnpm --filter @app/ratewise exec vitest run src/utils/__tests__/errorClassification.test.ts src/utils/__tests__/chunkLoadRecovery.test.ts src/__tests__/sw.test.ts src/bootstrap/pwa-recovery-bootstrap.test.ts；pnpm --filter @app/ratewise typecheck"
```

## Task 3: QA Gate Governance

**Files:**

- Modify: `apps/ratewise/tests/e2e/accessibility.spec.ts`
- Modify: `apps/ratewise/tests/e2e/offline-pwa.spec.ts`
- Modify: `apps/ratewise/tests/e2e/trend-chart-latency.spec.ts`
- Modify: `apps/ratewise/tests/e2e/cloudflare-cache.spec.ts`
- Create or modify: `.github/workflows/ratewise-production-governance.yml`
- Modify: `docs/dev/002_development_reward_penalty_log.md` before commit

- [ ] **Step 1: Inventory active skips**

Run:

```bash
rg -n "test\\.skip|test\\.fixme|describe\\.skip|describe\\.fixme|skipIf" apps/ratewise/tests/e2e apps/ratewise/src
```

Expected: list includes accessibility, offline PWA, trend latency, production Cloudflare checks, and generated-file conditional skips.

- [ ] **Step 2: Convert accessibility checks from passive warnings to scoped assertions**

In `apps/ratewise/tests/e2e/accessibility.spec.ts`, keep multi-currency scan either runnable or explicitly tagged for a dedicated project. Replace warning-only label check with assertion:

```ts
expect
  .soft(hasLabel, `input ${i} should have aria-label, aria-labelledby, or label[for]`)
  .toBe(true);
```

Replace skipped button name test with:

```ts
test('可見按鈕應該有 accessible name', async ({ rateWisePage: page }) => {
  const buttons = page.locator('button:visible');
  const buttonCount = await buttons.count();

  for (let i = 0; i < buttonCount; i += 1) {
    const button = buttons.nth(i);
    const name = await button.evaluate(
      (element) => element.getAttribute('aria-label') || element.textContent || '',
    );
    expect
      .soft(name.trim().length, `button ${i} should expose an accessible name`)
      .toBeGreaterThan(0);
  }
});
```

- [ ] **Step 3: Restore one offline indicator gate**

In `apps/ratewise/tests/e2e/offline-pwa.spec.ts`, unskip the shortest indicator visibility test if it passes with current fixtures. If the existing PWA environment remains unstable, create a component-level Playwright route test instead and leave a comment pointing to the scheduled full PWA gate.

Runnable minimum assertion:

```ts
test('should show offline indicator when network disconnects', async ({ page }) => {
  const offlinePage = new OfflinePWAPage(page);
  await offlinePage.goto();
  await offlinePage.waitForPrecache();
  await offlinePage.goOffline();
  await expect(offlinePage.offlineIndicator).toBeVisible({ timeout: 10_000 });
  await offlinePage.goOnline();
});
```

- [ ] **Step 4: Move trend chart latency into an explicit performance gate**

If the test is stable locally, remove `test.skip` from the trend latency test. If it is not stable in PR CI, keep it behind an env guard:

```ts
const isPerformanceGate = process.env['RUN_RATEWISE_PERFORMANCE_TESTS'] === 'true';

test.skip(
  !isPerformanceGate,
  'Set RUN_RATEWISE_PERFORMANCE_TESTS=true to run trend latency budget',
);
```

This is acceptable only if a workflow in this task runs it on schedule.

- [ ] **Step 5: Add scheduled production governance workflow**

Create `.github/workflows/ratewise-production-governance.yml` if no existing workflow owns these gates:

```yaml
name: RateWise Production Governance

on:
  workflow_dispatch:
  schedule:
    - cron: '17 20 * * *'

jobs:
  production-governance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
        with:
          version: 9.10.0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @app/ratewise exec playwright install --with-deps chromium
      - run: RUN_PRODUCTION_TESTS=true pnpm --filter @app/ratewise exec playwright test tests/e2e/cloudflare-cache.spec.ts --project=chromium
      - run: RUN_RATEWISE_PERFORMANCE_TESTS=true pnpm --filter @app/ratewise exec playwright test tests/e2e/trend-chart-latency.spec.ts --project=chromium
```

- [ ] **Step 6: Run local QA focused checks**

Run:

```bash
pnpm --filter @app/ratewise exec playwright test tests/e2e/accessibility.spec.ts --project=chromium
```

Expected: PASS. If browser dependencies are missing locally, install with:

```bash
pnpm --filter @app/ratewise exec playwright install chromium
```

- [ ] **Step 7: Verify workflow YAML parses**

Run:

```bash
pnpm exec prettier --check .github/workflows/ratewise-production-governance.yml
```

Expected: PASS.

- [ ] **Step 8: Update 002 log and commit**

Append:

```markdown
- 日期：2026-05-12
- ID：reward-ratewise-qa-gate-governance
- 原因：使用者可感知功能存在未追蹤 skip/fixme 與手動 production checks
- 解法：恢復核心 accessibility/offline/performance gate 並加入 scheduled production governance
```

Commit:

```bash
git add apps/ratewise/tests/e2e/accessibility.spec.ts \
  apps/ratewise/tests/e2e/offline-pwa.spec.ts \
  apps/ratewise/tests/e2e/trend-chart-latency.spec.ts \
  apps/ratewise/tests/e2e/cloudflare-cache.spec.ts \
  .github/workflows/ratewise-production-governance.yml \
  docs/dev/002_development_reward_penalty_log.md
git commit -m "test(ratewise): 補強生產級 QA 閘門

- 將核心無障礙與離線體驗納入可執行驗證
- 加入 scheduled production governance workflow 覆蓋 live headers 與效能預算

測試：pnpm --filter @app/ratewise exec playwright test tests/e2e/accessibility.spec.ts --project=chromium；pnpm exec prettier --check .github/workflows/ratewise-production-governance.yml"
```

## Task 4: Build Reproducibility And Artifact Hygiene

**Files:**

- Modify: `apps/ratewise/package.json`
- Modify: `apps/ratewise/README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Possibly remove from tracking: `apps/ratewise/lighthouse-report.json`, `apps/ratewise/tsconfig.node.tsbuildinfo`, `apps/ratewise/tsconfig.tsbuildinfo`
- Modify: `docs/dev/002_development_reward_penalty_log.md` before commit

- [ ] **Step 1: Classify tracked artifacts**

Run:

```bash
git ls-files apps/ratewise | rg '(^|/)(lighthouse-report|tsconfig.*tsbuildinfo|dist|coverage|playwright-report|test-results)'
```

Expected: currently shows tracked historical artifacts that should be reviewed.

- [ ] **Step 2: Confirm ignored local artifacts**

Run:

```bash
git status --ignored --short apps/ratewise | sed -n '1,160p'
```

Expected: local QA artifacts show as ignored, not tracked.

- [ ] **Step 3: Add explicit scripts if missing**

In `apps/ratewise/package.json`, add scripts only if they do not already exist:

```json
{
  "scripts": {
    "refresh:data": "node scripts/prebuild-fetch-rates.mjs && SEO_RATE_EXAMPLES_OPTIONAL=1 node scripts/update-seo-rate-examples.mjs && node scripts/fetch-rating-snapshot.mjs",
    "generate:deterministic": "node ../../scripts/generate-sitemap-2026.mjs && node scripts/generate-robots-txt.mjs && node scripts/generate-manifest.mjs && node scripts/generate-offline-html.mjs && node scripts/generate-llms-txt.mjs && node scripts/generate-markdown-mirrors.mjs && node scripts/generate-api-json.mjs && node scripts/generate-pair-json.mjs && node scripts/generate-openapi.mjs",
    "verify:artifacts": "node ../../scripts/verify-ssot-sync.mjs && node ../../scripts/verify-image-resources.mjs && node scripts/verify-seo-ssot.mjs"
  }
}
```

Do not change `prebuild` behavior in the same step unless tests prove the new scripts are equivalent.

- [ ] **Step 4: Document generated artifact policy**

Update `apps/ratewise/README.md` with a short section:

```markdown
## Generated Artifacts

RateWise separates generated files into three buckets:

- Deterministic generated artifacts: rebuilt from repo SSOT by `pnpm --filter @app/ratewise generate:deterministic`.
- Live data snapshots: refreshed by `pnpm --filter @app/ratewise refresh:data` and committed only when the task explicitly updates data snapshots.
- Local QA artifacts: `dist/`, `coverage/`, `playwright-report/`, `test-results/`, Lighthouse reports, and squirrel outputs are local verification outputs and must not be committed.
```

Mirror the same policy in `AGENTS.md` and `CLAUDE.md` if those files currently define build or artifact policy.

- [ ] **Step 5: Remove historical local artifacts from tracking if approved**

Only remove tracked artifacts that are not used by tests or docs. Use:

```bash
git rm --cached apps/ratewise/lighthouse-report.json apps/ratewise/tsconfig.node.tsbuildinfo apps/ratewise/tsconfig.tsbuildinfo
```

Expected: files remain locally if ignored, but are removed from source tracking.

- [ ] **Step 6: Verify scripts**

Run:

```bash
pnpm --filter @app/ratewise run verify:artifacts
pnpm --filter @app/ratewise typecheck
```

Expected: PASS.

- [ ] **Step 7: Update 002 log and commit**

Append:

```markdown
- 日期：2026-05-12
- ID：reward-ratewise-artifact-governance
- 原因：build/generated/local QA artifacts 責任混雜且歷史產物污染追蹤
- 解法：文件化 artifact 分類並建立明確 refresh/generate/verify 指令
```

Commit:

```bash
git add apps/ratewise/package.json apps/ratewise/README.md AGENTS.md CLAUDE.md \
  docs/dev/002_development_reward_penalty_log.md
git add -u apps/ratewise/lighthouse-report.json apps/ratewise/tsconfig.node.tsbuildinfo apps/ratewise/tsconfig.tsbuildinfo
git commit -m "docs(ratewise): 建立生成產物治理規範

- 區分 deterministic artifacts、live data snapshots 與 local QA artifacts
- 補上明確 refresh/generate/verify 指令與文件同步

測試：pnpm --filter @app/ratewise run verify:artifacts；pnpm --filter @app/ratewise typecheck"
```

## Task 5: Currency Route Architecture Convergence

**Files:**

- Create: `apps/ratewise/src/config/currencyLandingRouteRegistry.ts`
- Create: `apps/ratewise/src/config/__tests__/currencyLandingRouteRegistry.test.ts`
- Modify later: `apps/ratewise/src/routes.tsx`
- Modify later: `apps/ratewise/src/config/seo-paths.ts`
- Modify: `docs/dev/002_development_reward_penalty_log.md` before commit

- [ ] **Step 1: Write registry consistency tests**

Create `apps/ratewise/src/config/__tests__/currencyLandingRouteRegistry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CURRENCY_LANDING_ROUTES,
  FORWARD_CURRENCY_LANDING_ROUTES,
  REVERSE_CURRENCY_LANDING_ROUTES,
} from '../currencyLandingRouteRegistry';

describe('currencyLandingRouteRegistry', () => {
  it('contains 17 forward and 17 reverse currency landing routes', () => {
    expect(FORWARD_CURRENCY_LANDING_ROUTES).toHaveLength(17);
    expect(REVERSE_CURRENCY_LANDING_ROUTES).toHaveLength(17);
    expect(CURRENCY_LANDING_ROUTES).toHaveLength(34);
  });

  it('uses canonical slash-wrapped paths', () => {
    for (const route of CURRENCY_LANDING_ROUTES) {
      expect(route.path).toMatch(/^\/[a-z]{3}-[a-z]{3}\/$/);
      expect(route.amountPathPattern).toBe(`${route.path}:amount/`);
    }
  });

  it('does not duplicate canonical paths', () => {
    const paths = CURRENCY_LANDING_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
```

- [ ] **Step 2: Run registry tests and verify they fail**

Run:

```bash
pnpm --filter @app/ratewise exec vitest run src/config/__tests__/currencyLandingRouteRegistry.test.ts
```

Expected: FAIL because registry does not exist.

- [ ] **Step 3: Create registry with existing route metadata**

Create `apps/ratewise/src/config/currencyLandingRouteRegistry.ts`:

```ts
export type CurrencyLandingDirection = 'foreign-to-twd' | 'twd-to-foreign';

export interface CurrencyLandingRouteDefinition {
  direction: CurrencyLandingDirection;
  from: string;
  to: string;
  path: `/${string}-${string}/`;
  amountPathPattern: `/${string}-${string}/:amount/`;
  entry: string;
}

const forwardCodes = [
  'aud',
  'cad',
  'chf',
  'cny',
  'eur',
  'gbp',
  'hkd',
  'idr',
  'jpy',
  'krw',
  'myr',
  'nzd',
  'php',
  'sgd',
  'thb',
  'usd',
  'vnd',
] as const;

function pageName(from: string, to: string): string {
  return `${from.toUpperCase()}To${to.toUpperCase()}`;
}

export const FORWARD_CURRENCY_LANDING_ROUTES = forwardCodes.map((code) => ({
  direction: 'foreign-to-twd',
  from: code.toUpperCase(),
  to: 'TWD',
  path: `/${code}-twd/`,
  amountPathPattern: `/${code}-twd/:amount/`,
  entry: `src/pages/${pageName(code, 'twd')}.tsx`,
})) satisfies readonly CurrencyLandingRouteDefinition[];

export const REVERSE_CURRENCY_LANDING_ROUTES = forwardCodes.map((code) => ({
  direction: 'twd-to-foreign',
  from: 'TWD',
  to: code.toUpperCase(),
  path: `/twd-${code}/`,
  amountPathPattern: `/twd-${code}/:amount/`,
  entry: `src/pages/${pageName('twd', code)}.tsx`,
})) satisfies readonly CurrencyLandingRouteDefinition[];

export const CURRENCY_LANDING_ROUTES = [
  ...FORWARD_CURRENCY_LANDING_ROUTES,
  ...REVERSE_CURRENCY_LANDING_ROUTES,
] as const;
```

- [ ] **Step 4: Run registry tests**

Run:

```bash
pnpm --filter @app/ratewise exec vitest run src/config/__tests__/currencyLandingRouteRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire registry into tests before changing route generation**

Add tests that compare registry paths to existing `CURRENCY_SEO_PATHS` and `REVERSE_CURRENCY_SEO_PATHS` in `seo-paths.ts`. This creates a safety net before replacing manual route lists.

Test snippet:

```ts
import { CURRENCY_SEO_PATHS, REVERSE_CURRENCY_SEO_PATHS } from '../seo-paths';

it('matches existing SEO currency paths', () => {
  expect(FORWARD_CURRENCY_LANDING_ROUTES.map((route) => route.path)).toEqual([
    ...CURRENCY_SEO_PATHS,
  ]);
  expect(REVERSE_CURRENCY_LANDING_ROUTES.map((route) => route.path)).toEqual([
    ...REVERSE_CURRENCY_SEO_PATHS,
  ]);
});
```

- [ ] **Step 6: Defer route generation refactor to a separate PR**

Do not replace all `routes.tsx` manual currency entries in the same commit. The first architecture commit only introduces the registry and parity tests. A later PR can change route generation with much lower risk.

- [ ] **Step 7: Update 002 log and commit**

Append:

```markdown
- 日期：2026-05-12
- ID：reward-ratewise-currency-route-registry
- 原因：幣別 landing routes 與 SEO paths 手寫展開造成長期漂移風險
- 解法：建立 registry 與 parity tests，先保證既有 URL 不變
```

Commit:

```bash
git add apps/ratewise/src/config/currencyLandingRouteRegistry.ts \
  apps/ratewise/src/config/__tests__/currencyLandingRouteRegistry.test.ts \
  docs/dev/002_development_reward_penalty_log.md
git commit -m "refactor(ratewise): 建立幣別路由 registry 基線

- 新增幣別 landing route registry
- 補上 SEO path parity tests 保證 canonical URL 不變

測試：pnpm --filter @app/ratewise exec vitest run src/config/__tests__/currencyLandingRouteRegistry.test.ts"
```

## Final Verification

- [ ] **Step 1: Run RateWise core gates**

Run:

```bash
pnpm --filter @app/ratewise lint
pnpm --filter @app/ratewise typecheck
pnpm --filter @app/ratewise test
pnpm --filter @app/ratewise build
```

Expected: all PASS.

- [ ] **Step 2: Run changed E2E gates**

Run:

```bash
pnpm --filter @app/ratewise exec playwright test tests/e2e/accessibility.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 3: Check root hygiene**

Run:

```bash
git status --short
git status --ignored --short | sed -n '1,160p'
```

Expected: no root-level QA screenshots or unexpected tracked generated drift. Ignored QA artifacts may exist under ignored paths.

- [ ] **Step 4: Confirm documentation sync**

Run:

```bash
rg -n "internal route|generated artifact|QA gate|production governance|prebuild|refresh:data|generate:deterministic" README.md AGENTS.md CLAUDE.md apps/ratewise/README.md
```

Expected: route, QA, and generated artifact policies are documented consistently wherever changed.

- [ ] **Step 5: Prepare PR summary**

Use this PR summary structure:

```markdown
## Summary

- Restores RateWise delivery baseline by fixing lint warnings.
- Removes internal-only pages from production route/prerender surface.
- Improves global error classification and production observability.
- Adds or restores product-level QA gates for accessibility, offline, live headers, and performance.
- Documents generated artifact policy and introduces currency route registry parity tests.

## Tests

- pnpm --filter @app/ratewise lint
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise test
- pnpm --filter @app/ratewise build
- pnpm --filter @app/ratewise exec playwright test tests/e2e/accessibility.spec.ts --project=chromium
```
