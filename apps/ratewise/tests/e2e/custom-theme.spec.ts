import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

/**
 * E2/E7 自訂主題色 - 主題工作室 BottomSheet 旅程 E2E
 *
 * 旅程（wave-B draft 語意＋wave-C 主題工作室最終版）：
 * 1. 設定頁點選「自訂主題色」卡 → 主題工作室 sheet 開啟（預覽縮影卡可見）
 * 2. 點精選色票／展開「自訂…」在 react-colorful 拖曳選色 → 即時全站預覽（draft 不持久化）
 * 3. 背景色調切換＋亮度滑桿 → background 即時套用
 * 4. 關閉 sheet＝commit → 持久化；重載後主色與背景調仍生效（bootstrap/applyTheme）
 * 5. 還原預設（二段確認）→ 回 zen、inline 覆寫零殘留
 */

const CORAL = '#FF6B6B';
const CORAL_TRIPLE = '255 107 107';
// CUSTOM_BACKGROUND_TONES SSOT：warm background #FDF9F3。
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

test.describe('主題工作室選色旅程（draft/commit 語意）', () => {
  test('開 sheet → 選色 → 亮度滑桿 → 關閉 commit → 重載持久 → 還原預設', async ({
    rateWisePage: page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    // 行動版安裝導引通知會攔截點擊，預先 dismiss（同 converter-v2.spec 作法）。
    await page.addInitScript(() => {
      sessionStorage.setItem('ratewise:pwa-install-guide-dismissed:v1', 'true');
    });
    await page.reload();

    // 1. 進設定頁，點自訂主題卡 → 主題工作室開啟（預覽縮影卡承擔所見即所得）
    await gotoSettings(page);
    await customCard(page).click();
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).getByTestId('custom-theme-live-preview')).toBeVisible();
    await expect(sheet(page).getByRole('group', { name: '精選色票' })).toBeVisible();
    expect(await getDataStyle(page)).toBe('custom');

    // 2a. 點珊瑚色票 → 即時全站預覽（draft：persist 零寫入）
    await sheet(page)
      .getByRole('button', { name: `自訂主題色 ${CORAL}` })
      .click();
    await expect.poll(() => getInlinePrimary(page)).toBe(CORAL_TRIPLE);
    expect((await getStoredTheme(page)).customPrimary).not.toBe(CORAL);

    // 2b. 展開「自訂…」→ react-colorful 拖曳選色 → 主色即時跟隨（仍為 draft）
    await sheet(page).getByTestId('custom-theme-advanced-toggle').click();
    const saturation = sheet(page).locator('.react-colorful__saturation');
    const box = await saturation.boundingBox();
    if (!box) throw new Error('saturation panel not visible');
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.3, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => getInlinePrimary(page)).not.toBe(CORAL_TRIPLE);
    const draggedTriple = await getInlinePrimary(page);

    // 3. 背景色調切換至暖白 → background 淡色對即時套用（draft）
    await sheet(page).getByTestId('background-tone-warm').click();
    await expect.poll(() => getInlineVar(page, '--color-background')).toBe(WARM_BACKGROUND_TRIPLE);

    // 3b. 亮度滑桿拖至深端 → 連續 tone（hex）即時套用深色派生
    await sheet(page).getByTestId('custom-theme-tone-slider').fill('10');
    await expect
      .poll(() => getInlineVar(page, '--color-background'))
      .not.toBe(WARM_BACKGROUND_TRIPLE);

    // 回到暖白 preset，確立 commit 目標值
    await sheet(page).getByTestId('background-tone-warm').click();
    await expect.poll(() => getInlineVar(page, '--color-background')).toBe(WARM_BACKGROUND_TRIPLE);

    // 4. 關閉 sheet＝commit：單次原子持久化主色＋背景調
    await sheet(page).getByRole('button', { name: '關閉' }).click();
    await expect(sheet(page)).not.toBeVisible();
    const committed = await getStoredTheme(page);
    expect(committed.style).toBe('custom');
    expect(committed.customPrimary ?? '').toMatch(HEX_PATTERN);
    expect(committed.customBackgroundTone).toBe('warm');

    await page
      .getByRole('link', { name: /單幣別/i })
      .first()
      .click();
    await expect(page.getByTestId('amount-input')).toBeVisible();
    expect(await getInlinePrimary(page)).toBe(draggedTriple);

    // 重載仍生效（持久化 + bootstrap pre-paint + applyTheme 完整演算）
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('amount-input')).toBeVisible();
    expect(await getDataStyle(page)).toBe('custom');
    await expect.poll(() => getInlinePrimary(page)).toBe(draggedTriple);
    await expect.poll(() => getInlineVar(page, '--color-background')).toBe(WARM_BACKGROUND_TRIPLE);

    // 5. 還原預設（二段確認）→ 回 zen、inline 覆寫零殘留
    await gotoSettings(page);
    await customCard(page).click();
    await expect(sheet(page)).toBeVisible();
    await sheet(page).getByTestId('custom-theme-reset').click();
    await sheet(page).getByTestId('custom-theme-reset').click();
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
