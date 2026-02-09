---
'@app/ratewise': patch
---

修正 PWA 關鍵資源路徑解析：移除 CRITICAL_RESOURCES 前導斜線，避免 new URL() 忽略 base path 導致 404
