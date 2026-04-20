---
'@app/ratewise': minor
---

金額頁新增 ExchangeRateSpecification schema，AI 引擎可提取具體換算結果

- 新增 `buildAmountExchangeRateSpecificationJsonLd()` 函數，生成包含換算金額的 schema
- `CurrencyLandingPage.tsx` 在 amount !== null 時自動注入金額頁專用 schema
- schema description 包含具體換算結果（如「100 USD 換 3,250 TWD」）
- 新增 4 個測試案例驗證 to-twd 和 twd-to-foreign 兩種方向的 schema 生成
- 更新 SEO_MASTER_SSOT.md 將 P1-5 標記為完成
