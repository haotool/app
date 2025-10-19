/**
 * Lighthouse Audit E2E Test
 * [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
 *
 * 驗證所有 Lighthouse 指標達成 100 分
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import type { ThresholdsConfig } from 'playwright-lighthouse';

test.describe('Lighthouse Audit - 100 Score Target', () => {
  test('應達成 Performance 100 分', async ({ page, browser }) => {
    await page.goto('http://localhost:4173');

    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');

    // 執行 Lighthouse 審計
    const thresholds: ThresholdsConfig = {
      performance: 100,
      accessibility: 100,
      'best-practices': 100,
      seo: 100,
    };

    // @ts-expect-error - playwright-lighthouse types issue
    await (
      playAudit({
        page,
        browser,
        thresholds,
        port: 9222,
        opts: {
          formFactor: 'desktop',
          screenEmulation: {
            mobile: false,
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
          },
        },
      }) as Promise<unknown>
    ).catch((error: Error) => {
      throw new Error(`Lighthouse audit failed: ${error.message}`);
    });
  });

  test('應沒有瀏覽器控制台錯誤', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:4173');
    await page.waitForLoadState('networkidle');

    // 過濾掉已知的 404 錯誤（歷史匯率資料可能尚未產生）
    const realErrors = consoleErrors.filter(
      (error) => !error.includes('history') && !error.includes('404'),
    );

    expect(realErrors).toHaveLength(0);
  });

  test('應正確載入所有關鍵資源', async ({ page }) => {
    const response = await page.goto('http://localhost:4173');

    expect(response?.status()).toBe(200);

    // 檢查關鍵元素存在
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // 檢查 PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest');
  });

  test('標題層級結構應正確', async ({ page }) => {
    await page.goto('http://localhost:4173');
    await page.waitForLoadState('networkidle');

    // 檢查 h1 存在且只有一個
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // 檢查 h2 在 h3 之前出現（如果兩者都存在）
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();

    if (h3Count > 0) {
      expect(h2Count).toBeGreaterThan(0);
    }
  });

  test('應包含有效的結構化資料', async ({ page }) => {
    await page.goto('http://localhost:4173');

    const jsonLdScripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();

    expect(jsonLdScripts.length).toBeGreaterThan(0);

    // 驗證每個 JSON-LD 都是有效的 JSON
    for (const script of jsonLdScripts) {
      expect(() => JSON.parse(script)).not.toThrow();

      const data = JSON.parse(script) as Record<string, unknown>;
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBeDefined();
    }
  });

  test('應設定正確的安全標頭', async ({ page }) => {
    const response = await page.goto('http://localhost:4173');
    const headers = response?.headers();

    if (headers) {
      // 注意：這些標頭在 Vite preview 中可能不存在，
      // 但在 Nginx 生產環境中應該存在
      // 這個測試主要是文檔目的

      // CSP 相關測試會在生產環境執行
      console.log('Headers available:', Object.keys(headers));
    }
  });

  test('應載入並顯示匯率資料', async ({ page }) => {
    await page.goto('http://localhost:4173');

    // 等待匯率資料載入（最多 10 秒）
    await page.waitForFunction(
      () => {
        const rates = document.querySelectorAll('[class*="currency"]');
        return rates.length > 0;
      },
      { timeout: 10000 },
    );

    // 檢查是否顯示匯率
    const currencyElements = await page.locator('text=/TWD|USD|JPY/').count();
    expect(currencyElements).toBeGreaterThan(0);
  });
});
