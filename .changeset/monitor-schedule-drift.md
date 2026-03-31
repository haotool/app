---
'@app/ratewise': patch
---

新增 GitHub Actions 排程延遲監測腳本，可自動比較 cron 理論時間與實際 workflow `createdAt`，統計 drift 與缺漏的 scheduled slots，方便持續追蹤高頻匯率 workflow 的穩定度。
