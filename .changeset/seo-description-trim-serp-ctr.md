---
'@app/ratewise': patch
---

fix(seo): 修正 meta description 超出 160 display-width 截斷（SERP CTR 影響）

- `ABOUT_PAGE_SEO.description`：194 display-width → 149（重寫為更精準的品牌定位）
- `FAQ_PAGE_SEO.description`：183 display-width → 117（移除關鍵字堆疊，改為重點摘要）
- `OPEN_DATA_PAGE_SEO.description`：168 display-width → 124（精簡技術說明）
- 幣別頁 description template：移除 `${override.question}` 片段，最長從 169 降至 143（JPY/CNY/SEK/PHP/CAD/SGD 均通過）
- TypeScript：`footer-links.test.ts` 補 non-null assertion `FOOTER_SECTIONS[0]!` 消除 TS18048
