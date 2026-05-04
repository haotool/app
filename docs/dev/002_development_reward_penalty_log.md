# 開發獎懲與決策記錄（超短版）

> 版本：outline-v2-ultra
> 原則：每筆只保留日期、ID、原因、解法。

## 新增模板（4 行）

- 日期：YYYY-MM-DD
- ID：<唯一識別>
- 原因：<一句話 root cause>
- 解法：<一句話修正>

## 條目（新→舊）

- 日期：2026-05-05
- ID：ratewise-production-lighthouse-baseline-pr4
- 原因：缺少 production LCP/INP/CLS/Lighthouse baseline 觀測，無法第一時間偵測 trend 與 PWA 回歸。
- 解法：建立 `scripts/lighthouse-production.mjs`、baseline workflow、summary 回報文件與 baseline JSON，並把 PR4 指標門檻收斂為可自動回報機制。

- 日期：2026-05-04
- ID：ratewise-authority-guide-mirror-production-verification
- 原因：3 篇 Authority Guide Markdown mirrors 已存在於 public 與 `llms.txt`，但未被納入 `SEO_FILES` 與正式 production verification，且 Worker / `_headers` 的 alternate Link 治理也未完全覆蓋，形成真實監測缺口。
- 解法：將 3 篇 Authority Guide mirrors 納入 `SEO_FILES` SSOT，補齊 Worker 與 `_headers` 的 Markdown alternate Link 覆蓋，並以 seo-paths / securityHeaders / markdown mirror 測試與 SSOT 驗證收斂為正式閉環。

- 日期：2026-05-04
- ID：issue-backlog-contract-rule-sync
- 原因：repo 先前雖要求 review thread 收斂，但對 issue / backlog 的格式、嚴重度標籤與刪除條件仍缺乏正式契約條款，容易導致未來 agent 使用不一致格式。
- 解法：在 `AGENTS.md` 與 `CLAUDE.md` 補入 issue / backlog 契約規則，強制使用正式 issue 結構、`severity:*` 標籤與 `gh` 刪除前置條件。

- 日期：2026-05-04
- ID：seo-master-ssot-prettier-format-followup
- 原因：`#340` 的 Quality Checks 因 `docs/SEO_MASTER_SSOT.md` 未完全符合 Prettier 格式而失敗，導致文檔 PR 卡在格式守門。
- 解法：以 repo 既有 Prettier 規則重寫 `SEO_MASTER_SSOT.md`，再推送最小 follow-up commit 讓 CI 回到綠燈。

- 日期：2026-05-04
- ID：seo-master-ssot-2026-05-03-state-sync
- 原因：`SEO_MASTER_SSOT` 雖已更新版本與里程碑，但 `SEO_FILES`、生產驗證覆蓋與 Authority Guide mirror 探針說明仍殘留舊敘述，未完全對齊目前程式 SSOT。
- 解法：同步修正文檔版本、公開 SEO/AI 資源清單、手動 smoke probe 範圍與歷史完成項描述，使文件與 `seo-paths.config.mjs`、近期 PR 狀態與 SEO 治理現況一致。

- 日期：2026-05-03
- ID：ratewise-authority-guide-markdown-mirror-and-article-og
- 原因：authority guide 頁面缺少對應 Markdown mirrors 與 llms.txt 收錄，且多個具 Article JSON-LD 的內容頁仍沿用 `og:type=website`，降低分享與 AI 引用語義一致性。
- 解法：擴充 Markdown mirror 生成器輸出 3 個 authority guide `.md`、同步加入 llms.txt 與回歸測試，並讓 authority/content pages 對齊 `ogType=\"article\"` 與 `article:modified_time`。

- 日期：2026-05-03
- ID：codex-review-audit-unknown-author-guard
- 原因：PR #330 後續 Codex review 指出 `author: null` 的留言會先被轉成字串，再被誤判為人類回覆，讓 `no-reply` 分類失真。
- 解法：將未知作者保留為 `null`，並要求 comment 必須有明確 login 才能算人類回覆，避免刪帳或停用帳號留言清掉待處理 thread。

- 日期：2026-05-03
- ID：codex-review-audit-thread-classification-followup
- 原因：PR #330 的 Codex review 指出新稽核腳本將 bot 視為人類回覆、僅看第一則 Codex 評論判定 no-reply，且未補抓超過 100 筆的 thread comments。
- 解法：補上 thread comments 分頁抓取，將 no-reply 基準改為最後一則 Codex 評論，並排除 `github-actions` 與 `[bot]` 類非人類回覆。

- 日期：2026-05-03
- ID：pr-review-script-enforcement-doc-sync
- 原因：PR / review 事件的回覆與 resolved 收斂責任先前只分散在口頭流程，未明確要求優先使用 repo 既有稽核腳本盤點 threads。
- 解法：在 `AGENTS.md` 與 `CLAUDE.md` 補上強制規則，要求先執行 `pnpm review:codex:audit` 類腳本盤點，再配合 `gh` 逐條回覆並轉為 resolved。

- 日期：2026-05-03
- ID：repo-codex-review-thread-audit-automation
- 原因：既有 Codex review 腳本只覆蓋單 PR 或近幾天留言，無法對整個 repo 穩定盤點 unresolved / no-reply review threads。
- 解法：新增全 repo GraphQL 分頁稽核腳本與 `pnpm review:codex:audit` 入口，自動依 thread 狀態與人類回覆情況分類，並輸出可供後續自動回覆與清掃流程重用的文字/JSON 結果。

- 日期：2026-05-02
- ID：ratewise-homepage-lcp-build-time-rates
- 原因：首頁首屏仍同步觸發趨勢圖歷史資料、GA 與 PWA icon 暖機，Lighthouse Performance 停在 73-74 且 LCP 超過 7 秒。
- 解法：以 build-time rates 移除首屏匯率空窗，延後非關鍵趨勢圖/分析/PWA 暖機，A/B 後 Performance 80、SEO 100。

- 日期：2026-05-02
- ID：ratewise-prerender-dist-stale-rebuild-guard
- 原因：SEO public surface 測試只檢查 `dist` 是否存在，rebase 後會沿用過期 HTML，讓 `/seo-tech/` 對外揭露頁被舊快照誤判為 SSOT 漂移。
- 解法：讓 `ensurePrerenderDist` 支援 source freshness 檢查，當監看檔案比 `dist` 新時自動重建 prerender 產物，再由 `seo-public-surface.test.ts` 明確宣告監看路徑。

- 日期：2026-05-02
- ID：ratewise-footer-time-slot-cls-2026-05-02
- 原因：`#320` 雖已移除 SEO layout skeleton，但 Footer 更新時間仍會在 hydration 後以不同字寬文字替換，導致 `/about` Lighthouse 保持 0.89。
- 解法：將 Footer 的來源時間與刷新時間改為固定寬度等寬數字槽位，消除 hydration 後的殘餘版面位移並補上回歸測試。

- 日期：2026-05-02
- ID：root-robots-content-signal-production-drift
- 原因：正式站 root `robots.txt` 上游仍殘留非標準 `Content-Signal`，Lighthouse 將三個 RateWise canonical URL 的 SEO 扣到 92。
- 解法：讓 security-headers Worker v5.1 在 root robots rewrite 時清洗 `Content-Signal` body 行，並以 regression test 守門。

- 日期：2026-05-02
- ID：ratewise-lhci-canonical-smoke-paths
- 原因：Lighthouse CI 掃描 `/about` 無尾斜線 URL，本地 preview 先回首頁 app shell，造成 hydration 後 CLS 誤判。
- 解法：將 LHCI smoke paths 收斂到 `APP_CONFIG.lighthouseSmokePaths`，統一掃描 canonical trailing slash URL。

- 日期：2026-05-02
- ID：ratewise-sitemap-lastmod-section-policy
- 原因：`seo-metadata.ts` 大型 SSOT 被整檔納入 lastmod 依賴，導致 sitemap 日期多樣性退化到 2。
- 解法：改由 lastmod policy 宣告頁面對應 metadata 區段，讓 sitemap 只追蹤真正影響該頁的內容段落。

- 日期：2026-05-02
- ID：ratewise-ssg-serial-prerender-enoent-fix
- 原因：`vite-react-ssg` 高並行渲染巢狀金額頁時，pre-push build 偶發讀取尚未寫出的 `index.html`。
- 解法：將 SSG prerender concurrency 收斂為 1，優先確保 CI / pre-push 產物可重現，再由測試與 build 守門。

- 日期：2026-05-02
- ID：pr322-about-dataset-schema-disclosure
- 原因：About FAQ、`/seo-tech/` registry、Open Data Markdown 與 sitemap 測試仍有公開 SEO truth surface 漂移。
- 解法：補齊 `Dataset` registry、移除 schema/URL 硬編碼、同步 2026 sitemap 名稱，並讓 Open Data mirror 揭露使用限制與授權。

- 日期：2026-05-02
- ID：ratewise-seo-dist-test-helper-2026-05-02
- 原因：Codex review 指出 `describe.skipIf` 在 Vitest collection 階段計算，乾淨 checkout 會讓 SEO 靜態 HTML regression gate 被永久略過。
- 解法：抽出 `ensurePrerenderDist` 測試 helper，在缺少 `dist` 時以 lock 保護的單次 build 準備產物，三組 SEO gate 繼續完整執行。

- 日期：2026-05-02
- ID：ratewise-seo-layout-hydration-cls-2026-05-02
- 原因：SEO/SSG layout 在瀏覽器端以 Suspense skeleton 包住已預渲染內容，且 PWA offline-ready 成功提示會在 Lighthouse 首次載入時入場，造成 FAQ CLS 0.19、Performance 89。
- 解法：SEO layout 直接保留 children，並讓低優先級 offline-ready 狀態靜默化；只保留更新/失敗等需使用者注意的提示。

- 日期：2026-05-02
- ID：ratewise-dist-dependent-tests-order-race-2026-05-02
- 原因：部分 SEO / SSG 測試在 coverage 階段直接要求 `dist` 已存在，與 `prerender.test.ts` 的 build 副作用形成平行測試順序耦合。
- 解法：改由共用 build helper 在缺少 `dist` 時準備 SSG 產物，避免測試順序與 coverage pipeline 繼續耦合。

- 日期：2026-05-02
- ID：ratewise-trend-date-refresh-stale-2026-05-02
- 原因：趨勢圖在 #310 後改為頁面空閒即載入一次，長時間開啟的分頁跨日時不會重新查詢歷史匯率，可能停在 2026-04-28。
- 解法：分頁 focus / visibility 回前景時檢查本地日期 key，跨日即重新載入趨勢資料，並新增 regression test。

- 日期：2026-05-02
- ID：pr317-superpowers-review-format-and-seo-signal-fix
- 原因：Superpowers 分支 review 發現本 PR 新增 002 條目混入非四行欄位，且 SEO Master GSC 指標仍殘留幣別頁 FAQPage 舊語意。
- 解法：將新增 002 條目收斂回四行模板，並把 Rich Results / AI 摘要指標改為 FAQ 主頁 FAQPage 與幣別頁 ExchangeRateSpecification。

- 日期：2026-05-02
- ID：ratewise-superpowers-seo-ssot-drift-2026-05-02
- 原因：Superpowers 多 agent SEO 審查發現 production SEO 驗證腳本、匯率方向文案、AI crawler 說明與公開 E-E-A-T 信任揭露存在漂移。
- 解法：對齊 FAQPage only / ExchangeRateSpecification schema 策略、修正買外幣語意與 Googlebot / Google-Extended 角色，並以 truthfulness、SSOT、build-script regression tests 守門。

- 日期：2026-05-02
- ID：ratewise-lcp-deferred-vendors-motion-dnd
- 原因：vendor-motion（138KB）與 vendor-dnd（95KB）因 CJS factory rolldown 置入首個使用者 chunk，被 vendor-router-runtime / app chunk 靜態依賴，拖入初始 modulepreload 阻塞首次 LCP。
- 解法：manualChunks 將 react-dom 主命名空間與 jsx-runtime CJS factory 前置至 vendor-commons，搭配 resolve.dedupe 切斷靜態依賴鏈，兩個重量 vendor 改為按需延遲載入（初始減約 60KB brotli）。

- 日期：2026-05-02
- ID：ratewise-seo-rate-example-taipei-date-2026-05-02
- 原因：`update-seo-rate-examples.mjs` 使用 UTC 日期產生 `SEO_RATE_EXAMPLES_DATE`，台北午夜後會讓匯率時間與 SEO 可見日期落差一天。
- 解法：改用 `Intl.DateTimeFormat` 的 `Asia/Taipei` 日期作為 SEO 匯率範例、MoneyBox `rateDate` 與產生檔日期，並新增 build script regression test。

- 日期：2026-04-30
- ID：pr303-seo-ssot-rerun-and-audit-trace-2026-04-30
- 原因：`docs/SEO_MASTER_SSOT.md` 連續多次提交未同步新增 002 條目，違反 `AGENTS.md` 的 AGT-LOG-01「每次 commit 前更新 002」要求。
- 解法：依 PR303 Codex review（P1）補齊 `docs/dev/002_development_reward_penalty_log.md` 的稽核證據鏈，並同步執行 ratewise SEO 例行重跑，將結果更新到 `docs/SEO_MASTER_SSOT.md` v2.7.1（新增 12.7.8 狀態快照）。

- 日期：2026-04-30
- ID：pr303-seo-rate-examples-refresh-2026-04-30
- 原因：`prebuild-fetch-rates` 與 `update-seo-rate-examples` 依即時資料重建輸出，推送後仍產生未提交 diff。
- 解法：pre-push 的 `build:ratewise` 重新抓取即時匯率後，`seo-rate-examples.ts` 產生時間戳與範例值更新；本次補提交該 generated 漂移，確保 PR head 與可重現輸出一致。

- 日期：2026-04-28
- ID：ratewise-225-zeabur-deployment-race
- 原因：一般 PR #298 與 release PR #299 連續合併，Zeabur 對兩個 main SHA 建立 production deployment。
- 解法：使用 GitHub deployments API 查出 Zeabur production deployment active SHA 順序。

- 日期：2026-04-28
- ID：dependabot-moderate-fast-xml-parser
- 原因：既有 override 只要求 `fast-xml-parser >=5.5.7`，低於 GHSA-gh4j-gqv2-49f6 / CVE-2026-41650 的 patched 版本 5.7.0。
- 解法：更新 root `package.json` 的 `pnpm.overrides.fast-xml-parser` 到 `>=5.7.0`。

- 日期：2026-04-28
- ID：ci-gitleaks-cli-node24
- 原因：`gitleaks/gitleaks-action@v2` 對組織 repo 需要 `GITLEAKS_LICENSE`，repo secrets 未設定時會在 CI annotation 留下 license 問題。
- 解法：將 `.github/workflows/ci.yml` 的 `Run Gitleaks` 從 `gitleaks/gitleaks-action@v2` 改為固定版本 `gitleaks` CLI。

- 日期：2026-04-28
- ID：release-tag-timeout-ssot
- 原因：`pnpm changeset tag` 適合人工 release 流程，不適合在此 repo 的多 app release workflow 內當作 tag SSOT。
- 解法：移除 `.github/workflows/release.yml` 內冗餘的 `actions/cache@v4` pnpm store cache，保留 `actions/setup-node@v6` 內建 cache。

- 日期：2026-04-28
- ID：release-pr-commitlint-masked-success
- 原因：release workflow 的 changesets/action commit message 未對齊 `commitlint.config.cjs` 的繁體中文與 body 規則，也未命中既有 release 豁免。
- 解法：將 `.github/workflows/release.yml` 的 release commit / title 改為 `chore(release): 更新版本套件`。

- 日期：2026-04-27
- ID：ratewise-review-thread-replace-html-regex-with-domparser
- 原因：先前做法依賴 regex 移除 `script/style`，對非標準但解析器可容忍的 HTML 變體天然脆弱。
- 解法：在補完 `</script >` 後，GitHub Advanced Security 再指出 regex 仍可能漏掉 `</script\\t\\n bar>` 這類更鬆散的 closing tag 變體。這表示以 regex 維護 HTML 可見文字抽取會持續被邊界案例追著跑。本次直接將 `extractVisibleText()` 改為以 `DOMParser` 解析 HTML，移除 `script/style` 節點後讀取 `textContent`，把這條測試邏輯收斂到結構化解析，而不是再疊更多字串規則。

- 日期：2026-04-27
- ID：ratewise-review-thread-fix-script-end-tag-whitespace
- 原因：closing tag regex 只接受緊貼的 `</script>` / `</style>`，未容忍 HTML 容錯常見的尾端空白。
- 解法：在 follow-up PR #286 上，GitHub Advanced Security 再指出 `seo-public-surface.test.ts` 的 HTML 過濾仍未涵蓋 `</script >` 與 `</style >` 這類結尾標籤尾端帶空白的情況。這次將 regex 從精確匹配 `</script>` / `</style>`，收斂為允許 `\\s*` 後再閉合 `>`，讓 visible-text 抽取對鬆散 HTML 更具韌性，避免 CodeQL 持續報告相同類型缺口。

- 日期：2026-04-27
- ID：ratewise-review-thread-fixes-cwd-and-html-regex
- 原因：HTML 過濾使用區分大小寫的 regex，未覆蓋大寫標籤輸入。
- 解法：針對 PR #285 的兩條未解 review thread 做原子修補。第一條來自 GitHub Advanced Security，指出 `seo-public-surface.test.ts` 的 HTML 過濾 regex 未涵蓋大寫 `<SCRIPT>` / `<STYLE>`；第二條來自 Codex review，指出 `seo-lastmod-policy.test.ts` 以 `process.cwd()` 推 repo root，從 monorepo root 或 IDE runner 執行時會產生 CWD 敏感的 `ENOENT`。本次分別改為大小寫不敏感 regex 與 `import.meta.url` 路徑推導，並以對應測試確認修補成立。

- 日期：2026-04-27
- ID：ratewise-lastmod-fallback-test-precedence
- 原因：`generate-sitemap-2025.mjs` 的 `getRatePageFallbackDate()` 先讀 `匯率時間`，再讀 `生成日期`。
- 解法：第一輪把硬編日期改為 `SEO_RATE_EXAMPLES_DATE` 後，進一步驗證時發現 sitemap generator 的真實規則不是直接使用生成日期，而是優先解析 `seo-rate-examples.ts` 檔頭內的「匯率時間」，只有抓不到時才退回 `SEO_RATE_EXAMPLES_DATE`。本次將測試同步升級為驗證這個優先序，確保測試對齊 generator 的實際 fallback 邏輯，而不是對齊某個較弱的近似值。

- 日期：2026-04-27
- ID：ratewise-seo-public-surface-suite
- 原因：現有 SEO 測試分散在 route order、schema、truthfulness、best-practices 等檔案，沒有一個集中入口對公開表面做快速回歸。
- 解法：雖然 P0 的修復已分散在多支測試中，但缺少一個能直接回答「公開 SEO 表面現在還乾不乾淨」的單一 regression suite。本次新增 `seo-public-surface.test.ts`，集中驗證 route 專屬 H1 是否早於 fallback、`/seo-tech/` 是否仍對齊當前 SSOT、以及 sitemap 是否重新長回 `priority` / `changefreq`。同步新增 `test:seo-surface` script，讓這組公開表面檢查可被單獨執行。

- 日期：2026-04-27
- ID：ratewise-lastmod-fallback-test-ssot-alignment
- 原因：`seo-lastmod-policy.test.ts` 將匯率頁 fallback 日期寫死在單一日期字串，沒有依附 `seo-rate-examples.ts` 的生成值。
- 解法：驗證 RateWise SEO 修復是否真正完成時，發現 `seo-lastmod-policy.test.ts` 仍將匯率頁 fallback 日期硬寫為 `2026-04-25`，但目前 `seo-rate-examples.ts` 已由 build 生成為 `2026-04-27`，導致 policy 與可驗證資料來源正確、測試卻誤報失敗。本次改為直接引用 `SEO_RATE_EXAMPLES_DATE`，讓測試跟隨 SSOT 的匯率日期來源，而不是跟隨某一次人工快照。

- 日期：2026-04-27
- ID：cicd-security-scan-lastmod-fallback-fix
- 原因：`Security Scan` 的 Docker build context 受 `.dockerignore` 控制，不保證攜帶可用的 git 歷史。
- 解法：最近 `main` 上多個 CI run 不是壞在 Trivy 本身，而是 `Security Scan` 先用 root `Dockerfile` 建 image 時，容器內缺少完整 git 歷史，讓 `generate-sitemap-2025.mjs` 對 rate pages 退回到不具語義的單日時間戳，最後被 `lastmod` 多樣性 gate 擋下。本次改為在 git commit 日期不可得時，優先使用 content policy fallback 與 `seo-rate-examples.ts` 內可驗證的匯率日期，避免安全掃描因 SEO 驗證前置條件不足而誤 fail。

- 日期：2026-04-27
- ID：pr275-brand-literal-gate-followup-2026-04-27
- 原因：`apps/ratewise/src/config/__tests__/build-scripts.test.ts` 會阻擋新增的品牌字面值，要求改由 SSOT 提供。
- 解法：修正 PR275 新增 worker 測試在 markdown fixture 內直接寫入 `HaoRate` 字面值，導致 repo 既有的品牌 SSOT gate 於 pre-push 階段失敗。此次只將 fixture 改為中性字串，不變更任何產品邏輯或對外輸出。

- 日期：2026-04-27
- ID：pr275-markdown-mirror-root-mapping-fix-2026-04-27
- 原因：`shouldServeRatewiseMarkdown()` 與 `shouldInjectRatewiseMarkdownLink()` 先前以 `isRootHost && pathname === '/'` 當條件，將所有 root host 首頁都視為 RateWise 首頁。
- 解法：依 PR275 新增的 Codex review，再修正一個 root-host markdown negotiation 漂移：Worker 先前把所有 root host 的 `/` 都映射到 `/ratewise/index.md`，導致 `app.haotool.org/` 的 markdown negotiation 與 alternate `Link` 語義都被錯掛到 RateWise。此次將映射與 alternate link 條件縮回真正的 RateWise 首頁 `/ratewise/`，並補上 root host 不得誤映射的整合測試。

- 日期：2026-04-27
- ID：pr275-codex-followup-csp-lastmod-fix-2026-04-27
- 原因：`security-headers/src/worker.js` 將 `app.haotool.org` 與 apex root host 共用同一組 HTML profile 判斷，誤把未知 app 路徑套成 `HAOTOOL_HTML_PROFILE`。
- 解法：依 PR275 新增的 Codex review threads，收斂兩個實際風險：其一是 `APP_HOST` 被直接納入 root HTML profile 判斷，導致 `/split-meow/` 之類未定義專屬 profile 的 app 路徑失去 fallback `img-src https:`；其二是 sitemap generator 在 shallow checkout 環境過早 early-return，讓沒有顯式 fallback 的內容頁退回 build-time `lastmod`。本次將 root-host 行為與 root HTML profile 拆開，並為 3 個 authority guide 頁補齊 semantic fallback date，同時把 shallow early-return 改為只對「有穩定 fallback」的路徑生效。

- 日期：2026-04-26
- ID：pr281-codex-review-cluster-fix-2026-04-26
- 原因：`buildRateDifferenceSentence()` 原本共用 `amount * rate` 公式，未區分台幣預算換外幣時應比較「可換得外幣量」而非台幣成本。
- 解法：依 PR281 的 review threads，修正兩個測試檔案的 HTML 過濾 regex 大小寫問題、修正 `TWD→外幣` 匯差公式的單位錯誤、將 sitemap lastmod policy 細化為 `lastmodFiles` 以兼顧 comment 要求與日期多樣性，並確認 `public/sitemap.xml` 回到 4 個不同日期。

- 日期：2026-04-26
- ID：ratewise-sitemap-lastmod-policy
- 原因：前一輪 SEO 修補主要聚焦 FAQPage / ExchangeRateSpecification 與公開技術揭露頁，未同步把現金專屬幣別的可見文案一起收斂成 conditional branch。
- 解法：完成 P1-A。新增 `seo-lastmod-policy.ts`，將首頁、FAQ、About、Guide、Open Data、SeoTech 等頁面的重大內容依賴與 fallback date 收斂到 policy，並讓 `generate-sitemap-2025.mjs` 透過 policy 解析 `lastmod`。這次也把 `/seo-tech/` 從無 mapping 的 current-time fallback 拉回可稽核來源，並加入 sitemap `lastmod` 多樣性 gate：本地不足 3 個日期時警告，CI 可用環境變數升級為失敗。

- 日期：2026-04-26
- ID：pr281-sitemap-shallow-checkout-hardening
- 原因：`generate-sitemap-2025.mjs` 的 `lastmod` 主要依賴 git commit 日期，而 GitHub Actions PR workflow 預設 shallow checkout。
- 解法：PR281 在本地與 pre-push 全綠，但 GitHub Actions 的 `actions/checkout` 預設 `fetch-depth: 1`，導致 `git log -1 -- <files>` 幾乎所有頁面都只看到同一個 merge commit 日期，進而讓 sitemap `lastmod` 在 CI 中退化成單一日期並被 truthfulness gate 擋下。本次將 generator 補上 shallow repository 偵測，於淺層 clone 環境直接改走 semantic fallback date；同時補齊 content pages 與 rate pages 的 fallbackDate，讓 CI 在缺乏完整 git 歷史時仍輸出可驗證且具多樣性的 `lastmod`。

- 日期：2026-04-26
- ID：ratewise-schema-truthfulness-gate
- 原因：舊的 schema 決策把 FAQPage 與 `FinancialService` 擴散到幣別頁，與公開 registry 及 2026 Search best practices 不一致。
- 解法：完成 P0-E 與對應的 P1-B regression gate。將首頁的 HowTo schema 輸出移除但保留可見教學內容，將 FAQPage JSON-LD 限縮到 `/faq/`，幣別頁與金額頁全面移除 `FinancialService` 與 FAQPage，只保留 `ExchangeRateSpecification` 等可稽核匯率 schema。同步新增 `schema-truthfulness.test.ts`，並翻新既有 prerender/jsonld/ssot/best-practices 測試，確保新規則不會回歸。

- 日期：2026-04-26
- ID：ratewise-seo-doc-ssot-drift-gate
- 原因：README、歷史 SEO 規格與當前 `seo-paths.config.mjs` 已產生數字漂移，尤其是貨幣支援數、索引 path 數與舊 sitemap 腳本名稱。
- 解法：完成 P0-D。將 root README 與 `apps/ratewise/README.md` 對齊目前 SSOT，改正貨幣支援數與可索引 path 數，並新增 `generate-readme-seo-status.mjs` 與 `verify-doc-ssot-drift.mjs`。前者負責自動維護 README 的 SEO 狀態區塊，後者只檢查活文件與公開 runtime surface，略過測試負向斷言、歷史 log 與已標示 `SUPERSEDED` 的文件，避免舊規格靜默回流。

- 日期：2026-04-26
- ID：ratewise-seotech-ssot-registry-alignment
- 原因：`SeoTech.tsx` 原本同時扮演頁面與真相來源，頁內硬編 `SCHEMA_TYPES`、`BUILD_SCRIPTS`、sitemap 描述，導致 SSOT 存在但 public disclosure 沒有真的接上。
- 解法：完成 P0-B。新增 `seo-schema-registry.ts` 與 `seo-build-pipeline.ts`，讓 `/seo-tech/` 不再在頁面檔案內手寫 schema 與 prebuild 真相，而是直接從 registry render。同步清除 `generate-sitemap.mjs`、`248 個 SEO URL`、`priority 欄位`、`FinancialService` 等過時說法，將 sitemap 說明改為 `lastmod + hreflang + image sitemap`，將幣別頁 schema 揭露改為 `ExchangeRateSpecification`，避免公開技術揭露頁宣稱「永遠同步」但實際內容仍漂移。

- 日期：2026-04-26
- ID：ratewise-seo-surface-order-and-currency-truthfulness
- 原因：`apps/ratewise/index.html` 先前承載首頁導向的品牌文案、功能清單與 skeleton，導致 prerender HTML 在 route 專屬 H1 之前先出現通用內容。
- 解法：先完成 P0-A 與 P0-C。將 `index.html` 的預設 HTML 縮到最小 `noscript`，移除所有會污染 SSG 首屏的首頁文案與 skeleton；同時讓 `Layout` 在 SSR/SSG 階段不再用 `Suspense` 串流延後 SEO route 內容、`SkeletonLoader` 不再把通用 SEO 文案寫進 SSG HTML，並在首頁 app chrome 前補上首頁專屬 H1，避免 header/nav 先於主題。幣別頁則移除硬編「換 10 萬日圓／1,500～3,000 元台幣」模板，改由 `seo-metadata.ts` 的匯差句子 builder 依幣別與方向產生文字，避免 USD 頁出現 JPY 範例這類 YMYL 信任傷害。

- 日期：2026-04-26
- ID：pr281-regex-end-tag-generalization-fix-2026-04-26
- 原因：先前版本雖已處理大小寫與單純尾端空白，但仍假設 end tag 只會是 `</script>` 或 `</script >`。
- 解法：依 PR275 / PR281 合併後續的 CodeQL thread，將兩支 SEO HTML stripping 測試從 `</script\\s*>` / `</style\\s*>` 再擴為 `</script\\b[^>]*>` / `</style\\b[^>]*>`，覆蓋 tag name 後仍帶空白、換行或其他合法尾端片段的變體，避免再次留下腳本或樣式內容。

- 日期：2026-04-26
- ID：robots-txt-validator-truthfulness-fix-2026-04-26
- 原因：worker 會在 root `/robots.txt` 尾端附加 `Content-Signal`，但先前直接沿用 upstream request headers 與 upstream validators。
- 解法：依 PR275 新增的 Codex review，修正 `security-headers` worker 在改寫 root `/robots.txt` 後仍沿用 upstream `ETag` / `Last-Modified` 與條件式 revalidation 的問題。現在 worker 會先移除 `If-None-Match` / `If-Modified-Since` 再抓 upstream，並在輸出改寫後的 robots 內容時清掉過期 validators，避免 `304` 與改寫 body 不一致。

- 日期：2026-04-24
- ID：github-actions-node24-transition-maintenance
- 原因：多支 workflow 仍固定使用 `actions/checkout@v4` 與 `actions/setup-node@v4`，雖然部分 job 已加上 Node 24 force flag，但版本本身仍停留在 Node 20 世代。
- 解法：GitHub 在 workflow annotation 中提示 JavaScript actions 的 Node 20 runtime 已進入淘汰過渡期。比對官方 changelog、release notes 與各 action 的 `action.yml` 後，確認 `actions/checkout@v6`、`actions/setup-node@v6` 已切到 `node24`，但 `actions/dependency-review-action@v4.9.0` 仍停留在 `node20`。本次將 repo 內所有 `checkout` / `setup-node` 升到 Node 24 相容 major，並只在 `dependency-review` job 保留 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'` 作為過渡控制，同步把判定原則寫回 `AGENTS.md` 與 `CLAUDE.md`，避免之後再次靠 warning 臨時補洞。

- 日期：2026-04-24
- ID：ratewise-about-faq-seo-truthfulness-refresh
- 原因：`ABOUT_PAGE_FAQ` 先前的 AI 搜尋引擎答案使用固定數量描述 AI crawler，容易在 `robots.txt` / `llms.txt` SSOT 擴充後再次失真。
- 解法：About 頁 FAQ 近期已更新為反映目前的 FAQPage、ExchangeRateSpecification 與 AI crawler 支援現況，但內容仍殘留兩個不穩定訊號：一是 AI crawler 數量若以固定數字描述，之後隨 robots.txt SSOT 擴充容易再次過時；二是金融頁 FAQPage 若被描述成以 rich result 為主要目標，會與 Google 現行 FAQ rich result 範圍產生語意偏差。本次將文案與守門測試一起收斂為「實際部署 + 不脆弱措辭 + 機器理解優先」三原則。

- 日期：2026-04-10
- ID：fix-speakable-parent-types-howto-removal
- 原因：`seo-helmet-utils.ts` 的 `SPEAKABLE_PARENT_TYPES` 陣列包含 `HowTo`，但 schema.org 規範明確限定 speakable 屬性僅適用於 `Article` 和 `WebPage` 類型。
- 解法：`SPEAKABLE_PARENT_TYPES` 錯誤包含 `HowTo`，導致首頁（有 HowTo + SpeakableSpecification、但無 Article/WebPage 節點）會把 speakable 掛載到 HowTo，跳過 WebPage fallback。依 schema.org 規範，speakable 僅適用於 Article/WebPage，掛載到 HowTo 會被結構化資料消費方忽略。

- 日期：2026-04-10
- ID：husky-nvm-bootstrap-for-noninteractive-shell
- 原因：Git hook 直接繼承當前 shell 的 PATH，非互動 shell 先命中 `/opt/homebrew/bin/node`，未自動切到 `~/.nvm`。
- 解法：雖然互動 shell 與 login shell 都已切到 Node 24，但 `git commit` / `git push` 觸發的 Husky hook 仍讀到 `/opt/homebrew/bin/node` 的 Node 25，導致每次 hook 都出現 engine warning。檢查後確認 hook 直接繼承外層 PATH，而不是穩定載入 NVM default。此次新增共用 `load-node-env.sh`，讓 `pre-commit`、`pre-push` 與 `commit-msg` 在非互動 shell 也會先切到 NVM 預設版本。

- 日期：2026-04-10
- ID：ratewise-followup-generated-artifacts-sync
- 原因：`pnpm build:ratewise` 於 pre-push 期間重新生成 `sitemap.xml`，使 canonical URL 的 `lastmod` 反映最新 SEO 相關提交日期。
- 解法：完成 `fix(ratewise): 收斂金額頁 SEO 索引策略與環境提示` 推送後，工作樹仍留下 `rates.json`、`sitemap.xml` 與 `seo-rate-examples.ts` 三個生成檔差異。進一步比對後確認這不是噪音：`sitemap.xml` 的 `lastmod` 已反映本次 SEO 相關提交日期，而匯率快照與 SEO 範例則在 build 期間抓到較新的臺銀資料。為避免同一分支上的遠端提交與本地 SSOT 產物不同步，將這三個生成檔收斂為 follow-up 提交。

- 日期：2026-04-10
- ID：ratewise-amount-seo-ssot-alignment-004
- 原因：先前「全金額 SEO 支援」語意不夠精確，容易被誤解成「所有金額頁都應成為獨立可索引頁」
- 解法：收斂 RateWise 金額頁 SEO 策略：明確區分 canonical 索引頁與任意金額可訪問頁，補齊 `supportedDynamicRoutePatterns` SSOT、修正 build 日誌與文件語意，並新增 `.node-version` 讓 Node 24 提示與 `engines` / `.nvmrc` 一致。

- 日期：2026-04-03
- ID：ratewise-nihonname-seo-ab-phases-002
- 原因：nihonname 4 頁（kominka/shimonoseki/san-francisco/history）Article schema 缺 image 欄位，Rich Results 驗證失敗
- 解法：完成 SEO A+B 兩階段原子優化：A 階段修正 Article.image/publisher schema 4 頁（nihonname 歷史頁）+修復 logo/publisher metadata；B 階段增強 E-E-A-T 信號（About/FAQ/Guide + Privacy/Contact page）並新增 semantic author/dateModified 標記與 PrivacyPolicy/ContactPage schema。版本語義更新至 v2.21.0，各 SSOT 檔案同步完成。

- 日期：2026-04-03
- ID：ratewise-lcp-optimization-c2-i18n-bundling-003
- 原因：Vite 配置未為 i18n resources 建立單獨 chunk，所有 4 個語言 locale 全部被打包進 app chunk
- 解法：C 階段第一個優化完成：通過 Vite manualChunks 分割 i18n resources，app bundle 從 331.78 KB 下降至 292.00 KB (-12%)，同時保持 SSG 預渲染兼容性。zh-TW 預設語言隨主 app 加載（9.2KB），en/ja/ko 可延遲至語言切換時加載（31.2KB）。LCP 預期改善 4.2s → 3.8–4.0s。

- 日期：2026-04-02
- ID：ratewise-seo-audit-p1-p5-fix-001
- 原因：H1 標題使用貨幣代碼（USD、JPY）而非中文名稱（美金、日圓），與 title 不一致降低搜尋相關性
- 解法：依據 SEO 稽核報告修正 P1（H1 標題）、P3（HowTo 圖片 404）、P5（dateModified 語意化）、P9（SeoTech 說明文字）四項高優先度問題。P4（測試衝突）確認為誤報。

- 日期：2026-04-02
- ID：ratewise-worktree-cleanup-seo-guards-001
- 原因：先前的 side worktree 建立在落後主支的基底上，未提交內容混有可用測試想法與已過時的 API / prerender 斷言
- 解法：盤點 repo 內殘留的 Claude worktree 後，先以主支為準判斷哪些內容已過時、哪些仍有保留價值。最終將兩份 dirty worktree 先備份 patch，再移除過期 worktree，只把不會回退主支現況的修補收斂回 `main`，包含版權文案 SSOT 與 sitemap / noindex prerender 防呆測試。

- 日期：2026-04-01
- ID：github-actions-schedule-drift-monitor-001
- 原因：既有 repo 只有 workflow YAML 與人工 `gh run list` 觀察，無法系統化量化「理論應觸發時間」與「實際 run 建立時間」之間的落差
- 解法：針對 GitHub Actions `schedule` 只提供 best-effort 觸發、無法保證每 5 分鐘準點的現況，新增 repo 內監測腳本，自動掃描有 `schedule` 的 workflow、比對 cron 理論時間與實際 `createdAt`，並統計 drift 秒數與缺漏的 scheduled slots，讓後續 CI/維運判讀不再只看 YAML。

- 日期：2026-03-31
- ID：rates-workflow-summary-cleanup-001
- 原因：`Commit and push changes` 步驟在 rebase 衝突時使用 `|| true` 吞掉錯誤，後續 summary 直接讀本地工作樹中的 `latest.json`
- 解法：合併後檢查主支 workflow log 時，發現 `Update Latest Exchange Rates` 在 `git pull --rebase` 衝突後，仍沿用帶 conflict markers 的本地工作樹執行 summary，導致成功 run 夾帶 JSON parse error。此次先以測試鎖定需求，再在兩條匯率 workflow 中加入 `origin/data` 刷新步驟，確保 summary 永遠讀取已提交的乾淨 JSON。

- 日期：2026-03-26
- ID：split-meow-mvp-pwa-offline-release-001
- 原因：新 app 初始匯入含 AI Studio 模板殘留（lockfile/依賴/外部資源），且未對齊 basePath 與 PWA 策略，若直接上線易造成離線失效與路徑錯誤
- 解法：將 split-meow 對齊 monorepo SSOT 與既有 PWA 實務模式，補齊 app.config.mjs、離線頁與本地資源，並以 prompt + injectManifest 設定避免版本撕裂，完成 v0.0.1 可上線版本。

- 日期：2026-03-18
- ID：ratewise-seo-audit-lastmod-contract-sync
- 原因：`scripts/verify-sitemap-2025.mjs` 保留舊的 ISO 8601 + timezone regex，未跟上 sitemap 生成器改為 date-only 的設計
- 解法：GitHub Actions 的 `SEO 2025 Standards Audit` 仍把 `lastmod` 視為必須帶時間與時區的完整 timestamp，導致合法的 `YYYY-MM-DD` sitemap 被誤判失敗。此次將 CI 驗證腳本同步到 W3C Datetime 契約，接受 date-only 與完整 timestamp 兩種合法格式。

- 日期：2026-03-18
- ID：ratewise-sitemap-lastmod-test-contract-sync
- 原因：`scripts/__tests__/sitemap-2025.test.ts` 已更新，但 `apps/ratewise/src/seo-best-practices.test.ts` 仍保留舊的秒級 regex
- 解法：`seo-best-practices.test.ts` 仍把 sitemap `lastmod` 寫死為完整 UTC timestamp，與新的 date-only sitemap 契約衝突，導致 pre-push 卡住。此次將測試同步收斂到 W3C 日期格式，讓最佳實踐、產物與測試三者一致。

- 日期：2026-03-18
- ID：ratewise-sitemap-lastmod-date-granularity
- 原因：先前 `lastmod` 輸出到秒級時間，若同一個 commit 本身修改了依賴檔，commit 完成後最新 git commit time 會晚於 commit 前生成的 sitemap，造成產物立即漂移
- 解法：針對 `git commit time` 版 `lastmod` 在 commit 完成後會立刻讓 `public/sitemap.xml` 再次變髒的問題，改為輸出 W3C Datetime 的日期格式 `YYYY-MM-DD`。這仍符合 sitemap protocol 與 Google 文件，且對同日多次 commit 保持穩定，讓 repo 追蹤的 sitemap 產物與實際 HEAD 不再互相打架。

- 日期：2026-03-18
- ID：ratewise-open-data-basename-lastmod-followup
- 原因：Open Data 相關資源卡以單一 `<a href>` 渲染，未區分 external 與 internal 導覽，導致 basename 部署時內部連結不會自動帶 `/ratewise/`
- 解法：依 review comment 與官方最佳實踐，將 Open Data 頁「使用指南」資源卡從一般 `<a href>` 改為 React Router `Link`，避免 `/ratewise/` 子路徑部署時導到根目錄；同時把首頁 `seo-metadata.ts` 納入 sitemap 依賴，確保首頁 SEO 文案更新會反映在 `lastmod`。

- 日期：2026-03-17
- ID：park-keeper-use-debounce-test-flake
- 原因：debounce hook 測試使用真實時間與 400ms timeout，當機器負載或測試併發較高時會偶發未在期限內完成狀態更新
- 解法：`apps/park-keeper` 的 `useDebounce.test.ts` 原本依賴真實計時器與 `waitFor`，在整包 workspace 測試併發時偶發超時，導致 `pre-push` 擋住與本次 SEO 任務無關的推送流程。改為 Vitest fake timers 後，測試可直接控制 300ms/500ms 邊界，行為更快也更穩定。

- 日期：2026-03-17
- ID：ratewise-seo-title-truthfulness-lastmod-tdd
- 原因：Open Data 頁的 SSOT title 直接包含品牌，而 `SEOHelmet` 又會統一追加品牌，導致最終 prerender `<title>` 重複
- 解法：針對 PR #207 的深度 SEO 審核 findings，先以紅燈測試鎖定三個問題，再完成最小修正與重建產物：Open Data 頁 title 不再重複品牌、About/SEO 指南不再錯誤宣稱 FAQPage rich result 已實作、sitemap `lastmod` 改為重大依賴檔的 git commit time 優先，讓 SEO 說法、SSG 產物與測試重新對齊。

- 日期：2026-03-16
- ID：park-keeper-photo-ux-v1.0.28
- 原因：（未填）
- 解法：RecordCard.tsx：PhotoViewerModal 改用 createPortal(modal, document.body) 渲染，跳出 transform 容器

- 日期：2026-03-16
- ID：park-keeper-ux-improvements-v1.0.27
- 原因：（未填）
- 解法：RecordCard.tsx：新增 formatSmartTime(timestamp) 純函式，依時間距離返回對應格式字串

- 日期：2026-03-15
- ID：park-keeper-photo-click-offset-fix-v1.0.26
- 原因：（未填）
- 解法：MiniMap.tsx：photoOffset default y: -80 → 10

- 日期：2026-03-15
- ID：park-keeper-user-beam-modern-svg-v1.0.25
- 原因：（未填）
- 解法：MiniMap.tsx：createUserIcon 改為 SVG 實作，增加 labelHtml（top:-44px）、精度暈圈、錐形 path + radialGradient、分層圓點（陰影/白環/主色）

- 日期：2026-03-15
- ID：park-keeper-nav-compact-48px-v1.0.24
- 原因：（未填）
- 解法：navBar.ts：NAV_CONTENT_H h-14 to h-12，NAV_ICON_SIZE 22 to 18

- 日期：2026-03-15
- ID：park-keeper-phone-flat-threshold-hysteresis-v1.0.23
- 原因：（未填）
- 解法：deviceOrientation.ts：PHONE_FLAT_THRESHOLD_DEGREES 45 to 75，新增 PHONE_FLAT_HYSTERESIS_DEGREES=55

- 日期：2026-03-15
- ID：park-keeper-nav-label-restore-v1.0.22
- 原因：（未填）
- 解法：navBar.ts：新增 NAV_LABEL_BASE_CLS（text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300）

- 日期：2026-03-13
- ID：improvement-ratewise-release-edge-sync-guard
- 原因：既有 `Release` workflow 對 `main` push 後立即 purge CDN，但 app 真正上線時間由外部部署系統決定，兩者沒有同步保證。
- 解法：新增 `scripts/ratewise-production-release.mjs`：提供 `app-version` probe、Cloudflare purge payload 與定點 purge 執行邏輯。

- 日期：2026-03-12
- ID：improvement-ratewise-live-precache-verifier-subpath-release
- 原因：`verify-precache-assets.mjs` 先前的預設 base 不是 `RateWise` 子路徑，若操作時未帶環境變數，容易把 root path 的結果誤當成 `/ratewise/` live 狀態。
- 解法：`scripts/verify-precache-assets.mjs`：依 `VERIFY_PRECACHE_SOURCE` 預設 `RateWise` 專用 base URL，並匯出 `getDefaultBaseUrl`、`parseShellAssetUrls`、`resolvePrecacheAssetUrl` 供測試使用。

- 日期：2026-03-12
- ID：improvement-ratewise-pwa-update-offline-techdebt-cleanup
- 原因：既有更新流程在 waiting SW 接管後缺少 `controllerchange` reload，容易留下「新 SW 已接管、舊 HTML 仍引用舊 chunk」的技術債風險。
- 解法：`UpdatePrompt.tsx`：新增 ready update 在線自動套用邏輯。

- 日期：2026-03-12
- ID：success-ratewise-stale-edge-404-offline-hotfix
- 原因：正式站 `sw.js` precache manifest 中有 4 個 `assets/*.js` URL 在 Cloudflare 邊緣被保留為 stale 404；同 URL 加 querystring 後可回 `200`，證明源站檔案存在但 edge 狀態錯誤。
- 解法：`security-headers/src/worker.js`：對 `ratewise/assets/*` 的 4xx 回應一律改成 `Cache-Control: no-store, no-cache, must-revalidate`，同步部署 Cloudflare worker `v4.2`。

- 日期：2026-03-12
- ID：improvement-seo-production-resource-availability-ssot
- 原因：既有 `verify-production-seo.mjs` 偏重 sitemap、robots、llms、404 與 canonical 語義驗證，缺少一個專責的「必要資源 availability」檢查層。
- 解法：新增 `scripts/verify-production-resources.mjs`，直接以每個 `app.config.mjs` 的 `resources.seoFiles` 與 `resources.images` 為 SSOT，自動發現所有 apps 並檢查正式站 URL 是否回傳 `200`；同時接入 `SEO Production Validation` workflow，使資源存活檢查與 sitemap/robots/llms 語義檢查分層。

- 日期：2026-03-11
- ID：incident-ratewise-settings-theme-hydration-disabled
- 原因：`useAppTheme()` 以 `typeof window !== 'undefined'` 直接推導 `isLoaded`，缺少一個 client mount 後必定觸發的 state re-render。
- 解法：在正式站 root-scope SW 汙染修正後重新驗證 `RateWise`，發現 `/ratewise/settings` 雖已可進入，但主題切換按鈕與重置按鈕仍維持 `disabled`，只有語言切換可用。最終確認不是資料載入失敗，而是 SSG/hydration 流程把 server 端的 disabled 屬性殘留在 DOM。

- 日期：2026-03-11
- ID：incident-ratewise-stale-pwa-shell-recovery
- 原因：正式站仍存在 top-level `self.skipWaiting()` 舊版 SW，與 repo 已改成 prompt 模式的 source 不一致。
- 解法：正式站舊 PWA 使用者可能被舊版 auto-update service worker 與新資產版本撕裂卡在 SSR 骨架屏，React 恢復機制因主 bundle 未載入而完全失效；同時先前將 apple-touch-icon 與 legacy pwa-\*.png 改為透明去背，造成使用者感知到 icon 樣式改變。

- 日期：2026-03-11
- ID：incident-haotool-root-sw-cross-app-contamination
- 原因：`apps/haotool` 啟用了根 scope PWA，`vite-plugin-pwa` 預設會以 `navigator.serviceWorker.register('/sw.js', { scope: '/' })` 註冊。
- 解法：正式站 `curl` 已顯示 `RateWise` 新版 HTML 與 recovery bootstrap 上線，但 Browser MCP 造訪 `https://app.haotool.org/ratewise/` 時仍被 `haotool` 首頁接管。最終確認根因不是 RateWise bundle，而是同網域根目錄 `haotool` 的 root-scope Service Worker (`/sw.js`) 透過 `NavigationRoute(index.html)` 攔截所有子路徑，讓曾造訪首頁的使用者在 `/ratewise/` 也收到錯誤 app shell。

- 日期：2026-03-15
- ID：park-keeper-ssot-tdd-refactor-v1.0.21
- 原因：（未填）
- 解法：（未填）

- 日期：2026-03-13
- ID：e2e-offline-timeout-fix
- 原因：（未填）
- 解法：|

- 日期：2026-03-11
- ID：pr188-precache-verifier-and-home-lazy-chunk-audit
- 原因：`Quality Checks` 失敗實際不是測試紅，而是 `BottomNavigation.tsx` / `OfflineAwareError.tsx` 新增路徑沒有對應 coverage
- 解法：PR #188 補上 `BottomNavigation` 與 `OfflineAwareError` 測試後，`ratewise` coverage 已回到 GitHub Actions 門檻以上；同時發現 root `verify:precache` 腳本仍只會解析舊版 `precacheAndRoute([...])` 字串，對目前 injectManifest 產出的 minified `sw.js` 會假性失敗。另一路正式檢查確認 `haotool` 首頁雖已移除 Suspense fallback marker，但 build 產物仍會 preload `ThreeHero` 與 `SectionBackground` lazy chunk，與「mount 後才載入」的設計不一致，因此改在 `postbuild.js` 直接清理首頁 preload，讓產物與設計一致。

- 日期：2026-03-10
- ID：haotool-home-procedural-environment-and-ratewise-basename-guard
- 原因：`ThreeHero.tsx` 直接使用 `Environment preset="city"`，把首頁反射環境綁到第三方遠端 HDR 檔與 `connect-src`
- 解法：正式站複核時發現 `haotool.org` 首頁 3D Hero 使用 `@react-three/drei` 的遠端 HDR preset，執行期會抓 `raw.githack.com`，被既有 CSP 正常阻擋後直接連鎖觸發 React / WebGL 崩潰；進一步本地 production preview 又揭露首頁仍因 `React.lazy + Suspense` 包裝 client-only 3D 模組，讓 SSG HTML 帶入 Suspense fallback marker，觸發 `React error #418`。同一輪 `squirrel audit` 也揭露 `ratewise` 底部導覽在 SSR HTML 輸出裸路徑 href，讓 crawler 或無 JS 情境直接打到 `/multi`、`/favorites`、`/settings` 的 root 404。修正採最小責任原則：`haotool` 改為程序化 `Environment + Lightformer`，並把 3D 模組改成 mount 後再 `import()`；`ratewise` 導覽改為 `useHref()` 產生 basename-aware href，並確認既有 PWA chunk recovery 未提交變更可覆蓋 Chrome / Safari 的常見 chunk 失效路徑。

- 日期：2026-03-10
- ID：manual-version-pr-fallback-release-2026-03-10
- 原因：GitHub Actions `Release` run `22883131370` 在 `Create Release Pull Request` 後回報 org-level permission 缺失：未啟用「Allow GitHub Actions to create and approve pull requests」
- 解法：PR #185 合併到 `main` 後，`Release` workflow 確實被觸發，但組織層級未開啟 GitHub Actions 建立 PR 權限，導致 `changesets/action` 無法自動建立 `Version Packages` PR。為維持既有 release SSOT，本次改以 `codex/manual-release-ratewise-2-8-6-parkkeeper-1-0-10` 分支手動執行 `pnpm changeset:version` 與 `pnpm --filter @app/ratewise prebuild`，將 patch 版本展開為 RateWise `2.8.6` 與 ParkKeeper `1.0.10`，再透過一般 PR 流程回到 `main`。

- 日期：2026-03-10
- ID：pr185-review-browser-verification-release-prep
- 原因：使用者要求在合併前完成深度 review、瀏覽器功能確認與小版本更新，但 repo 的 versioning 規則明確禁止在功能分支直接執行 `changeset version`
- 解法：針對 `codex/cloudflare-security-headers-v4` 執行合併前深度審查，補跑 Browser MCP 驗證 `ratewise` 與 `park-keeper` 核心路由與互動，確認 console 全程 0 error，並補上 multi-package patch changeset，讓 PR #185 合併後可以依 repo SSOT 正常產生 `Version Packages` PR。

- 日期：2026-03-10
- ID：codeql-test-html-regex-removal
- 原因：測試為了模擬 Cloudflare `HTMLRewriter`，以 regex 匹配 `<script ...>` 後手動重組 tag
- 解法：PR #185 的 GitHub Advanced Security 在 `apps/ratewise/src/__tests__/securityHeadersWorker.test.ts` 發現 `js/bad-tag-filter`，原因是測試用 mock `HTMLRewriter` 以 regex 改寫 `<script>` tag。雖然告警落在 `classifications: [test]`，但仍會讓 PR 顯示新增高嚴重度 security alert。修正方式改為使用 `jsdom` 建立 DOM、以 `querySelectorAll()` 套用 handler，不再用 regex 解析 HTML。

- 日期：2026-03-10
- ID：security-header-test-structure-decoupling
- 原因：`seo-best-practices.test.ts` 仍使用舊 regex 直接抓 `"'Permissions-Policy': '...'"` 字串，假設 Worker 採物件字面值寫法
- 解法：`pre-push` 在 `apps/ratewise/src/seo-best-practices.test.ts` 揭露既有測試仍假設 Worker 以舊式物件字面值直接宣告 `Permissions-Policy`，與新版 profile/constant 架構不相容。改為驗證 `DEFAULT_PERMISSIONS_POLICY` / `PARK_KEEPER_PERMISSIONS_POLICY` 常數與實際 `response.headers.set()` 路徑後，測試重新回到對 SSOT 的行為驗證，而非對字串排版的脆弱耦合。

- 日期：2026-03-10
- ID：cloudflare-security-headers-layered-refactor
- 原因：舊 Worker 雖已集中管理安全標頭，但 route 只覆蓋 `app.haotool.org/ratewise/*`，導致 `nihonname`、`park-keeper`、`quake-school` 與 root pages 缺少一致保護
- 解法：針對 `security-headers` Worker 執行分層重構，將 HSTS 留在 Cloudflare Edge，讓 Worker 專注於依 app/path 分層 CSP、CSP report 與分享圖 CORS；同時把 `ratewise` 升級為 nonce 型 CSP、補上 `park-keeper` 導航感測器白名單與 hook 啟用條件，最後以 curl、Playwright MCP、正式站 Playwright smoke test 建立可重現的生產驗證閉環。

- 日期：2026-03-09
- ID：fix-ratewise-router-chunk-cycle
- 原因：`manualChunks()` 只把 `react-router` 系列切到 `vendor-router`，但底層 `@remix-run/router` 被落入 `vendor-commons`
- 解法：針對 `pnpm build:ratewise` 既存的 `Circular chunk: vendor-router -> vendor-commons -> vendor-router` 警告，重整 `manualChunks` 的 router 生態系統分組，將 `react-router`、`@remix-run/router` 與 `vite-react-ssg` 收斂到同一個 chunk，消除跨 chunk 循環依賴。

- 日期：2026-03-09
- ID：ratewise-v2-8-1-patch-release
- 原因：`#177` 與 `#182` 合併後，main 上累積兩個 `@app/ratewise` patch changeset，需透過正式版本化流程寫回 package 與 CHANGELOG
- 解法：將已合併到 main 的兩個 RateWise patch changeset 正式版本化為 v2.8.1，產出對應 CHANGELOG 並清除待處理 changeset，讓主支回到乾淨可發布狀態。

- 日期：2026-03-08
- ID：ratewise-seo-ssot-faq-best-practices
- 原因：FAQ 內容、FAQ rich result、hreflang fallback 與 head metadata 分散在 `SEOHelmet`、頁面元件與測試斷言中，導致 PR 表面通過但實際仍殘留舊 FAQPage 行為
- 解法：依 Google Search Central 最佳實踐重新審查 RateWise SEO PR，將 FAQ 內容與 rich result 責任拆分，移除不適用的 FAQPage schema、收斂 hreflang fallback 與 head metadata，並以 TDD 重寫 SEO 驗證，讓 SEO 行為回到單一 SSOT。

- 日期：2026-03-09
- ID：fix-twd-pinned-multi-ordering
- 原因：（未填）
- 解法：修改 useCurrencyConverter.ts：sortedCurrencies 改用明確 TWD 置頂邏輯

- 日期：2026-03-08
- ID：log-v2-structured-indexing
- 原因：舊版 entry 可讀但索引欄位不穩定，主題與關鍵字無法可靠抽取
- 解法：依文件前言、分類與搜尋最佳實踐，將 002 升級為可被腳本與靜態文件工具穩定解析的 v2 結構，補上受控主題分類、標準化關鍵字與跨案例關聯。

- 日期：2026-03-08
- ID：incident-ssg-hydration-determinism
- 原因：server 與 client 首次 render 使用非 deterministic 值
- 解法：多次事故本質相同：server 與 client 首次 render 使用了不同輸入，例如 `new Date()`、`Math.random()`、`localStorage`、未固定時區的日期或巢狀 Layout，導致 Hydration #418、畫面重排或首屏內容漂移。

- 日期：2026-03-08
- ID：incident-base-path-assets
- 原因：手動組合資產 URL，而不是讓打包工具處理
- 解法：多次正式站問題都來自同一根因：資產路徑在 component 內自行拼接，或只在本地根路徑驗證，沒用真實子路徑 / base path 檢查，最終造成 logo、OG、offline、manifest 或 favicon 在正式站失效。

- 日期：2026-03-08
- ID：incident-seo-public-path-ssot
- 原因：公開 URL 清單存在多份來源
- 解法：sitemap、hreflang、llms.txt、robots、公開路由與驗證腳本曾多次互相脫鉤；表面症狀不同，但根因一致：公開 SEO 路徑不是由單一來源生成，導致每加一條路由就有多處需要手動同步。

- 日期：2026-03-08
- ID：incident-ci-hardcoded-audit
- 原因：檢查器使用手寫常數、硬編碼字串或固定欄位假設
- 解法：多次 CI 失敗不是產品真的壞掉，而是檢查工具寫死字串、路徑或數字，導致合規內容也被阻擋。這類問題本質上是檢查器違反 SSOT，而不是應用邏輯錯誤。

- 日期：2026-03-08
- ID：incident-csp-header-boundary
- 原因：安全標頭由多個層級同時維護
- 解法：安全標頭曾經同時散落在 app、nginx、worker 與理論最佳實踐之間；像 `strict-dynamic` 這種策略在 SSG 架構下沒有穩定 nonce 來源，套上去只會讓正式站壞掉。另一類問題則是 app 端已修、edge 端仍舊 header，形成部署漂移。

- 日期：2026-03-08
- ID：incident-production-verification-gap
- 原因：驗證只停在本地與 CI，缺少正式站 smoke check
- 解法：多次事故共同模式是「本地綠、CI 綠，但正式站仍有問題」，原因包含沒有檢查真實 base path、沒有驗 edge header、沒有檢查正式 console、或部署順序讓 app 與 worker 不一致。

- 日期：2026-03-08
- ID：incident-over-optimization-before-stability
- 原因：在缺少回滾與依賴邊界驗證時就做進階優化
- 解法：幾次事故都來自同一思維：在基礎資產、依賴邊界或回滾方案沒準備好前先做優化，例如過早考慮 AVIF/WebP、把 React 核心模組拆錯 chunk，最終把性能優化變成生產事故。

- 日期：2026-03-08
- ID：regression-docs-tests-routes-sync
- 原因：變更只修改執行邏輯，未同步測試、文檔與 SSG / SEO 設定
- 解法：多次小問題其實都屬同一類：改了 routes、SEO 路徑、xhtml:link 數量或文件敘述，但沒有同步測試與文檔，造成 false red 或更糟的 false green。

- 日期：2026-03-14
- ID：ga-e2e-review-fixes-and-scheduling-guard
- 原因：將「實頁面不變式」與「readyState 分支覆蓋」混在同一個 E2E 測試，導致 about:blank 假陽性
- 解法：PR #204 的 review 先後暴露六個層面問題：`ga-defer-lcp.spec.ts` 在 `chromium-mobile` 與 `offline-pwa-chromium` 重複執行、E2E 用 `about:blank` 的 `document.readyState` 假裝覆蓋實頁面競態、以 `includes('googletagmanager.com')` 判斷 script URL 造成 CodeQL `js/incomplete-url-substring-sanitization` 告警、以 `Array.isArray()` 錯判 GA `IArguments` 結構導致 `config` 次數永遠算成 0、只在 `DOMContentLoaded` 取樣一次而漏掉 `DOMContentLoaded → load` 之間的初始化時窗，以及 `APP_ROOT` 目錄深度計算錯誤導致 E2E 永遠讀不到真正的 `dist/assets`。修正方式是把 GA 排程抽成 `scheduleAfterPageLoad()` 單元測試覆蓋、E2E 改回實頁面不變式驗證、Playwright project 規則抽成常數，並以 parsed URL host/path、連續監測 `dataLayer`、正確的 `IArguments` 判讀與穩定的 app root 解析收斂 review。

- 日期：2026-03-14
- ID：haotool-root-url-ssot-contact-non200-fix
- 原因：`SITE_CONFIG.url` 同時承擔 root site canonical 與 sibling app sitemap host，導致根站網址責任混雜
- 解法：將 `apps/haotool/app.config.mjs` 的 root `SITE_CONFIG.url` 改為 `https://haotool.org/`

- 日期：2026-03-14
- ID：security-headers-wrangler-schema-compat-date-refresh
- 原因：`security-headers/wrangler.jsonc` 建立後長期未跟進 Cloudflare 近月最佳實踐，導致相容日期老化。
- 解法：透過 `wrangler` CLI 與 Cloudflare 官方文件重新核對後，確認目前生產中的 `security-headers` Worker 雖正常運作，但 `wrangler.jsonc` 仍缺少 `$schema`，且 `compatibility_date` 停在 `2025-11-26`。這次將設定補齊到 Cloudflare 當前建議做法，讓後續配置校驗、IDE 提示與 runtime 行為基線都回到可維護狀態。

- 日期：2026-03-30
- ID：ratewise-prerender-canonical-amount-schema-sync
- 原因：FAQ 頁的 SEO SSOT title 本身包含完整品牌字樣，經 `SEOHelmet` append brand 後造成 prerender HTML title 語意重複。
- 解法：針對 RateWise prerender SEO 做 production-grade 回歸審查後，補上三個會直接影響搜尋與 AI 抽取品質的缺陷：FAQ 頁 title 在 HTML 中重複品牌、`?amount=` 入口會自我 canonical 成 query URL、以及 amount 頁 `FinancialService` schema 仍指回幣對首頁。這次以 TDD 先補紅燈測試，再修正 SSOT 與 prerender 輸出，讓 amount 頁 metadata、hreflang、schema 與 self-canonical 完全一致。

- 日期：2026-03-30
- ID：ratewise-seo-ssot-machine-readable-followup
- 原因：Vite PWA plugin config 與 Playwright PWA 測試仍沿用舊品牌字串，沒有跟 `APP_INFO.name` 與 public manifest generator 同步。
- 解法：針對前一輪 SEO/AEO 修正後的殘留漂移，再補齊三個會影響長期穩定性的 SSOT 缺口：PWA manifest 名稱仍使用舊品牌、`llms-full.txt` 的 Answer Capsule 對外仍殘留 query-first 心智模型，以及 `api/latest.json` / `openapi.json` 沒有把 path-style amount landing page 宣告為首選模板。這次以 TDD 補上紅燈測試後，統一由 `APP_INFO.name` 驅動 manifest 品牌，並把 machine-readable 契約改為 `preferredLandingPageTemplate` + `interactiveDeepLinkTemplate` 的雙模板模式。

- 日期：2026-03-30
- ID：ratewise-rating-snapshot-deterministic-placeholder
- 原因：`fetch-rating-snapshot.mjs` 的 placeholder 路徑與成功拉取路徑共用「現在時間」心智模型，導致無 API 環境也會寫入新的 `snapshotAt`。
- 解法：在推送 `codex/ratewise-seo-followup` 時發現 `pre-push` 的 `build:ratewise` 會讓 `apps/ratewise/src/config/generated/rating-snapshot.ts` 每次都變更，根因是 `fetch-rating-snapshot.mjs` 在 `RATING_API_URL` 未設定時仍以 `new Date().toISOString()` 產生 placeholder 快照時間。這會破壞 build 可重現性，讓本機與 CI 反覆留下髒工作樹。修正方式是先以測試鎖定 deterministic placeholder 規則，再把 placeholder 改為固定時間常數 `1970-01-01T00:00:00.000Z`。

- 日期：2026-03-30
- ID：split-meow-ci-coverage-unblock-for-ratewise-pr
- 原因：CI `Quality Checks` 對整個 monorepo 執行 `pnpm -r run test:coverage`，所以即使 RateWise 變更正確，也會被其他 workspace 的 coverage debt 阻塞。
- 解法：PR #221 的 `Quality Checks` 失敗不是來自 `apps/ratewise`，而是 monorepo 中 `apps/split-meow` 的 coverage functions 只有 `54.98%`，低於 workflow 要求的 `60%`。為了完成「CI 修復後才能合併主支」的控制目標，這次在 scope 外做最小必要修補：以測試補強 `App.tsx`、`CatCompanion.tsx`、`CatPlayLayer.tsx` 與 `lib/catPlay.ts`，把 `split-meow` coverage 拉升到 `63.46%`，不調降門檻。

- 日期：2026-03-30
- ID：ratewise-seo-production-followup-ssot-hardening
- 原因：前一輪修正雖已消除實際輸出的 canonical/schema 問題，但仍有部分 SEO/PWA 文案模板散落在 hook 與生成器內，長期會與品牌 SSOT 或頁面 metadata 漂移。
- 解法：續查正式站與 GitHub workflow 後，確認 `SEO Production Validation` 的最新失敗屬於 `/eur-twd/` 暫時性 502 假警報，同時本地仍殘留兩個會持續讓 SEO 漂移的硬編碼點：`usePairAmountSEO.ts` 直接寫死 amount 頁 title/description 模板，以及 `generate-manifest.mjs` 直接寫死 `short_name` 與 screenshot label。這次先以測試鎖定行為，再把 amount SEO 文案收斂到 `seo-metadata.ts`，把 manifest 品牌資訊收斂到 `app-info.ts` 的 manifest SSOT，並補上 authority guide 頁的 Answer Capsule 與 production health check 5xx retry。

- 日期：2026-03-30
- ID：ratewise-health-check-plain-node-ssot-fix
- 原因：`health-check.mjs` 先前為了避免硬編碼，直接 import `src/config/seo-metadata.ts`；但該模組依賴 extensionless TS imports 與 `import.meta.env`，不適合被 plain Node CLI 直接載入。
- 解法：Codex review 指出 `apps/ratewise/scripts/health-check.mjs` 直接 import `seo-metadata.ts`，會在 plain Node 環境因 bundler-only import 與 `import.meta.env` 依賴而於啟動前崩潰。這次先用紅燈測試鎖定「health-check 只能依賴 plain-Node SSOT 模組」，再把首頁與 Guide 的預期 title 抽成 `seo-static.ts`，讓 health-check 與 `seo-metadata.ts` 共用同一份靜態來源，同時保留 build/typecheck 與直接 `node` 執行能力。

- 日期：2026-03-31
- ID：splitmeow-tdd-and-actions-schedule-reliability
- 原因：`useUpdatePrompt.ts` 將 `visible` 永久綁在 `dismissed`，但沒有在新的 `needRefresh` 事件發生時重置 `dismissed`。
- 解法：針對近一個月 closed PR 的 Codex review 逐條回查後，確認 `split-meow` 還有兩個真實缺陷未修：`useUpdatePrompt` 在使用者 dismiss 離線提示後，不會在後續 `needRefresh=true` 時重新顯示更新提示；`HomeTab` 在 itemized 模式下若目前焦點成員被停用，鍵盤輸入仍可能寫入已停用對象。這次先用紅燈測試鎖定兩個互動問題，再做最小修正讓其轉綠。另在驗證 `4a26af8e` 的 MoneyBox 5 分鐘同步時，發現 workflow 雖成功抓到資料，但因用 `git diff --quiet` 檢查未 tracked 新檔案，導致 `moneybox.json` 第一次建立時被誤判為「無變更」而未 commit；同時 GitHub Actions 的 `*/5` schedule 在實測上並不準時，今天只跑出數次、實際間隔介於約 49 至 205 分鐘。為降低高負載時的延遲 / 掉單風險，將 latest 與 moneybox 兩個高頻 workflow 的 cron 改為錯開且避開整點，並加入 schedule diagnostics 輸出，讓後續可直接從 `gh run view --log` / summary 判讀平台延遲與資料新鮮度。

- 日期：2026-04-09
- ID：ratewise-p0-seo-schema-implementation
- 原因：`SEO_MASTER_SSOT.md` 已規劃 P0 任務但尚未實作，導致 AI 引擎無法從 RateWise 頁面提取結構化匯率資訊。
- 解法：依據 `SEO_MASTER_SSOT.md` 的 P0 優先級任務，完成三項關鍵 SEO 改善：(1) 首頁加入 `CurrencyConversionService` schema，讓 AI 引擎匹配「幣別換算工具」查詢時優先引用；(2) 34 個幣對頁加入 `ExchangeRateSpecification` schema，從 `seo-rate-examples.ts` 動態讀取現金賣出價，讓 AI 引擎可提取並顯示具體匯率數字；(3) 幣對頁加入可見更新時間戳（`<time>` 元素），作為 Perplexity 新鮮度信號。同時新增 10 個測試案例驗證 schema 正確性。

- 日期：2026-04-20
- ID：ratewise-p1-5-amount-page-exchange-rate-schema
- 原因：P0 階段僅在 34 個幣對頁實作 `ExchangeRateSpecification`，約 204 個金額頁缺乏此 schema。
- 解法：延續 P0 階段的 ExchangeRateSpecification 實作，將此 schema 擴展至約 204 個金額頁（如 `/usd-twd/100/`）。新增 `buildAmountExchangeRateSpecificationJsonLd()` 函數，在 schema description 中包含具體換算結果（如「100 USD 換 3,250 TWD」），讓 AI 引擎可直接提取「X 外幣 = Y 台幣」形式的答案。同時新增 4 個測試案例驗證 to-twd 和 twd-to-foreign 兩種方向的 schema 生成。

- 日期：2026-04-20
- ID：ratewise-seo-infrastructure-batch-2026-04
- 原因：開發者需要診斷 Worker 處理耗時，但缺乏 Server-Timing 標頭。
- 解法：批次完成四項 SEO 基礎建設任務：(1) P1-8 在 Cloudflare Worker 加入 Server-Timing 診斷標頭，記錄 fetch/rewrite 耗時；(2) P2-7 在 open-data 頁面使用 TechArticle schema 強化開發者 SEO；(3) P2-10 建立 GSC AI Overviews 監測 SOP 文件；(4) P2-11 在 Worker 中加入 AI 爬蟲存取記錄功能，追蹤 llms.txt/.md 鏡像的存取頻率。

- 日期：2026-04-24
- ID：ci-data-branch-post-push-refresh-hardening
- 原因：排程 workflow 將 post-push refresh 視為一般必要步驟，導致 GitHub 瞬時 5xx 會把整個 job 標成 failure。
- 解法：透過 `gh run view --log-failed` 追查 `Update Latest Exchange Rates` 最新失敗後，確認 `Commit and push changes` 與 jsDelivr purge 都已成功，真正失敗的是最後的 `Refresh ... from remote data branch`，原因為 GitHub 在 `git fetch origin data` 返回瞬時 `500`。這代表 workflow 把「收尾驗證失敗」誤判成「資料更新失敗」。本次將 latest 與 moneybox 兩支同型 workflow 的 post-push refresh 收斂為最多 3 次重試，並設為 `continue-on-error: true`；若仍失敗，只在 workflow summary 顯示 warning，不再覆蓋已成功的 data branch push 結果。同時同步更新 `AGENTS.md` 與 `CLAUDE.md`，把這個判定原則與修法納入 SOP。

- 日期：2026-04-24
- ID：ratewise-auto-rate-display-align-buy-sell
- 原因：`SingleConverter` 的匯率卡片自行以 `fromRate / toRate` 組裝顯示值，沒有共用實際換算用的 `convertCurrencyAmountWithMode()`。
- 解法：修正單幣別轉換器在 `自動方向` 模式下的匯率卡片顯示錯誤。實際換算早已透過 `convertCurrencyAmountWithMode()` 依方向套用買入/賣出價，但 `SingleConverter` 的卡片文字仍直接用 `getExchangeRate()` 計算，等同固定走 sell 邏輯，導致畫面上的「1 TWD = X USD / 1 USD = Y TWD」與實際換算結果不一致。本次將卡片顯示改為直接共用 `convertCurrencyAmountWithMode()`，讓 auto / sell / mid 三種模式的顯示與計算完全收斂，並新增測試鎖住 auto 模式下正反向不必互為倒數的行為。

- 日期：2026-04-26
- ID：ratewise-seo-rate-examples-spotavailable-ssot
- 原因：前一輪修補已在 runtime 依賴 `spotAvailable` 分支，但生成腳本與 generated 檔案仍停留在未提交狀態。
- 解法：將 `spotAvailable` 正式收進 `update-seo-rate-examples.mjs` 與 `generated/seo-rate-examples.ts` 的資料生成鏈，讓 cash-only 幣別與有即期匯率幣別的差異來自可重建的 SSOT，而非只存在於本地測試狀態。同時保留 `seo-speakable.test.ts` 對 Authority Guide FAQ `h3` 朗讀節點的回歸測試，避免再次出現 metadata 與頁面實際 heading 結構脫鉤。

- 日期：2026-04-26
- ID：ratewise-sitemap-lastmod-diversity-followup
- 原因：generator 對 `CONTENT_LASTMOD_POLICY` 的內容頁直接對整組 dependency files 做 `git log -1`，使共享檔案的最近 commit 蓋過 route 專屬內容檔。
- 解法：`generate-sitemap-2025.mjs` 先前雖已導入 semantic lastmod policy，但內容頁仍會因共用 `seo-metadata.ts` 的最近 commit 被壓成同一天，導致 sitemap 只產生 2 種日期並持續警告。這次將內容頁 lastmod 的優先順序改成先看 route 專屬主檔，再回退到完整 dependency set，讓 `/faq/`、`/about/`、`/guide/`、`/open-data/`、`/seo-tech/` 的日期更貼近主內容更新，而不是被共用設定檔一起帶新。

- 日期：2026-04-25
- ID：ratewise-seo-ssot-external-audit-2026-04-25
- 原因：`SEO_MASTER_SSOT.md` 的 12.6 區塊缺少最新一次可追蹤的外部檢測迭代紀錄。
- 解法：補充 `apps/ratewise` SEO SSOT 的外部檢測基線，新增 2026-04-25 外部檢測快照、權威來源對照與可重複執行命令，將網站回應狀態與第三方限制做分層紀錄，幫助後續發版快速區分站點退化與工具限制造成的異常。

- 日期：2026-04-25
- ID：ratewise-seo-ssot-external-audit-2026-04-25-revision
- 原因：先前 SSOT 監測節點缺少最新 46 入口抽樣與 prod/root 差異證據。
- 解法：同步 `docs/SEO_MASTER_SSOT.md` 的 12.5 / 12.6 區為 2026-04-25 生產基線，補齊 46 筆外部入口快照、`curl` 與 IsItAgentReady API 實測摘要，並修正檢測結果分佈紀錄。

- 日期：2026-04-25
- ID：ratewise-root-host-ai-discovery-alignment-2026-04-25
- 原因：`ROOT_SITE_HOSTS` 原先未包含 `app.haotool.org`，導致掃描器以 root 起算時看不到 `Content-Signal` 與 `Link` header 相容行為。
- 解法：將 `security-headers/src/worker.js` 的 root-host 設定補上 `app.haotool.org`，使 root 與 `/ratewise/` 可共用同一套 `Content-Signal`、markdown negotiation 與 `Link` 導向邏輯；待生產部署後需重跑 IsItAgentReady 與 curl 驗證。

- 日期：2026-04-26
- ID：pr275-codex-command-evidence-fix-2026-04-26
- 原因：先前 002 條目沿用了文件草稿中的命令描述，未再次核對 `scripts/seo-full-audit.mjs` 的實際 CLI 介面。
- 解法：依 PR275 的 Codex review，將 `docs/dev/002_development_reward_penalty_log.md` 內不可執行的 `node scripts/seo-full-audit.mjs --base-url=...` 證據命令改為實際支援的本地 `dist` 稽核命令，避免把不存在的 CLI 參數寫進可追溯證據鏈。

- 日期：2026-04-30
- ID：ratewise-seo-ab-test-production-fixes-2026-04-30
- 原因：常見金額連結使用 `popularAmounts`，但 SSG 可索引金額由 `INDEXABLE_FORWARD_AMOUNTS` 維護，兩份資料源漂移後產生 `/myr-twd/5000/`、`/nzd-twd/20/`、`/php-twd/50000/` 站內 404。
- 解法：依 Squirrel、正式站抽樣與多 agent 複核結果，修正幣別頁常見金額連結與 SSG 金額白名單漂移、OpenData 頁 raw email 觸發 Cloudflare email obfuscation、首頁 Markdown mirror 描述錯抓 FAQ 文案、robots 非標準 Content-Signal 註解與過時 WebSite SearchAction。

- 日期：2026-04-26
- ID：pr281-regex-tail-whitespace-fix-2026-04-26
- 原因：先前修正只處理了大寫標籤，未覆蓋 end tag 在 `>` 前含空白的合法 HTML 變體。
- 解法：依 PR281 合併後新增的 CodeQL thread，將兩支 dist HTML 可見文字測試的 regex 從大小寫不敏感版本再補強為可接受 `</script >` 與 `</style >` 這類 end-tag 尾端空白，避免 HTML stripping 留下腳本或樣式內容造成假陽性。

- 日期：2026-05-01
- ID：ratewise-performance-followup-shell-split
- 原因：首頁 app shell 仍直接載入互動換算器與 motion 相關提示元件，release 後 Markdown mirror 版本也停在舊版。
- 解法：延續已隔離 stash 並經多 agent 複核，保留 logo LCP preload，移除未使用 Google Fonts resource hint，將首頁換算器與非首屏 PWA/評分提示延遲載入，底部導覽改用 CSS transition，並同步 Markdown mirror 至 v2.22.8。

- 日期：2026-05-01
- ID：pr315-ratewise-lazy-boundary-direction-review-fix
- content_type：review-fix
- topics：ratewise, performance, pwa, route-transition
- keywords：React.lazy, Suspense, error boundary, route animation, chunk load
- related_entries：ratewise-performance-followup-shell-split
- 原因：PR #315 review 指出兩個真問題：route direction 透過 effect 更新會在反向連續切換時慢一拍；全域非首屏 lazy 提示若 chunk 載入失敗，缺少錯誤邊界會把非關鍵提示故障升級成整體路由錯誤。
- 解法：將 AppLayout 的上一個 pathname 記錄改為 render-time guarded state，讓當次 render 直接取得正確 previous/current path；另以非關鍵 error boundary 包住 OfflineIndicator、UpdatePrompt、RatingModal 的 Suspense，chunk 失敗時只隱藏提示元件，不影響主要內容與導覽。

- 日期：2026-05-01
- ID：pr315-ci-coverage-lazy-mock-fix
- content_type：ci-fix
- topics：ratewise, vitest, coverage, lazy-loading
- keywords：test:coverage, React.lazy, AppLayout, CI teardown
- related_entries：pr315-ratewise-lazy-boundary-direction-review-fix
- 原因：GitHub Quality Checks 的 `pnpm test:coverage` 在 `AppLayout.safe-area.test.tsx` 結束後出現 Vitest teardown unhandled rejection；該測試只驗證 header safe-area，卻未 mock AppLayout 新增的 lazy 全域提示。
- 解法：在 safe-area layout 測試中補齊 OfflineIndicator、UpdatePrompt、RatingModal mock，讓測試隔離非目標 lazy 元件，避免 coverage 全量併發時留下未收斂的 lazy 任務。

- 日期：2026-05-01
- ID：pr315-noncritical-lazy-boundary-retry-fix
- content_type：review-fix
- topics：ratewise, pwa, lazy-loading, reliability
- keywords：React.lazy, error boundary, retry, online event, Layout
- related_entries：pr315-ratewise-lazy-boundary-direction-review-fix, pr315-ci-coverage-lazy-mock-fix
- 原因：PR #315 最新 review 指出兩個真問題：`Layout` 的 lazy 全域提示位於主要 `ErrorBoundary` 之外，chunk 載入失敗仍會升級成整頁錯誤；`AppLayout` 新增的非關鍵 lazy 邊界捕捉錯誤後沒有重置機制，暫時性離線或弱網會讓提示元件整個 session 永久消失。
- 解法：將非關鍵 lazy 錯誤邊界抽成共用元件，提供 `resetKey`、`online` 事件與 `attempt` render prop；重置時讓 `AppLayout` / `Layout` 重新建立 lazy component type，避免 React.lazy 快取已 reject 的 loader，並補上單元測試鎖定正常渲染、錯誤隔離、resetKey 重試與網路恢復重試。

- 日期：2026-05-02
- ID：ratewise-markdown-mirror-noindex-guard-2026-05-02
- 原因：正式站 `.md` mirrors 雖已正確回 `text/markdown` 並供 AI crawler 讀取，但未明確宣告 `noindex`，存在 mirror 與 canonical HTML 重複索引風險。
- 解法：依 Google Search Central 非 HTML `X-Robots-Tag` 規範，於 Cloudflare Worker v5.1 與 `_headers` 對直連 `.md` 補 `X-Robots-Tag: noindex`，同時以測試鎖定 markdown negotiation 不得誤傷 canonical URL 索引。

- 日期：2026-05-02
- ID：pr325-markdown-negotiation-noindex-inheritance-fix
- 原因：Codex P1 指出 markdown negotiation 會繼承上游 `.md` 的 `X-Robots-Tag: noindex`，導致 canonical URL 的 markdown 變體誤帶 noindex。
- 解法：在 Worker 的 markdown negotiation 分支明確刪除繼承而來的 `X-Robots-Tag`，並把測試改成模擬上游實際帶 `noindex` 的情況，鎖住這個回歸。

- 日期：2026-05-02
- ID：ratewise-mailto-crawlable-anchor-seo-fix
- 原因：第 2 輪 SEO iteration 發現 `/about/`、`/faq/` Lighthouse SEO 從 100→92，根因為 `MailtoLink` SSG 輸出 `<a>` 無 `href`（為避開 Cloudflare Email Obfuscation），觸發 `crawlable-anchors` 扣分。
- 解法：將 `MailtoLink` 改用 `<button type="button">` 取代 `<a>`，繼續無 `mailto:`/raw email SSG 輸出避開 CF 與 scraper，並補上 5 個 vitest 守門 button-only / 無 mailto / SSG label 等不變式。

- 日期：2026-05-03
- ID：ratewise-meta-description-google-snippet-extend
- 原因：Squirrel surface audit 顯示 `/ratewise/` meta description 96 字元（< 110 建議），Google SERP snippet 與 AI 摘要的可用語意密度不足。
- 解法：擴充 `DEFAULT_DESCRIPTION` 與 `SITE_CONFIG.description` 至 126 字元（雙 SSOT 同步），補入差異化定位（「台灣最精準匯率換算工具」）、四大特色（即時換算/現金即期/趨勢圖/PWA），維持品牌一致性與 verify:seo-docs SSOT alignment 通過。

- 日期：2026-05-04
- ID：tooling-vitest-4-test-script-jest-flag-removal
- 原因：root `package.json` 的 `test:unit` / `test:integration` 仍透過 `pnpm -r test --` 把 Jest flag 傳給 Vitest 4，造成 4 個 app（haotool/park-keeper/nihonname/quake-school 等）每次 SEO iteration 都報 `CACError: Unknown option`，使 R5/R6 orchestrator 「失敗 20 輪」與本地 `test:unit` 全失敗。
- 解法：移除 `--testPathIgnorePatterns` / `--testPathPattern`，e2e 隔離全部下放到各 app 的 `vitest.config.ts test.exclude`；integration 改為 `pnpm --filter @app/ratewise exec vitest run integration`，2660 unit + 8 integration tests 全綠。
