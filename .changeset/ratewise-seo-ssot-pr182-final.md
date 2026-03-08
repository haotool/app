---
'@app/ratewise': patch
---

收斂 SEO SSOT、FAQ 內容責任與 hreflang fallback

- 移除不適用的 FAQPage rich result 輸出，FAQ 改以內容欄位 `faqContent` 管理
- `SEOHelmet` 統一使用 `buildDefaultAlternates()`，並移除無效 / 冗餘 head metadata
- 補齊 seo-ssot / hreflang / jsonld / prerender 驗證，確保靜態產物與測試一致
