/**
 * SEO metadata SSOT barrel。
 * 實作拆為 core（types/常數/JSON-LD builders/頁面 SEO）與 currency-landing（幣別落地頁），
 * 對外維持單一 import 路徑 `config/seo-metadata`。
 */
export * from './core';
export * from './currency-landing';
