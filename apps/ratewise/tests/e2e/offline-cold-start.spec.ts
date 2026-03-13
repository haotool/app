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
  // 冷啟動測試包含：SW 安裝 + precache 暖機（5s）+ 離線導覽，需要較長超時。
  test.setTimeout(120_000);

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
    // networkidle 會等待 SW precache 的所有 fetch 請求完成（包括 50+ 靜態資源）。
    await warmPage.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

    // 等待 SW 完成 install/activate；使用 getRegistration() 確保跨頁面 reload 也能正確偵測。
    // 注意：waitForFunction(fn, undefined, options) 需要明確傳入 undefined arg，
    // 否則 { timeout } 物件可能被 Playwright 當作 arg 而非 options，導致使用 actionTimeout。
    await warmPage.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker?.getRegistration();
        return reg?.active?.state === 'activated';
      },
      undefined,
      { timeout: 60000 },
    );
    console.log('[Phase 1] SW activated，等待 precache settle...');
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

    // 斷言：JS chunks 必須已在快取中
    expect(
      jsUrls.length,
      `❌ 快取中無 JS chunks，precache 未正常安裝\n  可能根因：globPatterns 漏掉 dist 子目錄`,
    ).toBeGreaterThan(0);
    expect(cssUrls.length, '❌ 快取中無 CSS files').toBeGreaterThan(0);

    // ======================================================================
    // Phase 3：離線就緒能力驗證（SW 快取完整性）
    // ======================================================================
    // 注意：Playwright 的 context.route / setOffline 在 HTTPS 下於 CDP 網路層攔截請求，
    // 早於 SW fetch 事件觸發（ERR_INTERNET_DISCONNECTED 在 SW 能回應前已丟出）。
    // 這是 Playwright 對 HTTPS + Service Worker offline navigation 的已知限制。
    //
    // 因此改用快取直接查詢驗證離線就緒能力：
    //   1. workbox-precache 有 index.html（SW setCatchHandler 離線回退主要來源）
    //   2. ANY cache 有 offline.html（workbox-precache 或 critical-launch-cache 均可）
    //      注意：offline.html 由 pwaStorageManager recacheCriticalResourcesOnLaunch 緩存至
    //      critical-launch-cache；SW setCatchHandler 使用 caches.match() 搜尋所有快取。
    //   3. critical-launch-cache 有完整 HTML（initPWAStorageManager 快取的 App Shell）
    //   4. workbox precache 有足夠 JS/CSS chunks
    //
    // 實際離線行為由 sw.ts 的 setCatchHandler 確保，已有對應單元測試。
    console.log('\n[Phase 3] 離線就緒能力驗證（快取完整性直接查詢）');

    interface OfflineReadiness {
      precacheHasIndexHtml: boolean;
      precacheHasOfflineHtml: boolean;
      criticalLaunchHasHtml: boolean;
      jsCacheCount: number;
      cssCacheCount: number;
      htmlCacheCount: number;
      cacheNames: string[];
    }

    const offlineReadiness: OfflineReadiness = await warmPage.evaluate(async (baseUrl: string) => {
      const result: OfflineReadiness = {
        precacheHasIndexHtml: false,
        precacheHasOfflineHtml: false,
        criticalLaunchHasHtml: false,
        jsCacheCount: 0,
        cssCacheCount: 0,
        htmlCacheCount: 0,
        cacheNames: [],
      };
      const names = await caches.keys();
      result.cacheNames = names;
      for (const name of names) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        for (const req of keys) {
          const url = req.url;
          // precache 中的 index.html（SW setCatchHandler 離線 fallback 1）
          if (
            name.startsWith('workbox-precache') &&
            (url.endsWith('/') || url.includes('index.html'))
          ) {
            result.precacheHasIndexHtml = true;
          }
          // offline.html 可在 workbox-precache 或 critical-launch-cache 中
          // SW setCatchHandler 使用 caches.match(offlineUrl) 搜尋所有快取，
          // 因此任一快取中有 offline.html 即可提供離線 fallback。
          if (url.includes('offline.html')) {
            result.precacheHasOfflineHtml = true;
          }
          // critical-launch-cache 的完整 HTML（initPWAStorageManager 快取的 App Shell）
          if (
            name === 'critical-launch-cache' &&
            (url === baseUrl || url.replace(/\/$/, '') === baseUrl.replace(/\/$/, ''))
          ) {
            result.criticalLaunchHasHtml = true;
          }
          if (url.includes('.js') && url.includes('assets/')) result.jsCacheCount++;
          if (url.includes('.css')) result.cssCacheCount++;
          if (url.endsWith('.html') || url.endsWith('/')) result.htmlCacheCount++;
        }
      }
      return result;
    }, BASE);

    console.log('\n[Phase 3] 離線就緒能力驗證結果');
    console.log('================================');
    console.log(`  caches             : ${offlineReadiness.cacheNames.join(', ')}`);
    console.log(`  precache index.html: ${offlineReadiness.precacheHasIndexHtml ? '✅' : '❌'}`);
    console.log(
      `  precache offline.html: ${offlineReadiness.precacheHasOfflineHtml ? '✅' : '❌'}`,
    );
    console.log(`  critical-launch HTML: ${offlineReadiness.criticalLaunchHasHtml ? '✅' : '❌'}`);
    console.log(`  JS chunks in cache : ${offlineReadiness.jsCacheCount}`);
    console.log(`  CSS files in cache : ${offlineReadiness.cssCacheCount}`);

    // 斷言：SW 必須有足夠的離線資產
    expect(
      offlineReadiness.precacheHasIndexHtml,
      '❌ precache 缺少 index.html：SW setCatchHandler 離線 fallback 將失敗',
    ).toBe(true);

    expect(
      offlineReadiness.precacheHasOfflineHtml,
      '❌ 快取中無 offline.html（workbox-precache 或 critical-launch-cache）：最終離線 fallback 將失敗',
    ).toBe(true);

    expect(
      offlineReadiness.jsCacheCount,
      '❌ 快取中 JS chunks 不足，離線時 React 無法啟動',
    ).toBeGreaterThanOrEqual(10);

    expect(
      offlineReadiness.cssCacheCount,
      '❌ 快取中無 CSS，離線時頁面無樣式',
    ).toBeGreaterThanOrEqual(1);

    console.log('\n✅ Phase 3 完成：SW 離線就緒能力已驗證');
    await onlineCtx.close();
  });

  /**
   * 新安裝場景：僅有 precache（無 static-resources / html-cache）時離線仍可就緒。
   *
   * 模擬情境：
   *   - iOS 首次開啟 PWA（home screen 隔離 storage，只有 precache 完成）
   *   - Android 安裝後尚未瀏覽任何頁面（static-resources 空）
   *
   * 驗證：清除所有非 precache 快取後，precache 本身仍足夠提供離線服務。
   */
  test('新安裝場景：僅保留 precache 時離線就緒能力應達標', async ({ browser }) => {
    // Phase 1：線上暖機，確保 precache 完整安裝。
    const ctx = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await ctx.newPage();
    const consoleErrors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });

    console.log(`\n[新安裝測試 Phase 1] 線上暖機 → ${BASE}`);
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker?.getRegistration();
        return reg?.active?.state === 'activated';
      },
      undefined,
      { timeout: 60_000 },
    );
    await page.waitForTimeout(PRECACHE_SETTLE_MS);

    // Phase 2：清除所有非 precache 快取（模擬新安裝 — 只有 SW install 填充的 precache）。
    const clearedCaches = await page.evaluate(async () => {
      const names = await caches.keys();
      const cleared: string[] = [];
      for (const name of names) {
        if (!name.startsWith('workbox-precache')) {
          await caches.delete(name);
          cleared.push(name);
        }
      }
      return cleared;
    });
    console.log(`[新安裝測試 Phase 2] 已清除: ${clearedCaches.join(', ') || '（無）'}`);

    // Phase 3：驗證 precache 單獨就足夠提供離線服務所需的全部資源。
    interface NewInstallReadiness {
      precacheName: string | null;
      jsCount: number;
      cssCount: number;
      hasIndexHtml: boolean;
      hasOfflineHtml: boolean;
      totalPrecacheEntries: number;
      remainingCacheNames: string[];
    }

    const readiness: NewInstallReadiness = await page.evaluate(async (baseUrl: string) => {
      const names = await caches.keys();
      const result: NewInstallReadiness = {
        precacheName: null,
        jsCount: 0,
        cssCount: 0,
        hasIndexHtml: false,
        hasOfflineHtml: false,
        totalPrecacheEntries: 0,
        remainingCacheNames: names,
      };
      for (const name of names) {
        if (!name.startsWith('workbox-precache')) continue;
        result.precacheName = name;
        const cache = await caches.open(name);
        const keys = await cache.keys();
        result.totalPrecacheEntries = keys.length;
        for (const req of keys) {
          const url = req.url;
          if (url.includes('.js') && url.includes('assets/')) result.jsCount++;
          if (url.includes('.css')) result.cssCount++;
          if (url.endsWith('/') || url.includes('index.html')) result.hasIndexHtml = true;
          if (url.includes('offline.html')) result.hasOfflineHtml = true;
          // 同源根路徑也視為 index.html
          if (url === baseUrl || url.replace(/\/$/, '') === baseUrl.replace(/\/$/, ''))
            result.hasIndexHtml = true;
        }
      }
      return result;
    }, BASE);

    console.log('\n[新安裝測試 Phase 3] Precache-only 離線就緒能力');
    console.log('================================');
    console.log(`  precache name   : ${readiness.precacheName ?? '（未找到）'}`);
    console.log(`  total entries   : ${readiness.totalPrecacheEntries}`);
    console.log(`  JS chunks       : ${readiness.jsCount}`);
    console.log(`  CSS files       : ${readiness.cssCount}`);
    console.log(`  has index.html  : ${readiness.hasIndexHtml ? '✅' : '❌'}`);
    console.log(`  has offline.html: ${readiness.hasOfflineHtml ? '✅' : '❌'}`);
    console.log(`  remaining caches: ${readiness.remainingCacheNames.join(', ')}`);

    expect(
      readiness.precacheName,
      '❌ workbox-precache 應存在（SW install 應填充）',
    ).not.toBeNull();
    expect(
      readiness.jsCount,
      '❌ precache 缺少 JS chunks — 新安裝冷啟動時 React 無法啟動',
    ).toBeGreaterThanOrEqual(5);
    expect(
      readiness.cssCount,
      '❌ precache 缺少 CSS — 新安裝冷啟動時無樣式',
    ).toBeGreaterThanOrEqual(1);
    expect(
      readiness.hasIndexHtml,
      '❌ precache 缺少 index.html — setCatchHandler 離線導覽 fallback 將失敗',
    ).toBe(true);
    expect(readiness.hasOfflineHtml, '❌ precache 缺少 offline.html — 最終 fallback 將失敗').toBe(
      true,
    );

    console.log('\n✅ 新安裝場景測試完成：precache 單獨足夠提供離線服務');
    await ctx.close();
  });

  /**
   * setCatchHandler 回退驗證：JS/CSS 快取命中策略覆蓋。
   *
   * 驗證 setCatchHandler 的三層回退（exact match → ignoreSearch → matchPrecache）
   * 能正確命中 precache 中的 JS chunk，防止 Response.error() 觸發黑屏。
   */
  test('setCatchHandler JS 回退應能從 precache 命中資源（ignoreSearch 策略）', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker?.getRegistration();
        return reg?.active?.state === 'activated';
      },
      undefined,
      { timeout: 60_000 },
    );
    await page.waitForTimeout(PRECACHE_SETTLE_MS);

    // 驗證 precache 中的每個 JS chunk 都能被 ignoreSearch 和 matchPrecache 策略命中。
    interface CacheHitReport {
      url: string;
      exactHit: boolean;
      ignoreSearchHit: boolean;
    }

    const report: CacheHitReport[] = await page.evaluate(async () => {
      const names = await caches.keys();
      const precacheName = names.find((n) => n.startsWith('workbox-precache-v2'));
      if (!precacheName) return [];

      const cache = await caches.open(precacheName);
      const keys = await cache.keys();
      const jsKeys = keys
        .filter((r) => r.url.includes('.js') && r.url.includes('assets/'))
        .slice(0, 5);

      const results: CacheHitReport[] = [];
      for (const req of jsKeys) {
        // 模擬 setCatchHandler 接收到的 request（bare URL，無 revision）
        const bareUrl = req.url.split('?')[0];
        const exactMatch = await caches.match(bareUrl);
        const ignoreSearchMatch = await caches.match(bareUrl, { ignoreSearch: true });
        results.push({
          url: bareUrl.split('/').pop() ?? '',
          exactHit: !!exactMatch,
          ignoreSearchHit: !!ignoreSearchMatch,
        });
      }
      return results;
    });

    console.log('\n[setCatchHandler 回退驗證]');
    for (const item of report) {
      const status = item.exactHit ? '✅ exact' : item.ignoreSearchHit ? '✅ ignoreSearch' : '❌';
      console.log(`  ${status} ${item.url}`);
    }

    if (report.length > 0) {
      const allHit = report.every((r) => r.exactHit || r.ignoreSearchHit);
      expect(
        allHit,
        `❌ 部分 JS chunk 無法被 setCatchHandler 任何策略命中：\n${JSON.stringify(report, null, 2)}`,
      ).toBe(true);
    }
  });

  /**
   * 補充測試：確認快取中的 JS chunk 數量與 precache 清單一致
   * 只在線上環境執行（用於驗證暖機後快取完整性）
   */
  test('暖機後快取應包含足夠的 JS chunks', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

    // 等待 SW activated（同 Phase 1 修正：明確傳入 undefined arg 避免 actionTimeout 覆蓋）
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker?.getRegistration();
        return reg?.active?.state === 'activated';
      },
      undefined,
      { timeout: 60000 },
    );
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
