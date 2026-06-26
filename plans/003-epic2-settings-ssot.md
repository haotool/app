# Plan 003: Epic 2 Settings SSOT（44px 觸控、PWA nudge、Favorites 匯率）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- apps/ratewise/src/pages/Settings.tsx apps/ratewise/src/components/PwaInstallGuide.tsx apps/ratewise/src/pages/Favorites.tsx`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: MED
- **Depends on**: plans/001-experiment-branch-bootstrap.md
- **Category**: direction | **Planned at**: `e7b7f1ec`, 2026-06-27

## Why this matters

L12/L15 現況分 65/72，但 Settings 7/10 互動 <44px、PWA 1.8s 自動弹出（UX-INC-006）、Favorites 無即時匯率列。Epic 2 將設定與 PWA 行為收斂為 SSOT，對齊 Wowpass「餘額+匯率置頂」模式（spec §九）。

## Current state

- `apps/ratewise/src/components/PwaInstallGuide.tsx:16` — `SHOW_DELAY_MS = 1800`
- `apps/ratewise/src/main.tsx` — PWA 註冊 inline（`registerSW.js` 404 為預期，QA P2-004）
- Settings / Favorites 頁：spec §十一 E2-T1–T6
- **衝突警告**：E2-T6 rateMode 入口勿大改 `SingleConverter.tsx` hero block（用 sheet/modal，spec §14.5）

## Commands

| Purpose   | Command                                                            | Expected  |
| --------- | ------------------------------------------------------------------ | --------- | ---- |
| Typecheck | `pnpm --filter @app/ratewise typecheck`                            | exit 0    |
| Test      | `pnpm --filter @app/ratewise test`                                 | pass      |
| E2E       | `pnpm --filter @app/ratewise exec playwright test --grep favorites | settings` | pass |

## Scope

**In**: `Settings.tsx`, `PwaInstallGuide.tsx`, `UpdatePrompt.tsx`, `Favorites.tsx`, `zh-TW.ts`（i18n key）, Settings 相關 tokens, vitest/e2e, spec §六 L12/L15, changeset（minor 若 PWA 入口可見）

**Out**: `SingleConverter.tsx` DOM 重排（plan 002）；`sw.ts` precache 邏輯大改（除非 install 流程必要）

## Steps

### Step 1: PWA 安裝區塊（E2-T1）

Settings 新增「安裝 App」區塊，呼叫既有 `PwaInstallGuide` 或 extracted hook；移除 consumer 可見 `/seo-tech/` 連結（L12 AC）。

**Verify**: `/settings/` curl 200；手動 — 設定頁可觸發 install guide

### Step 2: Nudge 時機（E2-T2 / UX-INC-006）

`PwaInstallGuide.tsx`:

- 移除固定 1.8s auto-show
- 改為 **首次換算成功後** 觸發（訂閱 converter success event 或 callback prop）
- sessionStorage dismiss + **7 日 cooldown**

**Verify**: 冷載入 3s 內無 popup；換算成功後才出現

### Step 3: UpdatePrompt defer（E2-T3）

`UpdatePrompt.tsx`: needRefresh「稍後」→ 24h defer（localStorage timestamp）

**Verify**: vitest 或 manual — defer 後 24h 內不再 prompt

### Step 4: Favorites 匯率列（E2-T4）

`Favorites.tsx`: 每收藏列顯示 `1 TWD = x CCY`；修正空狀態；修 `favorites.baseCurrency` i18n（E2-T5）

**Verify**: E2E favorites tab 可見匯率數字

### Step 5: rateMode 可發現入口（E2-T6）

Settings 或 info sheet 連至 rateMode（**勿**改 hero DOM）；觸控 target ≥44px

**Verify**: Playwright — Settings 互動元素 bounding box ≥44px（核心路徑）

### Step 6: PR → experiment

更新 spec §六 L12/L15；changeset；PR base `experiment/ratewise-ux-2026`

## Test plan

- E2E: `/favorites/`、`/settings/` 200；四 tab 無白屏
- Touch audit 可與 plan 010 合併

## Done criteria

- [ ] 無 1.8s auto popup（L15 AC）
- [ ] Favorites 列含匯率（L12 AC）
- [ ] Settings 含 PWA install（L12 AC）
- [ ] 核心 Settings 互動 ≥44px
- [ ] PR on experiment merged

## STOP conditions

- 換算成功 hook 不存在且需大改 converter store → 停止，與 plan 002 owner 協調最小 callback
- PWA prompt 模式與 `vite.config.ts` registerType 衝突 → 停止，讀 `pwa-development` skill

## Maintenance notes

- SemVer：PWA 入口 + Favorites 匯率 → **minor**（spec §十七）
- Release 後仍需 CF purge（plan 008），與 UX 解耦
