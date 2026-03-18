---
'@app/ratewise': patch
---

整合 jsDelivr Purge + ETag：jsDelivr 改為主要端點（GitHub Actions 每次推送後自動 Purge，實際新鮮度約 5 分鐘），支援 ETag 條件式請求省頻寬，GitHub Raw 降為備援
