---
'@app/ratewise': patch
---

fix(seo): 將 SEO 技術揭露頁對齊最新 SSOT

- 將 `/seo-tech/` 的 schema 與 prebuild 流程改為從 registry 顯示，避免頁面內繼續手寫過時數字與腳本名稱
- 更新 sitemap 與 schema 揭露說法，移除 `248 個 SEO URL`、`priority 欄位`、`FinancialService` 等舊資訊
- 新增頁面回歸保護，降低公開 SEO truth surface 再次漂移風險
