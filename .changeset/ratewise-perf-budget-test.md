---
'@app/ratewise': patch
---

新增首屏 bundle 預算守門測試，驗證 modulepreload 不含非必要 vendor（motion/dnd）且初始 JS brotli 維持在 135KB 內
