---
'@app/ratewise': patch
---

修正多幣別頁的匯率顯示與換錢所來源收斂問題：現在多幣別會正確讀取使用者選擇的匯率模式與匯率來源，`auto`/`exchange-shop` 顯示不再和實際換算結果脫節；同時將 `rateType` / `rateSource` 偏好收進共用 store，讓單幣別與多幣別共用同一份持久化來源（收藏頁僅共用 `rateType`），切換到「換錢所」時自動同步為「現金」匯率。
