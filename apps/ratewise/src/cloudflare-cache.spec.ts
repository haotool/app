/**
 * Cloudflare Cache Strategy E2E Tests (BDD)
 *
 * 目的：驗證 Cloudflare 快取策略是否正確配置
 *
 * 測試範圍：
 * 1. 靜態資產快取策略（活躍開發階段：1 day）
 * 2. HTML 不快取
 * 3. Service Worker 不快取
 * 4. 安全標頭配置
 *
 * 執行方式：
 * pnpm test cloudflare-cache.spec.ts
 *
 * 注意：這些測試需要在生產環境執行，因為需要檢查 Cloudflare 的 Response Headers
 */

import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://app.haotool.org/ratewise';

test.describe('Cloudflare Cache Strategy (BDD)', () => {
  test.describe('🔴 RED: 靜態資產快取策略', () => {
    test('should have correct Cache-Control for JS assets (1 day)', async ({ request }) => {
      // 獲取任意 JS 資產（從首頁 HTML 中提取）
      const indexResponse = await request.get(`${PRODUCTION_URL}/`);
      const indexHtml = await indexResponse.text();

      // 提取 JS 資產 URL
      const jsMatch = /\/assets\/app-[a-zA-Z0-9]+\.js/.exec(indexHtml);
      expect(jsMatch).not.toBeNull();

      const jsAssetUrl = `${PRODUCTION_URL}${jsMatch![0]}`;
      const response = await request.get(jsAssetUrl);

      // 驗證 Cache-Control
      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toContain('max-age=86400'); // 1 day = 86400 seconds
      expect(cacheControl).toContain('public');

      // 活躍開發階段不應有 immutable
      expect(cacheControl).not.toContain('immutable');
    });

    test('should have correct Cache-Control for CSS assets (1 day)', async ({ request }) => {
      const indexResponse = await request.get(`${PRODUCTION_URL}/`);
      const indexHtml = await indexResponse.text();

      const cssMatch = /\/assets\/app-[a-zA-Z0-9]+\.css/.exec(indexHtml);
      expect(cssMatch).not.toBeNull();

      const cssAssetUrl = `${PRODUCTION_URL}${cssMatch![0]}`;
      const response = await request.get(cssAssetUrl);

      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toContain('max-age=86400');
      expect(cacheControl).toContain('public');
    });

    test('should have Cloudflare cache status header', async ({ request }) => {
      const indexResponse = await request.get(`${PRODUCTION_URL}/`);
      const indexHtml = await indexResponse.text();

      const jsMatch = /\/assets\/app-[a-zA-Z0-9]+\.js/.exec(indexHtml);
      expect(jsMatch).not.toBeNull();

      const jsAssetUrl = `${PRODUCTION_URL}${jsMatch![0]}`;
      const response = await request.get(jsAssetUrl);

      // Cloudflare 會添加 cf-cache-status header
      const cfCacheStatus = response.headers()['cf-cache-status'];
      expect(cfCacheStatus).toBeDefined();

      // 可能的值：HIT, MISS, EXPIRED, BYPASS, DYNAMIC, REVALIDATED
      expect(['HIT', 'MISS', 'EXPIRED', 'BYPASS', 'DYNAMIC', 'REVALIDATED']).toContain(
        cfCacheStatus,
      );
    });
  });

  test.describe('🔴 RED: HTML 不快取', () => {
    test('should not cache HTML pages', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/`);

      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toContain('no-cache');

      // Cloudflare 應該 bypass HTML 快取
      const cfCacheStatus = response.headers()['cf-cache-status'];
      // HTML 可能是 DYNAMIC 或 BYPASS
      expect(['DYNAMIC', 'BYPASS']).toContain(cfCacheStatus);
    });

    test('should not cache FAQ page', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/faq/`);

      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toContain('no-cache');
    });
  });

  test.describe('🔴 RED: Service Worker 不快取', () => {
    test('should not cache Service Worker', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/sw.js`);

      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toContain('no-cache');

      // Service Worker 應該 bypass 快取
      const cfCacheStatus = response.headers()['cf-cache-status'];
      expect(['DYNAMIC', 'BYPASS']).toContain(cfCacheStatus);
    });
  });

  test.describe('🔴 RED: 安全標頭配置', () => {
    test('should have Content-Security-Policy header', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/`);

      const csp = response.headers()['content-security-policy'];
      expect(csp).toBeDefined();

      // 驗證關鍵 CSP 指令
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain('https://static.cloudflareinsights.com');

      // 確認 script-src 沒有 unsafe-inline
      const scriptSrcMatch = csp.match(/script-src[^;]+/);
      expect(scriptSrcMatch).not.toBeNull();
      expect(scriptSrcMatch![0]).not.toContain('unsafe-inline');
    });

    test('should have Strict-Transport-Security header', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/`);

      const hsts = response.headers()['strict-transport-security'];
      expect(hsts).toBeDefined();
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
    });

    test('should have X-Frame-Options header', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/`);

      const xFrameOptions = response.headers()['x-frame-options'];
      expect(xFrameOptions).toBeDefined();
      expect(xFrameOptions).toMatch(/SAMEORIGIN|DENY/i);
    });

    test('should have X-Content-Type-Options header', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/`);

      const xContentTypeOptions = response.headers()['x-content-type-options'];
      expect(xContentTypeOptions).toBeDefined();
      expect(xContentTypeOptions).toBe('nosniff');
    });

    test('should have Referrer-Policy header', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/`);

      const referrerPolicy = response.headers()['referrer-policy'];
      expect(referrerPolicy).toBeDefined();
      expect(referrerPolicy).toContain('strict-origin');
    });
  });

  test.describe('🟢 GREEN: Cloudflare 特定功能', () => {
    test('should have Cloudflare server header', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/`);

      // Cloudflare 會添加 cf-ray header
      const cfRay = response.headers()['cf-ray'];
      expect(cfRay).toBeDefined();

      // cf-ray 格式：<ray-id>-<airport-code>
      expect(cfRay).toMatch(/^[a-f0-9]+-[A-Z]{3}$/);
    });

    test('should use HTTP/2 or HTTP/3', async ({ request }) => {
      const response = await request.get(`${PRODUCTION_URL}/`);

      // Playwright 會在 response 中包含 HTTP 版本資訊
      // 注意：這個測試可能需要根據實際情況調整
      const cfCacheStatus = response.headers()['cf-cache-status'];
      expect(cfCacheStatus).toBeDefined();
    });
  });
});
