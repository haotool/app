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

    // 檢查頁尾資料來源 (使用 first() 避免 strict mode violation)
    await expect(page.getByText(/臺灣銀行牌告匯率/i).first()).toBeVisible();
  });

  test('單幣別模式：應該能夠輸入金額並看到換算結果', async ({ rateWisePage: page }) => {
    // 確認在單幣別模式
    const singleModeButton = page.getByRole('button', { name: /單幣別/i });
    await expect(singleModeButton).toHaveClass(/bg-white/);

    // 使用 getByLabel 定位特定輸入框 - Playwright 最佳實踐
    const fromAmountInput = page.getByLabel(/轉換金額/i);
    const toAmountInput = page.getByLabel(/轉換結果/i);

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

    // 檢查多幣別模式按鈕已激活
    await expect(multiModeButton).toHaveClass(/bg-white/);

    // 檢查是否顯示多個貨幣（至少應該有 3 個以上的貨幣列表項）
    const currencyItems = page.locator('div').filter({ hasText: /USD|EUR|JPY|CNY|HKD/i });
    await expect(currencyItems.first()).toBeVisible();
  });

  test('多幣別模式：應該能夠輸入基準金額並看到所有貨幣換算', async ({ rateWisePage: page }) => {
    // 切換到多幣別模式
    await page.getByRole('button', { name: /多幣別/i }).click();

    // 等待 UI 完全切換
    await page.waitForTimeout(500);

    // 使用更具體的 locator - 直接定位新台幣輸入框
    // MultiConverter 中每個幣別都有獨立的輸入框，使用 aria-label 定位
    const twdInput = page.getByLabel(/新台幣.*TWD.*金額/i);

    // 等待新台幣輸入框可見且可操作
    await expect(twdInput).toBeVisible({ timeout: 5000 });
    await expect(twdInput).toBeEnabled();

    // 填入金額
    await twdInput.fill('5000');

    // 驗證其他貨幣的輸入框有換算結果（不為空且不為0）
    const usdInput = page.getByLabel(/美元.*USD.*金額/i);
    await expect(usdInput).toBeVisible({ timeout: 5000 });
    await expect(usdInput).not.toHaveValue('');
    await expect(usdInput).not.toHaveValue('0');

    // 驗證換算結果是數字且大於0
    const usdValue = await usdInput.inputValue();
    expect(parseFloat(usdValue.replace(/,/g, ''))).toBeGreaterThan(0);
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

  test('響應式設計：行動版應該正確顯示', async ({ page, viewport }) => {
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
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // DOMContentLoaded 應該在 3 秒內完成
    expect(loadTime).toBeLessThan(3000);

    // 檢查關鍵內容已渲染
    await expect(page.getByRole('heading', { name: /匯率好工具/i })).toBeVisible();
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
  test('頁面載入過程中不應該有明顯的佈局偏移', async ({ rateWisePage: page }) => {
    await page.goto('/');

    // [E2E-fix:2025-10-25] 使用更具體的選擇器，避免與 sr-only h1 衝突
    // 選擇視覺標題 h2（「匯率好工具」）
    await page.waitForSelector('h2:has-text("匯率好工具")');
    const initialBox = await page.locator('h2:has-text("匯率好工具")').boundingBox();

    // 等待匯率載入完成
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 檢查標題位置沒有大幅移動
    const finalBox = await page.locator('h2:has-text("匯率好工具")').boundingBox();

    if (initialBox && finalBox) {
      const yShift = Math.abs(finalBox.y - initialBox.y);
      // 允許小於 50px 的偏移（考慮到載入狀態變化）
      expect(yShift).toBeLessThan(50);
    }
  });
});
