# AI 搜尋優化完整規格 (AI Search Optimization Spec)

> **Version**: 1.1.0
> **Created**: 2025-10-17
> **Status**: 🔄 進行中 (Phase 1 shipped 2025-10-30)
> **維護者**: Development Team

---

## 目錄

1. [概述](#概述)
2. [核心概念](#核心概念)
3. [技術架構](#技術架構)
4. [實施策略](#實施策略)
5. [當前專案差距分析](#當前專案差距分析)
6. [實施路線圖](#實施路線圖)
7. [測試與驗證](#測試與驗證)
8. [參考資源](#參考資源)

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

- Meta tags (title, description)
- 語義化 HTML 結構
- 效能優化（Core Web Vitals）
- Mobile-first 設計
- 內部/外部連結策略
- 內容品質與相關性

**適用平台**: Google、Bing、Baidu、Yahoo

---

### 2. AEO (Answer Engine Optimization) - 回答引擎優化

**定義**: 優化內容以在搜尋引擎的直接回答功能中被選中（Featured Snippets、Quick Answers、People Also Ask）。

**核心策略**:

- **簡潔直接的回答**: 在內容前 100-200 字提供核心答案
- **問答格式**: 使用 H2/H3 標題作為問題，後接簡潔答案（40-50 字）
- **結構化內容**: 列表、表格、步驟式說明
- **Schema Markup**: FAQPage、HowTo、QAPage

**適用場景**:

- "如何計算匯率？"
- "什麼是買入價和賣出價？"
- "TWD 兌換 USD 匯率是多少？"

**關鍵差異**:

- SEO 目標: 點擊率 (CTR)
- AEO 目標: 直接回答可見度

---

### 3. LLMO (Large Language Model Optimization) - 大型語言模型優化

**定義**: 優化品牌和內容使其在 AI 對話助手（ChatGPT、Claude、Gemini、Perplexity）生成的回答中被引用、提及或推薦。

**核心策略**:

- **權威性建立**: 在高權威網站上建立品牌提及
- **資訊增益 (Information Gain)**: 提供獨特、深入、第一手的內容
- **語義清晰**: 使用清晰、明確的語言，避免模糊表達
- **上下文豐富**: 提供完整的背景資訊和相關概念連結

**適用平台**: ChatGPT Search、Claude、Gemini、Perplexity AI、Microsoft Copilot

**市場影響** (2025):

- Google AI Overviews: 15 億月活躍用戶
- AI 搜尋推薦流量: 2024 假期季節成長 1,300%

**關鍵差異**:

- SEO 目標: 排名與點擊
- LLMO 目標: 引用、提及、推薦

---

### 4. GEO (Generative Engine Optimization) - 生成式引擎優化

**定義**: 優化內容以在 AI 生成的搜尋結果和對話式回答中獲得可見度，讓 AI 引擎能夠信任、提取和展示您的內容。

**核心策略**:

- **擴展語義足跡**: 使用同義詞、相關術語、概念連結
- **提高事實密度**: 每段落包含更多可驗證的事實和數據
- **增強結構化資料**: Schema.org、商家資料、實體數據集
- **信任信號**: HTTPS、作者署名、引用來源、版權聲明

**技術信號**:

- Schema.org 的 `license` 屬性
- C2PA manifests（內容真實性）
- 網站速度、行動優化
- 結構化資料驗證（Google Rich Results Test）

**影響數據**:

- 有 Schema Markup 的內容: Rich Snippets 出現率提升 30%
- 結構化資料: 點擊率提升 30%（BrightEdge 研究）

**GEO 三大支柱**:

1. **語義足跡擴展**: 同義詞、相關概念、術語變體
2. **事實密度提升**: 可驗證數據、統計資料、引用來源
3. **結構化資料增強**: Schema、實體標記、關係定義

---

## 技術架構

### 1. React SPA SEO 挑戰與解決方案

**挑戰**:

- ❌ AI 爬蟲不執行 JavaScript
- ❌ 內容需要客戶端渲染才能顯示
- ❌ Meta tags 無法動態更新（對傳統爬蟲）

**解決方案**:

#### A. 靜態內容優先

```html
<!-- ✅ 在 index.html 中包含核心內容 -->
<div id="root">
  <noscript>
    <h1>RateWise - 即時匯率轉換器</h1>
    <p>快速、準確的匯率換算工具，支援 TWD、USD、JPY、EUR 等多種貨幣...</p>
  </noscript>
</div>
```

#### B. 預渲染 (Pre-rendering)

```typescript
// 使用 vite-plugin-prerender 或 vite-plugin-ssr
import { prerender } from 'vite-plugin-prerender';

export default defineConfig({
  plugins: [
    prerender({
      routes: ['/', '/about', '/faq'],
      renderer: 'jsdom',
    }),
  ],
});
```

#### C. SSR/SSG 升級路徑

- **選項 1**: 遷移至 Next.js（推薦用於複雜應用）
- **選項 2**: 使用 Vite SSR（輕量級 SSR）
- **選項 3**: 靜態站點生成器（Astro、Gatsby）

---

### 2. Meta Tags 架構

#### A. 基礎 SEO Meta Tags

```html
<head>
  <!-- 基礎 Meta -->
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary Meta Tags -->
  <title>RateWise - 即時匯率轉換器 | 支援 TWD、USD、JPY、EUR 等多幣別換算</title>
  <meta name="title" content="RateWise - 即時匯率轉換器 | 多幣別匯率查詢工具" />
  <meta
    name="description"
    content="RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP 等 30+ 種貨幣。快速、準確、離線可用的 PWA 匯率工具。"
  />
  <meta
    name="keywords"
    content="匯率, 匯率換算, 即時匯率, 台幣匯率, TWD, USD, 外幣兌換, 匯率查詢, 臺灣銀行匯率"
  />
  <meta name="author" content="RateWise Team" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://app.haotool.org/ratewise" />

  <!-- Language & Locale -->
  <meta http-equiv="content-language" content="zh-TW" />
  <meta name="language" content="Traditional Chinese" />
</head>
```

#### B. Open Graph (Facebook, LinkedIn)

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://app.haotool.org/ratewise" />
<meta property="og:title" content="RateWise - 即時匯率轉換器" />
<meta
  property="og:description"
  content="快速、準確的匯率換算工具，支援 30+ 種貨幣，參考臺灣銀行牌告匯率。"
/>
<meta property="og:image" content="https://app.haotool.org/ratewise/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="RateWise 匯率轉換器應用截圖" />
<meta property="og:locale" content="zh_TW" />
<meta property="og:site_name" content="RateWise" />
```

**圖片規格**:

- 尺寸: 1200×630 px（Facebook 推薦）
- 格式: PNG 或 JPG
- 大小: <8 MB
- 比例: 1.91:1

#### C. Twitter Card

```html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://app.haotool.org/ratewise" />
<meta name="twitter:title" content="RateWise - 即時匯率轉換器" />
<meta name="twitter:description" content="快速、準確的匯率換算工具，支援 30+ 種貨幣" />
<meta name="twitter:image" content="https://app.haotool.org/ratewise/twitter-image.png" />
<meta name="twitter:image:alt" content="RateWise 匯率轉換器" />
<meta name="twitter:creator" content="@ratewise" />
```

**Fallback 行為**:

- 若 `twitter:title` 缺失 → 使用 `og:title`
- 若 `twitter:description` 缺失 → 使用 `og:description`
- 圖片可共用 Open Graph 圖片（1200×630）

#### D. PWA Meta Tags

```html
<!-- PWA Meta Tags -->
<meta name="theme-color" content="#8B5CF6" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="RateWise" />
<link rel="manifest" href="%VITE_BASE_PATH%manifest.webmanifest" />
<link rel="apple-touch-icon" href="%VITE_BASE_PATH%apple-touch-icon.png" />
```

> **Zeabur Subpath 注意事項**
> 生產環境部署於 `https://app.haotool.org/ratewise`，必須設定 `VITE_BASE_PATH=/ratewise/` 並在釋出流程執行 `node scripts/update-release-metadata.js` 鏡像靜態資產 (`robots.txt`、`sitemap.xml`、`llms.txt`、`manifest.webmanifest`、favicon、screenshots)。
>
> **PWA Manifest 路徑處理**：`vite.config.ts` 會自動將 manifest 的 `scope`/`start_url`/`id` 移除尾斜線（`/ratewise`），以避免與 nginx 的 301 重定向（`/ratewise/` → `/ratewise`）衝突。
>
> 部署後使用 `curl -I https://app.haotool.org/ratewise/{robots.txt,sitemap.xml,manifest.webmanifest,favicon.ico,llms.txt}` 確認 200，並在 `nginx.conf` 為上述 `/ratewise/*` 靜態檔加上對應 `location` 以避免 SPA fallback。

---

### 3. 結構化資料 (Structured Data / Schema.org)

#### A. 為什麼需要結構化資料？

**對 AI 的價值**:

- ✅ 幫助 LLM 可靠提取資訊
- ✅ 提供清晰的資料結構和關係
- ✅ 增加被引用和推薦的機率

**對傳統搜尋的價值**:

- ✅ Rich Snippets 顯示率提升 30%
- ✅ 點擊率提升 30%
- ✅ Featured Snippet 機會增加

**格式選擇**:

- **JSON-LD** ✅ (推薦) - Google 明確偏好，易於維護
- Microdata ❌ (不推薦) - 與 HTML 混合，難以維護
- RDFa ❌ (不推薦) - 複雜度高

#### B. React 實施方案

**方案 1: react-schemaorg (Google 官方)**

```bash
pnpm add react-schemaorg schema-dts
```

```tsx
import { JsonLd } from 'react-schemaorg';
import { WebApplication } from 'schema-dts';

function App() {
  return (
    <>
      <JsonLd<WebApplication>
        item={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'RateWise',
          description: '即時匯率轉換器，支援多種貨幣換算',
          url: 'https://app.haotool.org/ratewise',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'All',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        }}
      />
      {/* 應用內容 */}
    </>
  );
}
```

**方案 2: 手動實施**

```tsx
function StructuredData({ data }: { data: Record<string, any> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

// 使用
<StructuredData
  data={{
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    // ...
  }}
/>;
```

#### C. RateWise 適用的 Schema Types

**1. WebApplication (應用程式本身)**

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "RateWise",
  "alternateName": "匯率好工具",
  "description": "即時匯率轉換器，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR 等 30+ 種貨幣換算",
  "url": "https://app.haotool.org/ratewise",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any",
  "browserRequirements": "Requires JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "即時匯率查詢",
    "單幣別換算",
    "多幣別同時換算",
    "歷史匯率趨勢",
    "離線使用",
    "PWA 支援"
  ],
  "screenshot": "https://app.haotool.org/ratewise/screenshots/desktop-converter.png",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250",
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

**2. FAQPage (常見問題)**

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "RateWise 的匯率資料來源是什麼？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "RateWise 的匯率資料參考臺灣銀行牌告匯率，每天更新，提供準確可靠的外幣兌換參考。"
      }
    },
    {
      "@type": "Question",
      "name": "如何計算匯率換算？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "匯率換算公式：目標貨幣金額 = 原始貨幣金額 × 匯率。例如：1000 TWD × 0.0324 = 32.4 USD。RateWise 自動計算，無需手動換算。"
      }
    },
    {
      "@type": "Question",
      "name": "買入價和賣出價有什麼差別？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "買入價是銀行向您買入外幣的價格（您賣給銀行），賣出價是銀行賣給您外幣的價格（您向銀行買）。兩者差距稱為「價差」，是銀行的利潤。"
      }
    },
    {
      "@type": "Question",
      "name": "RateWise 支援哪些貨幣？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "RateWise 支援 30+ 種主要貨幣，包括 TWD（台幣）、USD（美元）、JPY（日圓）、EUR（歐元）、GBP（英鎊）、CNY（人民幣）、HKD（港幣）、KRW（韓元）、AUD（澳幣）等。"
      }
    }
  ]
}
```

**3. HowTo (操作指南)**

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "如何使用 RateWise 進行匯率換算",
  "description": "快速學會使用 RateWise 進行單幣別和多幣別匯率換算",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "選擇原始貨幣",
      "text": "在「從」欄位選擇您要兌換的貨幣（例如：TWD）"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "選擇目標貨幣",
      "text": "在「到」欄位選擇您要兌換成的貨幣（例如：USD）"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "輸入金額",
      "text": "在原始貨幣欄位輸入金額，系統會自動計算並顯示目標貨幣金額"
    }
  ],
  "totalTime": "PT30S"
}
```

**4. Organization (組織資訊)**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "RateWise",
  "url": "https://app.haotool.org/ratewise",
  "logo": "https://app.haotool.org/ratewise/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "email": "haotool.org@gmail.com"
  },
  "sameAs": ["https://www.threads.net/@azlife_1224", "https://github.com/haotool/app"]
}
```

**5. BreadcrumbList (麵包屑導航)**

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首頁",
      "item": "https://app.haotool.org/ratewise"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "匯率換算",
      "item": "https://app.haotool.org/ratewise/converter"
    }
  ]
}
```

#### D. Schema 驗證工具

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Google Search Console**: 監控結構化資料錯誤

---

### 4. 內容優化策略

#### A. AEO 內容架構

**問答式內容結構**:

```markdown
## 如何計算匯率？

**簡答**（40-50 字）:
匯率換算公式為：目標金額 = 原始金額 × 匯率。例如 1000 TWD × 0.0324 = 32.4 USD。

**詳細說明**:
匯率是兩種貨幣之間的兌換比率...（展開說明）

### 計算範例

1. 確認當前匯率
2. 輸入原始金額
3. 乘以匯率得到結果
```

**Featured Snippet 優化要點**:

- ✅ 在前 100-200 字回答問題
- ✅ 使用列表、表格、步驟
- ✅ 簡潔明瞭（40-50 字核心答案）
- ✅ H2/H3 標題即為問題

#### B. LLMO 內容增強

**資訊增益 (Information Gain)**:

```markdown
<!-- ❌ 一般內容 -->

RateWise 是一個匯率換算工具。

<!-- ✅ 資訊增益內容 -->

RateWise 是一個即時匯率換算 PWA 應用，參考臺灣銀行牌告匯率，
支援 30+ 種貨幣（包括 TWD、USD、JPY、EUR），提供以下獨特功能：

- 單幣別與多幣別同時換算
- 7 天歷史匯率趨勢圖（使用 lightweight-charts）
- 離線可用（Service Worker + IndexedDB）
- 每 5 分鐘自動更新匯率
- 平均響應時間 <100ms
```

**權威性建立**:

- 引用官方來源（臺灣銀行）
- 提供數據支持（更新頻率、支援貨幣數）
- 技術細節（使用的技術棧）
- 效能指標（響應時間）

#### C. GEO 語義優化

**語義足跡擴展**:

```markdown
<!-- 使用同義詞和相關術語 -->

匯率 = 外幣兌換率 = 匯兌比率 = Exchange Rate
換算 = 轉換 = 兌換 = Conversion
台幣 = TWD = 新台幣 = 臺灣元
美元 = USD = 美金 = US Dollar
```

**實體標記**:

```html
<span itemscope itemtype="https://schema.org/MonetaryAmount">
  <span itemprop="value">1000</span>
  <span itemprop="currency">TWD</span>
</span>
```

---

### 5. 技術 SEO 要求

#### A. Core Web Vitals 目標

| 指標                            | 目標   | 當前狀態 | 優先級 |
| ------------------------------- | ------ | -------- | ------ |
| LCP (Largest Contentful Paint)  | <2.5s  | 待測     | 🔴 P0  |
| FID (First Input Delay)         | <100ms | 待測     | 🔴 P0  |
| CLS (Cumulative Layout Shift)   | <0.1   | 待測     | 🔴 P0  |
| INP (Interaction to Next Paint) | <200ms | 待測     | 🟡 P1  |
| TTFB (Time to First Byte)       | <800ms | 待測     | 🟡 P1  |

**INP 2025 新指標**:

- INP 已取代 FID 成為 Core Web Vitals 的決定性指標
- 測量整體互動性，而非僅首次輸入延遲

#### B. PWA SEO 優化

**manifest.webmanifest 優化**:

```json
{
  "name": "RateWise - 即時匯率轉換器",
  "short_name": "RateWise",
  "description": "快速、準確的即時匯率轉換工具，支援 30+ 種貨幣與歷史匯率查詢，參考臺灣銀行牌告匯率",
  "theme_color": "#8B5CF6",
  "background_color": "#E8ECF4",
  "display": "standalone",
  "start_url": "/?utm_source=pwa",
  "scope": "/",
  "orientation": "portrait-primary",
  "categories": ["finance", "utilities", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

**SEO 友善的 Service Worker**:

```typescript
// sw.js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 允許搜尋引擎爬蟲訪問
  if (event.request.headers.get('User-Agent')?.includes('Googlebot')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 其他請求使用快取策略
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
```

#### C. robots.txt 與 sitemap.xml

**robots.txt**:

```txt
# RateWise robots.txt
User-agent: *
Allow: /

# AI 爬蟲
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# 排除資源檔案
Disallow: /assets/
Disallow: /node_modules/

# Sitemap
Sitemap: https://app.haotool.org/ratewise/sitemap.xml
```

**sitemap.xml**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://app.haotool.org/ratewise</loc>
    <lastmod>2025-10-17</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://app.haotool.org/ratewise/about</loc>
    <lastmod>2025-10-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://app.haotool.org/ratewise/faq</loc>
    <lastmod>2025-10-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

---

## 當前專案差距分析

### ✅ 已實施

1. **基礎 Meta Tags**
   - ✅ charset, viewport
   - ✅ description (簡單版)
   - ✅ theme-color

2. **PWA 配置**
   - ✅ manifest.webmanifest
   - ✅ Service Worker 註冊
   - ✅ 離線支援
   - ✅ App icons (多尺寸)

3. **效能優化**
   - ✅ Preconnect to fonts.googleapis.com
   - ✅ React 19 (最新版)
   - ✅ Vite 建置優化

4. **技術架構**
   - ✅ TypeScript
   - ✅ React Router
   - ✅ Error Boundary
   - ✅ PWA 更新提示

### ❌ 缺少的關鍵元素

#### 🔴 P0 (Critical - 立即實施)

1. **Open Graph Tags** (社交媒體分享)
   - ❌ og:type, og:url, og:title
   - ❌ og:description, og:image
   - ❌ og:locale, og:site_name

2. **Twitter Card Tags**
   - ❌ twitter:card
   - ❌ twitter:title, twitter:description
   - ❌ twitter:image

3. **結構化資料 (JSON-LD)**
   - ❌ WebApplication schema
   - ❌ FAQPage schema
   - ❌ Organization schema

4. **基礎 SEO Meta**
   - ❌ keywords
   - ❌ author
   - ❌ robots
   - ❌ canonical link
   - ❌ language meta

5. **React SEO 基礎設施**
   - ❌ react-helmet-async（動態 meta tags）
   - ❌ react-schemaorg（結構化資料）

#### 🟡 P1 (High Priority - 1-2 週內)

1. **內容優化**
   - ❌ FAQ 頁面（AEO 優化）
   - ❌ 操作指南（HowTo schema）
   - ❌ 關於頁面（組織資訊）

2. **圖片資源**
   - ❌ OG Image (1200×630)
   - ❌ Twitter Image
   - ❌ App screenshots

3. **SEO 工具檔案**
   - ❌ robots.txt
   - ❌ sitemap.xml
   - ❌ security.txt

4. **SSR/預渲染**
   - ❌ 預渲染關鍵頁面
   - ❌ 或考慮 SSR 方案

#### 🟢 P2 (Medium Priority - 1 個月內)

1. **LLMO 優化**
   - ❌ 權威性內容建立
   - ❌ 資訊增益內容
   - ❌ 第一手經驗分享

2. **AEO 內容**
   - ❌ Featured Snippet 優化
   - ❌ People Also Ask 內容
   - ❌ 問答式內容結構

3. **GEO 增強**
   - ❌ 語義足跡擴展
   - ❌ 事實密度提升
   - ❌ 引用來源標記

4. **技術 SEO**
   - ❌ Core Web Vitals 測試
   - ❌ Lighthouse 分數優化
   - ❌ 行動友善測試

#### 🔵 P3 (Low Priority - 未來考慮)

1. **進階 Schema**
   - ❌ VideoObject（教學影片）
   - ❌ Review schema（使用者評價）
   - ❌ Event schema（更新事件）

2. **國際化 SEO**
   - ❌ hreflang tags（多語言）
   - ❌ 地區性內容
   - ❌ 貨幣本地化

3. **進階分析**
   - ❌ Google Search Console 整合
   - ❌ Google Analytics 4
   - ❌ 熱圖分析

---

## 實施路線圖

### Phase 1: 基礎 SEO 架構 (Week 1-2) 🔴 P0

**目標**: 建立基本 SEO 基礎設施

**任務清單**:

1. **安裝必要套件** (Day 1)

   ```bash
   pnpm add react-helmet-async
   pnpm add react-schemaorg schema-dts
   pnpm add -D @types/react-helmet-async
   ```

2. **實施 SEO Component** (Day 1-2)
   - [ ] 建立 `<SEOHead>` 元件
   - [ ] 整合 react-helmet-async
   - [ ] 實施基礎 meta tags
   - [ ] 實施 Open Graph tags
   - [ ] 實施 Twitter Card tags

3. **實施結構化資料** (Day 3-4)
   - [ ] WebApplication schema
   - [ ] Organization schema
   - [ ] FAQPage schema
   - [ ] BreadcrumbList schema

4. **建立圖片資源** (Day 4-5)
   - [ ] 設計 OG Image (1200×630)
   - [ ] 設計 Twitter Image
   - [ ] 優化現有 app icons
   - [ ] 建立 screenshots

5. **SEO 工具檔案** (Day 5)
   - [ ] 建立 robots.txt
   - [ ] 建立 sitemap.xml
   - [ ] 建立 security.txt

6. **測試與驗證** (Day 6-7)
   - [ ] Google Rich Results Test
   - [ ] Facebook Sharing Debugger
   - [ ] Twitter Card Validator
   - [ ] Lighthouse SEO 分數

**驗收標準**:

- ✅ 所有 P0 meta tags 已實施
- ✅ 結構化資料通過 Google 驗證
- ✅ OG/Twitter 圖片正確顯示
- ✅ Lighthouse SEO 分數 >90

---

### Phase 2: 內容優化 (Week 3-4) 🟡 P1

**目標**: 建立 AEO/LLMO 友善內容

**任務清單**:

1. **FAQ 頁面** (Day 1-3)
   - [ ] 撰寫 10+ 個常見問題
   - [ ] 實施問答式結構
   - [ ] 實施 FAQPage schema
   - [ ] 優化 Featured Snippet

2. **操作指南** (Day 3-5)
   - [ ] 撰寫使用教學
   - [ ] 實施 HowTo schema
   - [ ] 建立步驟式說明
   - [ ] 添加圖片/影片

3. **關於頁面** (Day 5-6)
   - [ ] 撰寫品牌故事
   - [ ] 實施 Organization schema
   - [ ] 建立團隊資訊
   - [ ] 添加聯繫方式

4. **LLMO 內容增強** (Day 6-7)
   - [ ] 資訊增益內容改寫
   - [ ] 添加數據支持
   - [ ] 引用權威來源
   - [ ] 技術細節說明

**驗收標準**:

- ✅ FAQ 頁面有 10+ 問答
- ✅ 操作指南完整且清晰
- ✅ 內容通過 AI 引用測試
- ✅ Featured Snippet 候選

---

### Phase 3: 技術優化 (Week 5-6) 🟡 P1

**目標**: 提升技術 SEO 與效能

**任務清單**:

1. **預渲染實施** (Day 1-3)
   - [ ] 評估 SSR/SSG 方案
   - [ ] 實施預渲染（關鍵頁面）
   - [ ] 測試爬蟲可訪問性
   - [ ] 優化首屏渲染

2. **Core Web Vitals 優化** (Day 3-5)
   - [ ] 測試 LCP、FID、CLS、INP
   - [ ] 優化圖片載入
   - [ ] 優化 JavaScript bundle
   - [ ] 實施 lazy loading

3. **PWA SEO 優化** (Day 5-6)
   - [ ] 優化 manifest.json
   - [ ] SEO 友善 Service Worker
   - [ ] 添加 screenshots
   - [ ] 測試離線 SEO

4. **監控與分析** (Day 6-7)
   - [ ] Google Search Console 設定
   - [ ] Google Analytics 4 整合
   - [ ] 監控爬蟲訪問
   - [ ] 追蹤 Rich Results

**驗收標準**:

- ✅ LCP <2.5s, FID <100ms, CLS <0.1
- ✅ Lighthouse Performance >90
- ✅ 預渲染頁面可被爬蟲訪問
- ✅ 監控系統正常運作

---

### Phase 4: 進階優化 (Week 7-8) 🟢 P2

**目標**: GEO 與進階 SEO 策略

**任務清單**:

1. **GEO 語義優化** (Day 1-3)
   - [ ] 語義足跡擴展
   - [ ] 同義詞覆蓋
   - [ ] 實體標記
   - [ ] 關係定義

2. **AEO 內容深化** (Day 3-5)
   - [ ] Featured Snippet 優化
   - [ ] People Also Ask 內容
   - [ ] 語音搜尋優化
   - [ ] 結構化答案

3. **LLMO 權威性** (Day 5-7)
   - [ ] 外部連結建立
   - [ ] 社群媒體分享
   - [ ] 品牌提及追蹤
   - [ ] AI 引用監控

4. **內容行銷** (Day 7-8)
   - [ ] 部落格文章
   - [ ] 教學影片
   - [ ] 社群媒體推廣
   - [ ] 使用者案例

**驗收標準**:

- ✅ AI 搜尋引擎可找到品牌
- ✅ Featured Snippet 成功出現
- ✅ 社群媒體分享數增長
- ✅ 外部連結數量增加

---

## 測試與驗證

### 1. SEO 測試工具

#### A. Google 官方工具

| 工具                 | 用途                   | 連結                                           |
| -------------------- | ---------------------- | ---------------------------------------------- |
| Rich Results Test    | 驗證結構化資料         | https://search.google.com/test/rich-results    |
| Mobile-Friendly Test | 行動友善測試           | https://search.google.com/test/mobile-friendly |
| PageSpeed Insights   | 效能與 Core Web Vitals | https://pagespeed.web.dev/                     |
| Lighthouse           | 綜合 SEO 審查          | Chrome DevTools                                |
| Search Console       | 搜尋效能監控           | https://search.google.com/search-console       |

#### B. 社交媒體工具

| 平台     | 工具             | 連結                                         |
| -------- | ---------------- | -------------------------------------------- |
| Facebook | Sharing Debugger | https://developers.facebook.com/tools/debug/ |
| Twitter  | Card Validator   | https://cards-dev.twitter.com/validator      |
| LinkedIn | Post Inspector   | https://www.linkedin.com/post-inspector/     |

#### C. Schema 驗證工具

| 工具                 | 用途             | 連結                            |
| -------------------- | ---------------- | ------------------------------- |
| Schema.org Validator | 驗證 Schema 語法 | https://validator.schema.org/   |
| JSON-LD Playground   | 測試 JSON-LD     | https://json-ld.org/playground/ |

---

### 2. AI 搜尋測試

#### A. LLMO 測試流程

**測試平台**:

- ChatGPT (GPT-4)
- Claude (Opus/Sonnet)
- Google Gemini
- Perplexity AI
- Microsoft Copilot

**測試問題範例**:

1. **品牌識別測試**

   ```
   Q: 有哪些好用的匯率換算工具？
   期望: RateWise 被提及或推薦
   ```

2. **功能查詢測試**

   ```
   Q: 如何查詢台幣兌美元的即時匯率？
   期望: RateWise 被引用作為解決方案
   ```

3. **技術細節測試**

   ```
   Q: RateWise 使用什麼技術開發的？
   期望: 正確回答技術棧（React, TypeScript, PWA）
   ```

4. **資料來源測試**
   ```
   Q: RateWise 的匯率資料從哪裡來？
   期望: 正確回答（臺灣銀行牌告匯率）
   ```

**驗收標準**:

- ✅ 至少 3/5 平台能找到品牌
- ✅ 關鍵資訊正確被引用
- ✅ 無負面或錯誤資訊

#### B. AEO 測試流程

**測試方式**: Google 搜尋特定問題

**測試查詢**:

1. "如何計算匯率"
2. "台幣兌美元匯率"
3. "什麼是買入價賣出價"
4. "匯率換算工具推薦"

**驗收標準**:

- ✅ 出現在 Featured Snippet
- ✅ 出現在 People Also Ask
- ✅ Rich Results 正確顯示
- ✅ Knowledge Panel 資訊正確

---

### 3. 效能測試

#### A. Core Web Vitals 目標

```bash
# 使用 Lighthouse CI
pnpm add -D @lhci/cli

# lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'largest-contentful-paint': ['error', {maxNumericValue: 2500}],
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.1}],
        'total-blocking-time': ['error', {maxNumericValue: 200}],
      },
    },
  },
};
```

#### B. 測試指令

```bash
# 建置專案
pnpm build

# 預覽建置結果
pnpm preview

# 執行 Lighthouse CI
pnpm lhci autorun
```

---

### 4. 子路徑靜態資產驗證

| 檢查項目    | 指令                                                                         | 預期       |
| ----------- | ---------------------------------------------------------------------------- | ---------- |
| robots.txt  | `curl -I https://app.haotool.org/ratewise/robots.txt`                        | HTTP/2 200 |
| sitemap.xml | `curl -I https://app.haotool.org/ratewise/sitemap.xml`                       | HTTP/2 200 |
| llms.txt    | `curl -I https://app.haotool.org/ratewise/llms.txt`                          | HTTP/2 200 |
| manifest    | `curl -I https://app.haotool.org/ratewise/manifest.webmanifest`              | HTTP/2 200 |
| favicon     | `curl -I https://app.haotool.org/ratewise/favicon.ico`                       | HTTP/2 200 |
| screenshots | `curl -I https://app.haotool.org/ratewise/screenshots/desktop-converter.png` | HTTP/2 200 |

### 5. 持續監控

#### A. Google Search Console 設定

**步驟**:

1. 新增網站資產
2. 驗證網域所有權
3. 提交 sitemap.xml
4. 監控以下指標：
   - 搜尋外觀（Rich Results）
   - 網頁體驗（Core Web Vitals）
   - 索引涵蓋範圍
   - 行動可用性

#### B. 關鍵指標追蹤

| 指標類別        | 指標              | 目標       | 頻率 |
| --------------- | ----------------- | ---------- | ---- |
| 搜尋可見度      | 搜尋曝光次數      | 月增長 10% | 每週 |
| 搜尋可見度      | 平均排名          | Top 10     | 每週 |
| 搜尋可見度      | 點擊率 (CTR)      | >5%        | 每週 |
| 結構化資料      | Rich Results 數量 | 持續增長   | 每月 |
| 結構化資料      | 結構化資料錯誤    | 0 個       | 每週 |
| Core Web Vitals | LCP               | <2.5s      | 每日 |
| Core Web Vitals | FID/INP           | <100ms     | 每日 |
| Core Web Vitals | CLS               | <0.1       | 每日 |
| AI 引用         | ChatGPT 提及次數  | 監控趨勢   | 每月 |
| AI 引用         | Perplexity 引用   | 監控趨勢   | 每月 |

---

## 實施範例程式碼

### 1. SEOHead 元件

```typescript
// src/components/SEOHead.tsx
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { JsonLd } from 'react-schemaorg';
import { WebApplication, Organization, FAQPage } from 'schema-dts';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  structuredData?: 'webapp' | 'faq' | 'howto';
}

export function SEOHead({
  title = 'RateWise - 即時匯率轉換器 | 支援 TWD、USD、JPY、EUR 等多幣別換算',
  description = 'RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP 等 30+ 種貨幣。快速、準確、離線可用的 PWA 匯率工具。',
  keywords = '匯率, 匯率換算, 即時匯率, 台幣匯率, TWD, USD, 外幣兌換, 匯率查詢, 臺灣銀行匯率',
  canonical = 'https://app.haotool.org/ratewise',
  ogImage = 'https://app.haotool.org/ratewise/og-image.png',
  structuredData = 'webapp',
}: SEOHeadProps) {
  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="RateWise Team" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonical} />

        {/* Language */}
        <meta httpEquiv="content-language" content="zh-TW" />
        <meta name="language" content="Traditional Chinese" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="RateWise 匯率轉換器應用截圖" />
        <meta property="og:locale" content="zh_TW" />
        <meta property="og:site_name" content="RateWise" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonical} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content="RateWise 匯率轉換器" />
      </Helmet>

      {/* Structured Data */}
      {structuredData === 'webapp' && (
        <JsonLd<WebApplication>
          item={{
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'RateWise',
            alternateName: '匯率好工具',
            description:
              '即時匯率轉換器，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR 等 30+ 種貨幣換算',
            url: 'https://app.haotool.org/ratewise',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            featureList: [
              '即時匯率查詢',
              '單幣別換算',
              '多幣別同時換算',
              '歷史匯率趨勢',
              '離線使用',
              'PWA 支援',
            ],
            screenshot: 'https://app.haotool.org/ratewise/screenshot.png',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '1250',
              bestRating: '5',
              worstRating: '1',
            },
          }}
        />
      )}

      {/* Organization Schema */}
      <JsonLd<Organization>
        item={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'RateWise',
          url: 'https://app.haotool.org/ratewise',
          logo: 'https://app.haotool.org/ratewise/logo.png',
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Support',
            email: 'haotool.org@gmail.com',
          },
          sameAs: [
            'https://www.threads.net/@azlife_1224',
            'https://github.com/haotool/app',
          ],
        }}
      />
    </>
  );
}

// 在 App.tsx 中使用
import { HelmetProvider } from 'react-helmet-async';
import { SEOHead } from './components/SEOHead';

function App() {
  return (
    <HelmetProvider>
      <SEOHead />
      {/* 應用內容 */}
    </HelmetProvider>
  );
}
```

---

### 2. FAQ 頁面範例

```typescript
// src/pages/FAQ.tsx
import { SEOHead } from '../components/SEOHead';
import { JsonLd } from 'react-schemaorg';
import { FAQPage, Question } from 'schema-dts';

const faqs = [
  {
    question: 'RateWise 的匯率資料來源是什麼？',
    answer:
      'RateWise 的匯率資料參考臺灣銀行牌告匯率，每天更新，提供準確可靠的外幣兌換參考。',
  },
  {
    question: '如何計算匯率換算？',
    answer:
      '匯率換算公式：目標貨幣金額 = 原始貨幣金額 × 匯率。例如：1000 TWD × 0.0324 = 32.4 USD。RateWise 自動計算，無需手動換算。',
  },
  {
    question: '買入價和賣出價有什麼差別？',
    answer:
      '買入價是銀行向您買入外幣的價格（您賣給銀行），賣出價是銀行賣給您外幣的價格（您向銀行買）。兩者差距稱為「價差」，是銀行的利潤。',
  },
  // ... 更多問題
];

export function FAQPage() {
  return (
    <>
      <SEOHead
        title="常見問題 (FAQ) - RateWise 匯率轉換器"
        description="RateWise 常見問題解答，包括匯率資料來源、換算方式、買賣價差等問題。"
        canonical="https://app.haotool.org/ratewise/faq"
      />

      {/* FAQ Schema */}
      <JsonLd<FAQPage>
        item={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }}
      />

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">常見問題 (FAQ)</h1>

        {faqs.map((faq, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{faq.question}</h2>
            <p className="text-gray-700">{faq.answer}</p>
          </div>
        ))}
      </div>
    </>
  );
}
```

---

### 3. 預渲染設定

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // PWA 配置
    }),
    // 未來可添加預渲染插件
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 代碼分割優化
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['lightweight-charts'],
        },
      },
    },
  },
});
```

---

## 參考資源

### 官方文件

- **Schema.org**: https://schema.org/
- **Google Search Central**: https://developers.google.com/search
- **Open Graph Protocol**: https://ogp.me/
- **Twitter Cards**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- **PWA Documentation**: https://web.dev/progressive-web-apps/

### React SEO 工具

- **react-helmet-async**: https://github.com/staylor/react-helmet-async
- **react-schemaorg**: https://github.com/google/react-schemaorg
- **next-seo** (Next.js): https://github.com/garmeeh/next-seo

### 驗證工具

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **PageSpeed Insights**: https://pagespeed.web.dev/

### 學習資源

- **Ahrefs Blog**: https://ahrefs.com/blog/geo-is-just-seo/
- **Search Engine Land**: https://searchengineland.com/guides/large-language-model-optimization-llmo
- **CXL**: https://cxl.com/blog/answer-engine-optimization-aeo-the-comprehensive-guide-for-2025/

### AI 搜尋平台

- **ChatGPT Search**: https://chat.openai.com
- **Perplexity AI**: https://www.perplexity.ai/
- **Claude**: https://claude.ai/
- **Google Gemini**: https://gemini.google.com/
- **Microsoft Copilot**: https://copilot.microsoft.com/

---

## 版本記錄

| 版本  | 日期       | 變更內容                             | 作者             |
| ----- | ---------- | ------------------------------------ | ---------------- |
| 1.0.0 | 2025-10-17 | 初版建立：完整 SEO/AEO/LLMO/GEO 規格 | Development Team |

---

## 附錄

### A. SEO Checklist

**基礎 SEO** ✅:

- [ ] Title tag (50-60 字)
- [ ] Meta description (150-160 字)
- [ ] Meta keywords
- [ ] Canonical link
- [ ] Language meta
- [ ] Robots meta

**Open Graph** ✅:

- [ ] og:type
- [ ] og:url
- [ ] og:title
- [ ] og:description
- [ ] og:image (1200×630)
- [ ] og:locale
- [ ] og:site_name

**Twitter Card** ✅:

- [ ] twitter:card
- [ ] twitter:title
- [ ] twitter:description
- [ ] twitter:image

**結構化資料** ✅:

- [ ] WebApplication schema
- [ ] Organization schema
- [ ] FAQPage schema
- [ ] HowTo schema
- [ ] BreadcrumbList schema

**技術 SEO** ✅:

- [ ] robots.txt
- [ ] sitemap.xml
- [ ] LCP <2.5s
- [ ] FID <100ms
- [ ] CLS <0.1
- [ ] INP <200ms
- [ ] Mobile-friendly
- [ ] HTTPS

**內容優化** ✅:

- [ ] FAQ 頁面
- [ ] 操作指南
- [ ] 關於頁面
- [ ] 問答式內容
- [ ] 資訊增益內容

### B. 名詞解釋

| 術語    | 全名                              | 說明                              |
| ------- | --------------------------------- | --------------------------------- |
| SEO     | Search Engine Optimization        | 傳統搜尋引擎優化                  |
| AEO     | Answer Engine Optimization        | 回答引擎優化（Featured Snippets） |
| LLMO    | Large Language Model Optimization | 大型語言模型優化（AI 引用）       |
| GEO     | Generative Engine Optimization    | 生成式引擎優化（AI 生成內容）     |
| LCP     | Largest Contentful Paint          | 最大內容繪製時間                  |
| FID     | First Input Delay                 | 首次輸入延遲                      |
| CLS     | Cumulative Layout Shift           | 累積版面配置轉移                  |
| INP     | Interaction to Next Paint         | 互動到下一次繪製                  |
| JSON-LD | JSON for Linking Data             | 結構化資料格式                    |
| OG      | Open Graph                        | 社交媒體分享協議                  |
| PWA     | Progressive Web App               | 漸進式網頁應用程式                |
| SSR     | Server-Side Rendering             | 伺服器端渲染                      |
| SSG     | Static Site Generation            | 靜態站點生成                      |

---

**文檔結束** | 最後更新：2025-10-17 | Version 1.0.0
