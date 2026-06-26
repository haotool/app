---
'@app/ratewise': patch
---

離線導覽更快、匯率不再因 ETag 304 卡住：iOS PWA 改用 precache-first 冷啟動，移除 jsDelivr 跨域 If-None-Match 條件式請求，並以 cache no-cache 強制 CDN 重新驗證
