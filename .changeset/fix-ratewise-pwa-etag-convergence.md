---
'@app/ratewise': patch
---

離線導覽更快、匯率不再因 ETag 304 卡住：iOS PWA 改用 precache-first 冷啟動，移除 jsDelivr 跨域 If-None-Match 條件式請求，匯率與換錢所 CDN 皆以 cache no-cache 強制重新驗證
