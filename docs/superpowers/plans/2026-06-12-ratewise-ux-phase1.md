# RateWise 2026 UX Phase 1 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將單幣別主流程收斂為 2026 Hero + inline numpad + Trust Line，消除 Modal 閘門與首屏資訊重複，使 TTTQ P75 ≤ 2.0s、MTTQ ≤ 3 taps。

**Architecture:** 抽出 `CalculatorKeypad` 核心 → `InlineNumpad` 殼層錨定 BottomNav；`SingleConverter` 重排為 `ConversionHero`（HeroStory + Stack + ThumbBar）；`TrustLine` 合併資料來源；token 層移除 swap `micro:hidden` 與 trust `nano:hidden`。

**Tech Stack:** React 19、TypeScript、Vitest、Playwright、`design-tokens.ts` SSOT、現有 `useCurrencyConverter` / `CalculatorKeyboard` 模式。

**設計 SSOT:** `docs/superpowers/specs/2026-06-12-ratewise-2026-product-ux-spec.md`

---

### Task 1: 抽出 CalculatorKeypad 核心

**Files:**

- Create: `apps/ratewise/src/features/calculator/constants/keyboard-layout.ts`
- Create: `apps/ratewise/src/features/calculator/components/CalculatorKeypad.tsx`
- Modify: `apps/ratewise/src/features/calculator/components/CalculatorKeyboard.tsx`
- Test: `apps/ratewise/src/features/calculator/components/__tests__/CalculatorKeypad.test.tsx`

- [ ] **Step 1: 將 KEYBOARD_LAYOUT 移至 keyboard-layout.ts**

從 `CalculatorKeyboard.tsx` 抽出 `KEYBOARD_LAYOUT` 常數至新檔並 export。

- [ ] **Step 2: 建立 CalculatorKeypad（無 Portal / 無 backdrop）**

實作 `CalculatorKeypadProps`：`isActive`, `initialValue`, `commitStrategy: 'confirm'`, `onCommit`, `displayMode`, `density`。

- [ ] **Step 3: 重構 CalculatorKeyboard 為薄包裝**

`CalculatorKeyboard` 僅保留 SheetShell + `CalculatorKeypad`；既有 E2E `calculator-fix-verification.spec.ts` 必須仍通過。

- [ ] **Step 4: 執行測試**

Run: `pnpm --filter @app/ratewise test -- CalculatorKeypad CalculatorKeyboard`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/ratewise/src/features/calculator/
git commit -m "refactor(ratewise): 抽出 CalculatorKeypad 供 inline numpad 共用"
```

---

### Task 2: InlineNumpad + useAmountNumpad

**Files:**

- Create: `apps/ratewise/src/features/calculator/components/InlineNumpad.tsx`
- Create: `apps/ratewise/src/features/ratewise/hooks/useAmountNumpad.ts`
- Modify: `apps/ratewise/src/config/design-tokens.ts`（`inlineNumpadTokens`）
- Modify: `apps/ratewise/src/features/ratewise/hooks/useCalculatorModal.ts`（re-export 別名）
- Test: `apps/ratewise/src/features/ratewise/hooks/__tests__/useAmountNumpad.test.ts`

- [ ] **Step 1: 新增 inlineNumpadTokens**

```typescript
export const inlineNumpadTokens = {
  height: { default: 320, compact: 260 },
  positionClass: 'fixed inset-x-0 z-20 md:static md:z-auto',
  bottomOffset: 'bottom-[calc(56px+env(safe-area-inset-bottom,0px))]',
  paddingBottom: 'pb-[env(safe-area-inset-bottom,0px)]',
  contentPaddingActive: 'pb-[calc(320px+56px+env(safe-area-inset-bottom,0px))]',
} as const;
```

- [ ] **Step 2: 實作 useAmountNumpad**

升級 `useCalculatorModal` API：`activateField` / `deactivate` / `commit`；預設 `commitStrategy: 'confirm'`。

- [ ] **Step 3: 實作 InlineNumpad**

`fixed` 於 BottomNav 上方；無 `useBodyScrollLock`；`onDismiss` 關閉不寫回。

- [ ] **Step 4: 撰寫 hook 測試**

覆蓋 open → confirm → close 與 field 切換。

- [ ] **Step 5: 執行測試**

Run: `pnpm --filter @app/ratewise test -- useAmountNumpad InlineNumpad`
Expected: PASS

---

### Task 3: ConversionHero 版面重排

**Files:**

- Create: `apps/ratewise/src/features/ratewise/components/ConversionHero.tsx`
- Create: `apps/ratewise/src/features/ratewise/components/HeroStoryBand.tsx`
- Create: `apps/ratewise/src/features/ratewise/components/TrustLine.tsx`
- Create: `apps/ratewise/src/features/ratewise/components/ThumbActionBar.tsx`
- Modify: `apps/ratewise/src/features/ratewise/RateWise.tsx`
- Modify: `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
- Test: `apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.input.test.tsx`

- [ ] **Step 1: 建立 TrustLine**

合併台銀連結 + `formattedLastUpdate` + `ExchangeShopBadge` 條件分支；`data-testid="rate-trust-line"`。

- [ ] **Step 2: 建立 HeroStoryBand**

主匯率 + 倒數 + 可點 sparkline 摘要（Δ%）；點擊預留 `onOpenRateDetail` callback。

- [ ] **Step 3: 建立 ThumbActionBar**

三鍵：記錄、匯率來源、更多；取代 `SingleConverter` 全寬 `addToHistory`。

- [ ] **Step 4: ConversionHero 組裝**

props 與現有 `SingleConverter` 相同；`RateWise` 改渲染 `ConversionHero`。

- [ ] **Step 5: 移除 RateWise 外層 data-source section**

信任資訊僅經 `TrustLine` 輸出。

- [ ] **Step 6: 執行測試與 build**

Run: `pnpm --filter @app/ratewise test && pnpm build:ratewise`
Expected: PASS

---

### Task 4: Swap 與 quick amount 斷點修復

**Files:**

- Modify: `apps/ratewise/src/config/design-tokens.ts`
- Modify: `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`（或 ConversionHero）

- [ ] **Step 1: 移除 swap micro:hidden**

`singleConverterLayoutTokens.swap.visibility` 改為空字串或 `always:visible`。

- [ ] **Step 2: 放寬 from quick amounts 隱藏**

`fromVisibility` 改為摺疊進 MoreSheet 前，先改為全斷點可見（或僅 `nano` 改橫向捲動）。

- [ ] **Step 3: E2E 驗證 390px swap 可見**

Run: `pnpm --filter @app/ratewise test:e2e --grep swap`
Expected: swap button visible on mobile viewport

---

### Task 5: 趨勢圖預設收合

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
- Test: 既有 trend chart 相關測試

- [ ] **Step 1: 新增 `trendExpanded` state（預設 false）**

Hero 僅顯示 `changePercent` 摘要行；展開才 mount lazy `MiniTrendChart`。

- [ ] **Step 2: 確認 idle 載入僅在 expanded 時觸發**

避免首屏 fetch 30 日資料。

- [ ] **Step 3: 執行測試**

Run: `pnpm --filter @app/ratewise test`
Expected: PASS

---

### Task 6: 歷史自動記錄

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`
- Modify: `apps/ratewise/src/i18n/locales/zh-TW.ts`（修正 `noHistoryHint` 與行為一致）

- [ ] **Step 1: 實作 debounced auto-history（2.5s）**

金額穩定且 `amount > 0` 時寫入；去重鍵 `(from, to, amount, rateType, sourceKind, providerId)`。

- [ ] **Step 2: Thumb「＋記錄」改為手動立即寫入**

保留 `addToHistory` 供顯式觸發。

- [ ] **Step 3: 單元測試去重邏輯**

---

### Task 7: Changeset 與文件

**Files:**

- Create: `.changeset/ratewise-2026-ux-phase1.md`
- Modify: `docs/dev/002_development_reward_penalty_log.md`（commit 時）

- [ ] **Step 1: 建立 changeset**

bump: **minor** — 使用者可感知的首屏換算與輸入體驗升級。

- [ ] **Step 2: 更新 002 紀錄**

---

## 後續 Phase（見規格 §4，本計畫不展開逐步任務）

- Task 8+: `CurrencyPickerSheet` + `recentCurrencies`
- Task 9+: `HomepageSEOSection` 折疊收斂
- Task 10+: `MultiConverter` description + 頁面級 RateSelector
- Task 11+: i18n 術語口語化

---

## Self-Review（規格覆蓋）

| 規格 ID              | 本計畫 Task |
| -------------------- | ----------- |
| P1-01 Inline Numpad  | Task 1–2    |
| P1-03 Swap           | Task 4      |
| P1-04 Hero + Trust   | Task 3      |
| P1-06 趨勢收合       | Task 5      |
| P1-07 歷史           | Task 6      |
| P1-05 Currency Sheet | 後續 Phase  |
| P1-08 SEO 去重       | 後續 Phase  |
| P1-09 術語           | 後續 Phase  |
| P1-10 多幣           | 後續 Phase  |
