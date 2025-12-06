/**
 * Hydration Fix Verification Test
 * [fix:2025-12-06] 驗證 React Error #418 修正
 *
 * 測試目標：
 * 1. 頁面無 React hydration 錯誤
 * 2. JSON-LD 結構化數據正確注入
 * 3. SEO meta tags 正確渲染
 */
import { test, expect } from '@playwright/test';

test.describe('Hydration Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // 監聽 console 錯誤
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // 監聽頁面錯誤
    page.on('pageerror', (error) => {
      console.log(`❌ Page Error: ${error.message}`);
    });
  });

  test('首頁應無 React hydration 錯誤', async ({ page }) => {
    const errors: string[] = [];

    // 收集所有錯誤
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // 訪問首頁
    await page.goto('http://localhost:4174/nihonname/');

    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');

    // 等待 React hydration 完成
    await page.waitForTimeout(2000);

    // 檢查是否有 React Error #418
    const hasHydrationError = errors.some(
      (error) => error.includes('418') || error.includes('Hydration'),
    );

    if (hasHydrationError) {
      console.log('❌ Detected Hydration Errors:');
      errors.forEach((error) => console.log(`  - ${error}`));
    } else {
      console.log('✅ No hydration errors detected');
    }

    expect(hasHydrationError).toBe(false);
  });

  test('JSON-LD 結構化數據應正確注入', async ({ page }) => {
    await page.goto('http://localhost:4174/nihonname/');
    await page.waitForLoadState('networkidle');

    // 檢查 JSON-LD script tags
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();

    console.log(`✅ Found ${jsonLdScripts.length} JSON-LD scripts`);
    expect(jsonLdScripts.length).toBeGreaterThan(0);

    // 驗證每個 JSON-LD 都是有效 JSON
    for (const script of jsonLdScripts) {
      const content = await script.textContent();
      expect(content).not.toBeNull();

      try {
        const parsed = JSON.parse(content!);
        expect(parsed['@context']).toBe('https://schema.org');
        console.log(`✅ Valid JSON-LD: ${parsed['@type']}`);
      } catch (error) {
        console.log(`❌ Invalid JSON-LD: ${content}`);
        throw error;
      }
    }
  });

  test('SEO meta tags 應正確渲染', async ({ page }) => {
    await page.goto('http://localhost:4174/nihonname/');
    await page.waitForLoadState('networkidle');

    // 檢查基本 meta tags
    const title = await page.title();
    expect(title).toContain('NihonName');
    console.log(`✅ Title: ${title}`);

    // 檢查 canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    console.log(`✅ Canonical: ${canonical}`);

    // 檢查 Open Graph
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('NihonName');
    console.log(`✅ OG Title: ${ogTitle}`);

    // 檢查 Twitter Card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');
    console.log(`✅ Twitter Card: ${twitterCard}`);
  });

  test('所有頁面應無 hydration 錯誤', async ({ page }) => {
    const pages = [
      '/',
      '/about',
      '/guide',
      '/faq',
      '/history',
      '/history/kominka',
      '/history/shimonoseki',
      '/history/san-francisco',
    ];

    for (const path of pages) {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`http://localhost:4174/nihonname${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const hasError = errors.some((e) => e.includes('418') || e.includes('Hydration'));

      if (hasError) {
        console.log(`❌ ${path}: Hydration error detected`);
      } else {
        console.log(`✅ ${path}: No errors`);
      }

      expect(hasError).toBe(false);
    }
  });
});
