---
'@app/ratewise': patch
---

- sw.ts 新增 unhandledrejection handler 捕捉 bad-precaching-response
- 僅在無健康 active worker 時才登出（首次安裝失敗場景）
- 若已有 active worker 仍在服務，保留其快取並讓瀏覽器下次自動重試新版安裝
- 修復部署競態窗口導致用戶 SW 卡在安裝失敗迴圈的問題
