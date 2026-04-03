---
'@app/ratewise': minor
---

feat(seo): 新增 @id linked data URI 強化 Google Knowledge Graph 跨頁面實體識別

- SoftwareApplication、Organization、WebSite schema 加入穩定 `@id` URI fragment（`#softwareapplication`、`#organization`、`#website`）
- Article schema publisher 改為 `{ '@id': '#organization' }` 引用模式
- SoftwareApplication 加入 `screenshot` 陣列提升 App SEO 豐富度
- 新增 `scripts/verify-seo-ssot.mjs`：JSON-LD、canonical、sitemap、robots.txt 一站式 SSOT 驗證工具
