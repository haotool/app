---
'@app/ratewise': patch
---

讓 SSG 預渲染改為穩定序列輸出，避免大量巢狀金額頁在 CI 或 pre-push 中偶發產物讀取失敗。
