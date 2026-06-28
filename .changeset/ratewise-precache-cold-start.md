---
'@app/ratewise': patch
---

重整 PWA 快取為優先級分層，確保主功能（幣別換算）離線必可載入，並讓離線錯誤頁不再無謂出現：

- Tier 1 預快取只保留 app shell（index.html）、JS/CSS、路由 loader 清單與少量 shell 圖示與離線頁，precache 由 428 筆（約 34.5MB）降至 92 筆（約 2.2MB），弱網下 Service Worker 能可靠安裝完成。
- Tier 2 改為 runtime 快取：大型圖片（CacheFirst）、SEO 頁（導覽回退至 app shell）、匯率資料（StaleWhileRevalidate 7 天離線備援）。
- 離線時一律以 app shell 還原主功能，offline.html 僅作最後手段，不再因預快取過大而誤觸。
