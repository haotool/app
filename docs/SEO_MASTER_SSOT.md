# RateWise SEO 完整規範 — Master SSOT

> **文件版本**: v1.0.0
> **建立日期**: 2026-03-23
> **最後更新**: 2026-03-23
> **文件性質**: AI 助手 + 工程師執行手冊 / SEO 單一真實來源
> **適用版本**: RateWise ≥ v2.15.0
> **上位文件**: `CLAUDE.md`, `AGENTS.md`
> **取代文件**: 本文整合並取代下列舊文件（舊文件保留但不再更新）：
>
> - `docs/SEO_GUIDE.md` (v2.0.0)
> - `docs/dev/SEO_TODO.md` (v2.1.0)
> - `docs/dev/seo-research-notes.md` (v2.0.0)
> - `docs/dev/SEO_BDD_IMPLEMENTATION_2025-12-01.md`
> - `docs/SEO_SUBMISSION_GUIDE.md`
> - `docs/prompt/SEO_WORKFLOW_PROMPT.md`

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
13. [優先 TODO 清單](#13-優先-todo-清單)
14. [詞彙表](#14-詞彙表)

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
  ├─ CURRENCY_AMOUNT_SEO_PATHS (~102) 外幣金額頁，可索引（路徑式 SSG）
  ├─ REVERSE_CURRENCY_AMOUNT_SEO_PATHS (~102) 反向金額頁，可索引
  ├─ APP_ONLY_PATHS (8)            功能頁（noindex 或 Disallow）
  └─ SITE_CONFIG                   基本站點資訊（URL、名稱、描述）

src/config/seo-paths.ts           ← TypeScript 鏡像（執行期型別守衛）
src/config/seo-metadata.ts        ← 內容 SSOT（title/description/FAQ/JSON-LD）
  ├─ HOMEPAGE_SEO                  首頁 SEO 內容
  ├─ CURRENCY_PAGE_OVERRIDES       各幣別頁面覆寫
  ├─ REVERSE_CURRENCY_PAGE_OVERRIDES 各反向幣別頁面覆寫
  └─ SEO_RATE_EXAMPLES             每日自動更新的匯率差距範例
```

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
  robots.txt           AI 爬蟲全開放 + 封鎖 PWA 資產 + dev 頁
  llms.txt             LLM 友善索引（精簡版，llmstxt.org 規範）
  llms-full.txt        LLM 完整技術文件（含 JSON schema + 程式碼範例）
  openapi.json         OpenAPI 3.1 API 規格
  api/latest.json      API metadata（版本、幣別、端點）
  api/pairs/{pair}.json 各幣對靜態端點（34 個）
```

### 2.4 驗證層（Verification Layer）

```
scripts/verify-ssot-sync.mjs       seo-paths.config.mjs ↔ seo-paths.ts 一致性
scripts/verify-image-resources.mjs OG 圖片、icon 資源可用性
scripts/verify-production-resources.mjs 生產環境資源可用性
src/config/__tests__/seo-ssot.test.ts   SSOT 完整性測試（Template-bleed 防護）
src/config/__tests__/seo-paths.test.ts  路徑正規化測試
src/seo-best-practices.test.ts     2026 LLMO/GEO 合規測試
```

### 2.5 元件層（Component Layer）

```
src/components/SEOHelmet.tsx       head metadata 管理器（SSR + CSR 雙路徑）
src/components/HomepageSEOSection.tsx  首頁語意內容區塊
src/components/seo-helmet-utils.ts     工具函式（noindex 頁不輸出 JSON-LD）
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
| 金額頁（路徑式）   | ~204 | ✅     | ✅      | Allow        | —       |
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

| Schema 類型                 | 頁面                 | 狀態                      | 實作位置                            |
| --------------------------- | -------------------- | ------------------------- | ----------------------------------- |
| `Organization`              | 全站                 | ✅ 已實作                 | `SEOHelmet.tsx` + `seo-metadata.ts` |
| `WebSite`                   | 全站                 | ✅ 已實作                 | `SEOHelmet.tsx`                     |
| `SoftwareApplication`       | 首頁                 | ✅ 已實作                 | `SEOHelmet.tsx`                     |
| `FAQPage`                   | FAQ 頁（`/faq/`）    | ✅ 已實作                 | `SEOHelmet.tsx`                     |
| `BreadcrumbList`            | 幣對頁、金額頁       | ✅ 已實作                 | `SEOHelmet.tsx`                     |
| `HowTo`                     | Guide 頁             | ✅ 已實作                 | `SEOHelmet.tsx`                     |
| `ImageObject`               | OG 圖片（隱式）      | ✅ 已實作                 | `seo-metadata.ts`                   |
| `CurrencyConversionService` | 首頁                 | ❌ **缺漏**               | —                                   |
| `ExchangeRateSpecification` | 幣對頁（34 個）      | ❌ **缺漏**               | —                                   |
| `Article` / `TechArticle`   | 三篇 Authority Guide | ❌ **缺漏**               | —                                   |
| `AggregateRating`           | 首頁                 | ❌ **缺漏（無評分系統）** | —                                   |

### 4.2 高優先級缺漏 Schema 規格

#### 4.2.1 `CurrencyConversionService`（P1 — 首頁）

Schema.org 精確定義此工具的核心功能，AI 引擎在匹配「幣別換算工具」查詢時優先引用有此 schema 的頁面。

```json
{
  "@context": "https://schema.org",
  "@type": "CurrencyConversionService",
  "name": "RateWise 匯率好工具",
  "alternateName": "RateWise",
  "description": "顯示臺灣銀行牌告實際買入賣出價（非中間價）的即時匯率換算工具，支援 18 種貨幣、現金與即期匯率切換、PWA 離線使用。",
  "provider": {
    "@type": "Organization",
    "name": "HaoTool",
    "url": "https://app.haotool.org"
  },
  "url": "https://app.haotool.org/ratewise/",
  "applicationCategory": "FinanceApplication",
  "areaServed": "TW",
  "availableLanguage": ["zh-TW", "en", "ja"],
  "inLanguage": "zh-TW",
  "featureList": [
    "台灣銀行牌告匯率（現金/即期四種報價）",
    "18 種貨幣即時換算",
    "每 5 分鐘自動同步",
    "PWA 離線使用",
    "匯率歷史趨勢圖（7-30 天）"
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "TWD"
  }
}
```

**實作位置**：`seo-metadata.ts` → `buildSiteJsonLd()` 或獨立 builder；在首頁注入。

#### 4.2.2 `ExchangeRateSpecification`（P1 — 幣對頁 34 個）

每個幣對頁注入即時匯率，讓 AI 引擎可提取並顯示具體數字。**必須從 `rating-snapshot.ts` 動態注入**，禁止硬編碼。

```json
{
  "@context": "https://schema.org",
  "@type": "ExchangeRateSpecification",
  "currency": "USD",
  "currentExchangeRate": {
    "@type": "UnitPriceSpecification",
    "price": "32.75",
    "priceCurrency": "TWD",
    "description": "臺灣銀行即期賣出價（台幣換美元匯率）",
    "validFrom": "2026-03-23T10:00:00+08:00"
  }
}
```

**注意事項**：

- `price` 使用 `spot.sell`（即期賣出價）作為代表性報價
- `validFrom` 使用 `rating-snapshot.ts` 的 `updateTime` 欄位
- 外幣→TWD 頁（如 `usd-twd`）：`currency: "USD"`，`priceCurrency: "TWD"`
- TWD→外幣頁（如 `twd-usd`）：`currency: "TWD"`，`priceCurrency: "USD"`
- 包裝在 `WebPage` 的 `mainEntity` 屬性中

**實作位置**：`src/pages/CurrencyLandingPage.tsx`（或獨立 builder）→ 從 `rating-snapshot.ts` 讀取。

#### 4.2.3 `Article` / `TechArticle`（P2 — 三篇 Authority Guide）

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

### 4.4 Schema 輸出矩陣

| 頁面            | Organization | WebSite | SoftwareApp | CurrencyConv. | ExchangeRate | BreadcrumbList | FAQPage | HowTo |  Article   |
| --------------- | :----------: | :-----: | :---------: | :-----------: | :----------: | :------------: | :-----: | :---: | :--------: |
| 首頁 `/`        |      ✅      |   ✅    |     ✅      |  **📌需加**   |      —       |       —        |   ❌    |   —   |     —      |
| FAQ `/faq/`     |      ✅      |   ✅    |      —      |       —       |      —       |       ✅       |   ✅    |   —   |     —      |
| Guide `/guide/` |      ✅      |   ✅    |      —      |       —       |      —       |       ✅       |    —    |  ✅   | **📌需加** |
| About `/about/` |      ✅      |   ✅    |      —      |       —       |      —       |       ✅       |    —    |   —   |     —      |
| 三篇 Authority  |      ✅      |   ✅    |      —      |       —       |      —       |       ✅       |    —    |   —   | **📌需加** |
| 幣對頁（34）    |      ✅      |   ✅    |      —      |       —       |  **📌需加**  |       ✅       |    —    |   —   |     —      |
| 金額頁（~204）  |      ✅      |   ✅    |      —      |       —       |  **📌需加**  |       ✅       |    —    |   —   |     —      |

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

| 頁面                      | 目標查詢                 | 缺漏                             |
| ------------------------- | ------------------------ | -------------------------------- |
| `/sell-rate-vs-mid-rate/` | 「賣出價 vs 中間價」     | `Article` schema、Answer Capsule |
| `/cash-vs-spot-rate/`     | 「現金匯率 vs 即期匯率」 | `Article` schema、Answer Capsule |
| `/card-rate-guide/`       | 「刷卡匯率 DCC」         | `Article` schema、Answer Capsule |

每頁補充需求：

- 40-60 字 Answer Capsule（頁面最頂部）
- `Article` JSON-LD（含 `dateModified: BUILD_TIME`、`author`）
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

### 8.1 現況（已確認正確的規則）

```
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

### 8.2 AI 爬蟲規則（必須完整）

robots.txt 必須明確 Allow 以下 AI 爬蟲（目前已有，需確認完整）：

| 爬蟲名稱          | 平台         | 用途                            |
| ----------------- | ------------ | ------------------------------- |
| `GPTBot`          | OpenAI       | ChatGPT 訓練                    |
| `OAI-SearchBot`   | OpenAI       | ChatGPT 搜尋引用                |
| `ChatGPT-User`    | OpenAI       | ChatGPT 用戶搜尋                |
| `ClaudeBot`       | Anthropic    | Claude 訓練爬蟲                 |
| `Claude-User`     | Anthropic    | **Claude 搜尋引用（必須允許）** |
| `anthropic-ai`    | Anthropic    | Anthropic 通用                  |
| `PerplexityBot`   | Perplexity   | Perplexity 引用                 |
| `Google-Extended` | Google       | Gemini / AI Overviews           |
| `Bingbot`         | Microsoft    | Copilot（透過 Bing）            |
| `Amazonbot`       | Amazon       | Alexa / AWS AI                  |
| `Bytespider`      | ByteDance    | TikTok 系列 AI                  |
| `CCBot`           | Common Crawl | 開放資料（可選允許）            |

> **策略說明**：允許訓練爬蟲（如 ClaudeBot）可增加 AI 訓練資料中的品牌認知，雖然不直接控制引用，但有助於長期品牌識別。

### 8.3 需確認的規則

- 確認 `Claude-User` 是否已在 `generate-robots-txt.mjs` 的允許清單中
- 確認 `/ratewise/?` 的 Disallow 不影響幣對頁的 `?amount=` 參數索引（已確認正確）

---

## 9. sitemap.xml 規範

### 9.1 URL 計數規格

| 類別                         | 數量     | 備註                                                                                                                     |
| ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 核心內容頁                   | 8        | `/`, `/faq/`, `/about/`, `/guide/`, `/sell-rate-vs-mid-rate/`, `/cash-vs-spot-rate/`, `/card-rate-guide/`, `/open-data/` |
| 幣對頁 (外幣→TWD)            | 17       | `/usd-twd/` …                                                                                                            |
| 幣對頁 (TWD→外幣)            | 17       | `/twd-usd/` …                                                                                                            |
| 金額頁（外幣→TWD）           | ~102     | 每幣別約 6 個熱門金額                                                                                                    |
| 金額頁（TWD→外幣）           | ~102     | 每幣別約 6 個熱門金額                                                                                                    |
| **合計**                     | **~246** |                                                                                                                          |
| 排除：`/privacy/`（noindex） | 0        | 不入 sitemap                                                                                                             |
| 排除：所有 APP_ONLY_PATHS    | 0        | 不入 sitemap                                                                                                             |

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

| 測試檔案                     | 涵蓋面                                                  | 最低測試數 |
| ---------------------------- | ------------------------------------------------------- | ---------- |
| `seo-ssot.test.ts`           | SSOT 一致性、template-bleed、rate examples              | ≥ 40       |
| `seo-paths.test.ts`          | 路徑正規化、prerender 判斷                              | ≥ 20       |
| `seo-best-practices.test.ts` | LLMO/GEO 合規（llms.txt、robots.txt、sitemap、JSON-LD） | ≥ 30       |

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

- **索引覆蓋**：確認 ~246 個 SEO 頁面均已索引（排除 noindex 頁）
- **搜尋排名**：「日圓換台幣」「美元換台幣」等核心查詢在 Top 10
- **Core Web Vitals**：分頁類型的 LCP/INP/CLS 狀態
- **Rich Results**：FAQPage、BreadcrumbList rich snippets 是否正常顯示

---

## 13. 優先 TODO 清單

### 🔴 P0 — 立即（1 週內，直接影響 AI 引用率）

| #    | 任務                                                                                         | 影響              | 檔案                                |
| ---- | -------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------- |
| P0-1 | 修正 llms.txt 金額頁 URL 格式描述（`?amount=` → 路徑式說明）                                 | Bug 修正          | `scripts/generate-llms-txt.mjs`     |
| P0-2 | 在 llms.txt AI/LLM Access Control 區塊加入 `Claude-User`                                     | Claude 引用       | `scripts/generate-llms-txt.mjs`     |
| P0-3 | 確認 robots.txt 已明確 Allow `Claude-User`                                                   | Claude 引用       | `scripts/generate-robots-txt.mjs`   |
| P0-4 | 加入 `CurrencyConversionService` schema 至首頁 JSON-LD                                       | AI 引用 +30%      | `seo-metadata.ts` → `SEOHelmet.tsx` |
| P0-5 | 加入 `ExchangeRateSpecification` schema 至所有 34 幣對頁（從 `rating-snapshot.ts` 動態讀取） | AI 引用 +40%      | `CurrencyLandingPage.tsx`           |
| P0-6 | 在所有幣對頁與金額頁加入可見更新時間戳（`<time>` 元素 + `BUILD_TIME`）                       | Perplexity 新鮮度 | 頁面元件                            |

### 🟠 P1 — 短期（1 個月內，重大內容與 Schema 改善）

| #    | 任務                                                                                               | 影響         | 檔案                                      |
| ---- | -------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------- |
| P1-1 | 在所有 34 幣對頁頂部加入 Answer Capsule（40-60 字 answerCapsule 欄位）                             | AI 引用 +40% | `seo-metadata.ts` CURRENCY_PAGE_OVERRIDES |
| P1-2 | 將每個幣對頁的 FAQ 從 3-4 題擴展至 5-7 題（含旅遊場景、DCC 說明、趨勢圖使用）                      | 引用深度     | `seo-metadata.ts`                         |
| P1-3 | 在三篇 Authority Guide 頁加入 `Article` JSON-LD（含 author、dateModified）                         | AI 引用      | `seo-metadata.ts`                         |
| P1-4 | 在三篇 Authority Guide 頁頂部加入 Answer Capsule                                                   | AI 引用      | 頁面元件                                  |
| P1-5 | 加入匯率比較資訊（台銀賣出價 vs 中間價，含具體差距數字）至幣對頁                                   | E-E-A-T      | `seo-metadata.ts` SEO_RATE_EXAMPLES       |
| P1-6 | 在金額頁加入 `ExchangeRateSpecification`（含換算金額）                                             | AI 引用      | `AmountLandingPage.tsx`（若有獨立元件）   |
| P1-7 | 更新 `sitemap.xml` 生成腳本加入 `<changefreq>` 和 `<priority>`（若未有）                           | 爬蟲效率     | `generate-sitemap-2025.mjs`               |
| P1-8 | 擴充 `seo-best-practices.test.ts`：加入 CurrencyConversionService + ExchangeRateSpecification 測試 | 測試防護     | `seo-best-practices.test.ts`              |

### 🟡 P2 — 中期（2-3 個月，GEO 與外部存在感）

| #    | 任務                                                                                 | 影響             | 檔案              |
| ---- | ------------------------------------------------------------------------------------ | ---------------- | ----------------- |
| P2-1 | 三篇 Authority Guide 頁擴展至 3,000+ 字（強化 Claude 引用信號）                      | Claude 引用      | 頁面元件          |
| P2-2 | 在幣對頁加入匯率歷史趨勢圖（圖片 + alt 文字）→ Google AI Overviews 多媒體信號        | AI Overview 引用 | 頁面元件          |
| P2-3 | 申請加入 2-3 個台灣 Fintech 工具目錄（Claude 引用信號 68%）                          | Claude 引用      | 外部行動          |
| P2-4 | 在 r/taiwan、r/japantravel、r/korea 以真實貢獻身份分享工具（Perplexity Reddit 信號） | Perplexity 引用  | 外部行動          |
| P2-5 | 導入 Otterly AI 或 Peec AI 進行 AI 可見性監測                                        | 可見性量化       | 外部工具          |
| P2-6 | 在 `about/` 頁面加入 `Person` schema（作者 E-E-A-T）                                 | E-E-A-T          | `seo-metadata.ts` |
| P2-7 | 在 `open-data/` 頁面加入 `TechArticle` schema                                        | 開發者 SEO       | `seo-metadata.ts` |
| P2-8 | 為熱門幣別（JPY、USD、EUR）製作 60-90 秒解說短影片並嵌入頁面                         | 多媒體信號       | 外部行動          |

### 🟢 P3 — 長期（選配，重大架構變更）

| #    | 任務                                                   | 影響         | 備註                |
| ---- | ------------------------------------------------------ | ------------ | ------------------- |
| P3-1 | 英文版本 `/en/` 路由                                   | 國際 SEO     | 預估 4h，需翻譯全站 |
| P3-2 | 日文版本 `/ja/` 路由                                   | 日本用戶 SEO | 預估 4h，需日文翻譯 |
| P3-3 | `AggregateRating` schema（需建立評分收集機制）         | Gemini 引用  | 需先有評分系統      |
| P3-4 | 建立 FAQ 互動頁（讓 Google AI Overviews 更容易提取）   | AI Overview  | 需 UX 設計          |
| P3-5 | 程序化 SEO 擴展：增加更多金額頁（如每幣別 12+ 個金額） | 長尾流量     | 需評估爬蟲預算      |

---

## 14. 詞彙表

| 術語                          | 說明                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| **AEO**                       | Answer Engine Optimization — 針對 AI 問答引擎的最佳化                                 |
| **GEO**                       | Generative Engine Optimization — 針對生成式 AI 搜尋的最佳化                           |
| **LLMO**                      | Large Language Model Optimization — LLM 可讀性與引用率最佳化                          |
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

**最後更新**: 2026-03-23
**版本**: v1.0.0
**維護者**: Development Team
**下次審查日**: 2026-06-23（每季審查）
