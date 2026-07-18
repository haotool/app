import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { getFab, TEXT, TEST_PHOTO_BASE64 } from './helpers';

/**
 * 零遮蔽量化守門（issue #752）：楔形 path 取樣 200 點經 screen CTM 轉螢幕座標，
 * 回傳落入 Hub 圓內的比例（%）。與 scripts/poc-r4a.mjs 同口徑，常駐 e2e 防回歸。
 */
async function measureWedgeInHubPct(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const hub = document.querySelector('[data-testid="compass-hub"]');
    const arc = document.querySelector('[data-testid="compass-arc"]');
    if (!hub || !arc) return null;
    const hr = hub.getBoundingClientRect();
    const c = { x: hr.left + hr.width / 2, y: hr.top + hr.height / 2, r: hr.width / 2 };
    const wedgeSvg = arc.querySelectorAll('svg')[1];
    const path = wedgeSvg?.querySelector('path');
    const ctm = path?.getScreenCTM();
    if (!path || !ctm) return null;
    const len = path.getTotalLength();
    const N = 200;
    let inside = 0;
    for (let i = 0; i < N; i++) {
      const pt = path.getPointAtLength((len * i) / N);
      const sx = ctm.a * pt.x + ctm.c * pt.y + ctm.e;
      const sy = ctm.b * pt.x + ctm.d * pt.y + ctm.f;
      if (Math.hypot(sx - c.x, sy - c.y) < c.r - 0.5) inside++;
    }
    return (inside / N) * 100;
  });
}

/**
 * 羅盤導航旅程（issue #716；#752 佈局 v2）：
 * 記錄 → 開導航 → 弧形 deck 渲染 → heading 注入 → 關閉。
 * v2 佈局：上 58% 地圖、下 42% deck（資訊緊湊列＋弧形盤面＋144px hub）；
 * heading 以 DeviceOrientationEvent 建構子直接 dispatch 模擬（Chromium 支援
 * alpha/absolute init dict）；桌面/Android 環境無 requestPermission 函式，
 * 權限狀態直接為 granted、listener 即掛。
 */
test.describe('記錄 → 羅盤導航旅程', () => {
  test.use({
    permissions: ['geolocation'],
    geolocation: { latitude: 25.034, longitude: 121.5644 },
  });

  test('儲存記錄後開啟導航：弧形 deck 渲染、heading 注入、資訊列與關閉', async ({ page }) => {
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

    // NavOverlay 開啟：關閉鈕（aria-label）＋deck 資訊緊湊列樓層 chip
    const closeButton = page.getByRole('button', { name: '關閉導航', exact: true });
    await expect(closeButton).toBeVisible();
    const infoStrip = page.getByTestId('nav-info-strip');
    await expect(infoStrip).toBeVisible();
    await expect(infoStrip.getByText('B3')).toBeVisible();

    // 弧形盤面與 144px hub 渲染（390×844 直向為 arc 模式）。
    // poll 等 dialog 進場 scale 動畫收斂到 1，boundingBox 才反映佈局尺寸。
    await expect(page.getByTestId('compass-arc')).toBeVisible();
    const hub = page.getByTestId('compass-hub');
    await expect(hub).toBeVisible();
    await expect.poll(async () => (await hub.boundingBox())?.width).toBe(144);
    const hubBox = await hub.boundingBox();
    expect(hubBox?.height).toBe(144);

    // 佈局 v2 幾何斷言：deck 高度 = 視口 42%、hub 完整收在 deck 內（零遮蔽）
    const deckBox = await page.getByTestId('compass-deck').boundingBox();
    const viewport = page.viewportSize();
    expect(deckBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (deckBox && viewport && hubBox) {
      expect(Math.abs(deckBox.height - viewport.height * 0.42)).toBeLessThanOrEqual(1);
      expect(hubBox.y).toBeGreaterThanOrEqual(deckBox.y);
      expect(hubBox.y + hubBox.height).toBeLessThanOrEqual(deckBox.y + deckBox.height + 1);
    }

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
    await expect(page.getByTestId('compass-arc')).toBeVisible();

    // 零遮蔽常駐守門：楔形帶取樣點落入 Hub 圓比例必須為 0（幾何契約防回歸）。
    expect(await measureWedgeInHubPct(page)).toBe(0);

    // 4. 關閉導航回列表
    await closeButton.click();
    await expect(closeButton).not.toBeVisible();
    await expect(getFab(page)).toBeVisible();
  });

  test('照片錨：photo-overlay 在地圖區內，不被 deck 與平放 pill 遮蓋', async ({
    page,
    context,
  }) => {
    await page.goto('/');

    // 含照片記錄：FAB → 注入測試圖片 → 樓層 chip auto-save。
    await getFab(page).click();
    await page.getByTestId('quick-entry-photo-input').setInputFiles({
      name: 'test-photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TEST_PHOTO_BASE64, 'base64'),
    });
    await expect(page.getByAltText('停車照片')).toBeVisible();
    await page.getByRole('button', { name: 'B3', exact: true }).click();

    // 使用者移離車位（~55m 南）：脫離抵達態，平放 pill 才會出現（條件含 !arrived）。
    await context.setGeolocation({ latitude: 25.0335, longitude: 121.5644 });
    await page.getByTestId('pickup-hero-card').click();
    await expect(page.getByTestId('compass-deck')).toBeVisible();

    // 傾斜手機讓平放 pill 出現（驗證 pill 與照片錨共存不相交）。
    await page.evaluate(() => {
      for (let i = 0; i < 12; i++) {
        window.dispatchEvent(
          new DeviceOrientationEvent('deviceorientationabsolute', {
            alpha: 270,
            beta: 80,
            gamma: 0,
            absolute: true,
          }),
        );
      }
    });

    const overlay = page.getByTestId('photo-overlay');
    await expect(overlay).toBeVisible();
    const pill = page.getByText('請平放手機');
    await expect(pill).toBeVisible();

    // 等進場動畫收斂後量測（poll 至 deck 高度穩定為 42%）。
    const deck = page.getByTestId('compass-deck');
    const viewport = page.viewportSize();
    await expect
      .poll(async () => (await deck.boundingBox())?.height)
      .toBeCloseTo((viewport?.height ?? 0) * 0.42, 0);

    const overlayBox = await overlay.boundingBox();
    const deckBox = await deck.boundingBox();
    const pillBox = await pill.boundingBox();
    expect(overlayBox).not.toBeNull();
    expect(deckBox).not.toBeNull();
    expect(pillBox).not.toBeNull();
    if (overlayBox && deckBox && pillBox) {
      // 照片錨完整在地圖區（deck 上緣以上）。
      expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(deckBox.y + 0.5);
      // 照片錨與平放 pill 矩形零相交。
      const ix =
        Math.min(overlayBox.x + overlayBox.width, pillBox.x + pillBox.width) -
        Math.max(overlayBox.x, pillBox.x);
      const iy =
        Math.min(overlayBox.y + overlayBox.height, pillBox.y + pillBox.height) -
        Math.max(overlayBox.y, pillBox.y);
      expect(Math.max(0, ix) * Math.max(0, iy)).toBe(0);
    }
  });

  test('iOS 權限手勢流：requestPermission 存在時顯示啟用卡，手勢授權後羅盤生效', async ({
    page,
  }) => {
    // 模擬 iOS 13+：DeviceOrientationEvent.requestPermission 需使用者手勢授權。
    await page.addInitScript(() => {
      (
        DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      ).requestPermission = () => Promise.resolve('granted');
      (
        DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
      ).requestPermission = () => Promise.resolve('granted');
    });

    await page.goto('/');
    await getFab(page).click();
    await page.getByRole('button', { name: 'B3', exact: true }).click();

    await page.getByTestId('pickup-hero-card').click();

    // 權限卡以手勢觸發授權（非 mount 自動請求）。
    const enableButton = page.getByRole('button', { name: '啟用羅盤' });
    await expect(enableButton).toBeVisible();
    await enableButton.click();

    // 授權後權限卡消失、羅盤盤面運作。
    await expect(enableButton).toHaveCount(0);
    await expect(page.getByTestId('compass-arc')).toBeVisible();
  });
});

/**
 * 矮視高降級（issue #752）：deck stage 高度不足以承載弧模式時，
 * 降級為 56px 方向膠囊，杜絕「Hub 吞沒刻度環」情境（取證：橫向 100% 吞沒）。
 */
test.describe('矮視高／橫向降級方向膠囊', () => {
  test.use({
    permissions: ['geolocation'],
    geolocation: { latitude: 25.034, longitude: 121.5644 },
  });

  test('有效視高 553（Safari 工具列情境）：deck 渲染方向膠囊而非弧形盤面', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 553 });
    await page.goto('/');

    await getFab(page).click();
    await page.getByRole('button', { name: 'B3', exact: true }).click();
    await page.getByTestId('pickup-hero-card').click();

    const capsule = page.getByTestId('compass-capsule');
    await expect(capsule).toBeVisible();
    await expect(page.getByTestId('compass-arc')).toHaveCount(0);

    // 膠囊高度 56px SSOT（poll 等進場動畫收斂）。
    const capsuleInner = capsule.locator('> div');
    await expect.poll(async () => (await capsuleInner.boundingBox())?.height).toBe(56);
  });

  test('手機橫向：降級方向膠囊（根治 100% 吞沒）', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');

    await getFab(page).click();
    await page.getByRole('button', { name: 'B3', exact: true }).click();
    await page.getByTestId('pickup-hero-card').click();

    await expect(page.getByTestId('compass-capsule')).toBeVisible();
    await expect(page.getByTestId('compass-arc')).toHaveCount(0);
  });
});
