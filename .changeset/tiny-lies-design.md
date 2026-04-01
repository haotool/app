---
'@app/ratewise': patch
---

SEO 稽核修正：

- H1 標題改用中文幣別名稱（如「美金」）取代貨幣代碼（如「USD」），提升搜尋相關性
- HowTo schema 圖片路徑修正為實際存在的截圖檔案，避免 404 導致 Rich Results 失效
- 幣別頁 FinancialService schema 的 dateModified 改用 SEO_RATE_EXAMPLES_DATE（匯率資料更新日），而非 BUILD_TIME
- SeoTech 頁說明文字更新為正確的 248 個 SEO URL（含金額頁）
- 補強 sitemap、robots 與 noindex 預渲染頁面的 SEO 驗證保護測試
