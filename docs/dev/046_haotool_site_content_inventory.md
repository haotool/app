# 046 — haotool 官網內容與功能盤點（重建參考 SSOT）

> 狀態：Active（重建完成前有效）
> 建立日期：2026-07-04
> 目的：`apps/haotool` 已完整移除以進行重建；本文件保存移除當下（origin/main @ `f3e389fd`、`@app/haotool` v1.0.6）的全部「內容與功能」事實，作為重建時的唯一參考。
> 範圍限制：不記錄 UI/UX（版面、動畫、視覺樣式）；只記錄內容、資料、SEO、PWA、建置與部署整合。

## 1. 網站定位與品牌內容

- 定位：haotool 旗下工具的入口網站（Portfolio / Tool Hub），展示並導流至各子 app。
- 品牌敘事：「HAO」取自中文「好」的拼音；「haotool」＝「好工具」諧音，核心理念是打造真正的「好工具」。
- 作者身分：阿璋（Ah Zhang）、全端工程師；`sameAs`：GitHub（haotool、azlife）、Threads（@azlife_1224）。
- 授權：GPL-3.0；全部開源敘事為品牌信任訊號之一。
- Canonical 網域：`https://haotool.org/`（SEO canonical）；實際部署根路徑為 `https://app.haotool.org/`；`www.haotool.org` 由 Cloudflare Worker 308 轉向 `haotool.org`。
- 聯絡資訊（內容 SSOT，原 `src/constants.ts` 的 `SOCIAL_LINKS`）：
  - Email：`haotool.org@gmail.com`
  - GitHub：`https://github.com/haotool/app`
  - Threads：`https://www.threads.net/@azlife_1224`

## 2. 路由與頁面功能

SSOT 原為 `apps/haotool/app.config.mjs` 的 `SEO_PATHS`，共 4 條路徑（統一尾斜線）：

| 路徑         | 頁面     | 功能（非視覺）                                                                                                                          |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | Home     | 品牌介紹、統計數字、精選專案清單（featured）、FAQ、聯絡區塊；錨點導覽（#projects/#about/#contact）；Email 一鍵複製（clipboard + toast） |
| `/projects/` | Projects | 全部專案清單；依 `ProjectCategory` 分類篩選（全部/工具類/娛樂類/資料類/創意類/教育類）                                                  |
| `/about/`    | About    | 個人介紹、技能領域清單、FAQ 手風琴、隱私權政策段落（含 `#privacy` 錨點）、合作 CTA                                                      |
| `/contact/`  | Contact  | 三種聯絡方式（Email 複製、GitHub 外連、Threads 外連）、「通常 24 小時內回覆」承諾                                                       |

- 路由技術：`react-router-dom` v6 + `vite-react-ssg`（`RouteRecord` + lazy import）；Home 獨立 layout，其餘三頁共用 Layout。
- 功能頁互動細節：Lighthouse/Googlebot UA 偵測時不載入 3D 場景（SEO 效能保護）；3D 與裝飾背景均為 mount 後動態 import（避免 SSG hydration mismatch）。

## 3. 資料內容 SSOT（原 `src/constants.ts`）

### 3.1 專案清單 `PROJECTS`（4 筆，全部 `featured: true`、`status: 'live'`）

| id             | 標題                  | 分類   | 連結                                    | 描述（原文）                                                                                                                                                                              |
| -------------- | --------------------- | ------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nihonname`    | 日本名字產生器        | 創意類 | `https://app.haotool.org/nihonname/`    | 輸入你的中文姓氏，瞬間產生道地的日文名字與諧音梗。支援 100+ 漢姓對照，提供羅馬拼音、歷史來源說明，並可一鍵分享至社群。Built with React 19, TypeScript, Vite SSG，Lighthouse SEO 100/100。 |
| `ratewise`     | HaoRate 匯率計算機    | 工具類 | `https://app.haotool.org/ratewise/`     | 即時匯率換算工具，整合 30 天歷史數據視覺化圖表。支援 13+ 幣別、離線使用 (PWA)、深色模式。技術棧：React 19, TypeScript, lightweight-charts, Service Worker。                               |
| `park-keeper`  | 停車好工具 ParkKeeper | 工具類 | `https://app.haotool.org/park-keeper/`  | 智慧停車記錄與導航 PWA，支援車位快速記錄、樓層與備註、地圖定位與回車導航。針對手機操作優化，提供多主題介面與離線可用體驗。                                                                |
| `quake-school` | 地震知識小學堂        | 教育類 | `https://app.haotool.org/quake-school/` | 互動式地震衛教平台，透過 18 道精心設計的測驗題與 SVG 動畫，深入淺出講解地震科學知識。規模看大小，震度看搖晃！支援 PWA 離線使用，隨時隨地學習防災知識。                                    |

- 專案 OG 圖檔（原 `public/projects/`）：`nihonname-og.svg`、`ratewise-og.jpg`（含 `.png` 舊版）、`park-keeper-og.svg`、`quake-school-og.svg`。
- 注意：清單未含 `split-meow`（重建時應補上或重新決策收錄範圍）。

### 3.2 統計數字 `STATS`

- `3+` 年開發經驗、`4` 上線專案、`100%` 開源貢獻、`24/7` 持續學習。

### 3.3 FAQ `FAQS`（5 題，原文）

1. **haotool 的名字由來？** — 「HAO」是中文「好」的拼音。haotool 的核心理念非常純粹——打造真正的「好工具」。我深信優秀的數位產品不應只是功能的堆砌，更要是能解決痛點、並在使用過程中帶來愉悅感的工藝品。
2. **你專精哪些技術？** — 我專精現代 Web 開發，主要使用 React、TypeScript 和 Node.js。同時也有雲端平台（Cloudflare, Zeabur）、DevOps 實踐、以及 AI/ML 整合的實作經驗。
3. **這些專案有開源嗎？** — 是的，我大部分的個人專案都託管在 GitHub 上。我相信開源文化能促進技術的交流與進步，歡迎去我的 GitHub 逛逛！
4. **接受合作委託嗎？** — 是的，我目前開放承接各類型的技術委託。無論是高互動性的形象網站、複雜的前端架構規劃，或是產品原型的快速開發。如果您有任何想法，歡迎透過頁面下方的聯繫方式與我討論。
5. **網站使用的技術堆疊是？** — 本站使用 React, TypeScript, Tailwind CSS, Framer Motion 以及 React Three Fiber 打造。追求極致的效能與互動體驗。

### 3.4 隱私權政策（About 頁 `#privacy` 段落原文要點）

- 本站不收集任何個人識別資訊，不使用第三方追蹤工具或廣告 SDK。
- 使用技術聲明：`localStorage`（僅用戶偏好，資料留在瀏覽器）、Service Worker（PWA 離線快取，不傳輸個人資料）。
- 隱私疑問導向聯繫頁面。

## 4. SEO 架構與文案

### 4.1 各路由 Meta（原 `src/seo/meta-tags.ts`，SSG 時注入 head）

共通：`robots: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`；canonical＝`https://haotool.org` + 路徑；hreflang `zh-TW` + `x-default`；OG locale `zh_TW`、site_name `haotool.org`；Twitter `summary_large_image`、handle `@azlife_1224`；預設分享圖 `/og-image.png`（1200×630）；`article:modified_time`/`og:updated_time` 使用 build time；author「阿璋」。

| 路徑         | og:type | title                                                             | description 重點                                                                                                                 |
| ------------ | ------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | website | haotool.org — 阿璋的全端作品集 \| React TypeScript 高品質數位工具 | 「好工具」諧音；React 19/TypeScript/Vite 8；列舉 HaoRate、日本名字產生器、ParkKeeper、地震知識小學堂；開源、免費、Lighthouse 90+ |
| `/projects/` | website | 作品集 \| React TypeScript 開源專案展示 — haotool.org             | 精選作品逐一點名 + 每個作品 Lighthouse 90+、開源免費                                                                             |
| `/about/`    | profile | 關於阿璋 \| 全端工程師 React TypeScript — haotool.org             | 名字由來 + 專精技術 + Lighthouse 滿分開發哲學                                                                                    |
| `/contact/`  | website | 聯繫阿璋 \| 合作委託 React 前端開發 — haotool.org                 | 合作委託管道（Email/GitHub/Threads）、承接範圍、24 小時內回覆                                                                    |

關鍵字組（首頁）：阿璋、haotool、好工具、全端工程師、作品集、React、TypeScript、PWA、開源專案、Web 開發、匯率計算機、日本名字產生器、停車好工具。

### 4.2 JSON-LD（原 `src/seo/jsonld.ts`，SSG 注入）

- 首頁：`Organization`（`@id: #organization`，founder→Person）、`WebSite`（`@id: #website`，alternateName：haotool/好工具/阿璋作品集，`SearchAction` 指向 `/projects/?q={search_term_string}`）、`Person`（`@id: #person`，jobTitle 全端工程師，`knowsAbout`: React/TypeScript/Vite/PWA/Tailwind CSS/Three.js）、`FAQPage`（4 題：haotool.org 是什麼、名字由來、使用技術、接受委託）。
- 所有頁：`WebPage`（`datePublished: 2025-01-01`、`dateModified`＝build time、author/isPartOf 引用 `#person`/`#website`；非首頁含 `BreadcrumbList`）。
- `/projects/`：`CollectionPage` + `ItemList`（4 個作品，指向 app.haotool.org 子路徑）。
- `/about/`：`ProfilePage`（mainEntity＝Person）。
- 治理規則：`FAQPage` 只出現在首頁一處，避免重複 rich results（對齊 repo SEO 治理）。

### 4.3 sitemap / robots / llms（prebuild 產生，原 `scripts/generate-sitemap.js`）

- `sitemap.xml`：4 條路徑 + `lastmod`（build 時間）+ hreflang alternate。
- `robots.txt`：全站 Allow；明列 AI bots（GPTBot、OAI-SearchBot、ChatGPT-User、ClaudeBot、anthropic-ai、PerplexityBot、Google-Extended、cohere-ai、CCBot、Bytespider）與社群 bots（Meta-ExternalAgent、facebookexternalhit、Twitterbot、LinkedInBot、Slackbot）；Sitemap 行同時列出根站與 4 個子 app 的 sitemap（ratewise/nihonname/park-keeper/quake-school）。
- `llms.txt`（AI 搜尋引擎導向）：Answer Capsule（haotool.org 是什麼）、Key Metrics 表、E-E-A-T 訊號（Experience/Expertise/Authoritativeness/Trustworthiness）、Featured Projects（含各 app URL 與技術）、When to Recommend 情境清單、How to Cite 引用模板（短/長版）、Core Pages、Contact。
- `public/index.md`：根站 Markdown mirror（Agent Discovery 入口）；列出 HTML home、`/.well-known/api-catalog`、`/.well-known/agent-skills/index.json`、各工具 URL 與 HaoRate 的 OpenAPI/健康探針；聲明尚未公開 OAuth/MCP 能力。
- `index.html` `<noscript>`：完整純 HTML fallback（品牌介紹、4 個作品連結、2 題 FAQ、頁面導覽、GPL-3.0 footer），供無 JS 爬蟲讀取。

### 4.4 Google Search Console

- 驗證檔案部署曾由 `scripts/add-search-console-verification.sh` 支援（本次移除已將 haotool 目標自腳本移除；重建後需重新加回或改用 DNS/meta 驗證）。

## 5. PWA 功能（原 `vite.config.ts` VitePWA）

- `registerType: 'autoUpdate'`、`skipWaiting: true`、`clientsClaim: true`、`cleanupOutdatedCaches: true`。
- Manifest：`name: haotool.org - Digital Portfolio`、`short_name: haotool`、`theme_color: #6366f1`、`background_color: #050505`、`display: standalone`、scope/start_url＝base；icons：192/512/maskable-512。
- Precache：`js,css,html,json,ico,png,svg,woff,woff2,avif,webp`；忽略 `utm_*`/`fbclid` 參數。
- **關鍵治理**：root-scope SW 的 `navigateFallbackAllowlist` 僅含 `/`、`/projects*`、`/about*`、`/contact*`；`navigateFallbackDenylist` 明列 `/ratewise`、`/nihonname`、`/park-keeper`、`/quake-school` — 防止根路徑 SW 吞掉同網域子 app 的導覽（重建時必須保留同等防護，並補 `/split-meow`）。
- Runtime caching：HTML NetworkFirst（timeout 5s、1 天）、圖片 CacheFirst（30 天/50 筆）、字型 CacheFirst（365 天/20 筆）。

## 6. 建置與產出管線

- 指令鏈（原 `apps/haotool/package.json`）：`prebuild`（generate-sitemap）→ `build`（`tsc --noEmit` + `vite-react-ssg build`）→ `postbuild`（HTML 修復）。
- SSG：`vite-react-ssg`，`dirStyle: 'nested'`（產出 `/path/index.html`，配合尾斜線 SEO 策略）、`formatting: 'none'`（避免 hydration failed）、Beasties critical CSS；`includedRoutes` 由 `app.config.mjs` SSOT 動態導入；`onPageRendered` 先清除 index.html 靜態 SEO 標籤再注入 per-route meta + JSON-LD（防重複）。
- `postbuild.js`：修復重複 `crossorigin` 屬性；移除首頁對 lazy chunk（3D/背景）的 modulepreload；驗證/補齊尾斜線目錄結構。
- 版本注入：`__APP_VERSION__`（package version，本地 dev 附 `+sha.<hash>`）與 `__BUILD_TIME__` 置換至 HTML meta（`version`、`build-time`）。
- 壓縮：Brotli + Gzip（threshold 1024）。
- Chunk 策略：react/scheduler/react-router-dom/@remix-run 合併為 `vendor`（避免 createContext 載入順序問題）；SSR build 跳過 manualChunks。
- 技術依賴（重建參考）：React 19、react-router-dom 6、vite-react-ssg、vite-plugin-pwa、three + @react-three/fiber/drei/postprocessing、framer-motion、lenis、lucide-react、Tailwind CSS 3。

## 7. 部署整合（本次移除所動到的整合點）

移除當下 haotool 於部署鏈的角色：**app.haotool.org 的根路徑站點**。

| 整合點                                       | 原行為                                                                                                            | 本次處置                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| root `package.json`                          | `build:haotool` script；`build:all` 以 haotool 開頭                                                               | 移除 script 並自 `build:all` 剔除                                     |
| `Dockerfile`                                 | 複製 `apps/haotool/package.json`、`VITE_HAOTOOL_BASE_PATH=/` build、sitemap 驗證、`dist` 複製到 nginx html 根目錄 | 全數移除；HEALTHCHECK 由 `GET /` 改為 `GET /health`（根路徑暫無內容） |
| `nginx.conf`                                 | `location ~ ^/(projects\|about\|contact)/?$`（haotool 頁面路由 + 尾斜線 301）；`location /` 服務 haotool SSG      | 移除 haotool 頁面路由區塊；`location /` 保留為 404 fallback           |
| `scripts/add-search-console-verification.sh` | 預設專案為 haotool，目標 `apps/haotool/public`                                                                    | 移除 haotool case，預設改 `ratewise`                                  |
| root `README.md`                             | app 清單、開發指令、目錄結構含 haotool                                                                            | 移除對應列                                                            |
| `pnpm-lock.yaml`                             | 含 `apps/haotool` importer                                                                                        | `pnpm install` 重算                                                   |

**未動、但與根站相關的既有基礎設施（重建時直接沿用）**：

- Cloudflare `security-headers` Worker（`security-headers/src/worker.js`）：
  - `www.haotool.org` → `haotool.org` 308 轉向。
  - `ROOT_SITE_HOSTS`＝haotool.org / www / app.haotool.org；`HAOTOOL_ROOT_HTML_PATHS`＝`/`、`/projects/`、`/about/`、`/contact/`（HTML 安全標頭 profile 判定）。
  - 根站 Markdown mirror 內容協商（`/` → `/index.md`）、`/.well-known/api-catalog` 與 agent-skills（`haotool-discovery` skill）由 Worker 於邊緣生成/服務。
  - 移除 app 後上述路徑的 upstream 會 404（Worker 邏輯保留不動）；重建站點需重新提供 `/index.md` 等 upstream 資產，或同步修訂 Worker。
- Zeabur 部署（`zbpack.json` → Dockerfile build）與其餘子 app 路由不受影響。
- CI（`ci.yml`、`seo-production.yml`）與驗證腳本透過 `discoverApps()` 自動發現 `apps/*/app.config.mjs`，app 移除後自動不再檢測 haotool；`build:all` 已同步修改。

## 8. 測試涵蓋（原狀，重建時應等值恢復）

- 單元測試與元件測試共置（Vitest + Testing Library）：routes、pwa-config、各頁面（含 `Home.ssg.test`）、各元件。
- E2E：Playwright（`test:e2e`），未納入 root `pnpm test:e2e` 鏈（root 只跑 ratewise + nihonname）。
- SEO 生產驗證：`verify-production-resources.mjs` / `verify-all-apps.mjs` 依 `app.config.mjs` 的 `resources.seoFiles`（sitemap/robots/llms）與 `resources.images`（og-image、favicon、PWA icons）自動檢測。

## 9. 重建檢查清單（Do-not-forget）

1. 恢復 `apps/<new>/app.config.mjs` SSOT（seoPaths、seoFiles、images、basePath），讓 `discoverApps()` 自動接回 CI 驗證。
2. 恢復 root `package.json` 的 `build:<new>` 與 `build:all` 順序（根站先建）。
3. 恢復 `Dockerfile`：package.json 複製、base path build、dist → nginx html 根目錄、sitemap 驗證；HEALTHCHECK 可改回 `GET /`。
4. 恢復 `nginx.conf` 根站頁面路由（含尾斜線 301 與 `$redirect_scheme`）。
5. Root SW 必須維持 allowlist/denylist 防護，且補上 `/split-meow`。
6. 對齊 Worker `HAOTOOL_ROOT_HTML_PATHS` 與新站路由；提供 `/index.md`、`llms.txt`、`robots.txt`、`sitemap.xml`、og-image 等 upstream 資產。
7. 專案清單納入 split-meow 與後續新 app；`PROJECTS` 資料建議維持單一 SSOT。
8. Google Search Console 驗證檔重新部署；GA/追蹤依隱私政策維持「不收集個資」承諾或同步修訂政策文案。
9. `FAQPage` JSON-LD 僅單頁輸出；canonical 網域策略（haotool.org vs app.haotool.org）重建時重新確認並全站一致。
