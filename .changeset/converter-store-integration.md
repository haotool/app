---
'@app/ratewise': patch
---

重構 converterStore — useCurrencyConverter 接入 Zustand SSOT

- 啟用 converterStore 作為貨幣選擇、模式、收藏的 SSOT
- useCurrencyConverter 改由 Zustand store 管理持久化狀態，移除手動 localStorage 操作
- 新增 converterStore 單元測試（16 tests）
- vitest.config.ts 改用 forks pool，防止 localStorage mock 跨測試檔案洩漏
