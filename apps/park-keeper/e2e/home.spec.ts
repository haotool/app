import { test, expect } from '@playwright/test';

test.describe('首頁載入', () => {
  test('標題與拍照 CTA 可見，且無 console error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'ParkKeeper' })).toBeVisible();
    // 主動作唯一化（issue #753）：底部 + FAB 已移除，拍照 CTA 為唯一首屏主動作入口。
    await expect(page.getByTestId('quick-record-cta')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
