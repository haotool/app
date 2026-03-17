---
'@app/ratewise': patch
---

fix(seo): 補 Article schema + 修首頁 DEFAULT_DESCRIPTION 截斷

Article JSON-LD 補完：

- `SELL_RATE_VS_MID_RATE_PAGE`：新增 `buildArticleJsonLd()`（articleSection: 匯率知識）
- `CASH_VS_SPOT_RATE_PAGE`：新增 `buildArticleJsonLd()`
- `CARD_RATE_GUIDE_PAGE`：新增 `buildArticleJsonLd()`
- 三頁均加 keywords、articleBody（符合 Google Featured Snippet 條件）

DEFAULT_DESCRIPTION 截斷修復：

- 舊版：200+ dw（遠超 SERP 160 dw 截斷上限）
- 新版：117 dw「RateWise 顯示臺灣銀行牌告的實際買賣價（非中間價），讓你換匯前知道真正要付多少台幣。支援 N 種貨幣，每 5 分鐘同步，免費無廣告。」
