---
'@app/ratewise': patch
---

修正 sitemap 在 GitHub Actions shallow checkout 環境下的 `lastmod` 回退策略，避免 CI 與正式產物出現單一日期失真。
