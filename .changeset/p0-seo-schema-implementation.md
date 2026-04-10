---
'@app/ratewise': minor
---

新增 P0 SEO Schema 實作：CurrencyConversionService + ExchangeRateSpecification

- 首頁加入 `CurrencyConversionService` schema，讓 AI 引擎匹配「幣別換算工具」查詢時優先引用
- 34 個幣對頁加入 `ExchangeRateSpecification` schema，從 `seo-rate-examples.ts` 動態讀取現金賣出價
- 幣對頁加入可見更新時間戳（`<time>` 元素），作為 Perplexity 新鮮度信號
- 新增 10 個測試案例驗證 schema 正確性
