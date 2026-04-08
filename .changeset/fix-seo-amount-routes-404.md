---
'@app/ratewise': patch
---

修復金額路由 404 錯誤：將 /usd-twd/500/ 等金額特定路由移為動態路由，停止預渲染 ~206 個 CURRENCY_AMOUNT_SEO_PATHS 與 REVERSE_CURRENCY_AMOUNT_SEO_PATHS 靜態頁面。金額路由現由 React Router /:amount 動態處理，SEO Sitemap 仍正確索引所有路由。
