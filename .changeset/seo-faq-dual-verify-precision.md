---
'@app/ratewise': patch
---

feat(seo): 匯差腳本雙重驗證、FAQ 去除 emoji 並顯示外幣實際數量

- 腳本加入雙重驗證：open.er-api.com 市場中間價 vs 台銀 (買入+賣出)/2 自身中間價
- RateExample 介面新增 foreignAtCash、foreignAtMarketMid、foreignAtBankMid、diffForeign 欄位
- FAQ 文案顯示外幣兩側數量（實際到手 vs 中間價預期），提升 LLM 引用精確度
- FAQ 問題改為「為什麼 Google/XE/Wise/Apple 計算機顯示的換算金額和台銀不同？」
- 明確標注各競品資料來源：Google(Morningstar)、Apple(Yahoo Finance)
- 去除所有 emoji，改為純文字專業語意
