---
'@app/ratewise': patch
---

修正匯率 CDN 請求因 preflight 失敗而過度降級至 GitHub Raw 的問題，提升主 CDN 命中率與載入穩定性
