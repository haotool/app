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

### 強制規範（2025-10-31 新增）

**這些規範是強制性的，違反將導致 PR 被拒絕**

#### 1. 開發文檔編號規則

所有開發相關文檔必須使用編號格式 `00X_主題名稱.md` 放在 `docs/dev/` 目錄：

- `001_exchange_rate_data_strategy.md` - 匯率數據策略
- `002_development_reward_penalty_log.md` - 開發獎懲記錄
- `003_ui_transparency_improvements.md` - UI 透明度改進
- 未來新增文檔依序遞增 `004_`, `005_` ...

**用途**: 維持文檔組織清晰，方便追蹤開發決策歷史

#### 2. 獎懲記錄強制流程

每次遇到錯誤或做出正確決策時，**必須**更新 `docs/dev/002_development_reward_penalty_log.md`：

**強制步驟**:

1. 遇到錯誤或不確定的決策時，**必須**先透過 Context7 查閱官方文件
2. 在 `002_development_reward_penalty_log.md` 中記錄：
   - 類型（✅ 成功 / ❌ 失敗 / ⚠️ 注意）
   - 摘要（簡短描述問題或成功點）
   - 採取行動（具體解決方案）
   - 依據（Context7 引用或權威來源）
   - 分數（+1 成功 / -1 失敗 / 0 注意）
3. 更新當前總分
4. 調整後續開發策略

**範例**:

```markdown
| 類型    | 摘要                       | 採取行動                   | 依據                          | 分數 |
| ------- | -------------------------- | -------------------------- | ----------------------------- | ---- |
| ✅ 成功 | 時間格式化重構（52行→5行） | 提取為獨立工具函數         | [Linus KISS principle]        | +1   |
| ❌ 失敗 | 版本號永遠停留在 1.0.0     | 改用 git describe 生成版本 | [context7:git/git:2025-10-31] | -1   |
```

**目的**: 建立學習循環，避免重複犯錯，提升開發品質

#### 3. Context7 優先原則

遇到錯誤、不確定的技術決策，或使用新工具/框架時，**必須**先查閱官方文件：

**強制查詢時機**:

- ❌ 出現 build/test/lint 錯誤
- ❓ 不確定最佳實踐或設計模式
- 🆕 使用新的 library、framework、工具
- 🔧 修改 CI/CD、部署配置
- 📦 升級 major 版本依賴

**正確流程**:

```bash
# 1. 使用 Context7 查詢官方文件
resolve-library-id --libraryName "React"
get-library-docs --context7CompatibleLibraryID "/reactjs/react.dev" --topic "hooks"

# 2. 根據官方建議實作

# 3. 在 002 獎懲記錄中引用 Context7 來源
```

**禁止行為**:

- ❌ 憑感覺或記憶實作（容易過時或錯誤）
- ❌ 跳過官方文件，直接試錯
- ❌ 使用未驗證的第三方教學

**目的**: 確保技術決策基於權威來源，減少試錯成本

#### 4. Linus 三問檢查點

每次開發前（無論大小變更），**必須**先問自己 Linus 三問：

**強制檢查點**:

**開發前**（設計階段）:

1. **"這是個真問題還是臆想出來的？"**
   - 有實際用戶需求或 bug report 嗎？
   - 還是過度設計或假想的威脅？
   - 範例：不要為「可能」需要而設計擴展性

2. **"有更簡單的方法嗎？"**
   - 是否有更直接的解決方案？
   - 能否用現有工具/函數達成？
   - 範例：52 行邏輯 → 5 行工具函數

3. **"會破壞什麼嗎？"**
   - 向後相容性如何？
   - 測試全過嗎？
   - 會影響現有功能嗎？

**開發後**（code review 階段）:

- 在 `docs/dev/00X_xxx.md` 中記錄 Linus 三問的驗證結果
- 範例：參考 `003_ui_transparency_improvements.md` 的 "Linus 三問驗證" 章節

**目的**: 培養工程品味，避免過度設計，確保程式碼簡潔實用

#### 5. BDD 開發流程（強制）

**所有功能新增、修改、刪除、重構必須遵循 BDD 三步驟**

**🔴 RED → 🟢 GREEN → 🔵 REFACTOR**

這是**強制性**的開發流程，違反將導致 PR 被拒絕。

**強制步驟**:

**Step 1: 🔴 RED（紅燈）- 先寫失敗測試**

```bash
# 1. 建立測試檔案 *.test.ts(x)
# 2. 描述預期行為（Given-When-Then）
# 3. 執行測試，確認失敗（紅燈）
pnpm test <test-file>  # 必須看到紅燈
```

**範例**:

```typescript
// prerender.test.ts
describe('🔴 RED: 靜態 HTML 檔案結構', () => {
  it('should generate dist/index.html for homepage', () => {
    const indexHtml = resolve(distPath, 'index.html');
    expect(existsSync(indexHtml)).toBe(true); // ❌ 紅燈（檔案不存在）
  });
});
```

**Step 2: 🟢 GREEN（綠燈）- 最小實作讓測試通過**

```bash
# 1. 實作最小可行代碼
# 2. 執行測試，確認通過（綠燈）
pnpm test <test-file>  # 必須看到綠燈
```

**範例**:

```typescript
// vite.config.ts - 添加 vite-react-ssg 配置
export default defineConfig({
  plugins: [
    react(),
    ViteReactSSG(), // 最小實作：啟用 SSG
  ],
});

// pnpm test prerender.test.ts
// ✅ 綠燈（dist/index.html 已生成）
```

**Step 3: 🔵 REFACTOR（重構）- 優化代碼品質**

```bash
# 1. 重構代碼（消除重複、改善可讀性）
# 2. 執行測試，確認仍然通過
# 3. 執行完整測試套件
pnpm test              # 所有測試必須通過
pnpm lint              # 無 lint 錯誤
pnpm typecheck         # 無 type 錯誤
```

**範例**:

```typescript
// 重構前：硬編碼路由
const routes = [
  { path: '/', element: <Home /> },
  { path: '/faq', element: <FAQ /> },
];

// 重構後：集中管理 + Layout 包裝
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout><Home /></Layout>,
    entry: 'src/features/ratewise/RateWise',
  },
  // ... 統一結構，易維護
];
```

**禁止行為**:

- ❌ 直接寫實作代碼，沒有測試
- ❌ 測試和實作同時完成（無法驗證 BDD 循環）
- ❌ 跳過紅燈階段（無法確認測試有效性）
- ❌ 綠燈後不重構（累積技術債）

**強制驗證清單**:

每次提交前必須確認：

- [ ] 紅燈截圖或日誌（證明測試失敗）
- [ ] 綠燈截圖或日誌（證明測試通過）
- [ ] 重構後測試仍通過
- [ ] `pnpm lint` 通過
- [ ] `pnpm typecheck` 通過
- [ ] `pnpm test` 全過（≥80% 覆蓋率）

**文檔清理規則**:

BDD 完成後，**禁止保留**以下臨時文檔：

- ❌ `*_REPORT.md`（測試報告）
- ❌ `*_SUMMARY.md`（總結報告）
- ❌ `*_PLAN.md`（已完成的計畫）
- ❌ 任何一次性分析或調查文檔

**只保留**:

- ✅ 長期有效的技術決策記錄（`docs/dev/00X_*.md`）
- ✅ 操作指南與故障排除
- ✅ 架構藍圖與最佳實踐

**CHANGELOG 更新規則**:

每次 BDD 完成後，**必須**更新 `CHANGELOG.md`：

```bash
# 自動生成變更日誌草稿
git log --oneline --since="1 day ago"

# 手動整理到 CHANGELOG.md
# 格式：## [版本] - YYYY-MM-DD
#       ### Added/Changed/Fixed/Removed
```

**目的**:

- 確保代碼有測試保護
- 建立快速反饋循環
- 持續保持 clean code
- 避免技術債累積
- 維護高品質文檔

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
