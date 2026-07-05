---
'@app/ratewise': patch
---

staging 等替代網域安裝 PWA 時 manifest scope 不再指向正式站：scope/start_url 改由 VITE_SITE_URL 環境變數驅動（含 trailing-slash 正規化），未設定時輸出與正式站完全相同。
