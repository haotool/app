---
'@app/ratewise': patch
---

避免 cold-start watchdog 在 SSG banner 模式下重複附加錯誤提示；新 overlay 顯示前會先清除既有 cold-start overlay。
