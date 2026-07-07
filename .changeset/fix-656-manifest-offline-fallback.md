---
'@app/ratewise': patch
---

修復離線重新載入時 manifest.webmanifest 請求失敗（ERR_FAILED）的問題：離線時改用最近一次成功取得的副本，線上取用行為完全不變。
