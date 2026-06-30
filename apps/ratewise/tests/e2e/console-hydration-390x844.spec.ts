import { expect, test } from '@playwright/test';

test.describe('console-hydration @390×844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ['/', '/faq/', '/settings/']) {
    test(`console error=0 ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const hydrationErrors = errors.filter(
        (e) => e.includes('418') || e.includes('Hydration') || e.includes('hydration'),
      );
      expect(hydrationErrors, hydrationErrors.join('\n')).toHaveLength(0);
    });
  }
});
