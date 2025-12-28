/**
 * Home Page E2E Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('應該顯示主標題', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Quake-School');
  });

  test('應該顯示功能特色區塊', async ({ page }) => {
    await expect(page.getByText('功能特色')).toBeVisible();
    await expect(page.getByText('地震知識')).toBeVisible();
    await expect(page.getByText('防災準備')).toBeVisible();
    await expect(page.getByText('緊急應變')).toBeVisible();
    await expect(page.getByText('PWA 支援')).toBeVisible();
  });

  test('「開始學習防災知識」按鈕應該導航到防災指南', async ({ page }) => {
    await page.getByRole('link', { name: /開始學習防災知識/i }).click();
    await expect(page).toHaveURL(/\/guide\/?/);
    await expect(page.locator('h1')).toContainText('地震防災指南');
  });

  test('導航列應該正常運作', async ({ page }) => {
    // 點擊關於
    await page.getByRole('link', { name: /關於/i }).click();
    await expect(page).toHaveURL(/\/about\/?/);

    // 點擊常見問題
    await page.getByRole('link', { name: /常見問題/i }).click();
    await expect(page).toHaveURL(/\/faq\/?/);

    // 回到首頁
    await page.getByRole('link', { name: /Quake-School 首頁/i }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('RWD 響應式設計', () => {
  test('桌面版應該顯示完整導航文字', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // 桌面版導航文字應該可見
    await expect(page.getByRole('navigation').getByText('首頁')).toBeVisible();
    await expect(page.getByRole('navigation').getByText('防災指南')).toBeVisible();
  });

  test('手機版應該正常顯示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 主標題應該可見
    await expect(page.locator('h1')).toContainText('Quake-School');

    // 功能卡片應該可見
    await expect(page.getByText('地震知識')).toBeVisible();
  });
});
