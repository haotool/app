---
'@app/ratewise': patch
---

fix(seo): 全面修復 SEO 問題，新增隱私政策頁

- 修復 Double H1（noscript 改為 p 標籤）
- 消除巢狀 main landmark（About/FAQ/Guide/CurrencyLandingPage）
- 補齊 6 頁 title 長度至 30-60 字元
- 補齊 25 頁 description 長度至 120-160 字元
- 新增隱私政策頁面（/privacy/）提升法律合規性
- 修復 Cloudflare email 混淆導致的 broken links
- 修復內部連結 trailing slash（避免 301 redirect）
- 修復 Settings 頁 aria-label 不匹配
