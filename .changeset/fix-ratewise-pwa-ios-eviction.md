---
'@app/ratewise': patch
---

修復 iOS PWA precache 驅逐後 3s timeout 導致在線用戶看到 offline.html 的假離線問題，改用 precache-first 冷啟動策略
