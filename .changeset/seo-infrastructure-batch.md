---
'@app/ratewise': minor
---

feat(seo): 批次完成 SEO 基礎建設任務（P1-8、P2-7、P2-10、P2-11）

### P1-8: Cloudflare Worker Server-Timing 診斷標頭

- 新增 `buildServerTiming()` 函數，記錄 fetch/rewrite/total 耗時
- 輸出符合 RFC 8941 格式的 Server-Timing 標頭

### P2-7: open-data 頁面 TechArticle schema

- 新增 `buildTechArticleJsonLd()` 函數，支援 proficiencyLevel 和 dependencies 屬性
- 開發者文檔頁改用 TechArticle 替代通用 Article schema

### P2-10: GSC AI Overviews 監測 SOP 文件化

- 建立 `docs/dev/042_gsc_ai_sov_monitoring_sop.md`
- 定義 AI SoV 監測流程、報表模板與異常處理程序

### P2-11: AI 爬蟲存取記錄

- 在 Worker 新增 `detectAiCrawler()` 與 `isLlmDocPath()` 函數
- 記錄 llms.txt/.md 鏡像的 AI 爬蟲存取事件至 Cloudflare Logs
