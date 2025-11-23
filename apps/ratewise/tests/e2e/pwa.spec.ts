/**
 * PWA Feature Tests
 * [context7:@playwright/test:2025-10-18T02:30:00+08:00]
 *
 * Verifies:
 * - Service Worker registration
 * - Web App Manifest presence
 * - Installability criteria
 * - Offline capability (basic)
 */
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

const getManifestBasePath = async (page: Page) => {
  const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifestUrl = manifestLink ? new URL(manifestLink, page.url()) : new URL(page.url());
  return manifestUrl.pathname.replace(/manifest\.webmanifest$/, '');
};

test.describe('PWA Features', () => {
  test('should have valid manifest', async ({ rateWisePage: page }) => {
    // Check manifest link in HTML
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toBeTruthy();

    const manifestUrl = new URL(manifestLink!, page.url());
    expect(manifestUrl.pathname.endsWith('/manifest.webmanifest')).toBeTruthy();

    // Fetch and validate manifest
    const manifestResponse = await page.request.get(manifestUrl.toString());
    expect(manifestResponse.ok()).toBeTruthy();

    const manifest = (await manifestResponse.json()) as {
      name: string;
      short_name: string;
      display: string;
      icons: { sizes: string; purpose?: string }[];
    };
    expect(manifest.name).toBe('RateWise - 即時匯率轉換器');
    expect(manifest.short_name).toBe('RateWise');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);

    // Verify required icon sizes
    const iconSizes = manifest.icons.map((icon) => icon.sizes);
    expect(iconSizes).toContain('192x192');
    expect(iconSizes).toContain('512x512');

    // Check for maskable icon
    const hasMaskable = manifest.icons.some((icon) => icon.purpose?.includes('maskable'));
    expect(hasMaskable).toBeTruthy();
  });

  test('should register service worker', async ({ rateWisePage: page }) => {
    const basePath = await getManifestBasePath(page);

    // 等待 Service Worker ready 並取得 scope
    const swInfoHandle = await page.waitForFunction(
      async (expectedScope) => {
        if (!('serviceWorker' in navigator)) return null;
        const registration = await navigator.serviceWorker.ready;
        return registration
          ? {
              scope: registration.scope,
              scriptURL: registration.active?.scriptURL ?? registration.installing?.scriptURL ?? '',
            }
          : null;
      },
      basePath,
      { timeout: 8000 },
    );

    const value = await swInfoHandle.jsonValue();
    expect(value?.scope).toContain(basePath);
    expect(value?.scriptURL).toContain('sw.js');

    // 確保當前頁面已受 SW 控制
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 8000,
    });
  });

  test('should have single service worker scope', async ({ rateWisePage: page }) => {
    const basePath = await getManifestBasePath(page);

    const swInfoHandle = await page.waitForFunction(
      async (expectedScope) => {
        if (!('serviceWorker' in navigator)) return null;
        const registration = await navigator.serviceWorker.ready;
        if (!registration) return null;
        return {
          scope: registration.scope,
          active: !!registration.active,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
          controller: !!navigator.serviceWorker.controller,
        };
      },
      basePath,
      { timeout: 8000 },
    );

    const value = await swInfoHandle.jsonValue();
    expect(value).not.toBeNull();
    expect(value?.scope).toContain(basePath);
    expect(value?.active ?? value?.installing).toBeTruthy();
  });

  test('should have theme color meta tag', async ({ rateWisePage: page }) => {
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBe('#8B5CF6');
  });

  test('should have viewport meta tag', async ({ rateWisePage: page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  test('should have apple touch icon', async ({ rateWisePage: page }) => {
    const basePath = await getManifestBasePath(page);
    const expectedIconPath = `${basePath}apple-touch-icon.png`;

    const appleTouchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(appleTouchIcon).toBe(expectedIconPath);

    // Verify icon exists
    const iconResponse = await page.request.get(expectedIconPath);
    expect(iconResponse.ok()).toBeTruthy();
  });

  test('should meet installability criteria', async ({ rateWisePage: page }) => {
    // Check console for any PWA-related errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(3000);

    // Filter out expected errors (e.g., future date historical rates)
    const pwaErrors = consoleErrors.filter(
      (error) =>
        error.includes('manifest') ||
        error.includes('service worker') ||
        error.includes('installability'),
    );

    expect(pwaErrors.length).toBe(0);
  });

  test('should cache static assets', async ({ rateWisePage: page }) => {
    // 確保 SW 已控制頁面後再檢查 caches
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, {
      timeout: 8000,
    });

    const hasPrecacheHandle = await page.waitForFunction(
      async () => {
        if (!('caches' in window)) return false;
        const keys = await caches.keys();
        return keys.some((key) => key.includes('workbox-precache'));
      },
      null,
      { timeout: 8000 },
    );

    expect(await hasPrecacheHandle.jsonValue()).toBeTruthy();
  });
});
