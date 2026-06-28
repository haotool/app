---
'@app/ratewise': patch
---

修復 PWA 行動裝置冷啟動/弱網時誤觸離線頁面：將 precache 從 428 筆（約 34.5MB）裁減至 222 筆（約 11.8MB），排除幣別頁的金額排列子頁（改由 runtime 快取與 SPA shell 還原處理），讓 Service Worker 安裝能在弱網下順利完成，避免顯示「您目前處於離線狀態」。
