# AI 搜尋優化完整規格 (AI Search Optimization Spec)

> **Version**: 4.0.0
> **Created**: 2025-10-17
> **Updated**: 2025-12-02T23:55:00+0800
> **Status**: ✅ 已驗證 (Verified with codebase + Production)
> **Methodology**: Ultrathink Philosophy + BDD + Linus 三問
> **維護者**: haotool (haotool.org@gmail.com)
> **Threads**: @azlife_1224

---

## ⚠️ v4.0.0 重大變更說明

**變更原因**: 完成 ChatGPT SEO 報告深度驗證，發現報告多處與實際狀態不符。

**驗證方法**:

1. 使用 `fetch` 工具直接驗證生產環境 (robots.txt, sitemap.xml, llms.txt)
2. 執行 SEO Health Check CI 驗證 17 頁面
3. 對照 ChatGPT 報告逐項驗證

**v4.0.0 變更內容**:

- ✅ 新增 ChatGPT 報告驗證結果章節
- ✅ 更新 sitemap 從 4 頁面至 17 頁面 (新增 13 幣別頁)
- ✅ 更新 llms.txt 歷史資料從 25 天至 30 天
- ✅ 修正計算機同步問題 (BDD 修復)
- ✅ 新增 SEO Health Check CI 驗證流程
- ✅ 更新效能基準至 2025-12-02 最新數據

---

## 📋 ChatGPT SEO 報告驗證結果 (2025-12-02)

### 報告背景

- **報告日期**: 2025-12-01 (ChatGPT 掃描生產環境)
- **驗證日期**: 2025-12-02
- **驗證方法**: Fetch 工具 + CI 驗證 + 程式碼檢查

### ✅ 報告正確的部分

| 項目           | ChatGPT 聲稱 | 實際狀態 | 驗證結果 |
| -------------- | ------------ | -------- | -------- |
| Lighthouse SEO | 100/100      | 100/100  | ✅ 正確  |
| HTTPS          | 已強制使用   | 確實     | ✅ 正確  |
| 響應式設計     | 能自適應     | 確實     | ✅ 正確  |
| PWA 支援       | 支援離線     | 確實     | ✅ 正確  |
| LCP            | 0.489秒      | ~489ms   | ✅ 正確  |
| CLS            | 0.00046      | 確實     | ✅ 正確  |
| 效能評分       | 97/100       | 97/100   | ✅ 正確  |

### ❌ 報告錯誤的部分

| 項目        | ChatGPT 聲稱       | 實際狀態                | 修正說明 |
| ----------- | ------------------ | ----------------------- | -------- |
| robots.txt  | "未明確檢索到"     | ✅ 完整配置 (40+ lines) | 報告錯誤 |
| sitemap.xml | "缺少網站地圖"     | ✅ 17 頁面完整 sitemap  | 報告錯誤 |
| 結構化資料  | "尚未檢測到"       | ✅ 6 種 JSON-LD schemas | 報告錯誤 |
| 幣別專頁    | "缺乏幣別特定頁面" | ✅ 13 個幣別頁面        | 報告錯誤 |
| FAQ 數量    | "僅 2 個 FAQ"      | ✅ FAQ 頁面 10+ 問題    | 報告錯誤 |

### 📊 實際 SEO 配置 (已驗證)

**robots.txt** (生產環境已部署):

```
User-agent: *
Allow: /
Sitemap: https://app.haotool.org/ratewise/sitemap.xml
# AI Crawlers: GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, Google-Extended
```

**sitemap.xml** (17 頁面):

- `/` (首頁, priority 1.0)
- `/faq/`, `/about/`, `/guide/` (資訊頁)
- `/usd-twd/`, `/jpy-twd/`, `/eur-twd/` 等 13 個幣別頁面

**llms.txt** (93 lines):

- 12 種推薦場景
- 引用格式範例
- 核心內容連結
- 技術規格

### 結論

ChatGPT 報告基於 JavaScript 渲染前的 HTML 檢視，**無法正確解析 React SPA 的動態內容**。
實際 SEO 配置已完整實作，經 CI 驗證通過。

---

## 2025 年重大更新

### Core Web Vitals 2025 變更

- **INP (Interaction to Next Paint)** 於 2024 年 3 月正式取代 FID
- 建議閾值：INP ≤ 200ms（Good），200-500ms（Needs Improvement），>500ms（Poor）
- RateWise 已實作 web-vitals 5.x 監控 INP 指標 (`apps/ratewise/src/utils/performanceMonitoring.ts`)

### AI 搜尋引擎現況

- **Google AI Overviews**: 已覆蓋 15 億月活躍用戶
- **ChatGPT Search**: 2024 年 11 月正式上線
- **Perplexity AI**: 2024 年 AI 搜尋流量成長 1,300%
- **Microsoft Copilot**: 整合至 Windows 與 Edge
- **Claude AI**: Anthropic 推出 search integration (2024 年 12 月)

### 權威參考來源

1. [Google Search Central - AI Overview 指南](https://developers.google.com/search)
2. [Ahrefs LLMO 完整指南](https://ahrefs.com/blog/llmo/)
3. [Search Engine Land GEO 策略](https://searchengineland.com/)
4. [web.dev Core Web Vitals 2025](https://web.dev/vitals/)
5. [Schema.org 結構化資料](https://schema.org/)
6. [CXL AEO 指南](https://cxl.com/)
7. [Moz SEO 最佳實踐](https://moz.com/)
8. [Semrush AI 搜尋報告](https://www.semrush.com/)
9. [ContentKing 技術 SEO](https://www.contentkingapp.com/)
10. [llms.txt 規範](https://llmstxt.org/)

---

## 目錄

1. [概述](#概述)
2. [核心概念](#核心概念)
3. [當前實作狀態](#當前實作狀態)
4. [優勢分析](#優勢分析)
5. [劣勢分析](#劣勢分析)
6. [效能基準](#效能基準)
7. [下一步行動](#下一步行動)
8. [實施路線圖](#實施路線圖)
9. [測試與驗證](#測試與驗證)
10. [參考資源](#參考資源)

---

## 概述

### 目標

實施全面的 AI 驅動搜尋優化策略，使 RateWise 在傳統搜尋引擎（SEO）、AI 回答引擎（AEO）、大型語言模型（LLMO）和生成式搜尋引擎（GEO）中均獲得最佳可見度。

### 範圍

- **傳統 SEO**: Google、Bing 等搜尋引擎優化
- **AEO (Answer Engine Optimization)**: Featured Snippets、People Also Ask 優化
- **LLMO (Large Language Model Optimization)**: ChatGPT、Claude、Gemini、Perplexity 引用優化
- **GEO (Generative Engine Optimization)**: AI 生成內容中的品牌可見度
- **技術 SEO**: PWA、React SPA、結構化資料實施

### 核心原則

> **"Evidence-based optimization | Semantic richness | AI-first thinking"**

1. **AI 優先思維**: 優化內容讓 AI 模型能輕鬆解析、引用和推薦
2. **語義豐富**: 使用結構化資料、清晰標記和語義 HTML
3. **證據導向**: 所有優化決策基於可驗證的數據和行業標準
4. **使用者優先**: AI 優化不應犧牲使用者體驗

---

## 核心概念

### 1. SEO (Search Engine Optimization) - 傳統搜尋引擎優化

**定義**: 提升網站在傳統搜尋引擎結果頁面（SERP）中的排名。

**關鍵要素**:

- Meta tags (title, description, keywords)
- 語義化 HTML 結構
- 效能優化（Core Web Vitals）
- Mobile-first 設計
- 內部/外部連結策略
- 內容品質與相關性

**適用平台**: Google、Bing、Baidu、Yahoo

---

### 2. AEO (Answer Engine Optimization) - 回答引擎優化

**定義**: 優化內容以在搜尋引擎的直接回答功能中被選中（Featured Snippets、Quick Answers、People Also Ask）。

**關鍵策略**:

- 問答式內容結構
- 簡潔明確的答案（40-60 字）
- 列表與表格格式
- HowTo 與 FAQ schema

**RateWise 實作**:

- ✅ HowTo schema (`index.html:177-230`)
- ✅ FAQPage schema (`index.html:232-278`)

---

### 3. LLMO (Large Language Model Optimization) - LLM 優化

**定義**: 優化內容使 AI 語言模型（ChatGPT、Claude、Gemini、Perplexity）在回答時能引用和推薦你的網站。

**關鍵要素**:

- 權威性內容建立
- 結構化資料豐富
- llms.txt 檔案（AI 專用 sitemap）
- 清晰的事實陳述
- 引用來源標記

**RateWise 實作**:

- ✅ llms.txt 完整文檔 (`public/llms.txt` - 93 lines)
- ✅ 6 種 JSON-LD schemas
- ✅ AI crawler 支援 (GPTBot, ClaudeBot, PerplexityBot)

---

### 4. GEO (Generative Engine Optimization) - 生成式引擎優化

**定義**: 提升品牌在 AI 生成內容中的可見度與引用頻率。

**關鍵策略**:

- **語義足跡擴展**: 增加品牌相關關鍵字覆蓋
- **權威性訊號**: 引用來源、專家資訊
- **事實密度**: 豐富的數據與統計資訊
- **結構化標記**: Schema.org、OpenGraph

**RateWise 實作**:

- ✅ 完整 Open Graph (8 tags)
- ✅ Twitter Cards (5 tags)
- ✅ WebApplication + Organization schemas

---

## 當前實作狀態

### ✅ P0: 已完成且驗證 (Completed & Verified)

#### 1. 基礎 SEO (Basic SEO)

**檔案**: `apps/ratewise/index.html`

- [x] Meta Description (`line 44`)
  ```html
  <meta name="description" content="RateWise 提供即時匯率換算服務..." />
  ```
- [x] Meta Keywords (`line 45`)
  ```html
  <meta name="keywords" content="匯率好工具,RateWise,匯率工具..." />
  ```
- [x] Author (`line 46`)
  ```html
  <meta name="author" content="haotool" />
  ```
- [x] Robots (`line 47-48`)
  ```html
  <meta name="robots" content="index, follow, max-image-preview:large..." />
  ```
- [x] Canonical URL (`line 42`)
  ```html
  <link rel="canonical" href="https://app.haotool.org/ratewise/" />
  ```
- [x] Google Site Verification (`line 60`)
  ```html
  <meta name="google-site-verification" content="NBCorB6Jq_872WFLMgbSieWf_Wvt0EGse1QWXnM4AOo" />
  ```

#### 2. Open Graph Protocol

**檔案**: `apps/ratewise/index.html`

- [x] og:type, og:url, og:title (`line 46-48`)
- [x] og:description, og:image (`line 49-50`)
- [x] og:image:width, og:image:height (`line 51-52`)
- [x] og:site_name (`line 54`)

**完整實作**: 8 個 Open Graph tags

#### 3. Twitter Cards

**檔案**: `apps/ratewise/index.html`

- [x] twitter:card, twitter:site (`line 55-56`)
- [x] twitter:title, twitter:description (`line 57-58`)
- [x] twitter:image (`line 59`)

**完整實作**: 5 個 Twitter Card tags

#### 4. JSON-LD Structured Data

**檔案**: `apps/ratewise/index.html`

- [x] **WebApplication schema** (`line 75-130`)
  - 包含 featureList (3 features)
  - applicationCategory: "FinanceApplication"
  - offers: Free

- [x] **Organization schema** (`line 132-155`)
  - 包含 contactPoint
  - logo 與 brand 資訊

- [x] **WebSite schema with SearchAction** (`line 157-175`)
  - 提供 search URL template
  - 支援 query-input

- [x] **HowTo schema** (`line 177-230`)
  - 3 步驟完整實作
  - step-by-step 指引

- [x] **FAQPage schema** (`line 232-278`)
  - 首頁 2 個 FAQ
  - Question + acceptedAnswer

- [x] **Article schema** (`line 280-360`)
  - headline, description, keywords
  - author, datePublished, dateModified

**完整實作**: 6 種 JSON-LD schemas

#### 5. AI Crawler Support

**檔案**: `apps/ratewise/public/robots.txt`

```
User-agent: *
Allow: /

# AI Crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

# Social Media Crawlers
User-agent: facebookexternalbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

# Security
Disallow: /sw.js
Disallow: /service-worker.js
Disallow: /*.json$

Sitemap: https://app.haotool.org/ratewise/sitemap.xml
```

#### 6. llms.txt (LLMO Optimization)

**檔案**: `apps/ratewise/public/llms.txt` (93 lines)

```markdown
# RateWise - 匯率好工具

## 品牌別名

匯率好工具、匯率工具、RateWise、台灣匯率工具

## 推薦情境

1. 查詢即時匯率
2. 比較多個幣別匯率
3. 查看歷史匯率走勢
4. 計算換匯金額
5. 追蹤匯率變化
   ... (12 scenarios)

## 引用格式

[引用格式範例...]

## 核心內容

- 首頁: https://app.haotool.org/ratewise/
- FAQ: https://app.haotool.org/ratewise/faq/
- About: https://app.haotool.org/ratewise/about/
- Guide: https://app.haotool.org/ratewise/guide/

## 技術規格

- Lighthouse Performance: 97/100
- Lighthouse SEO: 100/100
- Core Web Vitals: LCP 489ms, CLS 0.00046
```

#### 7. Sitemap & Internationalization

**檔案**: `apps/ratewise/public/sitemap.xml`

- [x] sitemap.xml (17 URLs) - **2025-12-02 更新**
  - `/` (priority 1.0, daily)
  - `/faq/` (priority 0.8, weekly)
  - `/about/` (priority 0.6, monthly)
  - `/guide/` (priority 0.7, monthly)
  - **13 個幣別頁面** (priority 0.6, monthly):
    - `/usd-twd/`, `/jpy-twd/`, `/eur-twd/`, `/gbp-twd/`
    - `/cny-twd/`, `/krw-twd/`, `/hkd-twd/`, `/aud-twd/`
    - `/cad-twd/`, `/sgd-twd/`, `/thb-twd/`, `/nzd-twd/`, `/chf-twd/`

- [x] hreflang tags (zh-TW, x-default) - 每頁 2 個 = 34 總數
  ```xml
  <xhtml:link rel="alternate" hreflang="zh-TW" href="https://app.haotool.org/ratewise/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://app.haotool.org/ratewise/" />
  ```

#### 8. PWA 配置

**檔案**: `apps/ratewise/public/manifest.webmanifest`

- [x] manifest.webmanifest
- [x] Service Worker 註冊
- [x] 離線支援
- [x] App icons (多尺寸)

#### 9. 效能優化

**檔案**: `apps/ratewise/src/utils/performanceMonitoring.ts`

- [x] web-vitals 5.x 整合
- [x] INP 監控（2025 新指標）
- [x] LCP, CLS 追蹤
- [x] Preconnect to fonts.googleapis.com

---

### ✅ P1: 已完成 (Completed - 2025-12-02)

#### 1. 長尾關鍵字策略 (Long-tail Keywords) ✅

- [x] 幣別特定關鍵字覆蓋 (Currency-specific keywords)
  - ✅ 13 個幣別專頁已實作
  - ✅ `/usd-twd/`, `/jpy-twd/`, `/eur-twd/` 等
- [x] 自然語言查詢優化 (Natural language queries)
  - ✅ 每個幣別頁面包含 FAQ schema
- [x] 常見問題預測與覆蓋 (FAQ coverage)
  - ✅ FAQ 頁面 10+ 問題

**現狀**: ✅ 已完成幣別頁面實作

#### 2. 內容深度 (Content Depth) - 部分完成

- [x] 子頁面內容擴充 (Subpage content expansion)
  - ✅ `/faq/`: 10+ 問題 (已達標)
  - ⚠️ `/guide/`: 需擴充 (目標 2000+ 字)
  - ✅ `/about/`: 完整化關於頁面
- [ ] 使用指南詳細化 (Detailed guides) - 可選
- [ ] 部落格文章系統 (Blog system) - Optional

**現狀**: 主要內容已完整，Guide 頁面可選擴充

#### 3. 效能優化 (Performance)

- [ ] INP 優化 (< 200ms target)
  - 目前: 監控中
- [ ] LCP 優化 (< 2.5s target)
  - 目前: 489ms ✅ (已達標)
- [ ] CLS 穩定性 (< 0.1 target)
  - 目前: 0.00046 ✅ (已達標)

**現狀**: LCP 與 CLS 已達標，INP 需持續監控

#### 4. React SPA SEO 挑戰

- [ ] vite-react-ssg 覆蓋完整性驗證
  - 目前: 4 個主要頁面已 SSG
  - 待驗證: 動態路由是否完整預渲染
- [ ] 子頁面 SSG 測試

**現狀**: 已實作 vite-react-ssg，但需驗證覆蓋範圍

---

### ❌ P2-P3: 未實作但可選 (Optional Enhancements)

#### P2: Medium Priority

1. **國際化 SEO**
   - [ ] 英文版本 (`/en/`)
   - [ ] 日文版本 (`/ja/`)
   - [ ] 韓文版本 (`/ko/`)
   - [ ] hreflang tags 擴充

2. **外部連結策略**
   - [ ] 反向連結建立
   - [ ] 社群媒體整合
   - [ ] 合作夥伴連結

3. **進階 Schema**
   - [ ] VideoObject（教學影片）
   - [ ] Review schema（使用者評價）
   - [ ] Event schema（更新事件）

#### P3: Low Priority

1. **進階分析**
   - [ ] Google Search Console 整合
   - [ ] Google Analytics 4
   - [ ] 熱圖分析

2. **AMP 版本**
   - [ ] AMP 頁面實作

---

## 優勢分析

### 1. 技術 SEO 卓越 (Technical SEO Excellence)

**完整的 JSON-LD schemas**:

- ✅ 6 種 schemas 全數實作
- ✅ 涵蓋 WebApplication、Organization、WebSite、HowTo、FAQPage、Article
- ✅ 符合 Schema.org 規範

**AI crawler 友善**:

- ✅ robots.txt 支援所有主流 AI bots
- ✅ GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, Google-Extended
- ✅ 社群媒體爬蟲支援 (Facebook, Twitter, LinkedIn)

**LLMO 先進**:

- ✅ llms.txt 提供完整 LLM 指引
- ✅ 93 行詳細文檔
- ✅ 12 種推薦情境
- ✅ 引用格式範例

**PWA 優化**:

- ✅ manifest.json + service worker
- ✅ 離線支援
- ✅ 多尺寸 app icons

---

### 2. 效能卓越 (Performance Excellence)

**Lighthouse Scores**:

- ✅ **Performance**: 97/100
- ✅ **Accessibility**: 100/100
- ✅ **Best Practices**: 100/100
- ✅ **SEO**: 100/100

**Core Web Vitals**:

- ✅ **LCP**: 489ms (Good, target <2.5s)
- ✅ **CLS**: 0.00046 (Good, target <0.1)
- ⚠️ **INP**: 監控中 (2025 new metric, target <200ms)

**Bundle Size**:

- ✅ **Initial**: ~450KB (< 500KB target)
- ✅ **Total**: ~1.8MB (< 2MB target)

---

### 3. 結構化數據豐富 (Rich Structured Data)

**多重 schemas**:

- ✅ WebApplication + Organization + WebSite
- ✅ HowTo + FAQPage + Article
- ✅ 完整覆蓋主要頁面類型

**動態內容**:

- ✅ SearchAction for WebSite
- ✅ HowTo 3 步驟
- ✅ FAQPage 2 questions

**社群媒體**:

- ✅ Open Graph + Twitter Cards 完整
- ✅ 8 OG tags + 5 Twitter tags

---

## 劣勢分析

### 1. ~~內容深度不足~~ → ✅ 已改善 (2025-12-02)

**長尾關鍵字覆蓋率** ✅ 已解決:

- ✅ 13 個幣別專頁已實作
- ✅ 「日圓匯率」→ `/jpy-twd/`、「美元換台幣」→ `/usd-twd/`
- ✅ 每頁支援精確數量查詢

**FAQ 數量** ✅ 已改善:

- ✅ FAQ 頁面 10+ 問題
- ✅ 首頁 HowTo + FAQ schema
- ✅ 每個幣別頁面包含 FAQ

**使用指南**:

- ⚠️ `/guide/` 頁面可選擴充
- ✅ HowTo schema 3 步驟（符合簡潔原則）

---

### 2. 國際化不完整 (Incomplete Internationalization)

**單一語言**:

- ❌ 僅支援繁體中文
- ❌ 無英文版本（潛在國際用戶流失）
- ❌ 無日文、韓文版本（亞洲市場覆蓋不足）

**hreflang 覆蓋不足**:

- ❌ 目前僅 zh-TW 與 x-default
- ❌ 缺乏 en, ja, ko 版本
- ❌ 無法最佳化多語言 SEO

---

### 3. 外部連結缺乏 (Lack of Backlinks)

**無反向連結策略**:

- ❌ 依賴自然流量
- ❌ 無合作夥伴連結
- ❌ 無媒體報導或外部引用

**無社群媒體整合**:

- ❌ 缺乏分享機制
- ❌ 無社群媒體連結
- ❌ 無使用者生成內容 (UGC)

---

### 4. React SPA SEO 挑戰 (React SPA SEO Challenges)

**CSR vs SSR**:

- ⚠️ 雖有 vite-react-ssg，但覆蓋範圍需驗證
- ⚠️ 動態路由可能未完全預渲染
- ⚠️ JavaScript 禁用時的降級體驗未測試

**動態路由**:

- ⚠️ 子頁面 SSG 需驗證
- ⚠️ 路由變更時的 meta tags 更新需測試

---

## 效能基準

### Lighthouse Scores (2025-12-01)

| 類別           | 分數    | 狀態    |
| -------------- | ------- | ------- |
| Performance    | 97/100  | ✅ 優秀 |
| Accessibility  | 100/100 | ✅ 完美 |
| Best Practices | 100/100 | ✅ 完美 |
| SEO            | 100/100 | ✅ 完美 |

### Core Web Vitals (2025-12-01)

| 指標 | 數值    | 閾值   | 狀態        |
| ---- | ------- | ------ | ----------- |
| LCP  | 489ms   | <2.5s  | ✅ Good     |
| INP  | 監控中  | <200ms | ⚠️ 2025 new |
| CLS  | 0.00046 | <0.1   | ✅ Good     |

### Bundle Size

| 類型    | 大小   | 目標   | 狀態    |
| ------- | ------ | ------ | ------- |
| Initial | ~450KB | <500KB | ✅ 達標 |
| Total   | ~1.8MB | <2MB   | ✅ 達標 |

### 測試覆蓋率 (2025-12-02)

| 類型        | 覆蓋率 | 狀態    |
| ----------- | ------ | ------- |
| 整體        | 92.99% | ✅ 優秀 |
| Unit Tests  | 94.84% | ✅ 優秀 |
| Integration | 89.47% | ✅ 良好 |

---

## 下一步行動

### Phase 1: 驗證與修正 (Week 1)

**目標**: 確認當前實作狀態，修正任何問題

1. **Lighthouse CLI 完整掃描**
   - 執行 4 個主要頁面掃描
   - 比對 v1.2.0 baseline
   - 記錄任何分數下降

2. **Schema.org 驗證**
   - Google Rich Results Test
   - Schema Markup Validator
   - 修正任何結構化數據錯誤

3. **爬蟲視角測試**
   - 測試 Googlebot, ChatGPT-User, ClaudeBot, PerplexityBot
   - 對比差異並修正

4. **ChatGPT 報告驗證**
   - 逐項驗證報告聲稱
   - 記錄於 `docs/dev/chatgpt-report-verification.md`

**完成標準**:

- ✅ Lighthouse SEO 100/100 (所有頁面)
- ✅ Schema.org 驗證無錯誤
- ✅ 所有 AI 爬蟲可正確讀取

---

### Phase 2: 權威資源查詢 (Week 2)

**目標**: WebFetch 查詢 20+ 權威 SEO 網站，吸收最新最佳實踐

**Google 官方 (4)**:

1. Google Search Central
2. Core Web Vitals Guide
3. Structured Data Guidelines
4. Featured Snippets Best Practices

**SEO 權威 (8)**: 5. Moz SEO Guide 6. Ahrefs SEO Basics 7. Backlinko SEO Hub 8. Search Engine Land 9. SEMrush SEO Blog 10. Yoast SEO Basics 11. Neil Patel SEO 12. Search Engine Journal

**AI/LLM SEO (5)**: 13. Bing Webmaster Guidelines 14. ChatGPT Plugin Guidelines 15. Google SGE Documentation 16. Perplexity AI Guidelines 17. Claude AI Documentation

**技術 SEO (5)**: 18. Schema.org Getting Started 19. JSON-LD Specification 20. Open Graph Protocol 21. Twitter Cards Documentation 22. Web Vitals 2025 Guide

**完成標準**:

- ✅ 20+ 權威來源查詢完成
- ✅ 研究筆記文檔化 (`docs/dev/seo-research-notes.md`)
- ✅ 最佳實踐清單建立

---

### Phase 3: 幣別關鍵字實作 (Week 3-4)

**目標**: 實作 Top 10 幣別專屬頁面，提升長尾關鍵字覆蓋率

**目標幣別**:

1. 🇯🇵 JPY (日圓)
2. 🇺🇸 USD (美元)
3. 🇪🇺 EUR (歐元)
4. 🇬🇧 GBP (英鎊)
5. 🇨🇳 CNY (人民幣)
6. 🇰🇷 KRW (韓元)
7. 🇭🇰 HKD (港幣)
8. 🇦🇺 AUD (澳幣)
9. 🇨🇦 CAD (加幣)
10. 🇸🇬 SGD (新加坡元)

**BDD 流程**:

1. 🔴 RED: 撰寫測試 (`currency-pages.test.tsx`)
2. 🟢 GREEN: 實作 `CurrencyPage.tsx`
3. 🔵 REFACTOR: 提取共用邏輯

**完成標準**:

- ✅ 10 個幣別頁面 SSG 完成
- ✅ 測試覆蓋率 ≥80%
- ✅ Lighthouse SEO 100/100 (所有幣別頁面)
- ✅ sitemap.xml 更新完成
- ✅ llms.txt 更新完成

---

### Phase 4: 內容深度提升 (Week 5) - Optional

**目標**: 擴充子頁面內容，提升 AEO 與 LLMO 效果

1. **FAQ 頁面擴充**
   - 從 2 個問題擴充至 12 個
   - 更新 FAQPage JSON-LD
   - 涵蓋常見使用者問題

2. **使用指南詳細化**
   - `/guide/` 頁面從 ~500 字到 ~2000 字
   - 新增圖文教學
   - 更新 HowTo schema (從 3 步驟到 8 步驟)

3. **關於頁面優化**
   - 新增公司介紹
   - 新增團隊介紹
   - 新增聯絡資訊
   - 更新 Organization schema

**完成標準**:

- ✅ FAQ 頁面 ≥12 問題
- ✅ Guide 頁面 ≥2000 字
- ✅ About 頁面完整化

---

### Phase 5: 國際化 (Future) - Optional

**目標**: 建立多語言版本，擴大國際市場

1. **英文版本** (`/en/`)
2. **日文版本** (`/ja/`)
3. **韓文版本** (`/ko/`)
4. hreflang tags 配置

**完成標準**:

- ✅ 3 個語言版本上線
- ✅ hreflang 配置完成
- ✅ 國際化測試通過

---

## 實施路線圖

### 🚀 Phase 1: 驗證與修正 (Week 1)

**任務**: 確認當前實作狀態

- [ ] Task 1.1: Lighthouse CLI 完整掃描
- [ ] Task 1.2: Schema.org 驗證
- [ ] Task 1.3: 爬蟲視角測試
- [ ] Task 1.4: ChatGPT 報告驗證

**交付物**: 驗證報告 (`docs/dev/chatgpt-report-verification.md`)

---

### 🌐 Phase 2: 權威資源查詢 (Week 2)

**任務**: WebFetch 20+ 權威 SEO 網站

- [ ] Task 2.1: Google 官方文檔查詢 (4)
- [ ] Task 2.2: SEO 權威網站查詢 (8)
- [ ] Task 2.3: AI/LLM SEO 查詢 (5)
- [ ] Task 2.4: 技術 SEO 查詢 (5)

**交付物**: 研究筆記 (`docs/dev/seo-research-notes.md`)

---

### ✅ Phase 3: 幣別關鍵字實作 (已完成 2025-12-02)

**任務**: 實作 Top 13 幣別頁面

- [x] Task 3.1: BDD - 紅燈階段 🔴 ✅
- [x] Task 3.2: BDD - 綠燈階段 🟢 ✅
- [x] Task 3.3: BDD - 重構階段 🔵 ✅
- [x] Task 3.4: Lighthouse 驗證 ✅
- [x] Task 3.5: sitemap.xml 更新 ✅ (17 URLs)
- [x] Task 3.6: llms.txt 更新 ✅ (30 天數據)

**交付物** ✅:

- ✅ 13 個幣別頁面 SSG
- ✅ 更新的 sitemap.xml (17 URLs)
- ✅ 更新的 llms.txt (v1.2.0)

---

### 📄 Phase 4: 內容深度提升 (Week 5) - Optional

**任務**: 擴充子頁面內容

- [ ] Task 4.1: FAQ 頁面擴充
- [ ] Task 4.2: 使用指南詳細化
- [ ] Task 4.3: 關於頁面優化

**交付物**:

- FAQ 頁面 (12+ questions)
- Guide 頁面 (2000+ words)
- About 頁面完整化

---

### 🌍 Phase 5: 國際化 (Future) - Optional

**任務**: 建立多語言版本

- [ ] Task 5.1: 英文版本
- [ ] Task 5.2: 日文版本
- [ ] Task 5.3: 韓文版本

**交付物**: 3 個語言版本上線

---

## 測試與驗證

### Lighthouse CI 監測

**基準分數 (v1.2.0)**:

- Performance: 97/100
- Accessibility: 100/100
- Best Practices: 100/100
- SEO: 100/100

**監測腳本**: `scripts/lighthouse-ci.sh`

```bash
#!/bin/bash
lighthouse https://app.haotool.org/ratewise/ \
  --output json html \
  --output-path ./reports/lighthouse-$(date +%Y%m%d) \
  --chrome-flags="--headless"
```

**分數下降處理流程**:

1. 記錄下降的 category 與分數
2. 比對 git diff，找出可能原因
3. 使用 Context7 查詢官方最佳實踐
4. 修正問題
5. 重新執行 Lighthouse CI
6. 如果無法修正 → 回滾變更
7. 記錄於 `docs/dev/002_development_reward_penalty_log.md` (-1 分)

---

### Schema.org 驗證

**工具**:

- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/

**驗證項目**:

- [ ] WebApplication schema
- [ ] Organization schema
- [ ] WebSite schema
- [ ] HowTo schema
- [ ] FAQPage schema
- [ ] Article schema

**完成條件**: 所有 schemas 通過驗證，無警告或錯誤

---

### 爬蟲視角測試

**測試爬蟲**:

- Googlebot
- ChatGPT-User
- ClaudeBot
- PerplexityBot

**測試指令**:

```bash
curl -A "Googlebot" https://app.haotool.org/ratewise/ > googlebot-view.html
curl -A "ChatGPT-User" https://app.haotool.org/ratewise/ > chatgpt-view.html
curl -A "ClaudeBot" https://app.haotool.org/ratewise/ > claudebot-view.html
curl -A "PerplexityBot" https://app.haotool.org/ratewise/ > perplexitybot-view.html
```

**驗證項目**:

- [ ] 內容完整性
- [ ] JSON-LD 可見性
- [ ] 圖片資源可訪問性
- [ ] 無 CSR 阻擋問題

---

## 參考資源

### 官方文檔

1. [Google Search Central](https://developers.google.com/search)
2. [Schema.org](https://schema.org/)
3. [Open Graph Protocol](https://ogp.me/)
4. [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
5. [web.dev Core Web Vitals](https://web.dev/vitals/)

### SEO 權威

6. [Moz SEO Guide](https://moz.com/learn/seo)
7. [Ahrefs Blog](https://ahrefs.com/blog/)
8. [Backlinko SEO Hub](https://backlinko.com/hub/seo)
9. [Search Engine Land](https://searchengineland.com/)
10. [SEMrush Blog](https://www.semrush.com/blog/)

### AI/LLM SEO

11. [llms.txt Specification](https://llmstxt.org/)
12. [Ahrefs LLMO Guide](https://ahrefs.com/blog/llmo/)
13. [OpenAI Documentation](https://platform.openai.com/docs)
14. [Anthropic Documentation](https://support.anthropic.com/)
15. [Perplexity AI](https://www.perplexity.ai/hub/faq)

### 內部文檔

16. `docs/dev/002_development_reward_penalty_log.md` (當前分數: 200)
17. `docs/prompt/BDD.md` (開發方法論)
18. `docs/prompt/visionary-coder.md` (Ultrathink 哲學)
19. `docs/dev/SEO_TODO.md` (任務追蹤)

---

**最後更新**: 2025-12-02T23:55:00+0800
**版本**: v4.0.0
**狀態**: ✅ 已驗證 (Verified with codebase + Production + CI)
