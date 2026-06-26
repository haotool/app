# Plan 006: API Semantics v2（加法遷移、OpenAPI 對齊）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- apps/ratewise/public/api/latest.json apps/ratewise/public/openapi.json apps/ratewise/scripts/`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: LOW
- **Depends on**: plans/001-experiment-branch-bootstrap.md
- **Category**: migration | **Planned at**: `e7b7f1ec`, 2026-06-27

## Why this matters

現況 API 使用銀行視角 `buy`/`sell` 與 `{rateType}.buy` 公式字串（`latest.json:14-22`），整合方易反解 customer action。Spec §二十一 提案 v2 **additive** 欄位（`customerBuyForeignRate` 等），對齊 RateWise「台銀賣出價」產品定位。

## Current state

```json
// apps/ratewise/public/api/latest.json (excerpt)
"rateModeStrategies": {
  "auto": {
    "fromCurrencyField": "{rateType}.buy",
    "toCurrencyField": "{rateType}.sell"
  }
}
```

- `apps/ratewise/public/openapi.json` — 說明 buy/sell 但未 export `schemaVersion: "2.0"`
- 生成腳本：搜尋 `apps/ratewise/scripts/` 內 `latest.json` / OpenAPI generator
- **無** `customerBuyForeignRate` 欄位（grep 無匹配）

Migration 階段 M1–M4（spec §21.4）；**禁止 M5 remove** 除非 Maintainer 批准。

## Commands

| Purpose   | Command                                              | Expected       |
| --------- | ---------------------------------------------------- | -------------- |
| Artifacts | `pnpm --filter @app/ratewise verify:artifacts`       | pass           |
| Test      | `pnpm --filter @app/ratewise test -- api`            | pass（若存在） |
| Prebuild  | `pnpm --filter @app/ratewise generate:deterministic` | updates JSON   |

## Scope

**In**: API 生成 script(s), `public/api/latest.json`, `public/api/pairs/*.json`, `public/openapi.json`, metadata 區塊, vitest for v2 field mapping, spec §二十一 進度註記, changeset **patch**

**Out**: App UI 改用 v2 欄位（可選 follow-up）；breaking removal of buy/sell

## Steps

### Step 1: 定位生成 SSOT

```bash
rg -l 'latest\.json|openapi' apps/ratewise/scripts --type js
```

記錄單一寫入路徑；禁止第二份 hardcode 名單。

### Step 2: M1 Additive 欄位

對每幣別 rate object 新增（spec §21.2）:

- `customerBuyForeignRate` ← legacy `{type}.sell`
- `customerSellForeignRate` ← legacy `{type}.buy`
- `midMarketRate`
- 頂層 `schemaVersion: "2.0"`, `asOf`

**保留** legacy `buy`/`sell` 不變。

**Verify**: JSON parse；spot check USD cash 對照表 §21.3

### Step 3: M2 OpenAPI

`openapi.json` 新增 `CurrencyRateV2` schema；legacy 標 `@deprecated` in description only

**Verify**: `pnpm --filter @app/ratewise verify:artifacts`

### Step 4: M3 Docs metadata

`latest.json` metadata 加 `semanticsDoc: "docs/superpowers/specs/...§二十一"` 或 public URL

### Step 5: Tests

新增 vitest：映射 `customerBuyForeignRate === details.USD.cash.sell`（範例）

### Step 6: PR to experiment

changeset patch；002 002 log

## Test plan

- Unit: field mapping table §21.3
- `verify:artifacts` SSOT sync

## Done criteria

- [ ] legacy + v2 並存
- [ ] `schemaVersion: "2.0"` 存在
- [ ] OpenAPI 含 V2 schema
- [ ] verify:artifacts pass
- [ ] 無 consumer breaking change

## STOP conditions

- 生成 script 與 data branch 流程衝突 → 停止，讀 `docs/superpowers/plans/2026-05-09-rate-provider-ssot.md`
- 需修改 committed live rate refresh 流程 → 停止，只用 deterministic generation

## Maintenance notes

- M5 remove 日期 2026-12-31 僅文件 sunset（spec §21.4）
- SemVer：**patch**（API 加法，使用者未直接感知 UI）
