---
'@app/ratewise': patch
---

PR #258 Codex review follow-up（兩項 P1 修復）：

1. **robots.txt 專屬 bot 群組補齊共用 Disallow**：`User-agent: GPTBot` 等 AI 專屬群組原本只輸出 `Allow: /`，依 RFC 9309，specific user-agent group 完全覆蓋 `User-agent: *`，不會繼承。這讓 GPTBot / ClaudeBot 等可抓取原本封鎖的 `sw.js`、`workbox-*.js` 與開發專用頁面（`theme-showcase`、`color-scheme`、`update-prompt-test`、`ui-showcase`）。現改為抽出 `SHARED_DISALLOW` 常數，`*` 與所有 AI bot 群組一律輸出相同 Disallow 清單。
2. **移除 generate-markdown-mirrors 內 Prettier 格式化**：違反 `AGENTS.md` § Prettier 格式漂移修法（prebuild 腳本禁止呼叫 `prettier.format()` / `prettier.resolveConfig()`）。現改為 deterministic 直接寫檔，並將 `public/{faq,about,privacy,guide,open-data}.md` 加入 `.prettierignore`，避免 prebuild 與 lint-staged 之間反覆漂移。
