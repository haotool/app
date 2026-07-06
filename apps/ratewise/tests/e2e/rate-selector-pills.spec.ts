/**
 * RateSelector pills 佈局矩陣驗證（#651 前置）
 *
 * 驗證內容驅動佈局在 2/3/4 pills × 視口矩陣下：
 * 1. 單行不換行、文字不截斷（scrollWidth <= clientWidth）
 * 2. 每顆 pill 觸控熱區 ≥44×44（WCAG 2.5.8；視覺 pill 維持 24px）
 * 3. 第四 pill（ADR-002 刷卡匯率前置）以 DOM clone 模擬，容量不溢出
 * 4. 熱區外擴不蓋鄰近點擊區（單幣別金額輸入、多幣別列切基準幣、星號 44×44）
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
const SCREENSHOT_DIR = join(REPO_ROOT, 'screenshots');

// preview server public base 為 /ratewise/：導航必須帶 base path（同 ratewise.spec.ts 慣例）。
const BASE_PATH = (
  process.env['E2E_BASE_PATH'] ??
  process.env['VITE_RATEWISE_BASE_PATH'] ??
  '/ratewise/'
).replace(/\/$/, '');

// 驗收矩陣：320（最窄支援寬）/375/390/430 手機高 844；768 平板。
const VIEWPORT_MATRIX = [
  { width: 320, height: 844 },
  { width: 375, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 844 },
  { width: 768, height: 1024 },
] as const;

const TOUCH_TARGET_MIN = 44;
const RATE_SELECTOR_PILL_SELECTOR = '[data-testid="rate-selector-pill"]';
const RADIO_PILL_SELECTOR = '[role="radio"]';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function intersectArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return Math.max(0, w) * Math.max(0, h);
}

/** moneybox provider 請求快速 404：走 fallback 匯率，避免 networkidle 等待外部 CDN。 */
async function blockMoneyboxRequests(page: Page): Promise<void> {
  await page.route(
    (url) => url.toString().includes('moneybox'),
    (route) => route.fulfill({ status: 404, body: 'not found' }),
  );
}

/**
 * 多幣別列的選項數由 availability 驅動（僅渲染可用選項）；
 * fixture 的 mock latest.json 無 details → 銀行類型全不可用只剩換錢所 1 項。
 * 此處補上 KRW 銀行 spot/cash details，讓 KRW 列出現完整 3 pills。
 */
async function mockRatesWithKrwDetails(page: Page): Promise<void> {
  await page.route(
    (url) => url.toString().includes('/rates/latest.json'),
    async (route) => {
      const payload = {
        date: '2025-10-25',
        updateTime: '2025-10-25T03:18:12+08:00',
        source: 'Taiwan Bank (Mock)',
        rates: { TWD: 1.0, USD: 31.07, JPY: 0.2055, KRW: 0.02361, EUR: 36.31 },
        details: {
          KRW: {
            name: '韓元',
            spot: { buy: 0.02301, sell: 0.02361 },
            cash: { buy: 0.02241, sell: 0.02451 },
          },
        },
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    },
  );
}

interface OverflowScan {
  offenders: string[];
  scannedPills: number;
}

/** 蒐集群組與各 pill 的水平溢出節點；offenders 空陣列 = 無截斷。
 *  scannedPills 回傳實際掃描的 pill 數：呼叫端必須斷言等於預期數，
 *  防止 selector 錯誤時 querySelectorAll 靜默匹配 0 個造成逐 pill 斷言空轉。 */
function collectOverflows(group: Locator, pillSelector: string): Promise<OverflowScan> {
  return group.evaluate((groupEl, selector) => {
    const offenders: string[] = [];
    const report = (label: string, node: Element) => {
      if (node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 1) {
        offenders.push(`${label}<${node.tagName}> ${node.scrollWidth}>${node.clientWidth}`);
      }
    };
    report('group', groupEl);
    const pillNodes = groupEl.querySelectorAll(selector);
    pillNodes.forEach((pill, idx) => {
      for (const node of [pill, ...Array.from(pill.querySelectorAll('*'))]) {
        report(`pill${idx}`, node);
      }
    });
    return { offenders, scannedPills: pillNodes.length };
  }, pillSelector);
}

/**
 * 斷言 pills 群組單行、無截斷、觸控熱區達標。回傳量測數據供 log。
 * 溢出量測用 expect.poll：等待 rateType 自動回退與 layoutId 指示器動畫穩定，
 * 避免 AnimatePresence 過渡期（雙 indicator 並存）誤判為截斷。
 */
async function assertPillGroup(
  group: Locator,
  pills: Locator,
  expectedCount: number,
  pillSelector: string,
): Promise<{ hit: Rect[]; groupRect: Rect }> {
  await expect(pills).toHaveCount(expectedCount);

  // scannedPills 必須等於預期數：selector 打偏時測試必紅，逐 pill 斷言不得靜默空轉。
  await expect
    .poll(() => collectOverflows(group, pillSelector), {
      message: 'pills 逐 pill 掃描數須等於預期且無水平溢出（截斷）',
      timeout: 10_000,
    })
    .toEqual({ offenders: [], scannedPills: expectedCount });

  const hitRects: Rect[] = [];
  const visualTops: number[] = [];

  for (let i = 0; i < expectedCount; i += 1) {
    const pill = pills.nth(i);

    // 觸控熱區 ≥44×44。
    const box = await pill.boundingBox();
    expect(box, 'pill 需可見').not.toBeNull();
    if (!box) continue;
    expect(box.height, `pill ${i} 熱區高 ≥${TOUCH_TARGET_MIN}`).toBeGreaterThanOrEqual(
      TOUCH_TARGET_MIN,
    );
    expect(box.width, `pill ${i} 熱區寬 ≥${TOUCH_TARGET_MIN}`).toBeGreaterThanOrEqual(
      TOUCH_TARGET_MIN,
    );
    hitRects.push(box);

    // 單行：以視覺 pill（首個 span）top 對齊判定不換行。
    const top = await pill.evaluate((el) => {
      const visual = el.querySelector('span');
      return (visual ?? el).getBoundingClientRect().top;
    });
    visualTops.push(top);
  }

  const [firstTop] = visualTops;
  if (firstTop !== undefined) {
    for (const top of visualTops) {
      expect(Math.abs(top - firstTop), 'pills 必須同列（不換行）').toBeLessThanOrEqual(1);
    }
  }

  const groupBox = await group.boundingBox();
  expect(groupBox).not.toBeNull();
  return { hit: hitRects, groupRect: groupBox as Rect };
}

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

// 佈局量測與截圖只需單一引擎；desktop project 以 setViewportSize 覆蓋矩陣。
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', '佈局量測僅在 desktop project 執行');
});

for (const viewport of VIEWPORT_MATRIX) {
  const vpTag = `${viewport.width}x${viewport.height}`;

  test(`單幣別 2 pills：${vpTag} 單行無截斷、熱區 ≥44`, async ({ rateWisePage: page }) => {
    await blockMoneyboxRequests(page);
    await page.setViewportSize(viewport);
    await page.goto(`${BASE_PATH}/?from=TWD&to=USD`);

    const group = page.getByTestId('rate-selector');
    await expect(group).toBeVisible();
    const pills = page.getByTestId('rate-selector-pill');
    const { hit } = await assertPillGroup(group, pills, 2, RATE_SELECTOR_PILL_SELECTOR);

    // 熱區垂直外擴不得蓋住金額輸入區。
    const amountBox = await page.getByTestId('amount-input').boundingBox();
    expect(amountBox).not.toBeNull();
    for (const rect of hit) {
      expect(intersectArea(rect, amountBox as Rect), 'pill 熱區不得蓋金額輸入').toBe(0);
    }

    await page.screenshot({
      path: join(SCREENSHOT_DIR, `rate-pills-${vpTag}-single-2pills.png`),
    });
  });

  test(`單幣別 3 pills（KRW 換錢所）：${vpTag} 單行無截斷、熱區 ≥44`, async ({
    rateWisePage: page,
  }) => {
    await blockMoneyboxRequests(page);
    await page.setViewportSize(viewport);
    await page.goto(`${BASE_PATH}/?from=TWD&to=KRW`);

    const group = page.getByTestId('rate-selector');
    await expect(group).toBeVisible();
    await expect(page.getByRole('button', { name: /換錢所/ })).toBeVisible();
    const pills = page.getByTestId('rate-selector-pill');
    await assertPillGroup(group, pills, 3, RATE_SELECTOR_PILL_SELECTOR);

    await page.screenshot({
      path: join(SCREENSHOT_DIR, `rate-pills-${vpTag}-single-3pills.png`),
    });
  });

  test(`多幣別 3 pills（KRW 列）：${vpTag} 單行無截斷、熱區 ≥44、星號無擠壓`, async ({
    rateWisePage: page,
  }) => {
    await blockMoneyboxRequests(page);
    await mockRatesWithKrwDetails(page);
    // fixture 首載已把無 details 的 mock 寫入 5 分鐘 localStorage 快取；
    // 清掉讓 /multi 重新 fetch 並命中本測試的 details route（後註冊優先）。
    await page.evaluate(() => window.localStorage.clear());
    await page.setViewportSize(viewport);
    await page.goto(`${BASE_PATH}/multi`);

    const krwGroup = page.getByRole('radiogroup', { name: /KRW/ });
    await expect(krwGroup).toBeVisible();
    const krwPills = krwGroup.getByRole('radio');
    const { hit, groupRect } = await assertPillGroup(krwGroup, krwPills, 3, RADIO_PILL_SELECTOR);

    // 星號熱區（#644）：44×44 且與 pills 熱區不重疊。
    const krwRow = page.locator('[data-testid="multi-currency-list"] > div', {
      hasText: 'KRW',
    });
    const star = krwRow.getByRole('button', { name: /常用貨幣/ }).first();
    const starBox = await star.boundingBox();
    expect(starBox).not.toBeNull();
    expect((starBox as Rect).width).toBeGreaterThanOrEqual(TOUCH_TARGET_MIN);
    expect((starBox as Rect).height).toBeGreaterThanOrEqual(TOUCH_TARGET_MIN);
    for (const rect of hit) {
      expect(intersectArea(rect, starBox as Rect), '星號與 pill 熱區不得重疊').toBe(0);
    }

    // pills 熱區不得攔截列點擊：點 pill 不切基準幣、點列本體可切基準幣。
    await krwPills.nth(1).click();
    await expect(krwRow.getByText('基準貨幣')).toHaveCount(0);
    await krwRow.getByText('韓元', { exact: true }).click();
    await expect(krwRow.getByText('基準貨幣')).toBeVisible();
    void groupRect;

    await page.screenshot({
      path: join(SCREENSHOT_DIR, `rate-pills-${vpTag}-multi-3pills.png`),
    });
  });
}

test('第四 pill 容量模擬（ADR-002 刷卡前置）：320px 不換行不截斷不溢出', async ({
  rateWisePage: page,
}) => {
  await blockMoneyboxRequests(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`${BASE_PATH}/?from=TWD&to=KRW`);

  const group = page.getByTestId('rate-selector');
  await expect(group).toBeVisible();
  await expect(page.getByRole('button', { name: /換錢所/ })).toBeVisible();

  // 以 DOM clone 注入第四 pill（僅測試環境，不動應用程式碼）：驗證佈局容量。
  // clone 後清除 framer-motion inline style 與 active indicator 殘留，只留純佈局骨架。
  await page.evaluate(() => {
    const groupEl = document.querySelector('[data-testid="rate-selector"]');
    const pillEl = groupEl?.querySelector('[data-testid="rate-selector-pill"]');
    if (!groupEl || !pillEl) throw new Error('rate-selector pills not found');
    const clone = pillEl.cloneNode(true) as HTMLElement;
    clone.removeAttribute('style');
    clone.querySelectorAll('*').forEach((node) => node.removeAttribute('style'));
    clone.querySelectorAll('div').forEach((indicator) => indicator.remove());
    const labels = clone.querySelectorAll('span span:last-child');
    const label = labels[labels.length - 1];
    if (label) label.textContent = '刷卡';
    clone.setAttribute('aria-label', '模擬刷卡匯率');
    groupEl.appendChild(clone);
  });

  const pills = page.getByTestId('rate-selector-pill');
  const { groupRect } = await assertPillGroup(group, pills, 4, RATE_SELECTOR_PILL_SELECTOR);

  // 群組不得超出視口（含左右安全邊）。
  expect(groupRect.x).toBeGreaterThanOrEqual(0);
  expect(groupRect.x + groupRect.width).toBeLessThanOrEqual(320);

  await page.screenshot({
    path: join(SCREENSHOT_DIR, 'rate-pills-320x844-single-4pills-sim.png'),
  });
});
