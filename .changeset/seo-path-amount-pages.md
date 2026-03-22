---
'@app/ratewise': minor
---

feat(seo): 金額長尾 SEO — 路徑型預渲染落地頁（Wise pattern）

- routes.tsx：新增 34 條 /:amount 子路由（17 forward + 17 reverse），複用現有 lazy import
- usePairAmountSEO：新增 useParams() 讀取，路徑型優先；canonical 改為路徑型 /usd-twd/500/
- seo-paths.config.mjs：新增 CURRENCY_AMOUNT_SEO_PATHS（~104 路徑）與 REVERSE_CURRENCY_AMOUNT_SEO_PATHS（~102 路徑）
- src/config/seo-paths.ts：同步新增兩個 amount path 常數供 vite.config.ts 使用
- vite.config.ts：includedRoutes 加入 amount paths，SSG 預渲染共 ~254 頁
- CurrencyLandingPage：常見金額連結由 ?amount= 改為路徑型（/usd-twd/500/）
- generate-sitemap-2025.mjs：sitemap 自動包含 248 個 URL（42 基礎頁 + 204+ 金額頁）
- update-seo-rate-examples.yml：GitHub Actions schedule 由每週一改為每日（更新鮮匯率數據）
