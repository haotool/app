import { test, expect, type Page } from '@playwright/test';
import { acknowledgeDisclaimer, mockBybit } from './support/mock-bybit';

// P0 防回歸：路由若與靜態目錄（如 /assets/）撞名，硬導航會被伺服器攔截非 200。
const DEEP_LINKS: { path: string; assert: (page: Page) => Promise<void> }[] = [
  {
    path: '/papertrade/',
    assert: async (page) => {
      await expect(page.getByRole('searchbox', { name: '搜尋交易對' })).toBeVisible();
    },
  },
  {
    path: '/papertrade/chart/BTCUSDT',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: /BTC/ })).toBeVisible();
    },
  },
  {
    path: '/papertrade/trade',
    assert: async (page) => {
      await expect(page.getByRole('form', { name: '下單表單' })).toBeVisible();
    },
  },
  {
    path: '/papertrade/portfolio',
    assert: async (page) => {
      await expect(page.getByText('總權益（USDT）')).toBeVisible();
    },
  },
  {
    path: '/papertrade/settings',
    assert: async (page) => {
      await expect(page.getByText('關於 PaperTrade')).toBeVisible();
    },
  },
];

test.describe('五個 tab 深鏈直接導航', () => {
  for (const { path, assert } of DEEP_LINKS) {
    test(`直接導航 ${path} 回應 200 並渲染正確頁面`, async ({ page }) => {
      await mockBybit(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await assert(page);
    });
  }
});

test.describe('圖表最新成交', () => {
  test('首次點擊即顯示 REST 回填的成交列表', async ({ page }) => {
    await mockBybit(page);
    await page.goto('/papertrade/chart/BTCUSDT');
    await acknowledgeDisclaimer(page);

    await page.getByRole('tab', { name: '最新成交' }).click();
    const tradeList = page.locator('section[aria-label="最新成交"]');
    await expect(tradeList.getByRole('listitem').first()).toBeVisible();
  });
});
