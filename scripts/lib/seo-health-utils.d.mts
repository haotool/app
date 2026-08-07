// seo-health-utils.mjs 型別宣告（#900）：實作以 .mjs 為 SSOT，本檔僅描述既有 export 形狀。

export interface SeoValidationFlags {
  expectSitemapHreflang: boolean;
  requireTrue404: boolean;
}

export function stripTrailingSlash(value: string): string;
export function joinUrl(baseUrl: string, path: string): string;
export function getExpectedCanonicalUrl(canonicalBaseUrl: string, path: string): string;
export function resolveAuditBaseUrls(
  config: { siteUrl: string },
  customBaseUrl?: string,
): { canonicalBaseUrl: string; requestBaseUrl: string };
export function resolveSeoValidationFlags(config: {
  seoValidation?: { sitemapHreflang?: boolean; requireTrue404?: boolean };
}): SeoValidationFlags;
