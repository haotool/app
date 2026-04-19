---
'@app/ratewise': patch
---

PR #258 Codex review follow-up（P2：Markdown 鏡像未反跳脫 JS string literal escape）：

`extractFaqArray` 直接把 regex 擷取的原始碼片段丟進 `substituteTemplate`，沒有做 JS 字串反跳脫。像 `OPEN_DATA_PAGE_FAQ` 這類在 seo-metadata.ts 內使用 `` \` `` 的內容會被輸出為 `\`https://...\``（兩個字元，backslash + backtick），導致 Markdown 解析器不會把它當 inline code，鏡像與 HTML 頁語義不一致（已可見於 public/open-data.md）。

新增 `unescapeJsStringLiteral` 於 `substituteTemplate` 之後對 `\`` / `\n`/`\r`/`\t`/`\\`/`\$`等 escape sequence 做反跳脫，並包成`resolveLiteral`helper 統一 FAQ 與 description 抽取路徑。新增 2 條回歸測試守門：鏡像不得殘留`\``/`\n` escape 字元、open-data.md FAQ 必須包含 backtick 包住的 URL。
