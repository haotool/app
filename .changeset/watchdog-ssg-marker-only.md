---
'@app/ratewise': patch
---

收斂 cold-start watchdog 的 SSG 判斷：banner 模式只信任 `data-server-rendered="true"`，避免破碎 root 或 placeholder 子節點被誤判為可閱讀的預渲染內容。
