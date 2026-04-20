---
'@app/ratewise': patch
---

feat(seo): AI 時代爬蟲四層治理、AI referral 追蹤與 Markdown 鏡像

- robots.txt 重構為四層語意分組（training / search / user-agent / preview），便於日後 training opt-out 切換
- 新增 AI referral GA4 事件：支援 ChatGPT、Perplexity、Claude、Gemini、Copilot、Grok、Mistral、You、Phind 等 9 個平台來源識別
- 新增 5 個 Markdown 鏡像頁（faq/about/privacy/guide/open-data），提供 LLM 友善的純文字版本，內容與 HTML 語意一致避免 cloaking
