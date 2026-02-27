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

export function resolveAuditBaseUrls(config, customBaseUrl) {
  const canonicalBaseUrl = stripTrailingSlash(config.siteUrl);
  const requestBaseUrl = stripTrailingSlash(customBaseUrl || config.siteUrl);

  return {
    canonicalBaseUrl,
    requestBaseUrl,
  };
}
