---
'@app/ratewise': minor
---

feat(seo): 新增開放資料 API 頁面，完整揭露台銀匯率資料管線與 E-E-A-T 權威性

- 新增 `src/pages/OpenData.tsx`：完整 API 文件頁（`/open-data/`）
  - 揭露資料管線：臺灣銀行 → GitHub Actions（每 5 分鐘）→ jsDelivr CDN / GitHub Raw
  - 雙端點說明：latest.json（最新）、history/{YYYY-MM-DD}.json（歷史）
  - 四語言程式碼範例：curl、JavaScript fetch、Python requests、深層連結模板
  - 支援幣別列表（18 種）、欄位結構說明表、速率限制與授權條款（GPL-3.0）
  - `HowTo` JSON-LD schema（4 步驟）、`Article` JSON-LD、`FAQPage` JSON-LD（5 題）
  - `Breadcrumb`、`SEOHelmet` 整合，canonical URL 完整
- `seo-metadata.ts`：新增 `OPEN_DATA_PAGE_FAQ`（5 條）與 `OPEN_DATA_PAGE_SEO` 常數
- `seo-paths.ts`：`CONTENT_SEO_PATHS` 加入 `/open-data/`
  - SEO_PATHS: 24 → 25；PRERENDER_PATHS: 32 → 33
- `seo-paths.config.mjs`：同步新增 `/open-data/` 至 Node.js SSOT
- `routes.tsx`：新增 `/open-data` lazy route
- `footer-links.ts`：核心頁面加入「開放資料 API」連結
- `public/api/latest.json`：`documentation` 指向 open-data 頁；新增 `llms` 欄位
- `scripts/generate-openapi.mjs`：`info` 新增 `x-documentation` 欄位
- `scripts/generate-llms-txt.mjs`：Core Pages 與 API 文件區段加入 open-data 連結
- `config/__tests__/seo-paths.test.ts`：更新長度斷言（25、33）並加入 `/open-data/` 測試
