---
'@app/ratewise': patch
---

移除 isChunkLoadError 中過於寬鬆的 'load failed' 匹配，避免 Safari 通用 fetch 失敗被誤判為 chunk 載入錯誤
