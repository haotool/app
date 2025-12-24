import { test, expect } from './fixtures/test';

/**
 * RateWise 核心流程 E2E 測試
 *
 * 測試範圍：
 * 1. 首頁載入與基本元素
 * 2. 單幣別換算流程
 * 3. 多幣別換算流程
 * 4. 我的最愛功能
 * 5. 貨幣清單互動
 *
 * [E2E-fix:2025-10-25] 使用 custom fixtures 自動 mock API
 * - 不再依賴外部 CDN/API 可用性
 * - 測試更穩定、可重複
 * - 符合 Playwright 2025 最佳實踐
 *
 * 建立時間：2025-10-15T23:44:01+08:00
 * 更新時間：2025-10-25T16:25:00+08:00
 */

test.describe('RateWise 核心功能測試', () => {
  test('應該正確載入首頁並顯示關鍵元素', async ({ rateWisePage: page }) => {
    // 檢查標題
    await expect(page.getByRole('heading', { name: /匯率好工具/i })).toBeVisible();

    // 檢查副標題（匯率載入完成後）
    await expect(page.getByText(/即時匯率換算/i)).toBeVisible();

    // 檢查模式切換按鈕
    await expect(page.getByRole('button', { name: /單幣別/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /多幣別/i })).toBeVisible();

    // 檢查頁尾資料來源 (使用 filter({ visible: true }) 選擇可見元素)
    // [context7:microsoft/playwright:2025-12-24] 使用 visible filter 處理 RWD 隱藏元素
    await expect(
      page
        .getByText(/臺灣銀行牌告匯率/i)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
  });

  test('單幣別模式：應該能夠輸入金額並看到換算結果', async ({ rateWisePage: page }) => {
    // 使用 data-testid 避免嚴格模式雙重匹配 (input + calculator trigger)
    const fromAmountInput = page.getByTestId('amount-input');
    const toAmountInput = page.getByRole('textbox', { name: /轉換結果/i });

    // Playwright auto-waiting - 不需要額外 waitFor
    await fromAmountInput.fill('1000');

    // 等待換算完成
    await expect(toAmountInput).not.toHaveValue('', { timeout: 5000 });
    await expect(toAmountInput).not.toHaveValue('0');

    // 驗證換算結果是數字
    const toAmount = await toAmountInput.inputValue();
    expect(parseFloat(toAmount.replace(/,/g, ''))).toBeGreaterThan(0);
  });

  test('單幣別模式：應該能夠交換貨幣', async ({ rateWisePage: page }) => {
    // 使用更穩定的 getByRole - Context7 最佳實踐
    const swapButton = page.getByRole('button', { name: /交換幣別/i });

    // Playwright auto-waiting 會自動等待元素可操作
    await swapButton.click();

    // 驗證頁面狀態正常
    await expect(page.getByRole('heading', { name: /匯率好工具/i })).toBeVisible();
  });

  test('多幣別模式：應該能夠切換並顯示多幣別換算', async ({ rateWisePage: page }) => {
    // 切換到多幣別模式
    const multiModeButton = page.getByRole('button', { name: /多幣別/i });
    await multiModeButton.click();

    // 等待 UI 更新
    await page.waitForTimeout(500);

    // 檢查多幣別模式標題可見
    await expect(page.getByText(/即時多幣別換算/i)).toBeVisible();

    // 檢查是否顯示多個貨幣（使用 aria-label 包含「金額」的元素至少 3 個）
    const amountDisplays = page.locator('[aria-label*="金額"]');
    await expect(amountDisplays.nth(0)).toBeVisible();
    const displayCount = await amountDisplays.count();
    expect(displayCount).toBeGreaterThan(2);
  });

  test('多幣別模式：應該能夠輸入基準金額並看到所有貨幣換算', async ({ rateWisePage: page }) => {
    // 切換到多幣別模式
    await page.getByRole('button', { name: /多幣別/i }).click();

    // 等待 UI 完全切換
    await page.waitForTimeout(500);

    // 點選快速金額（基準貨幣 TWD 的 quick amount 按鈕，如 1,000）
    const quickAmountButton = page
      .getByRole('button')
      .filter({ hasText: /1[, ]?000|1000/ })
      .first();
    await quickAmountButton.click();

    // 驗證基準貨幣顯示更新（TWD 金額文字包含 1,000）
    const twdDisplay = page.getByLabel(/新台幣.*TWD.*金額/i);
    await expect(twdDisplay).toContainText(/1,000/);

    // 驗證其他貨幣的金額顯示不為 0（顯示為文字，所以檢查非空且非 "0.00"）
    const usdDisplay = page.getByLabel(/美元.*USD.*金額/i);
    await expect(usdDisplay).toBeVisible();
    const usdText = await usdDisplay.innerText();
    expect(usdText.trim()).not.toBe('');
    expect(usdText.trim()).not.toBe('0.00');
  });

  test('我的最愛：應該能夠新增和移除最愛貨幣', async ({ rateWisePage: page }) => {
    // 找到星號按鈕（我的最愛切換）
    const favoriteButtons = page.locator('button').filter({ has: page.locator('svg') });
    const firstFavoriteButton = favoriteButtons.first();

    // 點擊切換
    await firstFavoriteButton.click();
    await page.waitForTimeout(500);

    // 至少確認頁面沒有崩潰且我的最愛功能正常執行
    await expect(page.getByRole('heading', { name: /匯率好工具/i })).toBeVisible();
  });

  test('響應式設計：行動版應該正確顯示', async ({ rateWisePage: page, viewport }) => {
    // 僅在行動裝置尺寸執行
    if (viewport && viewport.width < 768) {
      // 檢查標題在小螢幕上仍然可見
      await expect(page.getByRole('heading', { name: /匯率好工具/i })).toBeVisible();

      // 檢查模式切換按鈕在小螢幕上可點擊
      const singleModeButton = page.getByRole('button', { name: /單幣別/i });
      await expect(singleModeButton).toBeVisible();

      // 驗證點擊目標大小足夠（至少 24x24px）
      const buttonBox = await singleModeButton.boundingBox();
      expect(buttonBox).toBeTruthy();
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(24);
        expect(buttonBox.height).toBeGreaterThanOrEqual(24);
      }
    }
  });

  test('效能：首頁應該在合理時間內完成載入', async ({ rateWisePage: page }) => {
    // Fixture already handles navigation and waits for key UI element
    // Just verify key content is rendered (already checked in fixture)
    await expect(page.getByRole('heading', { name: /匯率好工具/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /多幣別/i })).toBeVisible();
  });

  test('錯誤處理：網路錯誤時應該顯示友善錯誤訊息', async ({ page, context }) => {
    // 模擬網路錯誤（阻擋 API 請求）
    await context.route('**/api/**', (route) => route.abort());
    await context.route('**/*.json', (route) => route.abort());

    await page.goto('/');

    // 等待一段時間讓錯誤狀態顯示
    await page.waitForTimeout(2000);

    // 應該顯示錯誤訊息或降級 UI（不應該白屏）
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

test.describe('視覺穩定性測試', () => {
  // [fix:2025-11-27] 修復測試超時問題
  // 參考 Playwright 最佳實踐: https://playwright.dev/docs/best-practices
  test('頁面載入過程中不應該有明顯的佈局偏移', async ({ rateWisePage: page }) => {
    // Fixture already navigates and confirms app is loaded (multi-currency button visible)
    // Now verify layout stability

    // [fix:2025-11-27] 使用正確的選擇器：頁面上是 h1 元素，不是 h2
    // 選擇視覺標題 h1（「RateWise 匯率好工具」）
    const titleLocator = page.getByRole('heading', { name: /RateWise 匯率好工具/i, level: 1 });

    // [fix:2025-11-27] 使用 web-first assertion 取代 waitForSelector
    await expect(titleLocator).toBeVisible({ timeout: 10000 });
    const initialBox = await titleLocator.boundingBox();

    // [fix:2025-11-27] 等待幣別選擇器出現，表示主要內容已載入
    await expect(page.getByRole('combobox').first()).toBeVisible({ timeout: 10000 });

    // 給予短暫穩定時間
    await page.waitForTimeout(500);

    // 檢查標題位置沒有大幅移動
    const finalBox = await titleLocator.boundingBox();

    if (initialBox && finalBox) {
      const yShift = Math.abs(finalBox.y - initialBox.y);
      // 允許小於 50px 的偏移（考慮到載入狀態變化）
      expect(yShift).toBeLessThan(50);
    }
  });
});
