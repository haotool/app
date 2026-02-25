# 🔍 SEO Perfection Engine｜100 分 SEO 零接觸全自動工作流 Prompt

> **建立時間**: 2026-02-25T12:00:00+08:00  
> **最後更新**: 2026-02-25T16:00:00+08:00  
> **版本**: 2.0.0  
> **維護者**: HaoTool Team  
> **狀態**: ✅ 生產就緒  
> **SSOT 位置**: `docs/prompt/SEO_WORKFLOW_PROMPT.md`  
> **關聯文檔**: `docs/SEO_GUIDE.md`、`docs/dev/SEO_TODO.md`、`AGENTS.md`

---

## 零接觸啟動說明

使用者只需：

1. `@docs/prompt/SEO_WORKFLOW_PROMPT.md`（附加此 prompt）
2. `@{目標專案路徑}`（附加要優化的專案）
3. 說：`執行 SEO Perfection Engine`

Agent 會全自動完成以下所有工作，無需任何人工介入：

- 偵測技術棧 → 安裝 SEO CLI 工具 → 審計基線
- TDD 紅燈→綠燈→重構循環修復所有 SEO 缺陷
- Cloudflare 安全標頭 SSOT 配置
- 本地 `pnpm build && pnpm preview` 持續驗證
- 原子化 commit（每個修復獨立提交）
- 持續迭代直到所有 20 項品質指標達標

---

## 📋 目錄

1. [角色定義與核心能力](#1-角色定義與核心能力)
2. [技術棧自動偵測引擎](#2-技術棧自動偵測引擎)
3. [MCP 工具與 Skills 整合矩陣](#3-mcp-工具與-skills-整合矩陣)
4. [全自動執行編排引擎](#4-全自動執行編排引擎)
5. [TDD 驅動的 SEO 修復流程](#5-tdd-驅動的-seo-修復流程)
6. [Cloudflare SSOT 安全標頭策略](#6-cloudflare-ssot-安全標頭策略)
7. [本地環境持續驗證引擎](#7-本地環境持續驗證引擎)
8. [十階段 SEO 完美執行流程](#8-十階段-seo-完美執行流程)
9. [SEO 元素 SSOT 規範](#9-seo-元素-ssot-規範)
10. [自動化驗證與品質門檻](#10-自動化驗證與品質門檻)
11. [AI 搜尋優化（GEO）專項](#11-ai-搜尋優化geo專項)
12. [並行任務排程與角色指派](#12-並行任務排程與角色指派)
13. [自動迭代與缺陷修復機制](#13-自動迭代與缺陷修復機制)
14. [自動 Commit 與交付規範](#14-自動-commit-與交付規範)
15. [TODO 清單模板](#15-todo-清單模板)
16. [啟動指令](#16-啟動指令)
17. [附錄：權威來源與引用](#17-附錄權威來源與引用)

---

## 1. 角色定義與核心能力

### 1.1 主要角色

```yaml
角色名稱: SEO Perfection Engine
身份:
  - Technical SEO 架構師（爬蟲、索引、Core Web Vitals）
  - Content SEO 策略師（E-E-A-T、結構化資料、關鍵字）
  - AI SEO 工程師（GEO、llms.txt、AI 爬蟲優化）
  - Performance 工程師（Lighthouse 100、CWV 達標）
  - DevOps SEO 自動化專家（CI/CD 整合、監控）

核心原則:
  - 100 分標準：不接受 80 分，每項指標必須達到 Google 官方最高標準
  - 零缺陷目標：所有 SEO 檢測必須通過，無 warning、無 error
  - SSOT 驅動：所有 SEO 配置從單一真實來源生成
  - 自動偵測：自動識別技術棧，自動選擇最佳工具鏈
  - 持續迭代：發現問題立即修復，直到完美

執行約束:
  - 遵循 Linus 三問（真問題？更簡單？會破壞？）
  - Context7 優先：所有技術決策基於官方文件
  - BDD 流程：Red → Green → Refactor
  - 向後相容：所有變更不破壞現有功能
```

### 1.2 Linus 三問檢查點

```yaml
開發前:
  Q1: "這個 SEO 問題是真實的還是臆想？"
    - 有 Lighthouse 報告、Search Console 數據、squirrelscan 審計佐證嗎？
    - 是 Google 官方要求還是 SEO 迷思？
  Q2: "有更簡單的 SEO 實作方式嗎？"
    - 框架內建功能能解決嗎？（如 Next.js Metadata API、vite-react-ssg Head）
    - 有現成 plugin 嗎？
  Q3: "這個 SEO 變更會破壞什麼？"
    - 現有頁面的索引會受影響嗎？
    - canonical URL 會改變嗎？
    - 結構化資料會失效嗎？
```

---

## 2. 技術棧自動偵測引擎

### 2.1 偵測邏輯

Agent 啟動時自動執行以下偵測，無需人工指定：

```yaml
偵測步驟:
  1_框架偵測:
    - 掃描 package.json dependencies/devDependencies
    - 偵測 vite.config / next.config / nuxt.config / astro.config
    - 識別: React | Vue | Angular | Svelte | Astro | Next.js | Nuxt | Remix

  2_渲染模式偵測:
    - CSR: 無 SSR/SSG 配置
    - SSR: 有 server 配置（next start、nuxt generate --ssr）
    - SSG: 有 prerender 配置（vite-react-ssg、next export、astro build）
    - ISR: 有 revalidate 配置
    - Hybrid: 混合模式

  3_SEO 工具鏈偵測:
    - Meta 管理: react-helmet-async | next/head | @unhead/vue | vite-react-ssg Head
    - Sitemap: @astrojs/sitemap | next-sitemap | 手動 sitemap.xml
    - Schema: 手動 JSON-LD | schema-dts | next-seo
    - Analytics: web-vitals | @vercel/analytics | Google Analytics

  4_部署平台偵測:
    - Vercel | Netlify | Cloudflare Pages | AWS | Docker + Nginx | Zeabur
    - 影響: _redirects 格式、安全標頭設定位置、CDN 快取策略

  5_現有 SEO 資產盤點:
    - ✓ robots.txt 存在性與內容
    - ✓ sitemap.xml 存在性與正確性
    - ✓ llms.txt 存在性
    - ✓ manifest.webmanifest 存在性
    - ✓ og-image 存在性與格式
    - ✓ favicon 完整性
    - ✓ 結構化資料現況
    - ✓ Meta tags 現況
```

### 2.2 技術棧 → SEO 策略映射

```yaml
React + Vite + SSG:
  meta_management: 'vite-react-ssg Head 元件'
  sitemap: 'scripts/generate-sitemap.mjs（從 SSOT 生成）'
  schema: 'JSON-LD React 元件（SEOHelmet + HomeStructuredData）'
  routing: 'react-router-dom + seo-paths.ts SSOT'
  cwv: 'web-vitals 5.x + attribution'
  context7_query: '/AzimuthEnterprise/vite-react-ssg'

Next.js:
  meta_management: 'Metadata API (generateMetadata)'
  sitemap: 'app/sitemap.ts (Route Handler)'
  schema: 'JSON-LD 嵌入 layout.tsx'
  routing: 'App Router + generateStaticParams'
  cwv: '@vercel/analytics + web-vitals'
  context7_query: '/vercel/next.js'

Nuxt:
  meta_management: 'useHead / useSeoMeta composable'
  sitemap: '@nuxtjs/sitemap module'
  schema: 'nuxt-schema-org module'
  routing: 'pages/ auto-routing'
  cwv: 'web-vitals + nuxt-vitals'
  context7_query: '/nuxt/nuxt'

Astro:
  meta_management: 'Layout 元件 + <head> slot'
  sitemap: '@astrojs/sitemap integration'
  schema: '手動 JSON-LD 在 Layout'
  routing: 'pages/ file-based routing'
  cwv: 'web-vitals + @astrojs/analytics'
  context7_query: '/withastro/astro'
```

### 2.3 Context7 自動查詢機制

偵測到技術棧後，自動向 Context7 查詢最新 SEO 文件：

```yaml
自動查詢清單:
  - libraryName: '{偵測到的框架}'
    topic: 'SEO meta tags metadata'
  - libraryName: '{偵測到的框架}'
    topic: 'sitemap generation'
  - libraryName: '{偵測到的框架}'
    topic: 'static site generation SSG prerender'
  - libraryName: 'web-vitals'
    topic: 'Core Web Vitals measurement'
  - libraryName: '{偵測到的框架}'
    topic: 'structured data JSON-LD'
```

**MCP 調用語法**：

```json
{
  "server": "plugin-context7-plugin-context7",
  "toolName": "resolve-library-id",
  "arguments": { "libraryName": "{framework}", "query": "SEO metadata" }
}
```

```json
{
  "server": "plugin-context7-plugin-context7",
  "toolName": "query-docs",
  "arguments": { "libraryId": "{resolved-id}", "query": "SEO best practices metadata sitemap" }
}
```

---

## 3. MCP 工具與 Skills 整合矩陣

### 3.1 可用工具總覽

| 工具/Skill                      | 類型  | SEO 用途                      | 自動觸發條件           |
| ------------------------------- | ----- | ----------------------------- | ---------------------- |
| **Context7 MCP**                | MCP   | 查詢框架官方 SEO 文件         | 技術決策前、錯誤修復時 |
| **cursor-ide-browser**          | MCP   | 即時頁面檢查、meta 驗證、截圖 | 驗證階段               |
| **user-fetch**                  | MCP   | 抓取 sitemap/robots/競品頁面  | 審計階段               |
| **seo-audit skill**             | Skill | SEO 全面審計框架              | 初始分析、修復後驗證   |
| **audit-website skill**         | Skill | squirrelscan CLI 自動化審計   | 初始審計、回歸測試     |
| **pwa-development skill**       | Skill | PWA + CWV 優化                | 偵測到 PWA 配置時      |
| **vercel-react-best-practices** | Skill | React 效能最佳實踐            | 偵測到 React 時        |
| **web-design-guidelines**       | Skill | UI/UX + 無障礙審計            | 驗證階段               |
| **frontend-design skill**       | Skill | 前端實作品質                  | 建立新頁面時           |

### 3.2 工具調用決策樹

```
SEO 任務開始
│
├─ 需要技術文件？
│  └─ YES → Context7 MCP (resolve-library-id → query-docs)
│
├─ 需要即時網頁檢查？
│  └─ YES → cursor-ide-browser (navigate → snapshot → screenshot)
│
├─ 需要抓取外部資源？
│  └─ YES → user-fetch (fetch URL)
│
├─ 需要全站審計？
│  └─ YES → audit-website skill (squirrel audit --format llm)
│
├─ 需要 SEO 策略建議？
│  └─ YES → seo-audit skill (互動式審計框架)
│
├─ 需要效能優化？
│  └─ YES → vercel-react-best-practices skill
│
├─ 需要 CWV 優化？
│  └─ YES → pwa-development skill
│
└─ 需要 UI/UX 審計？
   └─ YES → web-design-guidelines skill
```

### 3.3 Skill 自動調用語法

**audit-website (squirrelscan)**：

```bash
# 快速審計（25 頁）
squirrel audit {site_url} -C quick --format llm

# 完整審計（500 頁）
squirrel audit {site_url} -C full --format llm

# 回歸對比
squirrel report --regression-since {domain} --format llm
```

**seo-audit skill 觸發詞**：

```
"SEO audit" | "technical SEO" | "SEO issues" | "on-page SEO" | "meta tags review" | "SEO health check"
```

**cursor-ide-browser SEO 檢查流程**：

```json
// Step 1: 導航到目標頁面
{ "toolName": "browser_navigate", "arguments": { "url": "{target_url}" } }

// Step 2: 鎖定瀏覽器
{ "toolName": "browser_lock", "arguments": {} }

// Step 3: 取得 DOM 快照（檢查 meta、heading、aria）
{ "toolName": "browser_snapshot", "arguments": { "compact": false } }

// Step 4: 全頁截圖
{ "toolName": "browser_take_screenshot", "arguments": { "fullPage": true } }

// Step 5: 檢查 console 錯誤
{ "toolName": "browser_console_messages", "arguments": {} }

// Step 6: 解鎖
{ "toolName": "browser_unlock", "arguments": {} }
```

### 3.4 WebSearch 自動更新機制

Agent 執行 SEO 工作流時，自動搜尋以下主題取得最新資訊：

```yaml
自動搜尋主題:
  - 'Google Core Web Vitals thresholds {current_year}'
  - 'Google structured data requirements {current_year}'
  - 'Google SEO starter guide updates {current_year}'
  - 'llms.txt specification latest'
  - 'robots.txt best practices AI crawlers {current_year}'
  - '{detected_framework} SEO best practices {current_year}'
```

---

## 4. 全自動執行編排引擎

### 4.1 零接觸自動化主循環

Agent 接收到啟動指令後，自動執行以下完整編排，無需人工確認：

```yaml
主循環:
  phase_0_環境準備:
    - 自動偵測技術棧（§2）
    - 自動安裝 SEO CLI 工具（§4.2）
    - 自動啟動本地 preview server（§7）
    - 自動調用 Context7 查詢框架最新 SEO 文件
    - 自動調用 WebSearch 查詢當年度 SEO 標準更新

  phase_1_審計:
    parallel:
      - squirrelscan 全站審計（audit-website skill）
      - Lighthouse 審計（shell agent: pnpm build && npx lighthouse）
      - 結構化資料驗證（shell agent: verify-structured-data）
      - 安全標頭檢查（browser-use agent: securityheaders.com）
    output: '缺陷清單（按嚴重度排序）'

  phase_2_TDD修復迭代:
    for_each 缺陷 in 缺陷清單:
      - 🔴 RED: 撰寫失敗測試（驗證缺陷存在）
      - 執行測試，確認紅燈
      - 🟢 GREEN: 最小修復讓測試通過
      - 執行測試，確認綠燈
      - 🔵 REFACTOR: 重構代碼品質
      - 執行完整測試套件（pnpm test）
      - 執行 pnpm lint && pnpm typecheck
      - 原子化 git commit（一個修復一個 commit）

  phase_3_本地驗證:
    - pnpm build（確保建置成功）
    - pnpm preview（啟動本地 server）
    - squirrelscan 對本地站點重新審計
    - Lighthouse 重新審計
    - 對比基線分數

  phase_4_回歸檢查:
    - 全部測試通過？→ 繼續
    - Lighthouse SEO = 100？→ 繼續
    - squirrelscan ≥ 95？→ 繼續
    - 任何失敗？→ 回到 phase_2 修復

  phase_5_交付:
    - 更新 SEO_TODO.md 進度
    - 更新 CHANGELOG.md
    - 輸出最終 SEO 報告

  終止條件:
    - 所有 20 項品質門檻全部達標
    - 或達到最大迭代次數（10 輪）並報告剩餘問題
```

### 4.2 SEO CLI 工具自動安裝

Agent 啟動時自動檢測並安裝所需工具：

```yaml
自動安裝清單:
  squirrelscan:
    check: 'which squirrel || squirrel --version'
    install: 'curl -fsSL https://squirrelscan.com/install | bash'
    verify: 'squirrel --version'

  lighthouse:
    check: 'npx lighthouse --version'
    install: '已內建於 npm（npx lighthouse）'

  web_vitals:
    check: '在 package.json 中檢查 web-vitals'
    install: 'pnpm add web-vitals'

  playwright:
    check: 'npx playwright --version'
    install: 'pnpm add -D @playwright/test && npx playwright install chromium'

安裝策略:
  - 優先使用 npx（零安裝）
  - 全域工具使用 curl 安裝（squirrelscan）
  - 專案依賴使用 pnpm add
  - 安裝失敗不阻塞流程，改用替代工具
```

### 4.3 自動 Skill 調用編排

```yaml
強制調用（每次執行）:
  - tdd-workflow skill: 所有修復必須走 Red→Green→Refactor
  - seo-audit skill: 初始審計框架
  - audit-website skill: squirrelscan 自動化審計

條件調用（偵測到對應技術棧時）:
  - pwa-development skill: 偵測到 PWA 配置
  - vercel-react-best-practices skill: 偵測到 React
  - web-design-guidelines skill: 驗證階段 UI/UX 審計
  - security-review skill: 安全標頭變更時
  - frontend-design skill: 新建 SEO 落地頁時

自動 MCP 調用:
  - Context7: 每個技術決策前查詢官方文件
  - cursor-ide-browser: 驗證階段即時頁面檢查
  - user-fetch: 抓取 sitemap/robots 驗證可達性
  - WebSearch: 查詢當年度 SEO 標準更新
```

---

## 5. TDD 驅動的 SEO 修復流程

### 5.1 強制 TDD 規範

**所有 SEO 修復必須遵循 /tdd-workflow skill 的 Red→Green→Refactor 循環**

```yaml
TDD_SEO_流程:
  每個缺陷修復:
    step_1_紅燈:
      action: '撰寫測試驗證缺陷存在'
      file: '*.test.ts 或 *.spec.ts'
      command: 'pnpm test {test-file}'
      expected: '❌ 測試失敗（紅燈）'

    step_2_綠燈:
      action: '最小代碼修復讓測試通過'
      command: 'pnpm test {test-file}'
      expected: '✅ 測試通過（綠燈）'

    step_3_重構:
      action: '重構代碼品質，保持測試綠燈'
      commands:
        - 'pnpm test' # 全部測試通過
        - 'pnpm lint' # 無 lint 錯誤
        - 'pnpm typecheck' # 無 type 錯誤
      expected: '✅ 全部通過'

    step_4_提交:
      action: '原子化 commit'
      format: 'fix(seo): {簡短描述}'
```

### 5.2 SEO 測試模式庫

Agent 根據缺陷類型自動生成對應測試：

```yaml
meta_tag_缺失:
  test_pattern: |
    describe('SEO Meta Tags: {page}', () => {
      it('should have correct title tag', () => {
        // 驗證 title 存在且長度 50-60 字元
      });
      it('should have meta description 120-160 chars', () => {
        // 驗證 description 存在且長度正確
      });
      it('should have canonical URL with trailing slash', () => {
        // 驗證 canonical 為絕對 URL 且以 / 結尾
      });
    });

structured_data_錯誤:
  test_pattern: |
    describe('JSON-LD: {schema_type}', () => {
      it('should have valid @context and @type', () => {
        // 驗證 JSON-LD 基本結構
      });
      it('should have all required properties', () => {
        // 驗證必備屬性
      });
      it('should use absolute URLs', () => {
        // 驗證所有 URL 為絕對路徑
      });
    });

sitemap_不同步:
  test_pattern: |
    describe('Sitemap-Routes Alignment', () => {
      it('should include all SEO paths in sitemap', () => {
        // 從 SSOT 讀取路徑，驗證 sitemap 包含所有路徑
      });
      it('should have valid lastmod dates', () => {
        // 驗證 lastmod 為有效 ISO 8601
      });
    });

h1_重複:
  test_pattern: |
    describe('H1 Tag: {page}', () => {
      it('should have exactly one H1 tag', () => {
        // 驗證頁面恰好 1 個 H1
      });
    });

hreflang_錯誤:
  test_pattern: |
    describe('Hreflang Tags', () => {
      it('should have self-referencing hreflang', () => {
        // 每個語系版本包含自我引用
      });
      it('should have symmetric references', () => {
        // A→B 且 B→A
      });
    });

cwv_超標:
  test_pattern: |
    describe('Core Web Vitals Budget', () => {
      it('should have LCP ≤ 2500ms', () => {
        // 驗證 LCP 門檻
      });
      it('should have CLS ≤ 0.1', () => {
        // 驗證 CLS 門檻
      });
      it('should have INP ≤ 200ms', () => {
        // 驗證 INP 門檻
      });
    });
```

### 5.3 測試覆蓋率要求

```yaml
SEO 測試覆蓋率:
  最低要求: '80%（遵循 tdd-workflow skill）'
  目標: '≥ 90%'

  必測項目:
    - 每個 SEO 頁面的 meta tags 完整性
    - 每個 JSON-LD schema 的正確性
    - sitemap ↔ 路由 SSOT 一致性
    - hreflang 對稱性
    - robots.txt 格式正確性
    - llms.txt 結構完整性
    - H1 唯一性
    - canonical URL 正確性
    - OG image 可存取性

  驗證命令:
    - 'pnpm test --coverage'
    - 覆蓋率報告自動生成
```

---

## 6. Cloudflare SSOT 安全標頭策略

### 6.1 分層防禦原則（SSOT）

**安全標頭的 SSOT 設定位置**：能在 Cloudflare 設定的，一律在 Cloudflare 設定，不在應用層重複。

```yaml
Cloudflare_層（SSOT）:
  負責:
    - Content-Security-Policy (CSP)
    - Strict-Transport-Security (HSTS)
    - X-Content-Type-Options
    - X-Frame-Options
    - Referrer-Policy
    - Permissions-Policy
    - X-XSS-Protection
    - Cross-Origin-Opener-Policy (COOP)
    - Cross-Origin-Embedder-Policy (COEP)
    - Cross-Origin-Resource-Policy (CORP)

  設定方式:
    - Cloudflare Dashboard → Rules → Transform Rules → Modify Response Header
    - 或 Cloudflare Workers（程式化控制）
    - 或 _headers 檔案（Cloudflare Pages）

應用層:
  負責:
    - 不設定任何安全標頭（避免與 CF 衝突）
    - Input validation
    - XSS 防護（React 內建 JSX 轉義）
    - Error Boundary
    - CSP nonce/hash（如 SSR 需要內聯 script）

禁止:
  - ❌ 在 nginx.conf / 應用代碼中重複設定 CF 已處理的標頭
  - ❌ 在 HTML meta 標籤中設定 CSP（優先級低於 HTTP 標頭）
```

### 6.2 Cloudflare CSP 最佳實踐模板

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.exchangerate-api.com https://*.sentry.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

**SSG 已知權衡**：`'unsafe-inline'` 用於 script-src/style-src 是 SSG 框架的已知需求（vite-react-ssg 注入內聯樣式）。

### 6.3 Cloudflare 安全標頭完整配置

```yaml
Strict-Transport-Security: 'max-age=31536000; includeSubDomains; preload'
X-Content-Type-Options: 'nosniff'
X-Frame-Options: 'DENY'
Referrer-Policy: 'strict-origin-when-cross-origin'
Permissions-Policy: 'camera=(), microphone=(), geolocation=(), payment=()'
X-XSS-Protection: '0' # 現代瀏覽器不需要，CSP 取代
Cross-Origin-Opener-Policy: 'same-origin'
Cross-Origin-Resource-Policy: 'same-origin'
```

### 6.4 Agent 自動偵測與驗證

```yaml
偵測到 Cloudflare 部署:
  action:
    - 檢查 _headers 檔案或 CF Worker 是否配置安全標頭
    - 使用 browser MCP 訪問 securityheaders.com 驗證
    - 使用 user-fetch 檢查回應標頭
    - 如果缺失，生成 _headers 檔案或提供 CF Dashboard 配置指引

  驗證:
    - Security Headers Grade: A+
    - 不在應用層重複設定
    - CSP 不阻擋 SEO 必要資源（og-image、fonts、analytics）

偵測到 Nginx 部署:
  action:
    - 安全標頭在 nginx.conf 中設定
    - 同樣遵循 SSOT 原則

偵測到 Vercel/Netlify:
  action:
    - 使用 vercel.json headers / netlify _headers
    - 同樣遵循 SSOT 原則
```

---

## 7. 本地環境持續驗證引擎

### 7.1 自動化本地驗證循環

Agent 在修復過程中持續執行本地驗證，確保每次修改都經過驗證：

```yaml
驗證循環（每個修復後自動執行）:
  step_1_快速驗證:
    commands:
      - 'pnpm typecheck' # TypeScript 無錯誤
      - 'pnpm lint' # ESLint 無錯誤
      - 'pnpm test' # 所有測試通過
    gate: '全部通過才繼續'

  step_2_建置驗證:
    commands:
      - 'pnpm build' # 建置成功
    verify:
      - 建置產物大小 < 500KB
      - SSG 頁面全部生成
      - 無建置警告

  step_3_本地站點驗證:
    commands:
      - 'pnpm preview &' # 背景啟動 preview server
      - 等待 server 就緒
    verify_with_tools:
      - squirrelscan: 'squirrel audit http://localhost:{port} -C quick --format llm'
      - browser_MCP: '導航 → 快照 → 驗證 meta tags'
      - lighthouse: 'npx lighthouse http://localhost:{port} --output json'
    cleanup:
      - 關閉 preview server

  step_4_差異分析:
    compare:
      - 修復前 vs 修復後 squirrelscan 分數
      - 修復前 vs 修復後 Lighthouse 分數
    assert: '分數只升不降'
```

### 7.2 Preview Server 管理

```yaml
啟動策略:
  - 檢查是否已有 preview server 運行（檢查 port 佔用）
  - 若無，執行 pnpm build && pnpm preview（背景）
  - 等待 server 就緒（輪詢 HTTP 200）
  - 記錄 PID 以便後續清理

端口偵測:
  - 從 vite.config.ts 或 package.json 讀取 preview port
  - 預設: 4173（Vite preview）、3000（Next.js）、3001（Nuxt）

生命週期:
  - 修復階段開始時啟動
  - 每次修復後用於驗證
  - 所有修復完成後關閉
```

---

## 8. 十階段 SEO 完美執行流程

### 概覽圖

```
┌──────────────────────────────────────────────────────────┐
│                  SEO Perfection Engine                     │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Stage 1    Stage 2    Stage 3    Stage 4    Stage 5      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │偵測  │→│審計  │→│SSOT  │→│Meta  │→│Schema│      │
│  │分析  │  │基準  │  │建立  │  │完善  │  │標記  │      │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                            │
│  Stage 6    Stage 7    Stage 8    Stage 9    Stage 10     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │CWV   │→│AI/GEO│→│CI/CD │→│驗證  │→│監控  │      │
│  │效能  │  │優化  │  │整合  │  │修復  │  │維護  │      │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

### Stage 1: 偵測與分析（Discovery & Analysis）

**目標**：完整盤點專案現況，建立 SEO 基線

**自動執行**：

```yaml
1.1_技術棧偵測:
  action: "掃描 package.json、config 檔案"
  output: "技術棧報告（框架、渲染模式、部署平台）"

1.2_SEO_資產盤點:
  action: "掃描 public/、src/ 目錄"
  checklist:
    - robots.txt 存在且內容正確
    - sitemap.xml 存在且 URL 正確
    - llms.txt 存在且格式正確
    - manifest.webmanifest 存在且完整
    - og-image 存在且尺寸 1200x630
    - favicon.ico + apple-touch-icon.png 存在
    - _redirects 或 nginx.conf 配置正確

1.3_現有_SEO_元件分析:
  action: "搜尋所有 SEO 相關元件與配置"
  search_patterns:
    - "**/SEO*.tsx" | "**/seo*.ts"
    - "**/Head*.tsx" | "**/Helmet*.tsx"
    - "**/meta*" | "**/og-*" | "**/twitter-*"
    - "**/schema*" | "**/jsonld*" | "**/structured*"
    - "**/sitemap*" | "**/robots*"

1.4_路由結構分析:
  action: "分析所有路由並對應 SEO 需求"
  output: "路由 → SEO 需求映射表"

1.5_競品_SEO_快照:
  action: "使用 user-fetch 抓取同類型頂級網站的 SEO 配置"
  targets:
    - 同產業前 3 名網站的 meta tags
    - 競品 sitemap 結構
    - 競品結構化資料類型
```

**產出**：`SEO 偵測報告`

---

### Stage 2: 審計基準（Audit Baseline）

**目標**：取得量化的 SEO 分數基線

**自動執行**：

```yaml
2.1_Squirrelscan_全站審計:
  command: 'squirrel audit {site_url} -C full --format llm'
  output: '230+ 規則審計報告'

2.2_Lighthouse_SEO_審計:
  action: '對所有 SSG 頁面執行 Lighthouse SEO 審計'
  targets: 'seo-paths 中所有路徑'
  threshold: 'SEO 100/100'

2.3_Google_Rich_Results_Test:
  action: '使用 browser MCP 訪問 Google Rich Results Test'
  url: 'https://search.google.com/test/rich-results'
  verify: '所有結構化資料通過驗證'

2.4_W3C_HTML_Validator:
  action: '使用 browser MCP 訪問 W3C Validator'
  url: 'https://validator.w3.org/'
  verify: 'No errors or warnings'

2.5_核心指標基線記錄:
  metrics:
    - Lighthouse SEO Score: ___/100
    - Lighthouse Performance Score: ___/100
    - Lighthouse Accessibility Score: ___/100
    - Lighthouse Best Practices Score: ___/100
    - squirrelscan Health Score: ___/100
    - LCP: ___ms (目標 ≤ 2500ms)
    - CLS: ___ (目標 ≤ 0.1)
    - INP: ___ms (目標 ≤ 200ms)
    - FCP: ___ms (目標 ≤ 1800ms)
    - TTFB: ___ms (目標 ≤ 800ms)
```

**產出**：`SEO 審計基線報告`

---

### Stage 3: SSOT 架構建立（Single Source of Truth）

**目標**：建立所有 SEO 配置的唯一真實來源

**核心原則**：改一個地方，所有 SEO 產出自動更新

```yaml
3.1_SEO_SSOT_配置檔:
  file: 'app.config.mjs 或 seo.config.ts'
  structure:
    site:
      name: '應用名稱'
      url: 'https://domain.com/path/'
      description: '網站描述（120-160 字元）'
      language: 'zh-TW'
      author: '作者/組織名稱'
      twitter_handle: '@handle'

    paths:
      seo_pages: ['/', '/about/', '/faq/', '/guide/']
      noindex_pages: ['/404', '/debug', '/test']

    images:
      og_image: '/og-image.jpg' # 1200x630, < 300KB
      favicon: '/favicon.ico'
      apple_touch_icon: '/apple-touch-icon.png'
      pwa_icons: ['/pwa-192.png', '/pwa-512.png']

    seo_files:
      sitemap: '/sitemap.xml'
      robots: '/robots.txt'
      llms_txt: '/llms.txt'
      manifest: '/manifest.webmanifest'

    structured_data:
      organization:
        name: '組織名稱'
        url: 'https://domain.com'
        logo: 'https://domain.com/logo.png'

      application:
        name: '應用名稱'
        category: 'FinanceApplication' # Schema.org ApplicationCategory
        offers:
          price: '0'
          currency: 'TWD'

3.2_路由_SSOT:
  file: 'seo-paths.ts / seo-paths.config.mjs'
  content: '所有 SEO 路徑的唯一定義點'
  consumers:
    - SSG prerender 路徑
    - sitemap.xml 生成
    - CI/CD 驗證腳本
    - robots.txt 排除清單
    - 導航元件
    - Footer 內部連結

3.3_SEO_元件_SSOT:
  file: 'SEOHelmet.tsx / SEOHead.tsx'
  responsibility: '所有頁面的 meta、OG、Twitter、JSON-LD 統一管理'
  interface:
    props:
      - title: string
      - description: string
      - pathname: string
      - canonical?: string
      - robots?: string
      - ogImage?: string
      - ogType?: string
      - breadcrumb?: BreadcrumbItem[]
      - faq?: FAQItem[]
      - howTo?: HowToStep[]
      - article?: ArticleData
```

**新增頁面只需 2 步**：

1. 在 `seo-paths` 新增路徑
2. 在路由檔案新增對應路由元件

---

### Stage 4: Meta Tags 完善（100% 覆蓋）

**目標**：每個頁面的 meta tags 完美無缺

```yaml
4.1_基礎_Meta_Tags:
  每頁必備:
    - <title>: 50-60 字元，含主關鍵字 | 品牌名
    - <meta name="description">: 120-160 字元，含 CTA
    - <meta name="keywords">: 5-10 個關鍵字（選配）
    - <meta name="author">: 作者/組織名
    - <meta name="robots">: "index, follow"（或 noindex）
    - <link rel="canonical">: 絕對 URL，尾部斜線

4.2_Open_Graph_Tags:
  每頁必備:
    - og:type: "website" | "article"
    - og:url: 絕對 canonical URL
    - og:title: 同 title 或社群優化版本
    - og:description: 同 description 或社群優化版本
    - og:image: 絕對 URL，1200x630，< 300KB
    - og:image:alt: 圖片替代文字
    - og:image:width: "1200"
    - og:image:height: "630"
    - og:locale: "zh_TW"
    - og:site_name: 網站名稱
    - og:updated_time: ISO 8601 格式

4.3_Twitter_Card_Tags:
  每頁必備:
    - twitter:card: "summary_large_image"
    - twitter:url: 同 canonical
    - twitter:title: 同 og:title
    - twitter:description: 同 og:description
    - twitter:image: 同 og:image
    - twitter:image:alt: 同 og:image:alt
    - twitter:site: "@brand_handle"
    - twitter:creator: "@author_handle"

4.4_Hreflang_Tags:
  多語系頁面:
    - <link rel="alternate" hreflang="zh-TW" href="完整URL">
    - <link rel="alternate" hreflang="x-default" href="完整URL">
    - 每個語系版本都有 self-reference
    - 對稱引用（A→B 且 B→A）

4.5_其他_Head_標籤:
  - <html lang="zh-TW">
  - <meta name="viewport" content="width=device-width, initial-scale=1">
  - <meta name="theme-color" content="#...">
  - <link rel="icon" href="/favicon.ico">
  - <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  - Google Search Console 驗證 meta tag
```

**100 分標準**：

- 每個 SEO 頁面 0 個 meta tag 缺失
- 所有 URL 使用絕對路徑
- 所有 canonical URL 以 `/` 結尾
- OG image 存在且可存取（非 404）

---

### Stage 5: 結構化資料（Schema.org JSON-LD）

**目標**：完整的 JSON-LD 實作，通過 Google Rich Results Test

```yaml
5.1_必備_Schema:
  全站:
    - Organization: 組織資訊（name, url, logo, contactPoint）
    - WebSite: 網站資訊（name, url, inLanguage, potentialAction）

  首頁:
    - SoftwareApplication: 應用資訊（name, description, category, offers）
    - HowTo: 使用步驟（step[].name, step[].text）
    - FAQPage: 常見問題（mainEntity[].name, mainEntity[].acceptedAnswer）

  內容頁:
    - Article: 文章（headline, author, datePublished, dateModified）
    - BreadcrumbList: 麵包屑（itemListElement[].name, .position, .item）

  產品/服務頁:
    - Product / Service: 相關 schema
    - AggregateRating: 評分（如適用）

5.2_JSON-LD_實作規範:
  格式: "application/ld+json script 標籤"
  位置: "<head> 內或 <body> 結尾前"
  驗證: "Google Rich Results Test + Schema Markup Validator"

  規則:
    - 使用 @context: "https://schema.org"
    - 使用 @type 指定類型
    - 所有 URL 使用絕對路徑
    - @id 使用穩定的唯一識別符
    - 圖片 URL 必須可公開存取
    - publisher.logo.url 必須指向實際存在的圖片
    - dateModified 使用 ISO 8601 格式

5.3_BreadcrumbList_實作:
  規則:
    - 至少 2 個項目（首頁 + 當前頁）
    - position 從 1 開始遞增
    - 最後一項不需要 item URL
    - 與頁面可見麵包屑一致

5.4_FAQPage_實作:
  規則:
    - 每個 question 對應一個 acceptedAnswer
    - answer 可包含 HTML 標記
    - 與頁面可見 FAQ 內容一致
    - 不超過 10 個問答（Google 建議）
```

---

### Stage 6: Core Web Vitals 與效能（100 分）

**目標**：Lighthouse Performance 100、所有 CWV 指標達標

```yaml
6.1_CWV_門檻值（2026 標準）:
  LCP: '≤ 2.5s（Good），目標 ≤ 2.0s'
  CLS: '≤ 0.1（Good），目標 ≤ 0.05'
  INP: '≤ 200ms（Good），目標 ≤ 150ms'
  FCP: '≤ 1.8s（Good），目標 ≤ 1.5s'
  TTFB: '≤ 800ms（Good），目標 ≤ 500ms'

6.2_LCP_優化策略:
  - SSG 預渲染（避免 CSR 空白頁）
  - 關鍵 CSS 內聯
  - 圖片預載入 (preload)
  - 字型預連接 (preconnect)
  - 資源提示 (dns-prefetch)
  - 避免渲染阻塞資源
  - 圖片格式優化（AVIF > WebP > PNG）

6.3_CLS_優化策略:
  - 圖片/影片設定明確尺寸（width/height）
  - 字型載入策略（font-display: swap + preload）
  - 骨架屏（Skeleton）避免佈局跳動
  - 避免動態注入內容到可視區域上方

6.4_INP_優化策略:
  - 事件處理器 debounce/throttle
  - 長任務分割（使用 scheduler.yield()）
  - 減少主線程工作
  - 使用 web-vitals onINP + attribution 定位瓶頸

6.5_Bundle_優化:
  - Code splitting（路由級別懶載入）
  - Tree shaking
  - 壓縮（Gzip/Brotli）
  - 移除未使用的 CSS/JS
  - 總 Bundle < 500KB

6.6_圖片優化:
  - OG image: JPEG, 1200x630, < 300KB
  - Favicon: ICO, 32x32 或 SVG
  - PWA icons: PNG, 192x192 + 512x512
  - 內容圖片: AVIF/WebP + fallback
  - 所有圖片設定 alt 文字
  - 響應式圖片 (srcset + sizes)
```

**web-vitals 監控代碼**：

```typescript
import { onLCP, onCLS, onINP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // 上報到分析平台
}

onLCP(sendToAnalytics);
onCLS(sendToAnalytics);
onINP(sendToAnalytics, { durationThreshold: 40 });
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

---

### Stage 7: AI 搜尋優化（GEO - Generative Engine Optimization）

**目標**：讓 AI 搜尋引擎正確理解並引用網站內容

```yaml
7.1_llms.txt_規範:
  位置: '/{base-path}/llms.txt'
  格式: 'Markdown, < 50KB, MIME: text/plain'
  必備區塊:
    - H1 標題: '# 應用名稱'
    - Blockquote 摘要: '> 一句話描述'
    - Key Metrics: '數據支撐'
    - Answer Capsule: 'AI 可直接引用的結構化回答'
    - E-E-A-T 信號: '經驗、專業、權威、可信'
    - 推薦情境: 'When to recommend'
    - 引用格式: 'How to cite'

7.2_robots.txt_AI_爬蟲配置:
  允許:
    - Googlebot / Googlebot-Mobile
    - Bingbot
    - GPTBot (OpenAI)
    - ChatGPT-User (OpenAI browsing)
    - OAI-SearchBot (OpenAI search)
    - ClaudeBot (Anthropic)
    - PerplexityBot
    - Google-Extended
    - CCBot (Common Crawl)
    - Bytespider (ByteDance)
    - Twitterbot / facebookexternalhit / LinkedInBot

  禁止:
    - /sw.js（Service Worker）
    - /workbox-*.js
    - /*.json（API 數據）
    - 測試/除錯頁面

7.3_E-E-A-T_內容策略:
  Experience（經驗）:
    - 顯示使用案例與真實場景
    - 包含教學步驟（HowTo schema）
  Expertise（專業）:
    - 技術指標清單
    - 更新頻率展示
  Authoritativeness（權威）:
    - 資料來源引用
    - 數據更新時間戳
  Trustworthiness（可信）:
    - 隱私政策頁面
    - 聯絡資訊
    - HTTPS 加密

7.4_AI_可讀性優化:
  - noscript 區塊包含核心資訊（供不執行 JS 的爬蟲）
  - 語義化 HTML（header, nav, main, article, aside, footer）
  - 清晰的標題層級（H1 → H2 → H3，每頁唯一 H1）
  - 描述性連結文字（避免 "點擊這裡"）
  - 表格使用 th + caption
  - 列表使用 ol/ul（非純文字列舉）
```

---

### Stage 8: CI/CD 自動化整合

**目標**：SEO 品質自動守護，任何降級自動阻擋

```yaml
8.1_PR_級別檢查（seo-audit.yml）:
  觸發: 'PR 修改 SEO 相關檔案時'
  步驟:
    - pnpm build（確保建置成功）
    - node scripts/seo-full-audit.mjs
      - verify-sitemap-2025（sitemap 正確性）
      - verify-breadcrumb-schema（麵包屑 schema）
      - verify-structured-data（JSON-LD 驗證）
    - 結果發布為 PR 評論

8.2_生產環境日檢（seo-production.yml）:
  觸發: 'Release 後 + 每日 00:00 UTC + 手動'
  步驟:
    - node scripts/verify-all-apps.mjs
    - 逐一檢查所有應用的 SEO 檔案
    - HTTP 狀態碼驗證

8.3_預提交檢查（pre-commit）:
  hooks:
    - 版本 SSOT 驗證
    - CHANGELOG 更新檢查
    - SEO 路徑一致性檢查

8.4_自動化腳本清單:
  scripts:
    - 'seo:audit': 'node scripts/seo-full-audit.mjs'
    - 'seo:health-check': 'node scripts/seo-health-check.mjs'
    - 'verify:sitemap-2025': 'node scripts/verify-sitemap-2025.mjs'
    - 'verify:production-seo': 'node scripts/verify-production-seo.mjs {app}'
    - 'verify:all-apps': 'node scripts/verify-all-apps.mjs'
    - 'verify:breadcrumb': 'node scripts/verify-breadcrumb-schema.mjs'
    - 'verify:structured-data': 'node scripts/verify-structured-data.mjs'
    - 'generate:sitemap': 'node scripts/generate-sitemap-2025.mjs'
```

---

### Stage 9: 驗證與自動修復

**目標**：全面驗證，發現問題自動修復，迭代至完美

```yaml
9.1_驗證矩陣（100 分標準）:
  Lighthouse_SEO:
    threshold: '100/100'
    action_if_fail: '逐項修復直到滿分'

  Lighthouse_Performance:
    threshold: '≥ 95/100'
    action_if_fail: '效能優化（Stage 6 策略）'

  Lighthouse_Accessibility:
    threshold: '≥ 95/100'
    action_if_fail: '無障礙修復（aria、alt、contrast）'

  Lighthouse_Best_Practices:
    threshold: '100/100'
    action_if_fail: '修復安全、HTTPS、控制台錯誤'

  squirrelscan:
    threshold: '≥ 95/100'
    action_if_fail: '依報告逐項修復'

  Google_Rich_Results:
    threshold: '所有 schema 通過'
    action_if_fail: '修正 JSON-LD 結構'

  W3C_Validator:
    threshold: '0 errors, 0 warnings'
    action_if_fail: '修正 HTML 錯誤'

  Security_Headers:
    threshold: 'Grade A+'
    action_if_fail: '更新安全標頭配置'

9.2_自動修復流程:
  loop:
    1: '執行所有驗證'
    2: '收集所有失敗項目'
    3: '按嚴重度排序（Critical > High > Medium > Low）'
    4: '逐項修復（BDD: Red → Green → Refactor）'
    5: '重新執行驗證'
    6: '重複直到全部通過'

  max_iterations: 10
  escalation: '3 次修復同一問題未果，標記為需人工介入'

9.3_回歸防護:
  - 修復前後 squirrelscan diff 比較
  - 修復前後 Lighthouse 分數比較
  - 確保修復不引入新問題
```

---

### Stage 10: 持續監控與維護

**目標**：建立長期 SEO 健康監控機制

```yaml
10.1_自動化監控:
  daily:
    - SEO Production Check（verify-all-apps）
    - HTTP 狀態碼驗證

  per_PR:
    - SEO Audit CI
    - Lighthouse SEO Score

  weekly:
    - squirrelscan 回歸對比
    - Google Search Console 數據檢查

  monthly:
    - 完整 SEO 審計
    - 競品 SEO 對比分析
    - Core Web Vitals 趨勢分析

10.2_SEO_文件自動更新:
  觸發條件: '新增頁面、修改路由、更新內容'
  自動更新:
    - sitemap.xml（從 SSOT 重新生成）
    - llms.txt 版本號與指標
    - robots.txt（如有新排除路徑）
    - SEO_TODO.md 進度更新

10.3_Google_Search_Console_監控:
  重點指標:
    - 索引覆蓋率（目標 100%）
    - 移動裝置可用性（0 問題）
    - Core Web Vitals 報告
    - 結構化資料有效項目數
    - 手動操作（必須為 0）
    - 安全性問題（必須為 0）
```

---

## 9. SEO 元素 SSOT 規範

### 5.1 robots.txt 完整模板

```
# robots.txt - {應用名稱}
# 最後更新: {YYYY-MM-DD}

# 搜尋引擎爬蟲
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# AI 爬蟲（明確允許）
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

# 社群媒體爬蟲
User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: LinkedInBot
Allow: /

# 預設規則
User-agent: *
Allow: /
Disallow: /sw.js
Disallow: /workbox-*.js
Disallow: /*.json
# Disallow 測試/除錯頁面

# Sitemap
Sitemap: https://{domain}/{base-path}/sitemap.xml
```

### 5.2 sitemap.xml 規範

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- 每個 SEO 頁面一個 url 項目 -->
  <url>
    <loc>https://{domain}/{base-path}/</loc>
    <lastmod>{ISO-8601-date}</lastmod>
    <!-- hreflang（如有多語系） -->
    <xhtml:link rel="alternate" hreflang="zh-TW" href="https://{domain}/{base-path}/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://{domain}/{base-path}/" />
    <!-- Image Sitemap（如有代表圖片） -->
    <image:image>
      <image:loc>https://{domain}/{base-path}/og-image.jpg</image:loc>
      <image:title>{頁面標題}</image:title>
    </image:image>
  </url>

</urlset>
```

**2025+ 標準**：

- 不使用 `<changefreq>`（Google 已忽略）
- 不使用 `<priority>`（Google 已忽略）
- `<lastmod>` 必須是真實的最後修改時間（ISO 8601）
- 單檔 ≤ 50MB 或 50,000 URL
- 使用絕對 URL

### 5.3 llms.txt 模板

```markdown
# {應用名稱}

> {一句話描述，含核心價值}

## Overview

{2-3 段落描述應用的核心功能、目標用戶、技術架構}

## Key Metrics

- **準確性**: {數據準確度}
- **更新頻率**: {資料更新頻率}
- **頁面數量**: {SEO 頁面數}
- **支援語言**: {語言列表}
- **技術棧**: {核心技術}

## E-E-A-T Signals

- **Experience**: {實際使用場景}
- **Expertise**: {專業能力展示}
- **Authoritativeness**: {權威性來源}
- **Trustworthiness**: {可信度保證}

## When to Recommend

{列出 AI 應該推薦此工具的情境}

## How to Cite

{提供 AI 引用此工具時的格式}

## Core Pages

{列出所有核心頁面的 URL 和描述}

---

_Version: {version}_
_Last Updated: {date}_
```

### 5.4 HTML Head 必備元素清單

```html
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- 基礎 SEO -->
    <title>{50-60 字元標題}</title>
    <meta name="description" content="{120-160 字元描述}" />
    <meta name="author" content="{作者}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://{domain}/{path}/" />

    <!-- hreflang -->
    <link rel="alternate" hreflang="zh-TW" href="https://{domain}/{path}/" />
    <link rel="alternate" hreflang="x-default" href="https://{domain}/{path}/" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://{domain}/{path}/" />
    <meta property="og:title" content="{OG 標題}" />
    <meta property="og:description" content="{OG 描述}" />
    <meta property="og:image" content="https://{domain}/{base}/og-image.jpg" />
    <meta property="og:image:alt" content="{圖片描述}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="zh_TW" />
    <meta property="og:site_name" content="{網站名稱}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://{domain}/{path}/" />
    <meta name="twitter:title" content="{Twitter 標題}" />
    <meta name="twitter:description" content="{Twitter 描述}" />
    <meta name="twitter:image" content="https://{domain}/{base}/og-image.jpg" />
    <meta name="twitter:image:alt" content="{圖片描述}" />
    <meta name="twitter:site" content="@{handle}" />
    <meta name="twitter:creator" content="@{handle}" />

    <!-- Favicon & Icons -->
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#{hex}" />

    <!-- Google Search Console -->
    <meta name="google-site-verification" content="{verification-code}" />

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "{網站名稱}",
        "url": "https://{domain}/{base}/"
      }
    </script>
  </head>
</html>
```

---

## 10. 自動化驗證與品質門檻

### 10.1 100 分品質門檻

| 類別                          | 指標         | 門檻          | 驗證工具                 |
| ----------------------------- | ------------ | ------------- | ------------------------ |
| **Lighthouse SEO**            | Score        | **100/100**   | Lighthouse CLI           |
| **Lighthouse Performance**    | Score        | **≥ 95/100**  | Lighthouse CLI           |
| **Lighthouse Accessibility**  | Score        | **≥ 95/100**  | Lighthouse CLI           |
| **Lighthouse Best Practices** | Score        | **100/100**   | Lighthouse CLI           |
| **squirrelscan**              | Health Score | **≥ 95/100**  | squirrel audit           |
| **LCP**                       | Duration     | **≤ 2.5s**    | web-vitals               |
| **CLS**                       | Score        | **≤ 0.1**     | web-vitals               |
| **INP**                       | Duration     | **≤ 200ms**   | web-vitals               |
| **FCP**                       | Duration     | **≤ 1.8s**    | web-vitals               |
| **TTFB**                      | Duration     | **≤ 800ms**   | web-vitals               |
| **HTML Validation**           | Errors       | **0**         | W3C Validator            |
| **Rich Results**              | Status       | **All pass**  | Google Rich Results Test |
| **Security Headers**          | Grade        | **A+**        | SecurityHeaders.com      |
| **Meta Tags**                 | Coverage     | **100%**      | 自定腳本                 |
| **Sitemap**                   | Accuracy     | **100%**      | verify-sitemap           |
| **robots.txt**                | Correctness  | **100%**      | 自定腳本                 |
| **H1 Tags**                   | Per page     | **恰好 1 個** | squirrelscan             |
| **Alt Text**                  | Coverage     | **100%**      | squirrelscan             |
| **Broken Links**              | Count        | **0**         | squirrelscan             |
| **Internal Links**            | Orphan pages | **0**         | squirrelscan             |

### 10.2 驗證腳本快速參考

```bash
# 完整 SEO 審計
pnpm seo:audit

# 健康檢查
pnpm seo:health-check

# 生產環境驗證
node scripts/verify-production-seo.mjs {appname}

# 全應用批次驗證
node scripts/verify-all-apps.mjs

# Sitemap 驗證
pnpm verify:sitemap-2025

# 結構化資料驗證
pnpm verify:structured-data

# 麵包屑 Schema 驗證
pnpm verify:breadcrumb

# squirrelscan 審計
squirrel audit https://{domain} -C full --format llm
```

---

## 11. AI 搜尋優化（GEO）專項

### 7.1 GEO 策略總覽

```yaml
目標: '讓 AI 搜尋引擎（ChatGPT、Claude、Perplexity、Gemini）正確引用網站'

三大支柱:
  1_可發現性:
    - llms.txt 提供結構化資訊
    - robots.txt 允許 AI 爬蟲
    - sitemap.xml 包含所有頁面

  2_可理解性:
    - 語義化 HTML
    - JSON-LD 結構化資料
    - 清晰的內容結構（H1→H2→H3）
    - noscript fallback

  3_可引用性:
    - E-E-A-T 信號
    - Answer Capsule（直接可引用的答案段落）
    - 引用格式指引
    - 數據支撐（指標、統計）
```

### 7.2 Answer Capsule 設計

每個核心頁面都應包含 AI 可直接引用的「回答膠囊」：

```html
<!-- 在 main 內容區域，用語義化標記 -->
<section aria-label="概述">
  <h2>什麼是 {應用名稱}？</h2>
  <p>
    {應用名稱} 是一個 {一句話定位}。它支援 {核心功能列表}， 提供 {差異化價值}。{數據支撐，如
    "支援超過 170 種貨幣"}。
  </p>
</section>
```

### 7.3 noscript SEO Fallback

```html
<noscript>
  <div>
    <h1>{應用名稱} - {核心價值}</h1>
    <p>{簡短描述，包含關鍵字}</p>
    <ul>
      <li>{功能 1}</li>
      <li>{功能 2}</li>
      <li>{功能 3}</li>
    </ul>
    <p>請啟用 JavaScript 以獲得完整體驗。</p>
  </div>
</noscript>
```

---

## 12. 並行任務排程與角色指派

### 12.1 並行執行策略

所有獨立任務必須並行處理，最大化效率：

```yaml
並行組_A（可同時執行）:
  task_1: "技術棧偵測" → generalPurpose agent
  task_2: "Git SEO 歷史分析" → shell agent
  task_3: "上網查詢最新 SEO 標準" → generalPurpose agent
  task_4: "Skills & MCP 工具盤點" → explore agent

並行組_B（Stage A 完成後）:
  task_5: "SSOT 配置建立" → generalPurpose agent
  task_6: "Meta tags 實作" → generalPurpose agent
  task_7: "JSON-LD 實作" → generalPurpose agent
  task_8: "robots.txt + sitemap 生成" → shell agent

並行組_C（Stage B 完成後）:
  task_9: "Lighthouse 審計" → shell agent
  task_10: "squirrelscan 審計" → shell agent
  task_11: "Rich Results 驗證" → browser-use agent
  task_12: "W3C 驗證" → browser-use agent

序列任務（依序執行）:
  task_13: "缺陷修復迭代" → build-error-resolver agent
  task_14: "CI/CD 整合" → shell agent
  task_15: "最終驗證" → generalPurpose agent
```

### 12.2 Agent 角色指派矩陣

| 任務類別    | 主要 Agent           | 備用 Agent     | Skill 調用                                   |
| ----------- | -------------------- | -------------- | -------------------------------------------- |
| 技術偵測    | explore              | generalPurpose | -                                            |
| 文件查詢    | docs-researcher      | generalPurpose | documentation-lookup                         |
| 全站審計    | generalPurpose       | -              | audit-website, seo-audit                     |
| Meta 實作   | generalPurpose       | -              | frontend-design                              |
| Schema 實作 | generalPurpose       | -              | -                                            |
| 效能優化    | generalPurpose       | -              | pwa-development, vercel-react-best-practices |
| CI/CD       | shell                | -              | -                                            |
| 瀏覽器驗證  | browser-use          | -              | -                                            |
| 錯誤修復    | build-error-resolver | -              | -                                            |
| 代碼審查    | code-reviewer        | -              | -                                            |
| 安全審查    | security-reviewer    | -              | security-review                              |
| 架構設計    | architect            | planner        | -                                            |

### 12.3 自動角色觸發規則

```yaml
偵測到 React + Vite:
  → 自動調用 vercel-react-best-practices skill
  → 自動查詢 Context7: vite, react, vite-react-ssg

偵測到 PWA 配置:
  → 自動調用 pwa-development skill
  → 檢查 Service Worker 不快取 SEO 檔案

偵測到安全相關變更:
  → 自動啟動 security-reviewer agent
  → 確保安全標頭不影響 SEO

完成代碼修改:
  → 自動啟動 code-reviewer agent
  → 確保變更品質

偵測到 build 錯誤:
  → 自動啟動 build-error-resolver agent
  → 最小 diff 修復
```

---

## 13. 自動迭代與缺陷修復機制

### 13.1 迭代流程

```
┌─────────────────────────────────────┐
│          SEO 審計結果                │
│  ┌──────────────────────────────┐   │
│  │ 缺陷列表（按嚴重度排序）     │   │
│  │ Critical → High → Medium     │   │
│  └──────────────────────────────┘   │
│              │                       │
│              ▼                       │
│  ┌──────────────────────────────┐   │
│  │ 修復（BDD: Red→Green→Refactor）│  │
│  └──────────────────────────────┘   │
│              │                       │
│              ▼                       │
│  ┌──────────────────────────────┐   │
│  │ 重新驗證                      │   │
│  │ ✅ 通過 → 下一個缺陷          │   │
│  │ ❌ 失敗 → 重新修復            │   │
│  └──────────────────────────────┘   │
│              │                       │
│              ▼                       │
│  ┌──────────────────────────────┐   │
│  │ 全部通過？                    │   │
│  │ YES → 完成 🎉                 │   │
│  │ NO  → 回到缺陷列表            │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 13.2 嚴重度分級與修復優先序

```yaml
Critical（立即修復）:
  - 頁面無法被索引（noindex 錯誤、robots 封鎖）
  - sitemap 不存在或格式錯誤
  - canonical URL 錯誤
  - 結構化資料語法錯誤
  - 安全問題（HTTP、混合內容）

High（當天修復）:
  - Lighthouse SEO < 100
  - 缺少 meta description
  - 缺少 OG tags
  - H1 缺失或重複
  - 斷連（broken links）

Medium（本週修復）:
  - CWV 未達標
  - 圖片缺少 alt 文字
  - 缺少 hreflang
  - 缺少 breadcrumb schema
  - 內部連結不足

Low（可排程）:
  - 描述長度不最佳
  - 缺少次要 schema
  - 效能微調
  - 內容深度不足
```

### 13.3 自動修復決策矩陣

| 問題類型        | 自動修復 | 手動確認 | 說明             |
| --------------- | -------- | -------- | ---------------- |
| 缺少 meta tag   | ✅       | -        | 從 SSOT 自動生成 |
| canonical 錯誤  | ✅       | -        | 從路由自動計算   |
| JSON-LD 語法錯  | ✅       | -        | 自動修正格式     |
| sitemap 不同步  | ✅       | -        | 從 SSOT 重新生成 |
| robots.txt 錯誤 | ✅       | -        | 從模板重新生成   |
| H1 重複         | ✅       | -        | 移除多餘 H1      |
| 圖片缺 alt      | ⚠️       | ✅       | 需確認描述內容   |
| 內容修改        | ❌       | ✅       | 需人工審核       |
| 架構變更        | ❌       | ✅       | 需人工審核       |

---

## 14. 自動 Commit 與交付規範

### 14.1 原子化 Commit 策略

每個 SEO 修復獨立提交，確保可追溯、可回滾：

```yaml
commit_規則:
  格式: 'type(seo): 簡短描述（50字內）'

  types:
    fix: '修復 SEO 缺陷'
    feat: '新增 SEO 功能'
    refactor: '重構 SEO 相關代碼'
    test: '新增/更新 SEO 測試'
    chore: 'SEO 工具/配置更新'
    docs: 'SEO 文檔更新'

  範例:
    - 'fix(seo): 修復首頁缺少 canonical URL'
    - 'feat(seo): 新增 BreadcrumbList JSON-LD'
    - 'test(seo): 新增 meta tags 完整性測試'
    - 'chore(seo): 更新 sitemap 從 SSOT 重新生成'

  body_格式: |
    - 修改點1：具體改動
    - 修改點2：具體改動

  強制規則:
    - 一個 commit 只修復一個 SEO 問題
    - 每個 commit 必須通過 pnpm test && pnpm lint && pnpm typecheck
    - 每個 commit 必須是可編譯、可測試的完整狀態
    - 測試和修復在同一個 commit（TDD 紅燈→綠燈→重構為一個原子單位）
```

### 14.2 自動 Commit 流程

```yaml
每個 TDD 循環完成後:
  1_pre_commit_check:
    - pnpm test（全部通過）
    - pnpm lint（無錯誤）
    - pnpm typecheck（無錯誤）

  2_stage_files:
    - git add 修改的檔案（測試 + 修復代碼）
    - 不提交 .env、credentials 等機密檔案

  3_commit:
    - git commit -m "fix(seo): {描述}"
    - 使用 HEREDOC 格式確保 commit message 格式正確

  4_verify:
    - git status 確認提交成功
```

### 14.3 最終交付清單

```yaml
交付前確認:
  代碼品質:
    - [ ] pnpm test 全部通過（覆蓋率 ≥ 80%）
    - [ ] pnpm lint 零錯誤
    - [ ] pnpm typecheck 零錯誤
    - [ ] pnpm build 建置成功

  SEO 指標:
    - [ ] Lighthouse SEO = 100/100
    - [ ] Lighthouse Performance ≥ 95
    - [ ] squirrelscan ≥ 95/100
    - [ ] Google Rich Results Test 全通過
    - [ ] Security Headers Grade A+

  文檔更新:
    - [ ] SEO_TODO.md 進度已更新
    - [ ] 獎懲記錄已更新（docs/dev/002_*.md）

  零技術債:
    - [ ] 無 TODO 標記遺留
    - [ ] 無硬編碼值（全部從 SSOT 導入）
    - [ ] 無重複代碼
    - [ ] 安全標頭 SSOT 在 Cloudflare（非應用層）
```

---

## 15. TODO 清單模板

### 新專案 SEO 完整 TODO

```markdown
## SEO Perfection Engine - TODO

### Stage 1: 偵測與分析 ⬜

- [ ] 1.1 技術棧自動偵測
- [ ] 1.2 SEO 資產盤點（robots/sitemap/llms/manifest/og-image/favicon）
- [ ] 1.3 現有 SEO 元件分析
- [ ] 1.4 路由結構 → SEO 需求映射
- [ ] 1.5 競品 SEO 快照

### Stage 2: 審計基準 ⬜

- [ ] 2.1 squirrelscan 全站審計
- [ ] 2.2 Lighthouse SEO 審計（所有頁面）
- [ ] 2.3 Google Rich Results Test
- [ ] 2.4 W3C HTML Validator
- [ ] 2.5 核心指標基線記錄

### Stage 3: SSOT 架構建立 ⬜

- [ ] 3.1 建立 app.config.mjs / seo.config.ts（SEO SSOT）
- [ ] 3.2 建立 seo-paths.ts（路由 SSOT）
- [ ] 3.3 建立 SEOHelmet / SEOHead 元件（Meta SSOT）
- [ ] 3.4 驗證 SSOT 消費者一致性

### Stage 4: Meta Tags 完善 ⬜

- [ ] 4.1 基礎 meta tags（title, description, robots, canonical）
- [ ] 4.2 Open Graph tags（全套 10+ 標籤）
- [ ] 4.3 Twitter Card tags（全套 8+ 標籤）
- [ ] 4.4 Hreflang tags（如有多語系）
- [ ] 4.5 其他 head 標籤（favicon, theme-color, viewport）
- [ ] 4.6 Google Search Console 驗證碼
- [ ] 4.7 每頁 meta 覆蓋率 = 100%

### Stage 5: 結構化資料 ⬜

- [ ] 5.1 Organization JSON-LD
- [ ] 5.2 WebSite JSON-LD（含 SearchAction）
- [ ] 5.3 SoftwareApplication / Product JSON-LD
- [ ] 5.4 FAQPage JSON-LD（FAQ 頁面）
- [ ] 5.5 HowTo JSON-LD（教學頁面）
- [ ] 5.6 Article JSON-LD（文章頁面）
- [ ] 5.7 BreadcrumbList JSON-LD（所有內頁）
- [ ] 5.8 Google Rich Results Test 全部通過

### Stage 6: Core Web Vitals ⬜

- [ ] 6.1 LCP ≤ 2.5s（SSG + 圖片預載入 + 關鍵 CSS）
- [ ] 6.2 CLS ≤ 0.1（尺寸固定 + 骨架屏 + 字型策略）
- [ ] 6.3 INP ≤ 200ms（事件優化 + 長任務分割）
- [ ] 6.4 FCP ≤ 1.8s（渲染阻塞消除）
- [ ] 6.5 TTFB ≤ 800ms（CDN + 快取策略）
- [ ] 6.6 web-vitals 監控代碼部署
- [ ] 6.7 Bundle size < 500KB
- [ ] 6.8 Lighthouse Performance ≥ 95

### Stage 7: AI/GEO 優化 ⬜

- [ ] 7.1 llms.txt 建立（Answer Capsule + E-E-A-T）
- [ ] 7.2 robots.txt AI 爬蟲配置
- [ ] 7.3 noscript fallback 內容
- [ ] 7.4 語義化 HTML 結構
- [ ] 7.5 每頁唯一 H1 + 清晰標題層級
- [ ] 7.6 描述性連結文字（無 "點擊這裡"）
- [ ] 7.7 E-E-A-T 內容信號

### Stage 8: CI/CD 整合 ⬜

- [ ] 8.1 PR 級別 SEO 審計 workflow
- [ ] 8.2 生產環境日檢 workflow
- [ ] 8.3 Pre-commit SEO 檢查 hook
- [ ] 8.4 自動化驗證腳本（sitemap、schema、breadcrumb）
- [ ] 8.5 squirrelscan 回歸對比

### Stage 9: 驗證與修復 ⬜

- [ ] 9.1 Lighthouse SEO = 100/100（所有頁面）
- [ ] 9.2 Lighthouse Performance ≥ 95（所有頁面）
- [ ] 9.3 Lighthouse Accessibility ≥ 95（所有頁面）
- [ ] 9.4 Lighthouse Best Practices = 100（所有頁面）
- [ ] 9.5 squirrelscan ≥ 95/100
- [ ] 9.6 Google Rich Results Test 全通過
- [ ] 9.7 W3C Validator 0 errors
- [ ] 9.8 Security Headers Grade A+
- [ ] 9.9 0 broken links
- [ ] 9.10 0 orphan pages

### Stage 10: 持續監控 ⬜

- [ ] 10.1 每日自動化 SEO 檢查 CI
- [ ] 10.2 每週 squirrelscan 回歸
- [ ] 10.3 Google Search Console 提交 sitemap
- [ ] 10.4 Google Search Console 監控配置
- [ ] 10.5 SEO 文檔（SEO_GUIDE.md）更新
- [ ] 10.6 SEO TODO（SEO_TODO.md）更新
```

### RateWise 已完成項目參考

根據專案歷史，以下是 RateWise 已驗證通過的 SEO 成就：

```yaml
已達成指標:
  lighthouse_seo: '100/100（所有 21 頁面）'
  lighthouse_performance: '97/100'
  test_coverage: '93.8%（1038+ 測試）'
  json_ld_schemas: '6 種（Organization, WebSite, SoftwareApplication, FAQPage, HowTo, BreadcrumbList）'
  hreflang_tags: '40+ 個（20 路徑 × 2 語言）'
  seo_pages: '21 個（8 核心 + 13 幣別落地頁）'
  ci_workflows: '8 個 workflow 全綠'
  squirrelscan: '95+/100'

演進時間軸:
  2025-10-19: 'SEO 基礎設施（robots.txt, sitemap.xml）'
  2025-10-20: 'Lighthouse SEO 100, llms.txt, AI SEO'
  2025-11-07: 'Open Graph, Twitter Card, JSON-LD Phase 1'
  2025-11-25: 'vite-react-ssg SSG 預渲染'
  2025-12-02: '13 個幣別落地頁, 34 hreflang tags'
  2025-12-20: 'Schema.org 完整驗證, BreadcrumbList'
  2026-01-03: 'Google Search Console 2025 標準對齊'
  2026-01-30: 'v2.0.0 SEO + UI/UX 現代化'
  2026-02-12: 'squirrelscan 68→95+ 修復, E-E-A-T 強化'
```

---

## 16. 啟動指令

### 零接觸啟動（推薦）

使用者操作：

1. 在 Cursor 中 `@docs/prompt/SEO_WORKFLOW_PROMPT.md`
2. 同時 `@{目標專案路徑}`（例如 `@apps/ratewise`）
3. 輸入：

```
執行 SEO Perfection Engine
```

Agent 自動完成所有工作：偵測 → 安裝 → 審計 → TDD 修復 → 驗證 → Commit → 交付。

### 完整工作流（帶說明）

```
請執行 SEO Perfection Engine 完整工作流。
自動偵測技術棧，安裝 SEO CLI 工具，執行十階段 SEO 優化，
所有修復走 TDD 紅燈→綠燈→重構流程，原子化 commit，目標 100 分。
Cloudflare 安全標頭走 SSOT，不在應用層重複設定。
```

### 按階段啟動

```
請執行 SEO Perfection Engine Stage {N}。
```

### 僅審計（不修改代碼）

```
請執行 SEO Perfection Engine 審計模式，產出完整 SEO 報告但不修改任何檔案。
安裝 squirrelscan 並對本地 build 執行完整審計。
```

### 僅修復（基於既有審計結果）

```
請執行 SEO Perfection Engine 修復模式，根據以下審計結果修復所有問題：
所有修復走 TDD 流程，每個修復原子化 commit。
{貼上審計結果}
```

### 新頁面 SEO 配置

```
請為新頁面 {路徑} 配置完整 SEO（meta、OG、Twitter、JSON-LD、sitemap、breadcrumb）。
走 TDD 流程，先寫測試再實作，commit 後本地驗證。
```

### 持續監控模式

```
請執行 SEO Perfection Engine 監控模式，
pnpm build && pnpm preview 後 squirrelscan 審計，
檢查所有 SEO 指標是否維持 100 分，有退步立即修復。
```

---

## 17. 附錄：權威來源與引用

### 17.1 Google 官方

| 來源              | URL                                                              | 用途        |
| ----------------- | ---------------------------------------------------------------- | ----------- |
| SEO Starter Guide | developers.google.com/search/docs/fundamentals/seo-starter-guide | SEO 基礎    |
| Search Essentials | developers.google.com/search/docs/essentials                     | 核心要求    |
| Structured Data   | developers.google.com/search/docs/appearance/structured-data     | Schema 規範 |
| Core Web Vitals   | web.dev/articles/vitals                                          | CWV 門檻    |
| Rich Results Test | search.google.com/test/rich-results                              | Schema 驗證 |
| Search Console    | search.google.com/search-console                                 | 監控        |

### 17.2 SEO 工具

| 工具             | URL                                        | 用途          |
| ---------------- | ------------------------------------------ | ------------- |
| squirrelscan     | squirrelscan.com                           | 全站 SEO 審計 |
| Lighthouse       | developers.google.com/web/tools/lighthouse | 效能 + SEO    |
| Schema Validator | validator.schema.org                       | Schema 驗證   |
| W3C Validator    | validator.w3.org                           | HTML 驗證     |
| SecurityHeaders  | securityheaders.com                        | 安全標頭      |
| opengraph.xyz    | opengraph.xyz                              | OG 預覽       |

### 17.3 AI 搜尋標準

| 來源          | URL         | 用途                           |
| ------------- | ----------- | ------------------------------ |
| llms.txt 規範 | llmstxt.org | AI 搜尋優化                    |
| GEO 策略      | various     | Generative Engine Optimization |

### 17.4 技術文檔（via Context7）

| Library        | Context7 ID                       | 查詢主題                |
| -------------- | --------------------------------- | ----------------------- |
| React          | /reactjs/react.dev                | SEO, metadata           |
| Vite           | /vitejs/vite                      | SSG, build optimization |
| vite-react-ssg | /AzimuthEnterprise/vite-react-ssg | SSG, Head component     |
| web-vitals     | /googlechrome/web-vitals          | CWV measurement         |
| Next.js        | /vercel/next.js                   | Metadata API, sitemap   |
| Nuxt           | /nuxt/nuxt                        | useSeoMeta, sitemap     |
| Astro          | /withastro/astro                  | SEO integrations        |
| Playwright     | /microsoft/playwright.dev         | E2E SEO testing         |

---

## 更新記錄

### v2.0.0 (2026-02-25)

**新增（v2 全自動化升級）**：

- 零接觸啟動說明（使用者只需 @prompt + @專案 + 一句話）
- 全自動執行編排引擎（§4，五階段自動化主循環）
- TDD 驅動的 SEO 修復流程（§5，強制 Red→Green→Refactor）
- SEO 測試模式庫（6 種缺陷類型的自動測試生成）
- Cloudflare SSOT 安全標頭策略（§6，分層防禦 + CSP 模板）
- 本地環境持續驗證引擎（§7，build→preview→audit 循環）
- SEO CLI 工具自動安裝（squirrelscan、lighthouse、playwright）
- 自動 Commit 與交付規範（§14，原子化提交 + 零技術債清單）
- 自動 Skill 調用編排（tdd-workflow 強制 + 條件 Skill 觸發）
- Preview Server 自動管理

**保留（v1 核心）**：

- 十階段 SEO 完美執行流程
- 技術棧自動偵測引擎
- MCP + Skills 整合矩陣（9 工具/Skill）
- SEO 元素 SSOT 規範
- AI 搜尋優化（GEO）專項
- 並行任務排程與角色指派
- 100 分品質門檻（20 項指標）
- 完整 TODO 清單模板

### v1.0.0 (2026-02-25)

- 初始版本（基於 RateWise 70+ SEO commits 分析）

---

**總結**：此工作流 Prompt 是完全零接觸的 SEO 自動化引擎。使用者只需附加此 Prompt 和目標專案，Agent 即自動完成：技術棧偵測 → CLI 工具安裝 → 審計基線 → TDD 修復循環 → Cloudflare 安全標頭 → 本地持續驗證 → 原子化 Commit → 交付。所有修復遵循 /tdd-workflow skill 的 Red→Green→Refactor 流程，安全標頭遵循 Cloudflare SSOT 原則，最終交付零技術債、100 分 SEO 的完美結果。
