/**
 * E10 單幣別整頁 fold 佈局 E2E：fold 合約矩陣
 *
 * fold 合約（v1）：首屏底界 = 匯率結果卡（含加入歷史紀錄動作）底緣。
 * 全視口斷言：
 * 1. 歷史動作 bottom ≤ 視口高（且不被固定底導覽遮蓋）
 * 2. fold 下方第一個元素（四價詳情）在視口外
 * 3. 主捲動區可捲動至底
 * v2 僅驗證不回歸（#667 零捲動合約），並輸出兩模式截圖矩陣。
 *
 * @see .claude/prds/single-converter-fold-design.md
 */

import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

// fold 視口矩陣：小高度（360×640 最嚴）＋主流＋#675 snug 帶＋webview 模擬（390×700）。
const FOLD_VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 360, height: 740 },
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 390, height: 700 }, // GPT/IG/Threads webview 模擬：工具列佔用後實際可視區
] as const;

// 合成 aggregate 歷史資料（column-major），避免趨勢請求觸外網或 404 汙染 console。
function buildMockAggregateHistory(days = 30) {
  const baseRates: Record<string, number> = {
    TWD: 1,
    USD: 31.5,
    EUR: 34.2,
    JPY: 0.21,
    GBP: 39.9,
    AUD: 20.5,
    CAD: 23.0,
    SGD: 23.5,
    CHF: 35.5,
    KRW: 0.023,
    CNY: 4.3,
    HKD: 4.0,
    NZD: 19.0,
    THB: 0.87,
    PHP: 0.55,
    IDR: 0.002,
    VND: 0.0013,
    MYR: 6.7,
  };
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const rates: Record<string, number[]> = {};
  for (const [code, base] of Object.entries(baseRates)) {
    rates[code] = dates.map((_, i) => base * (1 + Math.sin(i / 5) * 0.01));
  }
  return { updateTime: `${dates[0]}T08:00:00+08:00`, dates, rates };
}

// 前置：關閉 PWA 安裝導引避免遮擋、mock aggregate 端點、隱藏與待測 UI 無關的更新 toast。
async function prepareFoldPage(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('ratewise:pwa-install-guide-dismissed:v1', 'true');
  });
  await page.route(
    (url) => url.toString().includes('history-30d.json'),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMockAggregateHistory()),
      });
    },
  );
  await page.reload();
  await expect(page.getByTestId('single-converter-fold')).toBeVisible({ timeout: 30_000 });
  await page.addStyleTag({
    content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
  });
}

// 主捲動容器（AppLayout main）＋固定底導覽頂緣量測。
async function getScrollMetrics(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector('main[data-scroll-container="main"]');
    const nav = [...document.querySelectorAll('nav')].find(
      (el) => getComputedStyle(el).position === 'fixed',
    );
    return {
      scrollTop: main?.scrollTop ?? 0,
      scrollHeight: main?.scrollHeight ?? 0,
      clientHeight: main?.clientHeight ?? 0,
      navTop: nav ? nav.getBoundingClientRect().top : window.innerHeight,
      innerHeight: window.innerHeight,
    };
  });
}

test.describe('E10 v1 fold 合約矩陣', () => {
  // 僅在行動裝置 project 執行：桌面（md+，#643 兩欄）無 fold 壓力。
  test.skip(({ isMobile }) => !isMobile, 'fold 合約僅適用行動視口');

  test.beforeEach(() => {
    test.setTimeout(180_000);
  });

  test('8 視口：歷史動作零捲動可見、fold 下方第一元素在視口外、可捲至底', async ({
    rateWisePage: page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await prepareFoldPage(page);

    for (const viewport of FOLD_VIEWPORTS) {
      await page.setViewportSize(viewport);
      const label = `${viewport.width}x${viewport.height}`;

      // 視口切換後重置捲動位置，等待 --app-height 隨 visualViewport resize 更新。
      await page.evaluate(() => {
        document.querySelector('main[data-scroll-container="main"]')?.scrollTo(0, 0);
      });
      await expect
        .poll(async () => (await getScrollMetrics(page)).innerHeight, {
          message: `${label} 視口高度應生效`,
        })
        .toBe(viewport.height);

      const metrics = await getScrollMetrics(page);

      // 1. fold 底界：加入歷史紀錄動作零捲動完整可見，且不被固定底導覽遮蓋。
      const historyButton = page
        .getByTestId('rate-result-card')
        .getByRole('button', { name: '加入歷史記錄' });
      const historyBox = await historyButton.boundingBox();
      expect(historyBox, `${label} 歷史動作應可見`).not.toBeNull();
      expect(
        historyBox!.y + historyBox!.height,
        `${label} 歷史動作 bottom 不得超出視口（svh）`,
      ).toBeLessThanOrEqual(viewport.height + 0.5);
      expect(
        historyBox!.y + historyBox!.height,
        `${label} 歷史動作不得被固定底導覽（top=${metrics.navTop}）遮蓋`,
      ).toBeLessThanOrEqual(metrics.navTop + 0.5);
      expect(historyBox!.y, `${label} 歷史動作頂緣不得高於視口`).toBeGreaterThanOrEqual(-0.5);
      // 44px 觸控合約不回歸。
      expect(historyBox!.height, `${label} 歷史動作高度 ≥44px`).toBeGreaterThanOrEqual(44);

      // fold 首屏內容完整：快速金額列（fold 存在理由）零捲動可見。
      for (const testId of ['quick-amounts-from', 'quick-amounts-to', 'amount-input']) {
        const box = await page.getByTestId(testId).boundingBox();
        expect(box, `${label} ${testId} 應可見`).not.toBeNull();
        expect(box!.y + box!.height, `${label} ${testId} 底緣不得超出視口`).toBeLessThanOrEqual(
          viewport.height + 0.5,
        );
      }

      // 2. fold 下方第一個元素（四價詳情）必須在首屏視口外。
      const belowFoldBox = await page.getByTestId('rate-details-card').boundingBox();
      expect(belowFoldBox, `${label} 四價詳情應存在於 DOM`).not.toBeNull();
      expect(
        belowFoldBox!.y,
        `${label} fold 下方第一元素（四價詳情）應在視口外`,
      ).toBeGreaterThanOrEqual(viewport.height - 1);

      // 3. 主捲動區可捲動至底：fold 下方內容（四價詳情、趨勢卡、資訊區）可達。
      expect(metrics.scrollHeight, `${label} 應存在 fold 下方可捲動內容`).toBeGreaterThan(
        metrics.clientHeight,
      );
      await page.evaluate(() => {
        const main = document.querySelector('main[data-scroll-container="main"]');
        main?.scrollTo(0, main.scrollHeight);
      });
      await expect
        .poll(
          async () => {
            const m = await getScrollMetrics(page);
            return m.scrollTop + m.clientHeight >= m.scrollHeight - 1;
          },
          { message: `${label} 應可捲動至底` },
        )
        .toBe(true);
      await expect(page.getByTestId('trend-card')).toBeVisible();
      await expect(page.getByTestId('ratewise-data-source')).toBeAttached();

      // 截圖矩陣（v1 首屏）：捲回頂部後拍照。
      await page.evaluate(() => {
        document.querySelector('main[data-scroll-container="main"]')?.scrollTo(0, 0);
      });
      await page.screenshot({
        path: `test-results/e10-fold-v1-${label}-${testInfo.project.name}.png`,
        fullPage: false,
      });
    }

    expect(consoleErrors).toEqual([]);
  });

  test('v2 不回歸：8 視口維持零捲動合約（#667）＋截圖矩陣', async ({
    rateWisePage: page,
  }, testInfo) => {
    await prepareFoldPage(page);

    // URL override 直達 v2。
    const url = new URL(page.url());
    url.searchParams.set('converter', 'v2');
    await page.goto(url.toString());
    await expect(page.getByTestId('converter-v2')).toBeVisible({ timeout: 30_000 });
    await page.addStyleTag({
      content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
    });

    for (const viewport of FOLD_VIEWPORTS) {
      await page.setViewportSize(viewport);
      const label = `${viewport.width}x${viewport.height}`;

      // v2 fold 底界 = keypad 底緣（#667 零捲動合約）：整頁不得出現垂直捲動。
      await expect
        .poll(
          () =>
            page.evaluate(() => ({
              scrollHeight: document.documentElement.scrollHeight,
              innerHeight: window.innerHeight,
            })),
          { message: `${label} v2 不得出現垂直捲動` },
        )
        .toEqual(
          expect.objectContaining({
            scrollHeight: viewport.height,
            innerHeight: viewport.height,
          }),
        );

      await page.screenshot({
        path: `test-results/e10-fold-v2-${label}-${testInfo.project.name}.png`,
        fullPage: false,
      });
    }
  });
});
