# Plan 010: QA 閘門（390×844 Playwright、live precache、Lighthouse、Experiment→Main Gate）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- apps/ratewise/tests/e2e/ scripts/verify-precache-assets.mjs .lighthouserc.cjs`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: MED
- **Depends on**: plans/002, 003, 004, 005, 007, 008
- **Category**: tests | **Planned at**: `e7b7f1ec`, 2026-06-27
- **L20 local phase**: 2026-06-27 @ `origin/experiment/ratewise-ux-2026` (`5e5e543e`) — **Gate ~35%**（見下方驗收表）

## Why this matters

Spec §十四.12 **Experiment→Main Gate** G1–G5 為 UX 整合上 main 唯一入口：P0 透鏡 done、Lighthouse CI、live precache、390×844 console=0、Maintainer 批准。現況 E2E 缺 hero y 量測（L20）；#433 Lighthouse **blocking**（UX-INC-003）。

## Current state

**Verification Matrix**（spec §十六）:

- Primary viewport **390×844**
- curl 路由 smoke 6+
- Playwright: `mobile-pwa-smoke` **待建**；grep `mobile-pwa|hero-y|touch-44`

**Gate 表**（§14.11）:

| Gate             | 工具                       | 門檻                            |
| ---------------- | -------------------------- | ------------------------------- |
| Mobile smoke     | Playwright 390×844         | hero y≤120; console=0           |
| Touch            | bounding box               | 100% ≥44px 核心路徑             |
| Security headers | curl GET                   | CSP + x-security-policy-version |
| Live precache    | verify-precache-assets.mjs | ≥50                             |
| Lighthouse       | CI smoke SSOT              | green（#433 現況 fail）         |

**Commands SSOT**（root package.json）:

- `pnpm test:e2e`
- `VERIFY_PRECACHE_SOURCE=live VERIFY_BASE_URL=https://app.haotool.org/ratewise/ node scripts/verify-precache-assets.mjs`
- `pnpm lighthouse:ci`

## Scope

**In**:

- 新增/擴充 `apps/ratewise/tests/e2e/mobile-pwa-smoke.spec.ts`（或同名）
- 新增 `hero-layout-390x844.spec.ts` — AC1–AC5（L01）
- 新增 `touch-targets-44.spec.ts` — L11
- Console collector spec — L06
- CI：確保 experiment PR 跑 e2e + lighthouse path filter
- Gate 執行 runbook（`docs/dev/` 或 plans 附錄）
- experiment→main PR 準備（**不 merge**，Maintainer）

**Out**:

- 修復所有 Lighthouse 問題（可拆自 #433；本 plan 定義 gate）
- Production CF purge 執行（Maintainer + plan 007）

## Steps

### Step 1: mobile-pwa-smoke.spec.ts

四 tab `/` `/multi/` `/favorites/` `/settings/` — 無白屏；viewport 390×844

**Verify**: `pnpm --filter @app/ratewise exec playwright test tests/e2e/mobile-pwa-smoke.spec.ts`

### Step 2: hero-y spec

量測 hero rate top ≤120px、font-size ≥32px（hero-v2 或 legacy 基線記錄）

**Verify**: test output 附 bounding box log

### Step 3: console=0 spec

`/`, `/faq/`, `/settings/` collect console errors

**Verify**: expect errors.length === 0

### Step 4: touch-44 spec

核心路徑 interactive elements bounding box ≥44

**Verify**: 失敗時輸出 selector 清單

### Step 5: Local deep test protocol（spec §14.12）

```bash
pnpm --filter @app/ratewise build
pnpm --filter @app/ratewise preview -- --host 127.0.0.1 --port 4173
pnpm --filter @app/ratewise test:e2e --grep 'mobile-pwa|hero-y|touch-44'
open "http://127.0.0.1:4173/ratewise/?ux=hero-v2"
```

### Step 6: Experiment HEAD — Lighthouse

```bash
pnpm lighthouse:ci
```

若 fail → 記錄 URL/score；**不得** merge experiment→main（G2）

### Step 7: Live precache（release 後或 staging）

```bash
VERIFY_PRECACHE_SOURCE=live VERIFY_BASE_URL=https://app.haotool.org/ratewise/ node scripts/verify-precache-assets.mjs
```

### Step 8: Gate checklist sign-off

| Gate              | Owner   | Pass?           |
| ----------------- | ------- | --------------- |
| G1 P0 lenses done | PM      | §六 L01/L06/L14 |
| G2 Lighthouse     | QA      | CI artifact     |
| G3 live precache  | Release | script output   |
| G4 390×844        | L06     | Playwright      |
| G5 Maintainer     | Owner   | gh pr review    |

通過後開 PR：`experiment/ratewise-ux-2026` → `main`（squash，Maintainer）

## Test plan

- 本 plan 即測試交付物；新增 spec 檔案 ≥3
- 回歸：`pnpm --filter @app/ratewise test -- seo-ssot animations`

## L20 local phase 驗收（2026-06-27）

**環境**：worktree `../ratewise-ux-worktrees/epic3-content-distill` @ `5e5e543e`；`pnpm build:ratewise` + preview `:4173`

| Matrix 列（§十六） | 結果 | 備註 |
| ------------------ | ---- | ---- |
| 16.2 curl 8 routes | **PASS** | prod 全 200 |
| 16.2 security headers | **PASS** | `x-security-policy-version: 5.4` |
| 16.2 live precache | **PASS** | ≥50 assets 200 |
| 16.3 mobile-pwa-smoke | **FAIL** | spec 待建；手動四 tab 無白屏 |
| 16.3 hero y ≤120 | **FAIL** | rateText y≈274；24px |
| 16.3 console=0 | **FAIL** | `/` `/settings/` `/faq/` 各 React #418 |
| 16.3 touch-44 | **SKIP** | spec 待建 |
| 16.4 build | **PASS** | build:ratewise exit 0 |
| G2 Lighthouse | **BLOCKED** | #433；本地 lhci port 衝突 |
| G5 Maintainer | **PENDING** | 禁止 merge experiment→main |

**截圖**：`screenshots/l20-hero-v2-390x844.png`

**CI path（本機無瀏覽器時）**：`pnpm --filter @app/ratewise test:e2e --grep 'mobile-pwa|hero-y|touch-44'`（spec 合併後）；PR CI `chromium-mobile` project。

## Done criteria

- [ ] §十六 matrix 對應自動化 ≥80%（現況 ~25%：curl + precache + build）
- [x] G1–G4 證據路徑記錄於 spec §六 L20（local phase 部分）
- [ ] experiment branch CI green（含 lighthouse 若 path hit）
- [x] experiment→main PR 已開或 BLOCKED 原因明確 → **BLOCKED**（G1 P0、G2、G4）
- [x] `registerSW.js` 404 **不**視為 fail（spec L20）

## STOP conditions

- G2 Lighthouse fail → BLOCKED，回 plan 002/perf 或 #433 fix
- G3 precache fail with stale edge 404 → plan 007 purge 後重跑
- G1 任一 P0 非 done → 禁止開 experiment→main PR

## Maintenance notes

- post-release：cache-bust probe app-version → purge → precache（AGENTS.md）
- 002 002 log + changeset minor 於 main merge 後 release workflow
