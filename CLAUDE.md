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
- `docs/dev/002_development_reward_penalty_log.md` 新增內容一律使用 entry blocks；歷史資料僅整理為精簡索引

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
2. 確認 002 新增紀錄使用 entry blocks；整理舊資料時僅能產出精簡索引，不得再新增巨型 table
3. 確認 002 新條目使用 v2 結構化欄位：至少包含 `id`、`content_type`、`topics`、`keywords`、`related_entries`
4. 若 002 屬 `incident` / `regression`，必須明確寫出根因、影響、修復與預防
5. 以 commitlint 規則提交（繁中標題、條列 body、`測試：...`）
6. 推送分支並確認 PR 狀態
7. 使用 `gh` 合併 PR 至 `main`（在 checks 通過後）

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
- `pre-commit`: `lint-staged`（`eslint --fix --no-warn-ignored` + `prettier --write`）→ `typecheck` → `format` → 條件式 SSOT 驗證 → 條件式版本 SSOT 驗證
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

## SEO 生產資源可用性檢查（SSOT）

- 使用 `node scripts/verify-production-resources.mjs` 驗證所有 app 的 `resources.seoFiles` 與 `resources.images`
- app 清單 **必須**由 `discoverApps()` 自動發現；禁止在腳本或 workflow 硬編碼 app 名稱
- 此腳本只負責 `200 / non200 / timeout` 資源可用性；`verify-all-apps.mjs` 保持 sitemap / robots / llms / 404 等語義驗證
- `SEO Production Validation` workflow 的 `health-check` 應先跑資源可用性檢查，再跑語義檢查
- RateWise 發版後必須額外執行 `VERIFY_PRECACHE_SOURCE=live node scripts/verify-precache-assets.mjs`
- 若 live precache 驗證出現「原 URL 404，但 querystring 後可 200」，應判定為 Cloudflare stale edge 404，先 purge CDN 再視為正式站可用

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

### 7. Search Console 報 `FAQPage` 欄位重複

- 預設只在真正 FAQ 頁輸出 `FAQPage`
- 首頁、幣別頁、About/Guide 若只是 FAQ 文案，保留內容即可，不要再標 `FAQPage`

### 9. `generate-manifest.mjs` 覆蓋品牌名稱（pre-push 回退）

**症狀**：`pnpm build:ratewise` 在 pre-push 時重新執行 `generate-manifest.mjs`，將 `manifest.webmanifest` 的 `name`/`short_name` 覆蓋回舊值（硬編碼）。

**根本原因**：`scripts/generate-manifest.mjs` 內有 hardcoded 品牌名稱字串，未改用 SSOT（constants/config）。

**正確做法（MUST）**：修改 `generate-manifest.mjs`，從 `src/config/app-info.ts`（或等效 SSOT）讀取品牌名稱，不直接 hardcode。

### 10. commitlint body-bullets 失敗

**症狀**：`commit-msg` hook 報 `body-leading-bullet` 錯誤，commit 被阻擋。

**根本原因**：commit 主體的**第一個非空行**未以 `- ` 開頭（例如寫成章節標題、空白行、或其他格式）。

**正確做法（MUST）**：主體第一個非空行必須以 `- ` 開頭（全形條列無效）；每行 ≤100 字元；必須有 `測試：...` 行。

### 11. `sortedCurrencies` 未將 TWD 固定在首位（Multi 頁排序不一致）

**症狀**：多幣別頁（Multi）的貨幣列表不總是以 TWD 為首，且非收藏幣未按字母排序；與收藏頁（Favorites）的 `getAllCurrenciesSorted` 行為不一致。

**根本原因**：`useCurrencyConverter` 的 `sortedCurrencies` 原始邏輯為 `[...orderedFavorites, ...remaining]`，未明確固定 TWD 在首位，也未對非收藏幣排序。

**正確做法（MUST）**：`sortedCurrencies` 必須採用與 `getAllCurrenciesSorted` 完全相同的邏輯：

1. TWD 固定在 index 0
2. 其餘收藏幣按用戶偏好順序
3. 非收藏幣按字母順序

### 8. `SEOHelmet` / head metadata 在 client 端重複或殘留

- `vite-react-ssg` + shim 若已驗證是 SSG 必要條件，**不要**直接移除 shim
- 改在 client 端做 head reconciliation，並為手動寫入的節點加 managed 標記
- `useEffect` 必須有 `cleanup`，依賴只能用穩定 primitive/signature，避免跨頁殘留與同 props 重跑

### 12. PWA 冷啟動 / 離線失效（COEP 阻止 SW precache 寫入）

**症狀**：冷啟動離線白屏；DevTools → Cache Storage → `workbox-precache-v2-…` 僅 5 項（HTML/icons），無 JS/CSS chunk。

**根本原因**：`security-headers` Worker 對 JS/CSS 靜態資源設定 `COEP: require-corp`，Chrome 拒絕 SW 在安裝階段將其寫入 Cache Storage → precache 不完整 → 離線時 JS chunk 找不到 → 白屏。

**正確做法（MUST）**：COEP/COOP 只能設在 HTML document 回應；JS/CSS sub-resource 設 COEP 無意義且有害。

修法 `security-headers/src/worker.js`：

- 將 COEP/COOP 移入 `isRatewise && isHTML` 分支
- 非 HTML 的 ratewise 路徑僅保留 `CORP: same-origin`

**診斷命令**：

```bash
# 確認 JS asset 是否帶 COEP（正確行為：不應有）
curl -sI "https://app.haotool.org/ratewise/assets/<chunk>.js" | grep -i cross-origin
# DevTools 確認：Cache Storage → workbox-precache-v2-… 應 50+ 項
```

### 13. PWA 版本撕裂（非首頁 Load failed）

**症狀**：SW 更新後，非首頁（如 `/ratewise/favorites`）顯示 `Unexpected Application Error! Load failed`。

**根本原因**：`registerType: 'autoUpdate'` 自動呼叫 `skipWaiting()`，新 SW 立即接管；`cleanupOutdatedCaches()` 清除舊 chunk URL；舊頁面 HTML 仍引用舊 URL → chunk 找不到。

**正確做法（MUST）**：改用 `registerType: 'prompt'`，SW 進入 waiting 狀態，由 `UpdatePrompt` 元件發送 `SKIP_WAITING` 訊息後才接管（確保整頁刷新後使用新 chunk URL）。

配套修改：

- `sw.ts`：移除主動 `skipWaiting()`；改在 `message` handler 監聽 `SKIP_WAITING`
- `swUtils.ts`：`forceServiceWorkerUpdate()` 對 waiting SW 發送 `{ type: 'SKIP_WAITING' }`

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

## Cloudflare SEO 直通實踐（CF SEO Straight-Path Patterns）

基於 2026-03 SEO 審核執行歷史提煉，避免重蹈彎路。

### 1. Email 連結 — 永遠用 `MailtoLink`

**問題根源**：CF Email Obfuscation 在邊緣將 `<a href="mailto:...">` 改寫為 `/cdn-cgi/l/email-protection#…`，無 JS 爬蟲存取返回 404，SEO 審核報 broken link。

**直通做法**：

```tsx
// ❌ 絕對不要在 SSG 頁面用 raw mailto
<a href={`mailto:${APP_INFO.email}`}>{APP_INFO.email}</a>;

// ✅ 永遠用 MailtoLink（SSG 無 href → CF 不動，hydration 後注入）
import { MailtoLink } from '../components/MailtoLink';
<MailtoLink email={APP_INFO.email} className="underline" />;
```

影響範圍：所有 SSG 頁面（FAQ、About、Privacy、ErrorBoundary、SkeletonLoader）。

### 2. squirrelscan 使用規則

- **範圍**：掃描整個 `app.haotool.org` 域，分數混入 nihonname / park-keeper / quake-school — ratewise 問題需以 `/ratewise/` 路徑篩選
- **假陽性**：`CSP`、`X-Frame-Options` 警告 = squirrelscan 被 CF 邊緣保護封鎖，無法看到 security-headers Worker 注入的標頭 → **不修，用 `curl` 驗證**
- **驗證優先**：`curl -s --compressed <URL> -D - -o /dev/null | grep -i 'content-security-policy\|x-frame-options'`

### 3. CF Wrangler OAuth vs CF API Token

- `~/Library/Preferences/.wrangler/config/default.toml` 的 token 是 wrangler OAuth token（約 87 字元），**不能**直接用於 CF API v4 Bearer header → 返回 `{"code":10000,"message":"Authentication error"}`
- 要用 CF API：需 `CLOUDFLARE_API_TOKEN` env var 或 `wrangler login` 重新授權
- 查 Zone ID / 設定：`npx wrangler whoami` 確認；部署前先確認登入有效

### 4. noindex 頁面 — 不加入 sitemap（正確行為）

| 頁面                  | 原因                  |
| --------------------- | --------------------- |
| `/ratewise/settings`  | 功能頁，無 SEO 價值   |
| `/ratewise/favorites` | 個人化頁，無 SEO 價值 |
| `/ratewise/multi`     | 功能頁，無 SEO 價值   |

squirrelscan 會將這些報為「not in sitemap」— **這是正確的**，不需修正。

## 程式碼註解風格（繁體中文，簡短正式）

### 原則（MUST）

- 繁體中文撰寫，句末加句號
- 一句話說明「目的」或「設計決策」；禁止翻譯變數名稱或重複敘述程式碼
- 多行說明用連續 `//`，不用 `/* */`
- 段落分隔用空行，不用分隔線

### 範例（以 `sw.ts` 為標準）

```typescript
// 預快取 Vite 產出的靜態資源。
precacheAndRoute(self.__WB_MANIFEST);

// prompt 模式：新 SW 進入 waiting 狀態，由使用者確認後才接管，防止版本撕裂導致 Load failed。
clientsClaim();

// 訊息處理：SKIP_WAITING（prompt 更新流程）/ FORCE_HARD_RESET（緊急清除快取）。
self.addEventListener('message', ...);

// 導覽請求（HTML）：NetworkFirst，2 秒 timeout 後回落快取。
// request.mode === 'navigate' 為 Workbox 官方建議，較 destination === 'document' 更精確。
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ ... }),
);
```

### 反模式（MUST NOT）

```typescript
// ❌ 翻譯程式碼（毫無資訊）
// 呼叫 precacheAndRoute 函數

// ❌ 過長敘述（拆短句或拆段落）
// 這個 setCatchHandler 在導覽失敗時提供離線 fallback，依序嘗試 runtime cache、precache index.html、precache offline.html，並在過程中加入 origin 驗證防止跨域攻擊...

// ✅ 簡短正式
// 離線回退：runtime cache → precache index.html → offline.html。
```

## 外部寫作與 SOP 格式基準（2026-02-27 查詢）

本文件格式與寫法結合 `.example/config/CLAUDE.md` 的簡潔風格，並參考：

- Google Developer Documentation Style Guide / Best Practices: <https://developers.google.com/style> / <https://developers.google.com/style/documentation>
- Microsoft Writing Style Guide: <https://learn.microsoft.com/en-us/style-guide/welcome/>
- Diátaxis（文檔類型分工）: <https://diataxis.fr/start-here/>
- University of Utah SOP template guidance（SOP 結構欄位）: <https://campusguides.lib.utah.edu/c.php?g=160840&p=1055382>

## 修訂紀錄（Revision History）

| 日期       | 版本 | 變更摘要                                                                                                                       |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 2026-03-12 | v4.4 | 新增 RateWise live precache 驗證與 stale edge 404 判定規範，要求生產檢查補跑 live PWA 驗證                                     |
| 2026-03-12 | v4.3 | 新增 SEO 生產資源可用性檢查規範：以 `app.config.mjs` 的 `resources.seoFiles` / `resources.images` 為 SSOT，自動探測並接入 CI   |
| 2026-03-10 | v4.2 | 補充 lint-staged ignored file 治理：`eslint --fix --no-warn-ignored`，避免 e2e / ignored 檔誤擋 pre-commit                     |
| 2026-03-10 | v4.1 | 新增 Troubleshooting #12-13（PWA COEP precache 失敗、版本撕裂 Load failed）與「程式碼註解風格」規範                            |
| 2026-03-09 | v4.0 | 新增 Troubleshooting #9-11：generate-manifest 品牌覆蓋、commitlint body-bullets、sortedCurrencies TWD 未置頂三項常見錯誤與修法 |
| 2026-03-08 | v3.9 | 新增「CF SEO 直通實踐」：MailtoLink 模式、squirrelscan 假陽性識別、CF API token 限制、noindex 頁面正確行為                     |
| 2026-03-08 | v3.8 | 補充 002 v2 結構化索引規格與 FAQ/SEOHelmet Troubleshooting                                                                     |
| 2026-03-08 | v3.7 | 補充 `002` 操作 / incident 規則：新紀錄使用 entry blocks，失敗紀錄必須寫出根因、影響、修復與預防                               |
| 2026-03-08 | v3.6 | 新增 Troubleshooting #7-#8：FAQPage 重複與 `SEOHelmet` client head 重複/殘留的極簡解法                                         |
| 2026-03-07 | v3.5 | 新增 Troubleshooting #6「Prettier 格式漂移」：prebuild 產出物應加入 `.prettierignore`，禁止 prebuild script 呼叫 Prettier API  |
| 2026-03-06 | v3.4 | 新增「security-headers Worker 部署 SOP」：wrangler 認證、esbuild 說明、版本號同步、假陽性清單、CSP connect-src 必要域名        |
| 2026-03-02 | v3.3 | 新增 Phase 7「版本發布與依賴管理」：changesets 流程、Dependabot 警告處理、PR Rebase 操作（基於 v2.6.0 發布執行歷史）           |
| 2026-02-27 | v3.2 | 補充 Cloudflare 邊緣同步規則：release 需同時考慮 app bundle、security-headers worker 與 secret 缺口                            |
| 2026-02-27 | v3.1 | 升級為企業 SOP / 稽核友善執行手冊：新增文件控制、執行程序、稽核證據要求、例外處理與 `gh` 合併 SOP                              |
| 2026-02-27 | v3.0 | 依 `.example/config` 風格重寫並對齊 monorepo 實際規則                                                                          |

---

**最後更新**: 2026-03-12T23:20:00+0800
**版本**: v4.4（新增 live precache 驗證與 stale edge 404 治理規範）
