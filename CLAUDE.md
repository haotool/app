# Claude Code 開發指南

> **適用對象**: 使用 Claude Code 開發本專案的所有開發者與 AI 助手

---

## 核心開發哲學

### Linus Torvalds 的原則

**"好品味" (Good Taste) - 第一準則**

消除特殊情況永遠優於增加條件判斷。好的程式碼應該讓問題的特殊情況消失，變成正常情況。

```typescript
// ❌ 糟糕：特殊情況處理
if (node === list.head) {
  list.head = node.next;
} else {
  let prev = list.head;
  while (prev.next !== node) prev = prev.next;
  prev.next = node.next;
}

// ✅ 好品味：消除特殊情況
*indirect = node.next;
```

**Linus 三問**（開始任何開發前必須問自己）：

1. **"這是個真問題還是臆想出來的？"** - 拒絕過度設計
2. **"有更簡單的方法嗎？"** - 永遠尋找最簡方案
3. **"會破壞什麼嗎？"** - 向後相容是鐵律

### 核心準則

1. **實用主義優先**: 解決實際問題，而非假想的威脅
2. **簡潔執念**: 超過 3 層縮排就是警訊，需要重構
3. **複雜性是萬惡之源**: 函數必須短小精悍，只做一件事

---

## 開發工作流程

### 1. 初始建置

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test --coverage
pnpm build
```

### 2. 品質檢查

```bash
pnpm lint
pnpm format
pnpm audit
```

### 3. 提交規範

**Commit Message 格式**（簡潔有力）:

```
type(scope): 簡短描述改了什麼（50字內）

- 修改點1：具體改動
- 修改點2：具體改動
- 修改點3：具體改動
```

**正確範例**:

```
fix(ui): 交換匯率顯示順序，主顯示目標貨幣匯率

- 調整匯率卡片：主要顯示 1 {toCurrency} = X {fromCurrency}
- 次要顯示：1 {fromCurrency} = X {toCurrency}
- 修正趨勢圖計算：fromRate/toRate 替代單一 rates[toCurrency]
- 修正 useEffect 依賴：[fromCurrency, toCurrency] 確保交換時更新
```

**錯誤範例** ❌:

```
fix(ui): 修正匯率顯示順序，符合用戶換匯心理預期

問題分析:
- 用戶要兌換美元時，關心的是「1 USD = 30.9 TWD」...
業界標準驗證:
✅ Wise.com: 主要顯示...
修正內容:
- 主要匯率(大、紫): 1 {toCurrency}...
範例場景:
...
測試:
✅ TypeScript 編譯通過...
```

（太冗長！commit 不是寫報告）

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**原子化提交原則**:

- 一個 commit 只解決一個問題
- 每個 commit 都是可編譯、可測試的完整狀態
- 每個 commit 都可以獨立回滾
- **簡潔有力**：只寫改了什麼，不寫為什麼（why 放在 PR/issue）

---

## MCP 工具使用

### Context7 MCP (官方文件檢索)

```bash
# 安裝
claude mcp add --transport http context7 https://mcp.context7.com/mcp

# 使用
resolve-library-id --libraryName "React"
get-library-docs --context7CompatibleLibraryID "/reactjs/react.dev" --topic "hooks"
```

### Spec-Workflow MCP (規格文件管理)

```bash
# 安裝
claude mcp add spec-workflow-mcp -s user -- npx -y spec-workflow-mcp@latest

# 使用
specs-workflow --action init --featureName "功能名稱" --introduction "簡介"
specs-workflow --action check
specs-workflow --action complete_task --taskNumber "1"
```

---

## 文檔維護規範

### 強制規則

任何影響以下文檔的變更，**必須同步更新對應文檔**。違反此規則的 PR 不得合併。

**文檔檢查清單**:

- 修改 CI/CD → 更新 `AGENTS.md`、`DEPLOYMENT.md`
- 新增 MCP 工具 → 更新 `AGENTS.md`
- 修改架構 → 更新 `ARCHITECTURE_BASELINE.md`
- 修改 Docker → 更新 `DEPLOYMENT.md`、`Dockerfile` 註解
- 升級 major 版本 → 更新 `DEPENDENCY_UPGRADE_PLAN.md`
- 修改安全標頭 → 更新 `SECURITY_BASELINE.md`、`nginx.conf`

### 文檔品質要求

所有文檔必須符合：

1. **時間戳記**: 建立與更新時間
2. **版本標記**: 重大變更需更新版本號
3. **狀態標記**: ✅ 已完成、🔄 進行中、📋 規劃中、❌ 已廢棄
4. **引用來源**: 技術決策需標註來源或引用
5. **範例程式碼**: 必須可執行或明確標註 `(未實作)` / `(範例)`
6. **向後相容**: 不得刪除仍在使用的指令或流程

### `docs/dev` 編號與獎懲流程

- 新增開發文檔時必須採用三位數遞增前綴（`001_*.md`、`002_*.md` ...），不得跳號或重複。
- `docs/dev/002_development_reward_penalty_log.md` 為強制維護檔案；每次開發遇到錯誤或完成修正後，須記錄事件、Context7 引用與分數變化。
- 若未更新獎懲記錄或引用來源，視同流程缺失，後續 PR 必須補齊。
- 建立新文檔時需同步填寫建立/更新時間、版本、狀態，以及引用來源。

### 文檔清理原則

- ❌ 禁止保留臨時報告（`*_REPORT.md`、`*_SUMMARY.md`）
- ❌ 禁止保留已完成的計畫文檔（`*_PLAN.md` 完成後應移除或歸檔）
- ✅ 保留操作指南、技術決策、最佳實踐
- ✅ 保留快速開始、故障排除、檢查清單

---

## localStorage 管理

### Key 分離策略

本專案使用以下 localStorage keys：

- `exchangeRates`: 匯率數據快取（5分鐘過期，可清除）
- `currencyConverterMode`: 用戶界面模式（用戶數據，不可清除）
- `favorites`: 用戶收藏的貨幣（用戶數據，不可清除）
- `fromCurrency`, `toCurrency`: 用戶選擇的貨幣（用戶數據，不可清除）

**重要**: `clearExchangeRateCache()` 只清除 `exchangeRates`，不影響用戶數據。

### 最佳實踐

```typescript
// ✅ 好的做法：使用工具函數
import { readJSON, writeJSON } from './storage';

const data = readJSON<MyType>('myKey', defaultValue);
writeJSON('myKey', data);

// ✅ SSR 安全檢查已內建
const isBrowser = typeof window !== 'undefined';

// ✅ 錯誤處理已內建
try {
  return JSON.parse(raw) as T;
} catch {
  return fallback;
}
```

---

## 安全守則

### 分層防禦原則

- **Cloudflare 層**: WAF, DDoS防護, Rate Limiting, 安全標頭
- **應用層**: Input validation, XSS 防護, Error Boundary

### 禁止事項

- ❌ 在應用程式內重複設定 Cloudflare 已處理的安全標頭
- ❌ 處理金流或密鑰（應由環境變數管理）
- ❌ 提交 `.env` 檔案到版本控制
- ❌ 暴露 debug 頁面到生產環境

---

## 品質門檻

每個 PR 必須通過：

- ✅ CI 全綠 (lint + typecheck + test + build)
- ✅ Test coverage ≥80%
- ✅ Build size <500KB
- ✅ Code review 通過

---

## 常用指令速查

### 開發

```bash
pnpm dev                    # 啟動開發伺服器
pnpm build                  # 生產建置
pnpm preview                # 預覽建置結果
```

### 品質

```bash
pnpm typecheck              # TypeScript 檢查
pnpm lint                   # ESLint 檢查
pnpm format                 # Prettier 格式化
pnpm test                   # 執行測試
pnpm test --coverage        # 測試覆蓋率報告
```

### Monorepo

```bash
pnpm -r build               # 建置所有 workspace
pnpm --filter @app/ratewise dev    # 執行特定 workspace
pnpm -w add -D <package>    # Root 安裝 dev dependency
```

---

## 故障排除

### 建置失敗

```bash
# 清除快取
pnpm store prune
rm -rf node_modules
pnpm install

# 檢查環境
node -v    # 應為 20+
pnpm -v    # 應為 9+

# 檢查類型錯誤
pnpm typecheck
```

### 測試失敗

```bash
# 更新測試快照
pnpm test -u

# 執行單一測試
pnpm test RateWise.test.tsx

# 檢查覆蓋率
pnpm test --coverage
```

---

## 文檔結構

### 核心指南（專案根目錄）

- `CLAUDE.md` (本文件) - Claude Code 開發指南
- `LINUS_GUIDE.md` - 完整開發哲學與程式碼品質準則
- `AGENTS.md` - Agent 操作守則與工具說明
- `README.md` - 專案說明與快速開始

### 部署與設定（docs/）

- `SETUP.md` - MVP 快速流程與環境設定
- `DEPLOYMENT.md` - Docker 部署指南
- `ZEABUR_DEPLOYMENT.md` - Zeabur 平台部署指南
- `SECURITY_BASELINE.md` - 安全基線與責任界面

### 功能文檔（docs/）

- `HISTORICAL_RATES_IMPLEMENTATION.md` - 歷史匯率功能實施指南
- `QUICK_START_HISTORICAL_RATES.md` - 歷史匯率快速開始
- `EXCHANGE_RATE_UPDATE_STRATEGIES.md` - 匯率更新策略比較

### 開發參考（docs/dev/）

- `CITATIONS.md` - 權威來源清單與技術引用
- `DEPENDENCY_UPGRADE_PLAN.md` - 依賴升級策略
- `ARCHITECTURE_BASELINE.md` - 架構藍圖與分層準則
- `CHECKLISTS.md` - 品質檢查清單

---

## 總結

Claude Code 的任務是：

1. **遵循 Linus 的哲學**: 簡單、實用、消除複雜性
2. **保持流程可靠**: 自動化、可重複、可驗證
3. **維護文檔品質**: 同步更新、清理過時、保持準確
4. **確保程式碼品質**: 測試、類型檢查、品質門檻

**不做超出授權範圍的操作，所有操作依照本文檔執行。**

---

**最後更新**: 2025-10-14
**版本**: v1.0
**維護者**: Claude Code
