import { expect, test } from '@playwright/test';

test.describe('hero-y @390×844 (hero-v2 default)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('AC1: rate tabs y≤120px @ default hero-v2', async ({ page }) => {
    await page.goto('/');
    const rateTabs = page.getByTestId('hero-rate-tabs');
    await expect(rateTabs).toBeVisible();
    const box = await rateTabs.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThanOrEqual(124);
  });

  test('AC2: dual currency inputs font-size ≥20px @ default hero-v2', async ({ page }) => {
    await page.goto('/');
    const fromInput = page.getByTestId('hero-currency-input-from');
    const toInput = page.getByTestId('hero-currency-input-to');
    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();
    const fromFontSize = await fromInput.evaluate((el) =>
      Number.parseFloat(window.getComputedStyle(el).fontSize),
    );
    const toFontSize = await toInput.evaluate((el) =>
      Number.parseFloat(window.getComputedStyle(el).fontSize),
    );
    expect(fromFontSize).toBeGreaterThanOrEqual(20);
    expect(toFontSize).toBeGreaterThanOrEqual(20);
  });

  test('AC3: inline numpad visible on 844px viewport @ default hero-v2', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('hero-numpad')).toBeVisible();
    await expect(page.getByTestId('hero-numpad-key-7')).toBeVisible();
    await expect(page.getByTestId('hero-numpad-backspace')).toBeVisible();
  });

  test('legacy layout keeps amount-first order @ ?ux=legacy', async ({ page }) => {
    await page.goto('/?ux=legacy');
    const amountInput = page.getByTestId('amount-input');
    const heroRate = page.getByTestId('hero-rate-display');
    const amountBox = await amountInput.boundingBox();
    const heroBox = await heroRate.boundingBox();
    expect(amountBox).not.toBeNull();
    expect(heroBox).not.toBeNull();
    expect(amountBox!.y).toBeLessThan(heroBox!.y);
  });
});
