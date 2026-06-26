---
'@app/ratewise': patch
---

強化離線可靠度：Service Worker 在網路失敗時，對 JS/CSS 資源改用三層快取回退（精確網址 → 忽略查詢字串 → precache 比對），降低 iOS 在 cache 驅逐後出現「Load failed」白屏的機率。離線文件回退與靜態資源回退邏輯收斂為單一來源。
