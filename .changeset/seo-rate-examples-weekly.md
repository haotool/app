---
'@app/ratewise': patch
---

feat(seo): 幣別頁 FAQ 加入具體台幣差距範例，每週自動更新

- 新增 scripts/update-seo-rate-examples.mjs：雙 API 比對（臺灣銀行現金 + open.er-api.com 市場中間價）
- 改以「換 3 萬元台幣」為情境，顯示現金換匯比 Google/XE 中間價多付多少元台幣
- 新增 src/config/generated/seo-rate-examples.ts：17 幣別靜態常數（自動生成）
- 更新 seo-metadata.ts：FAQ 改用 buildRateExampleSentence() 顯示具體台幣差異
- 新增 .github/workflows/update-seo-rate-examples.yml：每週一自動更新並提交
- 新增 package.json script: update:seo-examples
