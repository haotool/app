---
'@app/ratewise': minor
---

feat(seo): FAQPage JSON-LD 擴展至全幣別（34 頁）+ @id 補全

- 正向幣對頁 FAQPage：從 5 個高流量幣別擴展至全部 17 個（新增 12 頁 Rich Result 覆蓋）
- 反向幣對頁 FAQPage：全部 17 個 twd-xxx 頁新增 FAQPage JSON-LD（新增 17 頁 Rich Result 覆蓋）
- ImageObject 加入穩定 `@id` URI（`#og-image`）強化 Knowledge Graph 圖片實體連結
- FinancialService 正反向頁均加入 `@id` URI（`#financial-service`）
- 反向頁 faqEntries 提取為函數作用域變數，消除 jsonLd 與 faqEntries 的資料重複
- THB 反向頁 FAQ 答案補強至 50+ 字符（schema.org 品質門檻）
