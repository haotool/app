---
'@app/ratewise': patch
---

PR #258 review follow-up（三項 SSOT 對齊）：

1. **`trackAiReferral()` 先於首次 `page_view`**：`main.tsx` 原本先送 `trackPageview`、再 `trackAiReferral`，導致首個（也最重要的）AI 落地 `page_view` 少帶 `ai_source` user property，GA4 歸因會把 AI 首次造訪誤判為 none。現改為：`trackAiReferral()` → `trackPageview()`，讓第一筆 page_view 即帶 ai_source。
2. **`buildOpenDataMd` 改用 `RATES_API` SSOT**：端點表格、curl / JS / Python 範例原本硬編碼 `haotool/app@data` 路徑；改用同檔 `RATES_API.latestCdn / latestRaw / CDN_DATA_BASE`，倉庫路徑或資料分支變更時 `public/open-data.md` 自動同步。
3. **`rename-drill.mjs` 動態讀取當前品牌**：`ORIGINAL_SHORT_NAME` 原本硬寫 `'RateWise'`，一旦真的完成改名，drill 會在啟動階段直接 fail。現改為：以 regex 動態讀 `app-info.ts` 當前 `BRAND_SHORT_NAME` 值，drill 可於任意品牌名稱下重複執行並驗證 SSOT 散播契約。
