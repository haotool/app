---
'@app/ratewise': patch
---

修復冷啟動時未還原上次停留的單/多幣別換算模式（hydrate 前偏好被預設值覆寫的競態）；PWA manifest 改用絕對 HTTPS start_url，降低獨立啟動情境下的安全連線警告。
