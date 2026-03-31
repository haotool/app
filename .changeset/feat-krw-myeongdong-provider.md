---
'@app/ratewise': minor
---

- 韓元（KRW）頁面新增明洞換匯所（MoneyBox）現場匯率比較卡片，顯示台銀 vs 明洞換匯所差距
- 引入 AlternativeProvider 介面，支援未來多換匯管道擴充（VND/THB 等）
- update-seo-rate-examples.mjs 每日自動嘗試從 MoneyBox 取得最新匯率，失敗時優雅降級
- buildAlternativeProviderFaq() 自動為有替代管道的幣別生成 FAQ SEO 文案
- CurrencyLandingPage 新增 alternativeProviders prop，條件渲染 ProviderComparisonCard
