# RateWise 最佳實踐落地分析報告

> **建立時間**: 2025-12-02T23:23:09+08:00
> **版本**: v1.0.0
> **狀態**: ✅ 已完成
> **方法論**: Ultrathink Philosophy + BDD + Linus 三問

---

## 1. 分析摘要

### 1.1 過去對話需求萃取

| 主題           | 需求關鍵字                                                            | 完成狀態  |
| -------------- | --------------------------------------------------------------------- | --------- |
| 計算機同步修復 | useCalculator initialValue 同步、BDD 紅燈→綠燈                        | ✅ 已完成 |
| 歷史資料擴展   | 25 天→30 天全域更新                                                   | ✅ 已完成 |
| 文檔 SSOT 同步 | FAQ/About/Guide 真實性驗證、移除不實功能描述                          | ✅ 已完成 |
| SEO 深度優化   | AI Search Optimization、LLMO、GEO、結構化資料                         | ✅ 已完成 |
| 測試覆蓋率提升 | evaluator.ts、validator.ts、Layout.tsx、exchangeRateHistoryService.ts | ✅ 已完成 |
| 依賴升級       | vite 7.2.6、motion 12.23.25、@sentry/react 10.27.0、workbox 7.4.0     | ✅ 已完成 |
| E2E 測試       | Calculator 功能驗證、PWA、Playwright                                  | ✅ 已完成 |
| 授權變更       | GPL-3.0、強制 fork 開源、作者署名                                     | ✅ 已完成 |

### 1.2 專案現況指標

| 指標                        | 當前值 | 目標值 | 狀態    |
| --------------------------- | ------ | ------ | ------- |
| 單元測試覆蓋率 (Statements) | 93.55% | ≥80%   | ✅ 超標 |
| 單元測試覆蓋率 (Branches)   | 83.95% | ≥80%   | ✅ 達標 |
| 單元測試覆蓋率 (Functions)  | 96.88% | ≥80%   | ✅ 超標 |
| 單元測試覆蓋率 (Lines)      | 95.22% | ≥80%   | ✅ 超標 |
| E2E 測試通過率              | 100%   | ≥95%   | ✅ 超標 |
| ESLint 錯誤                 | 0      | 0      | ✅ 達標 |
| TypeScript 錯誤             | 0      | 0      | ✅ 達標 |
| 測試總數                    | 813    | -      | ✅ 穩定 |
| 獎懲總分                    | 213    | >120   | ✅ 優秀 |

---

## 2. 最佳實踐優化方案

### 2.1 已實施的最佳實踐

| 實踐項目                        | 依據                             | 實施日期   |
| ------------------------------- | -------------------------------- | ---------- |
| 計算機同步 useEffect 修復       | [context7:react/docs] + BDD      | 2025-12-02 |
| 25→30 天歷史資料全域更新        | [LINUS_GUIDE.md:SSOT 原則]       | 2025-12-02 |
| FAQ/About 版本資訊更正          | [SSOT:真實性驗證]                | 2025-12-02 |
| 移除「自訂期間」不實功能描述    | [LINUS_GUIDE.md:誠實原則]        | 2025-12-02 |
| GPL-3.0 授權強制 fork 開源      | GNU GPL-3.0 License              | 2025-11-30 |
| Core Web Vitals INP 監控        | [context7:web-vitals:2025-11-30] | 2025-11-30 |
| Nginx alias 指令修復 robots.txt | [nginx.org/docs]                 | 2025-11-30 |
| BDD 測試驅動開發                | [docs/prompt/BDD.md]             | 2025-12-01 |
| URL 標準化 (小寫 + 尾斜線)      | [Google Search Central]          | 2025-12-01 |

### 2.2 待實施的最佳實踐

| 優先級 | 實踐項目                    | 依據                                | 風險評估 |
| ------ | --------------------------- | ----------------------------------- | -------- |
| P1     | storage.ts 測試覆蓋率提升   | LINUS_GUIDE.md                      | 低       |
| P2     | React Router v7 升級評估    | [context7:remix-run/react-router]   | 中       |
| P2     | Tailwind CSS v4 升級評估    | [context7:v3_tailwindcss]           | 中       |
| P3     | vite-plugin-pwa Vite 7 支援 | [context7:vite-pwa/vite-plugin-pwa] | 高       |

---

## 3. 專案步驟清單

### 3.1 2025-12-02 已完成項目

- [x] **計算機同步 BDD 修復**
  - `useCalculator.ts` 新增 useEffect 同步 initialValue
  - 新增 3 個 BDD 測試案例
  - 813/813 測試全通過

- [x] **25→30 天全域更新**
  - `SingleConverter.tsx`: `MAX_TREND_DAYS = 30`
  - `exchangeRateHistoryService.ts`: `MAX_HISTORY_DAYS = 30`
  - 13 個幣別頁面更新
  - 40+ 文檔檔案同步

- [x] **FAQ/About 真實性修正**
  - Vite 7 / Tailwind 3 / lightweight-charts 版本資訊更正
  - 移除「自訂期間」不實功能描述
  - llms.txt 30 天數據更新

### 3.2 待完成項目

- [ ] storage.ts 測試覆蓋率提升 (82.6% → 90%)
- [ ] Major 依賴升級評估文檔
- [ ] React Router v7 升級測試 (分支驗證)
- [ ] Tailwind CSS v4 升級測試 (分支驗證)
- [ ] vite-plugin-pwa Vite 7 兼容性監控

---

## 4. To-Do List

| ID   | 優先級 | 任務                        | 負責人 | 預估時程 | 狀態      |
| ---- | ------ | --------------------------- | ------ | -------- | --------- |
| D0-1 | P0     | 計算機同步 BDD 修復         | Agent  | 30 min   | ✅ 完成   |
| D0-2 | P0     | 25→30 天全域更新            | Agent  | 1 hr     | ✅ 完成   |
| D0-3 | P0     | FAQ/About 真實性修正        | Agent  | 20 min   | ✅ 完成   |
| D0-4 | P0     | CI/CD 驗證 + 生產構建       | Agent  | 15 min   | ✅ 完成   |
| P0-1 | P0     | 獎懲記錄更新                | Agent  | 5 min    | ✅ 完成   |
| P1-1 | P1     | storage.ts 測試覆蓋率提升   | Agent  | 20 min   | ⏳ 待開始 |
| P1-2 | P1     | 建立 Major 依賴升級評估文檔 | Agent  | 30 min   | ⏳ 待開始 |
| P2-1 | P2     | React Router v7 升級評估    | Agent  | 2 hr     | ⏳ 待開始 |
| P2-2 | P2     | Tailwind CSS v4 升級評估    | Agent  | 2 hr     | ⏳ 待開始 |

---

## 5. 子功能規格

### 5.1 計算機同步 BDD 修復（已完成）

**問題根因**:

```typescript
// ❌ 原始問題：useState 只在首次渲染時使用 initialValue
const [state, setState] = useState<CalculatorState>({
  expression: initialValue?.toString() ?? '',
  result: null,
  error: null,
});
```

**解決方案**:

```typescript
// ✅ 新增 useEffect 同步 initialValue 變更
useEffect(() => {
  if (initialValue !== undefined) {
    setState((prev) => ({
      ...prev,
      expression: initialValue.toString(),
      result: null,
      error: null,
    }));
    setPreview(null);
  }
}, [initialValue]);
```

**BDD 測試案例**:

1. `應在 initialValue 變更時重置表達式`
2. `應在 initialValue 變更後保持獨立計算能力`
3. `應在 undefined 變更為有效數值時正確同步`

### 5.2 25→30 天全域更新（已完成）

**變更範圍**:

- **源碼**: 2 個常數 (`MAX_TREND_DAYS`, `MAX_HISTORY_DAYS`)
- **頁面**: 13 個幣別頁面 + FAQ/About/Guide
- **文檔**: 40+ 檔案
- **測試**: 4 個測試案例期望值

**驗收標準**:

- [x] `grep "25 天" apps/ratewise/` 返回 0 結果
- [x] FAQ 頁面顯示「7~30 天」
- [x] 813/813 測試通過
- [x] 生產構建成功

### 5.3 storage.ts 測試覆蓋率提升（待開始）

**目標**: 82.6% → 90%

**未覆蓋行**: 4, 10-15, 26

**測試案例規格**:

```typescript
// 測試 localStorage 不可用的情況 (Line 4)
it('應該在 localStorage 不可用時優雅降級', () => {
  // Mock localStorage.setItem 拋出異常
});

// 測試快取過期邏輯 (Line 10-15)
it('應該在快取過期後返回 null', () => {
  // 使用 vi.useFakeTimers() 模擬時間流逝
});

// 測試 JSON 解析錯誤 (Line 26)
it('應該在 JSON 解析失敗時返回 null', () => {
  // Mock localStorage.getItem 返回無效 JSON
});
```

---

## 6. 當前進度實作

### 6.1 已完成的變更

```bash
# 計算機同步修復
apps/ratewise/src/features/calculator/hooks/useCalculator.ts
# + useEffect 同步 initialValue (lines 52-65)

apps/ratewise/src/features/calculator/hooks/__tests__/useCalculator.test.ts
# + 3 個 BDD 測試案例 (lines 58-100)

# 25→30 天全域更新
apps/ratewise/src/features/ratewise/components/SingleConverter.tsx
# MAX_TREND_DAYS = 25 → 30

apps/ratewise/src/services/exchangeRateHistoryService.ts
# MAX_HISTORY_DAYS: 25 → 30

# 文檔同步
40+ 檔案的 "25 天" → "30 天" 替換

# FAQ/About 真實性修正
apps/ratewise/src/pages/FAQ.tsx
# - 移除「自訂期間」描述
# - 更新為「7~30 天」

apps/ratewise/src/pages/About.tsx
# - Vite 6 → Vite 7
# - Tailwind 4 → Tailwind 3
# - Recharts → lightweight-charts (TradingView)
```

### 6.2 驗證結果

```bash
# 測試結果
pnpm --filter @app/ratewise test
# Test Files  45 passed (45)
# Tests  813 passed (813)

# 覆蓋率
# Statements: 93.55%
# Branches: 83.95%
# Functions: 96.88%
# Lines: 95.22%

# 構建結果
pnpm build
# ✅ SSG build completed
# ✅ 所有 SEO 檔案正確輸出
```

### 6.3 獎懲記錄更新

```markdown
| ✅ 成功 | 計算機同步問題 BDD 修復 + 25→30 天全域更新 | +8 | 2025-12-02 |
```

當前總分: 205 → 213 (+8)

---

## 7. 後續追蹤

### 7.1 監控項目

- [ ] vite-plugin-pwa GitHub - Vite 7 支援
- [ ] react-helmet-async GitHub - React 19 支援
- [ ] React Router v7 穩定性

### 7.2 定期檢查

- **每週**: 檢查 outdated packages
- **每月**: 評估 major 升級可行性
- **每季**: 技術債審計

---

## 參考資料

1. [BDD.md](../prompt/BDD.md) - BDD 開發流程
2. [LINUS_GUIDE.md](../../LINUS_GUIDE.md) - Linus 開發哲學
3. [AI_SEARCH_OPTIMIZATION_SPEC.md](./AI_SEARCH_OPTIMIZATION_SPEC.md) - SEO 優化規格
4. [002_development_reward_penalty_log.md](./002_development_reward_penalty_log.md) - 獎懲記錄
5. [Context7: React Docs](https://react.dev) - React 官方文檔
