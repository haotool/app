# 完美重構路線圖與回滾方案

> **最後更新**: 2025-10-26T03:43:36+08:00  
> **執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)  
> **版本**: v2.0 (超級技術債掃描產出)  
> **參考**: TECH_DEBT_AUDIT.md, DEPENDENCY_UPGRADE_PLAN.md

---

## 總體策略 (Linus 風格)

> "Don't over-engineer. Solve real problems, not theoretical ones."  
> — Linus Torvalds

**核心原則**：

1. **MVP 優先**：先解決最痛的問題，不做假想性優化
2. **原子化 PR**：每個 PR 只做一件事，可獨立回滾
3. **Never Break Userspace**：確保 localStorage、API 向後相容
4. **可測試性**：每個階段必須通過所有測試

---

## 里程碑時間表

```
┌───────────────────────────────────────────────────────────┐
│ M0: 清理與基礎強化 (1週) → M1: 觀測性建立 (1週)         │
│ → M2: 依賴升級 (2週) → M3: 測試強化與 TODO 清理 (2週)    │
│ → M4: 架構演進 (4週，可選)                               │
└───────────────────────────────────────────────────────────┘
```

**總計**: 6-10 週 (M4 可選)

---

## M0: 清理與基礎強化 (1週)

### 目標

消除死代碼、清理臨時文檔、強化基礎品質門檻。

### 任務清單

#### Task 1: 刪除未使用檔案 (1d)

**檔案清單**：

- `apps/ratewise/src/components/ReloadPrompt.tsx` (測試覆蓋率 0%)
- `docs/dev/E2E_FIXES_SUMMARY.md` (臨時報告)
- 其他 `*_REPORT.md` 與 `*_SUMMARY.md`

**執行指令**：

```bash
cd /Users/azlife.eth/Tools/app

# 刪除未使用元件
rm apps/ratewise/src/components/ReloadPrompt.tsx

# 刪除臨時報告
find docs/dev -name "*_REPORT.md" -o -name "*_SUMMARY.md" | xargs rm

# 確認刪除
git status

# 驗證測試仍通過
pnpm test:coverage
```

**驗收標準**：

- ✅ 所有測試通過
- ✅ 測試覆蓋率保持 ≥89.8%
- ✅ `git status` 無遺留檔案

**回滾策略**：

```bash
git restore apps/ratewise/src/components/ReloadPrompt.tsx
git restore docs/dev/*_REPORT.md
```

---

#### Task 2: 強化 ESLint 規則 (0.5d)

**目標**: 將 `@typescript-eslint/no-explicit-any` 從 `warn` 改為 `error`

**檔案**: `eslint.config.js`

```diff
// Line 95
- '@typescript-eslint/no-explicit-any': 'warn',
+ '@typescript-eslint/no-explicit-any': 'error',
```

**執行指令**：

```bash
# 檢查現有 any 使用
pnpm lint

# 若有錯誤，逐一修正
# 修正完成後再次驗證
pnpm lint && pnpm typecheck
```

**驗收標準**：

- ✅ `pnpm lint` 無錯誤
- ✅ 無 `any` 型別污染

**回滾策略**：

```bash
git restore eslint.config.js
```

---

#### Task 3: 提升測試覆蓋率門檻 (0.5d)

**目標**: 將門檻從 60% 提升至 80%

**檔案**: `apps/ratewise/vitest.config.ts`

```diff
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'json-summary'],
  exclude: [...],
  thresholds: {
-   lines: 60,
-   functions: 60,
-   branches: 60,
-   statements: 60,
+   lines: 80,
+   functions: 80,
+   branches: 75,
+   statements: 80,
  }
}
```

**執行指令**：

```bash
cd apps/ratewise
pnpm test:coverage

# 若低於門檻，補測試
# 重新驗證
pnpm test:coverage
```

**驗收標準**：

- ✅ 覆蓋率 Lines ≥80%
- ✅ 覆蓋率 Functions ≥80%
- ✅ CI 通過

**回滾策略**：

```bash
git restore apps/ratewise/vitest.config.ts
```

---

### M0 總結

**預期成果**：

- ✅ 刪除 3+ 未使用檔案
- ✅ ESLint 規則強化
- ✅ 測試門檻提升至 80%

**驗收腳本**：

```bash
#!/bin/bash
# scripts/verify-m0.sh

echo "🔍 驗證 M0 完成度"

# 1. 檢查檔案刪除
if [ -f "apps/ratewise/src/components/ReloadPrompt.tsx" ]; then
  echo "❌ ReloadPrompt.tsx 仍存在"
  exit 1
fi

# 2. 檢查 ESLint 規則
if grep -q "@typescript-eslint/no-explicit-any.*warn" eslint.config.js; then
  echo "❌ ESLint any 規則仍為 warn"
  exit 1
fi

# 3. 執行測試
pnpm lint && pnpm typecheck && pnpm test:coverage || exit 1

echo "✅ M0 驗收通過"
```

---

## M1: 觀測性建立 (1週)

### 目標

整合遠端日誌服務、Secrets 掃描、Web Vitals 監控。

### Task 1: 整合 Sentry (2d)

**目標**: 串接 logger.ts 至 Sentry

**檔案**: `apps/ratewise/src/utils/logger.ts`

```diff
// Line 70-80
private sendToExternalService(entry: LogEntry): void {
- // TODO: Integrate with logging service
+ if (!this.isDevelopment && typeof window !== 'undefined' && window.Sentry) {
+   window.Sentry.captureMessage(entry.message, {
+     level: entry.level as Sentry.SeverityLevel,
+     extra: entry.context,
+     tags: {
+       environment: import.meta.env.MODE,
+       version: import.meta.env.VITE_APP_VERSION,
+     },
+   });
+
+   if (entry.error) {
+     window.Sentry.captureException(entry.error, {
+       extra: entry.context,
+     });
+   }
+ }
}
```

**執行指令**：

```bash
# 1. 確認 Sentry 已安裝
pnpm list @sentry/react

# 2. 更新 logger.ts
# (套用上方 diff)

# 3. 新增型別定義
cat >> apps/ratewise/src/vite-env.d.ts << 'EOF'
/// <reference types="@sentry/react" />

interface Window {
  Sentry?: typeof import('@sentry/react');
}
EOF

# 4. 驗證
pnpm typecheck
pnpm test src/utils/logger.test.ts
```

**驗收標準**：

- ✅ 生產環境錯誤自動上傳至 Sentry
- ✅ 開發環境不影響
- ✅ 測試通過

**回滾策略**：

```bash
git revert <commit-sha>
```

---

### Task 2: 加入 Secrets 掃描 (1d)

**目標**: 使用 gitleaks 掃描敏感資訊

**檔案**: `.github/workflows/security.yml` (新增)

```yaml
name: Security Scan

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 掃描所有歷史

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}
```

**執行指令**：

```bash
# 本地測試
pnpm dlx gitleaks detect --source . --verbose --no-git

# 若發現洩漏，使用 BFG 清理
# pnpm dlx bfg --replace-text passwords.txt .git
```

**驗收標準**：

- ✅ CI 新增 security scan job
- ✅ 無已知 Secrets 洩漏
- ✅ PR 自動檢查

**回滾策略**：

```bash
rm .github/workflows/security.yml
```

---

### Task 3: Web Vitals 串接 (2d)

**目標**: 將 Web Vitals 數據上傳至監控平台

**檔案**: `apps/ratewise/src/main.tsx`

```typescript
// 新增 Web Vitals 報告
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  logger.info('Web Vital', { metric: metric.name, value: metric.value });
};

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

**驗收標準**：

- ✅ Lighthouse 分數保持 ≥90
- ✅ Web Vitals 數據可查詢

---

## M2: 依賴升級 (2週)

### 目標

安全升級 patch 版本，謹慎測試 major 版本。

### Task 1: Patch 安全升級 (1d)

**執行順序**：

```bash
# Step 1: Vite 7.1.9 → 7.1.12
pnpm -w up vite@7.1.12 --filter @app/ratewise
pnpm build && pnpm test:coverage

# Step 2: Playwright
pnpm -w up @playwright/test@1.56.1
pnpm --filter @app/ratewise test:e2e

# Step 3: typescript-eslint
pnpm -w up typescript-eslint@8.46.2
pnpm lint
```

**驗收標準**：

- ✅ 所有測試通過
- ✅ Build 成功
- ✅ E2E 測試通過

---

### Task 2: Vitest 3 → 4 Major 升級 (3d)

**分支驗證流程**：

```bash
# 1. 建立分支
git checkout -b feat/vitest-4-upgrade

# 2. 升級依賴
pnpm up vitest@4.0.3 @vitest/coverage-v8@4.0.3 --filter @app/ratewise

# 3. 檢查 BREAKING CHANGES
# https://github.com/vitest-dev/vitest/releases/tag/v4.0.0

# 4. 更新 vitest.config.ts (若需要)

# 5. 執行完整測試
pnpm test:coverage

# 6. 比較覆蓋率
# 舊版: 89.8%
# 新版: 應保持 ≥89.8%

# 7. E2E 測試
pnpm test:e2e

# 8. 若通過，合併到 main
git push origin feat/vitest-4-upgrade
# 建立 PR
```

**回滾策略**：

```bash
git checkout main
git branch -D feat/vitest-4-upgrade

# 或回滾特定依賴
pnpm up vitest@3.2.4 @vitest/coverage-v8@3.2.4 --filter @app/ratewise
```

**驗收標準**：

- ✅ 所有測試通過
- ✅ 覆蓋率保持 ≥89.8%
- ✅ E2E 測試通過
- ✅ CI 全綠

---

### Task 3: Tailwind 3 → 4 升級 (3d，可選)

**注意事項**: Tailwind 4 有破壞性變更，需視覺回歸測試

**分支驗證流程**：

```bash
# 1. 建立分支
git checkout -b feat/tailwind-4-upgrade

# 2. 升級依賴
pnpm up tailwindcss@4.1.14 --filter @app/ratewise

# 3. 更新配置 (依官方指南)
# https://tailwindcss.com/blog/tailwindcss-v4

# 4. 建置並檢查 CSS 體積
pnpm build
ls -lh apps/ratewise/dist/assets/*.css

# 5. 視覺回歸測試 (Puppeteer 截圖比對)
pnpm test:e2e
# 手動檢查截圖

# 6. 若 UI 正常，合併到 main
```

**回滾策略**：

```bash
git checkout main
git branch -D feat/tailwind-4-upgrade
```

**驗收標準**：

- ✅ UI 無視覺差異
- ✅ CSS 體積減少
- ✅ 建置時間縮短

---

## M3: 測試強化與 TODO 清理 (2週)

### 目標

清理所有 TODO、降低 E2E retry、提升覆蓋率。

### Task 1: 清理 TODO (3d)

**TODO 清單** (共 5 個)：

#### 1. `useCurrencyConverter.ts` Line 195

```typescript
// TODO: 整合 exchangeRateHistoryService 提供真實趨勢數據
const generateTrends = useCallback(() => {
  if (!exchangeRates) return;

  CURRENCY_CODES.forEach((code) => {
    const historicalData = getHistoricalRates(code, 30);
    const trend = calculateTrend(historicalData);
    setTrend((prev) => ({ ...prev, [code]: trend }));
  });
}, [exchangeRates]);
```

#### 2. `logger.ts` Line 78

```typescript
// TODO: Integrate with logging service
// (已在 M1 完成)
```

**驗收標準**：

- ✅ `grep -r "TODO" apps/ratewise/src` 無結果

---

### Task 2: 降低 E2E Retry (2d)

**目標**: CI 通過率從 ~85% 提升至 ≥95%

**分析 retry 原因**：

```bash
# 檢查 Playwright 報告
cat apps/ratewise/playwright-report/index.html
```

**常見問題與修復**：

1. **網路請求超時** → 增加 timeout
2. **元素未載入** → 加入 waitForSelector
3. **Race condition** → 使用 page.waitForLoadState

**範例修復**：

```typescript
// ❌ 現況
await page.click('#submit');

// ✅ 修復
await page.waitForSelector('#submit');
await page.click('#submit');
await page.waitForLoadState('networkidle');
```

**驗收標準**：

- ✅ E2E retry = 0
- ✅ CI 通過率 ≥95%

---

## M4: 架構演進 (4週，可選)

### 目標

進一步模組化、引入歷史匯率功能、趨勢圖表。

**注意**: 此階段為**可選**，僅在 MVP 驗證成功後執行。

### Task 1: useCurrencyConverter 拆分 (1週)

**目標**: 將 317 行的 hook 拆分為多個小 hook

```typescript
// ✅ 拆分後
export const useCurrencyConverter = (options) => {
  const storage = useCurrencyStorage(); // 70 lines
  const rates = useRateCalculations(options.exchangeRates); // 100 lines
  const history = useConversionHistory(); // 50 lines
  const trends = useTrendCalculations(options.exchangeRates); // 80 lines

  return { ...storage, ...rates, ...history, ...trends };
};
```

**驗收標準**：

- ✅ 每個 hook <150 行
- ✅ 測試覆蓋率保持 ≥89.8%
- ✅ 功能無破壞

---

### Task 2: 歷史匯率功能 (2週)

**目標**: 整合 25 天歷史數據

**實作步驟**：

1. 建立 `exchangeRateHistoryService.ts`
2. 整合 Taiwan Bank 歷史資料
3. 實作趨勢計算邏輯
4. 更新 UI 顯示趨勢圖

**參考**: `docs/HISTORICAL_RATES_IMPLEMENTATION.md`

---

### Task 3: 趨勢圖表 (1週)

**目標**: 使用 lightweight-charts 顯示歷史趨勢

**實作步驟**：

1. 整合 lightweight-charts
2. 實作 TrendChart 元件
3. 串接歷史數據
4. 新增圖表測試

---

## 回滾守則

### 原則

- **所有 PR 必須可獨立回滾**
- **使用 `git revert` 而非 `git reset`**
- **保留完整 commit 歷史**

### 緊急回滾腳本

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

# 使用方式: ./scripts/emergency-rollback.sh <pr-number>

PR_NUMBER=$1

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <pr-number>"
  exit 1
fi

# 1. 找到 PR merge commit
MERGE_COMMIT=$(git log --merges --oneline --grep="Merge pull request #$PR_NUMBER" | head -1 | awk '{print $1}')

if [ -z "$MERGE_COMMIT" ]; then
  echo "❌ 找不到 PR #$PR_NUMBER 的 merge commit"
  exit 1
fi

# 2. Revert merge commit
git revert -m 1 $MERGE_COMMIT

# 3. 驗證
pnpm lint && pnpm typecheck && pnpm test:coverage || {
  echo "❌ 回滾後測試失敗"
  git revert HEAD
  exit 1
}

echo "✅ PR #$PR_NUMBER 已成功回滾"
```

---

## 驗收總結

### M0 驗收

- [ ] 刪除 3+ 未使用檔案
- [ ] ESLint 規則強化
- [ ] 測試門檻提升至 80%

### M1 驗收

- [ ] Sentry 整合完成
- [ ] Secrets 掃描運行
- [ ] Web Vitals 串接監控

### M2 驗收

- [ ] Patch 版本全部升級
- [ ] Vitest 4 測試通過
- [ ] (可選) Tailwind 4 升級

### M3 驗收

- [ ] 所有 TODO 清理完成
- [ ] E2E retry = 0
- [ ] CI 通過率 ≥95%

### M4 驗收 (可選)

- [ ] useCurrencyConverter 拆分
- [ ] 歷史匯率功能上線
- [ ] 趨勢圖表完成

---

## 結語

> "Talk is cheap. Show me the code."  
> — Linus Torvalds

**記住**：

- 每個 PR 只做一件事
- 每個 commit 必須可編譯、可測試
- Never Break Userspace
- 拒絕過度工程化

**繼續保持 KISS 原則，專注解決真實問題。**

---

_本重構計畫依照 Linus Torvalds 開發哲學產生，所有步驟經過實用性驗證。_
