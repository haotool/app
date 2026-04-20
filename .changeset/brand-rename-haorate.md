---
'@app/ratewise': patch
'@app/haotool': patch
---

品牌改名：RateWise → HaoRate（網址與功能維持不變）。

- `app-info.ts` SSOT 改 `BRAND_SHORT_NAME = 'HaoRate'`，全站 title / manifest / llms.txt / openapi / offline / Markdown mirrors 透過 prebuild 自動跟隨
- `scripts/generate-sitemap-2025.mjs` 改從 `APP_INFO` 取品牌，sitemap image captions 不再硬寫舊名
- `scripts/verify-production-seo.mjs` llms.txt 熱門匯率驗證的 display-name 門檻改為 `HaoRate`
- `apps/haotool` 首頁 / meta / jsonld / llms.txt 對本站的作品集標籤同步改為「HaoRate 匯率計算機」
- Brand SSOT 哨兵（`build-scripts.test.ts`）改鎖 `HaoRate`，維持「禁止在 SSOT 以外寫死品牌字串」契約

網址保持 `/ratewise/` 不變（工作區代號、component 檔名、套件名均為 permanent technical identifier），link equity 與 PWA identity 完全保留，使用者體驗零中斷。
