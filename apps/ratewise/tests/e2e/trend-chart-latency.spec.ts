/**
 * 趨勢圖載入延遲 E2E 測試
 *
 * 目的：量測並驗證趨勢圖載入時間的 baseline 與改善
 *
 * 測試情境：
 *   1. 冷啟動載入時間（首次訪問）
 *   2. 趨勢圖可見時間（從頁面載入到圖表渲染）
 *   3. 網路請求數量與時間分布
 *
 * 效能門檻（目標）：
 *   - 趨勢圖可見時間：≤ 2500ms（local）、≤ 4000ms（production 4G）
 *
 * @created 2026-05-05
 */

import type { Page, Route } from '@playwright/test';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:4173';
const BASE_PATH =
  process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise';
const BASE = `${BASE_URL}${BASE_PATH}/`.replace(/\/+$/, '/');

// 效能門檻
const TREND_CHART_VISIBLE_TIMEOUT_MS = 20_000; // 當前預期：10s defer + 2s idle + 3s fetch
const TREND_CHART_TARGET_MS = 2_500; // 目標：2.5 秒內可見

/** 生成 30 天日期陣列 */
function generateDates(days: number): string[] {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** Mock 匯率 API，避免外部依賴影響測試穩定性 */
async function mockRatesApi(page: Page): Promise<void> {
  await page.route(
    (url) => url.toString().includes('/rates/latest.json'),
    async (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          base: 'TWD',
          rates: { USD: 0.031, EUR: 0.029, JPY: 4.5, CNY: 0.22 },
          timestamp: Date.now() / 1000,
        }),
      }),
  );

  // Mock aggregate endpoint（優先）
  await page.route(
    (url) => url.toString().includes('/rates/history-30d.json'),
    async (route: Route) => {
      const dates = generateDates(30);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          updateTime: new Date().toISOString(),
          dates,
          rates: {
            TWD: Array(30).fill(1),
            USD: dates.map(() => 0.031 + Math.random() * 0.001),
            EUR: dates.map(() => 0.029 + Math.random() * 0.001),
            JPY: dates.map(() => 4.5 + Math.random() * 0.1),
            CNY: dates.map(() => 0.22 + Math.random() * 0.01),
          },
        }),
      });
    },
  );

  // Mock 逐日歷史匯率 API（fallback）
  await page.route(
    (url) => {
      const urlStr = url.toString();
      return urlStr.includes('/rates/history/') && !urlStr.includes('history-30d.json');
    },
    async (route: Route) => {
      const urlStr = route.request().url();
      const dateMatch = urlStr.match(/history\/(\d{4}-\d{2}-\d{2})\.json/);
      const date = dateMatch?.[1] || '2026-05-01';

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          updateTime: `${date}T09:00:00+08:00`,
          source: 'E2E-MOCK',
          rates: {
            TWD: 1,
            USD: 0.031 + Math.random() * 0.001,
            EUR: 0.029 + Math.random() * 0.001,
            JPY: 4.5 + Math.random() * 0.1,
            CNY: 0.22 + Math.random() * 0.01,
          },
        }),
      });
    },
  );
}

test.describe('趨勢圖載入延遲測試', () => {
  test.use({ serviceWorkers: 'block' });
  test.setTimeout(120_000);

  test('量測趨勢圖首次可見時間（baseline）', async ({ page }) => {
    // 使用 Playwright 原生網路監控
    const historyRequests: { url: string; startTime: number; endTime: number }[] = [];
    let firstHistoryRequestTime = 0;
    let lastHistoryResponseTime = 0;
    const navStartTime = Date.now();

    // 監控所有歷史 API 請求（包括 aggregate）
    let usedAggregate = false;

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/rates/history')) {
        const now = Date.now() - navStartTime;
        if (!firstHistoryRequestTime) firstHistoryRequestTime = now;

        if (url.includes('history-30d.json')) {
          usedAggregate = true;
        }

        historyRequests.push({
          url: url.slice(-30),
          startTime: now,
          endTime: 0,
        });
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/rates/history')) {
        const now = Date.now() - navStartTime;
        lastHistoryResponseTime = now;
        const req = historyRequests.find((r) => r.url === url.slice(-30) && r.endTime === 0);
        if (req) req.endTime = now;
      }
    });

    await mockRatesApi(page);

    console.log(`\n[Trend E2E] 開始載入 → ${BASE}`);

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // 等待趨勢圖容器出現
    const trendChartLocator = page.getByTestId('trend-chart');

    // 等待趨勢圖內容渲染（有實際的 canvas 元素）
    let chartVisibleTime = 0;
    try {
      await page.waitForFunction(
        () => {
          const chart = document.querySelector('[data-testid="trend-chart"]');
          if (!chart) return false;
          const hasCanvas = chart.querySelector('canvas') !== null;
          const hasChartContent = chart.querySelector('[class*="tv-lightweight-charts"]') !== null;
          return hasCanvas || hasChartContent;
        },
        undefined,
        { timeout: TREND_CHART_VISIBLE_TIMEOUT_MS },
      );
      chartVisibleTime = Date.now() - navStartTime;
    } catch {
      chartVisibleTime = Date.now() - navStartTime;
      console.log('[Trend E2E] 趨勢圖渲染超時');
    }

    const totalTime = Date.now() - navStartTime;

    // 計算關鍵指標
    const fetchDuration = lastHistoryResponseTime - firstHistoryRequestTime;

    console.log('\n=== 趨勢圖載入效能 Baseline ===');
    console.log(`總載入時間：${totalTime}ms`);
    console.log(`趨勢圖可見時間：${chartVisibleTime}ms`);
    console.log(`首次歷史請求開始時間：${firstHistoryRequestTime}ms`);
    console.log(`歷史資料 fetch 總耗時：${fetchDuration}ms`);
    console.log(`歷史 API 請求數：${historyRequests.length}`);
    console.log(`使用 aggregate endpoint：${usedAggregate ? '✅ 是' : '❌ 否'}`);

    if (historyRequests.length > 0) {
      console.log('\n請求時間分布（前10筆）：');
      historyRequests.slice(0, 10).forEach((req, i) => {
        const duration = req.endTime ? req.endTime - req.startTime : 'pending';
        console.log(`  ${i + 1}. ${req.url}: 開始@${req.startTime}ms, 耗時=${duration}ms`);
      });
    }

    // 斷言：記錄當前 baseline
    console.log(`\n目標門檻：${TREND_CHART_TARGET_MS}ms`);
    console.log(`當前狀態：${chartVisibleTime > TREND_CHART_TARGET_MS ? '❌ 超標' : '✅ 達標'}`);

    // 基本斷言：確保趨勢圖最終有渲染
    await expect(trendChartLocator).toBeVisible();

    // 效能斷言
    expect(chartVisibleTime, '趨勢圖可見時間應在合理範圍內').toBeLessThan(
      TREND_CHART_VISIBLE_TIMEOUT_MS,
    );
  });

  test('驗證歷史 API 批次請求模式', async ({ page }) => {
    const historyRequests: { url: string; timestamp: number }[] = [];

    // 追蹤所有歷史 API 請求
    await page.route(
      (url) => url.toString().includes('/rates/history/'),
      async (route: Route) => {
        const url = route.request().url();
        historyRequests.push({
          url: url.slice(-25),
          timestamp: Date.now(),
        });

        // 快速返回 mock 資料
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            updateTime: '2026-05-01T09:00:00+08:00',
            source: 'E2E-MOCK',
            rates: { TWD: 1, USD: 0.031 },
          }),
        });
      },
    );

    await mockRatesApi(page);

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // 等待足夠時間讓所有請求完成
    await page.waitForTimeout(15_000);

    console.log('\n=== 歷史 API 請求分析 ===');
    console.log(`總請求數：${historyRequests.length}`);

    if (historyRequests.length > 0) {
      // 分析批次模式
      const firstTimestamp = historyRequests[0]?.timestamp ?? 0;
      const batches: number[][] = [];
      let currentBatch: number[] = [];
      let lastTimestamp = firstTimestamp;

      historyRequests.forEach((req, index) => {
        const gap = req.timestamp - lastTimestamp;
        if (gap > 100 && currentBatch.length > 0) {
          // 超過 100ms 間隔，視為新批次
          batches.push([...currentBatch]);
          currentBatch = [];
        }
        currentBatch.push(index);
        lastTimestamp = req.timestamp;
      });
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }

      console.log(`批次數量：${batches.length}`);
      console.log(`批次大小：${batches.map((b) => b.length).join(', ')}`);

      // 預期：6 批次，每批 5 個請求（30/5=6）
      // 或更少（如果遇到連續 404 提前停止）
      expect(batches.length, '批次數量應合理').toBeLessThanOrEqual(6);
    }

    // 預期：不超過 30 個請求（MAX_HISTORY_DAYS）
    expect(historyRequests.length, '請求數量不應超過 30 天').toBeLessThanOrEqual(30);
  });
});

test.describe('趨勢圖優化後驗證', () => {
  test.use({ serviceWorkers: 'block' });
  test.setTimeout(60_000);

  test.skip('優化後：趨勢圖應在 2.5 秒內可見', async ({ page }) => {
    // 此測試在 PR2（移除 10s defer）合併後啟用
    await mockRatesApi(page);

    const navStart = Date.now();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // 等待趨勢圖渲染
    const trendChart = page.getByTestId('trend-chart');
    await expect(trendChart).toBeVisible({ timeout: TREND_CHART_TARGET_MS });

    // 等待實際圖表內容
    await page.waitForFunction(
      () => {
        const chart = document.querySelector('[data-testid="trend-chart"]');
        return chart?.querySelector('canvas') !== null;
      },
      undefined,
      { timeout: TREND_CHART_TARGET_MS },
    );

    const chartVisibleTime = Date.now() - navStart;

    console.log(`\n[優化驗證] 趨勢圖可見時間：${chartVisibleTime}ms`);
    expect(chartVisibleTime, '趨勢圖應在目標時間內可見').toBeLessThan(TREND_CHART_TARGET_MS);
  });
});
