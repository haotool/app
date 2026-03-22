---
'@app/ratewise': minor
---

feat(seo): 金額換算結果卡 + 修正 twd-to-foreign SEO 標題 + 擴充 meta descriptions

- CurrencyLandingPage：點擊 ?amount=X 連結後，頁面顯示台銀現金賣出靜態換算結果卡（Googlebot 可爬取）
- usePairAmountSEO：新增 direction prop，修正 twd-to-foreign 方向的 title/description 模板
- seo-metadata：forward 頁與 reverse 頁 meta description 擴充至 110-120 字，符合 SEO 建議長度
- CTA 深連結改為帶入 amount 參數，直接跳到換算器對應金額
- seo-metadata：FAQ「X 等於多少台幣？」與大金額問答補入靜態匯率數字（每週更新），Googlebot 原始 HTML 層次即可讀到換算結果
