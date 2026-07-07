---
'@app/ratewise': patch
---

首屏 JS 瘦身：34 幣別頁 SEO 文案（currency-landing 與 personas）改為隨幣別頁 lazy chunk 載入，不再打入首屏 app chunk（初始 JS brotli 267.0KB → 251.1KB，app chunk −15.9KB）；頁面功能與 SEO 輸出零變化。
