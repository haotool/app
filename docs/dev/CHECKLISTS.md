# 品質檢查清單

> **最後更新**: 2026-01-29T01:11:11+08:00  
> **執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)  
> **版本**: v2.1 (核心 CI 流程調整)  
> **狀態**: 持續更新  
> **參考**: TECH_DEBT_AUDIT.md, REFACTOR_PLAN.md, DEPENDENCY_UPGRADE_PLAN.md

---

## Linus 品質哲學

> "If you think your code is too complex, you're probably right. Simplify."  
> — Linus Torvalds

**品質檢查三原則**：

1. **快速驗證**：能在 30 秒內執行的檢查，才是好檢查
2. **自動化優先**：人工檢查容易出錯，交給 CI
3. **實用主義**：100% 覆蓋率不重要，測試關鍵路徑才重要

---

## Quick Wins (立即可做)

### 已完成 ✅

- [x] 補齊 README.md
- [x] 補齊 .editorconfig
- [x] 修正 PostCSS → ESM
- [x] 補齊 Error Boundary
- [x] 補齊 .env.example

### 本週完成（M0 - 清理與基礎強化）

- [x] 建立 `apps/ratewise/public/robots.txt`、`sitemap.xml`
- [ ] 刪除臨時報告文檔（E2E_FIXES_SUMMARY.md 等）
- [ ] 刪除 ReloadPrompt.tsx（未使用，測試覆蓋率 0%）
- [ ] 提升測試覆蓋率門檻至 80%
- [ ] ESLint `any` 規則改為 `error`
- [ ] 建立品質門檻自動化檢查腳本

---

## 阻擋項 (必須修復才能上線)

### 已完成 ✅

- [x] **測試覆蓋率 ≥80%** (目前 89.8%)
- [x] **CI/CD Pipeline**
- [x] **Docker 化**
- [x] **安全標頭**（Cloudflare/Nginx 層）
- [x] **基礎觀測性 (Logger + Error Boundary)**

### 待完成（M1 - 觀測性）⚠️

- [ ] **Sentry 正確配置並測試**（目前測試覆蓋率 0%）
- [ ] **Web Vitals 整合至監控平台**（目前測試覆蓋率 0%）
- [ ] **Logger 整合遠端服務**（目前僅 console 輸出）

---

## 長期改善

### 已完成 ✅

- [x] 拆分 RateWise 元件
- [x] TypeScript 嚴格化
- [x] 依賴鎖版策略
- [x] E2E 測試基礎建立

### 進行中 🔄

- [ ] **Vite 7 Build 優化**（目前 6.4.0，可升級至 7.1.10）
- [ ] **Tailwind 4 升級**（目前 3.4.18，可升級至 4.1.14）
- [ ] **E2E 測試穩定性**（目前有 retry，需降至 0）
- [ ] **Lighthouse CI 整合**（改為手動，不納入核心 CI）

### 規劃中 📋

- [ ] TODO 項目完成（5 個待處理）
  - Logger 整合遠端服務
  - Safari 404 修復
  - 歷史匯率數據整合
- [ ] 測試覆蓋率達 95%
- [ ] Commitlint 20 升級
- [ ] Husky 9 升級

---

## 命令快查

### 開發

```bash
# 啟動開發伺服器
pnpm dev

# 建置生產版本
pnpm build

# 預覽生產版本
pnpm preview
```

### 測試

```bash
# 執行單元測試
pnpm test

# 執行測試並產生覆蓋率報告
pnpm test:coverage

# 執行 E2E 測試
pnpm --filter @app/ratewise test:e2e

# 查看 E2E 測試報告
pnpm --filter @app/ratewise test:e2e:report
```

### 品質檢查

```bash
# 類型檢查
pnpm typecheck

# Lint 檢查
pnpm lint

# 格式檢查
pnpm format

# 完整品質檢查（建議在 commit 前執行）
bash scripts/verify-quality.sh
```

### 依賴管理

```bash
# 檢查過時依賴
pnpm -r outdated

# 安全審計
pnpm audit --prod --audit-level=high

# 升級依賴（謹慎執行）
pnpm -w up --interactive --latest
```

---

## 品質門檻

| 項目                | 目標  | 現況   | 狀態        |
| ------------------- | ----- | ------ | ----------- |
| 測試覆蓋率（lines） | ≥80%  | 89.8%  | ✅          |
| 測試覆蓋率門檻      | ≥80%  | 60%    | ⚠️ 需提升   |
| TypeScript Strict   | 啟用  | 啟用   | ✅          |
| ESLint `any` 規則   | Error | Warn   | ⚠️ 需強化   |
| Lighthouse 分數     | ≥90   | 未測量 | ⚠️ 需整合   |
| CI 通過率           | ≥95%  | ~85%   | ⚠️ 有 retry |
| 技術債項目          | 0     | 10     | ⚠️ 需清理   |
| TODO 數量           | 0     | 5      | ⚠️ 需完成   |

---

## 重構里程碑追蹤

詳見 `REFACTOR_PLAN.md` - 完整 6-10 週重構計畫

### M0: 清理與基礎強化（1週）🔄 進行中

- [ ] 刪除 ReloadPrompt.tsx (未使用)
- [ ] 刪除臨時報告文檔 (_\_REPORT.md, _\_SUMMARY.md)
- [ ] ESLint `any` 規則改為 error
- [ ] 測試門檻提升至 80%

**驗收腳本**: `bash scripts/verify-m0.sh`

### M1: 觀測性建立（1週）📋 待開始

- [ ] Sentry 整合 (logger.ts Line 78)
- [ ] Secrets 掃描 (gitleaks)
- [ ] Web Vitals 串接監控

**驗收腳本**: `bash scripts/verify-security.sh`

### M2: 依賴升級（2週）📋 待開始

- [ ] Patch 安全升級 (Vite 7.1.12, Playwright 1.56.1)
- [ ] Vitest 3 → 4 (major，需分支驗證)
- [ ] (可選) Tailwind 3 → 4

**驗收腳本**: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`

### M3: 測試強化與 TODO 清理（2週）📋 待開始

- [ ] 清理 5 個 TODO
- [ ] 降低 E2E retry 至 0
- [ ] CI 通過率提升至 ≥95%

**驗收腳本**: `grep -r "TODO" apps/ratewise/src` (應無結果)

### M4: 架構演進（4週）📋 可選

- [ ] useCurrencyConverter 拆分
- [ ] 歷史匯率功能整合
- [ ] 趨勢圖表實作

**驗收腳本**: 測試覆蓋率保持 ≥89.8%

---

## 快速驗證腳本

### 一鍵品質檢查

```bash
#!/bin/bash
# scripts/verify-all.sh

echo "🚀 執行完整品質檢查"

# 1. Linting
pnpm lint || { echo "❌ Lint 失敗"; exit 1; }

# 2. Type checking
pnpm typecheck || { echo "❌ TypeCheck 失敗"; exit 1; }

# 3. 測試
pnpm test:coverage || { echo "❌ 測試失敗"; exit 1; }

# 4. 建置
pnpm build || { echo "❌ 建置失敗"; exit 1; }

# 5. E2E (可選)
# pnpm test:e2e || { echo "⚠️ E2E 失敗"; }

echo "✅ 所有檢查通過"
```

### 分數卡自動產生

```bash
#!/bin/bash
# scripts/generate-scorecard.sh

echo "📊 產生品質分數卡"

# 測試覆蓋率
COVERAGE=$(pnpm test:coverage --reporter=json | jq '.coverageMap.total.lines.pct')
echo "測試覆蓋率: $COVERAGE%"

# Lint 錯誤數
LINT_ERRORS=$(pnpm lint 2>&1 | grep -c "error")
echo "Lint 錯誤: $LINT_ERRORS"

# TODO 數量
TODO_COUNT=$(grep -r "TODO" apps/ratewise/src | wc -l)
echo "TODO 數量: $TODO_COUNT"

# 總評
if [ "$COVERAGE" -ge 80 ] && [ "$LINT_ERRORS" -eq 0 ] && [ "$TODO_COUNT" -le 5 ]; then
  echo "✅ 品質分數: 優秀"
else
  echo "⚠️ 品質分數: 需改善"
fi
```

---

_詳細說明參見 `TECH_DEBT_AUDIT.md` & `REFACTOR_PLAN.md`_

_本檢查清單依照 Linus Torvalds 實用主義原則產生，專注快速驗證與自動化。_
