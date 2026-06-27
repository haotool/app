---
'@app/ratewise': patch
---

修復冷啟動時多幣別換算模式無法還原的問題（生產環境 persist 已同步但 hydration 回呼未觸發）。
