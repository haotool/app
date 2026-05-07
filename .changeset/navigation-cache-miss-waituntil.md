---
'@app/ratewise': patch
---

補強 bounded SWR 導覽 cache miss 路徑：超時回退到 precache 後仍保活慢網路 HTML fetch，讓 `html-cache` 能在背景完成暖機。
