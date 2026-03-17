---
'@app/ratewise': patch
---

修正 GSC「替代頁面（有適當的標準標記）」驗證失敗：robots.txt 封鎖 deep-link query params

Google Search Console 報告 19 個帶 query string 的 URL（如 ?amount=500&from=USD&to=TWD）
被 Googlebot 爬取，雖 canonical 正確但消耗 crawl budget 且驗證失敗。

新增 `Disallow: /ratewise/?` 至 User-agent: \* 區塊，封鎖所有帶 query string 的首頁
deep-link URL。Social bot（facebookexternalhit、Twitterbot、Meta-ExternalAgent、LinkedInBot）
在各自獨立 section 設有 `Allow: /`，不受此規則影響，仍可正常爬取以供 OG 預覽。

業界依據：https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
