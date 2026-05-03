---
'@app/ratewise': patch
---

在 Lighthouse CI 離線模式下，首頁改為直接使用 build-time 匯率並跳過背景刷新，避免首屏效能檢查受離線 fallback 警告與額外背景工作影響。
