---
'@app/ratewise': patch
---

內部監控調整：Sentry 停用連續 session replay（僅保留錯誤現場擷取）以節省配額，並修正 @sentry/react 依賴分類；無使用者可見行為變更。
