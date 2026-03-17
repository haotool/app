---
'@app/ratewise': patch
---

feat(seo): PR-based 匯率更新流程、About 頁 SEO 透明度 FAQ、架構圖文件

- update-seo-rate-examples.yml：改用 peter-evans/create-pull-request@v8，不再直接 push main
  - 每次更新建立 chore/weekly-seo-rate-update PR，通過 CI 後 auto squash merge
  - 新增 pull-requests: write 權限
  - 移除舊版手動 git commit + git push 步驟
- seo-metadata.ts：About 頁 ABOUT_PAGE_FAQ 新增 3 條 SEO 技術透明度 FAQ
  - 「匯差數字如何保持最新且讓搜尋引擎正確讀取」（SSG + 雙重驗證機制）
  - 「哪些結構化資料讓搜尋摘要顯示更豐富」（8 種 JSON-LD schema 揭露）
  - 「是否支援 AI 搜尋引擎與 LLM 引用」（18 AI bots + llms.txt + openapi.json）
- ABOUT_PAGE_SEO：title/description/keywords 更新以涵蓋 SEO 技術特色
- docs/SEO_GUIDE.md：升至 v2.0.0，新增三張 Mermaid 圖
  - 技術架構全覽 flowchart（資料層 → PR 層 → 建置層 → 邊緣層 → 爬蟲層）
  - 匯差數據自動化狀態機 stateDiagram（含錯誤中止路徑）
  - Google 爬蟲索引流程驗證 flowchart（Stage 1–8 完整對照）
