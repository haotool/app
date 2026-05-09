---
'@app/ratewise': patch
---

新增 `RateProviderMenu` 元件骨架（Phase 2 預留）：內建 `shouldEnableBankProviderChoice()` phase gate，目前因為只有台銀一家銀行 provider，元件 return null 不渲染，使用者體驗完全不變。Phase 2 啟用多銀行推薦時可直接掛入既有 RateSelector / SingleConverter。
