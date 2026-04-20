---
'@app/ratewise': patch
---

PR #258 Codex review follow-up（P2：trackAiReferral 狀態機重構）：

原本的 sessionStorage flag `'1'` 會一刀切地跳過同 tab 後續所有呼叫，導致「同分頁先直接進站（旗標設 1）→ 稍後從 ChatGPT 再進站」的情境漏送 `ai_referral` 事件，系統性低估 AI 導流歸因。

改為 state-transition 模型：sessionStorage 儲存當前 `ai_source`（空字串代表 null），每次呼叫比對 `previous vs next`，僅在狀態轉換時送事件：

- `null → ''`：首次直接進站，清除前次殘留
- `'' → 'chatgpt'`：直接後接 AI → 送 ai_referral
- `'chatgpt' → 'chatgpt'`：reload 去重
- `'chatgpt' → ''`：換自行打字 → 清除
- `'chatgpt' → 'perplexity'`：切 AI 來源 → 重新送

新增 2 條回歸測試覆蓋「直接→AI」與「AI→換 AI 來源」兩個狀態轉換。
