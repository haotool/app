---
'@app/ratewise': patch
---

- sw.ts 新增 unhandledrejection handler 捕捉 bad-precaching-response
- 偵測到 precache 安裝失敗時自動登出 SW，讓下次導覽重新安裝最新版本
- 修復部署競態窗口導致用戶 SW 卡在安裝失敗迴圈的問題
