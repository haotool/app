---
'@app/ratewise': minor
---

feat(seo): 新增幣對靜態 JSON API 端點 + 還原 robots.txt query 封鎖

新增 `public/api/pairs/{pair}.json`（17 個幣對端點），提供幣對資訊、
即時匯率 CDN 連結與 rateFieldPath，供 AI agent 與搜尋系統查詢。
還原 `Disallow: /ratewise/?` 封鎖無限 query 組合以保護 crawl budget。
更新 openapi.json 加入幣對路徑、llms.txt 加入 per-pair API 說明。
