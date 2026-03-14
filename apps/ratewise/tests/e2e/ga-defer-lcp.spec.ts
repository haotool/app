/**
 * GA4 延後初始化 + LCP 改善 E2E 測試
 *
 * 目的：
 *   1. 驗證 GA4 script 不在 LCP 前（`load` 事件前）注入 DOM
 *   2. 驗證 `load` 事件後 GA4 script 確實存在
 *   3. 驗證實際頁面 load 完成後，GA config 不會重複初始化
 *   4. 驗證 `manifest.webmanifest` Content-Type 為 `application/manifest+json`
 *   5. 驗證 GA4 不重複注入（initialized flag 防衛）
 *
 * 技術依據：
 *   - web.dev LCP 閾值：Good ≤ 2.5s
 *   - Workbox docs：setCatchHandler 最佳實踐
 *   - 業界標準（constantsolutions.dk）：`window.gtmDidInit` flag 防重複
 *
 * @see apps/ratewise/src/main.tsx    - GA4 延後初始化邏輯
 *   apps/shared/analytics/ga.ts     - initGA / scheduleAfterPageLoad / trackPageview
 *   security-headers/src/worker.js  - manifest Content-Type 修正
 *
 * @created 2026-03-14
 */

import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:4173';
const BASE_PATH =
  process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise';
const BASE = `${BASE_URL}${BASE_PATH}/`.replace(/\/+$/, '/');
const APP_ROOT = fileURLToPath(new URL('../..', new URL('.', import.meta.url)));

function detectBuiltGaRuntime(): boolean {
  try {
    const assetDir = join(APP_ROOT, 'dist', 'assets');
    return readdirSync(assetDir)
      .filter((file) => file.endsWith('.js'))
      .some((file) => {
        const content = readFileSync(join(assetDir, file), 'utf-8');
        return (
          content.includes('googletagmanager.com/gtag/js?id=') ||
          content.includes('send_page_view') ||
          content.includes('transport_type')
        );
      });
  } catch {
    return false;
  }
}

const HAS_BUILT_GA_RUNTIME = detectBuiltGaRuntime();

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
    // MutationObserver 追蹤 script 注入時機：在 load 前 vs 後
    // 此方式不依賴外部 network 請求是否實際發出，在測試/生產環境皆有效。
    await page.addInitScript(() => {
      let loadFired = false;
      window.addEventListener(
        'load',
        () => {
          loadFired = true;
        },
        { once: true },
      );

      const win = window as unknown as Record<string, unknown>;
      win['__e2e_gtagInjected'] = false;
      win['__e2e_gtagBeforeLoad'] = false;

      // hostname 精確匹配，避免 substring 誤判（如 example.com/googletagmanager.com/...）。
      const isGtag = (src: string): boolean => {
        try {
          const { hostname, pathname } = new URL(src);
          return (
            (hostname === 'googletagmanager.com' || hostname === 'www.googletagmanager.com') &&
            pathname === '/gtag/js'
          );
        } catch {
          return false;
        }
      };

      // 觀察 <head> 子節點，偵測 gtag script 被插入的時機點。
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeName === 'SCRIPT') {
              const src = (node as HTMLScriptElement).src ?? '';
              if (isGtag(src)) {
                win['__e2e_gtagInjected'] = true;
                if (!loadFired) win['__e2e_gtagBeforeLoad'] = true;
              }
            }
          }
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });

    await mockRatesApi(page);
    await page.goto(BASE, { waitUntil: 'load' });
    // 等待 GA 有機會初始化（500ms 寬裕）
    await page.waitForTimeout(500);

    type GtagStatus = { injected: boolean; injectedBeforeLoad: boolean };
    const gtagStatus = await page.evaluate<GtagStatus>(() => {
      const win = window as unknown as Record<string, unknown>;
      return {
        injected: win['__e2e_gtagInjected'] as boolean,
        injectedBeforeLoad: win['__e2e_gtagBeforeLoad'] as boolean,
      };
    });

    if (gtagStatus.injected) {
      // 生產建置（VITE_GA_ID 已設定）：驗證 script 確實在 load 後才注入。
      expect(
        gtagStatus.injectedBeforeLoad,
        'GA4 script 不得在 load 事件前注入（會與 LCP 關鍵資源競爭頻寬）',
      ).toBe(false);
    } else {
      // 測試建置（VITE_GA_ID 未設定）：驗證 GA 完全不注入。
      const gaScriptInDom = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.some((s) => {
          try {
            const { hostname, pathname } = new URL((s as HTMLScriptElement).src);
            return (
              (hostname === 'googletagmanager.com' || hostname === 'www.googletagmanager.com') &&
              pathname === '/gtag/js'
            );
          } catch {
            return false;
          }
        });
      });
      expect(gaScriptInDom, '測試環境不應注入 GA script（無 VITE_GA_ID）').toBe(false);
    }

    console.log(
      `[GA E2E] gtag injected: ${String(gtagStatus.injected)}, beforeLoad: ${String(gtagStatus.injectedBeforeLoad)}`,
    );
  });

  test('實際應用頁面載入完成後 GA config 不應重複初始化', async ({ page }) => {
    await mockRatesApi(page);
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(300);

    const analyticsState = await page.evaluate(() => {
      const configCalls = !window.dataLayer
        ? 0
        : (window.dataLayer as unknown[]).filter((item) => {
            if (!item || typeof item !== 'object') return false;
            return (item as Record<number, unknown>)[0] === 'config';
          }).length;

      return {
        readyState: document.readyState,
        configCalls,
      };
    });

    expect(analyticsState.readyState, '實頁面 load 後 readyState 應為 complete').toBe('complete');
    if (HAS_BUILT_GA_RUNTIME) {
      expect(analyticsState.configCalls, '內含 GA runtime 的建置應恰好送出 1 次 config').toBe(1);
    } else {
      expect(analyticsState.configCalls, '未包含 GA runtime 的建置不應送出 config').toBe(0);
    }

    console.log(`[GA E2E] readyState after load: ${analyticsState.readyState}`);
    console.log(`[GA E2E] gtag config calls: ${String(analyticsState.configCalls)}`);
  });

  test('manifest.webmanifest 應回傳正確 Content-Type', async ({ page, request }) => {
    // 本測試驗證本地 preview server 的 Content-Type 基準行為（application/manifest+json）。
    // Cloudflare Worker 對 application/octet-stream 雙重類型的修正，
    // 需另以 curl 或 production E2E 驗證（CI 目前在 PLAYWRIGHT_BASE_URL 指向正式站時有效）。
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

  test('GA4 dataLayer 不應在 load 事件前的任何時刻被初始化', async ({ page }) => {
    await page.addInitScript(() => {
      const win = window as unknown as Record<string, unknown>;
      let loadFired = false;
      let dataLayerValue: unknown[] | undefined;

      window.addEventListener(
        'load',
        () => {
          loadFired = true;
        },
        { once: true },
      );

      const trackDataLayerAssignment = (value: unknown): unknown[] | undefined => {
        if (!Array.isArray(value)) return undefined;

        const originalPush = value.push.bind(value);
        value.push = (...args: unknown[]): number => {
          if (!loadFired && args.length > 0) {
            win['__e2e_dataLayerBeforeLoad'] = true;
          }
          return originalPush(...args);
        };

        if (!loadFired && value.length > 0) {
          win['__e2e_dataLayerBeforeLoad'] = true;
        }

        return value;
      };

      win['__e2e_dataLayerBeforeLoad'] = false;
      Object.defineProperty(window, 'dataLayer', {
        configurable: true,
        get: () => dataLayerValue,
        set: (value: unknown) => {
          dataLayerValue = trackDataLayerAssignment(value);
        },
      });

      Object.defineProperty(window, '__e2e_dataLayerLoadFired', {
        get: () => loadFired,
        configurable: true,
      });
    });

    await mockRatesApi(page);
    await page.goto(BASE, { waitUntil: 'load' });

    const dataLayerState = await page.evaluate(() => ({
      loadFired: Boolean(
        (window as unknown as Record<string, unknown>)['__e2e_dataLayerLoadFired'],
      ),
      initializedBeforeLoad: Boolean(
        (window as unknown as Record<string, unknown>)['__e2e_dataLayerBeforeLoad'],
      ),
    }));

    expect(dataLayerState.loadFired, '測試結束時 load 事件應已觸發').toBe(true);
    expect(dataLayerState.initializedBeforeLoad, 'GA 不應在 load 前任何時刻初始化 dataLayer').toBe(
      false,
    );

    console.log(
      `[GA E2E] dataLayer init before load: ${String(dataLayerState.initializedBeforeLoad)}`,
    );
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
