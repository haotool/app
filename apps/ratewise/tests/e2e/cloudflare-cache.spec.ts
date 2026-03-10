/**
 * Cloudflare 生產環境安全與快取驗證
 *
 * 目的：
 * 1. 驗證 Vite hashed asset 為 1 年 immutable
 * 2. 驗證 HTML / Service Worker 快取策略
 * 3. 驗證 ratewise 與其他子 app 的安全標頭覆蓋
 * 4. 驗證 CSP report 與分享圖 CORS 行為
 *
 * 執行方式：
 * RUN_PRODUCTION_TESTS=true pnpm --filter @app/ratewise exec playwright test tests/e2e/cloudflare-cache.spec.ts
 */

import { test, expect } from '@playwright/test';

const RATEWISE_URL = 'https://app.haotool.org/ratewise';
const NIHONNAME_URL = 'https://app.haotool.org/nihonname';
const PARK_KEEPER_URL = 'https://app.haotool.org/park-keeper';
const QUAKE_SCHOOL_URL = 'https://app.haotool.org/quake-school';
const isProductionTest = process.env['RUN_PRODUCTION_TESTS'] === 'true';

function extractAssetPath(html: string, extension: 'js' | 'css') {
  const match = new RegExp(`/ratewise/assets/[^"'\\s>]+\\.${extension}`).exec(html);
  return match?.[0] ?? null;
}

test.describe('Cloudflare Production Headers', () => {
  test.skip(
    !isProductionTest,
    'Skipping production tests in CI (set RUN_PRODUCTION_TESTS=true to run)',
  );

  test.describe('Immutable Assets', () => {
    test('RateWise JS hashed asset uses immutable cache', async ({ request }) => {
      const indexResponse = await request.get(`${RATEWISE_URL}/`);
      const indexHtml = await indexResponse.text();
      const jsPath = extractAssetPath(indexHtml, 'js');

      expect(jsPath).not.toBeNull();

      const response = await request.get(`https://app.haotool.org${jsPath}`);
      const cacheControl = response.headers()['cache-control'] ?? '';

      expect(cacheControl).toContain('max-age=31536000');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('immutable');
    });

    test('RateWise CSS hashed asset uses immutable cache', async ({ request }) => {
      const indexResponse = await request.get(`${RATEWISE_URL}/`);
      const indexHtml = await indexResponse.text();
      const cssPath = extractAssetPath(indexHtml, 'css');

      expect(cssPath).not.toBeNull();

      const response = await request.get(`https://app.haotool.org${cssPath}`);
      const cacheControl = response.headers()['cache-control'] ?? '';

      expect(cacheControl).toContain('max-age=31536000');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('immutable');
    });
  });

  test.describe('HTML and Service Worker Cache', () => {
    test('RateWise HTML keeps revalidation semantics', async ({ request }) => {
      const response = await request.get(`${RATEWISE_URL}/`);
      const cacheControl = response.headers()['cache-control'] ?? '';

      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');
    });

    test('RateWise Service Worker stays non-cacheable', async ({ request }) => {
      const response = await request.get(`${RATEWISE_URL}/sw.js`);
      const cacheControl = response.headers()['cache-control'] ?? '';

      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('no-store');
    });
  });

  test.describe('Security Headers', () => {
    test('RateWise uses strict nonce CSP', async ({ request }) => {
      const response = await request.get(`${RATEWISE_URL}/`);
      const csp = response.headers()['content-security-policy'] ?? '';
      const scriptSrcDirective = csp.match(/script-src[^;]+/)?.[0] ?? '';

      expect(csp).toContain("default-src 'self'");
      expect(scriptSrcDirective).toContain("'nonce-");
      expect(scriptSrcDirective).not.toContain('unsafe-inline');
      expect(csp).toContain('https://static.cloudflareinsights.com');
      expect(csp).toContain('https://www.googletagmanager.com');
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
      expect(response.headers()['x-frame-options']).toMatch(/SAMEORIGIN|DENY/i);
      expect(response.headers()['referrer-policy']).toContain('strict-origin');
      expect(response.headers()['strict-transport-security']).toContain('max-age=31536000');
    });

    test('NihonName homepage is covered by Cloudflare security headers', async ({ request }) => {
      const response = await request.get(`${NIHONNAME_URL}/`);
      const csp = response.headers()['content-security-policy'] ?? '';

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('fonts.googleapis.com');
      expect(csp).toContain('transparenttextures.com');
      expect(response.headers()['x-security-policy-version']).toBeDefined();
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
    });

    test('Park Keeper keeps geolocation permission but remains locked down', async ({
      request,
    }) => {
      const response = await request.get(`${PARK_KEEPER_URL}/`);
      const csp = response.headers()['content-security-policy'] ?? '';
      const permissionsPolicy = response.headers()['permissions-policy'] ?? '';

      expect(csp).toContain('wmts.nlsc.gov.tw');
      expect(csp).toContain('basemaps.cartocdn.com');
      expect(permissionsPolicy).toContain('geolocation=(self)');
      expect(permissionsPolicy).toContain('accelerometer=(self)');
      expect(permissionsPolicy).toContain('gyroscope=(self)');
      expect(permissionsPolicy).toContain('magnetometer=(self)');
      expect(response.headers()['x-frame-options']).toMatch(/SAMEORIGIN|DENY/i);
    });

    test('Quake School keeps legacy inline script allowance until preload cleanup finishes', async ({
      request,
    }) => {
      const response = await request.get(`${QUAKE_SCHOOL_URL}/`);
      const csp = response.headers()['content-security-policy'] ?? '';

      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain('fonts.googleapis.com');
      expect(response.headers()['x-security-policy-version']).toBeDefined();
    });
  });

  test.describe('Special Endpoints', () => {
    test('CSP report endpoint rejects GET but accepts POST', async ({ request }) => {
      const getResponse = await request.fetch(`${RATEWISE_URL}/csp-report`, { method: 'GET' });
      expect(getResponse.status()).toBe(405);

      const postResponse = await request.fetch(`${RATEWISE_URL}/csp-report`, {
        method: 'POST',
        headers: {
          'content-type': 'application/csp-report',
        },
        data: { 'csp-report': { 'effective-directive': 'script-src' } },
      });

      expect(postResponse.status()).toBe(204);
    });

    test('RateWise share image is cross-origin readable', async ({ request }) => {
      const response = await request.get(`${RATEWISE_URL}/og-image.jpg`);

      expect(response.headers()['access-control-allow-origin']).toBe('*');
      expect(response.headers()['cross-origin-resource-policy']).toBe('cross-origin');
    });
  });

  test('Cloudflare edge headers stay visible on production responses', async ({ request }) => {
    const response = await request.get(`${RATEWISE_URL}/`);

    expect(response.headers()['cf-ray']).toBeDefined();
    expect(response.headers()['cf-cache-status']).toBeDefined();
  });
});
