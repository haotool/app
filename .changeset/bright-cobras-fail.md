---
'@app/ratewise': patch
---

修正 PWA 冷啟動離線時在 HTML fallback 全失守情境下仍可能白屏的問題，新增 Service Worker 最後一層 emergency 保護頁。
