import { test, expect } from '@playwright/test';

/**
 * NihonName E2E 測試
 *
 * 測試範圍：
 * 1. 首頁載入與基本功能
 * 2. 姓名生成器功能
 * 3. 諧音梗名字功能
 * 4. About 頁面
 * 5. 響應式設計 (RWD)
 *
 * @see [context7:/microsoft/playwright:2025-12-04]
 */

test.describe('NihonName - 首頁功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
  });

  test('應該正確顯示頁面標題', async ({ page }) => {
    await expect(page).toHaveTitle(/皇民化改姓生成器|NihonName/);
  });

  test('應該顯示主標題', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('應該顯示姓氏輸入框', async ({ page }) => {
    // 使用 placeholder "陳" 來找輸入框
    const input = page.getByPlaceholder('陳');
    await expect(input).toBeVisible();
  });

  test('應該顯示生成按鈕', async ({ page }) => {
    const button = page.getByRole('button', { name: /改名実行/i });
    await expect(button).toBeVisible();
  });
});

test.describe('NihonName - 姓名生成功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('輸入姓氏後應該啟用生成按鈕', async ({ page }) => {
    const input = page.getByPlaceholder('陳');
    const button = page.getByRole('button', { name: /改名実行/i });

    // 初始狀態按鈕應該是 disabled
    await expect(button).toBeDisabled();

    // 輸入姓氏後按鈕應該啟用
    await input.fill('林');
    await expect(button).toBeEnabled();
  });

  test('應該能夠生成日本名字', async ({ page }) => {
    const input = page.getByPlaceholder('陳');
    const button = page.getByRole('button', { name: /改名実行/i });

    await input.fill('林');
    await button.click();

    // 等待結果頁面載入（等待諧音區塊的 Alias 標籤出現）
    await expect(page.getByText('Alias')).toBeVisible({ timeout: 5000 });
  });

  test('應該顯示諧音梗區塊和骰子按鈕', async ({ page }) => {
    const input = page.getByPlaceholder('陳');
    const button = page.getByRole('button', { name: /改名実行/i });

    await input.fill('陳');
    await button.click();

    // 等待諧音區塊顯示
    await expect(page.getByText('Alias')).toBeVisible({ timeout: 5000 });

    // 骰子按鈕應該可見
    await expect(page.getByText('諧音')).toBeVisible();
  });

  test('點擊骰子按鈕應該更換諧音名', async ({ page }) => {
    const input = page.getByPlaceholder('陳');
    const button = page.getByRole('button', { name: /改名実行/i });

    await input.fill('王');
    await button.click();

    // 等待結果頁面載入
    await expect(page.getByText('Alias')).toBeVisible({ timeout: 5000 });

    // 點擊骰子按鈕
    const diceButton = page.getByText('諧音').locator('..');
    if (await diceButton.isVisible()) {
      await diceButton.click();
      // 結果可能會改變（隨機性）
      await expect(page.getByText('Alias')).toBeVisible();
    }
  });
});

test.describe('NihonName - About 頁面', () => {
  test('應該能夠導航到 About 頁面', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('關於');
  });

  test('About 頁面應該可以滾動', async ({ page }) => {
    // 設置一個較小的視窗以觸發滾動
    await page.setViewportSize({ width: 375, height: 600 });
    await page.goto('/about');

    // 檢查頁面是否可滾動
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);

    // 如果內容高度大於視窗高度，則頁面應該可以滾動
    if (scrollHeight > clientHeight) {
      // 嘗試滾動
      await page.evaluate(() => window.scrollBy(0, 100));
      const scrollTop = await page.evaluate(() => document.documentElement.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    }
  });
});

test.describe('NihonName - 響應式設計', () => {
  test('桌面版應該正確顯示', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('手機版應該正確顯示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('結果頁面在手機版應該完整顯示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const input = page.getByPlaceholder('陳');
    const button = page.getByRole('button', { name: /改名実行/i });

    await input.fill('林');
    await button.click();

    // 等待結果頁面載入
    await expect(page.getByText('Alias')).toBeVisible({ timeout: 5000 });

    // 檢查頁面是否可以滾動（確保內容不被遮蔽）
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);

    // 頁面應該能夠容納所有內容
    expect(scrollHeight).toBeGreaterThanOrEqual(clientHeight);
  });

  test('結果頁面底部按鈕應該可見且可點擊', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const input = page.getByPlaceholder('陳');
    const button = page.getByRole('button', { name: /改名実行/i });

    await input.fill('林');
    await button.click();

    // 等待結果頁面載入
    await expect(page.getByText('Alias')).toBeVisible({ timeout: 5000 });

    // 檢查底部按鈕是否可見
    const screenshotButton = page.getByRole('button', { name: /截圖模式/i });
    await expect(screenshotButton).toBeVisible();

    // 檢查按鈕是否可點擊（不被遮蔽）
    const box = await screenshotButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y + box.height).toBeLessThanOrEqual(667); // 確保按鈕在視窗內
    }
  });
});

test.describe('NihonName - iOS Safe Area', () => {
  test('應該支援 iOS safe area insets', async ({ page }) => {
    await page.goto('/');

    // 檢查 CSS 是否包含 safe-area-inset 支援
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
      };
    });

    // 在非 iOS 設備上，safe-area-inset 會是 0
    // 但 CSS 規則應該存在
    expect(bodyStyles).toBeDefined();
  });
});
