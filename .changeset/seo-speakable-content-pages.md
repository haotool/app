---
'@app/ratewise': patch
---

feat(seo): 補齊 6 個內容頁 SpeakableSpecification schema

- GUIDE_PAGE_SEO、OPEN_DATA_PAGE_SEO、ABOUT_PAGE_SEO 的 jsonLd 陣列加入 buildSpeakableJsonLd(['h1'])
- SELL_RATE_VS_MID_RATE_PAGE、CASH_VS_SPOT_RATE_PAGE、CARD_RATE_GUIDE_PAGE 的
  jsonLd 由單一 buildArticleJsonLd() 轉換為陣列並附加 Speakable schema
- 新增 6 個 TDD 測試確保所有內容頁 Speakable 覆蓋率
