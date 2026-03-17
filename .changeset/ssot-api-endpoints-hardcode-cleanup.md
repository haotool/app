---
'@app/ratewise': patch
---

refactor(ssot): 消除 OpenData 硬編碼 URL、建立 api-endpoints.ts SSOT 模組

- 新增 `src/config/api-endpoints.ts`：集中管理所有 jsDelivr CDN 與 GitHub Raw API 端點 URL
  - `RATES_API`：latestCdn、latestRaw、historyCdnExample、historyRawExample、actionsUrl
  - `CDN_DATA_BASE`、`RAW_DATA_BASE` 從 `APP_INFO.github` 動態解析，無任何 hardcode
- `OpenData.tsx` SSOT 修復（9 項 hardcode 消除）：
  - CDN/GitHub API 端點 URL → 改用 `RATES_API.*`
  - canonical URL → `SITE_CONFIG.url + 'open-data/'`
  - 深層連結範例 → `SITE_CONFIG.url`
  - GitHub 連結（Actions、原始碼）→ `APP_INFO.github`
  - 授權連結 → `APP_INFO.licenseUrl`、`APP_INFO.license`
  - 商業聯繫 email → `APP_INFO.email`（inline rules section）
  - 支援幣別清單 → 從 `CURRENCY_DEFINITIONS` SSOT 動態導出，自動同步幣別數量
- `seo-metadata.ts`：OPEN_DATA_PAGE_FAQ email hardcode → `APP_INFO.email`（template literal）
- 新增測試：
  - `src/config/__tests__/api-endpoints.test.ts`：14 項 SSOT 一致性測試
  - `src/config/__tests__/footer-links.test.ts`：11 項 Footer 結構與合規性測試
