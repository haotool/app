# AGENTS.md

RateWise Monorepo -- Agent 標準作業程序（SOP）與稽核控制規範。

## 文件控制（Document Control）

| 欄位       | 內容                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| 文件名稱   | `AGENTS.md`                                                                                                        |
| 文件性質   | Agent 操作 SOP / 稽核控制基準                                                                                      |
| 適用範圍   | 本 repo 全部 workspace (`apps/*`)、root 流程與文件更新                                                             |
| 文件狀態   | Active                                                                                                             |
| 文件擁有者 | Repo Maintainer                                                                                                    |
| 核准角色   | Repo Maintainer                                                                                                    |
| 生效日期   | 2026-02-27                                                                                                         |
| 審查週期   | 每 90 日或重大流程變更後                                                                                           |
| 下次審查日 | 2026-05-28                                                                                                         |
| 關聯文件   | `CLAUDE.md`, `commitlint.config.cjs`, `.husky/*`, `package.json`, `docs/dev/002_development_reward_penalty_log.md` |

## 用語等級（Normative Language）

為避免稽核歧義，本文件使用以下等級詞：

- **必須（MUST）**：不可省略；違反視為流程不合規
- **建議（RECOMMENDED）**：通常應遵守；若不採用需說明理由
- **可（MAY）**：視任務情境選用

## 語言政策

- Agent 與使用者互動、狀態更新、錯誤說明與結案摘要，**必須**使用繁體中文。

## Project Overview

- **Repo 型態**: `pnpm` monorepo（`apps/*` workspace）
- **主要技術棧**: React 19 + TypeScript + Vite 7 + Vitest + Playwright
- **樣式與互動**: Tailwind CSS（v3/v4 混合）、Framer Motion（部分 app）
- **PWA/SSG**: `vite-plugin-pwa` + Workbox、`vite-react-ssg`（以 `ratewise` 為主）
- **品質閘門**: Husky (`commit-msg`, `pre-commit`, `pre-push`) + Commitlint
- **版本管理**: Changesets + package.json SSOT（`ratewise` 有版本 SSOT 驗證）

### 主要應用（apps）

- `apps/ratewise`：匯率換算主站（PWA/SEO/測試密度最高）
- `apps/nihonname`：日文命名工具（SSG/SEO）
- `apps/haotool`：作品入口與視覺展示
- `apps/quake-school`：地震學習工具（SSG）
- `apps/park-keeper`：停車紀錄工具（Leaflet / i18n / Tailwind v4）
- `apps/poplog`：子應用（依任務確認）
- `apps/shared`：共用程式碼/資源

## Environment

```bash
pnpm install --frozen-lockfile
pnpm dev                     # 預設啟動 @app/ratewise
pnpm build                   # 建置所有 workspace apps
pnpm build:ratewise          # 單一 app 建置（常用）
pnpm typecheck               # 實際為 pnpm -r typecheck
pnpm test                    # 實際為 pnpm -r test
pnpm test:e2e                # ratewise + nihonname（Playwright）
pnpm lint
pnpm format                  # prettier --check .
pnpm format:fix              # prettier --write .
```

### Engines（以 root `package.json` 為準）

- **Node.js**: `^24.0.0`
- **pnpm**: `9.10.0`

## Project Structure

```text
apps/                 # workspace apps（前端為主）
docs/                 # 使用手冊、部署、安全、功能文件
docs/dev/             # 開發決策與基線文件（強制編號）
scripts/              # 驗證/SEO/版本/SSOT 腳本
.husky/               # Git hooks（commit-msg / pre-commit / pre-push）
.changeset/           # Changesets 版本管理資料
```

## 控制目標（Control Objectives）

本 SOP 的控制目標如下：

1. **可追溯性**：每次變更可追溯到需求、提交、PR、驗證與依據
2. **一致性**：文件敘述與 repo 實際設定一致（SSOT）
3. **可重現性**：重要操作有命令、條件與驗證結果
4. **最小風險**：避免無關改動、避免破壞既有功能
5. **稽核可證明性**：保留必要證據（logs、CI、PR、截圖、記錄）

## 核心原則（Engineering Principles）

1. **Linus 三問先行**（真問題 / 更簡單 / 會破壞什麼）
2. **KISS / MVP First**：先解決問題，再做延伸優化
3. **SSOT 優先**：規則以 `package.json`、`.husky/*`、`commitlint.config.cjs` 為準
4. **最小必要變更**：降低回歸風險與審查成本
5. **文件同步責任**：流程/規則變更時同步更新本文件與 `CLAUDE.md`

## 角色與責任（Roles & Responsibilities）

| 角色                       | 責任                                           |
| -------------------------- | ---------------------------------------------- |
| User / Requester           | 提供需求、確認業務決策與授權範圍               |
| Agent                      | 執行變更、驗證、更新文件、提交證據、遵守本 SOP |
| Repo Maintainer / Reviewer | 審核 PR、處理例外批准、決定合併策略            |
| CI / Git Hooks             | 自動化驗證提交品質、阻擋不合規提交/推送        |

## 控制矩陣（Audit Control Matrix）

| 控制 ID      | 控制項       | 必須要求                                                                                      | 證據                                     | SSOT / 來源                                      |
| ------------ | ------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `AGT-CTX-01` | 官方文件查證 | 遇 build/test/lint 錯誤、新工具、CI/CD 變更、major 升級時，先查官方文件                       | Context7 / Web 查詢紀錄、引用來源        | 本 SOP、`CLAUDE.md`                              |
| `AGT-DOC-01` | 開發文檔編號 | `docs/dev/` 新檔名必須 `00X_*.md`                                                             | `git diff`, 檔名紀錄                     | `docs/dev/` 結構                                 |
| `AGT-LOG-01` | 獎懲記錄更新 | 每次 `git commit` 前更新 `docs/dev/002...`                                                    | 002 檔案 diff、總分更新                  | `docs/dev/002_development_reward_penalty_log.md` |
| `AGT-LOG-02` | 002 格式治理 | `docs/dev/002...` 新增紀錄必須使用 entry blocks；禁止回退巨型 table，舊資料僅可整理為精簡索引 | 002 檔案 diff、格式區塊一致性            | `docs/dev/002_development_reward_penalty_log.md` |
| `AGT-CMT-01` | 提交格式     | commit message 通過 commitlint 硬規則                                                         | `commit-msg` hook / commitlint 結果      | `commitlint.config.cjs`                          |
| `AGT-PC-01`  | 提交前檢查   | `pre-commit` 5 步驟通過                                                                       | hook log                                 | `.husky/pre-commit`                              |
| `AGT-PP-01`  | 推送前檢查   | `typecheck` + `test` + `build:ratewise` 通過                                                  | hook log / CI                            | `.husky/pre-push`                                |
| `AGT-QA-01`  | QA 截圖管理  | 截圖集中於 `screenshots/`，不得污染 root                                                      | 檔案路徑、`git status --ignored --short` | `.gitignore`, 本 SOP                             |
| `AGT-DOC-02` | 文件同步     | 流程/規則變更需同步更新 `AGENTS.md` / `CLAUDE.md`                                             | 文件 diff                                | 本 SOP、`CLAUDE.md`                              |
| `AGT-MRG-01` | 主支合併     | 透過 PR 與 `gh` 進行合併；避免未審查直推主支                                                  | PR 編號、merge 記錄                      | GitHub / `gh`                                    |

## Mandatory Workflow (Agent SOP)

### Phase 1. 需求確認（Intake & Risk Screening）

Agent **必須**先完成：

1. 確認需求屬真實問題（bug / 功能 / 文件 /維運）
2. 判斷影響面（程式碼、文件、CI、部署、SEO、PWA、版本）
3. 選擇最小可行方案並說明不採用更複雜方案的理由（Linus 三問）

### Phase 2. 文件與依據查證（Evidence-First）

以下情境 **必須**先查官方文件（Context7 或官方網站）：

- build / test / lint 錯誤
- 不確定最佳實踐或設計模式
- 新 library / framework / 工具導入
- CI/CD、部署設定修改
- major 版本依賴升級

**建議**：在回報或 `docs/dev/002...` 記錄查詢來源與結論。

### Phase 3. 實作與驗證（Execution & Validation）

- 功能/修復/重構任務 **建議**採 BDD/TDD（RED → GREEN → REFACTOR）
- 文檔任務 **必須**校對內容與 repo 實際設定一致
- 驗證範圍採最小必要原則；高風險變更再擴大驗證

### Phase 4. 提交前控制（Pre-Commit Controls）

提交前 Agent **必須**：

1. 更新 `docs/dev/002_development_reward_penalty_log.md`
2. 確認 002 新增內容使用 entry blocks；歷史整理僅能寫入精簡索引，不得新增巨型 table
3. 若 002 紀錄為 `incident` / `regression`，必須明確寫出根因、影響、修復與預防
4. 檢查 QA 截圖與暫存檔未污染 root
5. 確認受影響文件同步（至少 `AGENTS.md` / `CLAUDE.md`）
6. 使用符合 commitlint 規範的 commit message

### Phase 5. 推送與合併（Push & Merge Controls）

- 推送前 **必須**通過 `pre-push` hook
- 合併主支 **必須**透過 PR 與 `gh`（避免本地未審查直推 `main`）
- 若 PR checks 未完成或失敗，**不得**強制合併（除非維護者批准例外）

## Quality Gates (Repo SSOT)

### `commit-msg`（Husky）

- 執行：`npx --no -- commitlint --edit $1`
- 規則來源：`commitlint.config.cjs`

### `pre-commit`（Husky，實際 5 步驟）

1. `pnpm lint-staged`
2. `pnpm typecheck`
3. `pnpm format`（`prettier --check .`）
4. `node scripts/verify-ssot-sync.mjs`（僅相關檔變更時）
5. `node scripts/verify-version-ssot.mjs`（僅版本相關檔變更時）

### `pre-push`（Husky，快速必要檢查）

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm build:ratewise`

- E2E / coverage / Lighthouse 由 CI 執行（本地 pre-push 不做完整長時間檢查）

## Commit Format（commitlint SSOT）

```text
type(scope): 繁體中文標題

- 條列說明變更內容
- 第二點（如有）

測試：執行了哪些測試 / 未執行原因
```

### Allowed Types

- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `perf`
- `test`
- `build`
- `ci`
- `chore`
- `revert`

### Hard Rules（目前實作）

- 標題 **必須**包含中文（CJK）
- 主體 **必須**存在，且第一個非空行 **必須**以 `- ` 開頭
- 內容 **必須**包含 `測試：...`（全形冒號）
- 內容 **必須**使用繁體中文（禁止常見簡體字）
- `header` 長度上限 `100`

### Bot / Release 豁免（已內建）

以下訊息由 commitlint 忽略：

- `Version Packages`
- `chore(release): ...`
- `chore(deps): ...`
- `build(deps): ...`

## QA Artifact Rules（截圖與測試產物）

### 強制規則

- QA 截圖 **必須**存放於 `screenshots/<name>.png`
- QA 圖檔 **不得**放在專案根目錄（`*.png`, `*.jpg`, `*.jpeg`, `*.webp`）
- Playwright / Puppeteer MCP 截圖 **必須**顯式指定 `filename: "screenshots/<name>.png"`
- `screenshots/` 視為 QA 暫存目錄，除非任務明確要求，**不得**提交

### QA 完成前最小檢查

- browser console error = `0`
- `git status --short` / `git status --ignored --short` 確認未污染 root
- UI/PWA 變更至少完成對應 app 的 build 或核心測試驗證

### 截圖指令範例

```bash
browser_take_screenshot --filename "screenshots/homepage.png"
```

## Root Hygiene（根目錄整潔控制）

### 常見噪音來源（正常現象）

- `.playwright-mcp/`（大量瀏覽器暫存截圖）
- root-level QA 截圖（通常已被 `.gitignore` 忽略）
- AI 工具目錄（`.agents` / `.claude` / `.cursor` / `.agent`）
- monorepo 共用設定檔集中於 root

### 排查命令（建議）

```bash
git status --short
git status --ignored --short
ls -la
```

### 清理原則

- 先辨識「正式資產」與「本機 QA 暫存」再刪除
- **不得**誤刪未追蹤的 `.agents/skills/*`（可能為本機技能庫）
- `.example/` 為參考模板目錄（已忽略），清理通常不會進入 commit

## Skills Strategy（專案本地 / 全域）

### 優先順序

1. `.agents/skills/*`（專案本地）
2. `~/.agents/skills/*`（使用者全域）
3. `~/.codex/skills/*`（Codex 全域備援）

### 專案高優先 Skills（建議預設考慮）

- `react`
- `vite-react-best-practices`
- `vitest`
- `pwa-development`
- `typescript`
- `wcag-compliance`
- `ui-ux-pro-max`
- `framer-motion`
- `tailwind-v4-shadcn`
- `zod`
- `tdd`

### 全域補強 Skills（按任務啟用）

- `seo-audit`, `audit-website`
- `frontend-design`, `web-design-guidelines`
- `vercel-react-best-practices`
- `leaflet-mapping`
- `security-review`
- `find-skills`

### Skill 使用規則

- 任務明確提到 skill 名稱或內容明顯符合 skill 描述時，**必須**先讀 `SKILL.md`
- 同一任務 **建議**使用最小必要 skill 集合（避免規則衝突）
- 若 skill 不可用或內容不清楚，**必須**在回報中說明並採次佳方案

## Documentation Sync Rules（文件同步控制）

### 流程 / CI / 部署變更

- 修改 CI/CD 或 Git hooks → 更新 `AGENTS.md`、`CLAUDE.md`（必要時 `docs/DEPLOYMENT.md`）
- 修改 commit 規範 → 同步 `commitlint.config.cjs` 與文件說明
- 修改版本流程 → 同步 `AGENTS.md`、`CLAUDE.md`、Changesets / `CHANGELOG.md` 說明
- `Release` workflow 若涉及 Cloudflare 邊緣行為，必須確認 app release、`security-headers` worker 與 CDN purge 的先後順序一致；缺 secret 時需明確回報 `skip`，不可假設正式站已同步
- `security-headers` worker 部署見下方「security-headers Worker 部署 SOP」

### 安全 / 架構 / 功能變更

- 安全標頭或責任界面 → 更新 `SECURITY.md` / `docs/SECURITY_BASELINE.md`
- 架構分層變更 → 更新 `docs/dev/ARCHITECTURE_BASELINE.md`
- 新增長期技術決策 → 建立 `docs/dev/00X_*.md`

### 文檔品質最低要求

- 有更新時間（重大文件）
- 有版本或狀態標記（重大文件）
- 有資料來源（技術決策需附權威來源）
- 不保留一次性報告檔（見下方禁止清單）

## security-headers Worker 部署 SOP

**唯一維護對象**：`security-headers/src/worker.js`（wrangler deploy 時由 esbuild 自動編譯，Cloudflare Dashboard 顯示編譯輸出為正常現象）

**認證前置**（wrangler OAuth token 會過期）：

```bash
npx wrangler whoami          # 確認登入狀態
# 若失敗：npx wrangler login 或設定 CLOUDFLARE_API_TOKEN env var
```

**部署**：

```bash
cd security-headers && npx wrangler deploy
```

**版本號同步**：修改 worker 時必須同步 4 處（JSDoc 標題、變更記錄、`__network_probe__` header、主回應 header）

**部署後驗證**（必須用 GET，HEAD 請求無 body 故 CSP 不含 hash — 正確行為）：

```bash
curl -s --compressed <TARGET_URL> -D - -o /dev/null | grep -i 'x-security-policy-version\|script-src'
# 範例：curl -s --compressed https://app.haotool.org/ratewise/ -D - -o /dev/null | grep -i 'x-security-policy-version\|script-src'
```

**已知假陽性（不需處理）**：

- Playwright 顯示 `ERR_FAILED @ gtag/js` → `--disable-background-networking` 測試環境攔截，非 CSP 問題
- HEAD 請求 CSP 無 hash → 正確行為
- Cloudflare 程式碼與本地不同 → esbuild 編譯輸出，正常現象

**ratewise CSP connect-src 必要域名**：`googletagmanager.com`（GA4 配置請求）、`google-analytics.com`、`region1.google-analytics.com`、`analytics.google.com`、`cdn.jsdelivr.net`

## Prohibited Files / Actions

### 禁止建立或保留（除非任務明確要求）

- `*_REPORT*.md`
- `*_REVIEW*.md`
- `*_SUMMARY*.md`
- `ANALYSIS*.md`
- root-level QA 圖檔（`*.png`, `*.jpg`, `*.jpeg`, `*.webp`）

### 禁止操作

- 提交 `.env` / secrets / token
- 在應用層重複設定 Cloudflare 已處理之安全標頭（未確認責任界面前）
- 未經確認執行 destructive git 指令（如 `git reset --hard`）
- 未經 PR 審查直推 `main`（緊急例外除外）

## 實務成功模式（Proven Workflow Patterns）

基於多次成功執行歷史，以下為經驗證的高效流程模式：

### 版本發布完整流程（v2.6.0 實例）

1. **Changesets 處理**：`pnpm changeset version` 自動生成 CHANGELOG 並同步版本號
2. **版本 SSOT 驗證**：確認 root `package.json` 與 app `package.json` 版本一致
3. **公開 API 同步**：執行 `pnpm --filter @app/<name> prebuild` 更新 `api/latest.json`、`llms.txt`、`openapi.json`
4. **原子化提交**：
   - Commit 1: `chore(release): <App> v<X.Y.Z>`（版本升級）
   - Commit 2: `docs(<app>): 同步公開 API 文件版本至 v<X.Y.Z>`（API 檔案）
5. **驗證推送**：所有 pre-push hooks 必須通過（typecheck + test + build）

### Dependabot 安全警告處理流程

1. **查詢警告**：`gh api repos/<org>/<repo>/dependabot/alerts --jq '.[] | select(.state == "open")'`
2. **檢查現有 override**：核對 `package.json` 的 `pnpm.overrides` 區塊
3. **添加安全版本**：
   ```json
   "pnpm": {
     "overrides": {
       "package-name": ">=safe.version",
       "package@version-range": ">=safe.version"
     }
   }
   ```
4. **套用並鎖定**：`pnpm install --no-frozen-lockfile`
5. **提交修復**：`fix(security): 修復 <package> 安全漏洞（<CVE-ID>）`

### PR Rebase 與版本衝突解決（#156 實例）

1. **診斷衝突**：`gh pr view <NUMBER> --json mergeStateStatus,mergeable`
2. **檢查衝突源**：`git merge-tree origin/main FETCH_HEAD $(git merge-base origin/main FETCH_HEAD)`
3. **手動 rebase**：
   ```bash
   git fetch origin <branch>
   git checkout -b temp-rebase origin/<branch>
   git rebase origin/main
   # 解決版本衝突（優先採用 main 版本）
   git add <resolved-files>
   git rebase --continue
   ```
4. **強制推送**：`git push origin temp-rebase:<branch> --force-with-lease`
5. **清理分支**：`git checkout main && git branch -D temp-rebase`
6. **等待 CI 後合併**：`gh pr merge <NUMBER> --squash`（檢查通過後）

### SEO 最佳實踐遷移（Schema.org @graph）

1. **證據查詢**：使用 Context7 查詢官方最佳實踐（Google 2026 結構化資料指南）
2. **漸進式遷移**：
   - 更新 `SEOHelmet.tsx`：單一 `<script type="application/ld+json">` 包含 @graph
   - 更新 SSOT：`seo-metadata.ts` 集中管理所有 schema
   - 標記舊版：`constants.ts` 添加 `@deprecated` 註解
3. **測試更新**：修改所有依賴舊結構的測試檔案
4. **型別安全**：移除所有 TypeScript 非空斷言，改用 `.at(-1) ?? 0` 模式
5. **原子化提交**：每個邏輯變更獨立 commit（SEO 結構 → 測試修復 → 型別安全）

### RateWise SEO / Head 問題速解

1. **FAQPage 重複**：預設只在真正 FAQ 頁輸出 `FAQPage`；首頁、幣別頁、About/Guide 保留可讀 FAQ 內容即可，避免重複 rich results 訊號
2. **Hydration 後 head 重複**：若 `vite-react-ssg` + shim 架構仍需保留，優先在 client 端做 head reconciliation；**不要**直接移除 shim 破壞 SSG head 輸出
3. **手動寫入 `document.head`**：必須加 managed 標記、`unmount` cleanup，且 `useEffect` 依賴只能用穩定 primitive/signature，避免跨頁殘留或同 props 重跑整份 head

### 多步驟任務執行範本

1. **TodoWrite 建立**：任務開始前建立清單追蹤進度
2. **分階段執行**：每完成一個邏輯單元立即標記 completed
3. **證據收集**：保留關鍵命令輸出與測試結果
4. **錯誤恢復**：遇到失敗立即修復並記錄修正方式
5. **結案總結**：提供完整進度報告與未完成項目清單

### Prettier 格式漂移修法（prebuild 產出物）

**觸發場景**：`prettier --check` 在 pre-commit 報 `api/latest.json`、`openapi.json`、`llms.txt` 等格式不一致。

**根本原因**：`JSON.stringify(null, 2)` 總是展開多行；Prettier 依 `printWidth` 決定單行/多行。每次 prebuild 重新生成 → 格式永遠漂移。

**正確做法（MUST）**：

1. 將所有 prebuild 產出物加入 `.prettierignore`
2. prebuild script **禁止**呼叫 `prettier.format()` / `prettier.resolveConfig()`
3. script 直接寫 `JSON.stringify(data, null, 2) + '\n'`

```
# .prettierignore
apps/ratewise/public/api/latest.json
apps/ratewise/public/openapi.json
apps/ratewise/public/llms.txt
apps/ratewise/public/llms-full.txt
```

**反模式（MUST NOT）**：在 prebuild script 內 `import prettier from 'prettier'` 然後呼叫格式化 — 這是過度複雜且會造成漂移的做法。

## 例外處理（Deviation / Exception Handling）

當任務需偏離本 SOP（例如緊急 hotfix、CI 故障、工具失效），Agent **必須**記錄：

1. 偏離原因（Why）
2. 偏離範圍（What changed / What was skipped）
3. 風險評估（Impact）
4. 暫時補償控制（Compensating controls）
5. 批准者或確認者（Who approved）
6. 後續補正計畫（Follow-up）

**建議記錄位置**：PR 描述、PR comment、或 `docs/dev/002...` 條目。

## 稽核證據清單（Evidence Pack Checklist）

Agent 在結案或提交時，應能提供下列證據（依任務適用性）：

- 需求來源（user 指示 / issue / PR comment）
- 變更檔案清單與摘要
- 官方文件 / 權威來源引用（Context7 或 Web）
- 測試/建置命令與結果（成功/跳過原因）
- 截圖路徑（若有 UI 驗證）
- commit SHA、PR 編號、merge 結果

## 外部寫作與 SOP 格式基準（2026-02-27 查詢）

本文件格式與寫法吸收以下最佳實踐，並結合 `.example/config/AGENTS.md` 的簡潔風格：

- Google Developer Documentation Style Guide（簡潔、以任務為中心、強制用語一致）: <https://developers.google.com/style>
- Google Documentation Best Practices（結構清晰、維護性、受眾導向）: <https://developers.google.com/style/documentation>
- Microsoft Writing Style Guide（清楚、一致、可掃讀）: <https://learn.microsoft.com/en-us/style-guide/welcome/>
- Diátaxis（區分 how-to / reference / explanation / tutorial）: <https://diataxis.fr/start-here/>
- University of Utah SOP Template Guidance（SOP 欄位結構參考）: <https://campusguides.lib.utah.edu/c.php?g=160840&p=1055382>

## 修訂紀錄（Revision History）

| 日期       | 版本 | 變更摘要                                                                                                                       |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 2026-03-08 | v3.7 | 補充 `002` 格式治理與 incident 規則：新紀錄使用 entry blocks，失敗紀錄必須寫出根因、影響、修復與預防                           |
| 2026-03-08 | v3.6 | 新增「RateWise SEO / Head 問題速解」：FAQPage 範圍、SSR shim 保留原則、head cleanup 與穩定依賴規則                             |
| 2026-03-07 | v3.5 | 新增「Prettier 格式漂移修法」實務模式：prebuild 產出物 .prettierignore 管理規則與反模式說明                                    |
| 2026-03-06 | v3.4 | 新增「security-headers Worker 部署 SOP」：wrangler 認證、esbuild 說明、版本號同步、假陽性清單、CSP connect-src 必要域名        |
| 2026-03-02 | v3.3 | 新增「實務成功模式」章節：版本發布、Dependabot 處理、PR Rebase、SEO 遷移、多步驟任務範本（基於 v2.6.0 發布與安全修復執行歷史） |
| 2026-02-27 | v3.2 | 補充 Cloudflare 邊緣同步規則：release 不得假設 app 發版即等於 edge worker 與 CDN 已同步                                        |
| 2026-02-27 | v3.1 | 升級為企業 SOP / 稽核友善格式：新增文件控制、控制矩陣、例外流程、稽核證據清單與外部格式基準                                    |
| 2026-02-27 | v3.0 | 依 `.example/config` 風格重寫為精簡且對齊 monorepo 實際規則版本                                                                |

---

**最後更新**: 2026-03-08T03:57:10+0800
**版本**: v3.7（補充 002 incident 紀錄規則與格式治理）
