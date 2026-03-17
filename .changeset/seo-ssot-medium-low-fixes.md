---
'@app/ratewise': patch
---

fix(seo): MEDIUM + LOW 優先 SSOT 清理與 SEO 結構修復

MEDIUM — seo-metadata.ts SSOT 修復：

- `OPEN_DATA_PAGE_FAQ` 3 個答案：hardcode CDN/Raw URL → `RATES_API.latestCdn/latestRaw/historyCdnExample`
- `OPEN_DATA_PAGE_FAQ` 幣別數量：hardcode `18` → `${SUPPORTED_CURRENCY_COUNT}`
- HowTo step 2 text：hardcode CDN URL → `RATES_API.latestCdn`
- `ABOUT_PAGE_FAQ` 聯繫方式：hardcode email/GitHub → `APP_INFO.email/github`
- `ABOUT_PAGE_FAQ` sitemap 條目數：hardcode `24` → `${SEO_PATHS.length}`（現為 25）
- `OPEN_DATA_PAGE_SEO.jsonLd`：新增 `buildShareImageJsonLd()`（補 OG image JSON-LD）
- seo-metadata.ts imports：新增 `RATES_API`、`SEO_PATHS`

LOW — Footer 重複連結移除：

- 亞洲貨幣 section：移除與「熱門匯率」重複的 USD/JPY/HKD/CNY/KRW
  → 替換為 SGD, THB, PHP, MYR, IDR, VND（6 個非重複亞洲幣別）
- 歐美貨幣 section：移除與「熱門匯率」重複的 EUR
  → 保留 GBP, AUD, CAD, NZD, CHF（5 個非重複歐美幣別）
- `footer-links.test.ts`：新增跨 section 重複 href 驗證（`should have no duplicate hrefs across all sections`）

LOW — Sitemap OG image：

- `generate-sitemap-2025.mjs PAGE_IMAGES`：補 `/open-data/` OG image 條目（先前遺漏）
- 重新生成 `public/sitemap.xml`（25 個 URL，9 個頁面有圖片）
- `seo-paths.config.mjs` 注解：更正 `24 個` → `25 個`
