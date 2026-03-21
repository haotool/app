---
'@app/ratewise': patch
---

- 修正 openapi.json API 版本為獨立 SemVer（1.0.0）並以 x-app-version 追蹤 app 版本
- 新增 304（ETag 命中）與 429（速率限制）回應碼及 ETag/Cache-Control 回應標頭
- 提取共用 schema 至 components/schemas（CurrencyRateDetail、RatesResponse、PairInfo）
- 補齊全域 tags 陣列缺少的「幣對資訊」項目
- 新增 jsonSchemaDialect、x-changelog 宣告
- 補充歷史 API 可查詢日期範圍說明
- OpenData 頁新增 Swagger Editor 線上預覽入口
