---
'@app/ratewise': patch
---

修復兩處潛在資料污染：

1. **Markdown 鏡像未解析 token 改為直接 throw**：`generate-markdown-mirrors.mjs` 原先對未知 `${...}` 靜默降級為 `{...}` 輸出，導致 `OPEN_DATA_PAGE_FAQ` 內 `${RATES_API.latestCdn}` 等欄位被當作字面值發佈到 `public/open-data.md`，使 llms.txt 宣告的 API 文件提供錯誤端點字串。現改為：補齊 `RATES_API.*` 映射、未知 token 直接 throw；新增 `markdown-mirror.test.ts` 回歸測試（掃殘留 `${...}`/`{OBJECT.prop}`，並與 `api-endpoints.ts` 交叉驗證）。
2. **Copilot referrer 比對收斂**：`detectAiSource` 原本把整個 `bing.com` 網域歸類為 `copilot`，導致一般 Bing 搜尋點擊污染 GA4 `ai_source` user property 與 channel attribution。現改為：`copilot.microsoft.com` 全域命中；`bing.com` 僅在 `/chat` 或 `/copilotsearch` 路徑時才歸類；`pathname` 限定項目不參與 `utm_source` 比對。
