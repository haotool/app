---
'@app/ratewise': patch
---

converterStore 新增 `providerPreference` 持久化欄位與 `setProviderPreference` 主入口；`setRateSource` 退為相容包裝，與 `rateSource` legacy 欄位永遠透過單一程式碼路徑同步。Phase 1 永遠 `mode='manual'`，cash invariant 維持原行為，內部架構準備，無使用者可見變化
