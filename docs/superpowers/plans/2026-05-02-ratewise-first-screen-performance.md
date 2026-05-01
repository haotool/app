# RateWise First-Screen Performance Iteration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 持續降低 RateWise mobile 首屏 LCP 與初始 unused JS，同時保留底部導覽、路由切換與離線/PWA 提示體驗。

**Architecture:** 以「可驗證的首屏資源預算」作為主控制點：production build 檢查 `dist/index.html` 與 manifest，dev/preview 檢查 mobile 路由切換與 console/network 穩定性。所有延遲載入只允許移出非首屏或非當前路由依賴，不得延後底部導覽、頁首、首頁骨架與目前路由互動。

**Tech Stack:** React 19、Vite 8/Rolldown、vite-react-ssg、Vitest、Playwright、rollup-plugin-visualizer。

---

## Evidence Baseline

- 官方依據：Vite `build.modulePreload` 會計算 entry HTML 與 dynamic import 的 preload dependencies；React `lazy` 只會在首次渲染 lazy component 時呼叫 loader；React `useTransition` 官方建議用於 Suspense-enabled router navigation；Rolldown `manualChunks` 是 Rollup 相容層且已標示 deprecated，長期應評估遷移至 `output.codeSplitting.groups`。
- 目前實測：production 首頁 modulepreload 已移除 `vendor-motion` 與 `vendor-dnd`，首屏初始下載少約 233.0KB raw / 60.4KB brotli。
- 目前 dev mobile smoke：`/` → `/multi` → `/favorites` → `/settings` → `/` 成功，底部導覽每頁 4 項且 1 個 active，console error 0，failed request 0。
- 目前觀察：dev 首頁會載入 `motion_react`，原因是非關鍵提示元件 mount 後 lazy 載入；production 首屏不 preload，但未來可再加 idle gate 降低 dev 與 runtime idle-before-LCP 風險。

## File Map

- Modify: `apps/ratewise/vite.config.ts`，只在有 build evidence 時調整 chunking，不做無證據拆分。
- Modify: `apps/ratewise/src/components/AppLayout.tsx`，只允許延後全域非首屏提示，不得延後 `BottomNavigation`。
- Modify: `apps/ratewise/src/components/NonCriticalLazyBoundary.tsx`，若要導入 idle gate，集中在這裡處理。
- Test: `apps/ratewise/src/config/__tests__/build-scripts.test.ts`，守住 chunk 規則與 shell import 邊界。
- Test: `apps/ratewise/src/components/__tests__/AppLayout.transition-direction.test.tsx`，守住導覽與切換。
- Create: `apps/ratewise/src/performance/__tests__/homepage-modulepreload.test.ts`，用 production `dist` 或 fixture 驗證首頁 preload 預算。
- Create: `apps/ratewise/e2e/performance/mobile-navigation-smoke.spec.ts`，用 Playwright 驗證 dev/preview mobile route stability。

### Task 1: 首頁 Modulepreload 預算守門

**Files:**

- Create: `apps/ratewise/src/performance/__tests__/homepage-modulepreload.test.ts`
- Modify: `apps/ratewise/package.json`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { brotliCompressSync } from 'node:zlib';
import { join } from 'node:path';

const distDir = join(__dirname, '../../../dist');

describe('homepage modulepreload budget', () => {
  it('keeps motion and dnd out of homepage modulepreload', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8');

    expect(html).not.toContain('vendor-motion');
    expect(html).not.toContain('vendor-dnd');
  });

  it('keeps homepage initial JS under the current brotli budget', () => {
    const manifest = JSON.parse(
      readFileSync(join(distDir, '.vite/manifest.json'), 'utf-8'),
    ) as Record<string, { file: string; imports?: string[] }>;
    const entry = manifest['index.html'];
    const files = [
      entry.file,
      ...(entry.imports ?? []).map((key) => manifest[key]?.file).filter(Boolean),
    ];
    const brotliBytes = files.reduce((total, file) => {
      const abs = join(distDir, file);
      statSync(abs);
      return total + brotliCompressSync(readFileSync(abs)).length;
    }, 0);

    expect(brotliBytes).toBeLessThanOrEqual(135_000);
  });
});
```

- [ ] **Step 2: Run test before build to verify failure mode**

Run: `pnpm --filter @app/ratewise exec vitest run src/performance/__tests__/homepage-modulepreload.test.ts`
Expected: FAIL if `dist/` is missing or stale; this proves the test depends on production output.

- [ ] **Step 3: Add explicit script**

In `apps/ratewise/package.json`, add:

```json
"test:perf:bundle": "vitest run src/performance/__tests__/homepage-modulepreload.test.ts"
```

- [ ] **Step 4: Run production build and budget test**

Run: `pnpm build:ratewise && pnpm --filter @app/ratewise test:perf:bundle`
Expected: PASS; output confirms no `vendor-motion` / `vendor-dnd` in homepage preload and brotli JS budget <= 135000.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/ratewise/package.json apps/ratewise/src/performance/__tests__/homepage-modulepreload.test.ts
git commit -m "test(ratewise): 新增首屏 bundle 預算守門

- 驗證首頁 modulepreload 不含 motion 與 dnd vendor
- 驗證首頁初始 JS brotli 預算維持在 135KB 內

測試：pnpm build:ratewise && pnpm --filter @app/ratewise test:perf:bundle"
```

### Task 2: AppLayout 非關鍵提示 Idle Gate

**Files:**

- Modify: `apps/ratewise/src/components/NonCriticalLazyBoundary.tsx`
- Modify: `apps/ratewise/src/components/AppLayout.tsx`
- Test: `apps/ratewise/src/components/__tests__/NonCriticalLazyBoundary.test.tsx`
- Test: `apps/ratewise/src/config/__tests__/build-scripts.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `NonCriticalLazyBoundary.test.tsx`:

```tsx
it('deferUntilIdle=true 時應等 idle 後才渲染非關鍵 children', () => {
  const requestIdleCallback = vi.spyOn(window, 'requestIdleCallback' as never).mockImplementation(((
    callback: IdleRequestCallback,
  ) => {
    return window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 10 }), 1);
  }) as never);

  render(
    <NonCriticalLazyBoundary deferUntilIdle>
      <MaybeThrow shouldThrow={false} />
    </NonCriticalLazyBoundary>,
  );

  expect(screen.queryByTestId('non-critical-child')).not.toBeInTheDocument();

  return vi.waitFor(() => {
    expect(screen.getByTestId('non-critical-child')).toBeInTheDocument();
    expect(requestIdleCallback).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/ratewise test -- src/components/__tests__/NonCriticalLazyBoundary.test.tsx`
Expected: FAIL because `deferUntilIdle` prop does not exist yet.

- [ ] **Step 3: Implement minimal idle gate**

Update `NonCriticalLazyBoundaryProps`:

```ts
interface NonCriticalLazyBoundaryProps {
  children?: React.ReactNode | ((attempt: number) => React.ReactNode);
  resetKey?: string | number | boolean;
  deferUntilIdle?: boolean;
}
```

Add state field:

```ts
isIdleReady: boolean;
```

Initialize:

```ts
isIdleReady: !this.props.deferUntilIdle,
```

In `componentDidMount`:

```ts
if (this.props.deferUntilIdle && typeof window !== 'undefined') {
  const run = () => this.setState({ isIdleReady: true });
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    window.setTimeout(run, 1200);
  }
}
```

In `render` before children:

```ts
if (!this.state.isIdleReady) return null;
```

- [ ] **Step 4: Wire AppLayout**

Change:

```tsx
<NonCriticalLazyBoundary resetKey={location.pathname}>
```

To:

```tsx
<NonCriticalLazyBoundary resetKey={location.pathname} deferUntilIdle>
```

- [ ] **Step 5: Run focused tests**

Run: `pnpm --filter @app/ratewise test -- src/components/__tests__/NonCriticalLazyBoundary.test.tsx src/config/__tests__/build-scripts.test.ts`
Expected: PASS.

- [ ] **Step 6: Verify dev stability**

Run mobile smoke from Task 4 after starting dev server.
Expected: console error 0, failed request 0, bottom nav remains 4 items, routes still switch.

### Task 3: 首頁圖表與 Calculator Motion 延後載入審查

**Files:**

- Inspect: `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
- Inspect: `apps/ratewise/src/features/ratewise/components/MiniTrendChart.tsx`
- Inspect: `apps/ratewise/src/features/calculator/components/CalculatorKeyboard.tsx`
- Test: `apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.trend.test.tsx`

- [ ] **Step 1: Establish evidence**

Run:

```bash
pnpm build:ratewise
node - <<'NODE'
const manifest = JSON.parse(require('fs').readFileSync('apps/ratewise/dist/.vite/manifest.json', 'utf8'));
for (const [key, value] of Object.entries(manifest)) {
  if (JSON.stringify(value).includes('vendor-charts') || JSON.stringify(value).includes('vendor-motion')) {
    console.log(key, value.file, value.imports);
  }
}
NODE
```

Expected: Identify whether homepage route chunk still pulls `vendor-charts` or `vendor-motion` before user interaction.

- [ ] **Step 2: Write regression target only if evidence shows homepage pull**

If `RateWise.tsx` imports `vendor-charts` before user sees chart, add a test asserting chart fallback renders before chart import. If evidence does not show homepage pull, skip code changes and record the result in final notes.

- [ ] **Step 3: Keep calculator immediate input synchronous**

Do not wrap controlled amount input updates in `useTransition`; React docs explicitly state Transition updates cannot control text inputs.

### Task 4: Playwright Mobile Navigation Smoke

**Files:**

- Create: `apps/ratewise/e2e/performance/mobile-navigation-smoke.spec.ts`
- Modify: `apps/ratewise/playwright.config.ts` only if an existing project cannot target mobile viewport.

- [ ] **Step 1: Add test**

```ts
import { expect, test } from '@playwright/test';

test('mobile bottom navigation stays stable across lazy routes', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('nav.fixed a')).toHaveCount(4);
  await expect(page.locator('nav.fixed a[aria-current="page"]')).toHaveCount(1);

  for (const path of ['/multi', '/favorites', '/settings', '/']) {
    await page.locator(`nav.fixed a[href="${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : path}`));
    await expect(page.locator('nav.fixed a')).toHaveCount(4);
    await expect(page.locator('nav.fixed a[aria-current="page"]')).toHaveCount(1);
  }

  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run against dev server**

Run:

```bash
pnpm --filter @app/ratewise dev -- --host 127.0.0.1
pnpm --filter @app/ratewise exec playwright test e2e/performance/mobile-navigation-smoke.spec.ts
```

Expected: PASS with console error 0.

### Task 5: 每輪迭代驗證門檻

**Files:**

- Modify only when needed: `docs/dev/002_development_reward_penalty_log.md`
- Modify only when behavior changes: `.changeset/*.md`

- [ ] **Step 1: Minimal verification**

Run:

```bash
pnpm --filter @app/ratewise typecheck
pnpm --filter @app/ratewise test -- src/components/__tests__/AppLayout.transition-direction.test.tsx src/components/__tests__/NonCriticalLazyBoundary.test.tsx src/config/__tests__/build-scripts.test.ts
pnpm build:ratewise
```

Expected: all commands exit 0.

- [ ] **Step 2: Bundle evidence**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const root = 'apps/ratewise/dist';
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.vite/manifest.json'), 'utf8'));
const entry = manifest['index.html'];
const refs = [entry.file, ...(entry.imports || []).map((key) => manifest[key]?.file).filter(Boolean)];
let totalRaw = 0;
let totalBr = 0;
for (const file of refs) {
  const abs = path.join(root, file);
  const raw = fs.statSync(abs).size;
  const br = zlib.brotliCompressSync(fs.readFileSync(abs)).length;
  totalRaw += raw;
  totalBr += br;
  console.log(`${file}\t${raw}\t${br}`);
}
console.log(`TOTAL\t${totalRaw}\t${totalBr}`);
NODE
```

Expected: record total raw/brotli and explicitly state whether `vendor-motion` or `vendor-dnd` returned to preload.

- [ ] **Step 3: Update 002 only before commit**

Use current four-line 002 template:

```md
- 日期：YYYY-MM-DD
- ID：ratewise-performance-<short-topic>
- 原因：<一句話 root cause>
- 解法：<一句話 resolution>
```

Expected: keep entry small; do not add large tables.

## Self-Review

- Spec coverage: 查官方最佳實踐、開發環境測試、未來持續迭代、保留底部導覽與路由體驗皆有對應任務。
- Placeholder scan: 本計畫無 TBD / TODO / implement later；所有新增測試與命令均有具體內容。
- Type consistency: `NonCriticalLazyBoundary` 新 prop 命名固定為 `deferUntilIdle`，測試、實作、AppLayout 使用一致。
