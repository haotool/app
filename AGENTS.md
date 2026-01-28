# AGENT 操作守則與工具說明

> **最後更新**: 2025-10-30T23:53:24+08:00  
> **執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)  
> **版本**: v2.1 (繁體中文溝通規範更新)  
> **角色**: 自動化代理 (Agents) 負責重複性檢查、端到端驗證與部署流程觸發。本文檔說明所有可用工具與工作流程。

---

## 語言政策（溝通規範）

- 與最終使用者互動時，Agent 必須全程使用繁體中文回應，包含狀態更新、錯誤訊息與補充說明。

---

## Linus 三問（開始任何操作前）

1. **"這是個真問題還是臆想出來的？"** - 拒絕過度設計
2. **"有更簡單的方法嗎？"** - 永遠尋找最簡方案
3. **"會破壞什麼嗎？"** - 向後相容是鐵律

---

## 強制規範（2025-10-31 新增）

**所有 Agent 必須遵守這些規範，違反將導致 PR 被拒絕**

### 1. 開發文檔編號規則

所有開發相關文檔必須使用編號格式 `00X_主題名稱.md` 放在 `docs/dev/` 目錄：

- `001_exchange_rate_data_strategy.md` - 匯率數據策略
- `002_development_reward_penalty_log.md` - 開發獎懲記錄
- `003_ui_transparency_improvements.md` - UI 透明度改進
- 未來新增文檔依序遞增 `004_`, `005_` ...

**Agent 責任**:

- 建立新開發文檔時，必須檢查現有最大編號並遞增
- 使用 `ls docs/dev/ | grep -E '^[0-9]{3}_'` 確認現有編號

### 2. 獎懲記錄強制流程

**每個 Agent 在 `git commit` 前，必須更新 `docs/dev/002_development_reward_penalty_log.md`**

**強制步驟**:

1. 遇到錯誤或不確定的決策時，先透過 Context7 查閱官方文件
2. 在 `002_development_reward_penalty_log.md` 中新增條目：
   ```markdown
   | 類型    | 摘要           | 採取行動     | 依據              | 分數 |
   | ------- | -------------- | ------------ | ----------------- | ---- |
   | ✅ 成功 | 簡短描述成功點 | 具體解決方案 | [context7:source] | +1   |
   ```
3. 更新「當前總分」
4. 若總分為負，必須在待追蹤事項中說明改進計畫

**Agent 責任**:

- 每次準備提交前，自動檢查是否已更新 002 記錄
- 引用 Context7 來源時，使用完整格式 `[context7:org/repo:timestamp]`

### 3. Context7 優先原則

**Agent 遇到以下情況，必須先查閱 Context7 官方文件**:

**強制查詢時機**:

- ❌ Build/test/lint 錯誤
- ❓ 不確定最佳實踐或設計模式
- 🆕 使用新的 library、framework、工具
- 🔧 修改 CI/CD、部署配置
- 📦 升級 major 版本依賴

**Agent 操作流程**:

```bash
# 1. 自動觸發 Context7 查詢
resolve-library-id --libraryName "目標套件"

# 2. 獲取相關文件
get-library-docs --context7CompatibleLibraryID "/org/repo" --topic "相關主題"

# 3. 根據官方建議實作

# 4. 在 002 記錄中引用來源
```

**禁止行為**:

- ❌ Agent 不得憑記憶或假設實作
- ❌ 不得跳過官方文件，直接試錯
- ❌ 不得使用未經驗證的第三方教學

**目的**: 確保 Agent 所有決策基於權威來源，減少人工介入

### 4. Linus 三問檢查點

**每個 Agent 在執行任何操作前，必須先執行 Linus 三問檢查**

**Agent 自我檢查流程**:

**操作前（Planning Phase）**:

1. **"這是個真問題還是臆想出來的？"**
   - 檢查是否有明確的 issue、bug report、或用戶需求
   - 若無，拒絕執行並向用戶確認

2. **"有更簡單的方法嗎？"**
   - 搜尋現有工具函數是否可復用
   - 評估是否有 library 內建解決方案
   - 若有更簡方案，自動採用並記錄於 002

3. **"會破壞什麼嗎？"**
   - 自動執行 `pnpm typecheck` 與 `pnpm test`
   - 檢查是否影響現有 API 或功能
   - 若有風險，先警告用戶並等待確認

**操作後（Validation Phase）**:

- Agent 必須在操作日誌中記錄三問的驗證結果
- 若建立開發文檔，必須包含 "Linus 三問驗證" 章節

**目的**: 培養 Agent 工程品味，避免過度設計，確保程式碼簡潔實用

---

## 1. 可用 MCP 工具

### Context7 MCP (官方文件檢索)

```bash
# 安裝
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

**用途**:

- 檢索 React, Vite, TypeScript 等官方文件
- 獲取最新 API 範例與最佳實踐

**工作流**:

```bash
# 1. 解析 library ID
resolve-library-id --libraryName "React"

# 2. 取得文件
get-library-docs --context7CompatibleLibraryID "/reactjs/react.dev" --topic "hooks"
```

---

### Grep MCP (GitHub 程式碼搜尋)

```bash
# 安裝
claude mcp add --transport http grep https://mcp.grep.app
```

**用途**:

- 搜尋真實專案程式碼範例
- 研究特定模式在產業的實作

---

### Spec-Workflow MCP (規格文件管理)

```bash
# 安裝
claude mcp add spec-workflow-mcp -s user -- npx -y spec-workflow-mcp@latest
```

**用途**:

- 維護 `docs/specs/*` 需求與設計文件
- 追蹤功能實作進度

**工作流**:

```bash
specs-workflow --action init --featureName "匯率API整合" --introduction "整合即時匯率API"
specs-workflow --action check  # 檢查當前狀態
specs-workflow --action complete_task --taskNumber "1"  # 完成任務
```

---

### Puppeteer MCP (瀏覽器自動化)

**用途**:

- E2E 測試自動化
- UI 截圖與視覺回歸測試
- 效能指標收集

**典型流程**:

```typescript
// 1. 啟動瀏覽器
browser_navigate --url "http://localhost:4173"

// 2. 截圖
browser_take_screenshot --filename "homepage.png"

// 3. 互動測試
browser_click --element "單幣別" --ref "[data-testid='single-mode']"

// 4. 驗證
browser_snapshot  // 取得 DOM 結構驗證
```

---

### Renovate Bot (依賴自動化更新)

**配置檔案**: `/renovate.json`

**用途**:

- 自動背景更新依賴（patch/minor 無破壞性變更）
- Grouping 策略減少 PR 數量
- 通過 CI 後自動合併

**核心策略** (2025-12-26 優化):

```json
{
  "packageRules": [
    {
      "description": "📦 Patch - 自動合併（排除 0.x）",
      "matchUpdateTypes": ["patch"],
      "matchCurrentVersion": "!/^0/",
      "groupName": "patch dependencies",
      "automerge": true,
      "platformAutomerge": true
    },
    {
      "description": "🔄 Minor - 自動合併（排除 0.x）",
      "matchUpdateTypes": ["minor"],
      "matchCurrentVersion": "!/^0/",
      "groupName": "minor dependencies",
      "automerge": true,
      "platformAutomerge": true
    },
    {
      "description": "⚠️ Major - 需要手動審查",
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["major-update", "needs-review"]
    }
  ],
  "prConcurrentLimit": 10,
  "schedule": ["before 3am on Monday"]
}
```

**執行時間**:

- **Renovate**: 每週一 01:00-03:00 (主要)
- **Dependabot**: 每週日 02:00 (備援)

**自動合併條件**:

1. ✅ 所有 CI 檢查通過（核心 CI：lint/typecheck/test/build；SEO workflows 如觸發）
2. ✅ 版本非 0.x (避免不穩定版本)
3. ✅ 類型為 patch/minor (Major 需手動審查)
4. ✅ 穩定期 ≥3 天 (避免剛發布的版本)

**手動操作**:

```bash
# 檢視 Renovate Dashboard
gh pr list --label dependencies

# 手動觸發 Renovate (需 renovate/github-action)
gh workflow run renovate.yml

# 關閉 Renovate PR
gh pr close <pr-number> --comment "延後處理"
```

**最佳實踐** (來自 Context7 + WebSearch 2025):

- ✅ Grouping 減少 PR 噪音（patch→1 PR, minor→1 PR）
- ✅ platformAutomerge 使用 GitHub 原生合併
- ✅ 排除 0.x 版本（避免破壞性變更）
- ✅ 穩定期 3 天（等待社群驗證）
- ✅ 保留 Dependabot 作為備援

**與 Dependabot 比較**:

| 功能      | Renovate    | Dependabot    |
| --------- | ----------- | ------------- |
| Grouping  | ✅ 強大     | ⚠️ 有限       |
| Automerge | ✅ 彈性配置 | ❌ 需 Actions |
| 排程      | ✅ 精確     | ⚠️ 粗略       |
| Monorepo  | ✅ 優秀     | ⚠️ 普通       |

---

## 2. 工作流程

### 初始建置流程

```bash
# 1. 同步需求
# 以 docs/SETUP.md 與 docs/dev/*.md 為準

# 2. 安裝依賴
pnpm install --frozen-lockfile

# 3. 類型檢查
pnpm typecheck

# 4. 測試
pnpm test --coverage

# 5. 建置
pnpm build

# 6. E2E 測試 (Puppeteer)
pnpm preview  # 啟動 preview server
# 使用 Puppeteer MCP 執行測試
```

### 品質檢查流程

```bash
# 1. Pre-commit hooks
pre-commit run --all-files

# 2. Lint
pnpm lint

# 3. Format check
pnpm format

# 4. 安全掃描
pnpm audit
```

### Docker 建置流程

```bash
# 1. 建置映像
docker build -t ratewise:latest .

# 2. 執行容器
docker run -p 8080:80 ratewise:latest

# 3. 健康檢查 (使用 Puppeteer MCP)
browser_navigate --url "http://localhost:8080"
browser_take_screenshot --filename "docker-health-check.png"
```

---

## 3. 開發哲學與設計原則

### KISS 原則 - Keep It Simple, Stupid

遵循 Linus Torvalds 的核心哲學，確保程式碼簡潔且易於維護：

**核心準則**：

1. **"好品味" (Good Taste)**
   - 消除特殊情況永遠優於增加條件判斷
   - 重新設計資料結構以移除 if/else 分支
   - 10 行帶判斷的程式碼 → 4 行無條件分支

2. **實用主義優先**
   - 解決實際問題，而非假想的威脅
   - 拒絕過度工程化與"理論完美"的方案
   - 程式碼為現實服務，不是為論文服務

3. **簡潔執念**
   - 函數必須短小精悍，只做一件事
   - 超過 3 層縮排就是警訊，需要重構
   - 複雜性是萬惡之源

**Linus 三問**（開始任何開發前）：

```text
1. "這是個真問題還是臆想出來的？" - 拒絕過度設計
2. "有更簡單的方法嗎？" - 永遠尋找最簡方案
3. "會破壞什麼嗎？" - 向後相容是鐵律
```

**實踐範例**：

```typescript
// ❌ 糟糕：特殊情況處理
function deleteNode(list, node) {
  if (node === list.head) {
    list.head = node.next;
  } else {
    let prev = list.head;
    while (prev.next !== node) {
      prev = prev.next;
    }
    prev.next = node.next;
  }
}

// ✅ 好品味：消除特殊情況
function deleteNode(indirect, node) {
  *indirect = node.next;
}
```

### 最小可行方案 (MVP First)

- ✅ 先實作核心功能，驗證可行性
- ✅ 避免提前優化與複雜架構
- ✅ 確保每個 commit 都是可編譯、可測試的完整狀態
- ❌ 禁止在 MVP 階段引入微服務、複雜設計模式

---

## 4. 提交規範

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types**:

- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文件變更
- `style`: 格式調整 (不影響程式碼)
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建置工具或輔助工具變更

**範例**:

```
feat(converter): 新增多幣別即時換算功能

- 實作 MultiConverter 元件
- 新增 useCurrencyConverter hook
- 補齊單元測試

Closes #123
```

### 原子化提交原則

每個 commit 必須遵循以下原則：

1. **單一職責**: 一個 commit 只解決一個問題或實現一個功能
2. **完整性**: 每個 commit 都應該是可編譯、可測試的完整狀態
3. **可回溯性**: 每個 commit 都應該能獨立回滾而不影響其他功能
4. **專業描述**: 使用清晰、專業的語言描述變更內容

**好的範例**:

```bash
fix(types): 修正 useCurrencyConverter 的 TypeScript 類型定義

- 更新 exchangeRates 類型為 Record<string, number | null>
- 增強 getRate 函數的 null 檢查邏輯
- 遵循 TypeScript 官方最佳實踐

Fixes #12
```

**不好的範例**:

```bash
# ❌ 過於簡略
fix: 修bug

# ❌ 包含多個不相關的變更
feat: 新增功能並修復bug還有更新文檔

# ❌ 非專業描述
update: 改了一些東西
```

### PR 檢查清單

- [ ] 需求連結 (Issue #)
- [ ] CI 全綠
- [ ] 測試證據 (coverage report)
- [ ] E2E 測試通過（必要時手動驗證）
- [ ] Build size 無顯著增加
- [ ] 文件已更新

---

## 5. 安全守則

### 分層防禦原則

- **Cloudflare 層**: WAF, DDoS防護, Rate Limiting, 安全標頭
- **應用層**: Input validation, XSS 防護, Error Boundary

### 禁止事項

❌ 在應用程式內重複設定 Cloudflare 已處理的安全標頭
❌ 處理金流或密鑰 (應由環境變數管理)
❌ 提交 `.env` 檔案到版本控制

### 異常處理

- 發現可疑流量 → 標記 `security` 並通知維運
- 建置失敗 → 收集 log + `pnpm env info` 提交 Issue
- 外部服務失敗 → 最多重試 3 次 (間隔 60s)

---

## 6. 文檔結構與維護規範

> **⚠️ 強制規則**：任何影響以下文檔的變更，必須同步更新對應文檔。違反此規則的 PR 不得合併。

### 文檔維護檢查清單

每次變更前，必須檢查是否影響以下文檔並同步更新：

**流程變更**：

- 修改 CI/CD → 更新 `AGENTS.md`、`DEPLOYMENT.md`
- 新增 MCP 工具 → 更新 `AGENTS.md` § 1
- 修改 Git workflow → 更新 `AGENTS.md` § 4、§ 3

**架構變更**：

- 新增/移除目錄 → 更新 `ARCHITECTURE_BASELINE.md`
- 修改分層邏輯 → 更新 `ARCHITECTURE_BASELINE.md`、`LINUS_GUIDE.md`
- 新增服務 → 更新本節文檔結構清單

**部署變更**：

- 修改 Docker → 更新 `DEPLOYMENT.md`、`Dockerfile` 註解
- 修改 Nginx → 更新 `nginx.conf` 註解、`DEPLOYMENT.md`

- 修改環境變數 → 更新 `.env.example`、`SETUP.md`

**依賴變更**：

- 升級 major 版本 → 更新 `DEPENDENCY_UPGRADE_PLAN.md`

- 新增套件 → 更新 `CITATIONS.md`（如為核心技術）
- 移除套件 → 清理所有相關文檔引用

**安全變更**：

- 修改安全標頭 → 更新 `SECURITY_BASELINE.md`、`nginx.conf`
- 新增安全檢查 → 更新 `AGENTS.md` § 5

**功能變更**：

- 新增功能 → 建立對應文檔於 `docs/`
- 完成 TODO → 更新 `AGENTS.md` § 8、`CHECKLISTS.md`

### 核心指南 (專案根目錄)

- `AGENTS.md` (本文件) - Agent 操作守則與工具說明
- `LINUS_GUIDE.md` - 開發哲學與程式碼品質準則
- `README.md` - 專案說明與快速開始

### 部署與設定 (docs/)

- `SETUP.md` - MVP 快速流程與環境設定
- `DEPLOYMENT.md` - Docker 部署指南
- `ZEABUR_DEPLOYMENT.md` - Zeabur 平台部署指南
- `SECURITY_BASELINE.md` - 安全基線與責任界面

### 功能文檔 (docs/)

- `HISTORICAL_RATES_IMPLEMENTATION.md` - 歷史匯率功能實施指南
- `QUICK_START_HISTORICAL_RATES.md` - 歷史匯率快速開始
- `EXCHANGE_RATE_UPDATE_STRATEGIES.md` - 匯率更新策略比較

### 開發參考 (docs/dev/)

- `CITATIONS.md` - 權威來源清單與技術引用
- `DEPENDENCY_UPGRADE_PLAN.md` - 依賴升級策略
- `ARCHITECTURE_BASELINE.md` - 架構藍圖與分層準則
- `CHECKLISTS.md` - 品質檢查清單

### 文檔品質要求

**所有文檔必須符合**：

1. **時間戳記**：建立與更新時間（使用 `time.now` 工具）
2. **版本標記**：重大變更需更新版本號
3. **狀態標記**：✅ 已完成、🔄 進行中、📋 規劃中、❌ 已廢棄
4. **引用來源**：技術決策需標註 `[context7:source:timestamp]` 或 `[ref: #n]`
5. **範例程式碼**：必須可執行或明確標註 `(未實作)` / `(範例)`
6. **向後相容**：不得刪除仍在使用的指令或流程，僅能標註 `(已廢棄)`

**docs/dev 規範**：

- 新增開發文檔時必須以三位數遞增前綴命名（`001_*.md`、`002_*.md` ...），保持有序。
- `docs/dev/002_development_reward_penalty_log.md` 為強制更新檔案：每次開發過程遇到錯誤或完成修正，必須在 **commit 前** 追加紀錄、Context7 引用與分數調整。
- 若流程中未同步更新獎懲記錄或缺乏引用來源，**禁止進行 `git commit`**，需先補齊後才可提交 PR。
- 建立任何新文檔需同時填寫建立/更新時間、版本、狀態與資料來源。

**文檔清理原則**：

- ❌ 禁止保留臨時報告（`*_REPORT.md`、`*_SUMMARY.md`）
- ❌ 禁止保留已完成的計畫文檔（`*_PLAN.md` 完成後應移除或歸檔）
- ✅ 保留操作指南、技術決策、最佳實踐
- ✅ 保留快速開始、故障排除、檢查清單

---

## 7. 常用指令速查

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

### Docker

```bash
docker build -t ratewise:latest .
docker run -p 8080:80 ratewise:latest
docker logs <container-id>
```

---

## 8. 當前任務狀態（2026-01-21 更新）

### ✅ 已完成 (Phase 0 - MVP)

- ✅ 測試覆蓋率 ≥80% (目前 1038 測試，92%+)
- ✅ CI/CD Pipeline (GitHub Actions - Core + SEO workflows)
- ✅ 觀測性 (Logger + Error Boundary)
- ✅ Docker 化部署
- ✅ 元件拆分 (RateWise.tsx 已模組化)
- ✅ 工程工具鏈 (Husky + lint-staged)
- ✅ TypeScript 嚴格化
- ✅ 安全標頭配置
- ✅ 歷史匯率功能 (30 天資料追蹤)
- ✅ 18 個 SEO 長尾落地頁 (USD/JPY/EUR/GBP 等)

### ✅ 已完成 (M0 - 清理與基礎強化)

- ✅ 刪除 ReloadPrompt.tsx (已移除)
- ✅ 刪除臨時報告文檔 (已清理)
- ✅ ESLint `any` 規則改為 error (已生效)
- ✅ 測試覆蓋率門檻提升至 80%+ (目前 92%+)

### ✅ 已完成 (M1 - 觀測性建立)

- ✅ Sentry 整合 (logger.ts Line 78 已實作，需設定 VITE_SENTRY_DSN)
- ✅ Secrets 掃描 (gitleaks CLI v8.18.4 已整合 [2025-12-25])
- ✅ Web Vitals 串接 (web-vitals 5.x 已整合)

### ✅ 已完成 (M2 - 依賴升級)

- ✅ Vite 已升級至 7.2.6
- ✅ Vitest 已升級至 4.0.15
- ✅ Tailwind 已升級至 4.x

### ✅ 已完成 (M3 - 測試強化與 TODO 清理，2週)

- ✅ 清理 TODO 標記 (僅剩 1 個，為 vi.doMock 技術限制，已說明)
- ✅ E2E retry 優化 (toBeAttached 修正)
- ✅ CI 通過率 100%
- ✅ React Hydration #418 修復 (ClientOnly + console.error 過濾)
- ✅ CI jest-dom matchers 修復 (expect.extend + 顯式 import)
- ✅ Cloudflare CDN 自動清除工作流程 (Release workflow)

### ✅ 已完成 (M4 - UI/UX SSOT 重構)

- ✅ MultiConverter 頁面整合 (多幣別即時換算)
- ✅ Favorites 頁面整合 (常用貨幣 + 轉換歷史)
- ✅ 技術債清理 (20+ 時間戳標記移除，統一英文 JSDoc)
- ✅ 6 種主題瀏覽器驗證 (Zen/Nitro/Kawaii/Classic/Ocean/Forest)
- ✅ SSOT Design Token 一致性
- ✅ ParkKeeper UI/UX 風格統一 (MultiConverter/Favorites 頁面重構)

### 📋 可選 (M5 - 架構演進，4週)

- [ ] useCurrencyConverter 拆分 (449 行 → 多個小 hook)
- [ ] i18n 國際化系統 (react-i18next)
- ✅ 歷史匯率功能整合 (30 天趨勢圖已實作)
- ✅ 匯率趨勢圖 (使用 lightweight-charts)

---

## 9. 故障排除

### 建置失敗

```bash
# 1. 清除快取
pnpm store prune
rm -rf node_modules
pnpm install

# 2. 檢查環境
node -v    # 應為 20+
pnpm -v    # 應為 9+

# 3. 檢查類型錯誤
pnpm typecheck
```

### 測試失敗

```bash
# 1. 更新測試快照
pnpm test -u

# 2. 執行單一測試
pnpm test RateWise.test.tsx

# 3. 檢查覆蓋率
pnpm test --coverage
```

### Docker 建置失敗

```bash
# 1. 檢查 Dockerfile 語法
docker build --no-cache -t ratewise:latest .

# 2. 進入容器除錯
docker run -it ratewise:latest sh

# 3. 檢查日誌
docker logs <container-id>
```

---

## 10. 品質門檻

每個 PR 必須通過:

- ✅ CI 全綠 (lint + typecheck + test + build)
- ✅ Test coverage ≥80%
- ✅ Build size <500KB
- ✅ E2E 測試通過（必要時手動）
- ✅ Code review 通過

---

## 11. 聯絡與支援

- **問題回報**: 建立 Issue 並標記適當 label
- **安全問題**: 標記 `security` 並通知維運
- **文檔問題**: 參考 `docs/dev/*.md`
- **工具問題**: 參考 [LINUS_GUIDE.md](./LINUS_GUIDE.md)

---

## 12. 技術債掃描報告（2025-10-26）

### 總評分數卡

| 項目           | 分數   | 狀態      |
| -------------- | ------ | --------- |
| **可維護性**   | 82/100 | 🟢 優秀   |
| **測試品質**   | 90/100 | 🟢 優秀   |
| **資安成熟度** | 75/100 | 🟡 良好   |
| **效能**       | 80/100 | 🟢 優秀   |
| **觀測性**     | 65/100 | 🟡 可接受 |
| **工程流程化** | 85/100 | 🟢 優秀   |

**總評**: 78/100 🟢 **優秀** - 符合 Linus 標準的實用主義專案

### 風險矩陣 Top 3

1. **Logger 未串接遠端服務** (Impact: High, Likelihood: High) → M1 修復
2. **5 個 TODO 未完成** (Impact: Medium, Likelihood: High) → M3 清理
3. **Vite 6.4 → 7.1.12 可升級** (Impact: Medium, Likelihood: Medium) → M2 升級

### 完整報告

詳見以下文檔：

- `docs/dev/TECH_DEBT_AUDIT.md` - 完整技術債報告與分數卡
- `docs/dev/REFACTOR_PLAN.md` - 分階段重構路線圖（6-10 週）
- `docs/dev/DEPENDENCY_UPGRADE_PLAN.md` - pnpm 依賴升級策略
- `docs/dev/ARCHITECTURE_BASELINE.md` - 架構藍圖與分層準則
- `docs/dev/CHECKLISTS.md` - 品質檢查清單
- `docs/dev/CITATIONS.md` - 權威來源清單 (17 個來源)
- `docs/SECURITY_BASELINE.md` - 安全基線與責任界面

---

> **總結**: Agent 的任務是保持流程可靠並回報結果，不參與需求判斷、不做超出授權範圍的操作。所有操作依照本文檔與 `docs/dev/` 文檔執行。

**最後更新**: 2026-01-29T01:39:05+08:00
**版本**: v2.6 (核心 CI + SEO workflows)
**執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)

_本文檔依照 Linus Torvalds 開發哲學產生，所有建議經過實用性驗證。_
