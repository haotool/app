# Plan 004: Epic 3 Content Distill（seo-metadata 去重、FAQ 分類）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- apps/ratewise/src/config/seo-metadata.ts apps/ratewise/src/pages/CurrencyLandingPage.tsx`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW
- **Depends on**: plans/001-experiment-branch-bootstrap.md
- **Category**: direction | **Planned at**: `e7b7f1ec`, 2026-06-27

## Why this matters

curl `/usd-twd/` 賣出價/中間價 keyword **2 次**（目標 ≤1，L09）；AnswerCapsule、FAQ、highlights 重複 thesis（UX-INC-002）。SEO 文案 SSOT 必須僅 `seo-metadata.ts`（AGENTS.md），distill 而非刪路由。

## Current state

- SSOT: `apps/ratewise/src/config/seo-metadata.ts`
- Landing: `CurrencyLandingPage.tsx`（CTA `converterHref` 已存在 L117-122，spec L04）
- Tests: `seo-ssot.test.ts` template-bleed + dedupe
- Epic tasks E3-T1–T5（spec §十一）

## Commands

| Purpose   | Command                                                                                    | Expected        |
| --------- | ------------------------------------------------------------------------------------------ | --------------- |
| SEO tests | `pnpm --filter @app/ratewise test -- seo-ssot template-bleed`                              | all pass        |
| curl 計數 | `curl -s --compressed https://app.haotool.org/ratewise/usd-twd/ \| rg -c '賣出價\|中間價'` | ≤1（deploy 後） |
| Build     | `pnpm build:ratewise`                                                                      | exit 0          |

## Scope

**In**: `seo-metadata.ts`, `CurrencyLandingPage.tsx`, `HomepageSEOSection.tsx`, `FAQ.tsx`, tests, spec §六 L09/L13/L17, changeset **patch**（文案去重，spec §十七）

**Out**: `SingleConverter.tsx` hero（plan 002）；sitemap 路由刪除

## Steps

### Step 1: thesis dedupe（E3-T1 / DUP-P1）

在 `seo-metadata.ts` 合併「賣出價 vs 中間價」為 **單一 canonical 區塊**；FAQ/capsule 交叉引用而非逐字複製。

**Verify**: `pnpm --filter @app/ratewise test -- seo-ssot` pass

### Step 2: Landing read-only rate strip（E3-T2 / CUR-P0-004）

`CurrencyLandingPage.tsx`: ATF 0 scroll 可見 live rate strip（read-only）；長文 accordion

**Verify**: preview `/usd-twd/` ATF 可見匯率

### Step 3: Homepage SEO 瘦身（E3-T3）

`HomepageSEOSection.tsx` → 1 段 + 幣對連結（spec §15.1）

### Step 4: FAQ 四類 accordion（E3-T4 / FAQ-P1）

`FAQ.tsx`: flat 21 題 → 四類分組；**FAQPage schema 僅 `/faq/`**

**Verify**: `grep -r FAQPage apps/ratewise/src` — 僅 FAQ 頁輸出

### Step 5: Amount capsule（UX26-P0-001）

`/usd-twd/500/` capsule 含金額化首句（spec L19）

### Step 6: PR + spec L09/L13 → done

## Test plan

- `seo-ssot.test.ts` dedupe + template-bleed（必須）
- 可選 curl script in CI summary artifact

## Done criteria

- [ ] curl thesis keyword ≤1（staging/preview 證據）
- [ ] seo-ssot + template-bleed pass
- [ ] FAQPage 無重複 @type
- [ ] changeset patch
- [ ] experiment PR merged

## STOP conditions

- dedupe 需刪除 249 sitemap 路由 → 停止（違反 spec）
- template-bleed 失敗且需混入其他幣別專有名詞 → 停止，修正 SSOT 而非 skip test

## Maintenance notes

- JSON-LD / FAQ 變更 → **patch** bump（CLAUDE.md Phase 7）
- `seo-metadata.ts` 為 E3 唯一 write owner（§14.5）
