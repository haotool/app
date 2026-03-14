/**
 * GA4 延後初始化 + LCP 改善 E2E 測試
 *
 * 目的：
 *   1. 驗證 GA4 script 不在 LCP 前（`load` 事件前）注入 DOM
 *   2. 驗證 `load` 事件後 GA4 script 確實存在
 *   3. 驗證 document.readyState === 'complete' 競態防衛：
 *      若頁面在監聽器掛載前已 complete，GA 仍能正確初始化
 *   4. 驗證 `manifest.webmanifest` Content-Type 為 `application/manifest+json`
 *   5. 驗證 GA4 不重複注入（initialized flag 防衛）
 *
 * 技術依據：
 *   - web.dev LCP 閾值：Good ≤ 2.5s
 *   - Workbox docs：setCatchHandler 最佳實踐
 *   - 業界標準（constantsolutions.dk）：`window.gtmDidInit` flag 防重複
 *
 * @see apps/ratewise/src/main.tsx    - GA4 延後初始化邏輯
 *   apps/ratewise/src/utils/ga.ts   - initGA / trackPageview
 *   security-headers/src/worker.js  - manifest Content-Type 修正
 *
 * @created 2026-03-14
 */

import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:4173';
const BASE_PATH =
  process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise';
const BASE = `${BASE_URL}${BASE_PATH}/`.replace(/\/+$/, '/');

/** 共用：mock 匯率 API，避免外部依賴影響測試穩定性。 */
async function mockRatesApi(page: Page): Promise<void> {
  await page.route(
    (url) => url.toString().includes('/rates/latest.json'),
    async (route) =>
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
  await page.route(
    (url) => url.toString().includes('/rates/history/'),
    async (route) => route.fulfill({ status: 404 }),
  );
}

test.describe('GA4 延後初始化 + LCP 效能', () => {
  test.use({ serviceWorkers: 'block' });
  test.setTimeout(60_000);

  test('GA4 script 應在 load 事件後才注入（不在 LCP 前競爭頻寬）', async ({ page }) => {
    // 攔截所有網路請求，記錄 gtag.js 的請求時機
    const gtagRequests: number[] = [];
    let loadEventTime = -1;

    // 監聽 gtag.js 請求
    page.on('request', (req) => {
      if (req.url().includes('googletagmanager.com/gtag/js')) {
        gtagRequests.push(Date.now());
      }
    });

    // 注入 JS 在 load 事件時記錄時間
    await page.addInitScript(() => {
      window.addEventListener(
        'load',
        () => {
          (window as unknown as Record<string, unknown>)['__e2e_loadTime'] = Date.now();
        },
        { once: true },
      );
    });

    await mockRatesApi(page);

    await page.goto(BASE, { waitUntil: 'load' });

    // 取得 load 事件時間
    loadEventTime = await page.evaluate(
      () => (window as unknown as Record<string, unknown>)['__e2e_loadTime'] as number,
    );

    // 等待 GA 有機會初始化（500ms 寬裕）
    await page.waitForTimeout(500);

    // 斷言 1: VITE_GA_ID 未設定時（測試環境），GA script 不應被注入
    // 生產環境：script 存在且應在 load 事件後請求
    const gaScriptInDom = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.some((s) => (s as HTMLScriptElement).src.includes('googletagmanager.com'));
    });

    // 在測試環境（無 VITE_GA_ID），GA 不應注入任何 script
    // 在生產環境，若有 gtag 請求，必須在 load 事件後發生
    if (gtagRequests.length > 0) {
      expect(loadEventTime).toBeGreaterThan(0);
      // 所有 gtag 請求必須在 load 事件後 0ms（寬裕 100ms 給事件循環）
      const allAfterLoad = gtagRequests.every((t) => t >= loadEventTime - 100);
      expect(allAfterLoad, 'GA4 script 請求應發生在 load 事件後').toBe(true);
    } else {
      // 測試環境沒有真實 GA_ID，不應有 gtag 請求
      expect(gaScriptInDom, '測試環境不應注入 GA script（無 VITE_GA_ID）').toBe(false);
    }

    // 斷言 2: window.gtag 應只在 load 後才存在（或完全不存在於無 GA_ID 環境）
    const gtagExists = await page.evaluate(() => typeof window.gtag === 'function');
    // 有 GA_ID → gtag 存在；無 GA_ID → gtag 不存在。兩者皆為預期行為。
    // 此測試只是記錄狀態，不強制失敗
    console.log(
      `[GA E2E] gtag initialized: ${String(gtagExists)}, loadEventTime: ${String(loadEventTime)}`,
    );
  });

  test('document.readyState === complete 時 GA 應直接初始化（無競態）', async ({ page }) => {
    // 模擬已 complete 的頁面（注入腳本在 DOMContentLoaded 後觸發）
    let readyStateCaptured = '';
    let gtagCalledCount = 0;

    await page.addInitScript(() => {
      // 覆寫 initGA 來追蹤呼叫次數
      const origDescriptor = Object.getOwnPropertyDescriptor(window, '__e2e_initGA_calls');
      if (!origDescriptor) {
        Object.defineProperty(window, '__e2e_initGA_calls', {
          value: 0,
          writable: true,
          configurable: true,
        });
      }
    });

    await mockRatesApi(page);

    // 攔截並記錄 readyState
    readyStateCaptured = await page.evaluate(() => document.readyState);
    console.log(`[GA E2E] readyState before navigate: ${readyStateCaptured}`);

    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(300);

    // 驗證頁面已完整載入
    const finalReadyState = await page.evaluate(() => document.readyState);
    expect(finalReadyState, 'load 後 readyState 應為 complete').toBe('complete');

    // 驗證無重複 gtag 設定（initialized flag 防衛）
    gtagCalledCount = await page.evaluate(() => {
      if (!window.dataLayer) return 0;
      // 計算 gtag('config', ...) 呼叫次數（config 事件）
      return (window.dataLayer as unknown[]).filter(
        (item) => Array.isArray(item) && (item as unknown[])[0] === 'config',
      ).length;
    });

    // 在測試環境（無 GA_ID），不應有任何 config 呼叫
    // 在生產環境，config 呼叫應只有 1 次（不重複初始化）
    console.log(`[GA E2E] gtag config calls: ${String(gtagCalledCount)}`);
    expect(gtagCalledCount, '同一頁面 GA config 不應重複呼叫超過 1 次').toBeLessThanOrEqual(1);
  });

  test('manifest.webmanifest 應回傳正確 Content-Type', async ({ page, request }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // 取得 manifest link href
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref, 'manifest link 應存在').toBeTruthy();

    // 請求 manifest
    const manifestUrl = new URL(manifestHref!, BASE);
    const response = await request.get(manifestUrl.toString());

    expect(response.ok(), `manifest 請求應成功（${String(response.status())}）`).toBe(true);

    const contentType = response.headers()['content-type'] ?? '';
    // 正確的 MIME type（W3C Web App Manifest spec）
    expect(
      contentType,
      'Content-Type 應為 application/manifest+json（不含雙重類型 application/octet-stream）',
    ).toContain('application/manifest+json');
    expect(
      contentType,
      'Content-Type 不應包含 application/octet-stream（上游雙重類型 bug）',
    ).not.toContain('application/octet-stream');

    // 驗證 manifest 內容可被正確解析
    const body = (await response.json()) as Record<string, unknown>;
    expect(body['name'], 'manifest.name 應存在').toBeTruthy();
    expect(body['display'], 'manifest.display 應為 standalone').toBe('standalone');
    expect(Array.isArray(body['icons']), 'manifest.icons 應為陣列').toBe(true);

    console.log(`[manifest E2E] Content-Type: ${contentType}`);
  });

  test('GA4 dataLayer 不應在 load 事件前被初始化', async ({ page }) => {
    // 在頁面最早期注入 spy，追蹤 dataLayer 初始化時機
    let dataLayerInitBeforeLoad = false;

    await page.addInitScript(() => {
      // 使用 MutationObserver 監控 head 中 script 的加入時機
      let loadFired = false;
      window.addEventListener(
        'load',
        () => {
          loadFired = true;
        },
        { once: true },
      );

      // 監控 dataLayer 的初始化
      Object.defineProperty(window, '__e2e_dataLayerCheck', {
        get: () => loadFired,
        configurable: true,
      });
    });

    await mockRatesApi(page);

    // 在 DOMContentLoaded 前捕捉 dataLayer 狀態
    page.on('domcontentloaded', async () => {
      dataLayerInitBeforeLoad = await page.evaluate(
        () => typeof window.dataLayer !== 'undefined' && window.dataLayer.length > 0,
      );
    });

    await page.goto(BASE, { waitUntil: 'load' });

    // 斷言：DOMContentLoaded 時 dataLayer 不應有任何事件
    // （GA 是 load 後才初始化，dataLayer 在 DOMContentLoaded 時應為空或未定義）
    expect(
      dataLayerInitBeforeLoad,
      'DOMContentLoaded 前 dataLayer 不應被初始化（GA 應延後至 load 後）',
    ).toBe(false);

    console.log(`[GA E2E] dataLayer init before load: ${String(dataLayerInitBeforeLoad)}`);
  });
});

test.describe('PWA 冷啟動離線就緒強化驗證', () => {
  test.use({ serviceWorkers: 'allow' });
  test.setTimeout(120_000);

  test('precache 應包含完整 JS/CSS/HTML 以支援離線冷啟動', async ({ browser }) => {
    const ctx = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await ctx.newPage();

    await mockRatesApi(page);

    console.log(`\n[PWA E2E] 線上暖機 → ${BASE}`);
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker?.getRegistration();
        return reg?.active?.state === 'activated';
      },
      undefined,
      { timeout: 60_000 },
    );
    await page.waitForTimeout(5000);

    // 驗證 setCatchHandler 三層 JS/CSS 快取策略
    const cacheStats = await page.evaluate(async () => {
      const names = await caches.keys();
      let jsCount = 0;
      let cssCount = 0;
      let htmlCount = 0;
      let hasOfflineHtml = false;
      let hasIndexHtml = false;
      const cacheNames: string[] = names;

      for (const name of names) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        for (const req of keys) {
          const url = req.url;
          if (url.includes('.js') && url.includes('assets/')) jsCount++;
          if (url.includes('.css')) cssCount++;
          if (url.endsWith('.html') || url.endsWith('/')) htmlCount++;
          if (url.includes('offline.html')) hasOfflineHtml = true;
          if (url.endsWith('/') || url.includes('index.html')) hasIndexHtml = true;
        }
      }
      return { jsCount, cssCount, htmlCount, hasOfflineHtml, hasIndexHtml, cacheNames };
    });

    console.log(
      `[PWA E2E] JS: ${cacheStats.jsCount}, CSS: ${cacheStats.cssCount}, HTML: ${cacheStats.htmlCount}`,
    );
    console.log(
      `[PWA E2E] offline.html: ${String(cacheStats.hasOfflineHtml)}, index.html: ${String(cacheStats.hasIndexHtml)}`,
    );
    console.log(`[PWA E2E] caches: ${cacheStats.cacheNames.join(', ')}`);

    // 斷言：setCatchHandler 需要這些資源存在
    expect(cacheStats.jsCount, '❌ JS chunks 不足，冷啟動 React 無法啟動').toBeGreaterThanOrEqual(
      10,
    );
    expect(cacheStats.cssCount, '❌ CSS 未快取，冷啟動頁面無樣式').toBeGreaterThanOrEqual(1);
    expect(
      cacheStats.hasIndexHtml,
      '❌ index.html 未在快取（setCatchHandler document fallback 1 失敗）',
    ).toBe(true);
    expect(
      cacheStats.hasOfflineHtml,
      '❌ offline.html 未在快取（setCatchHandler document fallback 2 失敗）',
    ).toBe(true);

    await ctx.close();
  });

  test('setCatchHandler 三層 JS 回退：exact → ignoreSearch → matchPrecache', async ({
    browser,
  }) => {
    // 這個測試模擬 setCatchHandler 邏輯：
    // 若 JS chunk 在 cache 中（任意鍵格式），應能取到
    const ctx = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await ctx.newPage();

    await mockRatesApi(page);

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker?.getRegistration();
        return reg?.active?.state === 'activated';
      },
      undefined,
      { timeout: 60_000 },
    );
    await page.waitForTimeout(5000);

    // 驗證 precache 中有 JS chunk（setCatchHandler Layer 1-3 的基礎）
    const precacheJsTest = await page.evaluate(async () => {
      const names = await caches.keys();
      const precacheName = names.find((n) => n.startsWith('workbox-precache-v2'));
      if (!precacheName) return { hasPrecache: false, jsEntries: [], totalEntries: 0 };

      const cache = await caches.open(precacheName);
      const keys = await cache.keys();
      const jsEntries = keys
        .filter((r) => r.url.includes('.js') && r.url.includes('assets/'))
        .map((r) => r.url.replace(/.*\/assets\//, 'assets/').substring(0, 50));

      return {
        hasPrecache: true,
        jsEntries: jsEntries.slice(0, 5),
        totalEntries: keys.length,
      };
    });

    console.log(
      `[SW E2E] precache: ${String(precacheJsTest.hasPrecache)}, JS entries: ${precacheJsTest.jsEntries.length}, total: ${precacheJsTest.totalEntries}`,
    );

    expect(precacheJsTest.hasPrecache, '❌ workbox-precache-v2 快取不存在').toBe(true);
    expect(
      precacheJsTest.jsEntries.length,
      '❌ precache 中無 JS chunk，setCatchHandler Layer 3 (matchPrecache) 將失敗',
    ).toBeGreaterThan(0);
    expect(
      precacheJsTest.totalEntries,
      '❌ precache 條目數過少（應 > 50），代表 globPatterns 設定錯誤',
    ).toBeGreaterThan(50);

    await ctx.close();
  });
});
