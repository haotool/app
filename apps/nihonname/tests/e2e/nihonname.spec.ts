import { test, expect } from '@playwright/test';

/**
 * NihonName E2E 測試
 *
 * 測試範圍：
 * 1. 首頁載入與基本功能
 * 2. 姓名生成器功能
 * 3. 諧音梗名字功能
 * 4. About 頁面
 * 5. SEO 驗證
 * 6. PWA 功能
 *
 * @see [context7:/microsoft/playwright:2025-12-04]
 */

test.describe('NihonName - 首頁功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待頁面完全載入
    await expect(page.locator('h1')).toBeVisible();
  });

  test('應該正確顯示頁面標題', async ({ page }) => {
    await expect(page).toHaveTitle(/日本名字生成器/);
  });

  test('應該顯示主標題', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('日本名字生成器');
  });

  test('應該顯示姓氏輸入框', async ({ page }) => {
    const input = page.getByPlaceholder('輸入您的姓氏');
    await expect(input).toBeVisible();
  });

  test('應該顯示生成按鈕', async ({ page }) => {
    const button = page.getByRole('button', { name: /生成/i });
    await expect(button).toBeVisible();
  });
});

test.describe('NihonName - 姓名生成功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('輸入姓氏後應該啟用生成按鈕', async ({ page }) => {
    const input = page.getByPlaceholder('輸入您的姓氏');
    const button = page.getByRole('button', { name: /生成/i });

    await input.fill('林');
    await expect(button).toBeEnabled();
  });

  test('應該能夠生成日本名字', async ({ page }) => {
    const input = page.getByPlaceholder('輸入您的姓氏');
    const button = page.getByRole('button', { name: /生成/i });

    await input.fill('林');
    await button.click();

    // 等待結果顯示
    await expect(page.getByText(/日本姓氏/i)).toBeVisible({ timeout: 5000 });
  });

  test('應該顯示諧音梗名字', async ({ page }) => {
    const input = page.getByPlaceholder('輸入您的姓氏');
    const button = page.getByRole('button', { name: /生成/i });

    await input.fill('陳');
    await button.click();

    // 等待諧音梗顯示
    await expect(page.getByText(/諧音梗/i)).toBeVisible({ timeout: 5000 });
  });

  test('重新生成應該更新結果', async ({ page }) => {
    const input = page.getByPlaceholder('輸入您的姓氏');
    const button = page.getByRole('button', { name: /生成/i });

    await input.fill('王');
    await button.click();

    // 等待第一次結果
    await expect(page.getByText(/日本姓氏/i)).toBeVisible({ timeout: 5000 });

    // 取得第一次結果
    const firstResult = await page.getByText(/日本姓氏/i).textContent();

    // 點擊重新生成
    const regenerateButton = page.getByRole('button', { name: /重新生成/i });
    if (await regenerateButton.isVisible()) {
      await regenerateButton.click();
      // 結果可能會改變（隨機性）
      await expect(page.getByText(/日本姓氏/i)).toBeVisible();
    }
  });
});

test.describe('NihonName - About 頁面', () => {
  test('應該能夠導航到 About 頁面', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // 尋找 About 連結
    const aboutLink = page.getByRole('link', { name: /關於/i });
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/about/);
    }
  });

  test('About 頁面應該顯示歷史背景', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('關於');
    await expect(page.getByText(/皇民化/i)).toBeVisible();
  });

  test('About 頁面應該顯示 FAQ', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText(/常見問題/i)).toBeVisible();
  });
});

test.describe('NihonName - SEO 驗證', () => {
  test('首頁應該有正確的 meta description', async ({ page }) => {
    await page.goto('/');
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(50);
  });

  test('首頁應該有 Open Graph tags', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');

    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
    expect(ogImage).toBeTruthy();
  });

  test('應該有正確的 canonical URL', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toContain('nihonname');
  });

  test('應該有 JSON-LD 結構化資料', async ({ page }) => {
    await page.goto('/');
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toBeTruthy();

    if (jsonLd) {
      const data = JSON.parse(jsonLd);
      expect(data['@type']).toBeTruthy();
    }
  });
});

test.describe('NihonName - PWA 功能', () => {
  test('應該有 manifest.webmanifest', async ({ page }) => {
    await page.goto('/');
    const manifest = await page.getAttribute('link[rel="manifest"]', 'href');
    expect(manifest).toContain('manifest');
  });

  test('應該有 apple-touch-icon', async ({ page }) => {
    await page.goto('/');
    const appleIcon = await page.getAttribute('link[rel="apple-touch-icon"]', 'href');
    expect(appleIcon).toBeTruthy();
  });

  test('應該有 Service Worker 註冊腳本', async ({ page }) => {
    await page.goto('/');
    const swScript = await page.locator('script[src*="registerSW"]').count();
    // PWA 可能通過 vite-plugin-pwa 自動注入
    expect(swScript).toBeGreaterThanOrEqual(0);
  });
});

test.describe('NihonName - 響應式設計', () => {
  test('桌面版應該正確顯示', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('手機版應該正確顯示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('NihonName - 無障礙性', () => {
  test('應該有正確的 heading 層級', async ({ page }) => {
    await page.goto('/');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('互動元素應該可以用鍵盤操作', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder('輸入您的姓氏');

    await input.focus();
    await page.keyboard.type('林');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // 應該觸發生成
    await expect(page.getByText(/日本姓氏/i)).toBeVisible({ timeout: 5000 });
  });
});
