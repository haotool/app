---
'@app/ratewise': patch
---

Sentry `beforeSend` 改用 `classifyUnhandledRejection` 判斷 fetch 失敗，與 errorClassification SSOT 收斂；Firefox / Safari 的網路失敗訊息不再重複送到 Sentry。
