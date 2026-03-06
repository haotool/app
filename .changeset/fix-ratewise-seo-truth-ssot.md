---
'@app/ratewise': patch
---

修復 RateWise SEO 真實性與 sitemap SSOT

- 移除不實的 `30+` 貨幣、舊 Lighthouse 分數與錯誤隱私宣稱，改由 SSOT 與實際服務能力產出內容
- `noindex` 頁面不再輸出 JSON-LD，避免 schema 與索引指令衝突
- 將 `/privacy/` 納入 public sitemap，並修復 host root `robots.txt` 多 sitemap discovery
- 新增 robots、manifest、sitemap 與內容真實性驗證測試
