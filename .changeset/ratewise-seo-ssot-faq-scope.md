---
'@app/ratewise': patch
---

收斂 FAQ rich result 與 SEO SSOT

- `SEOHelmet` 移除不適用於 RateWise 的 `FAQPage` schema builder
- `seo-metadata.ts` 新增 `SEO_INDEXABLE_LOCALES` 與 `buildDefaultAlternates()`，集中管理 hreflang fallback
- `faq` 欄位改為 `faqContent`，將 FAQ 內容與 structured data 責任分離
- 新增 `seo-ssot.test.ts` 並重構 hreflang / jsonld / prerender / SEOHelmet 測試
