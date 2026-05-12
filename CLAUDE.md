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
- `docs/dev/002_development_reward_penalty_log.md` 新增內容一律對齊該檔案當前 SSOT 模板；若調整模板，需同 PR 同步更新 002 本體與 SOP 文件

## Project Snapshot

### Stack（Monorepo 現況）

- **Package manager**: `pnpm` workspace（`apps/*`）
- **Frontend**: React 19 + TypeScript + Vite 8.0.10
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
pnpm test                    # workspace tests + root Lighthouse regression tests
pnpm test:e2e                # ratewise + nihonname
pnpm lint
pnpm format                  # prettier --check .
pnpm format:fix              # prettier --write .
```

## Execution SOP（AI 助手執行程序）

| Phase             | 核心動作                                                                            |
| ----------------- | ----------------------------------------------------------------------------------- |
| **1. Intake**     | 確認目標、輸出物、風險等級（commit/push/merge？CI/PWA/版本？）                      |
| **2. Context**    | 讀最小必要檔案；flow 變更先讀 `package.json` / `.husky/*`；合併前 `gh pr status`    |
| **3. Evidence**   | build error / 新工具 / CI 變更 / major 升級 → **先查官方文件**（Context7）          |
| **4. Execution**  | 最小必要變更；禁止跨 app 無關修改；保持可回滾；勿刪未追蹤 `.agents/skills/*`        |
| **5. Validation** | 文檔→SSOT 一致；程式碼→typecheck/test/build:ratewise；UI→截圖+console errors        |
| **6. Commit**     | 更新 `docs/dev/002...`（對齊當前 SSOT 模板 + 分數變化 + 累計總分）→ commitlint 提交 |
| **7. Release**    | 見下方 Phase 7 版本發布流程                                                         |

### 002 格式與獎懲分數 SSOT（對齊 `AGENTS.md`）

- 002 新增內容必須符合 `docs/dev/002_development_reward_penalty_log.md` 當前 SSOT 模板。
- 若調整 002 檔頭版本或條目模板，必須同 PR 同步更新 `AGENTS.md`、`CLAUDE.md` 與 002 本體。
- 當前模板為四行：`日期`、`ID`、`原因`、`解法`。
- 分數計算固定使用：
  - `reward = +1`
  - `penalty = -1`
  - `neutral = 0`
  - `本次分數變化 = reward_count - penalty_count`
  - `最新總分 = 前次總分 + 本次分數變化`
- 每次 commit 前新增 002 紀錄時，必須同步更新「本次分數變化」與「累計總分」。

### Phase 7. 版本發布與依賴管理（Release & Dependencies）

**SemVer 決策**（判斷基準：「不看 GSC / Search Console，使用者會直接感受到這個變更嗎？」）：

| bump      | 判斷標準                                            | 範例                                           |
| --------- | --------------------------------------------------- | ---------------------------------------------- |
| **MAJOR** | 破壞既有 URL / 路由 / 功能，既有書籤/連結失效       | 移除 /usd-twd/ 路由、破壞 PWA 更新流程         |
| **MINOR** | 使用者**直接可感知**的新功能或新頁面                | 新路由、新幣別、新互動 UI、LCP 改善 ≥50%       |
| **PATCH** | 其他一切：bug fix、效能、SEO/schema、文案、內部重構 | JSON-LD 擴充、FAQ 特化、E-E-A-T 信號、樣式微調 |

**bump 類型速查（常見誤判）**：

- `feat` commit ≠ `minor` changeset。commit type 描述「做了什麼」，bump 描述「使用者感受」。
- JSON-LD / schema 新增或擴充 → **patch**（Google 看得到，使用者直接看不到）
- FAQ 內容特化、meta description 優化 → **patch**
- E-E-A-T 信號（schema 層 knowsAbout / author / Organization）→ **patch**
- 幣別頁新增可見 Answer Capsule 文字段落 → **patch**（內容改善，非新功能）
- 新的可導航頁面（新路由，使用者可點擊進入）→ **minor**
- 新幣別（使用者可選擇換算）→ **minor**
- 新互動元件（MoneyBox 比較卡、星評 Modal）→ **minor**
- Core Web Vitals 架構性改善（LCP ↓50%+，SSG 預渲染）→ **minor**

**Changeset 規範**（每個 PR 完成後 MUST 執行 `pnpm changeset`）：

- bump 類型選正確（見上表）；描述使用者**看得到**的影響，禁止描述實作細節
- CHANGELOG 由 changeset 自動生成，禁止手動貼入 git log
- commit 數量不等於升版次數；`.changeset/*.md` 是 release intent，`pnpm changeset:version` 才會消化成版本與 CHANGELOG

**版本發布流程**（`update-release-metadata.js` 已整合所有 SSOT）：

```bash
pnpm changeset:version          # 升版 + CHANGELOG + 所有版本嵌入產出物一次完成
                                # （含 markdown mirrors 更新 + live 市場資料自動 restore）
git diff --stat                 # 確認 CHANGELOG / package.json / public/* 均已更新
git add . && git commit         # chore(release): @app/ratewise vX.Y.Z
git push origin main            # pre-push 自動跑 typecheck + test + build
```

禁止：手動改版號、單獨跑 prebuild scripts、直接改 CHANGELOG 跳過 changeset。

**RateWise generated artifact buckets**：

- `pnpm --filter @app/ratewise refresh:data`：live snapshots
  （`build-time-rates.json`、`seo-rate-examples.ts`、`rating-snapshot.ts`）。
- `pnpm --filter @app/ratewise generate:deterministic`：repo SSOT 可重建產物
  （sitemap、manifest、offline shell、LLMs text、Markdown mirrors、API JSON、OpenAPI）。
- `pnpm --filter @app/ratewise verify:artifacts`：SSOT sync 與 image resource 檢查。
- `prebuild` 只串接上述 buckets；`lighthouse-report.json`、`*.tsbuildinfo` 屬本機工具輸出，必須保持 untracked。

**Release PR 自動化控制**：

- `changesets/action` 的 release commit 必須使用 commitlint 豁免格式：`chore(release): 更新版本套件`
- release workflow 若建立 release PR 失敗，必須讓 workflow 失敗，不得用 `continue-on-error` 將失敗偽裝為 success
- release tag 建立必須使用 `scripts/get-release-metadata.mjs --changed` 的 SSOT 輸出；CI 內禁止直接呼叫 `pnpm changeset tag`
- tag push 必須使用完整 refspec（`refs/tags/<tag>:refs/tags/<tag>`）並設定 timeout，避免模糊 ref 或互動式工具造成 workflow 卡住
- CI 內部 tag push 必須一次推送全部 tag，且明確設定 `HUSKY=0`，避免 tag push 重複觸發 repo pre-push hook
- GitHub release 建立必須先查既有 release；除「已存在」外，不得把 `gh release create` 失敗吞成 warning
- Node 24 workflow 優先使用 `actions/setup-node@v6` 內建 pnpm cache；不要再額外加入 `actions/cache@v4` 造成 Node 20 action warning
- secret scan 使用固定版本 Gitleaks CLI 並驗證 release checksum；組織 repo 不使用需要 license secret 的 `gitleaks/gitleaks-action@v2`
- 若 main 累積 changeset 但版本未變，先查 `gh run view <RUN_ID> --log` 是否卡在 `Create Release Pull Request`
- README 同步規則：公開指令、workflow、部署、版本流程或使用者可見行為變更時，必須更新 root `README.md` 與受影響 app README
- 連續合併一般 PR 與 release PR 時，release PR 前先確認較早 main SHA 的 Zeabur production deployment 已完成；若舊 SHA 在 release SHA 之後 active，會讓正式站版本回退
- `Wait for RateWise production deployment` 失敗時，先查 GitHub deployments 的 active SHA；若 release SHA 被較舊 SHA 覆蓋，以最小 PR 重新觸發最新 main 部署，再重跑 `app-version` 與 live precache 驗證

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

## Git Workflow & Commit Rules

Commit 格式、Husky hooks 規則詳見 `AGENTS.md` § Commit Format / Quality Gates。

### `gh` 合併主支 SOP

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

- 發生 PR / review / checks 事件時，必須先使用 repo 既有 review 稽核腳本（如 `pnpm review:codex:audit`）盤點 review threads，再配合 `gh` 逐條回覆處理證據並標記 `resolved`；不得只改碼不收斂 thread 狀態。
- 發生 issue / backlog 事件時，必須先用 `gh issue list` 盤點現況；新 issue 一律用正式結構（摘要、背景/證據、影響、範圍、驗收標準）並加上 `severity:*` 與對應類型標籤；只有在確認具刪除權限且組織啟用 issue deletion 時，才可用 `gh issue delete` 移除舊 issue，否則改用 `close` 並註明原因。

## SEO 生產資源可用性檢查（SSOT）

- 使用 `node scripts/verify-production-resources.mjs` 驗證所有 app 的 `resources.seoFiles` 與 `resources.images`
- app 清單 **必須**由 `discoverApps()` 自動發現；禁止在腳本或 workflow 硬編碼 app 名稱
- 此腳本只負責 `200 / non200 / timeout` 資源可用性；`verify-all-apps.mjs` 保持 sitemap / robots / llms / 404 等語義驗證
- `SEO Production Validation` workflow 的 `health-check` 應先跑資源可用性檢查，再跑語義檢查
- RateWise 發版後必須額外執行 `VERIFY_PRECACHE_SOURCE=live VERIFY_BASE_URL=https://app.haotool.org/ratewise/ node scripts/verify-precache-assets.mjs`
- 若 live precache 驗證出現「原 URL 404，但 querystring 後可 200」，應判定為 Cloudflare stale edge 404，先 purge CDN 再視為正式站可用
- RateWise release 若涉及正式站資產更新，必須先用 cache-busting probe 確認 `/ratewise/` 的 `app-version` 已切到目標版本，再執行 Cloudflare purge
- RateWise Cloudflare purge 必須使用目標 URL + prefix（至少涵蓋 `/ratewise/`、`sw.js`、`registerSW.js`、`manifest.webmanifest`、`offline.html`、`assets`、`workbox-`、`static-loader-data-manifest`），purge 後立即重跑 live precache 驗證

## SEO 內容新鮮度與真實性（SSOT 規則）

- SEO 文案（title / description / FAQ / JSON-LD）**必須**從 `src/config/seo-metadata.ts` 單一來源產生；禁止分散硬編碼。
- 幣別頁模板不得含其他幣別的專有名詞（例如非 JPY 頁出現「日圓」）；修改模板後必須執行 `pnpm test` 確認 template-bleed 測試通過。
- 技術設定（匯率來源域名、base path、版本號）若變更，**必須**同步更新 `seo-metadata.ts` 內相關 FAQ / JSON-LD 描述，避免 SEO 內容與實際行為不符。
- `buildShareImageJsonLd` 的 `dateModified` 必須使用 `BUILD_TIME`（buildtime 常數），不可寫死日期。
- 新增 FAQ 或 schema 時先確認無重複 `@type`（尤其 `FAQPage`、`BreadcrumbList`）；驗證指令：`grep -r "FAQPage" dist/ | wc -l`。

## SEO 迭代治理 SOP（進階）

- SEO 持續優化任務請同步參照 `docs/dev/036_seo_iterative_execution_protocol.md`，預設至少 20 輪、可選 A/B 對照。
- 每一輪至少紀錄 `seoScore`、`passRate`、`sitemap missingExpectedCount`，未達門檻可觸發回退。
- Lighthouse CI smoke URL 必須由 `APP_CONFIG.lighthouseSmokePaths` 取得，且一律使用 canonical trailing slash；不得在 workflow 或腳本維護第二份非 canonical URL 清單。
- Codex 回饋與 checks 變化請由 `review:codex:once` / `review:codex:watch` 管控，保留 traceability。

## QA Artifacts & Root Hygiene

截圖存 `screenshots/<name>.png`，不得污染 root；詳見 `AGENTS.md` § QA Artifact Rules / Root Hygiene。

## GitHub Actions Node 20 過渡規則

- GitHub Actions 出現 Node 20 deprecation warning 時，先查官方 changelog、release notes 或 `action.yml` 的 `runs.using`。
- 官方 action 優先升到 Node 24 相容 major；目前 `actions/checkout@v6`、`actions/setup-node@v6` 可直接升級。
- 若最新穩定版仍為 `node20`，受影響 job 保留 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'` 作為過渡控制。
- 過渡控制應縮到最小範圍；上游一旦提供 Node 24 版，優先回到直接升版而非長期依賴 force flag。

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

## Troubleshooting

### Git / Commit

**文檔 diff 很大但內容改動不多**：`lint-staged` 對 `*.md` 執行 `prettier --write`，表格與長段落常被重排。

**commitlint body-bullets 失敗**：主體**第一個非空行**必須以 `- ` 開頭；全形條列無效；`#N` issue reference 會使 parser 把 body 置空（改用 `N.` 或 `N,`）；每行 ≤100 字元。

**發版後 `public/*.md` 或 generated 檔案觸發 SSOT 守門失敗**：`pnpm changeset:version` 只更新 api/latest.json 等 SSOT 產出物，不重新生成 markdown mirrors（`public/*.md`）；若這些修改殘留並另行 commit，`verify-version-ssot` 會因新 staged set 缺少 version bump 或 changeset 而擋下。修法：`git restore --staged --worktree apps/ratewise/public/*.md apps/ratewise/src/config/generated/`，讓 CI build 與每日 SEO 排程重新生成。

**本機 build / QA 產物出現在 git status**：`apps/ratewise/lighthouse-report.json` 與 `apps/ratewise/*.tsbuildinfo` 是工具輸出，不是 source。若它們被重新建立，保持 untracked；若意外 staged，執行 `git restore --staged <file>`。

**lint-staged stash/restore 循環復活已 restore 的檔案**：commit 失敗時 lint-staged 會還原其 stash，可能把已 `git restore` 的 working tree 修改重新帶回。修法：每次 commit 失敗後必須重新執行 `git restore --staged --worktree <files>` 再重試，不可假設檔案狀態與 restore 後相同。

### PWA

**冷啟動離線白屏（COEP 阻斷 precache）**：JS/CSS 資源帶 `COEP: require-corp` → SW 無法寫入 Cache Storage → precache 僅 5 項 → 白屏。修法：COEP/COOP 限定 `isRatewise && isHTML` 分支；JS/CSS 只保留 `CORP: same-origin`。診斷：`curl -sI <chunk.js> | grep -i cross-origin`；DevTools precache 應 50+ 項。

**PWA 版本撕裂（非首頁 Load failed）**：`autoUpdate` + `skipWaiting()` → 新 SW 立即接管 → 舊 chunk URL 消失。修法：改 `registerType: 'prompt'`；`sw.ts` 監聽 `SKIP_WAITING` message；`swUtils.ts` 對 `registration.waiting` 發送 `{ type: 'SKIP_WAITING' }`。

### SEO

**Search Console 報 `FAQPage` 重複**：只在真正 FAQ 頁輸出 `FAQPage`；首頁/幣別頁/About 保留文案不標 schema。

**`SEOHelmet` head 在 client 端重複或殘留**：`vite-react-ssg` + shim 勿直接移除；改做 head reconciliation，手動節點加 managed 標記；`useEffect` 必須有 cleanup，依賴用穩定 primitive。

### Build / Deploy

**`generate-manifest.mjs` 覆蓋品牌名稱**：hardcoded 品牌字串被 prebuild 覆蓋。修法：從 `src/config/app-info.ts`（SSOT）讀取，不直接 hardcode。

**`sortedCurrencies` 未將 TWD 置頂**：`useCurrencyConverter` 需與 `getAllCurrenciesSorted` 邏輯一致：TWD index 0 → 收藏幣依序 → 非收藏按字母。

**Node engine warning**：Repo 宣告 `^24.0.0`；warning 不等於阻塞，以實際 hook 結果為準。

**排程資料 workflow 在 post-push refresh 報 GitHub 500**：若 `Commit and push changes` 已成功、失敗發生在 `Refresh ... from remote data branch`，視為 GitHub 瞬時錯誤。修法：post-push refresh 使用 3 次重試並設為 `continue-on-error: true`；summary warning 必須看 `steps.<id>.outcome == 'failure'`，不得用 `conclusion`，否則會把失敗誤判成 success。

**Release workflow 顯示 success 但沒有語意升版**：先查 `.changeset/*.md` 是否仍存在，再查 release run log。若 `Create Release Pull Request` 在 `git commit` 階段被 commitlint 擋下，將 `changesets/action` 的 `commit` / `title` 改為 `chore(release): 更新版本套件`，且失敗回報步驟必須 `exit 1`，避免 release PR 未建立卻顯示綠燈。

**Release workflow 卡在 Create release tags**：取消卡住 run 後檢查是否在 CI 內呼叫 `pnpm changeset tag`，或 tag push 是否觸發 `.husky/pre-push`。修法是移除互動式 changeset tag 呼叫，改由 `scripts/get-release-metadata.mjs --changed` 顯式輸出 package tag 與 app tag，先驗證 `git check-ref-format`，再用完整 refspec 一次推送全部 tag；CI tag push 必須設定 `HUSKY=0` 並為步驟設定 timeout。

**Release workflow 版本已 tag 但正式站未切版**：先用 `gh api repos/haotool/app/deployments` 查 Zeabur production deployment 的 SHA 與 status。若 release SHA 已成功但較舊 SHA 隨後 active，表示 deployment race；以最小 PR 重新觸發最新 main 部署，不要手動改版本號或重跑 `changeset:version`。

**Cloudflare 邊緣同步**：release 需確認 `security-headers` worker 也已部署；`wrangler deploy` 需 `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`；secret 缺失時明確 `skip` 並回報，不可假設 edge 已同步。完整 SOP 見 `AGENTS.md` § security-headers Worker 部署 SOP。

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

## 程式碼註解風格

詳見 `AGENTS.md` § 程式碼註解風格（繁體中文、簡短正式、禁止翻譯程式碼）。

## 修訂紀錄（Revision History）

| 日期       | 版本      | 變更摘要                                                                                                                     |
| ---------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-11 | v5.6      | 補充發版後 generated 殘留修改清理 SOP 與 lint-staged stash 復活問題的治理規則                                                |
| 2026-05-02 | v5.5      | 加入 SEO 迭代治理 SOP 與監控指引，補齊 `docs/dev/036_seo_iterative_execution_protocol.md` 同步點位                           |
| 2026-04-28 | v5.4      | 補充 Zeabur deployment race 診斷與修復規則，避免 release SHA 被較舊 main SHA 覆蓋                                            |
| 2026-04-28 | v5.3      | 修正 release PR 建立失敗被 workflow success 掩蓋的診斷規則，補充 README 同步與 changeset 消化檢查                            |
| 2026-04-24 | v5.2      | 新增 GitHub Actions Node 20 淘汰過渡規則：官方 action 優先升至 Node 24 major，僅對仍停留 Node 20 的 job 保留 force flag      |
| 2026-04-24 | v5.1      | 補充排程資料 workflow 的 post-push refresh 容錯規範：GitHub 瞬時 5xx 需重試、保留 warning，禁止將已成功的 data push 誤判失敗 |
| 2026-04-11 | v5.0      | SemVer 決策規則重寫：加入「使用者可感知」判斷標準，補充常見誤判速查（JSON-LD/schema/FAQ/E-E-A-T 均為 patch）                 |
| 2026-03-22 | v4.9      | 移除 AGENTS.md 重複區塊（Git rules、QA rules、Skills、Prettier#6、Worker SOP、code comment）→ 改為單行參考，精簡約 ~180 行   |
| 2026-03-22 | v4.8      | Phase 7 精簡：SemVer 決策表 + Changeset 規範 + 一鍵發版流程（pnpm changeset:version SSOT 整合）                              |
| 2026-03-22 | v4.7      | 補充 Worker 假陽性清單；新增資產快取驗證 curl 快查表                                                                         |
| 2026-03-17 | v4.6      | 新增 SEO 內容新鮮度 SSOT 規則（template-bleed、dateModified、FAQPage 重複）                                                  |
| 2026-03-13 | v4.5      | 補充 RateWise release 邊緣同步規範與 live precache 驗證 SOP                                                                  |
| 2026-02-27 | v3.0–v4.4 | 建立企業 SOP 執行手冊、CF SEO 直通實踐、PWA 防護、security-headers Worker 部署 SOP 等歷史迭代                                |

---

**最後更新**: 2026-05-02T09:00:00+0800
**版本**: v5.5（納入 SEO 迭代治理與監控 SOP）
