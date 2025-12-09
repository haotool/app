/**
 * SEO Validation E2E Tests
 *
 * Comprehensive SEO checks including:
 * - HTTP 200 status for all pages
 * - Meta tags (title, description, canonical)
 * - Open Graph tags
 * - JSON-LD structured data
 * - Image assets (OG image, favicon)
 * - Trailing slash consistency
 *
 * @see docs/SEO_AUDIT_CHECKLIST.md
 * cSpell:ignore kominka shimonoseki
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://app.haotool.org/nihonname';

const PAGES = [
  { path: '/', name: '首頁' },
  { path: '/about/', name: '關於' },
  { path: '/guide/', name: '使用指南' },
  { path: '/faq/', name: '常見問題' },
  { path: '/history/', name: '歷史背景' },
  { path: '/history/kominka/', name: '皇民化運動' },
  { path: '/history/shimonoseki/', name: '馬關條約' },
  { path: '/history/san-francisco/', name: '舊金山和約' },
];

test.describe('SEO Validation - HTTP Status', () => {
  for (const page of PAGES) {
    test(`${page.name} (${page.path}) should return HTTP 200`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${page.path}`);
      expect(response).toBeOK();
      expect(response.status()).toBe(200);
    });
  }
});

test.describe('SEO Validation - Meta Tags', () => {
  for (const page of PAGES) {
    test(`${page.name} should have valid meta tags`, async ({ page: browserPage }) => {
      await browserPage.goto(`${BASE_URL}${page.path}`);

      // Title tag
      const title = await browserPage.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(60); // SEO best practice

      // Meta description
      const description = await browserPage
        .locator('meta[name="description"]')
        .getAttribute('content');
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(0);
      expect(description!.length).toBeLessThanOrEqual(160); // SEO best practice

      // Canonical URL
      const canonical = await browserPage.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(canonical).toContain(BASE_URL);
      expect(canonical).toContain(page.path);
    });
  }
});

test.describe('SEO Validation - Open Graph Tags', () => {
  for (const page of PAGES) {
    test(`${page.name} should have valid Open Graph tags`, async ({ page: browserPage }) => {
      await browserPage.goto(`${BASE_URL}${page.path}`);

      // og:title
      const ogTitle = await browserPage
        .locator('meta[property="og:title"]')
        .getAttribute('content');
      expect(ogTitle).toBeTruthy();

      // og:description
      const ogDescription = await browserPage
        .locator('meta[property="og:description"]')
        .getAttribute('content');
      expect(ogDescription).toBeTruthy();

      // og:url
      const ogUrl = await browserPage.locator('meta[property="og:url"]').getAttribute('content');
      expect(ogUrl).toBeTruthy();
      expect(ogUrl).toContain(BASE_URL);

      // og:image
      const ogImage = await browserPage
        .locator('meta[property="og:image"]')
        .getAttribute('content');
      expect(ogImage).toBeTruthy();
      expect(ogImage).toMatch(/\.(png|jpg|jpeg)$/i);

      // og:type
      const ogType = await browserPage.locator('meta[property="og:type"]').getAttribute('content');
      expect(ogType).toBe('website');
    });
  }
});

test.describe('SEO Validation - JSON-LD Structured Data', () => {
  for (const page of PAGES) {
    test(`${page.name} should have valid JSON-LD schema`, async ({ page: browserPage }) => {
      await browserPage.goto(`${BASE_URL}${page.path}`);

      // Find all JSON-LD scripts
      const jsonLdScripts = await browserPage.locator('script[type="application/ld+json"]').all();
      expect(jsonLdScripts.length).toBeGreaterThan(0);

      // Validate each JSON-LD block is valid JSON
      for (const script of jsonLdScripts) {
        const content = await script.textContent();
        expect(content).toBeTruthy();

        // Should be valid JSON
        const parsed = JSON.parse(content!);
        expect(parsed).toBeTruthy();

        // Should have @context and @type
        expect(parsed['@context']).toBe('https://schema.org');
        expect(parsed['@type']).toBeTruthy();
      }
    });
  }
});

test.describe('SEO Validation - Image Assets', () => {
  test('OG image should be accessible', async ({ request }) => {
    const ogImageResponse = await request.get(`${BASE_URL}/og-image.png`);
    expect(ogImageResponse).toBeOK();
    expect(ogImageResponse.status()).toBe(200);

    // Check content type
    const contentType = ogImageResponse.headers()['content-type'];
    expect(contentType).toContain('image');
  });

  test('Favicon should be accessible', async ({ request }) => {
    // Try common favicon paths
    const faviconPaths = ['/favicon.ico', '/favicon.svg'];

    let found = false;
    for (const path of faviconPaths) {
      const response = await request.get(`${BASE_URL}${path}`);
      if (response.ok()) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  });

  test('Apple touch icon should be accessible', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/apple-touch-icon.png`);

    // Apple touch icon is optional, but if present should return 200
    if (response.status() !== 404) {
      expect(response).toBeOK();
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('image');
    }
  });
});

test.describe('SEO Validation - Trailing Slash Consistency', () => {
  test('All internal links should use trailing slashes', async ({ page: browserPage }) => {
    await browserPage.goto(`${BASE_URL}/`);

    // Find all internal links
    const internalLinks = await browserPage.locator('a[href^="/"]').all();

    for (const link of internalLinks) {
      const href = await link.getAttribute('href');

      // Skip hash links and external links
      if (!href || href.startsWith('#') || href.startsWith('http')) {
        continue;
      }

      // If it's a page link (not a file), it should have a trailing slash
      if (!href.match(/\.(pdf|png|jpg|jpeg|svg|ico|txt|xml)$/i)) {
        expect(href).toMatch(/\/$/);
      }
    }
  });

  test('Breadcrumb links should have trailing slashes', async ({ page: browserPage }) => {
    // Test on a page with breadcrumbs
    await browserPage.goto(`${BASE_URL}/history/kominka/`);

    // Check JSON-LD breadcrumb schema
    const jsonLdScripts = await browserPage.locator('script[type="application/ld+json"]').all();

    for (const script of jsonLdScripts) {
      const content = await script.textContent();
      const parsed = JSON.parse(content!);

      if (parsed['@type'] === 'BreadcrumbList') {
        const items = parsed.itemListElement;

        for (const item of items) {
          const url = item.item;

          // All breadcrumb URLs should end with trailing slash
          // (except the base URL which might not)
          if (url !== BASE_URL) {
            expect(url).toMatch(/\/$/);
          }
        }
      }
    }
  });
});

test.describe('SEO Validation - Performance', () => {
  for (const page of PAGES) {
    test(`${page.name} should load within 3 seconds`, async ({ page: browserPage }) => {
      const startTime = Date.now();
      await browserPage.goto(`${BASE_URL}${page.path}`);
      const loadTime = Date.now() - startTime;

      // Should load within 3000ms
      expect(loadTime).toBeLessThan(3000);
    });
  }
});

test.describe('SEO Validation - Mobile Responsiveness', () => {
  test('Homepage should be mobile-friendly', async ({ page: browserPage }) => {
    // Set mobile viewport
    await browserPage.setViewportSize({ width: 375, height: 667 });
    await browserPage.goto(`${BASE_URL}/`);

    // Check viewport meta tag
    const viewport = await browserPage.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');

    // Page should be visible
    const body = browserPage.locator('body');
    await expect(body).toBeVisible();
  });
});
