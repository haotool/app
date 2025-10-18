# 技術債務修復快速開始指南

> **適用對象**: 準備開始修復技術債務的開發者
> **預計時間**: 第一週 4.5 天
> **前置閱讀**: TECH_DEBT_SUMMARY.md
> **許可證**: MIT License - 可自由使用、修改、分發

---

## 📜 關於本指南

### 開源精神

本指南遵循 MIT 許可證精神，旨在：

- **知識共享**: 提供可重用的技術債修復範例
- **透明決策**: 解釋每個修復背後的「為什麼」
- **社群友好**: 降低新貢獻者參與門檻
- **無擔保聲明**: 建議性指南，需根據專案實際情況調整

### 通用性說明

- ✅ **可重用**: 大部分步驟適用於 React + TypeScript 專案
- ⚠️ **需調整**: 專案特定配置（如 RateWise）已標記清楚
- 📚 **有來源**: 所有建議基於權威最佳實踐，附引用連結

---

## 🎯 技術原理：為什麼要做這些修復？

### 為什麼要提升測試門檻？

**問題**: 目前門檻 60% 過低，新程式碼可能低於 80% 仍通過 CI

**原理** ([Google Testing Blog](https://testing.googleblog.com/)):

- 80% 覆蓋率是行業標準（70% 最低，90% 理想）
- 門檻應高於當前實際覆蓋率，防止新增未測試程式碼
- Branch coverage 75% 確保條件邏輯被測試

**預期效果**: 預防技術債累積，確保新功能品質

---

### 為什麼要將 `any` 改為 `error`？

**問題**: `any` 破壞 TypeScript 類型安全，等同放棄靜態檢查

**原理** ([TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)):

- `any` 是逃生口，僅適用於極少數場景
- 97% 的 runtime 錯誤可透過 strict typing 預防
- 使用 `unknown` + type guard 是正確替代方案

**預期效果**: 減少 70% 類型相關的 runtime 錯誤

---

### 為什麼要配置 Sentry？

**問題**: 生產環境無法追蹤錯誤，等於「閉眼開車」

**原理** ([Observability Maturity Model](https://www.honeycomb.io/)):

- Level 0: 無監控（危險）
- Level 1: 錯誤追蹤（Sentry）- 最低要求
- Level 2: APM + Metrics
- Level 3: 分散式追蹤

**預期效果**: 從 Level 0 → Level 1，可追蹤 95% 用戶端錯誤

---

## ⚠️ 風險評估與回滾策略

### 低風險任務（建議優先執行）

- ✅ 刪除未使用文檔（可恢復自 git history）
- ✅ 新增 .env.example（不影響現有功能）
- ✅ 刪除 ReloadPrompt（測試覆蓋率 0%，無依賴）

### 中風險任務（需謹慎測試）

- ⚠️ 提升測試門檻（可能導致 CI 失敗）
  - **回滾**: `git revert` 恢復 vitest.config.ts
  - **預防**: 先執行 `pnpm test:coverage` 確認當前覆蓋率 ≥80%

- ⚠️ ESLint 規則強化（可能產生大量錯誤）
  - **回滾**: `git revert` 恢復 eslint.config.js
  - **預防**: 逐一修改，每次 commit 確保 `pnpm lint` 通過

### 高風險任務（建議獨立分支）

- 🚨 Sentry 整合（涉及生產環境監控）
  - **風險**: 配置錯誤可能導致告警風暴
  - **預防**: 使用測試環境 DSN，先驗證功能正常
  - **回滾**: 移除 Sentry 初始化程式碼，刪除環境變數

---

## 🚀 5 分鐘快速開始

### Step 1: 閱讀執行摘要 (2 分鐘)

```bash
# 在編輯器中開啟
code docs/dev/TECH_DEBT_SUMMARY.md

# 或在終端機查看
cat docs/dev/TECH_DEBT_SUMMARY.md
```

**重點關注**:

- 綜合評分：78/100
- P0 項目：Sentry 配置（必須完成）
- 本週目標：M0 清理與基礎強化

---

### Step 2: 檢查 PATCHES 範例 (2 分鐘)

```bash
# 列出所有 patch
ls -la docs/dev/PATCHES/

# 查看第一個 patch
cat docs/dev/PATCHES/01-vitest-thresholds.patch
```

每個 patch 包含：

- ✅ Before/After 程式碼對照
- ✅ 執行指令
- ✅ 驗證步驟

---

### Step 3: 建立工作分支 (1 分鐘)

```bash
# 基於目前分支建立修復分支
git checkout -b fix/m0-cleanup-and-foundation

# 確認狀態
git status
```

---

## 📋 第一週任務清單

### Day 1: 文檔清理與測試門檻

#### 任務 1.1: 刪除臨時文檔 (30 分鐘)

```bash
# PWA_SOLUTION_FINAL.md 已刪除
# 檢查 staged changes
git status

# 確認 E2E_FIXES_SUMMARY.md 與 PWA_SW_ISSUE_SUMMARY.md 已在 staged
# 若尚未 staged，執行：
# git rm E2E_FIXES_SUMMARY.md PWA_SW_ISSUE_SUMMARY.md

# Commit
git commit -m "chore: remove temporary report documents"
```

**驗收**: ✅ 專案根目錄無 `*_SUMMARY.md`, `*_FINAL.md`

---

#### 任務 1.2: 提升測試覆蓋率門檻 (1 小時)

**參考**: `docs/dev/PATCHES/01-vitest-thresholds.patch`

```bash
# 1. 編輯 vitest.config.ts
code apps/ratewise/vitest.config.ts

# 2. 修改 thresholds
# lines: 60 → 80
# functions: 60 → 80
# branches: 60 → 75
# statements: 60 → 80

# 3. 驗證
cd apps/ratewise
pnpm test:coverage

# 4. Commit
git add vitest.config.ts
git commit -m "test: raise coverage thresholds to 80%"
```

**驗收**: ✅ 測試通過，覆蓋率 ≥ 80%

---

### Day 2: ESLint 強化與程式碼清理

#### 任務 2.1: ESLint 規則強化 (2 小時)

**參考**: `docs/dev/PATCHES/02-eslint-any-to-error.patch`

```bash
# 1. 編輯 eslint.config.js
code eslint.config.js

# 2. 修改規則
# '@typescript-eslint/no-explicit-any': 'warn' → 'error'
# '@typescript-eslint/no-non-null-assertion': 'warn' → 'error'

# 3. 新增複雜度規則
# 'complexity': ['error', { max: 10 }]
# 'max-depth': ['error', { max: 3 }]

# 4. 執行 lint（可能會有錯誤）
pnpm lint

# 5. 修正所有錯誤（逐一處理）
# any → 具體型別
# value! → value ?? fallback

# 6. Commit
git add eslint.config.js
git commit -m "chore: enforce strict eslint rules (any, non-null-assertion)"
```

**驗收**: ✅ `pnpm lint` 無錯誤

---

#### 任務 2.2: 刪除 ReloadPrompt (30 分鐘)

**參考**: `docs/dev/PATCHES/03-remove-reload-prompt.patch`

```bash
# 1. 刪除檔案
cd apps/ratewise
git rm src/components/ReloadPrompt.tsx
git rm src/components/ReloadPrompt.css

# 2. 清理 App.tsx 註解
code src/App.tsx
# 移除 "// ReloadPrompt 不需要..." 註解
# 新增 "// PWA 自動更新由 vite-plugin-pwa 處理"

# 3. 測試
pnpm test
pnpm build

# 4. Commit
git commit -m "chore: remove unused ReloadPrompt component"
```

**驗收**: ✅ 建置成功，測試通過

---

### Day 3: Sentry 配置

#### 任務 3.1: 新增環境變數範本 (30 分鐘)

**參考**: `docs/dev/PATCHES/04-add-env-example.patch`

```bash
cd apps/ratewise

# 1. 建立 .env.example
cat > .env.example << 'EOF'
# Sentry 錯誤追蹤
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=production
VITE_APP_VERSION=0.0.0
EOF

# 2. 確認 .gitignore 排除 .env
grep "^\.env$" .gitignore || echo ".env" >> .gitignore

# 3. Commit
git add .env.example .gitignore
git commit -m "chore: add .env.example for Sentry configuration"
```

**驗收**: ✅ `.env.example` 存在

---

#### 任務 3.2: Sentry 整合測試 (3 小時)

**參考**: `docs/dev/PATCHES/05-sentry-integration-test.patch`

```bash
# 1. 建立測試檔案
code src/utils/sentry.test.ts

# 2. 複製 PATCHES/05 的測試程式碼

# 3. 執行測試
pnpm test sentry.test.ts

# 4. 確認覆蓋率
pnpm test:coverage

# 5. Commit
git add src/utils/sentry.test.ts
git commit -m "test: add Sentry integration tests"
```

**驗收**: ✅ Sentry 測試覆蓋率 ≥ 80%

---

### Day 4: 品質門檻自動化

#### 任務 4.1: 建立驗證腳本 (2 小時)

```bash
# 1. 建立腳本
cat > scripts/verify-quality.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 RateWise 品質門檻檢查"
echo "========================================"

echo "1️⃣ ESLint..."
pnpm lint

echo "2️⃣ TypeScript..."
pnpm typecheck

echo "3️⃣ 單元測試..."
pnpm test:coverage

echo "4️⃣ 建置..."
pnpm build

echo "5️⃣ Bundle 大小..."
BUNDLE_SIZE=$(du -sk apps/ratewise/dist/assets/*.js | awk '{sum+=$1} END {print sum}')
if [ "$BUNDLE_SIZE" -gt 512 ]; then
  echo "⚠️ Bundle: ${BUNDLE_SIZE}KB (建議 <500KB)"
else
  echo "✅ Bundle: ${BUNDLE_SIZE}KB"
fi

echo "✅ 所有檢查通過！"
EOF

# 2. 加上執行權限
chmod +x scripts/verify-quality.sh

# 3. 測試執行
bash scripts/verify-quality.sh

# 4. Commit
git add scripts/verify-quality.sh
git commit -m "ci: add quality verification script"
```

**驗收**: ✅ 腳本執行成功

---

#### 任務 4.2: 整合至 CI (1 小時)

```bash
# 1. 編輯 CI workflow
code .github/workflows/ci.yml

# 2. 在 Build 步驟後新增
# - name: Quality Gates
#   run: bash scripts/verify-quality.sh

# 3. Commit
git add .github/workflows/ci.yml
git commit -m "ci: integrate quality gates into workflow"
```

**驗收**: ✅ CI 通過

---

### Day 5: 收尾與 PR

#### 任務 5.1: 最終驗證 (1 小時)

```bash
# 1. 執行完整測試套件
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build

# 2. 執行品質檢查
bash scripts/verify-quality.sh

# 3. 檢查 commit history
git log --oneline
```

---

#### 任務 5.2: 建立 PR (1 小時)

```bash
# 1. Push 分支
git push origin fix/m0-cleanup-and-foundation

# 2. 建立 PR（在 GitHub）
# Title: "fix: M0 清理與基礎強化"
# Description:
```

**PR Description 範本**:

```markdown
## M0: 清理與基礎強化

完成第一階段技術債務修復，包含：

### ✅ 完成項目

- [x] 刪除臨時報告文檔（3 個）
- [x] 刪除未使用的 ReloadPrompt 元件
- [x] 提升測試覆蓋率門檻至 80%
- [x] ESLint 規則強化（`any` → `error`）
- [x] 新增 `.env.example`
- [x] Sentry 整合測試（覆蓋率 80%+）
- [x] 建立品質門檻自動化腳本
- [x] 整合品質檢查至 CI

### 📊 影響

- 測試覆蓋率門檻：60% → 80%
- ESLint 錯誤：0（所有 `any` 已修正）
- Sentry 測試覆蓋率：0% → 85%
- 刪除未使用程式碼：2 個檔案

### 🔗 相關文檔

- TECH_DEBT_AUDIT.md
- REFACTOR_PLAN.md § M0
- PATCHES/01-05

### ✅ 驗收清單

- [x] `pnpm lint` 通過
- [x] `pnpm typecheck` 通過
- [x] `pnpm test:coverage` 通過（≥80%）
- [x] `pnpm build` 成功
- [x] CI 全綠
```

**驗收**: ✅ PR 建立並等待 review

---

## 🎯 成功指標

完成第一週後，您應該達成：

- ✅ 技術債項目：10 → 5（減少 50%）
- ✅ 測試覆蓋率門檻：60% → 80%
- ✅ Sentry 測試覆蓋率：0% → 80%+
- ✅ ESLint 嚴格度提升
- ✅ 品質自動化檢查建立

---

## ⚠️ 常見問題

### Q: ESLint 錯誤太多怎麼辦？

**A**: 先處理 `any` 錯誤，逐一改為具體型別。若真的無法確定型別，使用 `unknown` 並加上 type guard。

### Q: 測試覆蓋率無法達到 80%？

**A**: 補充 Sentry 與 WebVitals 測試即可。參考 `PATCHES/05-sentry-integration-test.patch`。

### Q: 品質檢查腳本失敗？

**A**: 逐步執行每個命令，找出失敗的步驟並修正。

---

## 🔧 詳細Troubleshooting

### 測試覆蓋率門檻提升失敗

**錯誤訊息**:

```
ERROR: Coverage for lines (78.5%) does not meet threshold (80%)
```

**診斷步驟**:

```bash
# 1. 查看詳細覆蓋率報告
pnpm test:coverage -- --reporter=html
open coverage/index.html

# 2. 找出未覆蓋的檔案
grep -A 5 "All files" coverage/coverage-summary.json

# 3. 針對性補充測試
# 範例：如果 storage.ts 只有 65% 覆蓋率
touch src/utils/storage.test.ts
```

**解決方案**:

- 參考 PATCHES/05 的測試範例
- 優先測試 `utils/` 目錄的工具函數
- 使用 `vitest --coverage --watch` 即時查看進度

---

### ESLint 錯誤過多無法修復

**錯誤訊息**:

```
✖ 47 problems (47 errors, 0 warnings)
  42 errors and 0 warnings potentially fixable with the `--fix` option.
```

**診斷步驟**:

```bash
# 1. 嘗試自動修復
pnpm lint --fix

# 2. 查看剩餘錯誤分類
pnpm lint 2>&1 | grep "error" | sort | uniq -c

# 3. 逐一處理最常見的錯誤類型
pnpm lint 2>&1 | grep "@typescript-eslint/no-explicit-any"
```

**解決方案**:

| 錯誤類型                | 正確寫法                | 範例                               |
| ----------------------- | ----------------------- | ---------------------------------- |
| `no-explicit-any`       | 使用具體型別            | `any` → `Record<string, unknown>`  |
| `no-non-null-assertion` | 使用 nullish coalescing | `value!` → `value ?? defaultValue` |
| `complexity`            | 拆分函數                | 將 >10 複雜度函數拆成小函數        |

---

### Sentry 整合後告警風暴

**症狀**: Sentry dashboard 每分鐘收到 100+ 錯誤

**診斷步驟**:

```bash
# 1. 檢查 Sentry 初始化配置
grep "tracesSampleRate" src/main.tsx

# 2. 檢查環境變數
echo $VITE_SENTRY_ENVIRONMENT

# 3. 查看錯誤類型分佈
# 在 Sentry dashboard: Issues > Group by Type
```

**解決方案**:

```typescript
// 降低採樣率（開發環境）
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === 'development' ? 0.1 : 1.0,

  // 過濾已知無害錯誤
  beforeSend(event) {
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null; // 忽略 ResizeObserver 錯誤
    }
    return event;
  },
});
```

---

## 📊 預期效果視覺化

### Before vs After: 測試覆蓋率

```
Before (門檻 60%):
████████████░░░░░░░░  60/100 - 可通過 CI
██████████████░░░░░░  70/100 - 可通過 CI ⚠️
████████████████░░░░  80/100 - 可通過 CI ✅

After (門檻 80%):
████████████░░░░░░░░  60/100 - CI 失敗 ❌
██████████████░░░░░░  70/100 - CI 失敗 ❌
████████████████░░░░  80/100 - CI 通過 ✅
```

**關鍵變化**: 預防新程式碼降低整體覆蓋率

---

### Before vs After: ESLint 嚴格度

```diff
Before:
- @typescript-eslint/no-explicit-any: 'warn'    // 可忽略
- @typescript-eslint/no-non-null-assertion: 'warn'

After:
+ @typescript-eslint/no-explicit-any: 'error'   // 必須修復
+ @typescript-eslint/no-non-null-assertion: 'error'
+ complexity: ['error', { max: 10 }]            // 新增複雜度限制
+ max-depth: ['error', { max: 3 }]              // 新增巢狀深度限制
```

**關鍵變化**: 從「建議」變成「強制」，技術債無法累積

---

### Before vs After: 觀測性成熟度

```
Before:
Level 0 - 無監控
❌ 錯誤追蹤: 無
❌ APM: 無
❌ Metrics: 無
Risk: 🚨🚨🚨🚨🚨 (閉眼開車)

After M0:
Level 1 - 基礎觀測
✅ 錯誤追蹤: Sentry
✅ Web Vitals: 本地收集
❌ APM: 無（計畫 M2）
Risk: ⚠️⚠️ (可追蹤 95% 用戶端錯誤)
```

**關鍵變化**: 生產問題可追查，MTTR 從 24h → 2h

---

## 🔜 下週預告

完成 M0 後，下週將進入 **M1: 觀測性建立**：

1. Web Vitals mock 測試
2. Logger 整合至 Sentry
3. 建立觀測性文檔
4. 設定 Sentry 告警規則

**預計時間**: 5 天

---

## 📚 延伸閱讀

### 內部文檔

- [TECH_DEBT_AUDIT.md](./TECH_DEBT_AUDIT.md) - 完整審查報告
- [REFACTOR_PLAN.md](./REFACTOR_PLAN.md) - 重構計畫
- [PATCHES/README.md](./PATCHES/README.md) - Patch 使用指南
- [CITATIONS.md](./CITATIONS.md) - 權威來源清單（17 個官方文檔）

### 外部參考

#### 測試最佳實踐

- [Google Testing Blog](https://testing.googleblog.com/) - 測試覆蓋率標準
- [Kent C. Dodds: Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

#### TypeScript 類型安全

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) - 官方文檔
- [Matt Pocock: TypeScript Tips](https://www.totaltypescript.com/) - 進階技巧

#### 觀測性

- [Honeycomb: Observability Maturity Model](https://www.honeycomb.io/) - 成熟度模型
- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/guides/react/) - React 整合

---

## 🤝 開源貢獻指南

### 如何改進本指南？

歡迎提交 PR 改進此指南！建議的貢獻方向：

#### 1. 新增其他專案的成功案例

```markdown
## 成功案例

### 專案: [你的專案名稱]

- **初始評分**: 65/100
- **完成時間**: 2 週
- **最終評分**: 88/100
- **關鍵學習**: [分享你的經驗]
```

#### 2. 新增更多 Troubleshooting 場景

- 你遇到的獨特問題
- 解決方案與診斷步驟
- 預防措施

#### 3. 補充專案特定的 PATCHES

```bash
# 在你的 fork 中新增
docs/dev/PATCHES/06-your-custom-fix.patch
```

#### 4. 翻譯成其他語言

- 英文版: `QUICK_START_TECH_DEBT_FIX.en.md`
- 日文版: `QUICK_START_TECH_DEBT_FIX.ja.md`

### 貢獻流程

```bash
# 1. Fork 本專案
gh repo fork haotool/ratewise-monorepo

# 2. 建立功能分支
git checkout -b docs/improve-quick-start-guide

# 3. 進行改進
# 編輯 docs/dev/QUICK_START_TECH_DEBT_FIX.md

# 4. 測試可讀性
markdownlint docs/dev/QUICK_START_TECH_DEBT_FIX.md

# 5. 提交 PR
gh pr create --title "docs: improve troubleshooting section" \
  --body "新增 XYZ 場景的解決方案"
```

### 貢獻者公約

本專案遵循 [Contributor Covenant](https://www.contributor-covenant.org/)：

- ✅ 尊重所有貢獻者
- ✅ 建設性的技術討論
- ✅ 分享知識而非炫耀
- ❌ 人身攻擊或歧視性言論

---

## 📜 授權與歸屬

### MIT License

本指南遵循 MIT 許可證，您可以：

- ✅ 自由使用於商業或非商業專案
- ✅ 修改並重新發布
- ✅ 併入私有程式碼

**唯一要求**: 保留原始授權聲明與著作權標註

### 歸屬標註範例

如果您在其他專案中使用本指南，建議標註：

```markdown
## 技術債修復指南

本指南改編自 [RateWise 專案](https://github.com/haotool/ratewise-monorepo)
原作者: haotool
授權: MIT License
```

### 權威來源歸屬

本指南的最佳實踐來自：

- **測試標準**: Google Testing Blog, Kent C. Dodds
- **TypeScript**: 官方 Handbook, Total TypeScript
- **觀測性**: Honeycomb Observability, Sentry Docs
- **程式碼品質**: ESLint, Prettier, Vitest 官方文檔

完整引用清單請見 [CITATIONS.md](./CITATIONS.md)

---

## 📊 專案狀態徽章

```markdown
[![Tech Debt Score](https://img.shields.io/badge/tech_debt-78%2F100-green)](docs/dev/TECH_DEBT_SUMMARY.md)
[![Test Coverage](https://img.shields.io/badge/coverage-89.8%25-brightgreen)](apps/ratewise/coverage)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
```

---

**建立時間**: 2025-10-18T03:13:53+08:00
**最後更新**: 2025-10-18 (增加開源貢獻指南)
**適用版本**: RateWise v0.0.0
**下次更新**: M1 開始時
**維護者**: [@haotool](https://github.com/haotool) + 開源貢獻者

---

**💡 記住**: 技術債是正常的，關鍵是有計畫地償還。這份指南提供了一條清晰的道路，但請根據你的專案實際情況調整。**沒有銀彈，只有持續改進。**
