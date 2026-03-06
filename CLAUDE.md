# Claude Code 開發指南

RateWise Monorepo -- Claude / Codex / AI 助手執行手冊（Enterprise SOP / Audit-ready 版）。

## 文件控制（Document Control）

| 欄位       | 內容                                                              |
| ---------- | ----------------------------------------------------------------- |
| 文件名稱   | `CLAUDE.md`                                                       |
| 文件性質   | AI 助手執行手冊 / 協作規範                                        |
| 適用對象   | Claude Code / Codex / 其他在本 repo 執行任務的 AI 助手            |
| 文件狀態   | Active                                                            |
| 文件擁有者 | Repo Maintainer                                                   |
| 生效日期   | 2026-02-27                                                        |
| 審查週期   | 每 90 日或流程重大變更後                                          |
| 下次審查日 | 2026-05-28                                                        |
| 上位文件   | `AGENTS.md`                                                       |
| SSOT 參照  | `package.json`, `.husky/*`, `commitlint.config.cjs`, `.gitignore` |

## Scope

- 本文件定義 AI 助手在本 repo 的執行方式、驗證責任、文件同步責任與稽核證據要求。
- 提交與流程硬規則以 `AGENTS.md` 與 repo 實際設定檔為準；本文件提供操作層執行細節。
- 與使用者互動 **必須**使用繁體中文。

## 寫作與指令風格標準（Authoring Standards）

### 用語等級（避免歧義）

- **必須（MUST）**：不可省略
- **建議（RECOMMENDED）**：原則上遵守；不採用需說明
- **可（MAY）**：視情境選用

### 回覆風格（對齊企業 SOP / 稽核友善）

- 先結論、後細節；避免冗長鋪陳
- 使用可掃讀章節與清單（每點單一動作/規則）
- 針對風險、例外、跳過驗證要明確說明原因
- 引用外部依據時附來源連結或可追溯標記

### 文件編寫風格（用於更新 repo 文件）

- 使用一致術語（同一概念不要多種叫法）
- 程序步驟使用動詞開頭（例如：檢查、執行、驗證、記錄）
- 區分「強制規則」與「建議作法」
- 流程文件優先使用範例命令與具體路徑，避免抽象敘述

## Project Snapshot

### Stack（Monorepo 現況）

- **Package manager**: `pnpm` workspace（`apps/*`）
- **Frontend**: React 19 + TypeScript + Vite 7
- **Routing/SSG**: `react-router-dom` + `vite-react-ssg`（部分 app）
- **Testing**: Vitest + Testing Library + Playwright（部分 app）
- **PWA**: `vite-plugin-pwa` + Workbox（`ratewise` 最完整）
- **Styling**: Tailwind CSS（v3/v4 混合）、Framer Motion（部分 app）

### Apps（快速定位）

- `apps/ratewise`：主站；PWA/SEO/版本 SSOT 影響最大
- `apps/nihonname`：SSG + SEO 導向
- `apps/haotool`：視覺展示與動畫較多
- `apps/quake-school`：教育內容 + SSG
- `apps/park-keeper`：地圖功能（Leaflet）、i18n、Tailwind v4
- `apps/shared`：共用邏輯 / 元件

### Root Commands（常用）

```bash
pnpm install --frozen-lockfile
pnpm dev                     # 預設 @app/ratewise
pnpm build                   # 全 workspace
pnpm build:ratewise
pnpm typecheck               # pnpm -r typecheck
pnpm test                    # pnpm -r test
pnpm test:e2e                # ratewise + nihonname
pnpm lint
pnpm format                  # prettier --check .
pnpm format:fix              # prettier --write .
```

## Execution SOP（AI 助手執行程序）

### Phase 1. 任務受理與界定（Intake）

AI 助手 **必須**：

1. 確認使用者目標、輸出物與限制（是否要 commit / push / merge）
2. 標示假設條件（例如：分支、遠端、測試範圍、可用工具）
3. 確認是否屬高風險變更（CI/CD、部署、版本、PWA、資料遷移）

### Phase 2. 上下文收集（Context Gathering）

- 優先讀最小必要檔案（目標檔 + 相鄰檔）
- 優先用 `rg` / `rg --files` 搜尋
- 變更流程規範時，先讀 `package.json`、`.husky/*`、`commitlint.config.cjs`、`.gitignore`
- 若要 merge 主支，先檢查 `gh auth status`、`gh pr status`

### Phase 3. 依據查證（Evidence-First）

以下情境 **必須**先查官方文件（Context7 或官方網站）：

- build/test/lint 錯誤
- 新 library / framework / 工具導入
- CI/CD 或部署設定變更
- major 版本升級
- 不確定最佳實踐

**建議輸出**：在回報中說明「採用哪個來源、採用了哪些原則」。

### Phase 4. 實作（Execution）

- 採最小必要變更原則，避免跨 app 無關修改
- 文檔重寫任務需先核對 repo 實際設定再落字
- 程式碼變更優先保持可回滾與原子化提交
- 若發現使用者工作樹有未追蹤本地 assets/skills，避免誤刪

### Phase 5. 驗證（Validation）

按變更類型執行：

- **文檔變更**：內容與 SSOT 一致性檢查
- **程式碼變更**：依範圍執行 `pnpm typecheck` / `pnpm test` / `pnpm build:ratewise`
- **UI/QA 變更**：截圖、console errors、必要時 E2E
- **流程/規範變更**：核對 `.husky/*`, `commitlint.config.cjs`, `.gitignore`

### Phase 6. 提交與合併（Commit & Merge）

若使用者要求提交/合併，AI 助手 **必須**：

1. 更新 `docs/dev/002_development_reward_penalty_log.md`
2. 以 commitlint 規則提交（繁中標題、條列 body、`測試：...`）
3. 推送分支並確認 PR 狀態
4. 使用 `gh` 合併 PR 至 `main`（在 checks 通過後）

### Phase 7. 版本發布與依賴管理（Release & Dependencies）

**版本發布流程**（適用於 changesets 管理的專案）：

1. 執行 `pnpm changeset version` 處理待發布變更
2. 驗證版本 SSOT 同步：root `package.json` 與 app `package.json` 版本一致
3. 執行 `pnpm --filter @app/<name> prebuild` 同步公開 API 檔案版本
4. 提交版本更新：`chore(release): <App> v<X.Y.Z>`
5. 推送並確認所有 pre-push 檢查通過

**依賴安全管理**（Dependabot 警告處理）：

1. 查詢開放警告：`gh api repos/<org>/<repo>/dependabot/alerts --jq '.[] | select(.state == "open")'`
2. 檢查 `package.json` 的 `pnpm.overrides` 是否已涵蓋
3. 添加缺失的安全版本 override（格式：`"package@<version-range>": ">=<safe-version>"`）
4. 執行 `pnpm install --no-frozen-lockfile` 套用 override
5. 提交安全修復：`fix(security): 修復 <package> 安全漏洞`

**PR Rebase 與合併**（處理版本衝突）：

1. 檢查 PR 狀態：`gh pr view <NUMBER> --json mergeStateStatus,mergeable`
2. 若 `DIRTY/CONFLICTING`，fetch PR 分支並檢查衝突來源
3. 手動 rebase：`git checkout -b temp-rebase origin/<branch>` → `git rebase origin/main`
4. 解決版本衝突（優先採用 main 分支版本）
5. 強制推送：`git push origin temp-rebase:<branch> --force-with-lease`
6. 等待 CI 通過後使用 `gh pr merge <NUMBER> --squash` 合併

## Git Workflow & Commit Rules（操作摘要）

### Commit Message（SSOT: `commitlint.config.cjs`）

```text
type(scope): 繁體中文標題

- 條列變更 1
- 條列變更 2

測試：xxx
```

### Required Rules（摘要）

- 標題需包含中文
- 主體需存在且第一個非空行以 `- ` 開頭
- 必須包含 `測試：...`
- 禁止常見簡體字
- type 限定：`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`

### Husky Hooks（實際執行內容）

- `commit-msg`: commitlint
- `pre-commit`: `lint-staged` → `typecheck` → `format` → 條件式 SSOT 驗證 → 條件式版本 SSOT 驗證
- `pre-push`: `typecheck` → `test` → `build:ratewise`

### `gh` 合併主支 SOP（標準流程）

```bash
# 1. 檢查認證與 PR 狀態
gh auth status
gh pr status

# 2. 檢視當前分支 PR 狀態（checks / mergeable）
gh pr view --json number,title,headRefName,baseRefName,mergeStateStatus,statusCheckRollup

# 3. 等待 checks 完成後合併（範例用 squash）
gh pr merge <PR_NUMBER> --squash --delete-branch=false
```

**注意**：若 checks pending / failing，應先等待或修復，不應跳過審查控制。

## QA Artifacts & Screenshots（最佳實踐）

### 強制規則

- 截圖 **必須**存放於 `screenshots/`
- QA 圖檔 **不得**放在 repo root（如 `*.png`, `*.jpg`）
- Playwright / Puppeteer MCP **必須**顯式使用 `filename: "screenshots/<name>.png"`
- `screenshots/` 為 QA 暫存目錄，除非任務明確要求，**不得**提交

### 範例

```bash
browser_take_screenshot --filename "screenshots/ratewise-home.png"
```

### 截圖規範定位（索引）

- `CLAUDE.md` → 本章（QA Artifacts & Screenshots）
- `AGENTS.md` → `QA Artifact Rules（截圖與測試產物）`
- `AGENTS.md` → `Root Hygiene（根目錄整潔控制）`

## Root Hygiene（根目錄整潔）

### 常見原因

- `.playwright-mcp/` 大量暫存截圖
- root-level QA 圖檔（通常已被 `.gitignore` 忽略）
- AI 工具目錄（`.agents`, `.claude`, `.cursor`, `.agent`）
- monorepo 共用設定集中於 root（正常）

### 排查方式

```bash
git status --short
git status --ignored --short
ls -la
```

### 清理注意

- 先區分正式資產與本機暫存再刪除
- `.example/` 為參考模板目錄（已忽略），清理通常不會進入 commit
- 不要誤刪未追蹤的 `.agents/skills/*`（本機技能庫）

## Skills Strategy（本地 / 全域）

### 優先順序

1. `.agents/skills/*`（專案本地）
2. `~/.agents/skills/*`（使用者全域）
3. `~/.codex/skills/*`（Codex 全域備援）

### 專案常用 Skills（建議預設納入思考）

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

### 全域補強（按任務啟用）

- `seo-audit`, `audit-website`
- `frontend-design`, `web-design-guidelines`
- `vercel-react-best-practices`
- `leaflet-mapping`
- `security-review`
- `find-skills`

### 使用規則

- 任務明確提到 skill 名稱或明顯符合 skill 描述時，先讀 `SKILL.md`
- 同一任務使用最小必要 skill 集合，避免規則衝突
- skill 不可用時要明確回報，並採次佳方案持續推進

## Documentation Sync Map（文件同步地圖）

- **CI/CD / Hooks / commitlint** 變更 → 更新 `AGENTS.md`、`CLAUDE.md`
- **部署 / Docker / Nginx** 變更 → 更新 `docs/DEPLOYMENT.md` 與相關配置註解
- **安全策略** 變更 → 更新 `SECURITY.md` / `docs/SECURITY_BASELINE.md`
- **架構調整** → 更新 `docs/dev/ARCHITECTURE_BASELINE.md`
- **新長期決策** → 建立 `docs/dev/00X_*.md`

## 稽核證據要求（Audit Evidence Requirements）

結案或回報時，AI 助手 **建議**按任務適用性提供：

- 需求摘要（含限制條件）
- 變更檔案列表與重點
- 外部依據（Context7 / Web 官方文件）
- 驗證結果（執行/未執行與原因）
- 截圖路徑（若有 UI 驗證）
- commit SHA / PR 編號 / merge 結果（若有）

## 例外處理（Deviation Handling）

當無法完整遵守本文件流程（例如工具故障、CI 不可用、緊急修復）時，AI 助手應：

1. 說明偏離原因
2. 說明哪些步驟被略過
3. 評估風險與影響
4. 提供補償控制（例如額外人工檢查）
5. 提出後續補正計畫

## Troubleshooting（常見）

### 1. 文檔 diff 很大但內容改動不多

- `lint-staged` 會對 `*.md` 執行 `prettier --write`
- 表格與長段落常被重排（尤其 `docs/dev/002...`）

### 6. Prettier 格式漂移（prebuild 產出物）

**症狀**：`prettier --check` 每次 pre-commit 報 `api/latest.json`、`openapi.json`、`llms.txt` 格式不一致。

**根本原因**：`JSON.stringify(null, 2)` 總是多行展開；Prettier 依 `printWidth` 決定是否單行。每次 prebuild 重新生成 → 格式漂移。

**正確做法（MUST）**：將 prebuild 產出物加入 `.prettierignore`；**禁止**在 prebuild script 內呼叫 Prettier API。

```
# .prettierignore — Generated files（prebuild 自動產出，非源碼）
apps/ratewise/public/api/latest.json
apps/ratewise/public/openapi.json
apps/ratewise/public/llms.txt
apps/ratewise/public/llms-full.txt
```

**業界依據**：Prettier 官方文件建議用 `.prettierignore` 排除非源碼檔案；Next.js、TypeScript 主流專案均採此做法。

### 2. `git status` 看不到 root 截圖

- 很多 root QA 圖檔已被 `.gitignore` 忽略
- 用 `git status --ignored --short` 才看得出來

### 3. Node engine warning

- Repo 宣告 Node `^24.0.0`
- 是否阻塞以實際 hook / script 結果為準（warning 不一定失敗）

### 4. Cloudflare 邊緣同步

- RateWise release 不只看 app bundle；若正式站標頭由 `security-headers` worker 控制，必須一起確認 worker 是否已部署
- 非互動 `wrangler deploy` 需 `CLOUDFLARE_API_TOKEN` 與 `CLOUDFLARE_ACCOUNT_ID`
- 若 secret 缺失，workflow 應明確 `skip` 並回報，不可把「release 綠燈」等同於「邊緣標頭已同步」

### 5. security-headers Worker 部署 SOP

**目錄**：`security-headers/`，唯一維護對象為 `src/worker.js`

**認證**：wrangler OAuth token 會過期；部署前先確認：

```bash
npx wrangler whoami  # 若失敗改用 CLOUDFLARE_API_TOKEN env var 或 wrangler login
```

**部署**：

```bash
cd security-headers && npx wrangler deploy
```

**版本號**：修改時必須同步 4 處（JSDoc 標題、變更記錄、`__network_probe__` header、主回應 header）

**部署後驗證**（必須用 GET，不能用 HEAD）：

```bash
curl -s --compressed <TARGET_URL> -D - -o /dev/null | grep -i 'x-security-policy-version\|script-src'
# 範例：curl -s --compressed https://app.haotool.org/ratewise/ -D - -o /dev/null | grep -i 'x-security-policy-version\|script-src'
```

**已知假陽性**：

- HEAD 請求 CSP 無 hash — 正確行為（無 body 可計算）
- Playwright 顯示 `ERR_FAILED @ gtag/js` — `--disable-background-networking` 測試環境攔截，非 CSP 問題
- Cloudflare Dashboard 程式碼與本地不同 — wrangler 用 esbuild 編譯，正常現象

**esbuild 說明**：wrangler deploy 自動用 esbuild 打包，Cloudflare 上看到的是編譯輸出（含 `__defProp`、`__name()` 等 helper）— 只維護 `src/worker.js`，不直接編輯 Dashboard。

**ratewise CSP connect-src 必要域名**：`googletagmanager.com`（GA4 配置請求）、`google-analytics.com`、`region1.google-analytics.com`、`analytics.google.com`、`cdn.jsdelivr.net`

## 外部寫作與 SOP 格式基準（2026-02-27 查詢）

本文件格式與寫法結合 `.example/config/CLAUDE.md` 的簡潔風格，並參考：

- Google Developer Documentation Style Guide / Best Practices: <https://developers.google.com/style> / <https://developers.google.com/style/documentation>
- Microsoft Writing Style Guide: <https://learn.microsoft.com/en-us/style-guide/welcome/>
- Diátaxis（文檔類型分工）: <https://diataxis.fr/start-here/>
- University of Utah SOP template guidance（SOP 結構欄位）: <https://campusguides.lib.utah.edu/c.php?g=160840&p=1055382>

## 修訂紀錄（Revision History）

| 日期       | 版本 | 變更摘要                                                                                                                      |
| ---------- | ---- | ----------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-07 | v3.5 | 新增 Troubleshooting #6「Prettier 格式漂移」：prebuild 產出物應加入 `.prettierignore`，禁止 prebuild script 呼叫 Prettier API |
| 2026-03-06 | v3.4 | 新增「security-headers Worker 部署 SOP」：wrangler 認證、esbuild 說明、版本號同步、假陽性清單、CSP connect-src 必要域名       |
| 2026-03-02 | v3.3 | 新增 Phase 7「版本發布與依賴管理」：changesets 流程、Dependabot 警告處理、PR Rebase 操作（基於 v2.6.0 發布執行歷史）          |
| 2026-02-27 | v3.2 | 補充 Cloudflare 邊緣同步規則：release 需同時考慮 app bundle、security-headers worker 與 secret 缺口                           |
| 2026-02-27 | v3.1 | 升級為企業 SOP / 稽核友善執行手冊：新增文件控制、執行程序、稽核證據要求、例外處理與 `gh` 合併 SOP                             |
| 2026-02-27 | v3.0 | 依 `.example/config` 風格重寫並對齊 monorepo 實際規則                                                                         |

---

**最後更新**: 2026-03-07T00:00:00+0800
**版本**: v3.5（新增 Prettier 格式漂移根本修法：.prettierignore 管理 prebuild 產出物）
