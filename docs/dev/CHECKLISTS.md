# 品質檢查清單

> **最後更新**: 2026-02-11T00:00:00+08:00
> **版本**: v3.0 (全面更新：反映當前實際狀態)
> **狀態**: ✅ 大部分目標已達成
> **參考**: ARCHITECTURE_BASELINE.md, 037_state_machine_flows.md

---

## Linus 品質哲學

> "If you think your code is too complex, you're probably right. Simplify."
> — Linus Torvalds

**品質檢查三原則**：

1. **快速驗證**：能在 30 秒內執行的檢查，才是好檢查
2. **自動化優先**：人工檢查容易出錯，交給 CI
3. **實用主義**：100% 覆蓋率不重要，測試關鍵路徑才重要

---

## 品質門檻（2026-02-11 現況）

| 項目                 | 目標     | 現況             | 狀態      |
| -------------------- | -------- | ---------------- | --------- |
| 測試覆蓋率（lines）  | ≥80%     | ≥80% ✓           | ✅ 達標   |
| TypeScript Strict    | 啟用     | 啟用             | ✅        |
| ESLint 9             | 0 errors | 通過 CI          | ✅        |
| SSG 預渲染頁面       | 20 頁    | 20 頁            | ✅        |
| CI 通過率            | ≥95%     | ≥95%             | ✅        |
| PWA 離線功能         | 啟用     | localStorage+IDB | ✅        |
| Build Size           | <500KB   | 已壓縮           | ✅        |
| 多語言 (i18n)        | zh/en/ja | zh-TW / en / ja  | ✅        |
| 設計系統 Token SSOT  | 啟用     | design-tokens.ts | ✅        |
| Lighthouse 效能分數  | ≥90      | 需定期檢查       | ⚠️ 監控中 |
| Logger 遠端整合      | Sentry   | 僅 console       | 📋 規劃中 |
| useCurrencyConverter | 拆分     | 仍為 ~400 行     | 📋 可選   |

---

## 提交前強制檢查清單（每次 commit 必須通過）

### 代碼品質

- [ ] `pnpm lint` 無錯誤
- [ ] `pnpm typecheck` 無錯誤
- [ ] `pnpm test` 全部通過，覆蓋率 ≥80%
- [ ] `pnpm build` 建置成功

### 安全

- [ ] 無硬編碼 API keys / tokens / secrets
- [ ] 用戶輸入已驗證
- [ ] 無 console.log 殘留（Husky hook 自動檢查）

### BDD 流程

- [ ] 紅燈確認（測試先失敗）
- [ ] 綠燈確認（測試通過）
- [ ] 重構後測試仍通過

### 文檔

- [ ] `002_development_reward_penalty_log.md` 已更新
- [ ] Linus 三問已驗證
- [ ] CHANGELOG.md 已更新（如有用戶可見變更）

---

## 功能開發清單（BDD 強制流程）

### Step 1: 🔴 RED - 先寫失敗測試

```bash
# 建立測試文件
touch apps/ratewise/src/features/ratewise/__tests__/NewFeature.test.tsx

# 執行確認紅燈
pnpm --filter @app/ratewise test NewFeature
# 期望: FAIL (紅燈)
```

### Step 2: 🟢 GREEN - 最小實作

```bash
# 實作最小可行代碼

# 執行確認綠燈
pnpm --filter @app/ratewise test NewFeature
# 期望: PASS (綠燈)
```

### Step 3: 🔵 REFACTOR - 優化

```bash
# 重構後完整驗證
pnpm --filter @app/ratewise test          # 全部通過
pnpm lint                                  # 無錯誤
pnpm typecheck                             # 無錯誤
pnpm build                                 # 建置成功
pnpm --filter @app/ratewise test:coverage  # ≥80%
```

---

## 完整里程碑狀態（更新版）

### M0: 清理與基礎強化 ✅ 完成

- [x] README.md 完整
- [x] .editorconfig 設定
- [x] PostCSS → ESM
- [x] Error Boundary
- [x] .env.example
- [x] robots.txt, sitemap.xml
- [x] 刪除臨時報告文檔
- [x] 測試覆蓋率門檻 ≥80%
- [x] ESLint 嚴格規則

### M1: 觀測性建立 ✅ 完成（部分）

- [x] Logger (utils/logger.ts) 結構化日誌
- [x] Request ID 追蹤 (utils/requestId.ts)
- [x] Error Boundary 完整實作
- [x] Core Web Vitals 上報 (reportWebVitals.ts)
- [x] INP 預算追蹤 (interactionBudget.ts)
- [ ] Sentry 遠端整合（規劃中）
- [ ] Logger 遠端 sink（規劃中）

### M2: 依賴升級 ✅ 完成

- [x] Vite 8.0.10 (升級自 6.x)
- [x] Vitest 4.1.5 (升級自 3.x)
- [x] React 19.2.3 (升級自 18.x)
- [x] TypeScript 5.6.2
- [x] Node.js 24+ 支援

### M3: 測試強化 ✅ 完成

- [x] 覆蓋率 ≥80%
- [x] BDD 開發流程建立
- [x] E2E 測試 (Playwright 1.57)
- [x] SEO 自動化測試 (prerender.test.ts)

### M4: SSG 架構 ✅ 完成

- [x] 20 頁靜態預渲染
- [x] 13 個幣別落地頁
- [x] JSON-LD 結構化資料
- [x] sitemap.xml 自動生成
- [x] llms.txt (AI 搜尋優化)

### M5: PWA 離線優化 ✅ 完成

- [x] Service Worker (Workbox injectManifest)
- [x] IndexedDB 雙重儲存
- [x] FALLBACK_RATES 備援
- [x] OfflineIndicator 元件
- [x] 版本更新提示 (UpdatePrompt)
- [x] 拉動刷新 (usePullToRefresh)
- [x] Safari PWA 相容性

### M6: 計算機功能 ✅ 完成

- [x] Apple 風格計算機 UI
- [x] 鍵盤快捷鍵支援
- [x] 觸覺反饋 (HapticFeedback)
- [x] 計算機與匯率同步 (useCalculatorSync)
- [x] 聖誕彩蛋功能

### M7: 歷史匯率 ✅ 完成

- [x] exchangeRateHistoryService
- [x] useHistoricalRates hook
- [x] 趨勢圖 (TrendChart)
- [x] 歷史匯率圖表 (HistoricalRateChart)
- [x] 每日自動更新 CI workflow

### M8: 多語言 (i18n) ✅ 完成

- [x] zh-TW 繁體中文（主要）
- [x] en 英文
- [x] ja 日文
- [x] 語言自動偵測（navigator.language）
- [x] localStorage 語言偏好持久化

### M9: 設計系統 ✅ 完成

- [x] design-tokens.ts SSOT
- [x] 語義化色彩 token
- [x] 間距/字型/斷點 token
- [x] 計算機按鍵三色系
- [x] December 主題（聖誕節）

### Next: 可選優化 📋 規劃中

- [ ] useCurrencyConverter 拆分（~400 行 → 多個小 hook）
- [ ] Sentry 遠端錯誤追蹤
- [ ] Logger 遠端 sink 整合
- [ ] Tailwind 4 升級評估

---

## 命令快查

### 日常開發

```bash
# 啟動開發伺服器
pnpm dev

# 建置生產版本（含 SSG 預渲染）
pnpm build

# 預覽建置結果（測試 PWA/Service Worker）
pnpm preview
```

### 品質檢查

```bash
# 類型檢查
pnpm typecheck

# Lint 檢查
pnpm lint

# 格式化
pnpm format

# 執行所有測試
pnpm test

# 測試覆蓋率報告
pnpm test --coverage

# E2E 測試
pnpm --filter @app/ratewise test:e2e
```

### Monorepo 操作

```bash
# 建置所有應用
pnpm -r build

# 只建置 ratewise
pnpm --filter @app/ratewise build

# Root 安裝 dev dependency
pnpm -w add -D <package>
```

### SEO 驗證

```bash
# 驗證 ratewise SEO
node scripts/verify-production-seo.mjs ratewise

# 批次驗證所有 apps
node scripts/verify-all-apps.mjs

# SEO 健康檢查
pnpm seo:health-check
```

### 版本管理

```bash
# 建立 changeset
pnpm changeset

# 生成版本與 CHANGELOG
pnpm changeset:version

# 發佈（建立 git tag）
pnpm changeset:publish
```

---

## 快速驗證腳本（一鍵品質檢查）

```bash
#!/bin/bash
# 完整品質驗證（建議在 PR 前執行）

set -e

echo "▶ Lint..."
pnpm lint

echo "▶ TypeCheck..."
pnpm typecheck

echo "▶ Test + Coverage..."
pnpm test --coverage

echo "▶ Build..."
pnpm build

echo "▶ SEO Verify..."
node scripts/verify-production-seo.mjs ratewise

echo "✅ 全部通過"
```

---

## 狀態機相關文檔

完整狀態機規格請見：

- [037_state_machine_flows.md](./037_state_machine_flows.md) - 所有狀態機與流程圖
- [ARCHITECTURE_BASELINE.md](./ARCHITECTURE_BASELINE.md) - 分層架構與組件關係

---

_本檢查清單依照 Linus Torvalds 實用主義原則維護，專注快速驗證與自動化。_
_最後更新：2026-02-11_
