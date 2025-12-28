/**
 * 基礎 E2E 測試
 * [BDD 測試策略]
 */
import { test, expect } from '@playwright/test';

test.describe('地震知識小學堂 - 基礎功能', () => {
  test('首頁應該正確載入', async ({ page }) => {
    // Given: 用戶訪問首頁
    await page.goto('/');

    // Then: 應該顯示標題
    await expect(page).toHaveTitle(/地震知識小學堂/);
  });

  test('首頁應該有開始探索按鈕', async ({ page }) => {
    // Given: 用戶在首頁
    await page.goto('/');

    // Then: 應該有開始探索按鈕
    const startButton = page.getByRole('button', { name: /開始探索/ });
    await expect(startButton).toBeVisible();
  });

  test('課程頁面應該正確載入', async ({ page }) => {
    // Given: 用戶訪問課程頁面
    await page.goto('/lessons/');

    // Then: 應該顯示課程內容
    await expect(page.getByText('能量模擬室')).toBeVisible();
  });

  test('測驗頁面應該正確載入', async ({ page }) => {
    // Given: 用戶訪問測驗頁面
    await page.goto('/quiz/');

    // Then: 應該顯示測驗標題
    await expect(page.getByText(/Knowledge Check/i)).toBeVisible();
  });

  test('關於頁面應該正確載入', async ({ page }) => {
    // Given: 用戶訪問關於頁面
    await page.goto('/about/');

    // Then: 應該顯示關於內容
    await expect(page.getByText('地震知識小學堂')).toBeVisible();
  });
});

test.describe('地震知識小學堂 - RWD 測試', () => {
  test('首頁在行動裝置上應該正確顯示', async ({ page }) => {
    // Given: 設定行動裝置視窗
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Then: 應該顯示標題
    await expect(page.getByText(/地震/)).toBeVisible();
  });

  test('首頁在桌面裝置上應該正確顯示', async ({ page }) => {
    // Given: 設定桌面視窗
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Then: 應該顯示標題
    await expect(page.getByText(/地震/)).toBeVisible();
  });
});
