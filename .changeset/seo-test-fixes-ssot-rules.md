---
'@app/ratewise': patch
---

fix(seo): 修正測試假陽性、template bleed 防護、verify-ssot-sync base path

- seo-metadata.ts：移除幣別模板 FAQ 中硬編碼的「日圓」範例（template bleed 根因）
- seo-ssot.test.ts：新增 14 個非 JPY 幣別頁 FAQ 不含「日圓/日幣」測試
- SEOHelmet.test.tsx：SPA no-cleanup 設計 — unmount 後標籤應保留
- seo-best-practices.test.ts：修正 robots.txt 路徑前綴與主題腳本行為驗證
- index.html.test.ts：安全腳本測試改為驗證行為（白名單值、localStorage），不依賴壓縮後變數名
- scripts/verify-ssot-sync.mjs：DEV_ONLY_PATHS 路徑比對補上 base path 前綴（/ratewise）
