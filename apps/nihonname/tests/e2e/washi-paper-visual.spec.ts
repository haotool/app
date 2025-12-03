/**
 * E2E Visual Regression Tests for Washi Paper Effect
 * 和紙質感視覺回歸測試
 *
 * 測試內容：
 * 1. Result Card 和紙質感渲染
 * 2. 紋理疊加效果
 * 3. 陰影與邊框效果
 * 4. 浮水印與角落裝飾
 * 5. 響應式設計（桌面/平板/手機）
 *
 * 執行：pnpm test:e2e washi-paper-visual.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Washi Paper Visual Effects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待頁面完全載入
    await page.waitForSelector('h1');
  });

  test.describe('Result Card - Desktop', () => {
    test('should render result card with washi paper texture', async ({ page }) => {
      // 輸入姓氏並生成
      await page.fill('input[placeholder="陳"]', '林');
      await page.click('button:has-text("改名実行")');

      // 等待結果卡片出現
      await page.waitForSelector('.font-jp:has-text("林")', { timeout: 2000 });

      // 驗證 WashiCard 結構
      const resultCard = page.locator('div').filter({ hasText: '令和七年・改名局' }).first();
      await expect(resultCard).toBeVisible();

      // 截圖比對 - Result Card
      await expect(resultCard).toHaveScreenshot('result-card-washi-paper.png', {
        maxDiffPixels: 100,
      });
    });

    test('should display seigaiha pattern overlay', async ({ page }) => {
      await page.fill('input[placeholder="陳"]', '王');
      await page.click('button:has-text("改名実行")');
      await page.waitForSelector('.font-jp:has-text("王")', { timeout: 2000 });

      // 驗證 SVG pattern 存在
      const svgPattern = page.locator('svg pattern#seigaiha');
      await expect(svgPattern).toBeAttached();

      // 截圖包含 pattern
      await page.screenshot({ path: 'test-results/seigaiha-pattern-overlay.png' });
    });

    test('should render corner decorations', async ({ page }) => {
      await page.fill('input[placeholder="陳"]', '陳');
      await page.click('button:has-text("改名実行")');
      await page.waitForSelector('.font-jp:has-text("陳")', { timeout: 2000 });

      // 驗證角落裝飾存在（CSS border 裝飾）
      const corners = page.locator('.border-t.border-l, .border-b.border-r');
      expect(await corners.count()).toBeGreaterThan(0);
    });

    test('should render watermark (kamon icon)', async ({ page }) => {
      await page.fill('input[placeholder="陳"]', '黃');
      await page.click('button:has-text("改名実行")');
      await page.waitForSelector('.font-jp:has-text("黃")', { timeout: 2000 });

      // 驗證浮水印 SVG 存在
      const watermark = page.locator('svg').filter({ hasText: '' }).first();
      await expect(watermark).toBeVisible();
    });
  });

  test.describe('Result Card - Responsive', () => {
    test('should render correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.fill('input[placeholder="陳"]', '李');
      await page.click('button:has-text("改名実行")');
      await page.waitForSelector('.font-jp:has-text("李")', { timeout: 2000 });

      // 截圖比對 - Mobile
      const resultCard = page.locator('div').filter({ hasText: '令和七年・改名局' }).first();
      await expect(resultCard).toHaveScreenshot('result-card-mobile.png', {
        maxDiffPixels: 150,
      });
    });

    test('should render correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.fill('input[placeholder="陳"]', '張');
      await page.click('button:has-text("改名実行")');
      await page.waitForSelector('.font-jp:has-text("張")', { timeout: 2000 });

      // 截圖比對 - Tablet
      const resultCard = page.locator('div').filter({ hasText: '令和七年・改名局' }).first();
      await expect(resultCard).toHaveScreenshot('result-card-tablet.png', {
        maxDiffPixels: 150,
      });
    });
  });

  test.describe('Pure Mode (Screenshot Mode)', () => {
    test('should hide UI elements in pure mode', async ({ page }) => {
      await page.fill('input[placeholder="陳"]', '吳');
      await page.click('button:has-text("改名実行")');
      await page.waitForSelector('.font-jp:has-text("吳")', { timeout: 2000 });

      // 點擊「純淨模式」按鈕
      await page.click('button:has-text("截圖模式")');

      // 等待 UI 隱藏動畫完成
      await page.waitForTimeout(500);

      // 驗證按鈕區域隱藏
      const actionButtons = page.locator('button:has-text("族譜查證")');
      await expect(actionButtons).toBeHidden();

      // 截圖 - Pure Mode
      await page.screenshot({ path: 'test-results/pure-mode-washi-card.png', fullPage: true });
    });
  });

  test.describe('Visual Comparison - Before/After', () => {
    test('should match baseline washi paper effect', async ({ page }) => {
      await page.fill('input[placeholder="陳"]', '劉');
      await page.click('button:has-text("改名実行")');
      await page.waitForSelector('.font-jp:has-text("劉")', { timeout: 2000 });

      // 完整頁面截圖
      await expect(page).toHaveScreenshot('full-page-with-washi-effect.png', {
        fullPage: true,
        maxDiffPixels: 200,
      });
    });
  });
});

test.describe('Washi Paper Texture Quality', () => {
  test('should have visible rice paper texture', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="陳"]', '鄭');
    await page.click('button:has-text("改名実行")');
    await page.waitForSelector('.font-jp:has-text("鄭")', { timeout: 2000 });

    // 取得 Result Card 元素
    const card = page.locator('div').filter({ hasText: '令和七年・改名局' }).first();

    // 檢查背景圖片 URL（rice-paper texture）
    const bgImage = await card.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundImage;
    });

    expect(bgImage).toContain('rice-paper');
  });

  test('should have correct base color (#fcfaf7)', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="陳"]', '許');
    await page.click('button:has-text("改名実行")');
    await page.waitForSelector('.font-jp:has-text("許")', { timeout: 2000 });

    const card = page.locator('div').filter({ hasText: '令和七年・改名局' }).first();

    // 檢查背景色
    const bgColor = await card.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor;
    });

    // RGB(252, 250, 247) = #fcfaf7
    expect(bgColor).toBe('rgb(252, 250, 247)');
  });
});
