---
'@app/ratewise': patch
---

SEO 最佳化：E-E-A-T 信號、標題階層、logo srcset、code-split

- seo-metadata.ts：新增 `buildArticleJsonLd` helper，為 FAQ/Guide/About 頁加上 Article schema（`datePublished`、`dateModified`、`author`、`publisher`）
- FAQ.tsx / About.tsx：傳入 `jsonLd` prop 啟用 Article structured data
- Settings.tsx：H1 直接接 H3 的標題階層問題修復，所有 section 標題由 `h3` 改為 `h2`
- AppLayout.tsx：logo 圖片加入 `srcset`（1x / 2x / 4x），alt 文字補完品牌全名
- About.tsx：about 頁正文以「本工具」取代重複品牌名稱，降低關鍵字密度
- routes.tsx：`MultiConverter`、`Favorites`、`Settings` 改為 `lazyWithRetry` 動態載入，減少初始 app.js 體積
