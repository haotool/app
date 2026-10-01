import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE_PATH =
  `${process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise'}/`.replace(
    /\/+$/,
    '/',
  );
test.use({ serviceWorkers: 'allow' });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('ratewise:pwa-install-guide-dismissed:v1', 'true');
  });
});

test('原版換算卡片與切換器，v3 詳情收合且正常報價不占首屏', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(BASE_PATH);
  await page.waitForFunction(() =>
    document.documentElement.hasAttribute('data-ratewise-app-ready'),
  );
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const cash = page.getByRole('button', { name: '切換到現金匯率', exact: true });
  const spot = page.getByRole('button', { name: '切換到即期匯率', exact: true });
  await expect(cash).toBeVisible();
  await expect(spot).toBeVisible();
  await expect(
    page.getByRole('group', { name: '匯率類型', exact: true }).getByRole('button'),
  ).toHaveCount(2);
  await expect(page.getByTestId('fx-quote-details')).not.toHaveAttribute('open');
  await expect(page.getByLabel('換匯地點')).not.toBeVisible();
  await expect(page.getByLabel('換匯方式')).toHaveCount(0);
  await page.waitForFunction(
    () => !document.querySelector('[role="status"][aria-label="報價來源狀態"]'),
  );
  await spot.click();
  await expect(spot).toHaveAttribute('aria-pressed', 'true');
  await cash.click();
  await expect(cash).toHaveAttribute('aria-pressed', 'true');
  const positions = await page.evaluate(() => {
    const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    return {
      input: rect('[data-testid="amount-input"]').top,
      result: rect('[data-testid="amount-output"]').top,
      details: rect('[data-testid="fx-quote-details"]').top,
    };
  });
  expect(positions.input).toBeLessThan(positions.result);
  expect(positions.result).toBeLessThan(positions.details);
  await page.getByTestId('fx-quote-details').locator('summary').click();
  await expect(page.getByText('原始牌告與牌告中點', { exact: true })).toBeVisible();
  await page.getByTestId('fx-quote-details').locator('summary').click();
  await expect(page.getByText('背景更新初始化失敗', { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    document.querySelectorAll('[data-scroll-container]').forEach((element) => {
      element.scrollTop = 0;
    });
    window.scrollTo(0, 0);
  });
  await expect(page.getByTestId('trend-chart').locator('canvas').first()).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  mkdirSync('../../screenshots', { recursive: true });
  await page.screenshot({
    path: `../../screenshots/restored-${testInfo.project.name}.png`,
    animations: 'disabled',
  });
});

test('計算機正反向輸入、交換與加入歷史', async ({ page }) => {
  await page.goto(BASE_PATH);
  const source = page.getByTestId('amount-input');
  const result = page.getByTestId('amount-output');
  for (const [field, value] of [
    [source, '7'],
    [result, '5'],
  ] as const) {
    await field.click();
    const calculator = page.getByRole('dialog', { name: '計算機' });
    await expect(calculator).toBeVisible();
    await calculator.getByRole('button', { name: '清除全部', exact: true }).click();
    await calculator.getByRole('button', { name: `數字 ${value}`, exact: true }).click();
    await calculator.getByRole('button', { name: '計算結果', exact: true }).click();
    await expect(calculator).not.toBeVisible();
    await expect(field).toHaveText(new RegExp(`^${value}(?:\\.00)?$`));
  }
  const from = page.getByRole('combobox', { name: '選擇來源貨幣', exact: true });
  const to = page.getByRole('combobox', { name: '選擇目標貨幣', exact: true });
  const previousFrom = await from.inputValue();
  const previousTo = await to.inputValue();
  await page.getByTestId('swap-button').getByRole('button').click();
  await expect(from).toHaveValue(previousTo);
  await expect(to).toHaveValue(previousFrom);
  await page.getByRole('button', { name: '加入歷史記錄', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('ratewise-converter') ?? '{}');
        return saved.state?.history?.[0];
      }),
    )
    .toMatchObject({ from: previousTo, to: previousFrom });
});

test('多幣別保留逐列匯率切換，進階條件預設收合', async ({ page }) => {
  await page.goto(`${BASE_PATH}multi/`);
  await expect(page.getByRole('region', { name: '貨幣列表' })).toBeVisible();
  const toggle = page.getByRole('button', { name: /^切換到/ }).first();
  await expect(toggle).toBeVisible();
  const before = await toggle.textContent();
  await toggle.click();
  await expect(toggle).not.toHaveText(before!);
  await expect(page.getByLabel('換匯地點')).not.toBeVisible();
  await expect(page.getByLabel('換匯方式')).toHaveCount(0);
});
