---
'@app/ratewise': patch
---

feat(seo): robots.txt 改由 SSOT 腳本自動生成

- 新增 `scripts/generate-robots-txt.mjs`：從 seo-paths.config.mjs 讀取 SITE_CONFIG、DEV_ONLY_PATHS
- seo-paths.config.mjs 新增 `DEV_ONLY_PATHS`（開發展示頁）、`APP_ONLY_NOINDEX_PATHS`（使用者功能頁）
- Sitemap URL 從 SITE_CONFIG.url 自動推導，不再硬編碼
- 日期欄位 BUILD_DATE 每次 prebuild 自動更新
- /multi, /favorites, /settings 改由 SEOHelmet noindex 處理（移除 Disallow，符合 Google 建議）
- 補上先前遺漏的 /theme-showcase Disallow
- robots.txt 加入 .prettierignore（prebuild 產出物，不需格式化）
