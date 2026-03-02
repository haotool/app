---
'@app/ratewise': patch
---

新增 llms-full.txt 並強化 LLM/AI 即時匯率調用文件

- 新增 llms-full.txt 完整版（含 JSON API schema、JavaScript/Python fetch 範例、完整幣別表）
- llms.txt 加入 `## Tool Use` 區塊，提供 LLM function calling 步驟與匯率選擇指南
- llms.txt Optional 區塊加入 llms-full.txt 連結
- seo-paths.config.mjs SEO_FILES 新增 /llms-full.txt
- generate-llms-txt.mjs 同時輸出 llms.txt（精簡索引）與 llms-full.txt（完整技術文件）
