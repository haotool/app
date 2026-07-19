import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { acknowledgeDisclaimer, mockBybit } from './support/mock-bybit';

const { version: pkgVersion } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
) as { version: string };

// WebKit 不認得 interactive-widget viewport key，屬既有 meta 噪音、非應用錯誤。
const KNOWN_NOISE = /Viewport argument key "interactive-widget" not recognized/;

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !KNOWN_NOISE.test(message.text())) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

test.describe('R4 交易頁 UIUX 375×812', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('滑桿雙向同步、等高、中間價列與滿倉下單', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await mockBybit(page);
    await page.goto('/papertrade/trade');
    await acknowledgeDisclaimer(page);
    await expect(page.getByText('60,000.0').first()).toBeVisible();

    const slider = page.getByRole('slider', { name: '數量比例' });
    const amount = page.getByRole('textbox', { name: '數量（USDT）' });

    // 真實拖曳滑桿至約 50%：amount 即時回寫。
    const box = await slider.boundingBox();
    if (box === null) throw new Error('slider not visible');
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 10 + (box.width - 20) * 0.5, box.y + box.height / 2, {
      steps: 8,
    });
    await page.mouse.up();
    const draggedPct = Number(await slider.inputValue());
    expect(Math.abs(draggedPct - 50)).toBeLessThanOrEqual(3);
    await expect(amount).not.toHaveValue('');

    // 手動輸入 amount → 滑桿即時反映。
    await amount.fill('49726');
    await expect(slider).toHaveValue('50');
    await expect(slider).toHaveAttribute('aria-valuetext', '50%');

    // 左右等高（±4px）。
    const formBox = await page.getByRole('form', { name: '下單表單' }).boundingBox();
    const bookBox = await page.getByRole('region', { name: '訂單簿' }).boundingBox();
    if (formBox === null || bookBox === null) throw new Error('boxes not visible');
    expect(Math.abs(formBox.height - bookBox.height)).toBeLessThanOrEqual(4);

    // 檔數自適應：mock 各 6 檔，此視口高度必須裁切（單側 ≥3 且 <6）且無內部捲動。
    const book = page.getByRole('region', { name: '訂單簿' });
    await expect(book.getByRole('button', { name: /以最新價/ })).toBeVisible();
    const readBookFit = () =>
      book.evaluate((element) => {
        const sides = Array.from(element.querySelectorAll('ol')).map(
          (list) => list.querySelectorAll('button').length,
        );
        return {
          asks: sides[0] ?? 0,
          bids: sides[1] ?? 0,
          overflow: element.scrollHeight - element.clientHeight,
        };
      });
    await expect.poll(async () => (await readBookFit()).overflow).toBeLessThanOrEqual(1);
    const bookFit = await readBookFit();
    expect(bookFit.asks).toBeGreaterThanOrEqual(3);
    expect(bookFit.asks).toBeLessThan(6);
    expect(bookFit.bids).toBe(bookFit.asks);

    // 中間價列點擊帶入限價。
    await page.getByRole('button', { name: /以最新價 60,000\.0 帶入限價/ }).click();
    await expect(page.getByRole('tab', { name: '限價' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('textbox', { name: '限價（USDT）' })).toHaveValue('60000');

    // 買1／賣1 帶入頂檔。
    await page.getByRole('button', { name: '帶入買1價' }).click();
    await expect(page.getByRole('textbox', { name: '限價（USDT）' })).toHaveValue('59940');
    await page.getByRole('button', { name: '帶入賣1價' }).click();
    await expect(page.getByRole('textbox', { name: '限價（USDT）' })).toHaveValue('60060');

    // 限價模式左右仍等高。
    const formBoxLimit = await page.getByRole('form', { name: '下單表單' }).boundingBox();
    const bookBoxLimit = await page.getByRole('region', { name: '訂單簿' }).boundingBox();
    if (formBoxLimit === null || bookBoxLimit === null) throw new Error('boxes not visible');
    expect(Math.abs(formBoxLimit.height - bookBoxLimit.height)).toBeLessThanOrEqual(4);

    // 回市價 100% 滿倉可下單不拒單。
    await page.getByRole('tab', { name: '市價' }).click();
    await slider.focus();
    await page.keyboard.press('End');
    await expect(slider).toHaveValue('100');
    await page.getByRole('button', { name: '做多' }).click();
    await expect(page.getByText('持倉 (1)')).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();

    // 保證金模式切換 sheet（R6-2）：切到全倉後 pill 文案跟隨。
    await page.getByRole('button', { name: '保證金模式：逐倉，點擊切換' }).click();
    await expect(page.getByRole('dialog', { name: '保證金模式' })).toBeVisible();
    await page.getByRole('radio', { name: '全倉' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: '保證金模式：全倉，點擊切換' })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('設定頁顯示 package.json 版本', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await mockBybit(page);
    await page.goto('/papertrade/settings');
    await acknowledgeDisclaimer(page);
    await expect(page.getByText(`版本 v${pkgVersion}`)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('R4 交易頁 UIUX 1280×800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('lg CTA 停靠右欄不遮圖表、右欄頂緣對齊', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await mockBybit(page);
    await page.goto('/papertrade/chart/BTCUSDT');
    await acknowledgeDisclaimer(page);
    await expect(page.getByRole('heading', { name: /BTC/ })).toBeVisible();

    const chartBox = await page.getByTestId('candle-chart').boundingBox();
    const ctaBox = await page.getByRole('link', { name: '做多' }).boundingBox();
    if (chartBox === null || ctaBox === null) throw new Error('boxes not visible');
    // CTA 停靠右欄：與左欄圖表水平不重疊。
    expect(ctaBox.x).toBeGreaterThanOrEqual(chartBox.x + chartBox.width);

    const pairButtonBox = await page.getByRole('button', { name: /切換交易對/ }).boundingBox();
    const tablistBox = await page.getByRole('tablist', { name: '市場資訊' }).boundingBox();
    if (pairButtonBox === null || tablistBox === null) throw new Error('boxes not visible');
    expect(Math.abs(tablistBox.y - pairButtonBox.y)).toBeLessThanOrEqual(4);

    expect(errors).toEqual([]);
  });

  test('lg 交易頁左右等高', async ({ page }) => {
    await mockBybit(page);
    await page.goto('/papertrade/trade');
    await acknowledgeDisclaimer(page);
    await expect(page.getByText('60,000.0').first()).toBeVisible();

    const formBox = await page.getByRole('form', { name: '下單表單' }).boundingBox();
    const bookBox = await page.getByRole('region', { name: '訂單簿' }).boundingBox();
    if (formBox === null || bookBox === null) throw new Error('boxes not visible');
    expect(Math.abs(formBox.height - bookBox.height)).toBeLessThanOrEqual(4);
  });
});
