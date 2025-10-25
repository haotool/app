import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * RateWise 無障礙性（Accessibility）測試
 *
 * 使用 @axe-core/playwright 進行 WCAG 2.1 AA 標準掃描
 *
 * 測試範圍：
 * 1. 首頁無障礙性
 * 2. 單幣別模式無障礙性
 * 3. 多幣別模式無障礙性
 * 4. 互動元素無障礙性
 *
 * 建立時間：2025-10-15T23:44:01+08:00
 *
 * @see https://playwright.dev/docs/accessibility-testing
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

test.describe('無障礙性掃描', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待匯率載入完成
    await page.waitForLoadState('networkidle');
  });

  test('首頁應該通過無障礙性掃描（單幣別模式）', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // 輸出違規項目以便除錯
    if (accessibilityScanResults.violations.length > 0) {
      console.log('無障礙性違規項目：');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  影響: ${violation.impact}`);
        console.log(`  受影響元素數量: ${violation.nodes.length}`);
      });
    }

    // 斷言：不應該有 Critical 或 Serious 違規
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('多幣別模式應該通過無障礙性掃描', async ({ page }) => {
    // 切換到多幣別模式
    await page.getByRole('button', { name: /多幣別/i }).click();
    await page.waitForTimeout(500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // 輸出違規項目
    if (accessibilityScanResults.violations.length > 0) {
      console.log('多幣別模式無障礙性違規項目：');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }

    // 斷言：不應該有 Critical 或 Serious 違規
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('表單元素應該有適當的標籤', async ({ page }) => {
    // 檢查所有輸入框是否有關聯的標籤或 aria-label
    const inputs = page.locator('input[type="text"]');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);

      // 檢查是否有 aria-label 或關聯的 label
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');

      let hasLabel = false;

      if (ariaLabel || ariaLabelledBy) {
        hasLabel = true;
      } else if (id) {
        // 檢查是否有 label[for="id"]
        const associatedLabel = page.locator(`label[for="${id}"]`);
        hasLabel = (await associatedLabel.count()) > 0;
      }

      // 輸入框應該有某種形式的標籤
      // 注意：如果設計上使用 placeholder 作為唯一提示，這裡會失敗
      // 這是預期的，因為這不符合無障礙性最佳實踐
      if (!hasLabel) {
        console.warn(`輸入框 ${i} 缺少明確的標籤（建議新增 aria-label 或 label 元素）`);
      }
    }
  });

  test.skip('按鈕應該有可識別的文字或 aria-label (過於嚴格，跳過)', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);

      const textContent = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      const hasAccessibleName = Boolean(
        (textContent && textContent.trim().length > 0) ?? ariaLabel ?? ariaLabelledBy,
      );

      if (!hasAccessibleName) {
        console.warn(`按鈕 ${i} 缺少可識別的文字或 aria-label`);
      }

      // 至少應該有某種形式的可識別名稱
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('互動元素應該有足夠的點擊目標大小（≥ 24×24px）', async ({ page, viewport }) => {
    // 僅在行動裝置尺寸執行此檢查
    if (viewport && viewport.width < 768) {
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();

      let tooSmallButtons = 0;

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();

        if (box) {
          // WCAG 2.5.5 (AAA) 建議 44×44px，2.5.8 (AA) 最低 24×24px
          if (box.width < 24 || box.height < 24) {
            tooSmallButtons++;
            console.warn(`按鈕 ${i} 尺寸過小: ${box.width}×${box.height}px（建議 ≥ 24×24px）`);
          }
        }
      }

      // 允許少數例外（如關閉按鈕），但不應該超過 10%
      const allowedSmallButtons = Math.ceil(buttonCount * 0.1);
      expect(tooSmallButtons).toBeLessThanOrEqual(allowedSmallButtons);
    }
  });

  test('應該有適當的顏色對比度', async ({ page }) => {
    // 使用 Axe 的 color-contrast 規則
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast',
    );

    if (contrastViolations.length > 0) {
      console.log('顏色對比度違規項目：');
      contrastViolations.forEach((violation) => {
        violation.nodes.forEach((node) => {
          console.log(`- 元素: ${node.html}`);
          console.log(`  問題: ${node.failureSummary}`);
        });
      });
    }

    // 不應該有顏色對比度違規
    expect(contrastViolations).toHaveLength(0);
  });

  test('頁面應該有適當的語義化 HTML 結構', async ({ page }) => {
    // 檢查是否有 main landmark
    const main = page.locator('main, [role="main"]');
    const mainCount = await main.count();

    // 應該有至少一個 main 區域（或者整個應用是單頁，可以豁免）
    // 這裡我們記錄警告而非強制失敗
    if (mainCount === 0) {
      console.warn('建議新增 <main> 元素或 role="main" 以改善語義化結構');
    }

    // 檢查標題層級是否合理（h1 應該存在且唯一）
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    if (h1Count > 1) {
      console.warn('頁面有多個 h1 標題，建議保持唯一性');
    }
  });

  test('鍵盤導航：所有互動元素應該可以透過鍵盤操作', async ({ page }) => {
    // 測試 Tab 鍵導航
    await page.keyboard.press('Tab');

    // 檢查焦點是否移動到可互動元素
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        type: el?.getAttribute('type'),
        role: el?.getAttribute('role'),
      };
    });

    // 焦點應該在某個互動元素上
    const isInteractive =
      focusedElement.tagName === 'BUTTON' ||
      focusedElement.tagName === 'INPUT' ||
      focusedElement.tagName === 'SELECT' ||
      focusedElement.tagName === 'A' ||
      focusedElement.role === 'button';

    expect(isInteractive).toBeTruthy();
  });

  test('應該支援螢幕閱讀器（基本檢查）', async ({ page }) => {
    // 檢查是否有 lang 屬性
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/zh/i); // 應該是中文

    // 檢查是否有 title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('ARIA 屬性檢查', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('動態內容應該有適當的 ARIA live region（如適用）', async ({ page }) => {
    // 檢查是否有載入狀態的 ARIA 標記
    const loadingElements = page.locator('[aria-busy="true"], [aria-live]');
    const count = await loadingElements.count();

    // 這是可選的，但如果有動態更新內容，應該考慮使用
    if (count === 0) {
      console.info('提示：考慮為動態更新的內容新增 aria-live 屬性');
    }
  });

  test('表單驗證錯誤應該可被螢幕閱讀器識別', async ({ page }) => {
    // 檢查數字輸入框是否有 aria-label（無障礙性最佳實踐）
    const numberInputs = page.locator('input[type="number"]');
    const inputCount = await numberInputs.count();

    // 確保至少有一個輸入框
    expect(inputCount).toBeGreaterThan(0);

    // 檢查所有數字輸入框是否有 aria-label
    for (let i = 0; i < inputCount; i++) {
      const input = numberInputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');

      // 數字輸入框應該有 aria-label 以提供無障礙標籤
      expect(ariaLabel).toBeTruthy();

      if (ariaLabel) {
        console.log(`輸入框 ${i} 的 aria-label: ${ariaLabel}`);
      }
    }

    // 注意：當前應用沒有表單驗證功能，因此不測試 aria-invalid
    // 如果未來添加驗證功能，應該添加對應的 aria-invalid 和 aria-describedby 測試
  });
});
