---
'@app/ratewise': patch
---

修正 SpeakableSpecification JSON-LD 嵌套結構

根據 schema.org 規範，SpeakableSpecification 必須作為 Article/WebPage 的 speakable 屬性嵌套，而非獨立的 JSON-LD 區塊。

修改內容：

- 新增 buildWebPageJsonLd 函數，支援 speakable 屬性
- 修改 buildArticleJsonLd 函數，新增 speakableCssSelectors 選項
- 更新所有頁面的 JSON-LD 配置，將 speakable 嵌套至正確位置
- 標記舊的 buildSpeakableJsonLd 為 @deprecated
- 更新測試以驗證嵌套結構

參考：https://schema.org/speakable, https://developers.google.com/search/docs/appearance/structured-data/speakable
