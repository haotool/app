/**
 * Converter v2（等值雙列）E2E：flag-on 核心旅程
 * 選幣 → 輸入 → swap → 展開趨勢 → 計算機輸入；console error 必須為 0。
 * @see .claude/prds/ratewise-e3-converter-v2-design.md
 */

import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

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

// 前置：關閉 PWA 安裝導引避免遮擋、mock aggregate 端點避免觸外網。
// 注意：addInitScript 只在後續 document navigation 生效；fixture 已完成首次導覽，
// 呼叫端需以 goto／reload 重新導覽後再互動，避免行動版安裝導引攔截點擊（PR #582 審查 P2）。
async function prepareConverterV2(page: Page) {
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
}

// 導向 v2：URL override 直達，避開 networkidle 等待。
async function gotoConverterV2(page: Page) {
  await prepareConverterV2(page);

  const url = new URL(page.url());
  url.searchParams.set('converter', 'v2');
  await page.goto(url.toString());
  await expect(page.getByTestId('converter-v2')).toBeVisible({ timeout: 30_000 });
}

test.describe('Converter v2 等值雙列（flag on）', () => {
  // fixture 首次導覽（networkidle + hydration 等待）在本機 15s 預設下偏緊，統一放寬。
  test.beforeEach(() => {
    test.setTimeout(90_000);
  });

  test('核心旅程：選幣→輸入→swap→展開趨勢→計算機輸入', async ({ rateWisePage: page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await gotoConverterV2(page);

    // 1. 選幣：bottom sheet picker 換第二列為 JPY
    await page.getByTestId('converter-v2-currency-to').click();
    await expect(page.getByTestId('currency-picker-sheet')).toBeVisible();
    await page.getByTestId('currency-option-JPY').click();
    await expect(page.getByTestId('currency-picker-sheet')).not.toBeVisible();
    await expect(page.getByTestId('converter-v2-currency-to')).toContainText('JPY');

    // 2. 計算機輸入：長按退格清空後鍵入 100，活躍列（第一列）即時更新
    await page.getByTestId('converter-v2-key-backspace').click({ delay: 700 });
    await page.getByTestId('converter-v2-key-1').click();
    await page.getByTestId('converter-v2-key-0').click();
    await page.getByTestId('converter-v2-key-0').click();
    await expect(page.getByTestId('converter-v2-amount-from')).toContainText('100');

    // 3. 對等性：切換活躍列後編輯第二列，第一列即時重算
    await page.getByTestId('converter-v2-amount-to').click();
    await page.getByTestId('converter-v2-key-backspace').click({ delay: 700 });
    await page.getByTestId('converter-v2-key-5').click();
    await expect(page.getByTestId('converter-v2-amount-to')).toContainText('5');

    // 4. swap：交換兩列幣別
    const fromCodeBefore = await page.getByTestId('converter-v2-currency-from').innerText();
    await page.getByTestId('converter-v2-swap').click();
    await expect(page.getByTestId('converter-v2-currency-to')).toContainText(
      fromCodeBefore.replace(/[^A-Z]/g, ''),
    );

    // 5. 展開趨勢 sheet：65vh、範圍切換
    await page.getByTestId('converter-v2-sparkline').click();
    await expect(page.getByTestId('converter-v2-trend-sheet')).toBeVisible();
    await page.getByTestId('converter-v2-trend-range-7d').click();
    // E1：範圍切換改用 SegmentedControl（radiogroup 語意，選中態為 aria-checked）。
    await expect(page.getByTestId('converter-v2-trend-range-7d')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    // 背景 tap 關閉
    await page.mouse.click(200, 60);
    await expect(page.getByTestId('converter-v2-trend-sheet')).not.toBeVisible();

    // 6. 計算機仍可輸入（sheet 關閉後）
    await page.getByTestId('converter-v2-key-9').click();
    await expect(page.getByTestId('converter-v2-keypad')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('flag off：首頁維持 legacy 版面', async ({ rateWisePage: page }) => {
    await expect(page.getByTestId('amount-input')).toBeVisible();
    await expect(page.getByTestId('converter-v2')).toHaveCount(0);
  });

  test('設定頁切換：等值雙列 → 首頁生效 → 重載持久 → 切回經典', async ({ rateWisePage: page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await prepareConverterV2(page);
    // 重新導覽使 init script 生效（dismiss 安裝導引），再開始互動。
    await page.reload();
    await expect(page.getByRole('link', { name: /多幣別/i })).toBeVisible({ timeout: 30_000 });

    // 1. 設定頁「單幣別模式」切到等值雙列
    await page.getByRole('link', { name: /設定/i }).first().click();
    await expect(page.getByTestId('converter-variant-v2')).toBeVisible();
    await page.getByTestId('converter-variant-v2').click();
    await expect(page.getByTestId('converter-variant-v2')).toHaveAttribute('aria-pressed', 'true');

    // 持久化與 lastConverterView 同域（converterStore SSOT，無獨立 flag key）
    const stored = await page.evaluate(() => localStorage.getItem('ratewise-converter'));
    expect(JSON.parse(stored ?? '{}')).toMatchObject({
      state: { singleConverterVariant: 'v2' },
    });

    // 2. 回單幣別首頁：v2 版面即時生效（無 URL override）
    await page
      .getByRole('link', { name: /單幣別/i })
      .first()
      .click();
    await expect(page.getByTestId('converter-v2')).toBeVisible({ timeout: 30_000 });

    // 3. 重載後仍持久（converterStore hydrate）
    await page.reload();
    await expect(page.getByTestId('converter-v2')).toBeVisible({ timeout: 30_000 });

    // 4. 設定頁切回經典 → 首頁恢復 legacy
    await page.getByRole('link', { name: /設定/i }).first().click();
    await page.getByTestId('converter-variant-legacy').click();
    await page
      .getByRole('link', { name: /單幣別/i })
      .first()
      .click();
    await expect(page.getByTestId('amount-input')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('converter-v2')).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });

  test('設 v2 冷啟動重載：骨架或 v2 佔位、無 legacy 互動殘留、console 乾淨', async ({
    rateWisePage: page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await prepareConverterV2(page);

    // 模擬冷啟動：清 session、寫入 persisted v2 偏好後硬重載（無 URL override）。
    await page.addInitScript(() => {
      sessionStorage.clear();
      sessionStorage.setItem('ratewise:pwa-install-guide-dismissed:v1', 'true');
      const persisted = JSON.parse(localStorage.getItem('ratewise-converter') ?? '{}') as {
        state?: Record<string, unknown>;
        version?: number;
      };
      persisted.state = { ...persisted.state, singleConverterVariant: 'v2' };
      persisted.version ??= 0;
      localStorage.setItem('ratewise-converter', JSON.stringify(persisted));
    });
    await page.reload();

    // 預熱＋骨架收斂驗收：v2 版面就緒，期間至多出現 v2 佈局輪廓骨架（不再長空白）。
    await expect(page.getByTestId('converter-v2')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('converter-v2-skeleton')).toHaveCount(0);
    await expect(page.getByTestId('amount-input')).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });

  test('實體鍵盤完整旅程：清空→數字→運算子→退格→Esc 關 sheet→續輸入（#587）', async ({
    rateWisePage: page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await gotoConverterV2(page);

    // Delete 清空活躍列（第一列），等同長按退格（TWD 依幣別小數位顯示 0.00）
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('converter-v2-amount-from')).toHaveText(/^0(\.0+)?$/);

    // 數字輸入直通計算引擎，即時回寫活躍列
    await page.keyboard.type('123');
    await expect(page.getByTestId('converter-v2-amount-from')).toContainText('123');

    // 運算子＋數字：引擎 preview 即時回寫（123 + 7 = 130）
    await page.keyboard.type('+7');
    await expect(page.getByTestId('converter-v2-amount-from')).toContainText('130');

    // 退格刪 7 後鍵入 9（123 + 9 = 132）
    await page.keyboard.press('Backspace');
    await page.keyboard.type('9');
    await expect(page.getByTestId('converter-v2-amount-from')).toContainText('132');

    // Esc 關趨勢 sheet：BottomSheet 既有行為不受鍵盤掛接影響
    await page.getByTestId('converter-v2-sparkline').click();
    await expect(page.getByTestId('converter-v2-trend-sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('converter-v2-trend-sheet')).not.toBeVisible();

    // sheet 關閉後鍵盤恢復輸入（123 + 90 = 213）
    await page.keyboard.type('0');
    await expect(page.getByTestId('converter-v2-amount-from')).toContainText('213');

    // e2e 阻擋 SW 產生的更新失敗 toast 與待測 UI 無關，證據截圖前先隱藏。
    await page.addStyleTag({
      content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
    });
    await page.screenshot({
      path: `test-results/v2-physical-keyboard-${testInfo.project.name}.png`,
      fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
  });

  test('極端金額（9 位整數＋小數）三視口不截斷、最高位可見（#590）', async ({
    rateWisePage: page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await gotoConverterV2(page);

    // 鍵入 iOS 上限內極端值：9 位整數＋2 位小數
    await page.keyboard.press('Delete');
    await page.keyboard.type('123456789.12');
    await expect(page.getByTestId('converter-v2-amount-from')).toContainText('123,456,789.12');

    // e2e 阻擋 SW 產生的更新失敗 toast 與待測 UI 無關，證據截圖前先隱藏。
    await page.addStyleTag({
      content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
    });

    // QA 回歸（qa-mobile-pwa-report P1-1）：繪製寬曾超出容器（188px vs 179px）致最高位被裁。
    // 量測斷言：兩列金額繪製矩形必須完整落在容器矩形內（左緣＝最高位可見）。
    for (const viewport of [
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      for (const field of ['from', 'to'] as const) {
        await expect
          .poll(
            () =>
              page.evaluate((f) => {
                const box = document.querySelector(`[data-testid="converter-v2-amount-${f}"]`);
                const text = document.querySelector(
                  `[data-testid="converter-v2-amount-text-${f}"]`,
                );
                if (!box || !text) return false;
                const b = box.getBoundingClientRect();
                const t = text.getBoundingClientRect();
                return t.left >= b.left - 0.5 && t.right <= b.right + 0.5;
              }, field),
            { message: `${field} 列金額於 ${viewport.width}px 視口不得截斷` },
          )
          .toBe(true);
      }
      await page.screenshot({
        path: `test-results/v2-extreme-amount-${viewport.width}-${testInfo.project.name}.png`,
        fullPage: false,
      });
    }

    expect(consoleErrors).toEqual([]);
  });

  test('首次鍵盤輸入取代預設種子而非串接（#633，實體＋虛擬兩路徑）', async ({
    rateWisePage: page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await gotoConverterV2(page);

    // 實體鍵路徑：不清空、不點輸入框，直接鍵入 123456789。
    // 修正前串接在預設 1,000 之後變 1,000,123,456,789。
    await page.keyboard.type('123456789');
    await expect(page.getByTestId('converter-v2-amount-from')).toHaveText(/^123,456,789(\.\d+)?$/);

    // e2e 阻擋 SW 產生的更新失敗 toast 與待測 UI 無關，證據截圖前先隱藏。
    await page.addStyleTag({
      content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
    });
    await page.screenshot({
      path: `test-results/v2-first-input-replaces-seed-${testInfo.project.name}.png`,
      fullPage: false,
    });

    // 虛擬鍵路徑：重載重播種子後，首顆數字鍵同樣取代種子。
    await page.reload();
    await expect(page.getByTestId('converter-v2')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('converter-v2-key-5').click();
    await expect(page.getByTestId('converter-v2-amount-from')).toHaveText(/^5(\.\d+)?$/);

    expect(consoleErrors).toEqual([]);
  });

  test('E8 佈局預算：三視口零捲動可見全部互動元素（scrollHeight === innerHeight）', async ({
    rateWisePage: page,
  }, testInfo) => {
    await gotoConverterV2(page);

    // e2e 阻擋 SW 產生的更新失敗 toast 與待測 UI 無關，量測與截圖前先隱藏。
    await page.addStyleTag({
      content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
    });

    // 360×740 / 360×800（QA-J J-1）：snug/compact 壓縮梯次守門，鍵盤底列不得被固定底導覽遮蓋。
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 375, height: 667 },
      { width: 430, height: 932 },
      { width: 360, height: 740 },
      { width: 360, height: 800 },
    ]) {
      await page.setViewportSize(viewport);

      // #662：≤360px 寬度時 main 滾動區底部留白必須實際套用 84px（slim 斷點產出守門）。
      if (viewport.width <= 360) {
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const main = document.querySelector('main');
                return main ? getComputedStyle(main).paddingBottom : null;
              }),
            { message: `${viewport.width}px 寬度 main 底部留白應為 84px` },
          )
          .toBe('84px');
      }

      // 一頁完整顯示硬約束：加入 quick chips 後仍不得出現垂直捲動。
      await expect
        .poll(
          () =>
            page.evaluate(() => ({
              scrollHeight: document.documentElement.scrollHeight,
              innerHeight: window.innerHeight,
            })),
          { message: `${viewport.width}×${viewport.height} 不得出現垂直捲動` },
        )
        .toEqual(
          expect.objectContaining({
            scrollHeight: viewport.height,
            innerHeight: viewport.height,
          }),
        );

      // 全部互動元素零捲動可見（含 E8 新增的 quick chips 與 ⇄ 翻轉鈕）；
      // 可見上限取固定底部導覽列頂緣，避免元素被 fixed nav 遮蓋卻通過視口斷言。
      const navTop = await page.evaluate(() => {
        const nav = [...document.querySelectorAll('nav')].find(
          (el) => getComputedStyle(el).position === 'fixed',
        );
        return nav ? nav.getBoundingClientRect().top : window.innerHeight;
      });
      for (const testId of [
        'converter-v2-amount-from',
        'converter-v2-amount-to',
        'converter-v2-swap',
        'converter-v2-rate-chip',
        'converter-v2-rate-flip',
        'converter-v2-sparkline',
        'converter-v2-quick-chips',
        'converter-v2-key-7',
        'converter-v2-key-+',
      ]) {
        const box = await page.getByTestId(testId).boundingBox();
        expect(box, `${testId} 於 ${viewport.width}×${viewport.height} 應可見`).not.toBeNull();
        expect(
          box!.y + box!.height,
          `${testId} 底緣不得被固定導覽列（top=${navTop}）遮蓋`,
        ).toBeLessThanOrEqual(navTop + 0.5);
        expect(box!.y, `${testId} 頂緣不得高於視口`).toBeGreaterThanOrEqual(-0.5);
      }

      // keypad 高度預算：30-40%（含 quick chips 頂列）。
      const keypadBox = await page.getByTestId('converter-v2-keypad').boundingBox();
      const keypadRatio = keypadBox!.height / viewport.height;
      expect(keypadRatio, 'keypad 高度應在 30-40% 預算內').toBeGreaterThanOrEqual(0.3);
      expect(keypadRatio, 'keypad 高度應在 30-40% 預算內').toBeLessThanOrEqual(0.4);

      await page.screenshot({
        path: `test-results/v2-e8-layout-budget-${viewport.width}x${viewport.height}-${testInfo.project.name}.png`,
        fullPage: false,
      });
    }
  });

  test('E8 S5：320×844 最小寬度——quick chips／rate chip／⇄ 鈕不溢出', async ({
    rateWisePage: page,
  }, testInfo) => {
    await gotoConverterV2(page);
    await page.setViewportSize({ width: 320, height: 844 });

    // 頁面不得出現水平溢出。
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
        message: '320px 視口不得出現水平捲動',
      })
      .toBeLessThanOrEqual(320);

    for (const testId of [
      'converter-v2-quick-chips',
      'converter-v2-rate-chip',
      'converter-v2-rate-flip',
    ]) {
      const box = await page.getByTestId(testId).boundingBox();
      expect(box, `${testId} 於 320px 視口應可見`).not.toBeNull();
      expect(box!.x, `${testId} 左緣不得超出視口`).toBeGreaterThanOrEqual(-0.5);
      expect(box!.x + box!.width, `${testId} 右緣不得超出 320px 視口`).toBeLessThanOrEqual(320.5);
    }

    await page.screenshot({
      path: `test-results/v2-e8-min-width-320-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });

  test('E8 wave-A 互動：quick chip 取代金額、⇄ 翻轉方向、長按複製', async ({
    rateWisePage: page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await gotoConverterV2(page);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // 1. quick chip：取代活躍列金額（非串接在預設 1,000 之後）。
    const firstChip = page.locator('[data-testid="converter-v2-quick-chips"] button').first();
    const chipValue = (await firstChip.innerText()).replace(/,/g, '');
    await firstChip.click();
    await expect(page.getByTestId('converter-v2-amount-from')).toContainText(
      Number(chipValue).toLocaleString(),
    );

    // 2. ⇄ 翻轉：chip 顯示方向反轉，且不改變計價基準（rate chip 標籤仍在）。
    const rateChip = page.getByTestId('converter-v2-rate-chip');
    const beforeFlip = await rateChip.innerText();
    const [, base, quote] = beforeFlip.match(/1 ([A-Z]{3}) = [\d,.]+ ([A-Z]{3})/) ?? [];
    await page.getByTestId('converter-v2-rate-flip').click();
    await expect(rateChip).toContainText(`1 ${quote}`);
    await expect(rateChip).toContainText(` ${base}`);
    await page.getByTestId('converter-v2-rate-flip').click();
    await expect(rateChip).toContainText(`1 ${base}`);

    // 3. 長按金額列複製：toast 顯示「已複製」，剪貼簿內容為 v1 慣例格式。
    await page.getByTestId('converter-v2-amount-to').click({ delay: 700 });
    await expect(page.getByText('已複製')).toBeVisible();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/^[\d.]+ [A-Z]{3} = [\d.]+ [A-Z]{3}$/);

    expect(consoleErrors).toEqual([]);
  });

  test('E8 wave-B：運算式列進行中顯示（overlay 零位移）、settle 後隱藏＋SR 播報', async ({
    rateWisePage: page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await gotoConverterV2(page);

    const scrollHeightBefore = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(await page.getByTestId('converter-v2-expression').count()).toBe(0);

    // 鍵入含運算子表達式：迷你運算式列顯示於活躍列。
    await page.keyboard.press('Delete');
    await page.keyboard.type('5+3');
    await expect(page.getByTestId('converter-v2-expression')).toHaveText('5 + 3');

    // CLS 零位移：overlay 不得改變文件高度（三視口零捲動硬約束不回歸）。
    const scrollHeightDuring = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeightDuring).toBe(scrollHeightBefore);

    // e2e 阻擋 SW 產生的更新失敗 toast 與待測 UI 無關，證據截圖前先隱藏。
    await page.addStyleTag({
      content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
    });
    await page.screenshot({
      path: `test-results/v2-e8-expression-row-${testInfo.project.name}.png`,
      fullPage: false,
    });

    // settle（停頓 2s）後運算式列隱藏，SR 摘要區完成播報（#620）。
    await expect(page.getByTestId('converter-v2-expression')).toHaveCount(0, { timeout: 5000 });
    await expect(page.getByTestId('converter-v2-sr-summary')).not.toBeEmpty();

    expect(consoleErrors).toEqual([]);
  });

  test('E8 wave-B：換錢所來源切換——KRW 顯示、切換後 chip 標註、320px 不溢出', async ({
    rateWisePage: page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    // mock 換錢所 provider 端點避免觸外網（latest 與 daily history 均回 200 空物件，
    // parse 失敗會走 committed fallback snapshot，UI 行為不受影響）。
    await page.route(
      (url) => url.toString().includes('/providers/moneybox/'),
      async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      },
    );
    await gotoConverterV2(page);

    // 預設 pair（TWD/USD）不支援換錢所：零暴露。
    await expect(page.getByTestId('converter-v2-rate-source')).toHaveCount(0);

    // 換第二列為 KRW：TWD↔KRW 支援換錢所 → 切換鈕出現。
    await page.getByTestId('converter-v2-currency-to').click();
    await page.getByTestId('currency-option-KRW').click();
    const sourceToggle = page.getByTestId('converter-v2-rate-source');
    await expect(sourceToggle).toBeVisible();
    await expect(sourceToggle).toHaveAttribute('aria-pressed', 'false');

    // 切至換錢所：chip 基準標註「換錢所」（#659 分支接上）。
    await sourceToggle.click();
    await expect(sourceToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('converter-v2-rate-chip')).toContainText('換錢所');

    // e2e 阻擋 SW 產生的更新失敗 toast 與待測 UI 無關，量測與截圖前先隱藏。
    await page.addStyleTag({
      content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
    });

    // 320px 最小寬度：chip 列（chip＋來源切換鈕＋⇄ 鈕）不得溢出。
    await page.setViewportSize({ width: 320, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
        message: '320px 視口不得出現水平捲動',
      })
      .toBeLessThanOrEqual(320);
    for (const testId of [
      'converter-v2-rate-chip',
      'converter-v2-rate-source',
      'converter-v2-rate-flip',
    ]) {
      const box = await page.getByTestId(testId).boundingBox();
      expect(box, `${testId} 於 320px 視口應可見`).not.toBeNull();
      expect(box!.x, `${testId} 左緣不得超出視口`).toBeGreaterThanOrEqual(-0.5);
      expect(box!.x + box!.width, `${testId} 右緣不得超出 320px 視口`).toBeLessThanOrEqual(320.5);
    }
    await page.screenshot({
      path: `test-results/v2-e8-rate-source-320-${testInfo.project.name}.png`,
      fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
  });

  test('E8 wave-B：趨勢 sheet 基準切換與攻略連結', async ({ rateWisePage: page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await gotoConverterV2(page);

    // 展開趨勢 sheet：基準切換（現金／即期）與攻略連結（TWD→外幣 pair 均有 /twd-xxx/ 落地頁）。
    const fromCode = (await page.getByTestId('converter-v2-currency-from').innerText())
      .replace(/[^A-Z]/g, '')
      .toLowerCase();
    const toCode = (await page.getByTestId('converter-v2-currency-to').innerText())
      .replace(/[^A-Z]/g, '')
      .toLowerCase();
    await page.getByTestId('converter-v2-sparkline').click();
    await expect(page.getByTestId('converter-v2-trend-sheet')).toBeVisible();
    await expect(page.getByTestId('converter-v2-trend-basis-cash')).toBeVisible();
    const guideLink = page.getByTestId('converter-v2-trend-guide-link');
    await expect(guideLink).toBeVisible();
    await expect(guideLink).toHaveAttribute('href', new RegExp(`/${fromCode}-${toCode}/$`));

    // 切換基準：radiogroup 選中態跟隨，誠實標註同步（TWD/USD 兩基準俱在，直接切換）。
    await page.getByTestId('converter-v2-trend-basis-cash').click();
    await expect(page.getByTestId('converter-v2-trend-basis-cash')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    // e2e 阻擋 SW 產生的更新失敗 toast 與待測 UI 無關，證據截圖前先隱藏。
    await page.addStyleTag({
      content: '[aria-labelledby="update-prompt-title"] { display: none !important; }',
    });
    await page.screenshot({
      path: `test-results/v2-e8-trend-sheet-${testInfo.project.name}.png`,
      fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
  });

  test('觸控目標：v2 互動元素 ≥44px', async ({ rateWisePage: page }) => {
    await gotoConverterV2(page);

    for (const testId of [
      'converter-v2-swap',
      'converter-v2-rate-chip',
      'converter-v2-rate-flip',
      'converter-v2-key-7',
      'converter-v2-amount-from',
    ]) {
      const box = await page.getByTestId(testId).boundingBox();
      expect(box, `${testId} 應可見`).not.toBeNull();
      expect(box!.height, `${testId} 高度 ≥44px`).toBeGreaterThanOrEqual(44);
    }
  });
});
