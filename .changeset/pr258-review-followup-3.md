---
'@app/ratewise': patch
---

PR #258 Codex review follow-up（P2：非 AI 新 session 清除 ai_source）：

`trackAiReferral` 原本只在偵測到 AI 時 `set user_properties.ai_source`，從不清除。GA4 user property 是 user-scoped 且跨 session 持久化，導致使用者首次從 ChatGPT 到站後，下次直接開啟或從 Google 來，後續 direct / organic session 仍掛著 `ai_source=chatgpt`，污染 channel attribution 與 page_view 分析。

現改為：非 AI referrer 時主動 `ai_source: null` 清除；同 session 僅處理一次避免 reload 覆寫當下歸因。新增 2 條回歸測試（reset 行為、same-session 去重）。
