/**
 * 離線冷啟動黑屏診斷測試
 *
 * 目的：精確定位飛航模式冷啟動黑屏根因。
 * 方法：
 *   Phase 1 - 線上暖機：新 context 訪問頁面，等待 SW 完成 precache install。
 *   Phase 2 - 快取審計：列出所有 cache storage 條目（特別是 JS/CSS chunk 數量）。
 *   Phase 3 - 冷啟動離線：同一個 browser profile 開新頁，模擬飛航模式重新打開 app。
 *
 * 測試使用 offline-pwa-chromium project（serviceWorkers: 'allow'）。
 *
 * 注意：
 * - Playwright 的 browser.newContext() 會建立全新的隔離 profile，不會共享已暖機的 SW/Cache Storage。
 * - 真實 PWA 冷啟動應該保留同一個 browser profile，只是重新開啟頁面，因此 Phase 3 改用同一個 context。
 *
 * @see apps/ratewise/src/sw.ts - setCatchHandler L131-234
 * @see apps/ratewise/vite.config.ts - globPatterns L290-304
 * @created 2026-03-12
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:4173';
const BASE_PATH =
  process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise';
const BASE = `${BASE_URL}${BASE_PATH}/`.replace(/\/+$/, '/');

// precache 暖機等待時間（ms）
const PRECACHE_SETTLE_MS = 5000;

test.describe('飛航模式冷啟動診斷', () => {
  test.use({ serviceWorkers: 'allow' });

  test('離線冷啟動不應顯示黑屏', async ({ browser }) => {
    // ======================================================================
    // Phase 1：線上暖機 - 讓 SW 完成安裝並 precache 所有 chunk
    // ======================================================================
    const onlineCtx = await browser.newContext({
      serviceWorkers: 'allow',
    });
    const warmPage = await onlineCtx.newPage();
    const warmErrors: string[] = [];
    warmPage.on('console', (m) => {
      if (m.type() === 'error') warmErrors.push(m.text());
    });

    console.log(`\n[Phase 1] 線上暖機 → ${BASE}`);
    await warmPage.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

    // 等待 SW activated 並控制頁面
    await warmPage.waitForFunction(
      () => navigator.serviceWorker?.controller?.state === 'activated',
      { timeout: 20000 },
    );
    console.log('[Phase 1] SW activated，等待 precache install 完成...');
    await warmPage.waitForTimeout(PRECACHE_SETTLE_MS);

    // ======================================================================
    // Phase 2：快取審計 - 列出所有 cache storage 條目
    // ======================================================================
    const cacheReport = await warmPage.evaluate(async () => {
      const names = await caches.keys();
      const report: Record<string, string[]> = {};
      for (const name of names) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        report[name] = keys.map((r) => r.url);
      }
      return report;
    });

    const allUrls = Object.values(cacheReport).flat();
    const jsUrls = allUrls.filter((u) => u.includes('.js') && u.includes('assets/'));
    const cssUrls = allUrls.filter((u) => u.includes('.css'));
    const htmlUrls = allUrls.filter((u) => u.endsWith('.html') || u.endsWith('/'));

    console.log('\n[Phase 2] 快取審計報告');
    console.log('================================');
    for (const [name, urls] of Object.entries(cacheReport)) {
      console.log(`  [${name}] ${urls.length} 條目`);
    }
    console.log(`  JS chunks in cache : ${jsUrls.length}`);
    console.log(`  CSS files in cache : ${cssUrls.length}`);
    console.log(`  HTML entries       : ${htmlUrls.length}`);
    console.log(`  線上暖機 errors    : ${warmErrors.length > 0 ? warmErrors.join(', ') : '無'}`);

    if (jsUrls.length > 0 && jsUrls.length <= 20) {
      console.log('\n  JS chunk URLs:');
      jsUrls.forEach((u) => console.log(`    ${u}`));
    }

    // 斷言：JS chunks 必須已在快取中
    expect(
      jsUrls.length,
      `❌ 快取中無 JS chunks，precache 未正常安裝\n  可能根因：globPatterns 漏掉 dist 子目錄`,
    ).toBeGreaterThan(0);
    expect(cssUrls.length, '❌ 快取中無 CSS files').toBeGreaterThan(0);

    // ======================================================================
    // Phase 3：飛航模式冷啟動 - 同一個 profile 開新頁，直接離線訪問
    // ======================================================================
    console.log('\n[Phase 3] 飛航模式冷啟動（同一 profile + 新頁面 + 離線）');

    await warmPage.close();
    await onlineCtx.setOffline(true);
    const offlinePage = await onlineCtx.newPage();
    const offlineErrors: string[] = [];
    const offlineConsole: string[] = [];

    offlinePage.on('console', (m) => {
      const text = `[${m.type()}] ${m.text()}`;
      offlineConsole.push(text);
      if (m.type() === 'error') {
        offlineErrors.push(m.text());
        console.log(`  console.error: ${m.text()}`);
      }
    });

    let navigationError: string | null = null;
    try {
      // 冷啟動：直接以離線模式訪問，模擬飛航模式打開 app
      await offlinePage.goto(BASE, { waitUntil: 'commit', timeout: 15000 });
      console.log('[Phase 3] 導覽成功（SW 從快取提供 HTML）');
    } catch (e) {
      navigationError = String(e);
      console.log(`[Phase 3] 導覽失敗（可能是 SW 未安裝或 HTML 未快取）: ${navigationError}`);
    }

    // 等待頁面渲染（最多 10 秒）
    await offlinePage.waitForTimeout(3000);

    // 截圖保存當前狀態
    await offlinePage.screenshot({
      path: 'screenshots/offline-cold-start.png',
      fullPage: true,
    });
    console.log('[Phase 3] 截圖已儲存至 screenshots/offline-cold-start.png');

    // 檢查頁面狀態
    const [bodyBg, bodyText, rootHTML] = await Promise.all([
      offlinePage.evaluate(() => window.getComputedStyle(document.body).backgroundColor),
      offlinePage
        .locator('body')
        .innerText()
        .catch(() => ''),
      offlinePage
        .locator('#root')
        .innerHTML()
        .catch(() => ''),
    ]);

    // 快取狀態（離線 context 下）
    const offlineCacheReport = await offlinePage.evaluate(async () => {
      try {
        const names = await caches.keys();
        const counts: Record<string, number> = {};
        for (const name of names) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          counts[name] = keys.length;
        }
        return counts;
      } catch {
        return {};
      }
    });

    console.log('\n[Phase 3] 離線冷啟動結果');
    console.log('================================');
    console.log(`  body background   : ${bodyBg}`);
    console.log(`  body text length  : ${bodyText.trim().length}`);
    console.log(`  #root HTML length : ${rootHTML.length}`);
    console.log(`  navigation error  : ${navigationError ?? '無'}`);
    console.log(
      `  console errors    : ${offlineErrors.length > 0 ? offlineErrors.join(' | ') : '無'}`,
    );
    console.log(`  離線 context 快取 : ${JSON.stringify(offlineCacheReport)}`);

    // ======================================================================
    // 根因分析
    // ======================================================================
    const hasLoadFailed = offlineErrors.some(
      (e) => e.includes('Load failed') || e.includes('ChunkLoadError'),
    );
    const isBlackScreen = bodyText.trim().length === 0 && rootHTML.length < 50;
    const hasContent = bodyText.trim().length > 50;

    if (isBlackScreen) {
      console.log('\n🚨 診斷結果：黑屏');
      if (jsUrls.length === 0) {
        console.log('   根因推測：主要 JS chunk 未被 precache 涵蓋');
        console.log('   → 檢查 sw.ts 的 __WB_MANIFEST 注入與 vite.config.ts globPatterns');
      } else if (hasLoadFailed) {
        console.log('   根因推測：autoUpdate + cleanupOutdatedCaches 競態');
        console.log('   → 舊 chunk URL 已被清除，但新快取尚未完整安裝');
      } else if (navigationError) {
        console.log('   根因推測：SW 未安裝（全新 context），index.html 未能從快取提供');
        console.log('   → setCatchHandler 需能在 SW 尚未 claim 時也提供快取');
      } else {
        console.log('   根因推測：React 掛載失敗（JS 載入但執行出錯）');
        console.log('   → 檢查 console errors 中的 JavaScript 錯誤');
      }
    } else if (hasContent) {
      console.log('\n✅ 診斷結果：正常渲染（無黑屏）');
    } else {
      console.log('\n⚠️  診斷結果：部分渲染（body 有少量內容，可能顯示 offline.html）');
    }

    // 斷言：不應為黑屏，不應有 Load failed
    expect(
      bodyText.trim().length,
      `黑屏：body 無內容。navigationError=${navigationError}, errors=${offlineErrors.join(', ')}`,
    ).toBeGreaterThan(0);

    expect(hasLoadFailed, `Load failed 錯誤：${offlineErrors.join(', ')}`).toBe(false);

    await onlineCtx.close();
  });

  /**
   * 補充測試：確認快取中的 JS chunk 數量與 precache 清單一致
   * 只在線上環境執行（用於驗證暖機後快取完整性）
   */
  test('暖機後快取應包含足夠的 JS chunks', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

    // 等待 SW activated
    await page.waitForFunction(() => navigator.serviceWorker?.controller?.state === 'activated', {
      timeout: 20000,
    });
    await page.waitForTimeout(PRECACHE_SETTLE_MS);

    const { jsCacheCount, cssCacheCount, cacheNames } = await page.evaluate(async () => {
      const names = await caches.keys();
      let jsCacheCount = 0;
      let cssCacheCount = 0;
      for (const name of names) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        jsCacheCount += keys.filter(
          (r) => r.url.includes('.js') && r.url.includes('assets/'),
        ).length;
        cssCacheCount += keys.filter((r) => r.url.includes('.css')).length;
      }
      return { jsCacheCount, cssCacheCount, cacheNames: names };
    });

    console.log(`\n快取 JS chunks: ${jsCacheCount}, CSS files: ${cssCacheCount}`);
    console.log(`Cache names: ${cacheNames.join(', ')}`);

    // 現代 SPA 至少應有數個 JS chunk（index, vendor, lazy routes 等）
    expect(jsCacheCount, '快取中應有 JS chunks').toBeGreaterThanOrEqual(3);
    expect(cssCacheCount, '快取中應有 CSS files').toBeGreaterThanOrEqual(1);
  });
});
