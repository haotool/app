# RateWise Production Governance Design

> **Status (2026-05-12):** Draft for review. This spec defines the governance blueprint only.
> Implementation plans must be written after maintainer approval.

## Goal

把 RateWise 從「功能多、測試多，但仍有明顯產品治理缺口」收斂成可穩定交付的生產級前端產品。第一輪不追求大改版，而是先清掉會破壞交付信任的公開表面、錯誤遮蔽、QA gate、build drift 與架構漂移。

## Current Evidence

- `pnpm --filter @app/ratewise typecheck` 通過。
- `pnpm --filter @app/ratewise lint` 失敗，因 4 個 warning 被 `--max-warnings 0` 擋下。
- 公開路由含內部展示與測試頁：`/theme-showcase`、`/color-scheme`、`/update-prompt-test`、`/ui-showcase`。
- `APP_ONLY_PRERENDER_PATHS` 目前包含所有 app-only paths，導致內部展示/測試頁也進入 prerender set。
- `suppress-hydration-warning.ts` 全域覆寫 `console.error` 並壓制 hydration 類錯誤。
- `main.tsx` 對 `history`、`404`、`Failed to fetch` 的 unhandled rejection 判斷過寬。
- 多個使用者可感知 E2E 被 `skip` / `fixme`，包含多幣別 accessibility、button accessible name、offline indicator 與 trend chart latency。
- Cloudflare production headers/cache 測試預設 skip，僅在 `RUN_PRODUCTION_TESTS=true` 時執行。
- build/prebuild 同時負責抓資料、產 SEO 檔、產 API metadata、產 OpenAPI、抓 rating snapshot；目前工作區已有 generated data drift。
- 幣別 landing page 與 route mapping 大量手寫，長期有 SEO / canonical / schema 漂移風險。

## Design Principles

- 先修交付信任，再修優雅性：lint、公開表面、錯誤可觀測性與 QA gate 優先於架構整理。
- 生產產品不公開內部工具：展示頁、測試頁、設計比較頁不得直接出現在正式路由或 prerender set。
- 不用「吞錯」換取乾淨 console：可預期錯誤要被分類、記錄與測試，不應全域遮蔽整類錯誤。
- QA gate 必須覆蓋使用者可感知功能：離線、無障礙、趨勢圖載入、部署 headers/cache 都是產品行為，不是可永久跳過的測試。
- build 必須可審核：生成檔要區分 deterministic artifact、live data snapshot 與本地暫存。
- 架構收斂只服務明確風險：先資料化路由與幣別頁，避免一次性大重構。

## Workstream 1: Product Surface Governance

### Problem

內部頁面目前存在於 production route table。雖然部分路徑被 robots disallow，但使用者仍可直接訪問，且 prerender path 把內部頁也納入建置輸出。這讓公開產品看起來像仍在開發中的 demo site。

### Target Design

把路由分成三類：

- Public indexable routes：首頁、內容頁、幣別 landing pages、合法的金額 landing pages。
- Public noindex app routes：`/multi/`、`/favorites/`、`/settings/`，這些是使用者功能頁，可訪問但不索引。
- Internal-only routes：`/theme-showcase/`、`/color-scheme/`、`/update-prompt-test/`、`/ui-showcase/`，正式 build 不註冊、不 prerender、不出現在 known route set。

Internal-only routes 的保留方式：

- 開發環境可用，方便設計與 PWA prompt 驗證。
- production build 預設不可訪問，直接落到 404。
- 若未來需要 staging preview，可用明確 env flag 開啟，例如 `VITE_ENABLE_INTERNAL_ROUTES=true`，但 production env 不設定。

### Acceptance Criteria

- Production route table 不含 internal-only routes。
- `PRERENDER_PATHS` 不含 internal-only routes。
- robots/sitemap/known route tests 驗證 internal-only routes 不在公開 surface。
- 開發模式仍可選擇性開啟內部工具，不影響設計工作。

## Workstream 2: Error Observability And Hydration Policy

### Problem

目前全域 suppression 讓 hydration mismatch、部分 unhandled rejection 與 fetch failure 變得不可見。這能讓 console 看起來乾淨，但會讓真正的 UI mismatch、資料 API 故障或 chunk 問題更難被發現。

### Target Design

建立明確錯誤分類：

- Hydration mismatch：只允許針對已知、可證明無害的位置用局部 `suppressHydrationWarning` 或修正 SSR/client data source。
- Chunk load failure：維持現有 recovery，但要記錄 diagnostic event，且測試它不吞一般 fetch error。
- Historical rate missing：只在錯誤來源可驗證為 history endpoint 且 HTTP status 符合預期時分類為 expected。
- Generic fetch failure：不可被 `Failed to fetch` 字串直接吞掉，必須記錄為 warn/error。

`suppress-hydration-warning.ts` 的目標狀態：

- 移除全域 `console.error` 覆寫，或縮到只在 test/dev diagnostic mode 啟用。
- production 不阻止 hydration error 上報。
- 對已知 mismatch 改由元件層處理，例如 footer 年份、build time、使用者 locale。

### Acceptance Criteria

- 沒有 production-only 全域 `console.error` monkey patch。
- `unhandledrejection` 測試覆蓋 chunk error、history 404、generic fetch failure 三類。
- Generic `Failed to fetch` 不會被分類成 expected historical data error。
- Sentry/diagnostics 能接到真正未處理錯誤，不被全域 suppression 攔截。

## Workstream 3: QA Gates And Release Confidence

### Problem

目前 unit 覆蓋很多，但數個產品級 E2E 被 skip/fixme。這表示 CI 綠燈不等於使用者關鍵體驗可靠。

### Target Design

把 QA gate 分三層：

- Fast local gate：`typecheck`、`lint`、核心 Vitest、受影響檔案 tests。
- PR gate：RateWise build、核心 E2E smoke、accessibility smoke、PWA app shell smoke。
- Scheduled / release gate：live production headers/cache、offline PWA full scenario、Lighthouse smoke、squirrel live audit。

Skip/fixme 治理規則：

- 任何 `test.skip` / `test.fixme` 必須有 issue 或 plan task 對應。
- 使用者可感知功能不得永久 skip；若 CI 不穩，改成隔離 project、穩定 fixture 或 scheduled gate。
- Accessibility 測試不能只 `console.warn`，核心規則要有 assertion。

### Acceptance Criteria

- `pnpm --filter @app/ratewise lint` 通過且 README 指標可信。
- 多幣別 accessibility 不再是 untracked `fixme`。
- Button accessible name 測試不是永久 skip；若規則過嚴，改成符合 WCAG 的 scoped assertion。
- Offline indicator 至少有一條可跑的 E2E 或 component+browser integration gate。
- Trend chart latency 有明確 performance budget test；若只適合 nightly，納入 scheduled gate。
- Production headers/cache 測試有 release 或 scheduled workflow 執行，不只靠手動 env。

## Workstream 4: Build Reproducibility And Artifact Hygiene

### Problem

`prebuild` 責任過重，混合 deterministic generation、live data fetch、SEO mirror、OpenAPI 與 rating snapshot。這讓 build 結果容易跟網路狀態、時間與資料源綁在一起，也讓 generated drift 常態化。

### Target Design

把產物分成三類：

- Deterministic generated artifacts：manifest、offline HTML、llms text、markdown mirrors、OpenAPI、API metadata。這些應可由 repo SSOT 穩定重建。
- Live data snapshots：build-time rates、SEO rate examples、rating snapshot。這些允許漂移，但必須有明確 refresh command 與 commit policy。
- Local QA artifacts：dist、coverage、playwright-report、test-results、lighthouse reports、squirrel output。這些不應進入 source tracking。

Build command 分層：

- `prebuild` 只做 production build 必要的 deterministic steps。
- `refresh:data` 或既有 schedule scripts 負責 live data snapshots。
- `verify:artifacts` 檢查 deterministic generated artifacts 是否同步。
- Release flow 明確說明哪些 generated drift 應 commit、哪些應 restore。

### Acceptance Criteria

- generated data drift 有明確來源與處理規則。
- `prebuild` 不因可選外部 API 失敗造成不可預期 diff。
- repo 不追蹤新的 local QA artifacts。
- 已追蹤但不該追蹤的 historical artifacts 有清理 plan，例如 `lighthouse-report.json`、`tsconfig*.tsbuildinfo`。
- README / AGENTS / CLAUDE 對 build 與 generated artifact policy 一致。

## Workstream 5: Architecture Convergence

### Problem

幣別 landing pages、route records、SEO paths 與 amount paths 目前有大量手寫展開。這在小規模時可接受，但現在有 34 個幣別方向頁與大量金額路由，長期容易造成新增幣別時漏改頁面、sitemap、prerender、canonical 或 JSON-LD。

### Target Design

建立幣別頁 route registry 作為單一來源：

- `currencyLandingRouteRegistry` 描述方向、from/to currency、page component import、entry path、canonical base path、indexable amounts。
- `routes.tsx` 從 registry 生成 currency landing routes。
- `seo-paths.ts` 從同一份 registry 或 shared config 產生 currency SEO paths 與 amount paths。
- 單一 `CurrencyLandingPage` 承接大多數頁面內容；個別幣別只保留必要 copy override。

收斂順序：

- 第一階段只新增 registry 與 tests，不一次刪完所有頁面檔。
- 第二階段把重複 route/path 生成改成 registry-driven。
- 第三階段再評估是否移除 34 個 thin wrapper page files。

### Acceptance Criteria

- 新增幣別方向時只需改 registry 與必要文案，不需手動同步 3 到 5 個清單。
- `routes.tsx` 不再手寫所有 `createLazyRoute('/xxx-twd')` 與 `:amount` 變體。
- SEO path tests 保證 sitemap、prerender、known routes 與 route registry 一致。
- 不改變既有 canonical URLs。

## Rollout Strategy

Phase 0：Baseline cleanup。

- 修復現有 lint warnings。
- 記錄並確認目前 generated drift 的處理方式。
- 不改行為，只取得可交付 baseline。

Phase 1：公開表面收斂。

- 移除 production internal routes。
- 調整 `APP_ONLY_PATHS` / `PRERENDER_PATHS`。
- 補 route surface tests。

Phase 2：錯誤可觀測性。

- 收斂 hydration suppression。
- 精準化 unhandled rejection 分類。
- 補 diagnostics tests。

Phase 3：QA gate 補強。

- 處理 skip/fixme。
- 將 live production tests 放入 scheduled 或 release gate。
- 補 accessibility/offline/trend chart 可靠 gate。

Phase 4：build artifact 治理。

- 拆分 deterministic generation 與 live data refresh。
- 清理 historical artifacts。
- 同步 README / AGENTS / CLAUDE。

Phase 5：架構收斂。

- 建立 currency landing route registry。
- route 與 SEO paths 逐步改為 registry-driven。
- 視風險決定是否移除 thin wrapper page files。

## Non-Goals

- 不在第一輪重新設計 UI。
- 不在第一輪改品牌、網域或資料來源策略。
- 不在第一輪重寫 PWA/service worker 架構。
- 不在第一輪引入新 framework。
- 不為了架構漂亮而改動所有幣別頁文案。
- 不在未確認 release policy 前刪除任何使用者可見公開 SEO URL。

## Verification Matrix

| Workstream               | Required Verification                                                               |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Product surface          | route tests、sitemap/prerender tests、production build smoke                        |
| Error observability      | Vitest for error classification、browser console smoke、diagnostic event assertions |
| QA gates                 | lint、typecheck、targeted Vitest、targeted Playwright、scheduled live tests         |
| Build reproducibility    | artifact sync tests、git status after build、generated drift policy check           |
| Architecture convergence | registry consistency tests、canonical URL snapshot tests、route generation tests    |

## Documentation Updates

以下變更需要同步文件：

- 公開路由與 internal route policy：`README.md`、`AGENTS.md`、`CLAUDE.md`。
- QA gate 或 CI workflow 變更：`AGENTS.md`、`CLAUDE.md`、相關 workflow 註解。
- generated artifact policy：`README.md`、`AGENTS.md`、`CLAUDE.md`。
- 長期架構決策：本 spec 與後續 implementation plan。

## Open Decision For Maintainer

建議採用此順序：Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5。

理由是 Phase 0/1/2 直接影響交付可信度與公開產品面，風險最低、收益最高；Phase 5 屬長期維護收益，應等品質 gate 穩定後再做。
