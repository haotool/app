/**
 * SEO metadata SSOT barrel。
 * 實作拆為 core（types/常數/JSON-LD builders/頁面 SEO）與 currency-landing（幣別落地頁）。
 * 首屏模組（routes/SEOHelmet/AppLayout/HomepageSEOSection）必須直接 import `./core`，
 * 避免 barrel 靜態鏈把 currency-landing 與 personas 拉進 entry chunk（#647）；
 * lazy 頁面與測試維持單一 import 路徑 `config/seo-metadata`。
 */
export * from './core';
export * from './currency-landing';
