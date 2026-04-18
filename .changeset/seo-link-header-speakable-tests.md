---
'@app/ratewise': patch
---

feat(seo): Link header 指引 + Speakable schema 整合測試 + SEO SSOT 文件更新

- `_headers` 加入 RFC 8288 `Link: <...md>; rel="alternate"; type="text/markdown"`，讓 AI 爬蟲從 HTML 頁自動發現 5 個 Markdown 鏡像
- 新增 `seo-speakable.test.ts` 29 個整合測試，驗證 7 個核心內容頁的 SpeakableSpecification 正確嵌套於 Article/WebPage schema（防 drift 回歸）
- `docs/SEO_MASTER_SSOT.md` 升至 v2.1.0：§2.3 加入 .md 鏡像與 Link header；§6.5 新增 AI referral 追蹤規格；§8 重構為四層語意分組；§14 補記完成紀錄與新 P1/P2 項目
