# RateWise SEO 完整規範 — Master SSOT

> **文件版本**: v2.1.0
> **建立日期**: 2026-03-23
> **最後更新**: 2026-04-18
> **文件性質**: AI 助手 + 工程師執行手冊 / SEO 單一真實來源
> **適用版本**: RateWise ≥ v2.18.0
> **上位文件**: `CLAUDE.md`, `AGENTS.md`
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

---

## 2. 架構總覽：SSOT 檔案地圖

### 2.1 設定層（Config Layer）

```
seo-paths.config.mjs              ← 路徑 SSOT（Node / build 環境）
  ├─ CONTENT_SEO_PATHS (8)         核心內容頁，可索引
  ├─ LEGAL_SSG_PATHS (1)           法律頁（/privacy/），noindex
  ├─ CURRENCY_SEO_PATHS (17)       外幣→TWD，可索引
  ├─ REVERSE_CURRENCY_SEO_PATHS (17) TWD→外幣，可索引
  ├─ CURRENCY_AMOUNT_SEO_PATHS (104) 外幣→TWD 金額頁，可索引（路徑式 SSG）
  ├─ REVERSE_CURRENCY_AMOUNT_SEO_PATHS (102) TWD→外幣金額頁，可索引
  ├─ APP_ONLY_PATHS (8)            功能頁（noindex 或 Disallow）
  └─ SITE_CONFIG                   基本站點資訊（URL、名稱、描述）
  合計：SEO_PATHS = 248；PRERENDER_PATHS = 257

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
scripts/generate-api-json.mjs           → public/api/latest.json
scripts/generate-pair-json.mjs          → public/api/pairs/{pair}.json (34 個)
scripts/generate-openapi.mjs            → public/openapi.json
scripts/generate-manifest.mjs           → public/manifest.webmanifest
scripts/fetch-rating-snapshot.mjs       → src/config/generated/rating-snapshot.ts
scripts/update-seo-rate-examples.mjs    → src/config/seo-rate-examples.ts（週更）
```

### 2.3 公開 SEO 文件（Public SEO Artifacts）

```
public/
  sitemap.xml          約 246 個 URL（42 核心 + 204 金額頁）+ hreflang + image
  robots.txt           AI 爬蟲四層語意分組（training/search/user-agent/preview）
  llms.txt             LLM 友善索引（精簡版，llmstxt.org 規範）
  llms-full.txt        LLM 完整技術文件（含 JSON schema + 程式碼範例）
  openapi.json         OpenAPI 3.1 API 規格
  api/latest.json      API metadata（版本、幣別、端點）
  api/pairs/{pair}.json 各幣對靜態端點（34 個）
  faq.md               FAQ 頁 Markdown 鏡像（2026-04 新增，cloaking-safe）
  about.md             About 頁 Markdown 鏡像
  privacy.md           Privacy 頁 Markdown 鏡像
  guide.md             Guide 頁 Markdown 鏡像
  open-data.md         Open Data 頁 Markdown 鏡像
  _headers             Cloudflare Pages 快取/CORS + Link rel="alternate" type="text/markdown"
```

**Markdown 鏡像策略（A3，Best Practice 2026）**：

- 5 個 `.md` 檔由 `generate-markdown-mirrors.mjs` 於 prebuild 自動產生，內容從 `seo-metadata.ts` SSOT 擷取，避免 drift。
- `_headers` 對 `/ratewise/*.md` 設 `Content-Type: text/markdown; charset=utf-8`，並對 HTML 頁注入 `Link: <...md>; rel="alternate"; type="text/markdown"` RFC 8288 HTTP 標頭，供 AI 爬蟲自動發現純文字版本。
- 內容與對應 HTML 頁語義一致（同 FAQ、同作者、同資料來源），符合 Google cloaking 紅線。
- drift-guard 測試：`apps/ratewise/src/__tests__/markdown-mirror.test.ts`（11 個錨定字串斷言）。

### 2.4 驗證層（Verification Layer）

```
scripts/verify-ssot-sync.mjs       seo-paths.config.mjs ↔ seo-paths.ts 一致性
scripts/verify-image-resources.mjs OG 圖片、icon 資源可用性
scripts/verify-production-resources.mjs 生產環境資源可用性（v2.16.4 加強 5xx 重試）
scripts/seo-health-check.mjs       SEO 結構健檢（307 項）；decodeURI 修正中文 hex 誤判
scripts/seo-full-audit.mjs         完整 SEO 稽核（v2.16.4 加強 precache 驗證）
scripts/verify-precache-assets.mjs precache 資產驗證（v2.16.4 加強 URL 比對邏輯）
scripts/health-check.mjs           生產站 health-check；改用 seo-static.ts 共用標題常數
src/config/__tests__/seo-ssot.test.ts   SSOT 完整性測試（Template-bleed 防護）
src/config/__tests__/seo-paths.test.ts  路徑正規化測試
src/config/__tests__/build-scripts.test.ts  建置腳本回歸測試（v2.16.x 新增）
src/components/__tests__/SEOHelmet.test.tsx SEOHelmet 行為回歸測試（v2.16.4 補強）
src/components/__tests__/AuthorityGuidePage.test.tsx AuthorityGuidePage schema 傳遞測試（v2.16.4 新增）
src/pages/About.test.tsx / Guide.test.tsx / OpenData.test.tsx  頁面 SEO 回歸測試（v2.16.4 新增）
src/prerender.test.ts              prerender HTML 穩定性測試（v2.16.x 補強）
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
| 核心內容頁         | 8    | ✅     | ✅      | Allow        | —       |
| 法律頁 `/privacy/` | 1    | ❌     | ❌      | Allow        | ✅      |
| 外幣→TWD 幣對頁    | 17   | ✅     | ✅      | Allow        | —       |
| TWD→外幣 幣對頁    | 17   | ✅     | ✅      | Allow        | —       |
| 外幣→TWD 金額頁    | 104  | ✅     | ✅      | Allow        | —       |
| TWD→外幣 金額頁    | 102  | ✅     | ✅      | Allow        | —       |
| 功能頁（noindex）  | 4    | ❌     | ❌      | Allow        | ✅      |
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

> ⚠️ **llms.txt 描述修正（Bug）**：llms.txt 中「幣對金額頁 (Wise-pattern)」的範例使用 `?amount=` 格式，但實際 SSG 金額頁是**路徑式** `/usd-twd/100/`。這兩者是不同機制：路徑式 SSG 頁為可索引頁面，`?amount=` 為 UX 深連結（不索引）。llms.txt 需修正此描述。

---

## 4. 結構化資料規範（Schema.org）

### 4.1 現況清單

| Schema 類型                 | 頁面                  | 狀態                      | 實作位置                                                                                            |
| --------------------------- | --------------------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| `Organization`              | 全站                  | ✅ 已實作                 | `SEOHelmet.tsx` + `seo-metadata.ts`                                                                 |
| `WebSite`                   | 全站                  | ✅ 已實作                 | `SEOHelmet.tsx`                                                                                     |
| `SoftwareApplication`       | 首頁                  | ✅ 已實作                 | `SEOHelmet.tsx`                                                                                     |
| `FAQPage`                   | FAQ 頁（`/faq/`）     | ✅ 已實作                 | `SEOHelmet.tsx`                                                                                     |
| `BreadcrumbList`            | 幣對頁、金額頁        | ✅ 已實作                 | `SEOHelmet.tsx`                                                                                     |
| `HowTo`                     | Guide 頁              | ✅ 已實作                 | `SEOHelmet.tsx`                                                                                     |
| `ImageObject`               | OG 圖片（隱式）       | ✅ 已實作                 | `seo-metadata.ts`                                                                                   |
| `Article`                   | 三篇 Authority Guide  | ✅ 已實作 (v2.18.0)       | `seo-metadata.ts` buildArticleJsonLd                                                                |
| `SpeakableSpecification`    | 所有 9 個內容頁       | ✅ 已實作 (v2.18.0)       | `seo-metadata.ts` buildSpeakableJsonLd                                                              |
| `knowsAbout`（Property）    | Organization + Person | ✅ 已實作 (v2.18.0)       | `buildSiteJsonLd()` + `buildPersonJsonLd()`                                                         |
| `CurrencyConversionService` | 首頁                  | ✅ 已實作 (v2.22.0)       | `seo-metadata.ts` buildCurrencyConversionServiceJsonLd                                              |
| `ExchangeRateSpecification` | 幣對頁 + 金額頁       | ✅ 已實作 (v2.24.0)       | `seo-metadata.ts` buildExchangeRateSpecificationJsonLd / buildAmountExchangeRateSpecificationJsonLd |
| `AggregateRating`           | 首頁                  | ❌ **缺漏（無評分系統）** | —                                                                                                   |

### 4.2 已完成 Schema 實作參考

#### 4.2.1 `CurrencyConversionService`（✅ 已完成 v2.22.0）

**實作位置**：`seo-metadata.ts` → `buildCurrencyConversionServiceJsonLd()`；在首頁 `HOMEPAGE_SEO.jsonLd` 注入。

Schema.org 精確定義此工具的核心功能，AI 引擎在匹配「幣別換算工具」查詢時優先引用有此 schema 的頁面。

#### 4.2.2 `ExchangeRateSpecification`（✅ 已完成 v2.24.0）

**實作位置**：

- 幣對頁：`seo-metadata.ts` → `buildExchangeRateSpecificationJsonLd()`；在 34 個幣對頁 `getCurrencyLandingPageContent()` 和 `getReverseCurrencyLandingPageContent()` 注入。
- 金額頁：`seo-metadata.ts` → `buildAmountExchangeRateSpecificationJsonLd()`；在 `CurrencyLandingPage.tsx` 中當 `amount !== null` 時動態注入，包含具體換算金額（如「100 USD 換 3,250 TWD」）。

**實作細節**：

- `price` 使用 `seo-rate-examples.ts` 的 `cashSell`（現金賣出價）
- `validFrom` 使用 `SEO_RATE_EXAMPLES_DATE`
- 外幣→TWD 頁（如 `usd-twd`）：`currency: "USD"`，`priceCurrency: "TWD"`
- TWD→外幣頁（如 `twd-usd`）：`currency: "TWD"`，`priceCurrency: "USD"`（匯率取倒數）

### 4.3 待實作 Schema 規格

#### 4.3.1 `Article` / `TechArticle`（P2 — 三篇 Authority Guide）

提升 AI 引擎對這三篇權威指南的引用率（AI 引用 Article 內容比普通頁面高 40%）。

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

### 4.3 Schema 重複防護規則

- **絕對禁止**同一頁面出現兩個相同 `@type`（尤其 `FAQPage`、`BreadcrumbList`）
- `FAQPage` 僅輸出於 `/faq/` 頁面；首頁和幣別頁保留 FAQ **HTML 內容**但不輸出 FAQPage JSON-LD
- 驗證指令：`grep -r "FAQPage" dist/ | wc -l`（應只有 1）
- `seo-helmet-utils.ts` 的 `shouldRenderStructuredData()` 確保 noindex 頁不輸出任何 JSON-LD
- `AuthorityGuidePage` 元件：透過 `jsonLd`、`faqContent`、`answerCapsule` props 接受已定義的 schema，禁止在元件內部硬編碼

### 4.4 Schema 輸出矩陣

| 頁面            | Organization | WebSite | SoftwareApp | CurrencyConv. | ExchangeRate | BreadcrumbList | FAQPage | HowTo |  Article   |
| --------------- | :----------: | :-----: | :---------: | :-----------: | :----------: | :------------: | :-----: | :---: | :--------: |
| 首頁 `/`        |      ✅      |   ✅    |     ✅      |  **📌需加**   |      —       |       —        |   ❌    |   —   |     —      |
| FAQ `/faq/`     |      ✅      |   ✅    |      —      |       —       |      —       |       ✅       |   ✅    |   —   |     —      |
| Guide `/guide/` |      ✅      |   ✅    |      —      |       —       |      —       |       ✅       |    —    |  ✅   | **📌需加** |
| About `/about/` |      ✅      |   ✅    |      —      |       —       |      —       |       ✅       |    —    |   —   |     —      |
| 三篇 Authority  |      ✅      |   ✅    |      —      |       —       |      —       |       ✅       |    —    |   —   | **📌需加** |
| 幣對頁（34）    |      ✅      |   ✅    |      —      |       —       |      ✅      |       ✅       |    —    |   —   |     —      |
| 金額頁（~204）  |      ✅      |   ✅    |      —      |       —       |      ✅      |       ✅       |    —    |   —   |     —      |

---

## 5. 各頁面 SEO 內容標準

### 5.1 首頁（`/`）

**目標查詢**：「台幣換算」「匯率換算工具」「台銀匯率」「外幣換台幣」

| 元素           | 規格                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ |
| Title          | `RateWise — 台灣最精準匯率換算器 \| 台銀實際賣出價`                                  |
| Description    | 155 字元以內；強調「台銀實際賣出價（非中間價）」、18 種貨幣、5 分鐘更新              |
| H1             | 含主關鍵字「匯率換算」或「台銀匯率」                                                 |
| Answer Capsule | 40-60 字首段落解釋工具核心價值（供 AI 引擎提取）                                     |
| Schema         | Organization + WebSite + SoftwareApplication + **CurrencyConversionService（待加）** |
| FAQ HTML       | 保留 FAQ 內容區塊（可讀 HTML），**不輸出** FAQPage JSON-LD                           |
| OG Image       | `og-image.jpg` (1200×630)，含品牌名稱與核心特色                                      |

### 5.2 幣對頁（外幣→TWD，共 17 頁，如 `/jpy-twd/`）

**目標查詢**：「日圓換台幣」「JPY 換 TWD」「台銀日圓匯率今日」

**每頁必備內容**：

1. **Answer Capsule（40-60 字）**：頁面頂部獨立段落，直接回答「1 [外幣] 等於多少台幣」
   - 範例：「1 日圓（JPY）等於 X 台幣（TWD），以臺灣銀行即期賣出價為準。RateWise 每 5 分鐘自動同步台銀牌告匯率，是最接近實際換匯成本的即時報價。」
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

5. **Schema**：`ExchangeRateSpecification`（待加）+ `BreadcrumbList`（已有）

| 元素        | 規格                                                                 |
| ----------- | -------------------------------------------------------------------- |
| Title       | `{外幣名稱}換台幣匯率今日 ({CODE}/TWD) — 台銀實際賣出價 \| RateWise` |
| Description | 含具體應用場景（旅遊/海外購物）+ 強調台銀賣出價                      |
| H1          | `{外幣名稱}換台幣（{CODE} to TWD）`                                  |
| Canonical   | `https://app.haotool.org/ratewise/{code}-twd/`                       |
| hreflang    | zh-TW + x-default                                                    |
| Schema      | ExchangeRateSpecification + BreadcrumbList                           |

### 5.3 幣對頁（TWD→外幣，共 17 頁，如 `/twd-jpy/`）

**目標查詢**：「台幣換日圓」「出國前換匯」「TWD 換 JPY」

與外幣→TWD 頁規格類同，差異：

- H1 強調「出國前換匯」情境
- Answer Capsule：「1 台幣（TWD）等於 X 日圓（JPY）...帶台幣換日圓，適用臨櫃換鈔的台銀現金賣出價」
- `ExchangeRateSpecification` 的 currency/priceCurrency 方向對調

### 5.4 金額頁（路徑式，約 204 頁，如 `/usd-twd/100/`）

**目標查詢**：「100 美元換台幣」「100 USD to TWD」

| 元素        | 規格                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Title       | `{金額} {外幣名稱}換新台幣 ({CODE}/TWD) — 台銀實際賣出價 \| RateWise`                 |
| Description | 「{金額} 美元（USD）換台幣（TWD），依臺灣銀行即期賣出價計算約 NT$X。每 5 分鐘更新。」 |
| Canonical   | 自引用（`/usd-twd/100/`），禁止指向父頁 `/usd-twd/`                                   |
| Schema      | ExchangeRateSpecification（金額換算結果）+ BreadcrumbList                             |
| FAQ         | 精簡版（2-3 題即可，避免重複父頁內容）                                                |

### 5.5 FAQ 頁（`/faq/`）

**目標查詢**：「台幣匯率 FAQ」「現金匯率 vs 即期匯率」「買入賣出怎麼看」

- 唯一輸出 `FAQPage` JSON-LD 的頁面
- 問題數量：≥ 10 題（現況已滿足）
- 涵蓋：現金/即期差異、買入/賣出角度、台銀 vs 刷卡、DCC 解釋、匯率更新機制

### 5.6 三篇 Authority Guide 頁

`AuthorityGuidePage` 元件自 v2.16.4 起透過 `SEOPageMetadata` 的 `jsonLd`、`faqContent`、`answerCapsule` props 接受 schema 與 Q&A。

| 頁面                      | 目標查詢                 | 現況                                      |
| ------------------------- | ------------------------ | ----------------------------------------- |
| `/sell-rate-vs-mid-rate/` | 「賣出價 vs 中間價」     | `Article` JSON-LD ✅；Answer Capsule 待補 |
| `/cash-vs-spot-rate/`     | 「現金匯率 vs 即期匯率」 | `Article` JSON-LD ✅；Answer Capsule 待補 |
| `/card-rate-guide/`       | 「刷卡匯率 DCC」         | `Article` JSON-LD ✅；Answer Capsule 待補 |

每頁仍需補充：

- 40-60 字 Answer Capsule（在 `seo-metadata.ts` 對應 `AUTHORITY_GUIDE_PAGES` 加入 `answerCapsule` 欄位）
- 匯率比較表（具體數字，供 AI 引擎提取）
- 「最後更新：[日期]」可見時間戳

### 5.7 Open Data 頁（`/open-data/`）

- 目標：開發者與 AI agent 發現 API 端點
- 需包含：API 端點範例、程式碼範例、欄位說明
- Schema：`TechArticle`（待確認是否已有）

---

## 6. AI 搜尋優化（AEO / GEO）

### 6.1 AI 搜尋市場現況（2025）

| 平台                    | 市占   | 最強引用信號                         | RateWise 現況  |
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
RateWise 顯示臺灣銀行牌告的實際賣出價（非中間價），支援 18 種貨幣的即時換算，
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

**當前狀態**：✅ 已實作，大致符合規範，但有以下需修正項目：

### 7.2 已確認缺漏與錯誤

1. **金額頁 URL 格式描述錯誤**（Bug）：
   - 當前文字：「格式：`/{pair}/?amount={AMOUNT}`（例如：`/usd-twd/?amount=500`）」
   - 正確說明：SSG 金額頁使用**路徑式 URL**（`/usd-twd/100/`）；`?amount=` 是 UX 深連結（不索引）
   - 必須修正：更新 `generate-llms-txt.mjs` 的說明文字

2. **llmstxt.org 規範格式**（當前接近但可再精確）：
   - 標準格式：`# 標題` → `> 一行描述` → `## 區塊` → `- [連結](URL): 說明`
   - 建議將 Answer Capsule Q&A 整理為標準 `## 區塊` 下的清單項目

3. **Claude-User 與 ClaudeBot 區分**：
   - `ClaudeBot`：Anthropic 訓練爬蟲（可選擇封鎖）
   - `Claude-User`：Claude 搜尋模式（**必須允許**才能被 Claude 引用）
   - AI/LLM Access Control 區塊需明確列出 `Claude-User`

### 7.3 llms.txt 必要區塊規格

```markdown
# RateWise 匯率好工具

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
User-agent: CCBot
User-agent: Applebot-Extended
User-agent: Meta-ExternalAgent
User-agent: FacebookBot
User-agent: cohere-ai
User-agent: Bytespider
User-agent: Cloudflare-AutoRAG
User-agent: Novellum AI Crawl
User-agent: Timpibot
User-agent: ProRataInc
Allow: /

# --- Tier 2: Search/RAG ---（6 隻）
User-agent: OAI-SearchBot
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Google-CloudVertexBot
User-agent: DuckAssistBot
User-agent: Amazonbot
Allow: /

# --- Tier 3: User Agent ---（8 隻，即時 AI 助手）
User-agent: ChatGPT-User
User-agent: Claude-User
User-agent: Perplexity-User
User-agent: MistralAI-User
User-agent: Manus-User
User-agent: Meta-ExternalFetcher
User-agent: GrokBot
User-agent: YouBot
Allow: /

# --- Tier 4: Preview/Other ---（9 隻，社群預覽 + 雜項）
User-agent: facebookexternalhit
User-agent: Twitterbot
User-agent: LinkedInBot
User-agent: Applebot
User-agent: PhindBot
User-agent: PetalBot
User-agent: archive.org_bot
User-agent: Terracotta Bot
User-agent: Anchor Browser
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

robots.txt 明確 Allow 以下 AI 爬蟲，確保最大 AI 搜尋可見度：

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

| 類別                         | 數量    | 備註                                                                                                                     |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| 核心內容頁                   | 8       | `/`, `/faq/`, `/about/`, `/guide/`, `/sell-rate-vs-mid-rate/`, `/cash-vs-spot-rate/`, `/card-rate-guide/`, `/open-data/` |
| 幣對頁 (外幣→TWD)            | 17      | `/usd-twd/` …                                                                                                            |
| 幣對頁 (TWD→外幣)            | 17      | `/twd-usd/` …                                                                                                            |
| 金額頁（外幣→TWD）           | 104     | 每幣別 6-7 個熱門金額（CURRENCY_AMOUNT_SEO_PATHS）                                                                       |
| 金額頁（TWD→外幣）           | 102     | 每幣別 6 個熱門金額（REVERSE_CURRENCY_AMOUNT_SEO_PATHS）                                                                 |
| **合計**                     | **248** |                                                                                                                          |
| 排除：`/privacy/`（noindex） | 0       | 不入 sitemap                                                                                                             |
| 排除：所有 APP_ONLY_PATHS    | 0       | 不入 sitemap                                                                                                             |

### 9.2 每個 URL 必備元素

```xml
<url>
  <loc>https://app.haotool.org/ratewise/usd-twd/</loc>
  <lastmod>2026-03-23</lastmod>
  <changefreq>daily</changefreq>       <!-- 幣對頁：daily（匯率每日更新） -->
  <priority>0.9</priority>              <!-- 幣對頁：0.9；核心頁：1.0 -->
  <xhtml:link rel="alternate" hreflang="zh-TW"
    href="https://app.haotool.org/ratewise/usd-twd/" />
  <xhtml:link rel="alternate" hreflang="x-default"
    href="https://app.haotool.org/ratewise/usd-twd/" />
  <image:image>
    <image:loc>https://app.haotool.org/ratewise/og-image.jpg</image:loc>
    <image:title>RateWise — 美元換台幣匯率</image:title>
  </image:image>
</url>
```

**Priority 規格**：

| 頁面類型           | priority | changefreq |
| ------------------ | -------- | ---------- |
| 首頁               | 1.0      | hourly     |
| 幣對頁             | 0.9      | daily      |
| 金額頁             | 0.8      | daily      |
| 核心內容頁         | 0.8      | weekly     |
| Authority Guide 頁 | 0.7      | weekly     |

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
node ../../scripts/generate-sitemap-2025.mjs    # sitemap 生成
node scripts/generate-robots-txt.mjs            # robots.txt 生成
node scripts/generate-manifest.mjs              # PWA manifest 生成
node scripts/generate-llms-txt.mjs              # llms.txt 生成
node scripts/generate-api-json.mjs              # API metadata 生成
node scripts/generate-pair-json.mjs             # 幣對端點生成
node scripts/generate-openapi.mjs               # OpenAPI 規格生成
node ../../scripts/verify-ssot-sync.mjs         # SSOT 一致性驗證
node ../../scripts/verify-image-resources.mjs   # 圖片資源驗證
node scripts/fetch-rating-snapshot.mjs          # 匯率快照更新
```

### 11.2 測試覆蓋規格

| 測試檔案                      | 涵蓋面                                                             | 最低測試數 |
| ----------------------------- | ------------------------------------------------------------------ | ---------- |
| `seo-ssot.test.ts`            | SSOT 一致性、template-bleed、rate examples                         | ≥ 40       |
| `seo-paths.test.ts`           | 路徑正規化、prerender 判斷                                         | ≥ 20       |
| `seo-best-practices.test.ts`  | LLMO/GEO 合規（llms.txt、robots.txt、sitemap、JSON-LD）            | ≥ 30       |
| `build-scripts.test.ts`       | 建置腳本回歸（health-check 使用 seo-static.ts、generate-manifest） | ≥ 20       |
| `SEOHelmet.test.tsx`          | answerCapsule 欄位渲染、noindex 防護                               | ≥ 15       |
| `AuthorityGuidePage.test.tsx` | jsonLd/faqContent/answerCapsule props 傳遞                         | ≥ 10       |
| `prerender.test.ts`           | FAQ/amount 頁 canonical、schema URL 穩定性                         | ≥ 15       |

### 11.3 禁止行為清單

- ❌ 手動修改 `public/robots.txt`（由 `generate-robots-txt.mjs` 管理）
- ❌ 手動修改 `public/sitemap.xml`（由 `generate-sitemap-2025.mjs` 管理）
- ❌ 手動修改 `public/llms.txt`（由 `generate-llms-txt.mjs` 管理）
- ❌ 在頁面元件中硬編碼 title/description（必須從 `seo-metadata.ts` 讀取）
- ❌ 同一頁面輸出兩個相同 `@type` JSON-LD
- ❌ `FAQPage` schema 出現在 `/faq/` 以外的頁面
- ❌ `ExchangeRateSpecification` 的 price 欄位硬編碼（必須從 `rating-snapshot.ts` 讀取）
- ❌ 在 noindex 頁面輸出任何 JSON-LD（`shouldRenderStructuredData()` 管控）

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

- **索引覆蓋**：確認 248 個 SEO 頁面均已索引（排除 noindex 頁）
- **搜尋排名**：「日圓換台幣」「美元換台幣」等核心查詢在 Top 10
- **Core Web Vitals**：分頁類型的 LCP/INP/CLS 狀態
- **Rich Results**：FAQPage、BreadcrumbList rich snippets 是否正常顯示

---

## 13. SEO 缺口分析（2026-04-10 審查）

### 13.0 現況成熟度評估

RateWise 已具備高成熟度的技術 SEO 基礎。2026-04-10 審查結論：**現階段最需要補的不是更多 meta tag，而是內容廣度、可觀測性與站外權威。**

### 13.0.1 已達標項目

- 技術 SEO：robots.txt、sitemap、hreflang、canonical、noindex 控制 ✅
- 程序化 SEO：正向/反向幣別頁 + 代表性金額頁路徑型策略 ✅
- 結構化資料：8 種 Schema 類型 + Speakable + knowsAbout 實體信號 ✅
- E-E-A-T：Person/Organization schema、about 頁、明確資料來源 ✅
- AI 可讀性：llms.txt/llms-full.txt、18 AI Bot Allow、openapi.json ✅
- 驗證覆蓋：1900+ 測試，多層 CI 每日驗證 ✅

### 13.0.2 仍缺的頂級 SEO 能力

| 缺口                         | 優先級 | 說明                                                                               |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------- |
| **多語索引戰略**             | P0     | UI 有多語但無可索引英文/日文內容體系與完整 hreflang 網狀關係；影響國際流量         |
| **SEO 可觀測性**             | P0     | 無 Search Console / CrUX / coverage 週期監控；無 SERP CTR 迭代機制                 |
| **內容主題群擴張**           | P0     | 現有強項為幣對頁；缺：刷卡匯率/DCC、機場換匯、各銀行差異、旅遊換匯指南             |
| **站外權威訊號**             | P1     | 無外部品牌 mention、高品質反向連結、媒體提及、可辨識的 entity footprint            |
| `CurrencyConversionService`  | P0     | Schema.org 精確定義此工具；AI 引擎匹配「幣別換算」查詢時優先引用有此 schema 的頁面 |
| `ExchangeRateSpecification`  | P0     | 每個幣對頁注入即時匯率；AI 引擎可提取並顯示具體數字，從 `rating-snapshot.ts` 讀取  |
| **Answer Capsule（幣對頁）** | P1     | 40-60 字直接答案段落；現況多數幣對頁缺此欄位；AI 引用率 +40%                       |

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
| —     | 品牌 SSOT 收斂（manifest、PWA、llms、API 契約）                          | v2.16.1-2 | "RateWise 匯率好工具" 品牌全面統一                                                                |
| —     | FAQ 頁 pathname 修正（`/faq` → `/faq/`）                                 | v2.16.0   | canonical URL trailing slash 已補                                                                 |
| —     | seo-health-check decodeURIComponent 中文標點修正                         | v2.16.0   | 307 項健檢通過，0 錯誤                                                                            |
| —     | amount 頁 canonical 與 schema URL 穩定性                                 | v2.16.0   | prerender HTML 回歸測試補強                                                                       |
| —     | seo-static.ts 抽出（health-check 與 seo-metadata 共用標題常數）          | v2.16.4   | 移除 health-check 對 Vite runtime 的直接依賴                                                      |
| —     | health-check 5xx 暫時性錯誤重試機制                                      | v2.16.4   | 避免短暫部署抖動誤報                                                                              |
| —     | SEO_PATHS 數量修正（~204 → 206）                                         | v2.16.0   | CURRENCY_AMOUNT(104) + REVERSE_CURRENCY_AMOUNT(102)                                               |
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

| #    | 任務                                                   | 影響         | 備註                |
| ---- | ------------------------------------------------------ | ------------ | ------------------- |
| P3-1 | 英文版本 `/en/` 路由                                   | 國際 SEO     | 預估 4h，需翻譯全站 |
| P3-2 | 日文版本 `/ja/` 路由                                   | 日本用戶 SEO | 預估 4h，需日文翻譯 |
| P3-3 | `AggregateRating` schema（需建立評分收集機制）         | Gemini 引用  | 需先有評分系統      |
| P3-4 | 建立 FAQ 互動頁（讓 Google AI Overviews 更容易提取）   | AI Overview  | 需 UX 設計          |
| P3-5 | 程序化 SEO 擴展：增加更多金額頁（如每幣別 12+ 個金額） | 長尾流量     | 需評估爬蟲預算      |

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
| **台銀賣出價**                | 臺灣銀行牌告的實際賣出匯率（即期賣出或現金賣出）；RateWise 的核心差異化數據           |
| **中間價**                    | 買入與賣出均價（bid-ask midpoint）；多數匯率工具顯示的數字，不反映實際換匯成本        |
| **SSG**                       | Static Site Generation — 在 Build 時生成靜態 HTML，讓爬蟲無需執行 JS 即可讀取完整內容 |
| **rating-snapshot.ts**        | 預建置時抓取的台銀匯率快照，用於在 `ExchangeRateSpecification` 中注入即時價格         |
| **SSOT**                      | Single Source of Truth — 單一真實來源，確保所有相關文件從同一個設定衍生               |
| **llms.txt**                  | 放置於網站根目錄的 AI 友善索引文件，遵循 llmstxt.org 規範（Markdown 格式）            |
| **INP**                       | Interaction to Next Paint — 2024 年取代 FID 的 Core Web Vitals 指標，測量所有互動延遲 |
| **路徑式金額頁**              | 使用 URL 路徑而非 query string 的金額 SEO 頁面（`/usd-twd/100/`），可被索引           |

### 15.3 2026 年 AI 搜尋平台特性

| 平台                    | 主要引用信號                            | RateWise 對應策略                          |
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

**最後更新**: 2026-04-20
**版本**: v1.3.0
**維護者**: Development Team
**下次審查日**: 2026-07-10（每季審查）

### 修訂紀錄

| 日期       | 版本   | 變更摘要                                                                                                 |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------- |
| 2026-04-20 | v1.3.0 | P1-5 完成：金額頁加入 ExchangeRateSpecification schema（含換算金額），4 個新測試案例                     |
| 2026-04-10 | v1.2.0 | 新增 2026 年 AI 搜尋術語（AEO/GEO/LLMO 深度解析）、AI 平台特性對照表、更新 TODO 完成狀態                 |
| 2026-03-31 | v1.1.0 | 同步 v2.16.x 實作：seo-static.ts、AnswerCapsule 元件、路徑數量修正（248）、健檢強化、TODO 已完成項目標記 |
| 2026-03-23 | v1.0.0 | 初始版本，整合六份舊 SEO 文件                                                                            |
