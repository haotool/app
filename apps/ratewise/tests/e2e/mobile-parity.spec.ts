import { test, expect } from '@playwright/test';

const EXPECTED_CONTENT = [
  { role: 'heading', name: 'RateWise 匯率好工具' },
  { role: 'heading', name: '常見問題精選' },
  { role: 'link', name: '查看完整 FAQ' },
];

test('core content parity across desktop and mobile', async ({ page }) => {
  await page.goto('/');

  for (const item of EXPECTED_CONTENT) {
    await expect(
      page.getByRole(item.role as 'heading' | 'link', { name: item.name }),
    ).toBeVisible();
  }

  await expect(page.getByText('Taiwan Bank (臺灣銀行牌告匯率)').first()).toBeVisible();
});
