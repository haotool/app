---
'@app/ratewise': patch
---

useCurrencyConverter 改以 store `providerPreference` 解析 `resolvedProvider` 作為實際來源決策點，移除元件層對 `rateSource` 的直接依賴；同時暴露 `providerQuotes` / `rankedProviderQuotes` 作為未來 best 模式預留接點。Phase 1 行為與目前完全一致（rateSource 仍由 store 同步維持），無使用者可感知變更。
