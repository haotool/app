---
'@app/ratewise': patch
---

冷啟動白屏 P1：SPA navigation 改為 bounded SWR-style handler。已暖機 cache hit 立即返回並背景更新，cache miss 最多等待網路 3 秒後回 precache fallback；新版 SW 啟用時清除舊 HTML runtime cache，避免更新後先回舊版 HTML。
