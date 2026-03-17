---
'@app/ratewise': patch
---

修正品牌名稱一致性並補全幣別頁 sitemap image entries

- CurrencyLandingPage copyright 改用動態年份（`new Date().getFullYear()`）
- zh-TW 語系 copyright 補上「匯率好工具」完整品牌名
- offline.html 與 sw.ts 離線頁標題補上完整品牌名
- pwa-offline 測試同步更新
- health-check.mjs 更新首頁與指南頁 title 期望值（舊格式已廢）
- sitemap generate-sitemap-2025.mjs 新增 17 個幣別頁 OG image entries
