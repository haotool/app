---
'@app/ratewise': patch
---

全局更新品牌名稱為「RateWise 匯率好工具」

- app-info.ts：APP_INFO.name 統一為 'RateWise 匯率好工具'（SSOT）
- seo-metadata.ts：DEFAULT_DESCRIPTION、首頁 heading、FAQ/Guide/About 標題與描述補上完整品牌名
- 幣別頁 title 移除尾端重複的 RateWise（由 SEOHelmet suffix 自動補全）
- seo-paths.config.mjs：SITE_CONFIG.name 移除連字號改為空格
- manifest.webmanifest：name 與 description 同步更新
