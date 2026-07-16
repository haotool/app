import { test, expect } from '@playwright/test';
import { getFab } from './helpers';

test.describe('首頁載入', () => {
  test('標題與 FAB 可見，且無 console error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'ParkKeeper' })).toBeVisible();
    await expect(getFab(page)).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
