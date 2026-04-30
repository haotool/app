---
'@app/ratewise': patch
---

- 效能優化：趨勢圖 lazy import + IntersectionObserver 延遲載入，減少首屏關鍵資源占用
- 效能優化：在 `<head>` 注入 inline script 預設 `--app-height`，避免 hydration 後 CLS
