---
'@app/ratewise': patch
---

新增 rate provider ranking 純函式（`rateProviderRanking.ts`），提供 `rankProviderQuotes` 與 `resolveProviderPreference`，依 best/manual 模式收斂 provider 解析行為，內部架構準備，無使用者可見變化
