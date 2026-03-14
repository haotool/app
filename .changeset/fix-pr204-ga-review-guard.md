---
'@app/ratewise': patch
---

fix(ratewise): 修正 GA review 回饋與 CodeQL 測試告警

- 抽出 scheduleAfterPageLoad 並補齊 readyState 競態單元測試
- 整理 Playwright project 規則，避免 ga-defer-lcp 測試重複執行
- 改用 parsed URL host/path 判斷 GTM script，清除 CodeQL URL substring 告警
