---
'@app/ratewise': patch
---

修復 Zeabur staging 部署時 VITE_SITE_URL 環境變數不生效的問題：Docker 建置現在會把服務層環境變數帶入 vite build，staging 網域的 PWA manifest start_url/scope 正確指向 staging，可正常安裝；未設定變數時正式站行為零變化。
