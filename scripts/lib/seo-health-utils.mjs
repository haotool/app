#!/usr/bin/env node
/* eslint-env node */

export function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

export function joinUrl(baseUrl, path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${stripTrailingSlash(baseUrl)}${normalizedPath}`;
}

export function getExpectedCanonicalUrl(canonicalBaseUrl, path) {
  return path === '/'
    ? `${stripTrailingSlash(canonicalBaseUrl)}/`
    : joinUrl(canonicalBaseUrl, path);
}

export function resolveAuditBaseUrls(config, customBaseUrl = undefined) {
  const canonicalBaseUrl = stripTrailingSlash(config.siteUrl);
  const requestBaseUrl = stripTrailingSlash(customBaseUrl || config.siteUrl);

  return {
    canonicalBaseUrl,
    requestBaseUrl,
  };
}

/** 從 app.config APP_CONFIG.seoValidation 解析生產 SEO 驗證旗標（預設全開）。 */
export function resolveSeoValidationFlags(config) {
  return {
    expectSitemapHreflang: config.seoValidation?.sitemapHreflang !== false,
    requireTrue404: config.seoValidation?.requireTrue404 !== false,
  };
}
