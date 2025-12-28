/**
 * SEO E2E Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { test, expect } from '@playwright/test';

test.describe('SEO Validation', () => {
  test.describe('首頁 SEO', () => {
    test('應該有正確的 title', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Quake-School/);
    });

    test('應該有 meta description', async ({ page }) => {
      await page.goto('/');
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect(description?.length).toBeGreaterThan(50);
    });

    test('應該有 canonical URL', async ({ page }) => {
      await page.goto('/');
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain('quake-school');
    });

    test('應該有 Open Graph 標籤', async ({ page }) => {
      await page.goto('/');

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page
        .locator('meta[property="og:description"]')
        .getAttribute('content');
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
      expect(ogImage).toBeTruthy();
    });

    test('應該有 JSON-LD 結構化數據', async ({ page }) => {
      await page.goto('/');

      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
      expect(jsonLdScripts.length).toBeGreaterThan(0);

      const firstJsonLd = await jsonLdScripts[0].textContent();
      expect(firstJsonLd).toContain('@context');
      expect(firstJsonLd).toContain('schema.org');
    });
  });

  test.describe('頁面導航', () => {
    test('所有導航連結都應該使用尾斜線', async ({ page }) => {
      await page.goto('/');

      const navLinks = await page.locator('nav a[href]').all();

      for (const link of navLinks) {
        const href = await link.getAttribute('href');
        if (href && href !== '/') {
          // 檢查是否以 / 結尾（除了首頁）
          expect(href.endsWith('/') || href === '/').toBeTruthy();
        }
      }
    });

    test('防災指南頁面應該可以訪問', async ({ page }) => {
      await page.goto('/guide/');
      await expect(page.locator('h1')).toContainText('地震防災指南');
    });

    test('FAQ 頁面應該可以訪問', async ({ page }) => {
      await page.goto('/faq/');
      await expect(page.locator('h1')).toContainText('常見問題');
    });

    test('關於頁面應該可以訪問', async ({ page }) => {
      await page.goto('/about/');
      await expect(page.locator('h1')).toContainText('關於');
    });
  });

  test.describe('無障礙性', () => {
    test('應該有 skip link', async ({ page }) => {
      await page.goto('/');

      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();
    });

    test('主要內容區塊應該有正確的 landmark', async ({ page }) => {
      await page.goto('/');

      const main = page.locator('main#main-content');
      await expect(main).toBeAttached();
    });

    test('所有圖片都應該有 alt 或 aria-hidden', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const ariaHidden = await img.getAttribute('aria-hidden');
        expect(alt !== null || ariaHidden === 'true').toBeTruthy();
      }
    });
  });

  test.describe('PWA', () => {
    test('應該有 manifest.webmanifest', async ({ page }) => {
      await page.goto('/');

      const manifest = page.locator('link[rel="manifest"]');
      await expect(manifest).toBeAttached();
    });

    test('應該有 theme-color', async ({ page }) => {
      await page.goto('/');

      const themeColor = page.locator('meta[name="theme-color"]');
      await expect(themeColor).toBeAttached();
    });
  });
});
