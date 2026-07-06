---
'@app/ratewise': patch
---

修復 staging／preview 環境 GA4 照常外送污染正式分析資料的問題：僅正式站網域載入追蹤，其他環境零 gtag 請求（GA 注入驗證流程自此後移至正式站）。
