import { expect, test } from '@playwright/test';

test.describe('mobile-pwa-smoke @390×844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ['/', '/multi/', '/favorites/', '/settings/']) {
    test(`no blank screen ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible();
      await expect(
        page.getByRole('navigation').or(page.locator('[data-testid="rate-hero-section"]')),
      ).toBeVisible();
    });
  }
});
