---
'@app/ratewise': patch
---

新增 moneyboxRateService，對齊台銀快取策略：CDN + ETag 條件式請求、localStorage 5 分鐘快取、離線後備值，computeConverterRate 處理 TWD↔KRW 雙向匯率計算。
