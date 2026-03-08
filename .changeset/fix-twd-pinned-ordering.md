---
'@app/ratewise': minor
---

fix(ratewise): 修復多幣別頁面 TWD 未置頂與收藏排序不一致問題

- `useCurrencyConverter` 的 `sortedCurrencies` 現在永遠將 TWD 固定在第一位
- 非收藏幣別改為按字母順序排列，與收藏頁面的 `getAllCurrenciesSorted` 行為完全一致
- 新增 5 個 `sortedCurrencies` 單元測試（TWD 置頂、收藏順序、字母排序、與 Favorites 頁對齊）
