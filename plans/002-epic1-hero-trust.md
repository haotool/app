# Plan 002: Epic 1 Hero + Trust（SingleConverter hero v2、KoreaTravel 模式、design tokens）

> **Executor instructions**: base branch = `experiment/ratewise-ux-2026`；PR base 同 experiment。Model：**Composer 2.5 Fast**（spec §3.8）。
>
> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- apps/ratewise/src/features/ratewise/components/SingleConverter.tsx apps/ratewise/src/config/design-tokens.ts apps/ratewise/src/main.tsx`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/001-experiment-branch-bootstrap.md, plans/009-agent-orchestration.md
- **Category**: direction
- **Planned at**: commit `e7b7f1ec`, 2026-06-27

## Why this matters

加權 UX 基線 **59/100**；P0 透鏡 L01/L06/L14 全 pending。首屏金額列（`data-testid="amount-input"` @ y≈109）優先於 hero 匯率（y≈274），且兩者同為 `text-2xl`（24px），違反 answer-first 與韓系 fintech 對標（spec §一、§十一）。

## Current state

**關鍵檔案**:

- `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx` — DOM 順序：label+amount L398–422 早於 rate card L486+；gradient + `group-hover:scale-[1.02]` L489–501
- `apps/ratewise/src/config/design-tokens.ts` L678–709 — `amountInput` 與 `rateText` 皆 `text-2xl` 起跳
- `apps/ratewise/src/main.tsx` L9–10 — `import './suppress-hydration-warning'`
- `apps/ratewise/src/components/BottomNavigation.tsx` L105 — `text-[8px]`（E1 相關 typography 由 L08/L14 處理，本 plan 聚焦 converter hero）

**Spec 任務 SSOT**（§十一 Epic 1）:

| Task   | 檔案             | 工作                                 |
| ------ | ---------------- | ------------------------------------ |
| E1-T1  | SingleConverter  | DOM 重排：Rate Hero → From → To      |
| E1-T2  | design-tokens.ts | `display-md` 32px、`display-sm` 28px |
| E1-T3  | SingleConverter  | Freshness chip ≤8px under hero       |
| E1-T5  | main.tsx         | 修 #418；移除全域 suppression        |
| E1-T7  | SingleConverter  | 44×44 計算機按鈕                     |
| E1-T10 | SingleConverter  | Zen 白底 card（L18）                 |

**Feature flag**（§二十）: `singleConverterLayout` / Settings `heroLayoutVariant`: `legacy` | `hero-v2`；QA `?ux=hero-v2`；**預設 legacy** 直至 gate。

**KoreaTravel 映射**（§十一，路徑在 spec 外本機）：payment pills → RateSelector；LiveRateCard → freshness chip；**勿 copy-paste 整檔**，只移植 IA 模式。

**慣例**: design token 集中於 `design-tokens.ts`；動效接 `useReducedMotion`（見 `OfflineIndicator.tsx` 既有用法）。

## Commands you will need

| Purpose   | Command                                                                                                  | Expected |
| --------- | -------------------------------------------------------------------------------------------------------- | -------- |
| Typecheck | `pnpm --filter @app/ratewise typecheck`                                                                  | exit 0   |
| Unit      | `pnpm --filter @app/ratewise test -- animations seo-ssot`                                                | pass     |
| Build     | `pnpm build:ratewise`                                                                                    | exit 0   |
| Preview   | `pnpm --filter @app/ratewise preview -- --host 127.0.0.1 --port 4173`                                    | serving  |
| E2E smoke | `pnpm --filter @app/ratewise exec playwright test tests/e2e/ratewise.spec.ts --project=chromium-desktop` | pass     |

## Suggested executor toolkit

- Skills: `react`, `ui-ux-pro-max`, `framer-motion`, `wcag-compliance`
- Spec: `docs/superpowers/specs/2026-06-26-ratewise-2026-product-ux-spec.md` §七 L01/L06/L14

## Scope

**In scope**:

- `apps/ratewise/src/config/design-tokens.ts`
- `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
- `apps/ratewise/src/features/ratewise/components/RateSelector.tsx`（E1-T4 44px segment）
- `apps/ratewise/src/main.tsx`
- `apps/ratewise/src/suppress-hydration-warning.ts`（移除或 dev-only）
- Settings / feature flag storage（localStorage key SSOT 新增於 Settings 或 converter hook，最小 surface）
- 相關 vitest / 新增 Playwright hero-y spec stub
- `docs/superpowers/specs/2026-06-26-ratewise-2026-product-ux-spec.md` §六 L01/L06/L14 Status（PR 含 spec diff）
- `.changeset/*.md`（minor — 使用者可感知首屏）

**Out of scope**:

- `seo-metadata.ts`（plan 004）
- `MultiConverter.tsx`（plan 005）
- `PwaInstallGuide.tsx` 時機（plan 003）
- 直接 merge experiment→main

## Git workflow

- Branch: `feat/ratewise-epic1-hero-trust` from `origin/experiment/ratewise-ux-2026`
- Worktree: `../ratewise-ux-worktrees/epic1-hero-trust`
- PR: `--base experiment/ratewise-ux-2026`
- Commit 前更新 `docs/dev/002_development_reward_penalty_log.md`（AGENTS.md AGT-LOG-01）

## Steps

### Step 1: display-md token（E1-T2 / L14）

在 `design-tokens.ts` 新增語意 token（spec §十一）:

- `heroRateDisplay`: `text-[32px] font-bold tabular-nums`（或 Tailwind 擴充 `display-md`）
- `amountSecondaryDisplay`: `text-xl`（≤ hero×0.75）
- `trustChipGap`: `mt-2`
- 將 `singleConverterLayoutTokens.rateText` 改指向 `heroRateDisplay`（**僅 hero-v2 路徑使用**；legacy 可暫保留 `text-2xl`）

**Verify**: `pnpm --filter @app/ratewise typecheck` exit 0

### Step 2: Feature flag 層（§二十）

新增 SSOT helper（例如 `apps/ratewise/src/config/hero-layout-variant.ts`）:

- 讀取 Settings / `localStorage` / URL `?ux=hero-v2`
- 預設 `legacy`
- 匯出 `getHeroLayoutVariant(): 'legacy' | 'hero-v2'`

**Verify**: unit test 或 vitest 覆蓋 query override

### Step 3: hero-v2 DOM 重排（E1-T1）

在 `SingleConverter.tsx`:

- `hero-v2` 分支：Rate Hero block **移至** from-amount 之前
- 移除 rate card `hover:scale-[1.02]`（UX-INC-005 / MOT-P2-001）
- gradient card → Zen 白底 `bg-surface-card border`（E1-T10）
- 新增 44×44 calculator affordance（E1-T7）with `aria-label`
- Freshness chip 移入 rate card 底部 ≤8px（E1-T3）

**Verify**: Playwright 或 manual — hero rate `getBoundingClientRect().top ≤ 120` @ 390×844（plan 010 完整 spec）

### Step 4: Hydration 修復（E1-T5 / L06 / QA-P0-001）

- 根因調查：SSG 匯率 vs client rates、Footer 時間戳等
- **移除** production path 的 `import './suppress-hydration-warning'`（`main.tsx:9-10`）
- 必要時 `ClientOnly` 包裹非關鍵區塊

**Verify**: Playwright console collector — `/` `/faq/` `/settings/` error count = 0

### Step 5: RateSelector 44px（E1-T4）

`RateSelector.tsx` segment min height/width 44px CSS px + focus ring

**Verify**: bounding box audit（plan 010 touch-44）

### Step 6: Spec + changeset + PR

- 更新 spec §六 L01/L06/L14 → `done`（附 evidence paths）
- `pnpm changeset` → **minor**（首屏 IA 使用者可感知）
- 開 PR to experiment；附 §3.6 handoff YAML

**Verify**: CI quality + e2e smoke green on PR

## Test plan

- 新增 `tests/e2e/hero-layout-390x844.spec.ts`（或擴充現有）: AC1 y≤120, AC2 font≥32px, AC5 curl 200
- vitest: feature flag resolver；template-bleed 不可 regress
- 模式：參考 `apps/ratewise/tests/e2e/ratewise.spec.ts`

## Done criteria

- [ ] `legacy` 與 `hero-v2` 皆可 render；預設 `legacy`
- [ ] `hero-v2` 通過 L01 AC1–AC5（有 Playwright 證據）
- [ ] console error=0 三路由（L06）
- [ ] `display-md` token 存在（L14）
- [ ] `.changeset` 已建立
- [ ] PR merged to **experiment**（非 main）
- [ ] spec §六 三列 P0 透鏡 updated

## STOP conditions

- 修 hydration 需改 `seo-metadata.ts` 大量 SSG — 停止，拆 PR 與 plan 004 協調
- hero-v2 造成 LCP +20% vs legacy（AB-01 rollback）→ 停止，回報 PM
- #433 未 merge 且與 `design-tokens.ts` 衝突無法 rebase — 停止，請 Tech Lead

## Maintenance notes

- `SingleConverter.tsx` 為 conflict hotspot；E2 rateMode UI 應用 bottom sheet，勿再改 hero block（spec §14.5）
- Reviewer 必查：無 raw mailto、無新 FAQPage schema 重複
