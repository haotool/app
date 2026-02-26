# AGENT 操作守則與工具說明

> **最後更新**: 2026-02-27T02:57:50+08:00  
> **執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)  
> **版本**: v2.11 (整合 .example/config 基準：Skills 盤點、QA 產物規範、Commitlint 規則同步)  
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

// 2. 截圖（QA 產物統一存放到 screenshots/）
browser_take_screenshot --filename "screenshots/homepage.png"

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

### Skills（專案本地 / 全域）盤點與使用策略（2026-02-27 新增）

**技能來源優先順序（避免同名衝突）**:

1. `.agents/skills/*`（專案本地，優先反映本 repo 實際需求）
2. `~/.agents/skills/*`（使用者全域，偏通用前端/SEO/設計）
3. `~/.codex/skills/*`（Codex 全域備援與工程通用模式）

**重複 skill 處理原則**:

- 同名 skill 若同時存在於 `~/.agents/skills` 與 `~/.codex/skills`，優先使用 `~/.agents/skills`
- 若專案內 `.agents/skills` 有同名 skill，優先使用專案版本（通常更貼近現況）
- 任務明確提到 skill 名稱時，先讀對應 `SKILL.md`，再決定是否需要額外 skill

#### A. 專案高優先 Skills（建議預設考慮）

| Skill                       | 來源             | 適用場景                          | 專案關聯                                |
| --------------------------- | ---------------- | --------------------------------- | --------------------------------------- |
| `react`                     | `.agents/skills` | React 19 元件/狀態/效能調整       | 全部 React apps                         |
| `vite-react-best-practices` | `.agents/skills` | Vite SPA 架構、建置、部署與效能   | 全部 apps（Vite + `vite-react-ssg`）    |
| `vitest`                    | `.agents/skills` | Vitest 測試撰寫/除錯/mocking      | 全部 apps                               |
| `pwa-development`           | `.agents/skills` | Service Worker、Workbox、離線快取 | `ratewise`（PWA 重度使用）              |
| `typescript`                | `.agents/skills` | TS 型別錯誤、tsconfig、型別效能   | 全 repo                                 |
| `wcag-compliance`           | `.agents/skills` | 無障礙稽核與 WCAG 2.2 AA 修正     | `ratewise`、`nihonname`、`quake-school` |
| `framer-motion`             | `.agents/skills` | `framer-motion` 動畫與效能優化    | `haotool`                               |
| `ui-ux-pro-max`             | `.agents/skills` | UI/UX 重構、版面與視覺設計        | `ratewise`、`park-keeper`、`haotool`    |
| `zod`                       | `.agents/skills` | schema 驗證、設定/輸入驗證        | 新增 API/表單驗證時                     |
| `tailwind-v4-shadcn`        | `.agents/skills` | Tailwind v4 / CSS 變數 / 主題系統 | `park-keeper`（Tailwind v4）            |
| `tdd`                       | `.agents/skills` | 紅綠燈迴圈、小步重構              | 功能修復與重構任務                      |

#### B. 全域補強 Skills（按需求啟用）

| Skill                             | 來源                                   | 適用場景                                 | 備註                          |
| --------------------------------- | -------------------------------------- | ---------------------------------------- | ----------------------------- |
| `seo-audit`                       | `~/.agents/skills` / `~/.codex/skills` | 技術 SEO 問題診斷、排名與索引排查        | 本 repo 多個 SEO/SSG app 常用 |
| `audit-website`                   | `~/.agents/skills` / `~/.codex/skills` | 網站健康檢查、Broken links、SEO/效能報告 | 使用 squirrelscan CLI         |
| `web-design-guidelines`           | `~/.agents/skills` / `~/.codex/skills` | UI 規範/設計審查                         | 前端 review 任務              |
| `frontend-design`                 | `~/.agents/skills` / `~/.codex/skills` | 建立高辨識度介面                         | 新頁面/落地頁設計             |
| `vercel-react-best-practices`     | `~/.agents/skills` / `~/.codex/skills` | React 效能與 rerender 模式               | 與本地 `react` skill 搭配     |
| `find-skills`                     | `~/.agents/skills` / `~/.codex/skills` | 搜尋與安裝新 skills                      | 需求超出現有技能時            |
| `leaflet-mapping`                 | `~/.agents/skills`                     | Leaflet / react-leaflet 地圖互動         | `park-keeper` 地圖功能        |
| `mapbox-web-performance-patterns` | `~/.agents/skills`                     | Mapbox GL 效能優化                       | 目前未使用 Mapbox，預備       |
| `security-review`                 | `~/.codex/skills`                      | 安全檢查清單、輸入/密鑰/API 風險         | 新增敏感功能時                |
| `frontend-patterns`               | `~/.codex/skills`                      | 通用前端架構/狀態管理模式                | 大型重構時                    |
| `coding-standards`                | `~/.codex/skills`                      | 通用程式碼風格與品質模式                 | 跨語言/跨 app 重構時          |
| `tdd-workflow`                    | `~/.codex/skills`                      | 完整 TDD/BDD 工作流                      | 大功能或高風險修復            |

#### C. 當前專案與 Skills 快速對照

- `apps/ratewise`: `react`、`vite-react-best-practices`、`vitest`、`pwa-development`、`wcag-compliance`、`ui-ux-pro-max`
- `apps/park-keeper`: `react`、`tailwind-v4-shadcn`、`leaflet-mapping`、`typescript`、`vitest`
- `apps/haotool`: `framer-motion`、`frontend-design`、`seo-audit`、`vite-react-best-practices`
- `apps/nihonname` / `apps/quake-school`: `react`、`vite-react-best-practices`、`vitest`、`seo-audit`、`wcag-compliance`

#### D. Agent 操作責任（Skills）

- 任務明確提到 skill 名稱，或任務內容明顯符合 skill 描述時，必須先讀該 `SKILL.md`
- 同一任務只使用最小必要 skill 集合，避免堆疊過多規則造成衝突
- 若 skill 不可用、檔案缺失或指引不清楚，需在回報中說明並採用次佳方案

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
# Pre-commit 內含版本 SSOT 與 CHANGELOG 驗證 (scripts/verify-version-ssot.mjs)
# RateWise 產出變更需版本號更新或新增 changeset

# 2. Lint
pnpm lint

# 3. Format check
pnpm format

# 4. 安全掃描
pnpm audit
```

### QA 產物與截圖規範（2026-02-27 從 `.example/config` 納入）

- **截圖檔案統一放置**：`screenshots/<name>.png`，禁止放在專案根目錄
- **Puppeteer / Playwright MCP**：`browser_take_screenshot` 必須顯式傳入 `filename: "screenshots/<name>.png"`
- **`screenshots/` 為 QA 產物目錄**：不應納入正式提交（除非任務明確要求）
- **完成 QA 任務前**：需確認瀏覽器 console 無錯誤（0 errors）
- **重建 Docker / 發版前**：至少確認 `pnpm typecheck`、`pnpm test`、`pnpm build:ratewise` 可通過（或在回報中說明未執行原因）

### Docker 建置流程

```bash
# 1. 建置映像
docker build -t ratewise:latest .

# 2. 執行容器
docker run -p 8080:80 ratewise:latest

# 3. 健康檢查 (使用 Puppeteer MCP)
browser_navigate --url "http://localhost:8080"
browser_take_screenshot --filename "screenshots/docker-health-check.png"
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
- `perf`: 效能優化
- `test`: 測試相關
- `build`: 建置相關
- `ci`: CI/CD 設定
- `chore`: 建置工具或輔助工具變更
- `revert`: 還原提交

**範例**（符合目前 `commitlint.config.cjs` 強化規則）:

```
feat(converter): 新增多幣別即時換算功能與測試規範提示

- 實作 MultiConverter 元件
- 新增 useCurrencyConverter hook
- 補齊單元測試

測試：pnpm typecheck && pnpm test && pnpm build:ratewise
```

### Commitlint 與 Husky 同步規則（2026-02-27 升級）

- `.husky/commit-msg` 會執行 `npx --no -- commitlint --edit $1`
- `commitlint.config.cjs` 強制規則（人工作業提交）：
  - 標題需包含中文（CJK）
  - 主體第一個非空行需以 `- ` 條列開頭
  - 需包含 `測試：...` 頁尾說明
  - 禁止常見簡體字（維持繁體中文提交）
  - 允許類型：`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`
- 自動化提交豁免（bot/版本發佈）：`Version Packages`、`chore(release): ...`、`chore(deps): ...`、`build(deps): ...`

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
- ✅ CI/CD Pipeline (GitHub Actions - 6 workflows: ci, release, seo-audit, seo-production, update-rates x2)
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

## PWA 離線快取策略（2026-02-10 驗證通過）

**關鍵設定**：

1. `globPatterns` 必須含 `json`：`vite-react-ssg` 產生 `static-loader-data-manifest-*.json`，React Router client-side navigation 依賴此檔案。缺失時離線 SPA 導覽全部失敗。
2. `globIgnores` 排除 `rates/**/*.json`、SEO 檔案（sitemap/robots/llms/manifest）。
3. 使用 `injectManifest` 策略，支援 `setCatchHandler` 離線 fallback。
4. `rollupFormat: 'iife'`，避免 ES module 在部分瀏覽器評估失敗。
5. `OfflineIndicator` 僅完全離線時顯示，10 秒自動關閉，同次 session 不再重複。

**Agent 操作注意**：新增頁面或靜態資源格式時，檢查 `globPatterns` 與 `globIgnores` 是否正確。離線測試必須在 `pnpm build && pnpm preview` 環境執行。

---

## 9. 版本管理規範（SSOT）

### Monorepo 版本管理策略

**工具**: 使用 Changesets 管理版本與 CHANGELOG

**核心原則**:

- **SSOT**: 版本號統一來源於 `package.json`
- **語義化版本**: 遵循 SemVer 2.0.0 規範
- **自動化**: 版本號由 Vite 建置時自動注入

### 版本號生成策略

```typescript
// vite.config.ts - 版本生成邏輯
// 1. 優先: Git 標籤 (@app/ratewise@x.y.z)
// 2. 次之: package.json 版本 + commit 數
// 3. 開發: 版本 + sha.hash[-dirty]
```

### 版本 SSOT 結構

```
apps/ratewise/
├── package.json          # 版本真實來源
├── src/config/
│   └── version.ts        # 版本 SSOT 模組
└── vite.config.ts        # 版本注入邏輯
```

### 版本使用規範

**正確做法**:

```typescript
// ✅ 從 SSOT 導入版本
import { APP_VERSION, getDisplayVersion } from '@/config/version';
```

**禁止行為**:

```typescript
// ❌ 硬編碼版本
const version = 'v2.0.0';

// ❌ 直接使用 import.meta.env（應封裝於 version.ts）
const version = import.meta.env.VITE_APP_VERSION;
```

### 版本升級流程

1. **修改 `package.json`** 中的 `version` 欄位
2. **建立 Changeset**: `pnpm changeset`
3. **生成 CHANGELOG**: `pnpm changeset version`
4. **驗證**: `pnpm build` 確認版本正確注入
5. **提交**: 遵循 Commit Convention

### 自動版本更新（Renovate + Changesets）

- Patch/Minor 更新由 Renovate 自動合併
- Major 更新需人工審查
- 版本變更自動同步至 CHANGELOG

---

## 10. 故障排除

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

## 11. 品質門檻

每個 PR 必須通過:

- ✅ CI 全綠 (lint + typecheck + test + build)
- ✅ Test coverage ≥80%
- ✅ Build size <500KB
- ✅ E2E 測試通過（必要時手動）
- ✅ Code review 通過

---

## 12. 聯絡與支援

- **問題回報**: 建立 Issue 並標記適當 label
- **安全問題**: 標記 `security` 並通知維運
- **文檔問題**: 參考 `docs/dev/*.md`
- **工具問題**: 參考 [LINUS_GUIDE.md](./LINUS_GUIDE.md)

---

## 13. 技術債掃描報告（2025-10-26）

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

**最後更新**: 2026-02-27T02:57:50+08:00
**版本**: v2.11 (整合 .example/config 基準：Skills 盤點、QA 產物規範、Commitlint 規則同步)
**執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)

_本文檔依照 Linus Torvalds 開發哲學產生，所有建議經過實用性驗證。_
