# 關於 HaoRate 匯率好工具

> HaoRate 由誰維護？匯率資料哪裡來、多久更新？為什麼堅持顯示台銀牌告實際買賣價而不是中間價？關於頁把資料來源、更新機制、匯差驗證方法與聯絡方式一次交代清楚。

- Canonical: https://app.haotool.org/ratewise/about/
- Version: v2.27.1

## 定位

HaoRate 是以臺灣銀行牌告匯率為基礎的換匯工具，重點是幫台灣用戶看懂實際買入價、賣出價、現金價與即期價，不以市場中間價作為主要決策依據。一般中間價工具適合觀察市場方向，但不等於實際換匯成本。

## 資料方法與範圍

- 資料來源為臺灣銀行官方牌告匯率，涵蓋 18 種貨幣。
- 約每 5 分鐘檢查更新最新報價，涵蓋現金買入、現金賣出、即期買入、即期賣出四種。
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

資料來源為臺灣銀行官方牌告匯率，約每 5 分鐘檢查更新，涵蓋現金買入、現金賣出、即期買入、即期賣出四種報價。

### 2. 免費使用嗎？需要帳號或有廣告嗎？

完全免費、無廣告、無付費功能，不需要建立帳號。計算機、收藏、歷史記錄、主題風格等所有功能皆可直接使用。

### 3. 和一般匯率 App 有什麼不同？

一般工具顯示中間價（買賣均值），本工具顯示臺灣銀行牌告的實際現金與即期四種報價，讓您換匯前先掌握實際成本。

### 4. 如何聯絡開發者？

可透過 Email（haotool.org@gmail.com）聯繫，歡迎回饋意見或錯誤回報，也可在 GitHub（https://github.com/haotool/app）查看原始碼或提交 Issue。

### 5. 匯差數字多久更新一次？

頁面上的匯差範例每日自動更新一次：系統同日抓取台灣銀行牌告匯率與市場中間價（Google、XE、Wise、Apple 計算機的共同基準），並做雙重驗證：兩個來源的中間價差距須在 2% 以內才會發布。換算器內的即時匯率更新頻率則見上方「匯率數據來源是什麼？」。

---

_本 Markdown 鏡像由 `scripts/generate-markdown-mirrors.mjs` 於 build 時自動產生（v2.27.1），與 HTML 頁面語義一致。_
_正式人眼版本請見對應 HTML URL。_
