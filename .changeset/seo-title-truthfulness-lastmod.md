---
'@app/ratewise': patch
---

fix(seo): 修正 Open Data title、FAQPage 透明度敘述與 sitemap lastmod 真實性

- Open Data 頁 title 改由 `SEOHelmet` 統一追加品牌，避免 prerender 產物出現重複品牌名稱
- About FAQ 與 `docs/SEO_GUIDE.md` 移除 `FAQPage` 已實作 / Rich Results 已適用的過時敘述，回到實際 schema 輸出狀態
- sitemap `lastmod` 改為重大依賴檔的 git commit time 優先，降低工作樹或 CI `mtime` 造成的假真實時間戳
- 新增 prerender 與 truthfulness 回歸測試，持續守住 title 去重與 SEO 透明度同步
