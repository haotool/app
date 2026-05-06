---
'@app/ratewise': patch
---

冷啟動白屏 P1：SPA navigation 由 NetworkFirst + 3s timeout 改為 StaleWhileRevalidate。已 install 過的 PWA 與已 visited 的瀏覽器 cache hit 立即返回，背景 revalidate 抓最新 HTML，把感知白屏降為 0。版本切換仍由 controllerchange + UpdatePrompt 雙重檢查；handlerDidError fallback 三層保留。
