---
'@app/ratewise': patch
---

fix(ratewise): 修復明洞換匯所雙向 FAQ 語意與台銀比較卡技術債

- buildAlternativeProviderFaq 新增 direction 參數（'to-twd' | 'twd-to-foreign'）
- /krw-twd/ 頁（to-twd）現在正確顯示 KRW→TWD 方向 FAQ（使用 rateBuy）
- /twd-krw/ 頁（twd-to-foreign）補齊缺失的明洞換匯所 FAQ
- ProviderComparisonCard 台銀欄：KRW→TWD 方向改顯示「現金買入估算」率
- ProviderComparisonCard 備注：依 direction 顯示正確說明文字
- update-moneybox-rates.yml commit 訊息補上 TWD buy 匯率欄位
