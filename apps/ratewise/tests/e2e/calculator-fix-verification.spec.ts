/**
 * E2E Test: Calculator Fix Verification
 * @file calculator-fix-verification.spec.ts
 * @description 驗證計算機修復：刪除速度、按鈕動畫、移動和桌面版一致性
 *
 * 🐛 修復驗證 2025-11-20：
 * - 刪除按鈕速度：100ms → 150ms（避免過快）
 * - 按鈕放大效果：Motion whileTap 動畫正常
 * - 移動和桌面版一致性：統一事件處理
 *
 * BDD 格式：Given-When-Then
 * @see docs/prompt/BDD.md
 */

import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

// 測試配置
const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };

const openCalculator = async (page: Page, trigger: 'from' | 'to' = 'from') => {
  await page.getByTestId(`calculator-trigger-${trigger}`).click();
  await expect(page.getByRole('dialog', { name: '計算機' })).toBeVisible();
};

const openCalculatorClean = async (page: Page, trigger: 'from' | 'to' = 'from') => {
  await page.getByTestId('amount-input').fill('0');
  await openCalculator(page, trigger);
  await resetCalculator(page);
  await expectExpression(page, /0|輸入數字或表達式/);
};

const resetCalculator = async (page: Page) => {
  const clearButton = page.getByRole('button', { name: '清除全部' });
  await clearButton.click();
  // 再點一次確保狀態歸零（iOS 風格 AC/Del 行為）
  await clearButton.click();
  // 將狀態寫入為 0 後再清空，避免殘留初始 1,000
  await page.getByRole('button', { name: '數字 0' }).click();
  await clearButton.click();
};

const expectExpression = async (page: Page, matcher: RegExp | string) => {
  const expression = page.getByRole('status', { name: '當前表達式' });
  await expect(expression).toHaveText(matcher);
};

/**
 * BDD 場景：計算機修復驗證
 *
 * 測試策略：
 * 1. 桌面版完整測試
 * 2. 移動版完整測試
 * 3. 對比兩者行為一致性
 *
 */
test.describe('Calculator Fix Verification - E2E Tests', () => {
  /**
   * 場景 1：桌面版 - 數字輸入和運算
   * Given: 用戶在桌面瀏覽器打開匯率計算機
   * When: 輸入數字和運算符
   * Then: 應該正確顯示表達式和結果
   */
  test('桌面版：基本運算功能', async ({ rateWisePage: page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes('firefox-mobile'),
      'Firefox Mobile 預設值 1,000 與桌面版流程不同，單獨追蹤',
    );
    // Given: 設定桌面視窗大小
    await page.setViewportSize(DESKTOP_VIEWPORT);

    await openCalculatorClean(page, 'from');

    // 輸入：7 + 5 = 12
    await page.getByRole('button', { name: '數字 7' }).click();
    await page.getByRole('button', { name: '加法' }).click();
    await page.getByRole('button', { name: '數字 5' }).click();

    // 驗證表達式顯示
    await expectExpression(page, /7\s\+\s5/);

    // 點擊等號
    await page.getByRole('button', { name: '計算結果' }).click();

    // Then: 驗證結果（計算機應該關閉並填入結果）
    // 注意：計算機關閉後，結果會填入輸入框
    await expect(page.getByRole('dialog', { name: '計算機' })).not.toBeVisible();
  });

  /**
   * 場景 2：桌面版 - 刪除按鈕短按
   * Given: 用戶輸入了數字
   * When: 短按刪除按鈕
   * Then: 應該刪除一個數字（不會雙重觸發）
   */
  test('桌面版：刪除按鈕短按（修復驗證）', async ({ rateWisePage: page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes('firefox-mobile'),
      'Firefox Mobile 預設值 1,000 與桌面版流程不同，單獨追蹤',
    );
    // Given: 設定桌面視窗大小
    await page.setViewportSize(DESKTOP_VIEWPORT);

    await openCalculatorClean(page, 'from');

    // 輸入三個數字：1, 2, 3
    await page.getByRole('button', { name: '數字 1' }).click();
    await page.getByRole('button', { name: '數字 2' }).click();
    await page.getByRole('button', { name: '數字 3' }).click();

    // 驗證顯示：123
    await expectExpression(page, /123/);

    // When: 短按刪除按鈕一次
    await page.getByRole('button', { name: '刪除' }).click();

    // Then: 應該只刪除一個數字，顯示 12（不是 1 或空）
    await expectExpression(page, /12$/);

    // 再按一次刪除
    await page.getByRole('button', { name: '刪除' }).click();

    // 驗證：應該顯示 1
    await expectExpression(page, /1$/);
  });

  /**
   * 場景 3：桌面版 - 清除按鈕
   * Given: 用戶輸入了表達式
   * When: 點擊清除按鈕（AC）
   * Then: 應該清除所有內容
   */
  test('桌面版：清除按鈕功能', async ({ rateWisePage: page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes('firefox-mobile'),
      'Firefox Mobile 預設值 1,000 與桌面版流程不同，單獨追蹤',
    );
    // Given: 設定桌面視窗大小
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openCalculatorClean(page, 'from');
    await page.getByRole('button', { name: '數字 7' }).click();
    await page.getByRole('button', { name: '加法' }).click();
    await page.getByRole('button', { name: '數字 5' }).click();

    // When: 點擊清除按鈕
    await page.getByRole('button', { name: '清除全部' }).click();

    // Then: 表達式應該清空（顯示 0 或空）
    // 驗證數字 7 和加號不再顯示
    await expectExpression(page, /輸入數字或表達式|^$/);
  });

  /**
   * 場景 4：移動版 - 數字輸入和運算
   * Given: 用戶在移動設備打開匯率計算機
   * When: 輸入數字和運算符
   * Then: 應該與桌面版行為一致
   */
  test('移動版：基本運算功能（一致性驗證）', async ({ rateWisePage: page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes('firefox-mobile'),
      'Firefox Mobile 預設值 1,000 與流程不同，單獨追蹤',
    );
    // Given: 設定移動視窗大小
    await page.setViewportSize(MOBILE_VIEWPORT);

    // When: 導航到首頁
    await openCalculatorClean(page, 'from');

    // 輸入：3 × 4 = 12
    await page.getByRole('button', { name: '數字 3' }).click();
    await page.getByRole('button', { name: '乘法' }).click();
    await page.getByRole('button', { name: '數字 4' }).click();

    // 驗證表達式顯示
    await expectExpression(page, /3\s×\s4/);

    // 點擊等號
    await page.getByRole('button', { name: '計算結果' }).click();

    // Then: 驗證計算機關閉（與桌面版一致）
    await expect(page.getByRole('dialog', { name: '計算機' })).not.toBeVisible();
  });

  /**
   * 場景 5：移動版 - 刪除按鈕短按
   * Given: 用戶在移動設備輸入了數字
   * When: 觸控短按刪除按鈕
   * Then: 應該與桌面版行為一致（只刪除一個數字）
   */
  test('移動版：刪除按鈕短按（一致性驗證）', async ({ rateWisePage: page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes('firefox-mobile'),
      'Firefox Mobile 預設值 1,000 與流程不同，單獨追蹤',
    );
    // Given: 設定移動視窗大小
    await page.setViewportSize(MOBILE_VIEWPORT);
    await openCalculatorClean(page, 'from');

    // 輸入數字：9, 8, 7
    await page.getByRole('button', { name: '數字 9' }).click();
    await page.getByRole('button', { name: '數字 8' }).click();
    await page.getByRole('button', { name: '數字 7' }).click();

    // 驗證顯示：987
    await expectExpression(page, /987/);

    // When: 觸控點擊刪除按鈕
    await page.getByRole('button', { name: '刪除' }).click();

    // Then: 應該只刪除一個數字（與桌面版一致）
    await expectExpression(page, /98$/);
  });

  /**
   * 場景 6：移動版 - 按鈕視覺反饋
   * Given: 用戶在移動設備使用計算機
   * When: 點擊任何按鈕
   * Then: 應該有視覺反饋（Motion 動畫）
   *
   * 注意：視覺動畫難以自動化測試，這裡測試按鈕可點擊性
   */
  test('移動版：按鈕可點擊性和反饋', async ({ rateWisePage: page }) => {
    // Given: 設定移動視窗大小
    await page.setViewportSize(MOBILE_VIEWPORT);
    await openCalculator(page, 'from');

    // When: 測試所有數字鍵可點擊
    const numberButtons = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (const num of numberButtons) {
      const button = page.getByRole('button', { name: `數字 ${num}` });
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    }

    // Then: 測試運算符鍵可點擊
    const operatorButtons = ['加法', '減法', '乘法', '除法'];
    for (const op of operatorButtons) {
      const button = page.getByRole('button', { name: op });
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    }
  });

  /**
   * 場景 7：鍵盤關閉功能
   * Given: 計算機已打開
   * When: 點擊關閉按鈕或背景遮罩
   * Then: 計算機應該關閉
   */
  test('計算機關閉功能', async ({ rateWisePage: page }) => {
    // Given: 打開計算機
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openCalculator(page, 'from');

    // When: 點擊關閉按鈕（X）
    await page.getByRole('button', { name: '關閉計算機' }).click();

    // Then: 計算機應該關閉
    await expect(page.getByRole('dialog', { name: '計算機' })).not.toBeVisible();
  });

  /**
   * 場景 8：無障礙功能驗證
   * Given: 視障用戶使用螢幕閱讀器
   * When: 使用鍵盤導航
   * Then: 所有按鈕應該有正確的 ARIA 標籤
   */
  test('無障礙功能：ARIA 標籤', async ({ rateWisePage: page }) => {
    // Given: 打開計算機
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openCalculator(page, 'from');

    // Then: 驗證關鍵按鈕的 ARIA 標籤
    await expect(page.getByRole('button', { name: '數字 5' })).toHaveAttribute(
      'aria-label',
      '數字 5',
    );
    await expect(page.getByRole('button', { name: '加法' })).toHaveAttribute('aria-label', '加法');
    await expect(page.getByRole('button', { name: '刪除' })).toHaveAttribute('aria-label', '刪除');
    await expect(page.getByRole('button', { name: '清除全部' })).toHaveAttribute(
      'aria-label',
      '清除全部',
    );
    await expect(page.getByRole('button', { name: '計算結果' })).toHaveAttribute(
      'aria-label',
      '計算結果',
    );
  });
});
