---
'@app/ratewise': minor
---

新增作者 E-E-A-T 信號：Person schema + About 頁作者資訊

- 新增 AUTHOR_PERSON SSOT（name: azlife，Threads sameAs，email）
- buildPersonJsonLd() 輸出 schema.org Person JSON-LD
- buildArticleJsonLd() author 改為 Person（非 Organization）提升 YMYL 信賴度
- ABOUT_PAGE_SEO.jsonLd 新增 Person schema（與 Article schema 並列）
- About 頁面新增「作者」區塊：姓名、Threads 連結、信箱，可見 E-E-A-T 信號
