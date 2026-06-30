import { expect, test } from '@playwright/test';

test.describe('hero-y @390×844 (hero-v2 default)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('AC-HERO-01: hero rate display y≤120px @ default hero-v2', async ({ page }) => {
    await page.goto('/');
    const heroRate = page.getByTestId('hero-rate-display');
    await expect(heroRate).toBeVisible();
    const box = await heroRate.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThanOrEqual(120);
  });

  test('AC-HERO-02: hero rate font-size ≥32px @ default hero-v2', async ({ page }) => {
    await page.goto('/');
    const heroRate = page.getByTestId('hero-rate-display');
    await expect(heroRate).toBeVisible();
    const fontSize = await heroRate.evaluate((el) =>
      Number.parseFloat(window.getComputedStyle(el).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(32);
  });

  test('AC3: rate tabs min-h ≥44px @ default hero-v2', async ({ page }) => {
    await page.goto('/');
    const rateTabs = page.getByTestId('hero-rate-tabs');
    await expect(rateTabs).toBeVisible();
    const spotTab = rateTabs.getByRole('tab').first();
    const box = await spotTab.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('AC4: dual currency inputs font-size ≥20px @ default hero-v2', async ({ page }) => {
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

  test('AC5: inline numpad visible on 844px viewport @ default hero-v2', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('hero-numpad')).toBeVisible();
    await expect(page.getByTestId('hero-numpad-key-7')).toBeVisible();
    await expect(page.getByTestId('hero-numpad-backspace')).toBeVisible();
  });

  test('AC6: inline swap button does not overlap currency inputs @ default hero-v2', async ({
    page,
  }) => {
    await page.goto('/');
    const swap = page.getByTestId('hero-swap-button');
    const fromInput = page.getByTestId('hero-currency-input-from');
    await expect(swap).toBeVisible();
    const swapBox = await swap.boundingBox();
    const fromBox = await fromInput.boundingBox();
    expect(swapBox).not.toBeNull();
    expect(fromBox).not.toBeNull();
    expect(swapBox!.y).toBeGreaterThanOrEqual(fromBox!.y - 4);
    expect(swapBox!.y + swapBox!.height).toBeLessThanOrEqual(fromBox!.y + fromBox!.height + 4);
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
