import { test, expect } from '@playwright/test';
import { getFab, TEXT } from './helpers';

/**
 * 羅盤導航旅程（issue #716）：記錄 → 開導航 → 羅盤渲染 → heading 注入 → 關閉。
 * heading 以 DeviceOrientationEvent 建構子直接 dispatch 模擬（Chromium 支援
 * alpha/absolute init dict）；桌面/Android 環境無 requestPermission 函式，
 * 權限狀態直接為 granted、listener 即掛。
 */
test.describe('記錄 → 羅盤導航旅程', () => {
  test.use({
    permissions: ['geolocation'],
    geolocation: { latitude: 25.034, longitude: 121.5644 },
  });

  test('儲存記錄後開啟導航：羅盤渲染、heading 注入、資訊卡與關閉', async ({ page }) => {
    await page.goto('/');

    // 1. 快速記錄：FAB → 樓層 chip 觸發 auto-save
    await getFab(page).click();
    await expect(page.getByPlaceholder(TEXT.platePlaceholder)).toBeVisible();
    await page.getByRole('button', { name: 'B3', exact: true }).click();

    // auto-save 後面板收合，首屏出現取車 hero 卡（issue #725 IA：tap 直入羅盤導引）
    const heroCard = page.getByTestId('pickup-hero-card');
    await expect(heroCard).toBeVisible();

    // 2. 由 hero 卡開啟羅盤導航
    await heroCard.click();

    // NavOverlay 開啟：關閉鈕（aria-label）＋資訊卡樓層 display 大字（text-5xl 僅存在於資訊卡）
    const closeButton = page.getByRole('button', { name: '關閉導航' });
    await expect(closeButton).toBeVisible();
    await expect(page.locator('p.text-5xl', { hasText: 'B3' })).toBeVisible();

    // 羅盤 SVG 盤面渲染（刻度環 300×300 viewBox）
    await expect(page.locator('svg[viewBox="0 0 300 300"]').first()).toBeVisible();

    // 3. heading 注入：模擬裝置朝向東方（alpha=270 → heading=90）
    await page.evaluate(() => {
      for (let i = 0; i < 12; i++) {
        window.dispatchEvent(
          new DeviceOrientationEvent('deviceorientationabsolute', {
            alpha: 270,
            beta: 10,
            gamma: 0,
            absolute: true,
          }),
        );
      }
    });

    // 注入後 UI 保持健康：盤面仍在、無錯誤覆蓋
    await expect(page.locator('svg[viewBox="0 0 300 300"]').first()).toBeVisible();

    // 4. 關閉導航回列表
    await closeButton.click();
    await expect(closeButton).not.toBeVisible();
    await expect(getFab(page)).toBeVisible();
  });
});
