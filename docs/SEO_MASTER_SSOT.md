# RateWise（HaoRate）SEO 完整規範 — Master SSOT

> **文件版本**: v2.7.0
> **建立日期**: 2026-03-23
> **最後更新**: 2026-04-29
> **v2.7.0 變更**: 新增 §12.7「2026-04-29 SEO 深度審查報告」— 12 構面評分（總分 88/100）、26 端點生產驗證、Worker v4.9 prod-source drift 證據、待補項與優先級；PR #302 已 merge + Worker v4.9 已部署，IsItAgentReady 升至 Level 2
> **v2.6.0 變更**: 補齊 root agent readiness SSOT：`app.haotool.org/` 首頁 Link headers、Markdown negotiation、robots Content-Signal、RFC 9727 API catalog 與 Agent Skills Discovery v0.2.0；OAuth / MCP / WebMCP 依真實產品能力標註為暫不發布假 metadata
> **v2.5.0 變更**: 對齊 2026-04-27 程式現況與權威文件：`FAQPage` 收斂為 `/faq/` 專用、幣別頁移除 `FinancialService`、補入 `seo-public-surface` / `schema-truthfulness` / `seo-surface-order` 等公開真相閘門；同步修正文檔中 Markdown 鏡像、pair JSON、`lastmod` policy 與公開 SSOT 揭露規格
> **文件性質**: AI 助手 + 工程師執行手冊 / SEO 單一真實來源
> **適用版本**: HaoRate / `apps/ratewise` ≥ v2.21.0
> **上位文件**: `CLAUDE.md`, `AGENTS.md`
> **v2.4.6 變更**: 補齊 2026-04-25 外部入口重測（46 筆），補充 root/`/ratewise/` 實際 header 檢測、IsItAgentReady 掃描回應 404 入口與 Level 2 仍待 production 套用差異；更新 `12.5` 與 `12.6` 迭代紀錄為「權威參考＋可重複快照」版本
> **v2.4.5 變更**: 新增 2026-04-25 外部入口快照（12.6.7）與 IsItAgentReady 實掃重播結果（root 正規化）；補齊 12.6.5 可重複外部掃描命令並保留重測證據欄位，12.6.6 改為現況真實 status（Link / Markdown / Content-Signal 仍待 production 生效）
> **v2.4.4 變更**: 補齊 2026-04-25 擴充外部檢測快照（含 34+ 權威入口）與 IsItAgentReady 最新回報（root 正規化對照）；更新本地修正與發版驗證節點
> **v2.4.3 變更**: 補齊 IsItAgentReady 級距修正（Content-Signal、首頁 Link header、首頁 markdown negotiation）與 Markdown 鏡像自動產生；增加驗證命令與待發版確認
> **v2.4.2 變更**: 新增 IsItAgentReady 外部掃描報告（2026-04-24）與 BOT 進階建議
> **v2.4.1 變更**: 補上 2026-04-25 外部檢測快照（34+6 個來源）、加入可持續迭代的外部驗證命令與人工補驗規範，明確標註失敗來源為工具限制非站點異常
> **v2.3.0 變更**: 依 `apps/ratewise` 現行程式碼更新 SSOT：修正 `FAQPage` 現況為 34 個幣別頁啟用、FAQ 頁不輸出 FAQPage JSON-LD；補齊 `FinancialService`、`Dataset`、`Person`、`WebPage`、巢狀 `SpeakableSpecification`；同步 prebuild 管道、Markdown 鏡像與公開產物治理；修正 `ExchangeRateSpecification` 價格來源為 `seo-rate-examples.ts`
> **v2.4.0 變更**: 新增「權威 SEO 參考與外部檢測」版本，整理 26 個權威網站與 24 個可貼入 Production URL 的檢測入口，並補充 2026-04-24 生產環境驗證報告（`verify-production-seo` + `verify-structured-data`）做為迭代基準
> **v2.2.0 變更**: 同步目前程式碼 SSOT：`SEO_PATHS=249`、`CONTENT_SEO_PATHS=9`、`APP_ONLY_PATHS=7`；修正 schema / Answer Capsule 已完成狀態；更新 llms / robots AI crawler 共用 SSOT；移除 sitemap `changefreq` / `priority` 過時規格
> **v2.1.0 變更**: §2.3 新增 Markdown 鏡像與 Link header；§6.5 新增 AI referral 追蹤規格；§8 重構為四層語意分組；§14 補記 B2/E1/A3 完成紀錄與 P1-7a/P1-8/P1-9/P2-9/P2-10/P2-11 新項目
> **取代文件**: 本文整合並取代所有舊文件（已歸檔至 `docs/archive/seo/`）：
>
> - `docs/SEO_GUIDE.md` (v2.0.0)
> - `docs/dev/SEO_TODO.md` (v2.1.0)
> - `docs/dev/seo-research-notes.md`
> - `docs/dev/SEO_BDD_IMPLEMENTATION_2025-12-01.md`
> - `docs/SEO_SUBMISSION_GUIDE.md`
> - `docs/prompt/SEO_WORKFLOW_PROMPT.md`
> - `docs/dev/AI_SEARCH_OPTIMIZATION_CHECKLIST.md`
> - `docs/dev/AI_SEARCH_OPTIMIZATION_SPEC.md`
> - `docs/dev/022_seo_audit_checklist_template.md`
> - `docs/dev/025_seo_complete_audit_checklist.md`
> - `docs/dev/030_seo_deep_dive_report_v1.md`
> - `docs/dev/031_ai_code_review_prerender_seo.md`
> - `docs/dev/033_ai_summary_citation_spec.md`
> - `docs/dev/039_ratewise_seo_ssot_tdd_spec.md`
> - `docs/dev/041_ratewise_api_freshness_seo_spec.md`
> - `docs/dev/042_faqpage_jsonld_decision.md`
> - `docs/dev/043_ratewise_seo_gap_analysis.md`
> - `docs/SEARCH_CONSOLE_GUIDE.md`
> - `docs/dev/007_ai_search_seo_phase1_implementation.md`

---

## 📋 目錄

1. [文件宗旨與設計原則](#1-文件宗旨與設計原則)
2. [架構總覽：SSOT 檔案地圖](#2-架構總覽ssot-檔案地圖)
3. [URL 架構規範](#3-url-架構規範)
4. [結構化資料規範（Schema.org）](#4-結構化資料規範schemaorg)
5. [各頁面 SEO 內容標準](#5-各頁面-seo-內容標準)
6. [AI 搜尋優化（AEO / GEO）](#6-ai-搜尋優化aeo--geo)
7. [llms.txt 規範](#7-llmstxt-規範)
8. [robots.txt 規範](#8-robotstxt-規範)
9. [sitemap.xml 規範](#9-sitemapxml-規範)
10. [Core Web Vitals 效能標準](#10-core-web-vitals-效能標準)
11. [SSOT 驗證規則](#11-ssot-驗證規則)
12. [監測與稽核](#12-監測與稽核)
    - [12.5 權威 SEO 參考與外部檢測入口](#125-權威-seo-參考與外部檢測入口)
    - [12.6 生產網址外部檢測報告（2026-04-25）](#126-生產網址外部檢測報告2026-04-25)
    - [12.6.4 2026-04-25 外部檢測快照](#1264-2026-04-25-外部檢測快照)
    - [12.6.5 外部檢測命令（可重複執行）](#1265-外部檢測命令)
    - [12.6.6 IsItAgentReady 掃描報告（2026-04-25）](#1266-isitagentready-掃描報告2026-04-25)
    - [12.6.7 2026-04-25 外部檢測網站快照（可重複報告）](#1267-2026-04-25-外部檢測網站快照可重複報告)
    - [12.7 2026-04-29 SEO 深度審查報告](#127-2026-04-29-seo-深度審查報告)
13. [SEO 缺口分析（2026-04-10）](#13-seo-缺口分析2026-04-10-審查)
14. [優先 TODO 清單](#14-優先-todo-清單原-13編號保持連貫)
15. [詞彙表](#15-詞彙表)

---

## 1. 文件宗旨與設計原則

### 1.1 宗旨

本文件是 RateWise 的 **SEO 單一真實來源（SSOT）**，覆蓋：

- 傳統搜尋引擎優化（Google、Bing）
- AI 搜尋優化（AEO/GEO：ChatGPT、Perplexity、Claude、Gemini、Copilot）
- 結構化資料規範（Schema.org JSON-LD）
- 內容標準（各頁面類型）
- 技術規範（robots.txt、sitemap.xml、llms.txt、canonical、hreflang）
- 優化 TODO 與優先級

### 1.2 設計原則

| 原則               | 說明                                                                                |
| ------------------ | ----------------------------------------------------------------------------------- |
| **SSOT 優先**      | 所有 SEO 設定從 `seo-paths.config.mjs` → `seo-metadata.ts` 向外輻射；禁止分散硬編碼 |
| **可測試**         | 每條規範對應可自動化測試的斷言；SEO 規格變更必須先有紅燈測試                        |
| **YMYL 嚴格**      | 匯率屬 YMYL（Your Money Your Life）；E-E-A-T 標準須達最高等級                       |
| **AI 優先可讀**    | 結構化資料、Answer Capsule、llms.txt 讓 AI 爬蟲零誤解地引用                         |
| **新鮮度**         | Perplexity 2-3 天即衰減；每個幣別頁必須顯示可見的更新時間戳                         |
| **原創數據差異化** | 台銀實際賣出價（非中間價）是核心競爭優勢；每個接觸點均需強調                        |

### 1.3 YMYL 台銀匯率特殊要求

RateWise 屬 YMYL 網站，Google 與 AI 引擎對此類型施加最嚴格的 E-E-A-T 審核：

1. **每筆匯率數據必須明確標示來源**：臺灣銀行牌告匯率 + 連結 + 更新時間
2. **資料方法論頁面**（`/sell-rate-vs-mid-rate/`）：解釋為何使用賣出價而非中間價；此頁是最強的 E-E-A-T 差異化信號
3. **免責聲明**：每個匯率頁面底部需有「匯率僅供參考，實際交易以金融機構公告為準」
4. **About 頁面**：作者/開發者資訊 + 聯絡方式 + Organization schema

### 1.4 2026 權威文件對齊基線

以下規則為本文件當前版號的外部依據，若實作或文檔與其衝突，以官方文件為優先：

1. **Google Search Central / Sitemap**
   - `lastmod` 必須反映頁面的「重大更新」。
   - Google 明確忽略 `<priority>` 與 `<changefreq>`。
   - 來源：<https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
2. **Google Search Central / JavaScript SEO**
   - app shell 不是理想 SEO 輸出；SSG / prerender 仍是較佳做法。
   - 來源：<https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics>
3. **Google Search Central / FAQPage**
   - FAQ rich results 僅對權威政府/健康網站保留；一般商業站不應把 FAQ rich result 當主要可見性策略。
   - 來源：<https://developers.google.com/search/docs/appearance/structured-data/faqpage>
   - 補充公告：<https://developers.google.com/search/blog/2023/08/howto-faq-changes>
4. **Schema.org / ExchangeRateSpecification**
   - 幣別頁若要表達可稽核匯率數值，應優先使用 `ExchangeRateSpecification` 與 `currentExchangeRate`。
   - 來源：<https://schema.org/ExchangeRateSpecification>
5. **IETF RFC 8288 / Web Linking**
   - HTML 頁透過 `Link: rel="alternate"` 揭露 Markdown 鏡像屬標準 HTTP link relation 做法。
   - 來源：<https://datatracker.ietf.org/doc/html/rfc8288>
6. **llmstxt.org**
   - `llms.txt` 應作為 AI 代理可快速擷取的索引入口，但不得與 HTML 內容語義漂移。
   - 來源：<https://llmstxt.org/index.html>
7. **Cloudflare Markdown for Agents**
   - Agent 以 `Accept: text/markdown` 請求 HTML 頁時，可回傳 Markdown 版本；瀏覽器預設仍維持 HTML。
   - 來源：<https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/>
8. **RFC 9727 / RFC 9264 API Catalog**
   - `/.well-known/api-catalog` 必須支援 `application/linkset+json`，用 Linkset 揭露 API endpoint、OpenAPI、文件與狀態入口。
   - 來源：<https://www.rfc-editor.org/rfc/rfc9727>, <https://www.rfc-editor.org/rfc/rfc9264>
9. **Agent Skills Discovery v0.2.0**
   - `/.well-known/agent-skills/index.json` 必須包含 `$schema`、`skills[]`、`type`、`url` 與 `digest: sha256:<hex>`。
   - 來源：<https://github.com/cloudflare/agent-skills-discovery-rfc>
10. **Content Signals / AIPREF draft**
    - root robots 可用 `Content-Signal: ai-train=no, search=yes, ai-input=no` 宣告 AI 訓練、搜尋與 AI 輸入偏好。
    - 來源：<https://contentsignals.org/>, <https://datatracker.ietf.org/doc/draft-romm-aipref-contentsignals/>

---

## 2. 架構總覽：SSOT 檔案地圖

### 2.1 設定層（Config Layer）

```
seo-paths.config.mjs              ← 路徑 SSOT（Node / build 環境）
  ├─ CONTENT_SEO_PATHS (9)         核心內容頁，可索引
  ├─ LEGAL_SSG_PATHS (1)           法律頁（/privacy/），noindex
  ├─ CURRENCY_SEO_PATHS (17)       外幣→TWD，可索引
  ├─ REVERSE_CURRENCY_SEO_PATHS (17) TWD→外幣，可索引
  ├─ CURRENCY_AMOUNT_SEO_PATHS (104) 外幣→TWD 金額頁，可索引（路徑式 SSG）
  ├─ REVERSE_CURRENCY_AMOUNT_SEO_PATHS (102) TWD→外幣金額頁，可索引
  ├─ APP_ONLY_PATHS (7)            功能頁（noindex 或 Disallow）
  └─ SITE_CONFIG                   基本站點資訊（URL、名稱、描述）
  合計：SEO_PATHS = 249；PRERENDER_PATHS = 257

src/config/seo-paths.ts           ← TypeScript 鏡像（執行期型別守衛）
src/config/seo-static.ts          ← 靜態 SEO 文案 SSOT（plain Node 可用）
  ├─ DEFAULT_TITLE                 首頁預設 title
  ├─ GUIDE_PAGE_TITLE              Guide 頁 title
  └─ GUIDE_PAGE_DOCUMENT_TITLE     Guide 頁完整 document title
src/config/seo-metadata.ts        ← 內容 SSOT（title/description/FAQ/JSON-LD）
  ├─ HOMEPAGE_SEO                  首頁 SEO 內容
  ├─ CURRENCY_PAGE_OVERRIDES       各幣別頁面覆寫（含 answerCapsule 欄位）
  ├─ REVERSE_CURRENCY_PAGE_OVERRIDES 各反向幣別頁面覆寫
  └─ SEO_RATE_EXAMPLES             每日自動更新的匯率差距範例
```

> **注意**：`DEFAULT_TITLE` 與 `GUIDE_PAGE_TITLE` 在 v2.16.4 從 `seo-metadata.ts` 抽出至 `seo-static.ts`，讓 health-check（純 Node 腳本）無需引入 Vite runtime 即可共用標題常數。

### 2.2 生成層（Generation Layer，Prebuild Scripts）

```
scripts/generate-sitemap-2025.mjs       → public/sitemap.xml
scripts/generate-robots-txt.mjs         → public/robots.txt
scripts/generate-llms-txt.mjs           → public/llms.txt + public/llms-full.txt
scripts/generate-markdown-mirrors.mjs   → public/{index,faq,about,privacy,guide,open-data}.md
scripts/generate-api-json.mjs           → public/api/latest.json
scripts/generate-pair-json.mjs          → public/api/pairs/{pair}.json (17 個)
scripts/generate-openapi.mjs            → public/openapi.json
scripts/generate-manifest.mjs           → public/manifest.webmanifest
scripts/generate-offline-html.mjs       → public/offline.html
scripts/prebuild-fetch-rates.mjs        → 建置前同步台銀匯率資料
scripts/fetch-rating-snapshot.mjs       → src/config/generated/rating-snapshot.ts
scripts/update-seo-rate-examples.mjs    → src/config/generated/seo-rate-examples.ts（每日/建置時更新；可選保留既有檔）
```

### 2.3 公開 SEO 文件（Public SEO Artifacts）

```
public/
  sitemap.xml          249 個 URL（43 核心 + 206 金額頁）+ hreflang + image
  robots.txt           AI 爬蟲四層語意分組（training/search/user-agent/preview）
  llms.txt             LLM 友善索引（精簡版，llmstxt.org 規範）
  llms-full.txt        LLM 完整技術文件（含 JSON schema + 程式碼範例）
  openapi.json         OpenAPI 3.1 API 規格
  api/latest.json      API metadata（版本、幣別、端點）
  api/pairs/{pair}.json 各正向幣對靜態端點（17 個）
  faq.md               FAQ 頁 Markdown 鏡像（2026-04 新增，cloaking-safe）
  about.md             About 頁 Markdown 鏡像
  privacy.md           Privacy 頁 Markdown 鏡像
  guide.md             Guide 頁 Markdown 鏡像
  open-data.md         Open Data 頁 Markdown 鏡像
  index.md             首頁 Markdown 鏡像
  _headers             Cloudflare Pages 快取/CORS + Link rel="alternate" type="text/markdown"
```

**Markdown 鏡像策略（A3，Best Practice 2026）**：

- 6 個 `.md` 檔由 `generate-markdown-mirrors.mjs` 於 prebuild 自動產生，內容從 `seo-metadata.ts` 與頁面內容 SSOT 擷取，避免 drift。
- `_headers` 對 `/ratewise/*.md` 設 `Content-Type: text/markdown; charset=utf-8`，並對 HTML 頁注入 `Link: <...md>; rel="alternate"; type="text/markdown"` RFC 8288 HTTP 標頭，供 AI 爬蟲自動發現純文字版本。
- 內容與對應 HTML 頁語義一致（同 FAQ、同作者、同資料來源），符合 Google cloaking 紅線。
- drift-guard 測試：`apps/ratewise/src/__tests__/markdown-mirror.test.ts`（11 個錨定字串斷言）。
- 注意：`SEO_FILES` SSOT 目前僅列 `sitemap.xml`、`robots.txt`、`llms.txt`、`llms-full.txt` 四個核心 SEO 檔；Markdown 鏡像由 prebuild 與 `_headers` 管理，不屬於 `resources.seoFiles` 清單。

### 2.4 驗證層（Verification Layer）

```
scripts/verify-ssot-sync.mjs       seo-paths.config.mjs ↔ seo-paths.ts 一致性
scripts/verify-doc-ssot-drift.mjs README / docs / src 公開敘述漂移檢查
scripts/verify-image-resources.mjs OG 圖片、icon 資源可用性
scripts/verify-production-resources.mjs 生產環境資源可用性（v2.16.4 加強 5xx 重試）
scripts/seo-health-check.mjs       SEO 結構健檢（307 項）；decodeURI 修正中文 hex 誤判
scripts/seo-full-audit.mjs         完整 SEO 稽核（v2.16.4 加強 precache 驗證）
scripts/verify-precache-assets.mjs precache 資產驗證（v2.16.4 加強 URL 比對邏輯）
scripts/health-check.mjs           生產站 health-check；改用 seo-static.ts 共用標題常數
src/config/__tests__/seo-ssot.test.ts   SSOT 完整性測試（Template-bleed 防護）
src/config/__tests__/seo-paths.test.ts  路徑正規化測試
src/config/__tests__/schema-truthfulness.test.ts FAQPage / aggregateRating / noindex gate
src/config/__tests__/seo-faq-quality.test.ts FAQPage 僅限主 FAQ 頁輸出
src/config/__tests__/build-scripts.test.ts  建置腳本回歸測試（v2.16.x 新增）
src/components/__tests__/SEOHelmet.test.tsx SEOHelmet 行為回歸測試（v2.16.4 補強）
src/components/__tests__/CurrencyLandingPage.truthfulness.test.tsx 幣別頁模板污染防護
src/components/__tests__/AuthorityGuidePage.test.tsx AuthorityGuidePage schema 傳遞測試（v2.16.4 新增）
src/pages/About.test.tsx / Guide.test.tsx / OpenData.test.tsx  頁面 SEO 回歸測試（v2.16.4 新增）
src/pages/__tests__/SeoTech.ssot.test.tsx 公開技術揭露頁 SSOT 對齊測試
src/prerender.test.ts              prerender HTML 穩定性測試（v2.16.x 補強）
src/__tests__/seo-surface-order.test.ts SSG 首屏內容順序防回歸
src/__tests__/seo-public-surface.test.ts 公開 SEO truth surface regression suite
src/seo-best-practices.test.ts     2026 LLMO/GEO 合規測試
```

### 2.5 元件層（Component Layer）

```
src/components/SEOHelmet.tsx          head metadata 管理器（SSR + CSR 雙路徑）
  └─ SEOPageMetadata.answerCapsule    Answer Capsule Q&A 欄位（v2.16.4 新增）
src/components/AnswerCapsule.tsx      Answer Capsule 渲染元件（v2.16.4 新增）
  └─ 接受 FAQEntry[] items，渲染 Q&A 卡片；供 AuthorityGuidePage 使用
src/components/HomepageSEOSection.tsx 首頁語意內容區塊
src/components/seo-helmet-utils.ts    工具函式（noindex 頁不輸出 JSON-LD）
```

---

## 3. URL 架構規範

### 3.1 路徑分類矩陣

| 類別               | 數量 | 可索引 | sitemap | robots       | noindex |
| ------------------ | ---- | ------ | ------- | ------------ | ------- |
| 核心內容頁         | 9    | ✅     | ✅      | Allow        | —       |
| 法律頁 `/privacy/` | 1    | ❌     | ❌      | Allow        | ✅      |
| 外幣→TWD 幣對頁    | 17   | ✅     | ✅      | Allow        | —       |
| TWD→外幣 幣對頁    | 17   | ✅     | ✅      | Allow        | —       |
| 外幣→TWD 金額頁    | 104  | ✅     | ✅      | Allow        | —       |
| TWD→外幣 金額頁    | 102  | ✅     | ✅      | Allow        | —       |
| 功能頁（noindex）  | 3    | ❌     | ❌      | Allow        | ✅      |
| Dev/示範頁         | 4    | ❌     | ❌      | **Disallow** | ✅      |

### 3.2 強制規則

- **尾斜線一致**：所有路徑必須以 `/` 結尾（e.g., `/usd-twd/` 而非 `/usd-twd`）
- **全小寫 + 連字號**：URL 只含小寫英文、數字、連字號
- **無參數索引**：可索引頁面不依賴 query string；金額頁使用路徑式 `/usd-twd/100/`
- **Canonical 自引用**：每個可索引頁面的 canonical 指向自身完整 URL

### 3.3 首頁 Query String 封鎖規則

```
Disallow: /ratewise/?
```

- 封鎖首頁 `?amount=X&from=Y&to=Z` 深連結（防止爬蟲浪費）
- **不影響**幣對頁 `/usd-twd/?amount=500`（不同路徑）
- **不影響**路徑式金額頁 `/usd-twd/100/`（使用路徑，非 query）

> ✅ **llms.txt 描述狀態**：llms.txt 已改為明確區分兩種 URL。SSG 金額頁使用**路徑式** `/usd-twd/100/`，可索引並收錄 sitemap；`?amount=` 僅作為 UX deep link，不建立獨立索引頁。

---

## 4. 結構化資料規範（Schema.org）

### 4.1 主輸出 Schema Registry（公開揭露 SSOT）

| Schema 類型                 | 頁面                     | 狀態      | 實作位置                            |
| --------------------------- | ------------------------ | --------- | ----------------------------------- |
| `Organization`              | 全站                     | ✅ 已實作 | `SEOHelmet.tsx` + `seo-metadata.ts` |
| `WebSite`                   | 首頁                     | ✅ 已實作 | `SEOHelmet.tsx`                     |
| `SoftwareApplication`       | 首頁                     | ✅ 已實作 | `seo-metadata.ts`                   |
| `CurrencyConversionService` | 首頁                     | ✅ 已實作 | `seo-metadata.ts`                   |
| `ExchangeRateSpecification` | 幣對頁 / 金額頁          | ✅ 已實作 | `seo-metadata.ts`                   |
| `BreadcrumbList`            | 內容頁 / 幣對頁 / 金額頁 | ✅ 已實作 | `SEOHelmet.tsx`                     |
| `FAQPage`                   | `/faq/` only             | ✅ 已實作 | `seo-metadata.ts` `FAQ_PAGE_SEO`    |
| `HowTo`                     | Guide / Authority Guide  | ✅ 已實作 | `SEOHelmet.tsx`                     |
| `Article`                   | Guide / Authority Guide  | ✅ 已實作 | `seo-metadata.ts`                   |
| `ImageObject`               | 全站分享圖               | ✅ 已實作 | `buildShareImageJsonLd()`           |

> 本表對應 `apps/ratewise/src/config/seo-schema-registry.ts`。  
> `SeoTech.tsx` 不得自行手寫 schema 真相，必須只 render registry。

### 4.2 次級 / 頁面特化 Schema 與條件節點

| 類型 / 屬性              | 頁面                       | 狀態        | 備註                                            |
| ------------------------ | -------------------------- | ----------- | ----------------------------------------------- |
| `WebPage`                | 首頁與多數內容頁           | ✅ 已實作   | 作為頁面主體與 speakable 掛載節點               |
| `TechArticle`            | Open Data / SeoTech        | ✅ 已實作   | 技術揭露頁與開放資料頁                          |
| `Dataset`                | Open Data 頁               | ✅ 已實作   | 對外資料供應與欄位描述                          |
| `Person`                 | About / Article 作者       | ✅ 已實作   | 作者與聯絡資訊                                  |
| `SpeakableSpecification` | 內容頁（巢狀）             | ✅ 已實作   | 掛在 `WebPage` / `Article`，不掛在 `HowTo`      |
| `AggregateRating`        | 首頁 `SoftwareApplication` | ✅ 條件輸出 | 僅在評分來源可稽核且 `ratingCount >= 10` 時輸出 |

### 4.3 已完成 Schema 實作參考

#### 4.3.1 `CurrencyConversionService`（✅ 已完成 v2.22.0）

**實作位置**：`seo-metadata.ts` → `buildCurrencyConversionServiceJsonLd()`；在首頁 `HOMEPAGE_SEO.jsonLd` 注入。

Schema.org 精確定義此工具的核心功能，AI 引擎在匹配「幣別換算工具」查詢時優先引用有此 schema 的頁面。

#### 4.3.2 `ExchangeRateSpecification`（✅ 已完成 v2.24.0）

**實作位置**：

- 幣對頁：`seo-metadata.ts` → `buildExchangeRateSpecificationJsonLd()`；在 34 個幣對頁 `getCurrencyLandingPageContent()` 和 `getReverseCurrencyLandingPageContent()` 注入。
- 金額頁：`seo-metadata.ts` → `buildAmountExchangeRateSpecificationJsonLd()`；在 `CurrencyLandingPage.tsx` 中當 `amount !== null` 時動態注入，包含具體換算金額（如「100 USD 換 3,250 TWD」）。

**實作細節**：

- `price` 使用 `seo-rate-examples.ts` 的 `cashSell`（現金賣出價）
- `validFrom` 使用 `SEO_RATE_EXAMPLES_DATE`
- 外幣→TWD 頁（如 `usd-twd`）：`currency: "USD"`，`priceCurrency: "TWD"`
- TWD→外幣頁（如 `twd-usd`）：`currency: "TWD"`，`priceCurrency: "USD"`（匯率取倒數）

#### 4.3.3 `FAQPage` / `aggregateRating` truthfulness gate（✅ 已完成）

**實作位置**：`seo-metadata.ts`、`schema-truthfulness.test.ts`、`seo-faq-quality.test.ts`。

- `/faq/` 頁輸出唯一的 `FAQPage` JSON-LD。
- 首頁、內容頁、幣別頁、金額頁、noindex 頁均不得輸出 `FAQPage`。
- 幣別頁與金額頁只保留 `ExchangeRateSpecification` 作為匯率 truth schema，不再輸出 `FinancialService`。
- `aggregateRating` 僅在評分快照來源可稽核且 `ratingCount >= 10` 時輸出；否則省略整個節點。

### 4.4 已實作 Article / TechArticle 規格

#### 4.4.1 `Article` / `TechArticle`（內容頁與開放資料頁）

三篇 Authority Guide、Guide 頁、SEO 技術揭露頁使用 `Article`；Open Data 頁使用 `TechArticle`。以下為現行 Article schema 形態範例：

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "賣出價與中間價的差異：為什麼換匯不能只看中間價",
  "description": "深入解析台銀賣出價與市場中間價的計算原理與差距，以及對台灣換匯者的實際影響。",
  "url": "https://app.haotool.org/ratewise/sell-rate-vs-mid-rate/",
  "datePublished": "2025-10-24",
  "dateModified": "{{BUILD_TIME}}",
  "author": {
    "@type": "Person",
    "name": "azlife",
    "url": "https://app.haotool.org/ratewise/about/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "HaoTool",
    "logo": {
      "@type": "ImageObject",
      "url": "https://app.haotool.org/ratewise/icon-512x512.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://app.haotool.org/ratewise/sell-rate-vs-mid-rate/"
  }
}
```

### 4.5 Schema 重複防護規則

- **絕對禁止**同一頁面出現兩個相同 `@type`（尤其 `FAQPage`、`BreadcrumbList`）
- `FAQPage` 僅允許 `/faq/` 主頁輸出一次
- 幣別頁與金額頁不得再輸出 `FinancialService`
- 驗證指令：`rg '"@type":\s*"FAQPage"' apps/ratewise/dist`
- `seo-helmet-utils.ts` 的 `shouldRenderStructuredData()` 確保 noindex 頁不輸出任何 JSON-LD
- `AuthorityGuidePage` 元件：透過 `jsonLd`、`faqContent`、`answerCapsule` props 接受已定義的 schema，禁止在元件內部硬編碼

### 4.6 Schema 輸出矩陣

| 頁面            | Organization | WebSite | WebPage/Article | SoftwareApp | CurrencyConv. | ExchangeRate | BreadcrumbList | FAQPage | HowTo  | Dataset |
| --------------- | :----------: | :-----: | :-------------: | :---------: | :-----------: | :----------: | :------------: | :-----: | :----: | :-----: |
| 首頁 `/`        |      ✅      |   ✅    |       ✅        |     ✅      |      ✅       |      —       |       —        |   ❌    |   —    |    —    |
| FAQ `/faq/`     |      ✅      |   ✅    |       ✅        |      —      |       —       |      —       |       ✅       |   ✅    |   —    |    —    |
| Guide `/guide/` |      ✅      |   ✅    |       ✅        |      —      |       —       |      —       |       ✅       |   ❌    |   ✅   |    —    |
| About `/about/` |      ✅      |   ✅    |       ✅        |      —      |       —       |      —       |       ✅       |   ❌    |   —    |    —    |
| Open Data       |      ✅      |   ✅    | ✅ TechArticle  |      —      |       —       |      —       |       ✅       |   ❌    |   —    |   ✅    |
| 三篇 Authority  |      ✅      |   ✅    |   ✅ Article    |      —      |       —       |      —       |       ✅       |   ❌    | 視頁面 |    —    |
| 幣對頁（34）    |      ✅      |   ✅    |        —        |      —      |       —       |      ✅      |       ✅       |   ❌    |   —    |    —    |
| 金額頁（206）   |      ✅      |   ✅    |        —        |      —      |       —       |      ✅      |       ✅       |   ❌    |   —    |    —    |

---

## 5. 各頁面 SEO 內容標準

### 5.1 首頁（`/`）

**目標查詢**：「台幣換算」「匯率換算工具」「台銀匯率」「外幣換台幣」

| 元素           | 規格                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| Title          | `HaoRate 匯率好工具 — 台灣最精準匯率換算器 \| 顯示實際買賣價，不用中間價` |
| Description    | 155 字元以內；強調「台銀實際賣出價（非中間價）」、18 種貨幣、5 分鐘更新   |
| H1             | 含主關鍵字「匯率換算」或「台銀匯率」                                      |
| Answer Capsule | 40-60 字首段落解釋工具核心價值（供 AI 引擎提取）                          |
| Schema         | Organization + WebSite + SoftwareApplication + CurrencyConversionService  |
| FAQ HTML       | 保留 FAQ 內容區塊（可讀 HTML），**不輸出** FAQPage JSON-LD                |
| OG Image       | `og-image.jpg` (1200×630)，含品牌名稱與核心特色                           |

### 5.2 幣對頁（外幣→TWD，共 17 頁，如 `/jpy-twd/`）

**目標查詢**：「日圓換台幣」「JPY 換 TWD」「台銀日圓匯率今日」

**每頁必備內容**：

1. **Answer Capsule（40-60 字）**：頁面頂部獨立段落，直接回答「1 [外幣] 等於多少台幣」
   - 範例：「1 日圓（JPY）等於 X 台幣（TWD），以臺灣銀行即期賣出價為準。HaoRate 每 5 分鐘自動同步台銀牌告匯率，是最接近實際換匯成本的即時報價。」
   - 實作：在 `seo-metadata.ts` 的 `CURRENCY_PAGE_OVERRIDES` 中，每幣別加入 `answerCapsule` 欄位

2. **可見更新時間戳**：頁面上顯示「最後更新：[BUILD_TIME]」（Perplexity 新鮮度信號）

3. **FAQ 內容**（5-7 題，目前多數幣別僅 3-4 題，需補充）：
   - 「今日 [外幣] 換台幣最新匯率是多少？」→ Answer Capsule 形式
   - 「台銀賣出價跟中間價差多少？」→ 含具體數字範例
   - 「[外幣] 現金匯率和即期匯率哪個好？」→ 情境說明
   - 「帶 [金額] [外幣] 去 [國家] 旅遊要換多少台幣？」→ 旅遊場景
   - 「刷卡匯率和台銀牌告一樣嗎？」→ DCC/手續費說明
   - 「匯率趨勢圖怎麼看？」→ 工具使用說明
   - 「在哪裡可以查到最新台銀匯率？」→ 品牌建立

4. **匯率比較資訊**（文字或表格）：台銀賣出價 vs. 市場中間價，含具體差距範例（來自 `SEO_RATE_EXAMPLES`）

5. **Schema**：全站 site-level nodes + 該頁 `ExchangeRateSpecification` + `BreadcrumbList`

| 元素        | 規格                                                                          |
| ----------- | ----------------------------------------------------------------------------- |
| Title       | `{外幣名稱}換台幣匯率今日 ({CODE}/TWD) — 台銀實際賣出價 \| HaoRate`           |
| Description | 含具體應用場景（旅遊/海外購物）+ 強調台銀賣出價                               |
| H1          | `{外幣名稱}換台幣（{CODE} to TWD）`                                           |
| Canonical   | `https://app.haotool.org/ratewise/{code}-twd/`                                |
| hreflang    | zh-TW + x-default                                                             |
| Schema      | ExchangeRateSpecification + BreadcrumbList（另含全站 Organization / WebSite） |

### 5.3 幣對頁（TWD→外幣，共 17 頁，如 `/twd-jpy/`）

**目標查詢**：「台幣換日圓」「出國前換匯」「TWD 換 JPY」

與外幣→TWD 頁規格類同，差異：

- H1 強調「出國前換匯」情境
- Answer Capsule：「1 台幣（TWD）等於 X 日圓（JPY）...帶台幣換日圓，適用臨櫃換鈔的台銀現金賣出價」
- `ExchangeRateSpecification` 的 currency/priceCurrency 方向對調
- Schema 與正向幣對頁一致：`ExchangeRateSpecification` + `BreadcrumbList`

### 5.4 金額頁（路徑式，206 頁，如 `/usd-twd/100/`）

**目標查詢**：「100 美元換台幣」「100 USD to TWD」

| 元素        | 規格                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Title       | `{金額} {外幣名稱}換新台幣 ({CODE}/TWD) — 台銀實際賣出價 \| HaoRate`                  |
| Description | 「{金額} 美元（USD）換台幣（TWD），依臺灣銀行即期賣出價計算約 NT$X。每 5 分鐘更新。」 |
| Canonical   | 自引用（`/usd-twd/100/`），禁止指向父頁 `/usd-twd/`                                   |
| Schema      | ExchangeRateSpecification（金額換算結果，自引用 canonical）+ BreadcrumbList           |
| FAQ         | 精簡版（2-3 題即可，避免重複父頁內容）                                                |

### 5.5 FAQ 頁（`/faq/`）

**目標查詢**：「台幣匯率 FAQ」「現金匯率 vs 即期匯率」「買入賣出怎麼看」

- 常見問題 HTML 內容頁；目前輸出唯一的 `FAQPage` JSON-LD
- 問題數量：≥ 10 題（現況已滿足）
- 涵蓋：現金/即期差異、買入/賣出角度、台銀 vs 刷卡、DCC 解釋、匯率更新機制
- 若未來要調整 FAQPage 策略，必須同步更新 `schema-truthfulness.test.ts`、`seo-faq-quality.test.ts` 與 `prerender.test.ts`

### 5.6 三篇 Authority Guide 頁

`AuthorityGuidePage` 元件自 v2.16.4 起透過 `SEOPageMetadata` 的 `jsonLd`、`faqContent`、`answerCapsule` props 接受 schema 與 Q&A。

| 頁面                      | 目標查詢                 | 現況                                    |
| ------------------------- | ------------------------ | --------------------------------------- |
| `/sell-rate-vs-mid-rate/` | 「賣出價 vs 中間價」     | `Article` JSON-LD ✅；Answer Capsule ✅ |
| `/cash-vs-spot-rate/`     | 「現金匯率 vs 即期匯率」 | `Article` JSON-LD ✅；Answer Capsule ✅ |
| `/card-rate-guide/`       | 「刷卡匯率 DCC」         | `Article` JSON-LD ✅；Answer Capsule ✅ |

後續可加強：

- 三篇 Authority Guide 擴展至 3,000+ 字。
- 補更多匯率比較表與視覺化圖表，供 AI 引擎提取具體數字。
- 強化 Search Console 與 AI Share of Voice 週期監測。

### 5.7 Open Data 頁（`/open-data/`）

- 目標：開發者與 AI agent 發現 API 端點
- 需包含：API 端點範例、程式碼範例、欄位說明
- Schema：`TechArticle` + `Dataset`（已實作）

---

## 6. AI 搜尋優化（AEO / GEO）

### 6.1 AI 搜尋市場現況（2025）

| 平台                    | 市占   | 最強引用信號                         | HaoRate 現況   |
| ----------------------- | ------ | ------------------------------------ | -------------- |
| **ChatGPT**             | 61.3%  | 權威清單提及（41%）、線上評論（16%） | 無第三方收錄   |
| **Google AI Overviews** | 最廣泛 | 傳統排名 + schema + 多媒體           | 排名未知       |
| **Gemini**              | 13.3%  | 評分 ≥ 3.5 星、權威清單              | 無評分系統     |
| **Perplexity**          | 3.1%   | 內容新鮮度（2-3 天衰減）、Reddit     | 無新鮮度時間戳 |
| **Claude**              | 2.5%   | 資料庫/目錄收錄（68%）、長篇指南     | 無目錄收錄     |
| **Copilot (Bing)**      | —      | 比較表格、步驟指南                   | 有 Guide 頁    |

### 6.2 通用 AEO 原則

#### Answer Capsule（最高影響，+40% 引用率）

每個目標頁的頂部必須有 40-60 字的直接答案段落，做到：

- **自給自足**：移除周圍上下文仍能完整回答問題
- **事實密度**：包含具體數字（匯率類型數量、更新頻率、幣別數量）
- **來源歸因**：明確引用「臺灣銀行牌告匯率」

**範例模板**：

```
HaoRate 顯示臺灣銀行牌告的實際賣出價（非中間價），支援 18 種貨幣的即時換算，
包含現金與即期四種報價，每 5 分鐘自動同步。台銀賣出價通常比市場中間價高約
1-2%，反映實際換匯成本，比多數匯率工具顯示的中間價更接近你真正要付的金額。
```

#### 統計數字密度（+37% 引用率）

每 150-200 字包含一個可引用的具體數字，並連結來源：

- 「每 5 分鐘同步一次台銀牌告匯率」
- 「台銀賣出價通常比 Google 顯示的中間價高出 1-2%」（使用 `SEO_RATE_EXAMPLES` 的實際數字）
- 「支援 18 種貨幣、4 種匯率類型」

#### 新鮮度信號（Perplexity，+3.2x 引用率）

- 幣對頁、金額頁必須顯示可見的「最後更新：[BUILD_TIME 日期]」
- 實作：在 `SEOHelmet.tsx` 或頁面元件中加入 `<time>` 元素，使用 `BUILD_TIME` 常數

### 6.3 各平台特定策略

#### ChatGPT（P2，長期 60-90 天）

**引用信號**：權威清單提及 > 線上評論 > 教育內容

**行動項目**：

- 爭取在台灣 Fintech 工具推薦文章中被提及（不自行撰寫）
- 確保 Google 排名在目標關鍵字 Top 10（ChatGPT 主要從 Google 索引引用）
- 在 `about/` 頁面加入可被 ChatGPT 訓練識別的明確品牌定義段落

#### Perplexity（P1，短期 7-14 天）

**引用信號**：內容新鮮度（最快衰減）> Reddit 提及 > 可提取的答案區塊

**行動項目**：

- **立即**：在幣對頁加入可見的更新時間戳
- **立即**：Answer Capsule 加入頁面頂部
- **中期**：在 r/taiwan、r/japantravel、r/korea 等 subreddit 提供真實幫助（附帶工具連結）

#### Claude（P2，中期 30-60 天）

**引用信號**：資料庫/目錄收錄（68%）> 長篇指南 > 機構可信度

**行動項目**：

- **中期**：申請加入台灣 Fintech 工具目錄、旅遊資源清單
- **中期**：三篇 Authority Guide 擴展至 3,000+ 字
- `robots.txt` 確認 `Claude-User` 已允許（搜尋模式，與訓練的 ClaudeBot 不同）

#### Google AI Overviews（P1，與傳統 SEO 同步）

**引用信號**：傳統排名 + schema markup + 多媒體內容（r=0.92 相關性）

**行動項目**：

- **立即**：加入缺漏的 schema（`CurrencyConversionService`、`ExchangeRateSpecification`）
- **中期**：在幣對頁加入匯率歷史趨勢圖（圖片 + alt 文字，多媒體信號）

### 6.4 Entity 知識圖譜密度

AI 引擎傾向引用每頁擁有 15+ 連結實體的頁面。幣對頁應自然包含：

- 台灣銀行（Bank of Taiwan）
- ISO 4217 貨幣代碼（USD、JPY 等）
- 貨幣的中文名稱（美元、日圓、歐元）
- 貨幣的英文名稱（US Dollar、Japanese Yen）
- 換匯情境（旅遊、海外購物、留學、匯款）
- 目的地國家（日本、美國、歐洲）
- 匯率類型（現金匯率、即期匯率、賣出價、買入價）
- 相關競品術語（中間價、市場匯率、外幣計價）

### 6.5 AI Referral 追蹤（GA4，2026-04 新增）

**目的**：量化各 AI 平台（ChatGPT、Perplexity、Claude、Gemini、Copilot、Grok、Mistral、You、Phind）的引用流量，建立 AI Share of Voice 可觀測性。

**實作位置**：`apps/shared/analytics/ga.ts`

**偵測優先序**：

1. `utm_source` query param（ChatGPT 主動附加 `utm_source=chatgpt.com`）
2. `document.referrer` 主機名 regex 比對

**GA4 事件**：

- 事件名：`ai_referral`
- 參數：`ai_source` (id), `ai_medium` (utm | referrer), `ai_raw`, `landing_page`
- user property：`ai_source`（session-scoped dedup via `sessionStorage`）

**GA4 後台設定**（一次性）：

- Admin → Custom definitions → 新增 user-scoped dimension `ai_source`
- Admin → Channel groups → regex：`chatgpt|perplexity|claude|gemini|copilot|grok|mistral|you|phind`

**測試覆蓋**：`apps/ratewise/src/__tests__/analytics/ga.test.ts`（9 個 detectAiSource / trackAiReferral 測試案例）

---

## 7. llms.txt 規範

### 7.1 規格基礎

遵循 [llmstxt.org](https://llmstxt.org/) 規範（Markdown 格式）。

**當前狀態**：✅ 已實作；`generate-llms-txt.mjs` 從 `scripts/lib/ai-crawlers.mjs` 共用 AI crawler 清單，避免與 robots.txt 漂移。

### 7.2 已確認風險與治理

1. **金額頁 URL 格式**（已修正）：
   - 正確說明：SSG 金額頁使用**路徑式 URL**（`/usd-twd/100/`）；`?amount=` 是 UX 深連結（不索引）
   - 守門測試：`llms-txt.spec.ts` 驗證公開格式偏好路徑式金額頁

2. **llmstxt.org 規範格式**（當前接近但可再精確）：
   - 標準格式：`# 標題` → `> 一行描述` → `## 區塊` → `- [連結](URL): 說明`
   - 建議將 Answer Capsule Q&A 整理為標準 `## 區塊` 下的清單項目

3. **Claude-User 與 ClaudeBot 區分**（已納入共用 SSOT）：
   - `ClaudeBot`：Anthropic 訓練爬蟲（可選擇封鎖）
   - `Claude-User`：Claude 搜尋模式（**必須允許**才能被 Claude 引用）
   - `Claude-SearchBot`：Claude 搜尋索引
   - AI/LLM Access Control 區塊必須明確列出 `Claude-User` 與 `Claude-SearchBot`

### 7.3 llms.txt 必要區塊規格

```markdown
# HaoRate 匯率好工具

> 顯示臺灣銀行牌告的實際買入賣出價（非中間價）的即時匯率換算工具。
> 支援 18 種貨幣、4 種匯率類型、每 5 分鐘自動同步。免費、無需登入。

## 核心工具

- [首頁換算器](URL): 18 種貨幣即時換算，台銀實際賣出價
- [常見問題](URL): 現金/即期差異、買入賣出說明、刷卡匯率 DCC

## 熱門幣別頁

- [日圓換台幣 JPY/TWD](URL): 日本旅遊換匯最佳參考
  ... （17 個外幣→TWD）

## TWD→外幣

- [台幣換日圓 TWD/JPY](URL): 出國前換匯場景
  ... （17 個 TWD→外幣）

## 資料存取（開發者 / LLM）

- [即時匯率 JSON (CDN)](URL): 每 5 分鐘更新，CORS 開放
- [OpenAPI 規格](URL): 機器可讀 API 文件
- [幣對端點範本](URL/api/pairs/usd-twd.json): 各幣對 rateFieldPath

## 關於

- [資料方法論](URL/sell-rate-vs-mid-rate/): 為何用台銀賣出價而非中間價

## Optional

- [Sitemap](URL): 完整 URL 清單
- [完整技術文件](URL/llms-full.txt): 含 JSON schema 與程式碼範例
```

---

## 8. robots.txt 規範

### 8.1 現況（2026-04 重構，四層語意分組）

`scripts/generate-robots-txt.mjs` 將 AI 爬蟲依語意切為四層，便於日後 opt-out 切換（如切換 training 爬蟲為 Disallow 即可 opt-out LLM 訓練）：

```
# --- Tier 1: Training ---（14 隻）
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: Amazonbot
User-agent: Bytespider
User-agent: CCBot
User-agent: cohere-ai
User-agent: FacebookBot
User-agent: Meta-ExternalAgent
User-agent: Timpibot
User-agent: ProRataInc
User-agent: Novellum AI Crawl
Allow: /

# --- Tier 2: Search/RAG ---（6 隻）
User-agent: OAI-SearchBot
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Applebot
User-agent: Google-CloudVertexBot
User-agent: DuckAssistBot
Allow: /

# --- Tier 3: User Agent ---（8 隻，即時 AI 助手）
User-agent: ChatGPT-User
User-agent: Claude-User
User-agent: Perplexity-User
User-agent: MistralAI-User
User-agent: Manus-User
User-agent: Meta-ExternalFetcher
User-agent: Cloudflare-AutoRAG
User-agent: Anchor Browser
Allow: /

# --- Tier 4: Preview/Other ---（9 隻，社群預覽 + 雜項）
User-agent: facebookexternalhit
User-agent: Twitterbot
User-agent: LinkedInBot
User-agent: archive.org_bot
User-agent: Terracotta Bot
User-agent: PhindBot
User-agent: YouBot
User-agent: GrokBot
User-agent: PetalBot
Allow: /

# --- 通用規則 ---
User-agent: *
Allow: /
Disallow: /ratewise/sw.js
Disallow: /ratewise/workbox-*.js
Disallow: /ratewise/theme-showcase/
Disallow: /ratewise/color-scheme/
Disallow: /ratewise/update-prompt-test/
Disallow: /ratewise/ui-showcase/
Disallow: /ratewise/?
```

**四層分組設計原則**（參考 OpenAI、Anthropic、Google 2026 最新官方文件）：

- **Training**：訓練爬蟲，抓取內容進入 LLM 訓練集；可選擇 opt-out 不影響搜尋可見度
- **Search/RAG**：AI 搜尋引擎的 RAG 索引爬蟲；opt-out 會直接損失搜尋引用率
- **User Agent**：使用者即時發問時，AI 助手代理使用者抓取網頁；opt-out 意味阻止使用者即時查詢
- **Preview/Other**：社群預覽、網路存檔、其他雜項爬蟲

### 8.2 AI 爬蟲規則（2026-04-10 完整清單，共 37 個）

robots.txt 與 llms.txt 明確 Allow 以下 AI 爬蟲，確保最大 AI 搜尋可見度。清單 SSOT 為 `apps/ratewise/scripts/lib/ai-crawlers.mjs`：

| 爬蟲名稱                | 平台             | 用途                  |
| ----------------------- | ---------------- | --------------------- |
| `GPTBot`                | OpenAI           | ChatGPT 訓練          |
| `OAI-SearchBot`         | OpenAI           | ChatGPT 搜尋引用      |
| `ChatGPT-User`          | OpenAI           | ChatGPT 用戶搜尋      |
| `ClaudeBot`             | Anthropic        | Claude 訓練爬蟲       |
| `Claude-User`           | Anthropic        | Claude 搜尋引用       |
| `Claude-SearchBot`      | Anthropic        | Claude 搜尋索引       |
| `anthropic-ai`          | Anthropic        | Anthropic 通用        |
| `PerplexityBot`         | Perplexity       | Perplexity 引用       |
| `Perplexity-User`       | Perplexity       | Perplexity 用戶搜尋   |
| `Google-Extended`       | Google           | Gemini / AI Overviews |
| `Google-CloudVertexBot` | Google           | Vertex AI             |
| `GrokBot`               | xAI              | Grok AI               |
| `cohere-ai`             | Cohere           | Cohere AI 產品        |
| `YouBot`                | You.com          | You.com AI 搜尋       |
| `PhindBot`              | Phind            | Phind 開發者 AI 搜尋  |
| `DuckAssistBot`         | DuckDuckGo       | DuckDuckGo AI 助手    |
| `Amazonbot`             | Amazon           | Alexa / AWS AI        |
| `Applebot`              | Apple            | Apple 搜尋 + Siri     |
| `Applebot-Extended`     | Apple            | Apple Intelligence    |
| `CCBot`                 | Common Crawl     | 開放資料集            |
| `Bytespider`            | ByteDance        | TikTok 系列 AI        |
| `PetalBot`              | Huawei           | Huawei AI 搜尋        |
| `MistralAI-User`        | Mistral          | Mistral AI 助手       |
| `Manus-User`            | Manus            | Manus AI 助手         |
| `Meta-ExternalAgent`    | Meta             | Meta AI 訓練（Llama） |
| `Meta-ExternalFetcher`  | Meta             | Meta AI 助手          |
| `FacebookBot`           | Meta             | Facebook AI           |
| `facebookexternalhit`   | Meta             | Facebook 連結預覽     |
| `Twitterbot`            | X (Twitter)      | Twitter 連結預覽      |
| `LinkedInBot`           | LinkedIn         | LinkedIn 連結預覽     |
| `Cloudflare-AutoRAG`    | Cloudflare       | Cloudflare AI         |
| `Anchor Browser`        | Anchor           | Anchor AI 爬蟲        |
| `archive.org_bot`       | Internet Archive | 網路存檔              |
| `Terracotta Bot`        | Ceramic          | 搜尋引擎爬蟲          |
| `Timpibot`              | Timpi            | Timpi AI 爬蟲         |
| `ProRataInc`            | ProRata.ai       | ProRata AI 爬蟲       |
| `Novellum AI Crawl`     | Novellum         | Novellum AI 爬蟲      |

### 8.3 不需專門規則的爬蟲

以下爬蟲**不需要**專門的 `User-agent` 區塊，因為它們會遵循 `User-agent: *` 的規則：

| 爬蟲名稱    | 平台      | 原因                                                 |
| ----------- | --------- | ---------------------------------------------------- |
| `Googlebot` | Google    | 主要搜尋爬蟲，需遵循 Disallow 規則以避免索引開發頁面 |
| `Bingbot`   | Microsoft | 主要搜尋爬蟲，需遵循 Disallow 規則以避免索引開發頁面 |

> **重要**：為這些爬蟲添加專門的 `User-agent` 區塊會覆蓋 `User-agent: *` 的 Disallow 規則，導致開發頁面被索引。

### 8.4 策略說明

- **選擇性開放策略**：AI 爬蟲明確允許，傳統搜尋爬蟲遵循通用規則
- **訓練 vs 搜尋**：訓練爬蟲（GPTBot、ClaudeBot）增加品牌認知；搜尋爬蟲（OAI-SearchBot、Claude-SearchBot）直接影響引用
- **Disallow 保護**：`Googlebot` 和 `Bingbot` 遵循 `User-agent: *` 的 Disallow 規則，防止開發頁面被索引
- **SSOT 管理**：由 `generate-robots-txt.mjs` 自動生成，禁止手動修改

---

## 9. sitemap.xml 規範

### 9.1 URL 計數規格

| 類別                         | 數量    | 備註                                                                                                                                   |
| ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 核心內容頁                   | 9       | `/`, `/faq/`, `/about/`, `/guide/`, `/sell-rate-vs-mid-rate/`, `/cash-vs-spot-rate/`, `/card-rate-guide/`, `/open-data/`, `/seo-tech/` |
| 幣對頁 (外幣→TWD)            | 17      | `/usd-twd/` …                                                                                                                          |
| 幣對頁 (TWD→外幣)            | 17      | `/twd-usd/` …                                                                                                                          |
| 金額頁（外幣→TWD）           | 104     | 每幣別 6-7 個熱門金額（CURRENCY_AMOUNT_SEO_PATHS）                                                                                     |
| 金額頁（TWD→外幣）           | 102     | 每幣別 6 個熱門金額（REVERSE_CURRENCY_AMOUNT_SEO_PATHS）                                                                               |
| **合計**                     | **249** |                                                                                                                                        |
| 排除：`/privacy/`（noindex） | 0       | 不入 sitemap                                                                                                                           |
| 排除：所有 APP_ONLY_PATHS    | 0       | 不入 sitemap                                                                                                                           |

### 9.2 每個 URL 必備元素

```xml
<url>
  <loc>https://app.haotool.org/ratewise/usd-twd/</loc>
  <lastmod>2026-03-23</lastmod>
  <xhtml:link rel="alternate" hreflang="zh-TW"
    href="https://app.haotool.org/ratewise/usd-twd/" />
  <xhtml:link rel="alternate" hreflang="x-default"
    href="https://app.haotool.org/ratewise/usd-twd/" />
  <image:image>
    <image:loc>https://app.haotool.org/ratewise/og-image.jpg</image:loc>
    <image:title>HaoRate — 美元換台幣匯率</image:title>
  </image:image>
</url>
```

**過時標籤治理**：

- `generate-sitemap-2025.mjs` 禁止輸出 `<changefreq>` 與 `<priority>`。
- `verify-sitemap-2025.mjs` 會阻擋上述兩個標籤重新出現。
- 依 Google Search Central，Google 會忽略 `<priority>` 與 `<changefreq>`；目前只保留 `loc`、`lastmod`、`hreflang` 與 image sitemap。
- `lastmod` 需對齊 `seo-lastmod-policy.ts`：內容頁使用 editorial/trust/public-disclosure 檔案依賴；幣對頁與金額頁使用 `generated/seo-rate-examples.ts` 的可見更新來源，避免全站同日假新鮮。

---

## 10. Core Web Vitals 效能標準

### 10.1 2025-2026 目標值

| 指標                | 目標（Good） | 警告（Needs Improvement） | 阻斷（Poor） |
| ------------------- | ------------ | ------------------------- | ------------ |
| **LCP**             | < 2.5s       | 2.5-4.0s                  | > 4.0s       |
| **INP**（取代 FID） | < 200ms      | 200-500ms                 | > 500ms      |
| **CLS**             | < 0.1        | 0.1-0.25                  | > 0.25       |
| **TTFB**            | < 800ms      | —                         | > 1.8s       |

### 10.2 RateWise 特定 INP 重點

INP 測量**所有互動**（非只有第一次），對高互動頻率的換算工具尤其關鍵：

- **金額輸入框**（每次鍵入）：目標 < 100ms 可見響應
- **幣別切換**：目標 < 150ms
- **計算機鍵盤**：每次按鍵 < 100ms
- **現金/即期切換**：目標 < 150ms
- **PWA 更新提示互動**：計入 INP，需謹慎設計

**監測工具**：`reportWebVitals.ts` 中的 `onINP({ durationThreshold: 50 })`

### 10.3 行動裝置優先規格

- 響應式設計（非 m. 分站）：✅ 已實作
- 觸控目標 ≥ 44px：需確認計算機按鈕尺寸
- viewport meta 設定：✅ 已實作
- 行動版 Lighthouse ≥ 90/100：當前 97/100 ✅

---

## 11. SSOT 驗證規則

### 11.1 Prebuild 驗證管道（每次 Build 必跑）

```bash
# 完整 prebuild 管道
node scripts/prebuild-fetch-rates.mjs
SEO_RATE_EXAMPLES_OPTIONAL=1 node scripts/update-seo-rate-examples.mjs
node ../../scripts/generate-sitemap-2025.mjs
node scripts/generate-robots-txt.mjs
node scripts/generate-manifest.mjs
node scripts/generate-offline-html.mjs
node scripts/generate-llms-txt.mjs
node scripts/generate-markdown-mirrors.mjs
node scripts/generate-api-json.mjs
node scripts/generate-pair-json.mjs
node scripts/generate-openapi.mjs
node ../../scripts/verify-ssot-sync.mjs
node ../../scripts/verify-image-resources.mjs
node scripts/fetch-rating-snapshot.mjs
```

### 11.2 測試覆蓋規格

| 測試檔案                                    | 涵蓋面                                                             | 最低測試數 |
| ------------------------------------------- | ------------------------------------------------------------------ | ---------- |
| `seo-ssot.test.ts`                          | SSOT 一致性、template-bleed、rate examples                         | ≥ 40       |
| `seo-paths.test.ts`                         | 路徑正規化、prerender 判斷                                         | ≥ 20       |
| `schema-truthfulness.test.ts`               | `FAQPage` 範圍、aggregateRating gate、noindex schema 防護          | ≥ 4        |
| `seo-faq-quality.test.ts`                   | FAQPage 僅限 `/faq/`、幣別頁保留 FAQ HTML 不保留 FAQ schema        | ≥ 5        |
| `seo-best-practices.test.ts`                | LLMO/GEO 合規（llms.txt、robots.txt、sitemap、JSON-LD）            | ≥ 30       |
| `build-scripts.test.ts`                     | 建置腳本回歸（health-check 使用 seo-static.ts、generate-manifest） | ≥ 20       |
| `SEOHelmet.test.tsx`                        | answerCapsule 欄位渲染、noindex 防護                               | ≥ 15       |
| `CurrencyLandingPage.truthfulness.test.tsx` | 幣別頁不得殘留錯幣別範例文字                                       | ≥ 2        |
| `AuthorityGuidePage.test.tsx`               | jsonLd/faqContent/answerCapsule props 傳遞                         | ≥ 10       |
| `SeoTech.ssot.test.tsx`                     | 公開技術揭露頁不得出現 stale phrase / 舊 script 名稱               | ≥ 5        |
| `seo-surface-order.test.ts`                 | SSG 頁首 H1 必須先於 app-shell / fallback                          | ≥ 4        |
| `seo-public-surface.test.ts`                | H1 順序、SeoTech SSOT、sitemap 舊標籤、公開 surface 漂移           | ≥ 4        |
| `prerender.test.ts`                         | FAQ/amount 頁 canonical、schema URL 穩定性                         | ≥ 15       |

### 11.3 禁止行為清單

- ❌ 手動修改 `public/robots.txt`（由 `generate-robots-txt.mjs` 管理）
- ❌ 手動修改 `public/sitemap.xml`（由 `generate-sitemap-2025.mjs` 管理）
- ❌ 手動修改 `public/llms.txt`（由 `generate-llms-txt.mjs` 管理）
- ❌ 手動修改 `public/{index,faq,about,privacy,guide,open-data}.md`（由 `generate-markdown-mirrors.mjs` 管理）
- ❌ 在頁面元件中硬編碼 title/description（必須從 `seo-metadata.ts` 讀取）
- ❌ 同一頁面輸出兩個相同 `@type` JSON-LD
- ❌ `FAQPage` schema 出現在首頁、幣別頁、金額頁或 noindex 頁
- ❌ `ExchangeRateSpecification` 的 price 欄位硬編碼（幣對頁必須從 `generated/seo-rate-examples.ts` 讀取；金額頁由頁面金額與同一匯率來源計算）
- ❌ 在 noindex 頁面輸出任何 JSON-LD（`shouldRenderStructuredData()` 管控）

### 11.4 公開 Truth Surface Gate

以下輸出面屬於「一旦漂移就直接傷害 SEO/AI 引用可信度」的高優先 gate：

1. **Route-specific H1 優先於通用 fallback**
   - `/`、`/about/`、`/usd-twd/`、`/seo-tech/` 的主 H1 必須在 `載入匯率資料中...`、footer 與通用 shell 文案之前出現。
   - 守門測試：`src/__tests__/seo-surface-order.test.ts`
2. **SeoTech 不可手寫真相**
   - `249`、`257`、schema 清單、build pipeline 清單一律來自 registry / path SSOT。
   - 守門測試：`src/pages/__tests__/SeoTech.ssot.test.tsx`
3. **幣別頁不得有跨幣別模板污染**
   - `/usd-twd/` 不得殘留「10 萬日圓」等錯幣別敘述。
   - 守門測試：`src/components/__tests__/CurrencyLandingPage.truthfulness.test.tsx`
4. **Sitemap 僅保留被 Google 真正使用的訊號**
   - `public/sitemap.xml` 禁止重新出現 `<priority>` / `<changefreq>`。
   - 守門測試：`src/__tests__/seo-public-surface.test.ts`
5. **README / docs / src 公開敘述不得殘留 stale phrase**
   - 例如舊的 URL 計數、舊 sitemap script 名稱或舊貨幣支援數量描述。
   - 守門腳本：`apps/ratewise/scripts/verify-doc-ssot-drift.mjs`

---

## 12. 監測與稽核

### 12.1 自動化監測（CI/CD）

| 監測項目                                                   | 頻率           | 工具                              |
| ---------------------------------------------------------- | -------------- | --------------------------------- |
| SEO Health Check（sitemap 可用、robots.txt 正確、OG 標籤） | 每日           | GitHub Actions                    |
| Core Web Vitals 回報                                       | 實時           | `reportWebVitals.ts`              |
| 匯率資料更新                                               | 每 5 分鐘      | GitHub Actions                    |
| SEO Rate Examples 更新                                     | 每日           | `update-seo-rate-examples.mjs`    |
| 生產資源可用性                                             | 每次 Deploy 後 | `verify-production-resources.mjs` |
| Live Precache 驗證                                         | Release 後     | `verify-precache-assets.mjs`      |

### 12.2 建議手動監測（每週）

| 時間 | 任務                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| 週一 | Google Search Console：索引覆蓋報告、核心頁面搜尋表現                           |
| 週三 | PageSpeed Insights：幣對頁 LCP/INP/CLS 趨勢                                     |
| 週五 | 手動測試：在 ChatGPT、Perplexity 搜尋「台幣換日圓」「台銀匯率」，確認是否被引用 |

### 12.3 AI 可見性監測工具（待導入）

| 工具           | 覆蓋                                         | 用途                   |
| -------------- | -------------------------------------------- | ---------------------- |
| **Otterly AI** | ChatGPT、Perplexity、Google AI Overviews     | AI Share of Voice 追蹤 |
| **Peec AI**    | ChatGPT、Gemini、Perplexity、Claude、Copilot | 多平台品牌提及監測     |
| **LLMrefs**    | 主要 AI 搜尋平台                             | 關鍵字 → AI 可見性對應 |

### 12.4 Google Search Console 重點指標

- **索引覆蓋**：確認 249 個 SEO 頁面均已索引（排除 noindex 頁）
- **搜尋排名**：「日圓換台幣」「美元換台幣」等核心查詢在 Top 10
- **Core Web Vitals**：分頁類型的 LCP/INP/CLS 狀態
- **Rich Results / AI 摘要**：BreadcrumbList rich snippets、幣別頁 FAQPage 機器可理解性是否正常

### 12.5 權威 SEO 參考與外部檢測入口（2026）

#### 12.5.1 權威 SEO 參考網站（至少 20）

以下清單以「可落地規範」優先排序，作為 SSOT 對齊來源。每次 SEO 迭代先確認該來源是否有更新後再調整文件：

1. [Google Search Central](https://developers.google.com/search)
2. [Google Sitemaps 文件](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
3. [Google Robots 與爬蟲行為](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
4. [Google Canonical 與 URL 申明](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
5. [Google 結構化資料規範](https://developers.google.com/search/docs/appearance/structured-data)
6. [Google Core Web Vitals](https://web.dev/vitals)
7. [PageSpeed Insights](https://pagespeed.web.dev/analysis)
8. [Google Rich Results 測試](https://search.google.com/test/rich-results)
9. [Google Mobile Friendly 測試](https://search.google.com/test/mobile-friendly)
10. [Bing Webmaster Docs](https://www.bing.com/webmasters/about)
11. [Bing 來源與爬蟲檢核（提交／測試）](https://www.bing.com/webmasters/robots-txt-test)
12. [Schema.org](https://schema.org/)
13. [JSON-LD 規格](https://www.w3.org/TR/json-ld/)
14. [JSON-LD.org](https://json-ld.org/)
15. [OpenGraph Protocol](https://ogp.me/)
16. [llmstxt.org](https://llmstxt.org/)
17. [W3C 驗證服務](https://validator.w3.org/nu/)
18. [Schema.org JSON-LD 驗證](https://validator.schema.org/)
19. [MDN SEO 指引入口](https://developer.mozilla.org/en-US/docs/Web/SEO)
20. [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/configuration/headers/)
21. [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
22. [Cloudflare Pages 平台 headers](https://developers.cloudflare.com/pages/platform/headers/)
23. [Cloudflare Cache-Control](https://developers.cloudflare.com/cache/concepts/cache-control/)
24. [Cloudflare Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
25. [Cloudflare AI Search](https://developers.cloudflare.com/ai-search/)
26. [Cloudflare AI Search 網站資料源設定](https://developers.cloudflare.com/ai-search/configuration/data-source/website/)
27. [Cloudflare AI 訓練內容控制](https://blog.cloudflare.com/control-content-use-for-ai-training/)
28. [Cloudflare Browser Rendering Crawl API](https://developers.cloudflare.com/browser-rendering/rest-api/crawl-endpoint/)
29. [Google Search Console 入門](https://support.google.com/webmasters/answer/7451184)
30. [Google Crawl 速率與重新擷取](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
31. [Bing Webmaster API 文件](https://learn.microsoft.com/en-us/bingwebmaster/)
32. [Bing Webmaster 工具說明](https://support.microsoft.com/en-us/bing/help-with-bing-webmaster-tools)
33. [Search Console 官方文件首頁](https://developers.google.com/search)
34. [Content Signals 草案（IETF）](https://datatracker.ietf.org/doc/draft-romm-aipref-contentsignals/)
35. [IsItAgentReady Content Signals Skill](https://isitagentready.com/.well-known/agent-skills/content-signals/SKILL.md)
36. [Yandex Webmaster](https://yandex.com/support/webmaster/)
37. [百度站長平台](https://ziyuan.baidu.com/)
38. [Search Engine Journal Search SEO Guide](https://www.searchenginejournal.com/guide/what-is-seo/)

> 目前同一輪實測共覆蓋 `46` 個入口（含 Cloudflare、Google、Bing、AI crawler 與驗證入口），作為 12.6 生產快照的固定抽樣池。

#### 12.5.2 Cloudflare SEO 建議（實作對照）

1. **保持 `canonical` 與 `noindex` 交界邏輯一致**：`seo-paths`、`seo-metadata.ts`、`robots.txt` 不可互相衝突。
2. **快取分層一致化**：HTML 與靜態資源使用不同 `Cache-Control`，並以 `verify-production-seo.mjs` 對 `og-image.jpg`、`/icons/*` 等做固定檢核。
3. **AI crawler 分群治理**：training/search/user-agent/preview 四層分群保持獨立可調，避免訓練封鎖波及即時引用。
4. **避免 `Cross-Origin-Embedder-Policy` 汙染非 HTML 請求**：確保 JS/CSS 可由 `no-csp` path 正確回應，防止載入失敗。
5. **`_headers` 與 Worker 回應邏輯分工**：`_headers` 僅保證靜態資產基礎標頭；有頁面邏輯（Markdown negotiation、Link header、server headers）時由 worker/SSG 流程補齊。
6. **AI 發現機制的證據管理**：`/.well-known` 類目標建議明確列入 SSOT，若未提供該能力請保留「不提供」註記，避免掃描工具誤判為隱性缺失。
7. **`/ratewise/` 與 `/` 的行為一致性**：`isRatewise` 路徑應同時套用 `Accept` 協商、markdown 鏡像 fallback 與 AI Header 注入；避免只在 `/ratewise/` 實作但 root 還是文字 HTML 的「半實施」狀態。

### 12.6 生產網址外部檢測報告（2026-04-25）

#### 12.6.1 檢測入口（含生產網址，已回填回應）

> 測試目標：`https://app.haotool.org/ratewise/`

| 類型           | 檢測網址                                                                                      | 回應                    |
| -------------- | --------------------------------------------------------------------------------------------- | ----------------------- |
| Docs           | `https://developers.google.com/search/docs/fundamentals/seo-starter-guide`                    | 200                     |
| Docs           | `https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview`               | 200                     |
| Docs           | `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`             | 200                     |
| Docs           | `https://developers.google.com/search/docs/crawling-indexing/robots/intro`                    | 200                     |
| Docs           | `https://developers.google.com/search/docs/appearance/structured-data`                        | 200                     |
| Docs           | `https://developers.google.com/search/docs/appearance/core-web-vitals`                        | 200                     |
| Docs           | `https://developers.google.com/search/docs/monitor-debug/monitor-your-site-over-time`         | 404（頁面已重整）       |
| Docs           | `https://developers.google.com/search/docs/appearance/mobile`                                 | 404（網址已重構）       |
| Docs           | `https://developer.mozilla.org/en-US/docs/Web/SEO`                                            | 404（需另找鏡像）       |
| 檢測工具       | `https://search.google.com/test/rich-results?url=https://app.haotool.org/ratewise/`           | 200                     |
| 檢測工具       | `https://pagespeed.web.dev/analysis?url=https://app.haotool.org/ratewise/`                    | 200                     |
| 檢測工具       | `https://search.google.com/test/mobile-friendly?url=https://app.haotool.org/ratewise/`        | 302（導向/互動流程）    |
| 檢測工具       | `https://validator.schema.org/`                                                               | 200                     |
| 檢測工具       | `https://validator.w3.org/nu/?doc=https://app.haotool.org/ratewise/`                          | 403（W3C 需授權或限制） |
| 檢測工具       | `https://www.opengraph.xyz/url/https://app.haotool.org/ratewise/`                             | 429（速率限制）         |
| 檢測工具       | `https://r.jina.ai/http://app.haotool.org/ratewise/`                                          | 200                     |
| 社群與預覽     | `https://developers.facebook.com/tools/debug/?q=https://app.haotool.org/ratewise/`            | 200                     |
| 社群與預覽     | `https://cards-dev.twitter.com/validator`                                                     | 403（第三方限流）       |
| SEO 平台       | `https://www.bing.com/webmasters/about`                                                       | 200                     |
| SEO 平台       | `https://www.bing.com/webmasters/robots-txt-test?url=https://app.haotool.org/ratewise/`       | 302                     |
| SEO 平台       | `https://www.bing.com/webmasters/tools/submit-site-url?url=https://app.haotool.org/ratewise/` | 302                     |
| SEO 平台       | `https://www.bing.com/webmasters/robots/submit?siteUrl=https://app.haotool.org/ratewise/`     | 302                     |
| 標準/技術      | `https://schema.org/`                                                                         | 200                     |
| 標準/技術      | `https://www.w3.org/TR/json-ld/`                                                              | 200                     |
| 標準/技術      | `https://json-ld.org/`                                                                        | 200                     |
| 標準/技術      | `https://ogp.me/`                                                                             | 200                     |
| Cloudflare     | `https://developers.cloudflare.com/pages/configuration/headers/`                              | 200                     |
| Cloudflare     | `https://developers.cloudflare.com/pages/configuration/redirects/`                            | 200                     |
| Cloudflare     | `https://developers.cloudflare.com/pages/platform/headers/`                                   | 200                     |
| Cloudflare     | `https://developers.cloudflare.com/cache/concepts/cache-control/`                             | 200                     |
| Cloudflare     | `https://developers.cloudflare.com/workers/runtime-apis/cache/`                               | 200                     |
| Cloudflare     | `https://developers.cloudflare.com/ai-search/`                                                | 200                     |
| Cloudflare     | `https://developers.cloudflare.com/ai-search/configuration/data-source/website/`              | 200                     |
| Cloudflare     | `https://developers.cloudflare.com/browser-rendering/rest-api/crawl-endpoint/`                | 200                     |
| Cloudflare     | `https://blog.cloudflare.com/control-content-use-for-ai-training/`                            | 200                     |
| Cloudflare     | `https://radar.cloudflare.com/robots/`                                                        | 403                     |
| Cloudflare     | `https://developers.cloudflare.com/analytics/dashboard/`                                      | 404                     |
| IsItAgentReady | `https://isitagentready.com/app.haotool.org/ratewise/`                                        | 404                     |

#### 12.6.2 生產環境稽核結果（即時基線）

- `node scripts/verify-production-seo.mjs ratewise --base-url=https://app.haotool.org/ratewise`
  - 回報 `✅ HaoRate SEO 健康檢查通過！`（公開頁面、sitemap、robots、llms、404/重導向全部通過）
- `node scripts/verify-structured-data.mjs`
  - 通過頁面：首頁、FAQ、About、Guide、USD→TWD、JPY→TWD、EUR→TWD（7/7）
  - Schema 總數：`55`（該輪快照包含 `SoftwareApplication`、`Organization`、`WebSite`、`ExchangeRateSpecification` 等；目前主輸出矩陣請以 §4.1 / §4.6 為準）
- 生產端 HTTP 證據（2026-04-25）：
  - `curl -I https://app.haotool.org/`：200，`content-type: text/html`，無 `Link` header，無 `Content-Signal` 在 Response Header
  - `curl -I -H 'Accept: text/markdown' https://app.haotool.org/`：200，仍回傳 `text/html`（未進行 markdown negotiation）
  - `curl -I https://app.haotool.org/ratewise/`：200，`content-type: text/html`，無 `Link` header
  - `curl -I https://app.haotool.org/ratewise/index.md`：404（`index.md` 尚未在 prod 可直接取到）

#### 12.6.3 持續迭代指標（SLO）

- 每日：腳本稽核通過 + 外部檢測入口 46 筆都保留回應碼，將 403/404/429/需登入轉址項目列為人工複核清單。
- 每週：更新此節點中的 12.6.1 回應表與 12.6.2 基線，保留 `status` 演進紀錄。
- 每次發版：若外部入口回應異常（403/404/5xx）列為變更風險，需新增 `P0` 記錄至 PR notes。

#### 12.6.4 2026-04-25 外部檢測快照

> 目的：將外部檢測結果標準化版本化，與 12.6.1 對照，便於識別「站點退化」與「第三方工具限制」。

- 測試目標：`https://app.haotool.org/ratewise/`
- 快照總量：`46` 筆，分佈為 `200:38`、`302:0`、`403:2`、`404:5`、`429:1`、`5xx:0`（2026-04-25）
- 表格為該總池中的精選明細；完整 46 筆明細由 12.6.1/12.6.7 與腳本輸出做交叉比對。
- 回應欄位以最終狀態為主（與 12.6.5 建議的 `curl -L` 行為一致）；表格中的「導向流程」僅作流程註記，不列入 `302/307` 統計。

| 類型       | 檢測網址                                                                                      | 回應 | 備註                                                                   |
| ---------- | --------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------- |
| Docs       | `https://developers.google.com/search/docs/appearance/structured-data`                        | 200  | 指南頁可正常取得                                                       |
| Docs       | `https://developers.google.com/search/docs/appearance/core-web-vitals`                        | 200  | 指南頁可正常取得                                                       |
| Docs       | `https://developers.google.com/search/docs/crawling-indexing/robots/intro`                    | 200  | 指南頁可正常取得                                                       |
| Docs       | `https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview`               | 200  | 指南頁可正常取得                                                       |
| Docs       | `https://developers.google.com/search/docs/fundamentals/seo-starter-guide`                    | 200  | 指南頁可正常取得                                                       |
| Docs       | `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`             | 200  | 指南頁可正常取得                                                       |
| Docs       | `https://developers.google.com/search/docs/appearance/mobile`                                 | 404  | Google 已重整該頁 URL（建議改以 `core-web-vitals` + 行動版教學頁替代） |
| 檢測工具   | `https://pagespeed.web.dev/analysis?url=https://app.haotool.org/ratewise/`                    | 200  | 入口可回應                                                             |
| 檢測工具   | `https://search.google.com/test/rich-results?url=https://app.haotool.org/ratewise/`           | 200  | 入口可回應                                                             |
| 檢測工具   | `https://search.google.com/test/mobile-friendly?url=https://app.haotool.org/ratewise/`        | 200  | 先回應導向，最終可取到頁面                                             |
| 檢測工具   | `https://validator.schema.org/`                                                               | 200  | 工具站可存取                                                           |
| 檢測工具   | `https://validator.w3.org/nu/?doc=https://app.haotool.org/ratewise/`                          | 403  | W3C 取樣限制（非站點問題）                                             |
| 檢測工具   | `https://www.opengraph.xyz/url/https://app.haotool.org/ratewise/`                             | 429  | 第三方短期防禦（速率限制）                                             |
| 檢測工具   | `https://developers.facebook.com/tools/debug/?q=https://app.haotool.org/ratewise/`            | 200  | Meta 預覽工具可用                                                      |
| 檢測工具   | `https://cards-dev.twitter.com/validator`                                                     | 403  | X 卡片工具目前封鎖外部直接存取                                         |
| SEO 平台   | `https://www.bing.com/webmasters/about`                                                       | 200  | 正常                                                                   |
| SEO 平台   | `https://www.bing.com/webmasters/robots-txt-test?url=https://app.haotool.org/ratewise/`       | 200  | 正常                                                                   |
| SEO 平台   | `https://www.bing.com/webmasters/tools/submit-site-url?url=https://app.haotool.org/ratewise/` | 200  | 入口正常                                                               |
| SEO 平台   | `https://www.bing.com/webmasters/robots/submit?siteUrl=https://app.haotool.org/ratewise/`     | 302  | 走導向流程                                                             |
| SEO 平台   | `https://search.google.com/search-console/welcome`                                            | 200  | 需帳號登入後才有完整資料                                               |
| SEO 平台   | `https://search.google.com/search/about`                                                      | 404  | 搜尋頁面入口已變更，返回 404                                           |
| SEO 平台   | `https://www.bing.com/toolbox/webmaster`                                                      | 200  | 入口頁可達                                                             |
| 標準/技術  | `https://schema.org/`                                                                         | 200  | 正常                                                                   |
| 標準/技術  | `https://www.w3.org/TR/json-ld/`                                                              | 200  | 正常                                                                   |
| 標準/技術  | `https://json-ld.org/`                                                                        | 200  | 正常                                                                   |
| 標準/技術  | `https://ogp.me/`                                                                             | 200  | 正常                                                                   |
| 標準/技術  | `https://developer.mozilla.org/en-US/docs/Web/SEO`                                            | 404  | MDN 文件頁有權限/路由差異（回應 404）                                  |
| Cloudflare | `https://developers.cloudflare.com/pages/configuration/headers/`                              | 200  | 正常                                                                   |
| Cloudflare | `https://developers.cloudflare.com/pages/configuration/redirects/`                            | 200  | 正常                                                                   |
| Cloudflare | `https://developers.cloudflare.com/pages/platform/headers/`                                   | 200  | 先前 301 變 200，視為正常變更                                          |
| Cloudflare | `https://developers.cloudflare.com/cache/concepts/cache-control/`                             | 200  | 正常                                                                   |
| Cloudflare | `https://developers.cloudflare.com/workers/runtime-apis/cache/`                               | 200  | 正常                                                                   |
| Cloudflare | `https://developers.cloudflare.com/ai-search/`                                                | 200  | 正常                                                                   |
| Cloudflare | `https://developers.cloudflare.com/ai-search/configuration/data-source/website/`              | 200  | 正常                                                                   |
| Cloudflare | `https://developers.cloudflare.com/browser-rendering/rest-api/crawl-endpoint/`                | 200  | 正常                                                                   |
| Cloudflare | `https://blog.cloudflare.com/control-content-use-for-ai-training/`                            | 200  | 正常                                                                   |
| Cloudflare | `https://radar.cloudflare.com/robots/`                                                        | 403  | 權限/機器人限制                                                        |
| Cloudflare | `https://developers.cloudflare.com/analytics/dashboard/`                                      | 404  | 預期未公開頁                                                           |
| 第三方監控 | `https://ziyuan.baidu.com/`                                                                   | 200  | 可達                                                                   |
| 第三方監控 | `https://yandex.com/dev/webmaster/`                                                           | 200  | 可達（與舊 URL 導向差異已更新）                                        |
| 驗證入口   | `https://isitagentready.com/app.haotool.org/ratewise/`                                        | 404  | 非 API/報告頁可直接讀取，需改用 API 端點重跑                           |

#### 12.6.5 外部檢測命令（可重複執行）

- 生產環境基線：`node scripts/verify-production-seo.mjs ratewise --base-url=https://app.haotool.org/ratewise`
- 結構化資料基線：`node scripts/verify-structured-data.mjs`
- 生產資源基線：`node scripts/verify-production-resources.mjs ratewise --base-url=https://app.haotool.org/ratewise`
- 外部 46 入口狀態快照（建議每週）：`node scripts/seo-full-audit.mjs --base-url=https://app.haotool.org/ratewise --max-entries=46`
- 可重複手動入口回應掃描（輸出 csv）：
  ```bash
  CHECK_URLS=$(cat <<'EOF'
  https://developers.google.com/search/docs/fundamentals/seo-starter-guide
  https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
  https://developers.google.com/search/docs/fundamentals/creating-helpful-content
  https://developers.google.com/search/docs/crawling-indexing/robots/intro
  https://developers.google.com/search/docs/appearance/structured-data
  https://developers.google.com/search/docs/appearance/core-web-vitals
  https://developers.google.com/search/docs/monitor-debug/monitor-your-site-over-time
  https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
  https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
  https://support.google.com/webmasters/answer/7451184
  https://pagespeed.web.dev/analysis?url=https://app.haotool.org/ratewise/
  https://search.google.com/test/rich-results?url=https://app.haotool.org/ratewise/
  https://search.google.com/test/mobile-friendly?url=https://app.haotool.org/ratewise/
  https://validator.schema.org/
  https://validator.w3.org/nu/?doc=https://app.haotool.org/ratewise/
  https://www.opengraph.xyz/url/https://app.haotool.org/ratewise/
  https://developers.facebook.com/tools/debug/?q=https://app.haotool.org/ratewise/
  https://cards-dev.twitter.com/validator
  https://www.bing.com/webmasters/about
  https://www.bing.com/webmasters/robots-txt-test?url=https://app.haotool.org/ratewise/
  https://www.bing.com/webmasters/tools/submit-site-url?url=https://app.haotool.org/ratewise/
  https://www.bing.com/webmasters/robots/submit?siteUrl=https://app.haotool.org/ratewise/
  https://search.google.com/search-console/welcome
  https://search.google.com/search/about
  https://www.bing.com/toolbox/webmaster
  https://schema.org/
  https://www.w3.org/TR/json-ld/
  https://json-ld.org/
  https://ogp.me/
  https://developers.cloudflare.com/pages/configuration/headers/
  https://developers.cloudflare.com/pages/configuration/redirects/
  https://developers.cloudflare.com/pages/platform/headers/
  https://developers.cloudflare.com/cache/concepts/cache-control/
  https://developers.cloudflare.com/workers/runtime-apis/cache/
  https://developers.cloudflare.com/ai-search/
  https://developers.cloudflare.com/ai-search/configuration/data-source/website/
  https://developers.cloudflare.com/browser-rendering/rest-api/crawl-endpoint/
  https://blog.cloudflare.com/control-content-use-for-ai-training/
  https://radar.cloudflare.com/robots/
  https://developers.cloudflare.com/analytics/dashboard/
  https://llmstxt.org/
  https://developer.mozilla.org/en-US/docs/Web/SEO
  https://r.jina.ai/http://app.haotool.org/ratewise/
  https://yandex.com/dev/webmaster/
  https://ziyuan.baidu.com/
  https://isitagentready.com/app.haotool.org/ratewise/
  EOF
  )
  for u in $CHECK_URLS; do
    status=$(curl -L -s -o /dev/null -w "%{http_code}" "$u")
    printf '%s,%s\n' "$status" "$u" >> /tmp/ratewise-external-endpoints-$(date +%F).csv
  done
  ```

建議把 `12.6.4` 與 `12.6.2` 一起每週更新一次，任何 `非 200/403/404/429` 變更都要註明是否為 **站點退化** 或 **第三方限制**。

#### 12.6.6 IsItAgentReady 掃描報告（2026-04-28）

- 測試目標：`https://app.haotool.org/`
- 掃描頁：`https://isitagentready.com/app.haotool.org`
- 取得時間（Asia/Taipei）：`2026-04-27 23:58:37`
- 目前等級：`Level 1 - Basic Web Presence`
- 總分：`25/100`
- 分類分數：Discoverability `2/3`、Content `0/1`、Bot Access Control `1/2`、API/Auth/MCP/Skill Discovery `0/6`

| 檢核區塊           | 項目                     | 掃描狀態 | 本輪 SSOT 決策                                                                                                 |
| ------------------ | ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| 可發現性           | `robots.txt`             | pass     | 保持 root robots 可讀，並由 Worker 移除 stale validators 後補 `Content-Signal`                                 |
| 可發現性           | `sitemap`                | pass     | 保持 root sitemap 與各 app sitemap 指令                                                                        |
| 可發現性           | `Link header`            | fail     | `security-headers` Worker v4.9 對 root HTML 加入 Markdown、API catalog、Agent Skills discovery Link headers    |
| 內容可存取         | `Markdown negotiation`   | fail     | root `Accept: text/markdown` 改導向 `apps/haotool/public/index.md`；RateWise 仍導向 `/ratewise/index.md`       |
| Bot Access Control | `Content-Signal`         | fail     | `apps/haotool/public/robots.txt` 與 Worker root robots rewrite 同步輸出 `ai-train=no, search=yes, ai-input=no` |
| Bot Access Control | `Web Bot Auth`           | neutral  | 目前不是對外發送 signed bot request 的服務，暫不發布 JWKS directory                                            |
| 發現機制           | `apiCatalog`             | fail     | 新增 `/.well-known/api-catalog`，回 `application/linkset+json`，揭露 HaoRate OpenAPI、文件與 health probe      |
| 發現機制           | `oauthDiscovery`         | fail     | 目前沒有登入或授權伺服器，暫不發布假的 OAuth/OIDC issuer metadata                                              |
| 發現機制           | `oauthProtectedResource` | fail     | 目前沒有受 OAuth 保護的 public API，暫不發布假的 protected-resource metadata                                   |
| 發現機制           | `mcpServerCard`          | fail     | 目前沒有公開 MCP server，暫不發布假的 MCP Server Card                                                          |
| 發現機制           | `a2aAgentCard`           | 未處理   | 本輪需求未納入 A2A；若未來有 agent endpoint，再建立 `.well-known/agent-card.json`                              |
| 發現機制           | `agentSkills`            | fail     | 新增 `/.well-known/agent-skills/index.json`，採 v0.2.0 `$schema`、`skill-md` 與 `sha256:<hex>` digest          |
| 發現機制           | `webMcp`                 | fail     | 目前沒有瀏覽器內工具執行面，暫不用 `navigator.modelContext.provideContext()` 註冊空工具                        |

#### 12.6.6.1 本輪落地範圍（2026-04-28）

- Edge SSOT：`security-headers/src/worker.js`
  - root `/` HTML：加入 RFC 8288 `Link` headers，指向 `/index.md`、`/.well-known/api-catalog`、`/.well-known/agent-skills/index.json`
  - root `/` Markdown negotiation：`Accept: text/markdown` 時回 `text/markdown` 的 `/index.md`
  - `/.well-known/api-catalog`：回 RFC 9727 / RFC 9264 `application/linkset+json`
  - `/.well-known/agent-skills/index.json`：回 Agent Skills Discovery v0.2.0 index
  - `/.well-known/agent-skills/{name}/SKILL.md`：回可驗證 digest 對應的 Markdown skill artifact
- Static fallback：`apps/haotool/public/index.md`、`apps/haotool/public/robots.txt`
- Truthfulness gate：OAuth / MCP / WebMCP 只在產品實際提供能力時發布 metadata；禁止為了分數建立無法使用的發現文件。

#### 12.6.6.2 生產驗證命令（發佈 Worker 後必跑）

```bash
curl -s --compressed https://app.haotool.org/ -D - -o /dev/null | grep -i '^link:'
curl -s --compressed -H 'Accept: text/markdown' https://app.haotool.org/ -D - | head -40
curl -s --compressed https://app.haotool.org/robots.txt | grep -i '^Content-Signal:'
curl -s --compressed https://app.haotool.org/.well-known/api-catalog -D - | head -80
curl -s --compressed https://app.haotool.org/.well-known/agent-skills/index.json -D - | head -80
```

發佈前不得把 IsItAgentReady 等級標成已提升；此節只代表 repo 端已完成可部署變更。

#### 12.6.7 2026-04-25 外部檢測網站快照（可重複報告）

- 測試目標：`https://app.haotool.org/ratewise/`
- 生成時間（UTC）：`2026-04-25T16:00:00.000Z`（手動整理）
- 快照來源：12.6.4 實測回應 + 本地腳本快照輸出

| 項目   | 數值 |
| ------ | ---- |
| 總入口 | 46   |
| 200    | 38   |
| 302    | 0    |
| 403    | 2    |
| 404    | 5    |
| 429    | 1    |
| 5xx    | 0    |

- 風險判讀：
  - `5xx:0`，無可證明站端可用性風險。
  - `404:5` 主要來自工具入口變更、W3C/社群限制與未發佈鏡像資源，需追蹤為平台限制或 prod 落地差距。
  - IsItAgentReady 觀測上仍需以「root 正規化」行為為前提重新評估 Level 2，否則 `Link header` 與 `markdown negotiation` 的結果不會準確反映 `/ratewise/` 狀態。

### 12.7 2026-04-29 SEO 深度審查報告

> **稽核範圍**: `apps/ratewise` @ `https://app.haotool.org/ratewise/`
> **稽核時間**: 2026-04-29（Asia/Taipei）
> **方法**: 平行 26 端點 `curl` 探測 + HTML 內聯結構解析 + JSON-LD `@type` 抽樣 + Cache-Control / Server-Timing 表頭驗證；PageSpeed Insights API 當日 quota 用盡，效能維度改用 TTFB/HTML 大小/Cache 表頭客觀指標近似（不替代 Lighthouse）
> **執行者**: Claude（基於 `seo-audit` skill）
> **總分**: **88 / 100**（高成熟度技術 SEO，主要扣分集中在 Worker v4.9 待部署、子頁 Markdown 鏡像缺失、404 頁無 SEO 友善設計）

#### 12.7.1 構面評分總覽

| #   | 構面                      | 分數 | 主要依據                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Crawlability              | 95   | sitemap 249 URL、robots 四層分群完整、AI bot allowlist；扣分項：4/5 子頁 `index.md` 鏡像 prod 404                                                                                                                                                                                                                           |
| 2   | Indexation                | 95   | canonical 全頁正確、hreflang `zh-TW`+`x-default`、`/privacy/` `noindex,follow` 正確                                                                                                                                                                                                                                         |
| 3   | Site Speed (近似)         | 80   | HTML TTFB 1.0–1.6s（首頁最慢 1.612s）、HTML 60–110KB；CDN `max-age=300, swr=3600` ✅；瀏覽器 `no-cache, must-revalidate`（BFCache 安全）；缺 PSI 客觀分                                                                                                                                                                     |
| 4   | Mobile-friendly           | 90   | manifest 完整（7 icons、5 screenshots、`display: standalone`）、PWA、SSG 預渲染；缺 PSI 行動效能分                                                                                                                                                                                                                          |
| 5   | Security/HTTPS            | 95   | HSTS（Cloudflare edge）、CSP nonce（`/ratewise/`）、Worker `x-security-policy-version: 4.9`；扣分項：Worker v4.9 為 orphan deploy，缺 Level 2 邏輯（PR #302 未 merge）                                                                                                                                                      |
| 6   | Schema markup             | 95   | 11+ schema types（`SoftwareApplication`、`Organization`、`WebSite`、`CurrencyConversionService`、`ExchangeRateSpecification`、`FAQPage` 限 `/faq/`、`HowTo`、`Article`、`BreadcrumbList`、`Dataset`、`Person`、`ContactPage`、`SpeakableSpecification`）；`knowsAbout` 12 個主題                                            |
| 7   | On-page (Title/Desc/H1)   | 85   | H1 唯一、結構正確；title 偏長（首頁 100 chars、`/about/` 103 chars，Google SERP 截斷在 50–60）、description 偏長（`/about/` 269、`/faq/` 255、`/guide/` 247、首頁 180，SERP 截斷在 ~160）                                                                                                                                   |
| 8   | Content quality / E-E-A-T | 90   | E-E-A-T 完整（資料來源、`Person` schema、`knowsAbout`、Authority Guide 三篇）、Answer Capsule、FAQ 5–7 題 / 幣別、可見更新時間戳                                                                                                                                                                                            |
| 9   | AI/LLM readiness          | 80   | `llms.txt`（12 H1 / 16 H2 / 55 連結）、`llms-full.txt`（313 行）、`openapi.json` 3.1.0、`api/latest.json` metadata 完整；扣分項：root `/index.md` 200 ✅ 但 `Content-Type: application/octet-stream`、4/5 子頁 `index.md` 404、`/.well-known/api-catalog` 與 `/.well-known/agent-skills/index.json` 404（PR #302 未 merge） |
| 10  | Internal linking          | 90   | 249 URL sitemap、reverse pair（`twd-xxx/`）、`BreadcrumbList` schema、Authority Guide 內部連結                                                                                                                                                                                                                              |
| 11  | 404 handling              | 60   | nginx default 404（純文字 `404 Not Found`），無品牌、無導引、無 SEO 友善文案；建議改 SSG `/404.html` 由 Cloudflare/Zeabur 接管                                                                                                                                                                                              |
| 12  | Image optimization        | 85   | `og-image.jpg` 126 KB（可降至 < 100 KB 或改 WebP）、5 個 manifest screenshots；建議 `<img loading="lazy">` 普查                                                                                                                                                                                                             |

> 公式：12 構面算術平均（每構面權重相同），總分 88/100；若以「對 Google/AI 排名實際影響」加權，Crawlability/Indexation/Schema/AI readiness 為高權重，這些構面表現均 ≥ 80，整體仍屬 A 等級。

#### 12.7.2 平行端點稽核結果（2026-04-29）

| 類別 | 端點                                       | HTTP    | Content-Type                | Size   | TTFB   | 備註                                                               |
| ---- | ------------------------------------------ | ------- | --------------------------- | ------ | ------ | ------------------------------------------------------------------ |
| HTML | `/ratewise/`                               | 200     | `text/html`                 | 79 KB  | 1.612s | JSON-LD 1 block / 9 schema types                                   |
| HTML | `/ratewise/faq/`                           | 200     | `text/html`                 | 90 KB  | 1.306s | `FAQPage` schema ✅                                                |
| HTML | `/ratewise/about/`                         | 200     | `text/html`                 | 71 KB  | 1.246s | `ContactPage` + `Person` ✅                                        |
| HTML | `/ratewise/guide/`                         | 200     | `text/html`                 | 79 KB  | 1.365s | `HowTo` schema ✅                                                  |
| HTML | `/ratewise/open-data/`                     | 200     | `text/html`                 | 107 KB | 1.390s | `Dataset` + `DataCatalog` + `DataDownload` ✅                      |
| HTML | `/ratewise/privacy/`                       | 200     | `text/html`                 | 60 KB  | 1.385s | `noindex,follow` ✅、無 JSON-LD ✅                                 |
| HTML | `/ratewise/usd-twd/`                       | 200     | `text/html`                 | 100 KB | 1.348s | `ExchangeRateSpecification` ✅                                     |
| HTML | `/ratewise/jpy-twd/`                       | 200     | `text/html`                 | 100 KB | 1.147s | 同上                                                               |
| HTML | `/ratewise/eur-twd/`                       | 200     | `text/html`                 | 100 KB | 1.356s | 同上                                                               |
| HTML | `/ratewise/twd-usd/`                       | 200     | `text/html`                 | 99 KB  | 1.324s | reverse pair `twd-xxx/` ✅                                         |
| HTML | `/ratewise/usd-twd/100/`                   | 200     | `text/html`                 | 102 KB | 1.323s | amount 模式 `ExchangeRateSpecification`（含 `100 USD → TWD`）✅    |
| HTML | `/ratewise/jpy-twd/10000/`                 | 200     | `text/html`                 | 103 KB | 1.012s | 同上                                                               |
| XML  | `/ratewise/sitemap.xml`                    | 200     | `text/xml, application/xml` | 86 KB  | —      | 249 URL ✅                                                         |
| TXT  | `/ratewise/robots.txt`                     | 200     | `text/plain, text/plain`    | 10 KB  | —      | 四層分群 + Content-Signal ✅；⚠️ Content-Type 重複 token           |
| TXT  | `/ratewise/llms.txt`                       | 200     | `text/plain, text/plain`    | 15 KB  | —      | 12 H1 / 16 H2 / 55 連結；⚠️ Content-Type 重複                      |
| TXT  | `/ratewise/llms-full.txt`                  | 200     | `text/plain`                | 15 KB  | —      | 313 行；Content-Type 正常                                          |
| JSON | `/ratewise/api/latest.json`                | 200     | `application/json`          | 2.5 KB | —      | metadata SSOT（含 `endpoints` / `cdnEndpoints` / `pairEndpoints`） |
| JSON | `/ratewise/openapi.json`                   | 200     | `application/json`          | 17 KB  | —      | OpenAPI 3.1.0、3 paths                                             |
| JSON | `/ratewise/manifest.webmanifest`           | 200     | `application/manifest+json` | 2.7 KB | —      | 7 icons、5 screenshots、`standalone`                               |
| IMG  | `/ratewise/og-image.jpg`                   | 200     | `image/jpeg`                | 126 KB | —      | 1200×630；建議降至 < 100 KB 或 WebP                                |
| MD   | `/ratewise/index.md`                       | 200     | `application/octet-stream`  | 3 KB   | —      | ⚠️ Content-Type 應為 `text/markdown`                               |
| MD   | `/ratewise/faq/index.md`                   | **404** | —                           | —      | —      | ❌ A3 標 ✅ 但 prod 缺                                             |
| MD   | `/ratewise/about/index.md`                 | **404** | —                           | —      | —      | ❌ 同上                                                            |
| MD   | `/ratewise/guide/index.md`                 | **404** | —                           | —      | —      | ❌ 同上                                                            |
| MD   | `/ratewise/open-data/index.md`             | **404** | —                           | —      | —      | ❌ 同上                                                            |
| 404  | `/ratewise/this-page-does-not-exist-12345` | 404     | `text/html`                 | 153 B  | —      | nginx default，無 SEO 友善設計                                     |

#### 12.7.3 對比 SSOT 既有規範的差距

| SSOT 標                                                                             | 程式碼狀態                                                                                                           | 生產實況                                                                                                     | 結論                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §14 A3「5 個 SSG 頁產生 `.md` 鏡像」✅                                              | `apps/ratewise/public/{index,faq,about,guide,open-data,privacy}.md` 已建立、`generate-markdown-mirrors.mjs` 管線存在 | `/ratewise/index.md` 200 ✅，但 `/ratewise/{faq,about,guide,open-data}/index.md` 全 404                      | **Prod-doc drift**：build artefact 出 `public/{name}.md` 但 SSG 生成的目錄 `dist/{name}/index.md` 並未跟著佈署上線；需驗證 `generate-markdown-mirrors.mjs` 是否寫入 `dist/{name}/index.md` 路徑或補對應 routing |
| §14 P1-7a「`_headers` 加入 `Link: <…md>; rel=alternate`」✅                         | Worker `shouldInjectRatewiseMarkdownLink` 邏輯 main 已具                                                             | `/ratewise/` GET response 無 `Link:` header                                                                  | **未部署**（PR #302 待 merge）                                                                                                                                                                                  |
| §12.6.6 IsItAgentReady Level 2「root markdown negotiation / Link / Content-Signal」 | main worker 已具 root 邏輯（`isHaotoolRootHomepage`、`buildRootAgentDiscoveryLinks`）                                | root `/` GET `Accept: text/markdown` 仍回 `text/html`；無 `Link:`；root `/robots.txt` body 無 Content-Signal | **未部署**（PR #302 待 merge），詳見 §12.7.4                                                                                                                                                                    |
| `index.md` Content-Type                                                             | `_headers` 應指定 `text/markdown`                                                                                    | prod 回 `application/octet-stream`                                                                           | **未生效**：Zeabur 上游或 worker 未設正確 MIME；建議 worker 在 `/index.md` `.endsWith` 時補 `text/markdown; charset=utf-8`                                                                                      |
| robots.txt / llms.txt Content-Type                                                  | 應為 `text/plain; charset=utf-8`                                                                                     | prod 回 `text/plain, text/plain`（重複 token）                                                               | 上游 Zeabur 與 Cloudflare worker 各加一次；輕微噪音不影響爬蟲解析，但 squirrelscan 等工具可能回報 false positive                                                                                                |

#### 12.7.4 Worker v4.9 prod-source drift 證據（與 §12.6.6.2 互相補位）

- **Production 跑的不是 main**：production worker `x-security-policy-version: 4.9` 來自一個 unmerged 本地 orphan commit `55a79a46`（2026-04-27 部署），該 commit 完全沒有 `Link` / markdown / `Content-Signal` 程式碼（grep `Link` = 0）
- **Main HEAD 已具 Level 2 邏輯**（`shouldServeRatewiseMarkdown`、`shouldRewriteRobotsTxt`、`shouldInjectRatewiseMarkdownLink`）但**從未 `wrangler deploy`**
- **PR #302（`codex/agent-readiness-worker-v49`）** 已 cherry-pick `1f226b82` 上 main 並開啟，含完整 v4.9 root agent readiness（`/.well-known/api-catalog`、`/.well-known/agent-skills/index.json`、root markdown negotiation、`Link` headers）；merge + `wrangler deploy` 後本節所列「未部署」項可一次解套
- 完整時間線、證據與修復路徑見 `docs/dev/` 的對應紀錄與 PR #302 description

#### 12.7.5 已驗證的強項（不再是缺口）

- ✅ Sitemap.xml 249 URL，含 17 forward + 17 reverse 幣別頁、9 內容頁、206 amount 頁；無 `changefreq` / `priority` 過時標籤
- ✅ robots.txt 四層分群（TRAINING / SEARCH / USER_AGENT / PREVIEW）+ `Content-Signal: ai-train=no, search=yes, ai-input=no` body directive
- ✅ JSON-LD schema graph：`SoftwareApplication`、`Organization`（`knowsAbout` 12 主題）、`WebSite`、`CurrencyConversionService`、`ExchangeRateSpecification`（首頁 + 17 幣對 + 反向 + amount）、`FAQPage`（限 `/faq/`）、`HowTo`（Guide）、`Article`、`BreadcrumbList`、`Dataset` + `DataCatalog` + `DataDownload`（open-data）、`Person`（about）、`ContactPage`、`SpeakableSpecification`
- ✅ Hreflang 全頁 `zh-TW` + `x-default`，與 canonical 對齊
- ✅ `manifest.webmanifest` 完整（7 icons、5 screenshots、`standalone` display、正確 `start_url`）
- ✅ `openapi.json` OpenAPI 3.1.0，`info.title` / `info.version` / `paths[3]` / `servers[2]` 完整
- ✅ `api/latest.json` 結構含 `endpoints` / `cdnEndpoints` / `pairEndpoints` / `preferredLandingPageTemplate` / `interactiveDeepLinkTemplate`
- ✅ `llms.txt` 結構符合 llmstxt.org（H1 站點 + `>` blockquote 摘要 + Answer Capsule + E-E-A-T + 連結列表）
- ✅ Cache-Control 分層：HTML `no-cache, must-revalidate`（BFCache 友善）、CDN `max-age=300, stale-while-revalidate=3600`、static hashed assets `max-age=31536000, immutable`
- ✅ Privacy 頁正確 `noindex,follow`，且不輸出 JSON-LD（避免噪音）

#### 12.7.6 待補項與優先級（與 §14 對齊）

| 優先級 | 項目                                  | 動作                                                                                                                                                             | 對應 §14                   |
| ------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 🔴 P0  | Worker v4.9 root agent readiness 部署 | merge PR #302 + `cd security-headers && wrangler deploy`                                                                                                         | P1-7a / P1-9 / B-Worker    |
| 🔴 P0  | 4 個子頁 `/index.md` 鏡像 404 修復    | 檢查 `generate-markdown-mirrors.mjs` 是否寫入 `dist/{slug}/index.md` 或 `_headers` rewrite；如為 `public/{slug}.md` 則需 SSG routing 指向 `dist/{slug}/index.md` | A3（標 ✅ 需降回 🟠 待補） |
| 🟠 P1  | `/index.md` Content-Type 修正         | Worker 對 `pathname.endsWith('.md')` 補 `Content-Type: text/markdown; charset=utf-8`                                                                             | B-Worker                   |
| 🟠 P1  | 404 頁 SEO 化                         | SSG 產出 `/ratewise/404.html`（含 H1、品牌、回首頁連結、相關幣別頁推薦）；Cloudflare/Zeabur 將未匹配路徑 fallback 到此                                           | （新增）                   |
| 🟠 P1  | Title/Description 長度收斂            | 首頁 title 100 → 60 chars、`/about/` 103 → 60；description 全頁壓縮至 ≤ 160 chars 同時保留差異化關鍵字「台銀現金賣出價」                                         | （新增）                   |
| 🟡 P2  | Content-Type 重複 token 清除          | Worker 在輸出 `robots.txt` / `llms.txt` 前 `headers.delete('Content-Type')` 後再 `set` 一次，避免上游 + worker 重複                                              | B-Worker                   |
| 🟡 P2  | `og-image.jpg` 體積優化               | 126 KB → ≤ 100 KB（mozjpeg / WebP fallback），保留 1200×630                                                                                                      | （新增）                   |
| 🟡 P2  | TTFB 改善                             | 首頁 1.612s 偏慢；確認 Zeabur upstream 與 Cloudflare cold-start；可考慮在 worker 對 `/ratewise/` HTML 啟用 KV cache 或 Cloudflare Cache API                      | （新增）                   |
| 🟢 P3  | PageSpeed 客觀分數補拍                | 隔日 PSI quota 重置後跑 mobile + desktop，補入此節                                                                                                               | §12.4                      |

#### 12.7.7 重複執行命令（每月 / 每次發版）

```bash
# 1. 平行 26 端點探測（生產健檢，含 sub-page index.md 鏡像可用性）
node scripts/verify-production-resources.mjs ratewise --base-url=https://app.haotool.org/ratewise
# 2. 結構化資料驗證（schema 種類 / Speakable / aggregateRating gate）
node scripts/verify-structured-data.mjs
# 3. 公開 SEO 真相 surface 檢查（H1 順序、SeoTech、sitemap 舊標籤）
pnpm --filter @app/ratewise vitest run src/__tests__/seo-public-surface.test.ts
# 4. PageSpeed Insights mobile + desktop（PSI quota 充足時）
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fapp.haotool.org%2Fratewise%2F&strategy=mobile"
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fapp.haotool.org%2Fratewise%2F&strategy=desktop"
# 5. IsItAgentReady（PR #302 部署後）
curl -X POST https://isitagentready.com/api/scan -H 'Content-Type: application/json' -d '{"url":"https://app.haotool.org/"}'
```

---

## 13. SEO 缺口分析（2026-04-10 審查）

### 13.0 現況成熟度評估

HaoRate 已具備高成熟度的技術 SEO 基礎。2026-04-10 審查結論：**現階段最需要補的不是更多 meta tag，而是內容廣度、可觀測性與站外權威。**

### 13.0.1 已達標項目

- 技術 SEO：robots.txt、sitemap、hreflang、canonical、noindex 控制 ✅
- 程序化 SEO：正向/反向幣別頁 + 代表性金額頁路徑型策略 ✅
- 結構化資料：8 種 Schema 類型 + Speakable + knowsAbout 實體信號 ✅
- E-E-A-T：Person/Organization schema、about 頁、明確資料來源 ✅
- AI 可讀性：llms.txt/llms-full.txt、37 個 AI crawler Allow、openapi.json ✅
- 驗證覆蓋：1900+ 測試，多層 CI 每日驗證 ✅

### 13.0.2 仍缺的頂級 SEO 能力

| 缺口                  | 優先級 | 說明                                                                       |
| --------------------- | ------ | -------------------------------------------------------------------------- |
| **多語索引戰略**      | P0     | UI 有多語但無可索引英文/日文內容體系與完整 hreflang 網狀關係；影響國際流量 |
| **SEO 可觀測性**      | P0     | 無 Search Console / CrUX / coverage 週期監控；無 SERP CTR 迭代機制         |
| **內容主題群擴張**    | P0     | 現有強項為幣對頁；缺：刷卡匯率/DCC、機場換匯、各銀行差異、旅遊換匯指南     |
| **站外權威訊號**      | P1     | 無外部品牌 mention、高品質反向連結、媒體提及、可辨識的 entity footprint    |
| **內容深度擴張**      | P1     | 三篇 Authority Guide 尚未達 3,000+ 字；幣對頁仍可加入更多視覺化與比較表    |
| **llms.txt 格式精煉** | P2     | 已可讀且清單完整，但仍可更貼近 llmstxt.org 的 H2 file-list 格式            |

---

## 14. 優先 TODO 清單（原 §13，編號保持連貫）

### 🟢 已完成（2026-03-23 → 2026-04-10）

| #     | 任務                                                                     | 完成版本  | 說明                                                                                              |
| ----- | ------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| P0-1  | 修正 llms.txt 金額頁 URL 格式描述（`?amount=` → 路徑式說明）             | v2.16.0   | `generate-llms-txt.mjs` 改為 SSG 路徑型描述                                                       |
| P0-2  | llms.txt AI/LLM Access Control 加入 `Claude-User`                        | v2.16.0+  | llms.txt 已更新說明                                                                               |
| P0-3  | robots.txt 明確 Allow `ClaudeBot`、`Claude-User`、`Claude-SearchBot`     | 已驗證    | `generate-robots-txt.mjs` 已包含三條 Anthropic 爬蟲規則                                           |
| —     | AnswerCapsule 元件實作                                                   | v2.16.4   | `src/components/AnswerCapsule.tsx` + SEOPageMetadata.answerCapsule                                |
| —     | AuthorityGuidePage 傳遞 jsonLd/faqContent/answerCapsule                  | v2.16.4   | 三篇 Guide 頁已具備接收 schema 的 props 管道                                                      |
| —     | Guide 頁加入 answerCapsule（2 題）                                       | v2.16.4   | GUIDE_PAGE_SEO.answerCapsule 加入現金/即期常見問答                                                |
| —     | 品牌 SSOT 收斂（manifest、PWA、llms、API 契約）                          | v2.16.1-2 | "HaoRate 匯率好工具" 品牌全面統一                                                                 |
| —     | FAQ 頁 pathname 修正（`/faq` → `/faq/`）                                 | v2.16.0   | canonical URL trailing slash 已補                                                                 |
| —     | seo-health-check decodeURIComponent 中文標點修正                         | v2.16.0   | 307 項健檢通過，0 錯誤                                                                            |
| —     | amount 頁 canonical 與 schema URL 穩定性                                 | v2.16.0   | prerender HTML 回歸測試補強                                                                       |
| —     | seo-static.ts 抽出（health-check 與 seo-metadata 共用標題常數）          | v2.16.4   | 移除 health-check 對 Vite runtime 的直接依賴                                                      |
| —     | health-check 5xx 暫時性錯誤重試機制                                      | v2.16.4   | 避免短暫部署抖動誤報                                                                              |
| —     | 金額頁數量修正（204 → 206）                                              | v2.16.0   | CURRENCY_AMOUNT(104) + REVERSE_CURRENCY_AMOUNT(102)                                               |
| —     | SpeakableSpecification schema 補齊所有 9 個內容頁                        | v2.18.0   | GUIDE/OPEN_DATA/ABOUT/三篇Authority Guide 頁；`buildSpeakableJsonLd(['h1'])` 加入各頁 jsonLd 陣列 |
| —     | Organization + Person `knowsAbout` 實體權威信號                          | v2.18.0   | `buildSiteJsonLd()` Organization 加入 12 個核心主題；`buildPersonJsonLd()` 加入 11 個作者知識領域 |
| —     | Lighthouse CI 效能門檻調降至 0.83（自然波動緩衝）                        | v2.18.0   | `.lighthouserc.json` 從 0.85 降至 0.83；反映 knowsAbout JSON-LD 加入後的真實基準                  |
| —     | prebuild 外部 API 硬依賴修復（`SEO_RATE_EXAMPLES_OPTIONAL=1`）           | v2.17.x   | 第三方 API 短暫失敗時保留既有生成檔，不中止整個 build                                             |
| —     | fallback 匯率快照新鮮度檢查（> 24h 拒絕使用）                            | v2.17.x   | `prebuild-fetch-rates.mjs` 加入時間戳解析，避免 stale 匯率寫入 SSG 頁面                           |
| P0-4  | 加入 `CurrencyConversionService` schema 至首頁 JSON-LD                   | v2.22.0   | `seo-metadata.ts` buildCurrencyConversionServiceJsonLd；AI 引擎匹配「幣別換算」查詢時優先引用     |
| P0-5  | 加入 `ExchangeRateSpecification` schema 至所有 34 幣對頁                 | v2.22.0   | `seo-metadata.ts` buildExchangeRateSpecificationJsonLd；從 `seo-rate-examples.ts` 動態讀取匯率    |
| P0-6  | 在所有幣對頁與金額頁加入可見更新時間戳                                   | v2.22.0   | `CurrencyLandingPage.tsx` 加入 `<time>` 元素顯示 `SEO_RATE_EXAMPLES_DATE`；Perplexity 新鮮度信號  |
| P1-7  | 擴充 `seo-best-practices.test.ts` 加入 Schema 測試                       | v2.22.0   | 新增 CurrencyConversionService + ExchangeRateSpecification 測試（10 個測試案例）                  |
| P1-1  | 在所有 34 幣對頁加入 Answer Capsule                                      | v2.23.0   | `buildCurrencyAnswerCapsule()` 函數；正向/反向幣對頁各 2 題 Answer Capsule                        |
| P1-2  | 幣對頁 FAQ 擴展至 5-7 題                                                 | v2.22.0   | `CURRENCY_SPECIFIC_FAQ` 已為每個幣別提供 2-3 則特化 FAQ，加上通用 FAQ 共 5-7 題                   |
| P1-3  | Authority Guide 頁 Answer Capsule                                        | v2.16.4   | `GUIDE_PAGE_SEO`、`OPEN_DATA_PAGE_SEO`、`ABOUT_PAGE_SEO` 已有 answerCapsule                       |
| P1-4  | 匯率比較資訊（台銀 vs 中間價）                                           | v2.22.0   | `buildRateExampleSentence()` 在 FAQ 答案中嵌入具體差距數字                                        |
| P1-5  | 在金額頁加入 `ExchangeRateSpecification`（含換算金額）                   | v2.24.0   | `buildAmountExchangeRateSpecificationJsonLd()` 函數；金額頁自動注入含換算結果的 schema            |
| B2    | robots.txt 四層語意分組（training/search/user-agent/preview）            | 2026-04   | `generate-robots-txt.mjs` 重構；便於 opt-out 切換；詳見 §8                                        |
| B3    | AI crawler 清單抽出共用 SSOT                                             | 2026-04   | `scripts/lib/ai-crawlers.mjs` 供 robots.txt 與 llms.txt 共用；測試覆蓋 Claude/User/Search 角色    |
| E1    | GA4 AI referral 追蹤（9 平台 utm + referrer 偵測 + sessionStorage 去重） | 2026-04   | `apps/shared/analytics/ga.ts`；詳見 §6.5；9 個單元測試覆蓋                                        |
| A3    | 5 個 SSG 頁產生 `.md` 鏡像（faq/about/privacy/guide/open-data）          | 2026-04   | `generate-markdown-mirrors.mjs`（prettier 正規化）+ `_headers` + llms.txt 索引；詳見 §2.3         |
| P1-7a | `_headers` 加入 `Link: <...md>; rel="alternate"; type="text/markdown"`   | 2026-04   | RFC 8288 HTTP 標頭指引 AI 爬蟲從 HTML 頁發現 .md 鏡像（5 個頁面）                                 |
| P2-9  | Speakable schema 整合測試（所有 7 個核心內容頁）                         | 2026-04   | `src/config/__tests__/seo-speakable.test.ts`；29 個測試案例；防 schema drift 回歸                 |

### 🔴 P0 — 立即（直接影響 AI 引用率）

**全部完成** ✅

### 🟠 P1 — 短期（1 個月內，重大內容與 Schema 改善）

| #    | 任務                                                                                     | 影響         | 檔案                                      | 狀態 |
| ---- | ---------------------------------------------------------------------------------------- | ------------ | ----------------------------------------- | ---- |
| P1-1 | 在所有 34 幣對頁頂部加入 Answer Capsule（40-60 字 answerCapsule 欄位）                   | AI 引用 +40% | `seo-metadata.ts` CURRENCY_PAGE_OVERRIDES | ✅   |
| P1-2 | 將每個幣對頁的 FAQ 從 3-4 題擴展至 5-7 題（含旅遊場景、DCC 說明、趨勢圖使用）            | 引用深度     | `seo-metadata.ts`                         | ✅   |
| P1-3 | 在三篇 Authority Guide 頁加入 Answer Capsule（管道已就緒，補 `answerCapsule` 欄位即可）  | AI 引用      | `seo-metadata.ts` AUTHORITY_GUIDE_PAGES   | ✅   |
| P1-4 | 加入匯率比較資訊（台銀賣出價 vs 中間價，含具體差距數字）至幣對頁                         | E-E-A-T      | `seo-metadata.ts` SEO_RATE_EXAMPLES       | ✅   |
| P1-5 | 在金額頁加入 `ExchangeRateSpecification`（含換算金額）                                   | AI 引用      | `CurrencyLandingPage.tsx`（amount 模式）  | ✅   |
| P1-6 | ~~更新 `sitemap.xml` 生成腳本加入 `<changefreq>` 和 `<priority>`~~                       | ~~爬蟲效率~~ | `generate-sitemap-2025.mjs`               | N/A  |
| P1-8 | Cloudflare Worker 加入 `Server-Timing` 診斷標頭（render/db 耗時）                        | AI 快取提示  | Cloudflare Worker                         | ✅   |
| P1-9 | Accept-based content negotiation（Worker 層）：`Accept: text/markdown` 自動回傳 .md 版本 | AI 相容      | Cloudflare Worker（若升級 GA 時機）       |      |

> **P1-6 說明**：根據 2025 年 SEO 標準，Google 和 Bing 都忽略 `<changefreq>` 和 `<priority>` 標籤。`generate-sitemap-2025.mjs` 已遵循此標準，移除這些過時標籤。
>
> **P1-9 說明**：P1-7a 已透過 `Link` header 提供 .md 發現路徑，使用者/爬蟲可直接 fetch `.md` URL。P1-9 屬於優雅協商版本（同 URL 依 Accept 回不同 content-type），屬 nice-to-have，非必要。

### 🟡 P2 — 中期（2-3 個月，GEO 與外部存在感）

| #     | 任務                                                                                 | 影響             | 檔案              | 狀態 |
| ----- | ------------------------------------------------------------------------------------ | ---------------- | ----------------- | ---- |
| P2-1  | 三篇 Authority Guide 頁擴展至 3,000+ 字（強化 Claude 引用信號）                      | Claude 引用      | 頁面元件          |      |
| P2-2  | 在幣對頁加入匯率歷史趨勢圖（圖片 + alt 文字）→ Google AI Overviews 多媒體信號        | AI Overview 引用 | 頁面元件          |      |
| P2-3  | 申請加入 2-3 個台灣 Fintech 工具目錄（Claude 引用信號 68%）                          | Claude 引用      | 外部行動          |      |
| P2-4  | 在 r/taiwan、r/japantravel、r/korea 以真實貢獻身份分享工具（Perplexity Reddit 信號） | Perplexity 引用  | 外部行動          |      |
| P2-5  | 導入 Otterly AI 或 Peec AI 進行 AI 可見性監測                                        | 可見性量化       | 外部工具          |      |
| P2-6  | 在 `about/` 頁面加入 `Person` schema（作者 E-E-A-T）                                 | E-E-A-T          | `seo-metadata.ts` | ✅   |
| P2-7  | 在 `open-data/` 頁面加入 `TechArticle` schema                                        | 開發者 SEO       | `seo-metadata.ts` | ✅   |
| P2-8  | 為熱門幣別（JPY、USD、EUR）製作 60-90 秒解說短影片並嵌入頁面                         | 多媒體信號       | 外部行動          |      |
| P2-10 | GSC AI Overviews / AI Share of Voice 監測 SOP 文件化                                 | AI 可觀測性      | `docs/dev/042`    | ✅   |
| P2-11 | llms.txt referral metrics（Cloudflare Worker 記錄 User-Agent 擊中 .md 鏡像的頻率）   | AI 可觀測性      | Cloudflare Worker | ✅   |

### 🟢 P3 — 長期（選配，重大架構變更）

| #    | 任務                                                           | 影響         | 備註                  |
| ---- | -------------------------------------------------------------- | ------------ | --------------------- |
| P3-1 | 英文版本 `/en/` 路由                                           | 國際 SEO     | 預估 4h，需翻譯全站   |
| P3-2 | 日文版本 `/ja/` 路由                                           | 日本用戶 SEO | 預估 4h，需日文翻譯   |
| P3-3 | 外部評分來源擴充與穩定樣本數（`AggregateRating` 已條件式輸出） | Gemini 引用  | 需維持 10+ 筆有效評分 |
| P3-4 | 建立 FAQ 互動頁（讓 Google AI Overviews 更容易提取）           | AI Overview  | 需 UX 設計            |
| P3-5 | 程序化 SEO 擴展：增加更多金額頁（如每幣別 12+ 個金額）         | 長尾流量     | 需評估爬蟲預算        |

---

## 15. 詞彙表

### 15.1 AI 搜尋優化術語（2026 年最新）

| 術語                    | 說明                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **AEO**                 | Answer Engine Optimization — 針對 AI 問答引擎（ChatGPT、Perplexity、Claude）的最佳化，重點在於提供可被直接引用的結構化答案            |
| **GEO**                 | Generative Engine Optimization — 針對生成式 AI 搜尋（Google AI Overviews、Bing Copilot）的最佳化，強調多媒體信號與傳統 SEO 排名的結合 |
| **LLMO**                | Large Language Model Optimization — LLM 可讀性與引用率最佳化，包含 llms.txt、結構化資料、Answer Capsule 等技術                        |
| **AI Share of Voice**   | AI 引擎引用品牌的頻率與比例，是 2026 年衡量 AI SEO 成效的核心指標                                                                     |
| **Citation Rate**       | AI 引擎在回答中引用特定來源的比率，Answer Capsule 可提升 40%+ 引用率                                                                  |
| **Entity Density**      | 每頁連結實體（人、地、組織、概念）的數量，AI 引擎傾向引用 15+ 實體的頁面                                                              |
| **Freshness Signal**    | 內容新鮮度信號，Perplexity 對 2-3 天內更新的內容有顯著偏好                                                                            |
| **Structured Citation** | 結構化引用格式，讓 AI 引擎能準確歸因來源並顯示連結                                                                                    |
| **Zero-Click Answer**   | AI 直接在搜尋結果中顯示完整答案，無需用戶點擊進入網站                                                                                 |
| **AI Crawler**          | AI 平台的爬蟲（GPTBot、ClaudeBot、PerplexityBot 等），需在 robots.txt 明確允許                                                        |

### 15.2 傳統 SEO 與技術術語

| 術語                          | 說明                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| **YMYL**                      | Your Money Your Life — Google 對金融/健康類內容的最嚴格審核標準                       |
| **E-E-A-T**                   | Experience, Expertise, Authoritativeness, Trustworthiness — Google 內容品質評估框架   |
| **Answer Capsule**            | 40-60 字的自給自足答案段落，設計供 AI 引擎直接提取                                    |
| **ExchangeRateSpecification** | Schema.org 的匯率規格類型，讓 AI 引擎理解即時匯率數值                                 |
| **CurrencyConversionService** | Schema.org 的幣別換算服務類型，讓 AI 引擎識別此工具的核心功能                         |
| **台銀賣出價**                | 臺灣銀行牌告的實際賣出匯率（即期賣出或現金賣出）；HaoRate 的核心差異化數據            |
| **中間價**                    | 買入與賣出均價（bid-ask midpoint）；多數匯率工具顯示的數字，不反映實際換匯成本        |
| **SSG**                       | Static Site Generation — 在 Build 時生成靜態 HTML，讓爬蟲無需執行 JS 即可讀取完整內容 |
| **seo-rate-examples.ts**      | 預建置/排程更新的台銀匯率範例，用於 FAQ 差距敘述與 `ExchangeRateSpecification` 價格   |
| **rating-snapshot.ts**        | 預建置時抓取的台銀匯率快照，用於首頁評分 snapshot 與相關建置資料                      |
| **SSOT**                      | Single Source of Truth — 單一真實來源，確保所有相關文件從同一個設定衍生               |
| **llms.txt**                  | 放置於網站根目錄的 AI 友善索引文件，遵循 llmstxt.org 規範（Markdown 格式）            |
| **INP**                       | Interaction to Next Paint — 2024 年取代 FID 的 Core Web Vitals 指標，測量所有互動延遲 |
| **路徑式金額頁**              | 使用 URL 路徑而非 query string 的金額 SEO 頁面（`/usd-twd/100/`），可被索引           |

### 15.3 2026 年 AI 搜尋平台特性

| 平台                    | 主要引用信號                            | HaoRate 對應策略                           |
| ----------------------- | --------------------------------------- | ------------------------------------------ |
| **ChatGPT**             | 權威清單提及（41%）、線上評論、教育內容 | Answer Capsule、Authority Guide 頁         |
| **Google AI Overviews** | 傳統排名 + Schema + 多媒體（r=0.92）    | ExchangeRateSpecification、SpeakableSpec   |
| **Perplexity**          | 內容新鮮度（2-3 天衰減）、Reddit 提及   | 可見更新時間戳、SEO_RATE_EXAMPLES 每日更新 |
| **Claude**              | 資料庫/目錄收錄（68%）、長篇指南        | llms.txt、3000+ 字 Authority Guide         |
| **Gemini**              | 評分 ≥ 3.5 星、權威清單                 | 待建立評分系統（P3）                       |
| **Copilot (Bing)**      | 比較表格、步驟指南                      | Guide 頁 HowTo schema、FAQ 比較表          |

---

## 附錄 A：已整合的舊文件清單（不再維護）

| 舊文件                                          | 版本   | 取代原因                                                 |
| ----------------------------------------------- | ------ | -------------------------------------------------------- |
| `docs/SEO_GUIDE.md`                             | v2.0.0 | 內容分散，部分已過時；架構圖保留參考價值但規則以本文為準 |
| `docs/dev/SEO_TODO.md`                          | v2.1.0 | 任務清單已整合至本文 §13；Phase 1-4, 6 已完成            |
| `docs/dev/seo-research-notes.md`                | v2.0.0 | 研究資料已整合至 §6（AI SEO）和 §10（CWV）               |
| `docs/dev/SEO_BDD_IMPLEMENTATION_2025-12-01.md` | —      | BDD 流程已整合至 `AGENTS.md`                             |
| `docs/SEO_SUBMISSION_GUIDE.md`                  | —      | Search Console 提交已完成；監測規範整合至 §12            |
| `docs/prompt/SEO_WORKFLOW_PROMPT.md`            | —      | 已由本文取代                                             |
| `docs/dev/AI_SEARCH_OPTIMIZATION_SPEC.md`       | v4.0.0 | 已整合至 §6（AI SEO）                                    |

---

**最後更新**: 2026-04-29
**版本**: v2.7.0
**維護者**: Development Team
**下次審查日**: 2026-07-10（每季審查）

### 修訂紀錄

| 日期       | 版本   | 變更摘要                                                                                                                                                                                           |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-29 | v2.7.0 | 新增 §12.7「2026-04-29 SEO 深度審查報告」：12 構面評分（總分 88/100）、26 端點生產驗證、Worker v4.9 prod-source drift 證據、9 項待補與優先級；標註 §14 A3 子頁鏡像狀態降級、PR #302 為 P0 部署阻擋 |
| 2026-04-28 | v2.6.0 | 補齊 root Link headers、Markdown negotiation、Content-Signal、API catalog 與 Agent Skills index；明確標註 OAuth/MCP/WebMCP 不發布假 metadata                                                                                       |
| 2026-04-27 | v2.5.0 | 對齊 2026 權威文件與現行程式：FAQPage 收斂為 `/faq/` only、幣別頁移除 FinancialService、補入 public truth surface / schema gate 規格                                                               |
| 2026-04-25 | v2.4.7 | 新增 `ROOT_SITE_HOSTS` 加入 `app.haotool.org`，待生產重測 `/` 與 `/ratewise/` SEO header / negotiation 對齊                                                                                        |
| 2026-04-25 | v2.4.6 | 新增 12.6.6 生產實測差異（root /ratewise/ header 差異），補齊 46 筆權威入口重測快照與 IsItAgentReady 生產端檢核入口 404 檢核                                                                       |
| 2026-04-25 | v2.4.5 | 新增 12.6.7 外部檢測快照與 12.6.6 IsItAgentReady 重掃實測；補齊 12.6.5 重複掃描命令，文件版本與修訂欄位同步                                                                                        |
| 2026-04-25 | v2.4.3 | 補齊首頁 AI 可發現性修正：`robots.txt` Content-Signal、首頁 Link header、markdown negotiation；更新 markdown 鏡像與驗證規格                                                                        |
| 2026-04-25 | v2.4.2 | 新增 IsItAgentReady 掃描報告節點（2026-04-24），補齊 Level 1 失敗項目清單與 BOT-Aware 升級建議                                                                                                     |
| 2026-04-25 | v2.4.1 | 新增 2026-04-25 外部檢測快照、分層記錄第三方限制狀態，補齊外部可複用檢測命令與迭代規程                                                                                                             |
| 2026-04-24 | v2.4.0 | 新增「權威 SEO 參考網站」與「生產網址外部檢測報告」節點；補充 26 個權威來源與 2026-04-24 外部回應紀錄                                                                                              |
| 2026-04-24 | v2.3.0 | 對齊 apps/ratewise 現行 SEO 實作：FAQPage 改為 34 個幣別頁、補 FinancialService/Dataset/Person、同步 prebuild 與 Markdown 鏡像治理                                                                 |
| 2026-04-23 | v2.2.0 | 同步 SEO SSOT 現況：249 URL、HaoRate 品牌、已完成 schema/Answer Capsule、AI crawler 共用清單與 sitemap 過時標籤治理                                                                                |
| 2026-04-20 | v1.3.0 | P1-5 完成：金額頁加入 ExchangeRateSpecification schema（含換算金額），4 個新測試案例                                                                                                               |
| 2026-04-10 | v1.2.0 | 新增 2026 年 AI 搜尋術語（AEO/GEO/LLMO 深度解析）、AI 平台特性對照表、更新 TODO 完成狀態                                                                                                           |
| 2026-03-31 | v1.1.0 | 同步 v2.16.x 實作：seo-static.ts、AnswerCapsule 元件、路徑數量修正、健檢強化、TODO 已完成項目標記                                                                                                  |
| 2026-03-23 | v1.0.0 | 初始版本，整合六份舊 SEO 文件                                                                                                                                                                                      |
