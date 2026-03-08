---
'@app/ratewise': patch
---

在跳過 legacy 遷移前驗證持久化 schema

- 新增 `buildSanitizePatch`：hydrate 後驗證 favorites/fromCurrency/toCurrency/mode 欄位
- 修復：`ratewise-converter` 存在但含不合法資料（舊 CurrencyPair 格式、損毀代碼）時，
  先前不做任何驗證直接暴露給下游，導致 `CURRENCY_DEFINITIONS[code]` 可能拋出執行期錯誤
- `onRehydrateStorage` 依序執行：`__validateAndSanitize` → `__migrateFromLegacy`
- 新增 7 個 schema 驗證單元測試（converterStore 共 26 tests）
