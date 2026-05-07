---
'@app/ratewise': patch
---

Production Lighthouse baseline 檢查會在執行前驗證 `LH_RUNS` 與 `LH_MAX_ATTEMPTS` 必須是正整數，避免 retry 設定錯誤時靜默產生不可信的通過結果。
