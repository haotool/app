---
'@app/ratewise': patch
---

讓 build-time fallback 匯率快照由每日資料更新流程維護，避免一般 build 產生匯率資料漂移；同時在線上遠端匯率來源全失敗且本機無快取時，改用 build-time snapshot 維持換算器可用。
