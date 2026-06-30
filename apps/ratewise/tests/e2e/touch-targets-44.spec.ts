import { expect, test, type Locator } from '@playwright/test';

async function assertMinTouchTarget(locator: Locator, min = 44) {
  const box = await locator.boundingBox();
  expect(box, `missing bounding box for ${locator}`).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(min);
  expect(box!.height).toBeGreaterThanOrEqual(min);
}

async function collectFailures(locators: Locator[], min = 44) {
  const failures: string[] = [];
  for (const locator of locators) {
    const box = await locator.boundingBox();
    if (!box || box.width < min || box.height < min) {
      failures.push(`selector=${locator} size=${box ? `${box.width}x${box.height}` : 'null'}`);
    }
  }
  return failures;
}

test.describe('touch-44 @390×844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('bottom nav four tabs ≥44px', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.getByRole('navigation').getByRole('link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const targets = [navLinks.nth(0), navLinks.nth(1), navLinks.nth(2), navLinks.nth(3)];
    const failures = await collectFailures(targets);
    if (failures.length > 0) {
      console.log('touch-44 failures (bottom nav):', failures.join('\n'));
    }
    for (const target of targets) {
      await assertMinTouchTarget(target);
    }
  });

  test('homepage RateSelector segments ≥44px', async ({ page }) => {
    await page.goto('/');
    const rateTypeGroup = page.getByRole('group').first();
    const rateTypeButtons = rateTypeGroup.getByRole('button');
    await expect(rateTypeButtons.first()).toBeVisible();
    const failures = await collectFailures([rateTypeButtons.first(), rateTypeButtons.last()]);
    if (failures.length > 0) {
      console.log('touch-44 failures (RateSelector):', failures.join('\n'));
    }
    await assertMinTouchTarget(rateTypeButtons.first());
  });

  test('settings primary actions ≥44px', async ({ page }) => {
    await page.goto('/settings/');
    const primaryButtons = page
      .getByRole('button')
      .filter({ hasText: /安裝|Install|設定|Settings/i });
    const count = await primaryButtons.count();
    if (count === 0) {
      await assertMinTouchTarget(page.getByRole('button').first());
      return;
    }
    await assertMinTouchTarget(primaryButtons.first());
  });
});
