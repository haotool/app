# Plan 005: Epic 4 Multi + IA（progressive disclosure、導覽、雙殼）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- apps/ratewise/src/features/ratewise/components/MultiConverter.tsx apps/ratewise/src/components/BottomNavigation.tsx`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: MED
- **Depends on**: plans/001-experiment-branch-bootstrap.md, plans/002-epic1-hero-trust.md
- **Category**: direction | **Planned at**: `e7b7f1ec`, 2026-06-27
- **Execution**: `feat/ratewise-epic4-multi-ia` @ worktree `../ratewise-ux-worktrees/epic4-multi-ia`（2026-06-27）

## Why this matters

Multi 18 幣全展開 + 列內 rate 切換寫入全域 store（UX-INC-004）；nav label 8px、scroll-padding 不足（L05）。Epic 4 降低認知負荷並修正語意，需 E1 token/DOM 穩定後 merge（spec §14.4）。

## Current state

- `MultiConverter.tsx` L137 `onRateTypeChange` 全域；L221 `sortedCurrencies.map` 全列
- `BottomNavigation.tsx` L105 `text-[8px]`；L152 `h-14`
- `converterStore.ts` — single↔multi state
- Tasks E4-T1–T7（spec §十一）

## Commands

| Purpose   | Command                                                                            | Expected |
| --------- | ---------------------------------------------------------------------------------- | -------- |
| E2E multi | `pnpm --filter @app/ratewise exec playwright test --grep multi`                    | pass     |
| curl      | `curl -s -o /dev/null -w '%{http_code}\n' https://app.haotool.org/ratewise/multi/` | 200      |

## Scope

**In**: `MultiConverter.tsx`, `converterStore.ts`, `BottomNavigation.tsx`, `AppLayout.tsx`, `RememberedHomeRoute.tsx`, SEO 頁 mobile footer CTA（E4-T6）, desktop lg 雙欄（E4-T7 P2）, spec L03/L05/L07

**Out**: `seo-metadata.ts` 大改（plan 004）；hero DOM（plan 002）

## Steps

### Step 1: Progressive disclosure（E4-T1）

預設可見 **≤8 列**；其餘「顯示更多」expand

**Verify**: DOM 列數 ≤8 without scroll @390×844

### Step 2: 列切換語意（E4-T2 / MULT-P1）

UI 明示「全列表套用」**或** per-row preview（spec Q4 建議文案先行）

**Verify**: E2E — 切換 rate type 後文案/狀態符合 AC

### Step 3: State sync（E4-T3）

single↔multi tab 切換 rateType/rateSource 一致

**Verify**: E2E journey pass

### Step 4: Nav IA（E4-T5 / E5 部分）

- label **≥10px**；禁止 uppercase 繁中（L05）
- `scroll-padding-bottom ≥57px` on main scroll container
- inactive contrast ≥4.5:1（與 L10 協作 tokens）

**Verify**: computed contrast screenshot；scroll 末段不被 tab bar 遮

### Step 5: 冷啟動 IA（E4-T4）

`RememberedHomeRoute.tsx` — 預設 single，禁止冷啟動 redirect `/multi`

### Step 6: SEO mobile footer（E4-T6 P2 可 defer）

### Step 7: PR after rebase E1

Rebase `origin/experiment/ratewise-ux-2026` 含 Epic 1 後開 PR

## Test plan

- E2E: multi tab + rate type + favorites sync
- Nav 28-step journey（plan 010）

## Done criteria

- [x] ≤8 default rows（L03）
- [x] 全列表套用文案或 per-row preview
- [x] nav label ≥10px；scroll-padding ≥57px
- [x] `/multi/` 200
- [ ] experiment merged（待 PR merge）

## STOP conditions

- per-row store 需求超出文案方案 → 停止，PM 決策 Q4
- rebase E1 後 `BottomNavigation` 衝突 → 依 §14.5 羅導航 L05 owner 解

## Maintenance notes

- Multi 行為變更 → **minor**（spec §十七）
- Desktop 雙欄（E4-T7）可拆 follow-up PR（P2）
