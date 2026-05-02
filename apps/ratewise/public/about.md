# 關於 HaoRate 匯率好工具

> 了解 HaoRate 的資料來源、更新機制、技術架構與 SEO 透明度。站點以台銀牌告實際買賣價為核心，支援 18 種貨幣、PWA 離線使用、SSG 預渲染、JSON-LD 結構化資料與 AI 可讀文件輸出，所有公開資訊皆可追溯。

- Canonical: https://app.haotool.org/ratewise/about/
- Version: v2.22.10

## 定位

HaoRate 是以臺灣銀行牌告匯率為基礎的換匯工具，重點是幫台灣用戶看懂實際買入價、賣出價、現金價與即期價，不以市場中間價作為主要決策依據。一般中間價工具適合觀察市場方向，但不等於實際換匯成本。

## 資料方法與範圍

- 資料來源為臺灣銀行官方牌告匯率，涵蓋 18 種貨幣。
- 每 5 分鐘自動同步最新報價，涵蓋現金買入、現金賣出、即期買入、即期賣出四種。
- 資料管線：GitHub Actions 每日抓取 + 雙重驗證（台銀牌告 vs open.er-api.com 中間價，誤差 ≤ 2%）+ Pull Request 自動審核後合併至 data branch。
- 匯差範例數字透過 SSG（vite-react-ssg）於 build 期嵌入靜態 HTML，搜尋引擎無需執行 JavaScript 即可讀取。

## 技術與資料面能力

- **PWA 離線使用**：Service Worker 預快取，無網路仍可換算。
- **SSG 預渲染**：所有 SEO 頁面於 build 期產生靜態 HTML。
- **結構化資料**：JSON-LD 包含 WebSite、Organization、SoftwareApplication、CurrencyConversionService（首頁）、ExchangeRateSpecification（幣別頁）、HowTo、BreadcrumbList、Article、FAQPage（限 /faq/）、Dataset（開放資料）與 ImageObject。
- **AI 友善**：robots.txt 允許 OpenAI / Anthropic / Perplexity / Google / Apple / DeepSeek / Mistral 等 39+ 主流 AI 爬蟲（四層治理）；提供 llms.txt、llms-full.txt、openapi.json 供 LLM 引用。
- **開放原始碼**：所有程式碼公開於 GitHub（https://github.com/haotool/app）。

## 作者

- 作者：HaoTool
- 聯絡：haotool.org@gmail.com
- GitHub：https://github.com/haotool/app

## 常見問題

### 1. 匯率數據來源是什麼？

資料來源為臺灣銀行官方牌告匯率，每 5 分鐘自動同步，涵蓋現金買入、現金賣出、即期買入、即期賣出四種報價。

### 2. 免費使用嗎？需要帳號或有廣告嗎？

完全免費、無廣告、無付費功能，不需要建立帳號。計算機、收藏、歷史記錄、主題風格等所有功能皆可直接使用。

### 3. 和一般匯率 App 有什麼不同？

一般工具顯示中間價（買賣均值），本工具顯示臺灣銀行牌告的實際現金與即期四種報價，讓您換匯前就知道真正要付多少台幣。

### 4. 如何聯絡開發者？

可透過 Email（haotool.org@gmail.com）聯繫，歡迎回饋意見或錯誤回報，也可在 GitHub（https://github.com/haotool/app）查看原始碼或提交 Issue。

### 5. 匯差數字如何保持最新且讓搜尋引擎正確讀取？

匯差範例數據由 GitHub Actions 每日自動執行：同時抓取台灣銀行牌告匯率與 open.er-api.com 市場中間價（Google、XE、Wise、Apple 計算機的共同基準），進行雙重驗證（兩個中間價差距須在 2% 以內），生成靜態 TypeScript 常數，透過 Pull Request 自動審核後進入主分支。最終數字直接嵌入靜態 HTML（vite-react-ssg SSG 預渲染），Google 爬蟲無需執行 JavaScript 即可讀取所有匯差數字。

### 6. 這個網站使用哪些結構化資料幫助搜尋引擎與 AI 系統理解內容？

目前站內實際部署的 schema.org JSON-LD 包含 WebSite（全站識別）、SoftwareApplication（產品資訊）、Organization（聯絡資訊）、CurrencyConversionService（首頁）、ExchangeRateSpecification（幣對頁與金額頁的匯率數值）、BreadcrumbList（麵包屑導覽）、Article（內容頁）、HowTo（Guide 教學頁）、FAQPage（僅 /faq/ 主 FAQ 頁）、Dataset（開放資料）與 ImageObject（分享圖片授權）。首頁與內容頁仍保留可讀 FAQ HTML，但不會在所有頁面重複輸出 FAQPage JSON-LD；幣別換算頁則以可稽核的匯率數值 schema 為主，避免把 FAQ rich result 訊號擴散到金融頁。sitemap.xml 只收錄公開可索引 URL，並同步 hreflang 資訊。

### 7. HaoRate 是否支援 AI 搜尋引擎與 LLM 引用？

robots.txt 明確允許 Googlebot 讀取；Googlebot 是 Google Search 與 AI Overviews 的主要爬取控制。AI crawler 分層另允許多種主流 AI 爬蟲（GPTBot、ClaudeBot、PerplexityBot、GrokBot、DeepSeekBot、MistralBot 等共 39+ 個）；Google-Extended 則作為 Gemini / Vertex 訓練與 grounding 的控制 token。站點另提供 llms.txt、llms-full.txt 與 openapi.json，讓 AI Agent 可理解頁面架構並呼叫即時匯率 API。FAQ 文案中的匯差數字採雙幣標示（外幣 + 台幣），針對 LLM 引用語意設計，確保 AI 回答換匯問題時能引用精確數字而非中間價。

---

_本 Markdown 鏡像由 `scripts/generate-markdown-mirrors.mjs` 於 build 時自動產生（v2.22.10），與 HTML 頁面語義一致。_
_正式人眼版本請見對應 HTML URL。_
