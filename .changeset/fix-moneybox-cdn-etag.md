---
'@app/ratewise': patch
---

移除 moneybox CDN fetchFromCDN 的 ETag/304 條件式請求，統一以 HTTP cache 與 client 端 TTL 管理重複請求；更新 OpenData 與 SeoTech 頁面說明文字以反映新行為
