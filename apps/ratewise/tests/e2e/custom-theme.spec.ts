import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

/**
 * E2 wave-C 自訂主題色 - 選色 BottomSheet 旅程 E2E
 *
 * 旅程（依設計簡報品質閘門）：
 * 1. 設定頁點選「自訂主題色」卡 → 選色 BottomSheet 開啟
 * 2. 點精選色票／在 react-colorful 面板拖曳選色 → 即時全 app 套用
 * 3. 背景色調三選一切換 → background/surface-sunken 淡色對即時套用
 * 4. 重載後主色與背景調仍生效（持久化 + bootstrap/applyTheme）
 * 5. 恢復預設 → 回 zen、inline 覆寫零殘留
 */

const CORAL = '#FF6B6B';
const CORAL_TRIPLE = '255 107 107';
// CUSTOM_BACKGROUND_TONES SSOT：warm background #FDF9F3 / zen 現值 pure #F8FAFC。
const WARM_BACKGROUND_TRIPLE = '253 249 243';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const getInlineVar = (page: Page, name: string) =>
  page.evaluate((cssVar) => document.documentElement.style.getPropertyValue(cssVar).trim(), name);

const getInlinePrimary = (page: Page) => getInlineVar(page, '--color-primary');

const getDataStyle = (page: Page) => page.evaluate(() => document.documentElement.dataset['style']);

const getStoredTheme = async (page: Page) => {
  const stored = await page.evaluate(() => localStorage.getItem('ratewise-theme'));
  return JSON.parse(stored ?? '{}') as {
    style?: string;
    customPrimary?: string;
    customBackgroundTone?: string;
  };
};

const customCard = (page: Page) => page.getByRole('button', { name: '自訂主題色 打造專屬主色' });

const sheet = (page: Page) => page.getByTestId('custom-theme-sheet');

const gotoSettings = async (page: Page) => {
  await page.getByRole('link', { name: /設定/i }).first().click();
  await expect(customCard(page)).toBeVisible();
};

test.describe('自訂主題色選色 BottomSheet 旅程', () => {
  test('開 sheet → 拖曳選色 → 背景調切換 → 重載持久 → 恢復預設', async ({ rateWisePage: page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    // 行動版安裝導引通知會攔截點擊，預先 dismiss（同 converter-v2.spec 作法）。
    await page.addInitScript(() => {
      sessionStorage.setItem('ratewise:pwa-install-guide-dismissed:v1', 'true');
    });
    await page.reload();

    // 1. 進設定頁，點自訂主題卡 → 選色 sheet 開啟
    await gotoSettings(page);
    await customCard(page).click();
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).getByRole('group', { name: '精選色票' })).toBeVisible();
    expect(await getDataStyle(page)).toBe('custom');

    // 2a. 點珊瑚色票 → 即時全 app 套用
    await sheet(page)
      .getByRole('button', { name: `自訂主題色 ${CORAL}` })
      .click();
    await expect.poll(() => getInlinePrimary(page)).toBe(CORAL_TRIPLE);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', CORAL);
    expect(await getStoredTheme(page)).toMatchObject({ style: 'custom', customPrimary: CORAL });

    // 2b. react-colorful 飽和度面板拖曳選色 → 主色即時跟隨且持久化
    const saturation = sheet(page).locator('.react-colorful__saturation');
    const box = await saturation.boundingBox();
    if (!box) throw new Error('saturation panel not visible');
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.3, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => (await getStoredTheme(page)).customPrimary).not.toBe(CORAL);
    const draggedHex = (await getStoredTheme(page)).customPrimary ?? '';
    expect(draggedHex).toMatch(HEX_PATTERN);
    const draggedTriple = await getInlinePrimary(page);
    expect(draggedTriple).not.toBe(CORAL_TRIPLE);

    // 3. 背景色調切換至暖白 → background 淡色對即時套用並持久化
    await sheet(page).getByTestId('background-tone-warm').click();
    await expect.poll(() => getInlineVar(page, '--color-background')).toBe(WARM_BACKGROUND_TRIPLE);
    expect(await getStoredTheme(page)).toMatchObject({
      style: 'custom',
      customPrimary: draggedHex,
      customBackgroundTone: 'warm',
    });

    // 關閉 sheet 後首頁同步變色（inline 覆寫掛在 documentElement，全路由生效）
    await sheet(page).getByRole('button', { name: '關閉' }).click();
    await expect(sheet(page)).not.toBeVisible();
    await page
      .getByRole('link', { name: /單幣別/i })
      .first()
      .click();
    await expect(page.getByTestId('amount-input')).toBeVisible();
    expect(await getInlinePrimary(page)).toBe(draggedTriple);

    // 4. 重載仍生效（持久化 + bootstrap pre-paint + applyTheme 完整演算）
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('amount-input')).toBeVisible();
    expect(await getDataStyle(page)).toBe('custom');
    await expect.poll(() => getInlinePrimary(page)).toBe(draggedTriple);
    await expect.poll(() => getInlineVar(page, '--color-background')).toBe(WARM_BACKGROUND_TRIPLE);

    // 5. 恢復預設 → 回 zen、inline 覆寫零殘留
    await gotoSettings(page);
    await customCard(page).click();
    await expect(sheet(page)).toBeVisible();
    await sheet(page).getByRole('button', { name: '恢復預設主題' }).click();
    await expect.poll(() => getDataStyle(page)).toBe('zen');
    await expect(sheet(page)).not.toBeVisible();
    const residual = await page.evaluate(() => {
      const style = document.documentElement.style;
      return Array.from(style).filter((name) => name.startsWith('--color-'));
    });
    expect(residual).toEqual([]);
    expect(await getStoredTheme(page)).toMatchObject({ style: 'zen' });

    expect(consoleErrors).toEqual([]);
  });
});
