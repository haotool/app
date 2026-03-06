---
'@app/ratewise': patch
---

feat(ssot): 更新 SEO 驗證腳本，涵蓋 robots.txt 與新路徑群組

- seo-paths.ts 新增 APP_ONLY_NOINDEX_PATHS、DEV_ONLY_PATHS 語意匯出
- seo-paths.ts SEO_PATHS 加入 LEGAL_SSG_PATHS（與 MJS 對齊，22 路徑）
- seo-paths.ts SEO_FILES 補齊 /llms-full.txt
- verify-ssot-sync.mjs 新增 SEO_FILES 群組驗證
- verify-ssot-sync.mjs 新增 verifyRobotsTxt()：確保 robots.txt 與 SSOT 不漂移
