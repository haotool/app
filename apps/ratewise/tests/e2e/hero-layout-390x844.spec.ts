import { expect, test } from '@playwright/test';

test.describe('hero-y @390×844 (hero-v2 flag)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('AC1: hero rate y≤120px @ ?ux=hero-v2', async ({ page }) => {
    await page.goto('/?ux=hero-v2');
    const heroRate = page.getByTestId('hero-rate-display');
    await expect(heroRate).toBeVisible();
    const box = await heroRate.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThanOrEqual(120);
  });

  test('AC2: hero rate font ≥32px @ ?ux=hero-v2', async ({ page }) => {
    await page.goto('/?ux=hero-v2');
    const fontSize = await page.getByTestId('hero-rate-display').evaluate((el) => {
      return Number.parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(fontSize).toBeGreaterThanOrEqual(32);
  });

  test('legacy layout keeps default order without hero-v2 flag', async ({ page }) => {
    await page.goto('/');
    const amountInput = page.getByTestId('amount-input');
    const heroRate = page.getByTestId('hero-rate-display');
    const amountBox = await amountInput.boundingBox();
    const heroBox = await heroRate.boundingBox();
    expect(amountBox).not.toBeNull();
    expect(heroBox).not.toBeNull();
    expect(amountBox!.y).toBeLessThan(heroBox!.y);
  });
});
