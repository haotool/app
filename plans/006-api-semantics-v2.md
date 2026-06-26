# Plan 006: API Semantics v2（加法遷移、OpenAPI 對齊）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- apps/ratewise/public/api/latest.json apps/ratewise/public/openapi.json apps/ratewise/scripts/`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: LOW
- **Depends on**: plans/001-experiment-branch-bootstrap.md
- **Category**: migration | **Planned at**: `e7b7f1ec`, 2026-06-27
- **Execution**: DONE @ 2026-06-27（`feat/ratewise-api-semantics-v2` → `experiment/ratewise-ux-2026`）

## Why this matters

現況 API 使用銀行視角 `buy`/`sell` 與 `{rateType}.buy` 公式字串（`latest.json:14-22`），整合方易反解 customer action。Spec §二十一 提案 v2 **additive** 欄位（`customerBuyForeignRate` 等），對齊 RateWise「台銀賣出價」產品定位。

## Current state（完成後）

- `apps/ratewise/src/config/api-semantics-v2.ts` — SSOT：`enrichRatesPayload` / `buildSemanticFieldMapping`
- `apps/ratewise/public/api/latest.json` — 頂層 `schemaVersion: "2.0"`、`semanticsDoc`、`semanticFieldMapping`；legacy `rateModeStrategies` 不變
- `apps/ratewise/public/openapi.json` — `CurrencyRateV2` schema、`asOf`、legacy `@deprecated` description
- 生成腳本：`generate-api-json.mjs`、`generate-pair-json.mjs`、`generate-openapi.mjs` 匯入 SSOT
- vitest：`api-semantics-v2.test.ts`（5 tests）+ `seo-best-practices` schemaVersion 斷言

Migration 階段 M1–M4（spec §21.4）；**禁止 M5 remove** 除非 Maintainer 批准。

## Commands

| Purpose   | Command                                              | Expected     |
| --------- | ---------------------------------------------------- | ------------ |
| Artifacts | `pnpm --filter @app/ratewise verify:artifacts`       | pass         |
| Test      | `pnpm --filter @app/ratewise test -- api-semantics`  | 5 passed     |
| Typecheck | `pnpm --filter @app/ratewise typecheck`              | pass         |
| Prebuild  | `pnpm --filter @app/ratewise generate:deterministic` | updates JSON |

## Scope

**In**: API 生成 script(s), `public/api/latest.json`, `public/api/pairs/*.json`, `public/openapi.json`, metadata 區塊, vitest for v2 field mapping, spec §二十一 進度註記, changeset **patch**

**Out**: App UI 改用 v2 欄位（可選 follow-up）；breaking removal of buy/sell

## Steps

### Step 1: 定位生成 SSOT ✅

- `generate-api-json.mjs` → `public/api/latest.json`
- `generate-pair-json.mjs` → `public/api/pairs/*.json`
- `generate-openapi.mjs` → `public/openapi.json`
- 映射邏輯 SSOT：`src/config/api-semantics-v2.ts`

### Step 2: M1 Additive 欄位 ✅

- `customerBuyForeignRate` ← legacy `{type}.sell`
- `customerSellForeignRate` ← legacy `{type}.buy`
- `midMarketRate`、`asOf`（payload enrich）
- 頂層 `schemaVersion: "2.0"`
- legacy `buy`/`sell` 保留

### Step 3: M2 OpenAPI ✅

`CurrencyRateV2` + legacy `@deprecated` in description

### Step 4: M3 Docs metadata ✅

`semanticsDoc: https://app.haotool.org/ratewise/open-data/`

### Step 5: Tests ✅

`api-semantics-v2.test.ts` — USD cash 映射 §21.3

### Step 6: PR to experiment ✅

changeset patch；002 log

## Test plan

- Unit: field mapping table §21.3 — **pass**
- `verify:artifacts` SSOT sync — **pass**

## Done criteria

- [x] legacy + v2 並存
- [x] `schemaVersion: "2.0"` 存在
- [x] OpenAPI 含 V2 schema
- [x] verify:artifacts pass
- [x] 無 consumer breaking change

## STOP conditions

- 生成 script 與 data branch 流程衝突 → 停止，讀 `docs/superpowers/plans/2026-05-09-rate-provider-ssot.md`
- 需修改 committed live rate refresh 流程 → 停止，只用 deterministic generation

## Maintenance notes

- M5 remove 日期 2026-12-31 僅文件 sunset（spec §21.4）
- SemVer：**patch**（API 加法，使用者未直接感知 UI）
