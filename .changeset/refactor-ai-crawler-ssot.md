---
'@app/ratewise': patch
---

refactor(seo): 抽出 AI 爬蟲清單共用 SSOT，修復 llms.txt 與 robots.txt AI crawler 漂移

- 新增 `scripts/lib/ai-crawlers.mjs` 作為 37 個 AI 爬蟲四層治理（TRAINING / SEARCH / USER_AGENT / PREVIEW）的單一來源
- `generate-robots-txt.mjs` 改由共用 SSOT 迴圈產生，移除 4 組本地硬編陣列
- `generate-llms-txt.mjs` 的 `AI/LLM Access Control` 區塊原本只列 8 個爬蟲（舊 hardcode 與 robots.txt 嚴重漂移），改為引用共用 SSOT 並追加 Policy tiers 分層說明
- 副作用修復：llms.txt / llms-full.txt 現在明確列出 `Claude-SearchBot`、`Claude-User`、`Perplexity-User`、`OAI-SearchBot` 等 AI 搜尋代理，補齊 Claude / Perplexity 引用路徑的 AI 存取宣告
- 測試補強：`build-scripts.test.ts` 斷言兩個生成器都必須 import `./lib/ai-crawlers.mjs`；`llms-txt.spec.ts` 驗證 Policy tiers 與 8 個關鍵爬蟲存在；`seo-best-practices.test.ts` 新增三層角色區分與 Claude-SearchBot / Claude-User 顯式允許斷言
- 驗證：regen 後 robots.txt / llms.txt / llms-full.txt 位元相等；175 個相關測試全綠；verify-ssot-sync 通過
