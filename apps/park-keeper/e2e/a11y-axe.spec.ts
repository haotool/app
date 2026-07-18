import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TEXT, TEST_PHOTO_BASE64 } from './helpers';

/**
 * axe-core 無障礙常駐守門（R6，round-5 Sonnet meta 建議）。
 *
 * 背景：Settings 頁 opacity dimming 對比崩潰（NEW-1）存活 4 輪 16 份人工審查未被捕捉，
 * 根因是 a11y 驗證仰賴審查席抽測而非 CI 常駐迴歸。本 spec 以 axe-core 全規則集
 * （含 wcag2a/aa 的 color-contrast、label 類與 best-practice 的 landmark、heading-order）
 * 掃描四路由 × racing/kawaii 兩主題，0 violations 斷言，阻止同型反模式第 4 次復發。
 *
 * 主題選擇：racing（深底極端）與 kawaii（pastel 低對比極端，round-5 最嚴重 1.64:1）
 * 為對比破壞的兩個方向邊界；zen/classic 介於其間，token 層已由 constants.test.ts 守門。
 */

// 動畫縮短（useReducedMotion 分支）＋固定等待，避免掃描落在 motion 過場的中間態透明度。
test.use({ contextOptions: { reducedMotion: 'reduce' } });

const SETTLE_MS = 400;

async function expectNoAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id}(${v.impact ?? 'n/a'}) ×${v.nodes.length}: ` +
      v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join(' | '),
  );
  expect(summary, `${label} 應 0 axe violations`).toEqual([]);
}

/** 首頁載入後切換主題（Home 掛載完成的訊號 = 底部導覽存在，SSG 殼無底部導覽）。 */
async function switchTheme(page: Page, themeName: string) {
  await page.getByRole('button', { name: TEXT.tabSettings }).click();
  await page.getByRole('button', { name: themeName, exact: true }).click();
  await page.waitForTimeout(SETTLE_MS);
}

const THEME_MATRIX = [
  { id: 'racing', name: 'Nitro' },
  { id: 'cute', name: 'Kawaii' },
] as const;

for (const theme of THEME_MATRIX) {
  test.describe(`axe 守門 × ${theme.name}`, () => {
    test.use({
      permissions: ['geolocation'],
      geolocation: { latitude: 25.033, longitude: 121.5654 },
    });

    test(`設定頁與首頁空態 0 violations（${theme.id}）`, async ({ page }) => {
      await page.goto('/');
      await switchTheme(page, theme.name);

      // 設定 tab（round-5 NEW-1 現場：SettingGroup 標題、語言切換、天數/版本標籤）。
      await expect(page.getByRole('slider')).toBeVisible();
      await expectNoAxeViolations(page, `settings-${theme.id}`);

      // 首頁空態（round-5 NEW-2 現場：LCP hint、手動記錄連結；NEW-3 landmark）。
      await page.getByRole('button', { name: '列表' }).click();
      await expect(page.getByTestId('quick-record-cta')).toBeVisible();
      await page.waitForTimeout(SETTLE_MS);
      await expectNoAxeViolations(page, `home-empty-${theme.id}`);
    });

    test(`首頁有記錄態 0 violations（${theme.id}）`, async ({ page }) => {
      await page.goto('/');
      await switchTheme(page, theme.name);
      await page.getByRole('button', { name: '列表' }).click();

      // 注入照片 → 樓層即儲存，建立現役記錄（PickupHeroCard＋compact RecordCard）。
      await page.getByTestId('quick-record-cta-input').setInputFiles({
        name: 'axe-photo.png',
        mimeType: 'image/png',
        buffer: Buffer.from(TEST_PHOTO_BASE64, 'base64'),
      });
      await page.getByRole('button', { name: 'B2', exact: true }).click();
      await expect(page.getByTestId('quick-entry-handle')).toHaveCount(0);
      await expect(page.getByTestId('pickup-hero-card')).toBeVisible();
      // 等 toast（2.5s）退場，避免掃描到過場中間態。
      await page.waitForTimeout(3000);
      await expectNoAxeViolations(page, `home-with-record-${theme.id}`);
    });

    test(`/add 快速記錄頁 0 violations（${theme.id}）`, async ({ page }) => {
      // 先在首頁持久化主題設定（IndexedDB），/add 直達時讀取同一設定。
      await page.goto('/');
      await switchTheme(page, theme.name);

      await page.goto('add');
      await expect(page.getByTestId('quick-entry-photo-input')).toBeAttached();
      await page.waitForTimeout(SETTLE_MS);
      await expectNoAxeViolations(page, `add-${theme.id}`);
    });

    test(`/guide 教學頁 0 violations（${theme.id}）`, async ({ page }) => {
      // /guide 為固定亮底靜態頁；主題切換後導入驗證無深主題 token 殘漏。
      await page.goto('/');
      await switchTheme(page, theme.name);

      await page.goto('guide');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForTimeout(SETTLE_MS);
      await expectNoAxeViolations(page, `guide-${theme.id}`);
    });
  });
}
