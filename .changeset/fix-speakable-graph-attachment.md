---
'@app/ratewise': patch
---

fix(seo): 修正 SpeakableSpecification 孤立節點問題

SpeakableSpecification 必須透過父實體的 speakable 屬性引用，
不能作為獨立節點出現在 @graph（驗證器與消費方會忽略孤立節點）。

- 新增 attachSpeakableToGraph() 至 seo-helmet-utils.ts
- SEOHelmet @graph 組裝後呼叫此函式，將 SpeakableSpecification
  移入第一個相容父實體（Article → TechArticle → HowTo → WebPage）
- 找不到相容父實體時以 WebPage 包裝作為後備容器
- 多個 SpeakableSpecification 的 cssSelector 會合併
- 新增 6 個單元測試覆蓋上述情境
