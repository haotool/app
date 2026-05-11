# 043 UltraReview 自動化審查契約

## 文件控制

| 欄位     | 內容                                 |
| -------- | ------------------------------------ |
| 文件編號 | 043                                  |
| 文件名稱 | UltraReview 自動化審查契約           |
| 文件性質 | 開發流程規範 / 品質門檻契約          |
| 適用範圍 | 所有 PR 審查、Release Candidate 驗證 |
| 文件狀態 | Active                               |
| 建立日期 | 2026-05-11                           |
| 版本     | 1.0.0                                |

## 概述

本文件定義 UltraReview 審查流程的自動化契約，確保所有重大 PR 通過一致、可重現的品質驗證流程。

## 觸發條件

UltraReview 流程在以下條件下觸發：

| 條件                               | 自動觸發 | 手動觸發 |
| ---------------------------------- | -------- | -------- |
| PR 變更檔案 > 50                   | ✅       | -        |
| PR 觸及核心模組（state, PWA, SEO） | ✅       | -        |
| Release Candidate 驗證             | ✅       | -        |
| 用戶指令 `ultrareview`             | -        | ✅       |
| 重大架構變更                       | -        | ✅ 建議  |

## 七階段審查協議

### Phase 1: 情境獲取（Context Acquisition）

**目標**：收集 PR 完整情境

**必要輸出**：

- PR 元數據（title, files, additions, deletions）
- 完整 diff
- CI 狀態
- Codex 審查線程狀態

**契約**：

```yaml
phase1_contract:
  inputs:
    pr_number: required
  outputs:
    pr_metadata: json
    diff: text
    ci_status: all_checks
    codex_threads: json
  gate:
    codex_unresolved_count: 0 # 若 > 0，先執行 codex-review-convergence
```

### Phase 2: 靜態驗證（Static Verification）

**目標**：確保程式碼品質基準

**必要檢查**：

1. SSOT 同步驗證 (`verify-ssot-sync.mjs`)
2. TypeScript 類型檢查
3. Prettier 格式檢查
4. Whitespace 錯誤檢查
5. 技術債務掃描

**契約**：

```yaml
phase2_contract:
  checks:
    ssot_sync:
      command: 'node scripts/verify-ssot-sync.mjs'
      pass_criteria: 'exit_code == 0'
      blocking: true
    typecheck:
      command: 'pnpm --filter @app/ratewise typecheck'
      pass_criteria: 'exit_code == 0'
      blocking: true
    format:
      command: 'pnpm format'
      pass_criteria: 'exit_code == 0'
      blocking: false # 可自動修復
    whitespace:
      command: 'git diff --check'
      pass_criteria: 'no_output'
      blocking: false
    tech_debt:
      command: "rg -n 'TODO|FIXME|HACK|deprecated|legacy' apps/ratewise/src"
      pass_criteria: 'categorized_as_intentional'
      blocking: false
```

### Phase 3: 測試執行（Test Execution）

**目標**：確保功能正確性

**契約**：

```yaml
phase3_contract:
  command: 'pnpm --filter @app/ratewise test'
  pass_criteria:
    all_tests_pass: true
    no_unhandled_rejections: true
    coverage_threshold: 'optional' # 依專案設定
  output_format:
    files_passed: number
    tests_passed: number
    duration: milliseconds
```

### Phase 4: 瀏覽器功能測試（Browser Testing）

**目標**：驗證使用者可見功能

**測試場景**：

| 場景         | URL      | 驗證項目               |
| ------------ | -------- | ---------------------- |
| 首頁載入     | `/`      | 標題、表單元素、無錯誤 |
| 貨幣轉換     | `/`      | 結果顯示、數值正確     |
| 匯率來源切換 | `/`      | 按鈕狀態、數值更新     |
| 多幣種模式   | `/multi` | 清單顯示、所有匯率     |

**契約**：

```yaml
phase4_contract:
  dev_server:
    port: 3001
    startup_pattern: 'Local:.*http'
    timeout_ms: 30000
  browser_tests:
    - scenario: homepage_load
      url: 'http://localhost:3001/'
      assertions:
        - title_contains: 'HaoRate'
        - element_exists: 'combobox'
        - console_errors: 0
    - scenario: currency_conversion
      assertions:
        - result_displayed: true
    - scenario: rate_source_toggle
      assertions:
        - button_state_changed: true
    - scenario: multi_currency
      url: 'http://localhost:3001/multi'
      assertions:
        - currency_count: 18
  evidence:
    screenshots: ['homepage', 'conversion', 'multi']
```

### Phase 5: 最佳實踐驗證（Best Practices Verification）

**目標**：確保符合業界最新標準

**必要來源數量**：20+

**技術領域覆蓋**：

| 領域          | 最少來源數 | 搜尋範例                                      |
| ------------- | ---------- | --------------------------------------------- |
| Zustand       | 3          | "Zustand best practices 2026 SSOT selectors"  |
| React 19      | 3          | "React 19 hooks useMemo performance"          |
| TypeScript    | 2          | "TypeScript interface design patterns"        |
| PWA/Workbox   | 2          | "PWA service worker caching strategies"       |
| Vite          | 2          | "Vite React SPA optimization"                 |
| Testing       | 2          | "React testing library Vitest best practices" |
| Framer Motion | 2          | "Framer Motion performance optimization"      |
| i18n          | 1          | "react-i18next best practices"                |
| OpenAPI       | 1          | "OpenAPI 3.1 specification design"            |
| WCAG          | 1          | "WCAG 2.2 React accessibility"                |
| Tailwind      | 1          | "Tailwind CSS responsive design"              |

**契約**：

```yaml
phase5_contract:
  minimum_sources: 20
  per_domain_minimum: 'as_specified_above'
  verification_method:
    - web_search
    - context7_library_docs
  output:
    compliance_matrix: true
    anti_patterns_detected: list
    recommendations: list
```

### Phase 6: 生產建置驗證（Production Build）

**目標**：確保可部署

**契約**：

```yaml
phase6_contract:
  command: 'pnpm build:ratewise'
  pass_criteria:
    exit_code: 0
    dist_generated: true
    no_critical_warnings: true
  timeout_ms: 120000
```

### Phase 7: 認證報告生成（Certification Report）

**目標**：產出可追蹤的審查證據

**報告結構**：

```markdown
## PR #<N> UltraReview 認證報告

### 審查摘要表

| 檢查點 | 狀態 | 證據 |
| ------ | ---- | ---- |

### 功能驗證

| 功能 | 結果 | 備註 |
| ---- | ---- | ---- |

### 最佳實踐審計 (20+ 來源)

| 領域 | 來源數 | 合規性 | 關鍵發現 |
| ---- | ------ | ------ | -------- |

### 技術債務評估

| 類別 | 數量 | 評估 |
| ---- | ---- | ---- |

### 結論

狀態：APPROVED / NEEDS_WORK / BLOCKED
殘餘風險：[列表]
建議：[列表]
```

## Rate Provider 模型契約 (v2.7+)

### 類型層級 SSOT

```typescript
// rateProviderTypes.ts 為唯一真相來源
interface RateProviderTypeContract {
  RateSourceKind: 'bank' | 'exchange-shop';
  RateProviderId: 'bot' | 'moneybox';
  ProviderSelectionMode: 'auto' | 'manual';
}
```

### 層級責任契約

| 層級  | 檔案                      | 責任               | 禁止事項              |
| ----- | ------------------------- | ------------------ | --------------------- |
| Type  | `rateProviderTypes.ts`    | 定義所有類型       | 包含邏輯              |
| Logic | `rateProviderRanking.ts`  | 排序、解析偏好     | 持久化狀態            |
| Store | `converterStore.ts`       | 持久化偏好         | 實作排序邏輯          |
| Hook  | `useCurrencyConverter.ts` | 整合 store + logic | 直接操作 localStorage |
| UI    | `RateSelector.tsx` 等     | 顯示、觸發 action  | 重新實作選擇邏輯      |

### 資料流契約

```
User Action → UI Component → Store Action → Store State
                                              ↓
                                         Hook (useCurrencyConverter)
                                              ↓
                                         Logic (resolveProviderPreference)
                                              ↓
                                         Resolved State → UI Render
```

## 失敗處理協議

| 階段    | 失敗類型          | 處理方式                              |
| ------- | ----------------- | ------------------------------------- |
| Phase 1 | Codex threads > 0 | 暫停，執行 `codex-review-convergence` |
| Phase 2 | SSOT drift        | 阻塞，必須修復                        |
| Phase 2 | TypeScript error  | 阻塞，必須修復                        |
| Phase 2 | Format error      | 警告，自動修復                        |
| Phase 3 | Test failure      | 阻塞，必須修復                        |
| Phase 4 | Browser error     | 阻塞，必須修復                        |
| Phase 4 | Console error     | 警告，視嚴重性                        |
| Phase 5 | < 20 sources      | 警告，繼續但標註                      |
| Phase 6 | Build failure     | 阻塞，必須修復                        |

## CI/CD 整合

### GitHub Actions 觸發

```yaml
# .github/workflows/ultrareview.yml (建議)
name: UltraReview
on:
  pull_request:
    types: [labeled]
jobs:
  ultrareview:
    if: contains(github.event.label.name, 'ultrareview')
    runs-on: ubuntu-latest
    steps:
      # ... 依照七階段執行
```

### 手動觸發指令

```bash
# 在 Cursor Agent 中
ultrareview PR#378

# 或自動偵測當前分支
ultrareview
```

## 相關技能整合

| 條件              | 調用技能                      |
| ----------------- | ----------------------------- |
| 未解決 Codex 線程 | `codex-review-convergence`    |
| SSOT 飄移         | `ssot-drift-clean-code-audit` |
| 安全疑慮          | `security-review`             |
| PWA 問題          | `pwa-development`             |
| 測試失敗          | `vitest` 或 `tdd`             |
| TypeScript 錯誤   | `typescript`                  |

## 修訂紀錄

| 日期       | 版本  | 變更摘要                                        |
| ---------- | ----- | ----------------------------------------------- |
| 2026-05-11 | 1.0.0 | 初始版本，基於 PR #378 UltraReview 執行經驗建立 |
