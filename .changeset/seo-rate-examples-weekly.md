---
'@app/ratewise': patch
---

feat(seo): 幣別頁 FAQ 加入具體台幣差距範例，每週自動更新

- 新增 scripts/update-seo-rate-examples.mjs：從臺灣銀行牌告匯率計算各幣別現金 vs 即期差距
- 新增 src/config/generated/seo-rate-examples.ts：17 幣別靜態常數（自動生成）
- 更新 seo-metadata.ts：FAQ 改用 buildRateExampleSentence() 顯示具體台幣差異
- 新增 .github/workflows/update-seo-rate-examples.yml：每週一自動更新並提交
- 新增 package.json script: update:seo-examples
