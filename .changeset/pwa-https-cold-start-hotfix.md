---
'@app/ratewise': patch
---

修復 PWA 冷啟動時 Chrome 顯示「此連結並不安全」警告：manifest 改為絕對 HTTPS scope，且 Service Worker 不再快取舊版 manifest。
