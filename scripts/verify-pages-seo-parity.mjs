#!/usr/bin/env node

/**
 * Compare a Pages candidate with the public SEO/PWA contract without a browser.
 * Usage:
 *   node scripts/verify-pages-seo-parity.mjs \
 *     --candidate-url=https://candidate.pages.dev \
 *     --api-url=https://app.haotool.org/ratewise/api/ratings
 */

import { discoverApps } from './lib/workspace-utils.mjs';

const candidateUrl = readArg('--candidate-url');
const requestedTimeoutMs = Number(readArg('--timeout-ms') ?? 30000);
const timeoutMs =
  Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs > 0 ? requestedTimeoutMs : 30000;
const apiUrl = readArg('--api-url');
const contractOnly = process.argv.includes('--contract-only');
const REQUIRED_STATIC_HEADERS = ['content-type', 'cache-control'];
const PWA_FIELDS = ['scope', 'start_url', 'display', 'name', 'short_name'];
const DYNAMIC_VISIBLE_TEXT_PATHS = new Set(['/quake-school/quiz/']);

function readArg(prefix) {
  return process.argv.find((arg) => arg.startsWith(`${prefix}=`))?.slice(prefix.length + 1);
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function joinUrl(base, path) {
  return `${trimTrailingSlash(base)}/${path.replace(/^\/+/, '')}`.replace(/([^:]\/)\/+/g, '$1');
}

function joinPath(basePath, path) {
  return `${basePath}${path === '/' ? '/' : path}`.replace(/\/+/g, '/');
}

function extractFirst(html, expression) {
  return html.match(expression)?.[1]?.replace(/\s+/g, ' ').trim() ?? null;
}

function extractMeta(html, attribute, value) {
  const target = value.toLowerCase();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = Object.fromEntries(
      [...match[0].matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)].map(([, key, content]) => [
        key.toLowerCase(),
        content,
      ]),
    );
    if (attributes[attribute] === target) return attributes.content?.trim() ?? null;
  }
  return null;
}

function extractCanonical(html) {
  const canonicalTag = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] ?? '';
  return canonicalTag.match(/href=["']([^"']+)["']/i)?.[1]?.trim() ?? null;
}

function extractAssetReferences(html) {
  return [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
    .map(([, value]) => value.trim())
    .filter((value) => /^(?:\.?\.?\/|\/)/.test(value))
    .map(normalizeAssetReference)
    .sort();
}

function normalizeAssetReference(value) {
  return value.replace(
    /(^|\/)([^/]+)-[A-Za-z0-9_-]{6,}(\.[A-Za-z0-9]+)(?=[?#]|$)/,
    (_match, prefix, _hash, extension) => `${prefix}:hashed${extension}`,
  );
}

function extractVisibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\b[^>]*>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|lt|gt);/gi, decodeVisibleTextEntity)
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeVisibleTextEntity(entity) {
  switch (entity.toLowerCase()) {
    case '&nbsp;':
      return ' ';
    case '&amp;':
      return String.fromCharCode(38);
    case '&lt;':
      return String.fromCharCode(60);
    case '&gt;':
      return String.fromCharCode(62);
    default:
      return entity;
  }
}

function normalizeVisibleText(value) {
  return value
    .replace(/\d{1,4}月\d{1,2}日/g, ':date:')
    .replace(/\d{1,2}\/\d{1,2}(?=\s|$)/g, ':date:')
    .replace(/\d{1,2}:\d{2}/g, ':time:');
}

function normalizeJson(value) {
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'dateModified')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, normalizeJson(entry)]),
  );
}

function extractJsonLd(html) {
  const documents = [];
  for (const [, body] of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      documents.push(normalizeJson(JSON.parse(body.trim())));
    } catch {
      documents.push({ invalid: true });
    }
  }
  return JSON.stringify(documents);
}

function normalizeFinalPath(value) {
  const url = new URL(value);
  return `${url.pathname}${url.search}`;
}

function isHashedAsset(path) {
  return /\/assets\/[^/]+-[A-Za-z0-9_-]{6,}\.[A-Za-z0-9]+$/.test(path);
}

function expectedContentType(path) {
  if (path.endsWith('.webmanifest')) return 'application/manifest+json';
  if (path.endsWith('.md')) return 'text/markdown';
  if (path.endsWith('.xml')) return 'xml';
  if (path.endsWith('.txt')) return 'text/plain';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'javascript';
  if (path.endsWith('.html') || path.endsWith('/')) return 'text/html';
  return null;
}

function assertStaticHeaders(path, response, failures) {
  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  const expected = expectedContentType(path);
  if (expected && !contentType.includes(expected)) {
    failures.push(
      `${path}: content-type ${contentType || '(missing)'} does not contain ${expected}`,
    );
  }

  const cacheControl = (response.headers.get('cache-control') ?? '').toLowerCase();
  if (isHashedAsset(path) && !cacheControl.includes('immutable')) {
    failures.push(`${path}: hashed asset is not immutable-cached`);
  }
  if (
    /\/(?:sw|registerSW|workbox-[^/]+)\.js$/.test(path) &&
    !/no-cache|no-store/.test(cacheControl)
  ) {
    failures.push(`${path}: service worker is not no-cache/no-store`);
  }
  if (path.endsWith('.webmanifest') && !cacheControl.includes('must-revalidate')) {
    failures.push(`${path}: manifest is missing must-revalidate`);
  }
  if (expected === 'text/html' && !/no-cache|max-age=0/.test(cacheControl)) {
    failures.push(`${path}: HTML is not no-cache or max-age=0`);
  }

  for (const header of REQUIRED_STATIC_HEADERS) {
    if (header === 'content-type' && expected && !contentType)
      failures.push(`${path}: missing ${header}`);
    if (header === 'cache-control' && !cacheControl) failures.push(`${path}: missing ${header}`);
  }
  if (['/og-image.png', '/ratewise/og-image.jpg'].includes(path)) {
    if (response.headers.get('access-control-allow-origin') !== '*') {
      failures.push(`${path}: share image is missing wildcard CORS`);
    }
  }
}

async function fetchText(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      redirect: 'follow',
      headers: {
        'user-agent': 'haotool-pages-seo-parity/1.0',
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
    return {
      url,
      finalUrl: response.url,
      status: response.status,
      headers: response.headers,
      body: await response.text(),
    };
  } finally {
    clearTimeout(timer);
  }
}

function compareHtml(path, baseline, candidate, failures) {
  if (baseline.status !== candidate.status)
    failures.push(`${path}: status ${baseline.status} != ${candidate.status}`);
  if (normalizeFinalPath(baseline.finalUrl) !== normalizeFinalPath(candidate.finalUrl))
    failures.push(`${path}: final URL path differs`);

  const fields = [
    [
      'title',
      extractFirst(baseline.body, /<title[^>]*>([\s\S]*?)<\/title>/i),
      extractFirst(candidate.body, /<title[^>]*>([\s\S]*?)<\/title>/i),
    ],
    [
      'description',
      extractMeta(baseline.body, 'name', 'description'),
      extractMeta(candidate.body, 'name', 'description'),
    ],
    [
      'robots',
      extractMeta(baseline.body, 'name', 'robots'),
      extractMeta(candidate.body, 'name', 'robots'),
    ],
    ['canonical', extractCanonical(baseline.body), extractCanonical(candidate.body)],
    [
      'og:url',
      extractMeta(baseline.body, 'property', 'og:url'),
      extractMeta(candidate.body, 'property', 'og:url'),
    ],
    [
      'og:title',
      extractMeta(baseline.body, 'property', 'og:title'),
      extractMeta(candidate.body, 'property', 'og:title'),
    ],
    [
      'og:description',
      extractMeta(baseline.body, 'property', 'og:description'),
      extractMeta(candidate.body, 'property', 'og:description'),
    ],
    [
      'og:image',
      extractMeta(baseline.body, 'property', 'og:image'),
      extractMeta(candidate.body, 'property', 'og:image'),
    ],
    [
      'twitter:card',
      extractMeta(baseline.body, 'name', 'twitter:card'),
      extractMeta(candidate.body, 'name', 'twitter:card'),
    ],
    [
      'twitter:title',
      extractMeta(baseline.body, 'name', 'twitter:title'),
      extractMeta(candidate.body, 'name', 'twitter:title'),
    ],
    [
      'twitter:description',
      extractMeta(baseline.body, 'name', 'twitter:description'),
      extractMeta(candidate.body, 'name', 'twitter:description'),
    ],
    [
      'twitter:image',
      extractMeta(baseline.body, 'name', 'twitter:image'),
      extractMeta(candidate.body, 'name', 'twitter:image'),
    ],
    [
      'h1',
      extractFirst(baseline.body, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
      extractFirst(candidate.body, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
    ],
    [
      'asset-references',
      JSON.stringify(extractAssetReferences(baseline.body)),
      JSON.stringify(extractAssetReferences(candidate.body)),
    ],
    ['json-ld', extractJsonLd(baseline.body), extractJsonLd(candidate.body)],
  ];
  for (const [name, expected, actual] of fields) {
    if (expected !== actual) failures.push(`${path}: ${name} differs`);
  }
  if (!DYNAMIC_VISIBLE_TEXT_PATHS.has(path)) {
    const expectedVisibleText = normalizeVisibleText(extractVisibleText(baseline.body));
    const actualVisibleText = normalizeVisibleText(extractVisibleText(candidate.body));
    if (expectedVisibleText !== actualVisibleText) failures.push(`${path}: visible-text differs`);
  }
  if (candidate.body.includes(new URL(candidateUrl).hostname))
    failures.push(`${path}: candidate host leaked into HTML`);
  if (!candidate.body.trim()) failures.push(`${path}: empty HTML response`);
  assertStaticHeaders(path, candidate, failures);
}

function compareHtmlContract(path, candidate, expectedCanonicalUrl, failures) {
  if (candidate.status !== 200) failures.push(`${path}: status ${candidate.status} != 200`);
  if (normalizeFinalPath(candidate.finalUrl) !== normalizeFinalPath(expectedCanonicalUrl))
    failures.push(`${path}: final URL path differs from configured canonical path`);

  const title = extractFirst(candidate.body, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = extractMeta(candidate.body, 'name', 'description');
  const canonical = extractCanonical(candidate.body);
  if (!title) failures.push(`${path}: title is missing`);
  if (!description) failures.push(`${path}: description is missing`);
  if (!canonical) failures.push(`${path}: canonical is missing`);
  else if (canonical !== expectedCanonicalUrl)
    failures.push(`${path}: canonical differs from SSOT`);

  const ogUrl = extractMeta(candidate.body, 'property', 'og:url');
  if (ogUrl && ogUrl !== expectedCanonicalUrl) failures.push(`${path}: og:url differs from SSOT`);
  if (!candidate.body.trim()) failures.push(`${path}: empty HTML response`);
  if (candidate.body.includes(new URL(candidateUrl).hostname))
    failures.push(`${path}: candidate host leaked into HTML`);
  assertStaticHeaders(path, candidate, failures);
}

function normalizeTextResource(body) {
  return body
    .replace(/^Content-Signal:.*$/gim, '')
    .replace(/<lastmod>[^<]+<\/lastmod>/g, '<lastmod></lastmod>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function compareResource(path, baseline, candidate, failures) {
  if (baseline.status !== candidate.status) failures.push(`${path}: resource status differs`);
  assertStaticHeaders(path, candidate, failures);
  if (path.endsWith('.xml') || path.endsWith('.txt') || path.endsWith('.md')) {
    if (normalizeTextResource(baseline.body) !== normalizeTextResource(candidate.body))
      failures.push(`${path}: resource content differs`);
  }
}

async function compareResourceContract(path, candidate, failures) {
  if (candidate.status !== 200)
    failures.push(`${path}: resource status ${candidate.status} != 200`);
  if (candidate.body.includes(new URL(candidateUrl).hostname))
    failures.push(`${path}: candidate host leaked into resource`);
  assertStaticHeaders(path, candidate, failures);
}

function compareManifest(path, baseline, candidate, failures) {
  try {
    const expected = JSON.parse(baseline.body);
    const actual = JSON.parse(candidate.body);
    for (const field of PWA_FIELDS) {
      if (expected[field] !== actual[field]) failures.push(`${path}: manifest ${field} differs`);
    }
  } catch {
    failures.push(`${path}: invalid manifest JSON`);
  }
}

function normalizeBasePath(path) {
  const normalized = `/${path.replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '/' : `${normalized}/`;
}

function isWithinBasePath(path, basePath) {
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  return basePath === '/' || normalizedPath === basePath || normalizedPath.startsWith(basePath);
}

function validateManifestContract(path, candidate, expectedCanonicalUrl, appBasePath, failures) {
  try {
    const manifest = JSON.parse(candidate.body);
    for (const field of PWA_FIELDS) {
      if (typeof manifest[field] !== 'string' || !manifest[field].trim())
        failures.push(`${path}: manifest ${field} is missing`);
    }
    const expectedOrigin = new URL(expectedCanonicalUrl).origin;
    const expectedBasePath = normalizeBasePath(appBasePath);
    for (const field of ['scope', 'start_url']) {
      if (typeof manifest[field] !== 'string' || !manifest[field].trim()) continue;
      const value = new URL(manifest[field], expectedCanonicalUrl);
      if (value.origin !== expectedOrigin || !isWithinBasePath(value.pathname, expectedBasePath))
        failures.push(`${path}: manifest ${field} escapes app base path ${expectedBasePath}`);
    }
  } catch {
    failures.push(`${path}: invalid manifest JSON`);
  }
}

function extractPrecacheUrls(body) {
  return [...body.matchAll(/["']?url["']?\s*:\s*["']([^"']+)["']/g)]
    .map(([, url]) => normalizeAssetReference(url))
    .sort();
}

function compareServiceWorker(path, baseline, candidate, failures) {
  if (
    JSON.stringify(extractPrecacheUrls(baseline.body)) !==
    JSON.stringify(extractPrecacheUrls(candidate.body))
  )
    failures.push(`${path}: precache URLs differ`);
}

function validateServiceWorkerContract(path, candidate, failures) {
  if (!extractPrecacheUrls(candidate.body).length)
    failures.push(`${path}: precache URLs are missing`);
}

async function verifyApiContract(failures) {
  if (!apiUrl) return 0;
  const origin = 'https://app.haotool.org';
  const options = await fetchText(apiUrl, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  if (options.status !== 204) failures.push(`API OPTIONS: status ${options.status} != 204`);
  if (options.headers.get('access-control-allow-origin') !== origin)
    failures.push('API OPTIONS: CORS origin differs');
  if (!options.headers.get('access-control-allow-methods')?.includes('GET'))
    failures.push('API OPTIONS: GET is not allowed');

  const get = await fetchText(apiUrl, { headers: { Origin: origin } });
  if (get.status !== 200) failures.push(`API GET: status ${get.status} != 200`);
  try {
    const payload = JSON.parse(get.body);
    if (typeof payload.ratingCount !== 'number')
      failures.push('API GET: ratingCount is not numeric');
    if (payload.ratingValue !== null && typeof payload.ratingValue !== 'number')
      failures.push('API GET: ratingValue is not numeric or null');
  } catch {
    failures.push('API GET: response is not JSON');
  }

  const invalidPost = await fetchText(apiUrl, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: 0 }),
  });
  if (invalidPost.status !== 400)
    failures.push(`API POST validation: status ${invalidPost.status} != 400`);
  return 3;
}

async function verifyHealthContract(baselineUrl, candidateBase, failures) {
  const candidate = await fetchText(joinUrl(candidateBase, '/health'));
  if (contractOnly) {
    if (candidate.status !== 200) failures.push(`/health: status ${candidate.status} != 200`);
    if (!candidate.body.trim()) failures.push('/health: response body is empty');
    return 1;
  }
  const baseline = await fetchText(joinUrl(baselineUrl, '/health'));
  if (baseline.status !== candidate.status)
    failures.push(`/health: status ${baseline.status} != ${candidate.status}`);
  if (baseline.status === 200 && baseline.body.trim() !== candidate.body.trim())
    failures.push('/health: response body differs');
  return 1;
}

async function main() {
  if (!candidateUrl) throw new Error('缺少 --candidate-url');
  const candidateBase = trimTrailingSlash(candidateUrl);
  const apps = await discoverApps();
  const failures = [];
  let checks = 0;
  const ratewise = apps.find((app) => app.name === 'ratewise');
  if (!ratewise) throw new Error('找不到 RateWise app config');
  const baselineOrigin = new URL(ratewise.config.siteUrl).origin;
  checks += await verifyHealthContract(baselineOrigin, candidateBase, failures);

  for (const app of apps) {
    const configuredUrl = new URL(app.config.siteUrl);
    const appBasePath = configuredUrl.pathname.replace(/\/+$/, '');
    for (const seoPath of app.config.seoPaths ?? []) {
      const path = joinPath(appBasePath, seoPath);
      const candidate = await fetchText(joinUrl(candidateBase, path));
      const expectedCanonicalUrl = joinUrl(configuredUrl.origin + appBasePath, seoPath);
      if (contractOnly) compareHtmlContract(path, candidate, expectedCanonicalUrl, failures);
      else {
        const baseline = await fetchText(expectedCanonicalUrl);
        compareHtml(path, baseline, candidate, failures);
      }
      checks += 1;
    }

    for (const file of app.config.resources?.seoFiles ?? []) {
      const path = joinPath(appBasePath, file);
      const candidate = await fetchText(joinUrl(candidateBase, path));
      if (contractOnly) await compareResourceContract(path, candidate, failures);
      else {
        const baseline = await fetchText(joinUrl(configuredUrl.origin + appBasePath, file));
        await compareResource(path, baseline, candidate, failures);
      }
      checks += 1;
    }

    for (const file of app.config.resources?.images ?? []) {
      const path = joinPath(appBasePath, file);
      const candidate = await fetchText(joinUrl(candidateBase, path));
      if (contractOnly) await compareResourceContract(path, candidate, failures);
      else {
        const baseline = await fetchText(joinUrl(configuredUrl.origin + appBasePath, file));
        await compareResource(path, baseline, candidate, failures);
      }
      checks += 1;
    }

    const manifestPath = joinPath(appBasePath, '/manifest.webmanifest');
    const manifestCandidate = await fetchText(joinUrl(candidateBase, manifestPath));
    if (contractOnly) {
      await compareResourceContract(manifestPath, manifestCandidate, failures);
      if (manifestCandidate.status === 200)
        validateManifestContract(
          manifestPath,
          manifestCandidate,
          joinUrl(configuredUrl.origin + appBasePath, '/'),
          appBasePath,
          failures,
        );
    } else {
      const manifestBaseline = await fetchText(
        joinUrl(configuredUrl.origin + appBasePath, '/manifest.webmanifest'),
      );
      await compareResource(manifestPath, manifestBaseline, manifestCandidate, failures);
      if (manifestBaseline.status === 200 && manifestCandidate.status === 200)
        compareManifest(manifestPath, manifestBaseline, manifestCandidate, failures);
    }
    checks += 1;

    const serviceWorkerPath = joinPath(appBasePath, '/sw.js');
    const serviceWorkerCandidate = await fetchText(joinUrl(candidateBase, serviceWorkerPath));
    if (contractOnly) {
      await compareResourceContract(serviceWorkerPath, serviceWorkerCandidate, failures);
      if (serviceWorkerCandidate.status === 200)
        validateServiceWorkerContract(serviceWorkerPath, serviceWorkerCandidate, failures);
    } else {
      const serviceWorkerBaseline = await fetchText(
        joinUrl(configuredUrl.origin + appBasePath, '/sw.js'),
      );
      await compareResource(
        serviceWorkerPath,
        serviceWorkerBaseline,
        serviceWorkerCandidate,
        failures,
      );
      if (serviceWorkerBaseline.status === 200 && serviceWorkerCandidate.status === 200)
        compareServiceWorker(
          serviceWorkerPath,
          serviceWorkerBaseline,
          serviceWorkerCandidate,
          failures,
        );
    }
    checks += 1;

    const offlinePath = joinPath(appBasePath, '/offline.html');
    const offlineCandidate = await fetchText(joinUrl(candidateBase, offlinePath));
    if (contractOnly) {
      if (offlineCandidate.status === 200)
        await compareResourceContract(offlinePath, offlineCandidate, failures);
      checks += 1;
    } else {
      const offlineBaseline = await fetchText(
        joinUrl(configuredUrl.origin + appBasePath, '/offline.html'),
      );
      if (offlineBaseline.status === 200 || offlineCandidate.status === 200) {
        await compareResource(offlinePath, offlineBaseline, offlineCandidate, failures);
        checks += 1;
      }
    }
  }

  const unknown = await fetchText(joinUrl(candidateBase, `/__pages-seo-404-${Date.now()}/`));
  if (unknown.status !== 404)
    failures.push(`candidate unknown route returned ${unknown.status}, expected 404`);
  checks += 1;
  checks += await verifyApiContract(failures);

  console.log(`Pages SEO parity checks: ${checks}`);
  if (failures.length) {
    console.error(`❌ parity failed (${failures.length})`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log('✅ Pages SEO parity passed');
}

main().catch((error) => {
  console.error(`❌ parity verifier failed: ${error.message}`);
  process.exitCode = 1;
});
