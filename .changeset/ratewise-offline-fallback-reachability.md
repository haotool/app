---
'@app/ratewise': patch
---

修正 PWA 離線導覽在 precache `index.html` / `offline.html` 缺失時的最後 fallback reachability，讓 `NavigationRoute` 也能直接命中任意快取中的 `offline.html`，避免冷啟動白屏。
