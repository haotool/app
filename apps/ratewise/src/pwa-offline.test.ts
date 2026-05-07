/**
 * PWA 離線功能測試
 * 驗證 Service Worker 預快取配置與離線 fallback
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { APP_INFO } from './config/app-info';

const ROOT_PATH = resolve(__dirname, '..');

describe('PWA 離線功能測試', () => {
  describe('offline.html 配置', () => {
    it('should have offline.html in public directory', () => {
      const offlinePath = resolve(ROOT_PATH, 'public/offline.html');
      expect(existsSync(offlinePath)).toBe(true);
    });

    it('should have proper HTML structure', () => {
      const offlinePath = resolve(ROOT_PATH, 'public/offline.html');
      const content = readFileSync(offlinePath, 'utf-8');

      // 應該有正確的 HTML 結構
      expect(content).toContain('<!doctype html>');
      expect(content).toContain('lang="zh-TW"');
      expect(content).toContain(`<title>離線模式 - ${APP_INFO.shortName}</title>`);
    });

    it('should have retry functionality', () => {
      const offlinePath = resolve(ROOT_PATH, 'public/offline.html');
      const content = readFileSync(offlinePath, 'utf-8');

      // 應該有重試功能
      expect(content).toContain('window.location.reload()');
      expect(content).toContain("window.addEventListener('online'");
    });

    it('should show cached data indicator', () => {
      const offlinePath = resolve(ROOT_PATH, 'public/offline.html');
      const content = readFileSync(offlinePath, 'utf-8');

      // 應該顯示快取資料指示器
      expect(content).toContain('cached-info');
      expect(content).toContain("localStorage.getItem('exchangeRates')");
    });
  });

  describe('vite.config.ts PWA 配置', () => {
    let viteConfig: string;

    beforeAll(() => {
      viteConfig = readFileSync(resolve(ROOT_PATH, 'vite.config.ts'), 'utf-8');
    });

    it('should use injectManifest strategy', () => {
      expect(viteConfig).toContain("strategies: 'injectManifest'");
    });

    it('should keep manifest:false to prevent plugin from overwriting SSOT manifest', () => {
      expect(viteConfig).toContain('manifest: false');
    });

    // 因 vite.config.ts 設 manifest:false，vite-plugin-pwa 不會注入 <link rel="manifest">。
    // index.html 必須手動保留該連結，否則瀏覽器無法發現 manifest、PWA 安裝能力失效。
    // href 必須使用 __BASE_PATH__ 佔位符（由 vite.config.ts 在 build 時依 base 替換），
    // 避免寫死 /ratewise/ 在 base=/ 部署（CI E2E/Lighthouse）下 404 造成 PWA 失效。
    it('should contain <link rel="manifest"> with __BASE_PATH__ placeholder in index.html', () => {
      const html = readFileSync(resolve(ROOT_PATH, 'index.html'), 'utf-8');
      expect(html).toMatch(
        /<link\s+rel="manifest"\s+href="__BASE_PATH__manifest\.webmanifest"\s*\/?>/,
      );
    });

    // inject-version-meta plugin 必須實際把 __BASE_PATH__ 替換為 base 值，
    // 否則 build 產出的 HTML 會殘留佔位符導致資源 404。
    it('should replace __BASE_PATH__ with base config in transformIndexHtml', () => {
      expect(viteConfig).toMatch(/\.replace\(\s*\/__BASE_PATH__\/g\s*,\s*base\s*\)/);
    });

    // 防回歸：index.html 禁止硬編 /ratewise/ 絕對路徑於 <link>/preload；
    // 必須透過 __BASE_PATH__ 佔位符以尊重 VITE_RATEWISE_BASE_PATH SSOT。
    it('should not hardcode /ratewise/ prefix in index.html asset links', () => {
      const html = readFileSync(resolve(ROOT_PATH, 'index.html'), 'utf-8');
      expect(html).not.toMatch(/(?:href|src)="\/ratewise\//);
    });

    it('should use prompt registerType to avoid autoUpdate version tearing', () => {
      expect(viteConfig).toContain("registerType: 'prompt'");
    });

    it('should have additionalManifestEntries for offline.html', () => {
      expect(viteConfig).toContain('additionalManifestEntries');
      expect(viteConfig).toContain('offline.html');
    });

    it('should only activate a waiting worker after SKIP_WAITING message', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('skipWaiting()');
      expect(swContent).toContain('clientsClaim()');
      expect(swContent).toContain("data?.type === 'SKIP_WAITING'");
    });

    it('should have setCatchHandler for offline navigation fallback', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('setCatchHandler');
      expect(swContent).toContain("destination !== 'document'");
    });

    it('should use NavigationRoute + bounded SWR-style handler for zero-white-screen navigation', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      // 取代 NetworkFirst：installed PWA 已暖機後 cache hit 立即返回，背景 revalidate 抓最新 HTML。
      expect(swContent).toContain('handleNavigationRequest');
      expect(swContent).toContain('new NavigationRoute(handleNavigationRequest)');
      expect(swContent).toContain("const HTML_CACHE_NAME = 'html-cache'");
      expect(swContent).toContain('event.waitUntil(');
      expect(swContent).toContain('fetchAndCacheNavigation(request, cache)');
      expect(swContent).toContain(
        'event.waitUntil(networkResponse.then(() => undefined).catch(() => undefined))',
      );
      // 防回歸：禁止把 NetworkFirst 重新引入 navigation 路徑（cold-start 白屏根因之一）。
      expect(swContent).not.toContain('new NetworkFirst(');
    });

    it('should clear old navigation HTML cache on activate and keep a bounded cache-miss fallback', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('clearNavigationHtmlCacheOnActivate');
      expect(swContent).toContain('caches.delete(HTML_CACHE_NAME)');
      expect(swContent).toContain('const NAVIGATION_NETWORK_TIMEOUT_MS = 3000');
      expect(swContent).toContain('Promise.race([networkResponse, timeoutFallback])');
      expect(swContent).toContain('resolveNavigationFallback');
    });

    it('should have offline-first strategy in setCatchHandler', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      const fallbackContent = readFileSync(
        resolve(ROOT_PATH, 'src/utils/pwaOfflineFallback.ts'),
        'utf-8',
      );
      // 確保離線回退策略邏輯存在
      expect(swContent).toContain('離線回退');
      // document 請求回退到 precache index.html，確保冷啟動離線可用。
      expect(swContent).toContain('resolveOfflineDocumentFallback');
      expect(fallbackContent).toContain("matchPrecache('index.html')");
      // NavigationRoute 的 handlerDidError 也必須能直接命中任意快取中的 offline.html，
      // 避免 Workbox 視為已處理後不再進入全域 setCatchHandler。
      expect(swContent).toContain("caches.match('offline.html')");
    });

    it('should provide an emergency inline HTML fallback when both index and offline caches are unavailable', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      const fallbackContent = readFileSync(
        resolve(ROOT_PATH, 'src/utils/pwaOfflineFallback.ts'),
        'utf-8',
      );
      expect(fallbackContent).toContain('EMERGENCY_OFFLINE_HTML');
      expect(fallbackContent).toContain('createEmergencyOfflineResponse');
      expect(fallbackContent).toContain('data-ratewise-emergency-fallback="true"');
      expect(fallbackContent).toContain("'X-RateWise-Offline-Fallback'");
      expect(swContent).toContain('emergency-document-fallback');
      expect(swContent).toContain('emergency-navigation-fallback');
    });

    it('should not write launch-recache assets into workbox precache', () => {
      const storageManager = readFileSync(
        resolve(ROOT_PATH, 'src/utils/pwaStorageManager.ts'),
        'utf-8',
      );
      expect(storageManager).toContain("caches.open('critical-launch-cache')");
      expect(storageManager).not.toContain("name.startsWith('workbox-precache')");
    });

    it('should expose an early cold-start recovery path outside load+idle scheduling', () => {
      const storageManager = readFileSync(
        resolve(ROOT_PATH, 'src/utils/pwaStorageManager.ts'),
        'utf-8',
      );
      const mainContent = readFileSync(resolve(ROOT_PATH, 'src/main.tsx'), 'utf-8');
      const diagnosticsContent = readFileSync(
        resolve(ROOT_PATH, 'src/utils/pwaDiagnostics.ts'),
        'utf-8',
      );
      const indexHtml = readFileSync(resolve(ROOT_PATH, 'index.html'), 'utf-8');

      expect(storageManager).toContain('primePwaColdStartRecovery');
      expect(mainContent).toContain('shouldPrimePwaColdStartImmediately');
      expect(mainContent).toContain('const shouldPrimeColdStartRecovery');
      expect(mainContent).toContain('const coldStartPrimePromise');
      expect(mainContent).toContain('COLD_START_PRIME_WAIT_TIMEOUT_MS');
      expect(mainContent).toContain('resolveColdStartPrimeResult');
      expect(mainContent).toContain('window.clearTimeout(timeoutId)');
      expect(mainContent).toContain('cold-start-prime-wait-timeout');
      expect(mainContent).toContain('skipDelayedCriticalRecache');
      expect(mainContent).toContain('skipDelayedPrecacheRepairPing');
      expect(mainContent).toContain("? primePwaColdStartRecovery(import.meta.env.BASE_URL || '/')");
      expect(mainContent).toContain('skipCriticalRecache: skipDelayedCriticalRecache');
      expect(mainContent).toContain('skipPrecacheRepairPing: skipDelayedPrecacheRepairPing');
      expect(mainContent).not.toContain('markPwaAppReady()');
      expect(diagnosticsContent).toContain('markPwaAppReady');
      expect(diagnosticsContent).toContain('try {');
      expect(indexHtml).toContain('ratewise:pwa-app-ready');
      expect(indexHtml).toContain('data-ratewise-app-ready');
    });

    it('should gate cold-start recovery on explicit app-ready signal instead of any root mutation', () => {
      const html = readFileSync(resolve(ROOT_PATH, 'index.html'), 'utf-8');
      const fallbackComponent = readFileSync(
        resolve(ROOT_PATH, 'src/components/OfflineAwareError.tsx'),
        'utf-8',
      );

      expect(html).toContain("document.documentElement.getAttribute(APP_READY_ATTR) === 'true'");
      expect(html).toContain('WATCHDOG_READY_SELECTOR');
      expect(html).toContain('hasReactFallbackReady');
      expect(html).toContain('react-fallback-ready');
      expect(html).toContain('cold-start-watchdog-cleared');
      expect(html).toContain('removeColdStartOverlay');
      expect(html).toContain('removeColdStartOverlay();');
      expect(html).not.toContain('root.children.length === 0');
      expect(fallbackComponent).toContain('data-ratewise-watchdog-ready="true"');
    });

    it('should preserve SSG-rendered #root content when watchdog falls back to error UI', () => {
      const html = readFileSync(resolve(ROOT_PATH, 'index.html'), 'utf-8');

      // SSG 內容偵測函式必須存在，watchdog 才能判斷是否走 banner 模式。
      expect(html).toContain('hasPrerenderedRootContent');
      expect(html).toContain('data-server-rendered');
      expect(html).not.toContain('root.children.length > 0');

      // 雙模式分支：banner（保留 SSG）vs fullscreen（沿用原行為）。
      expect(html).toContain('data-cold-start-overlay');
      expect(html).toContain("'banner'");
      expect(html).toContain("'fullscreen'");

      // 已渲染狀態下：watchdog 必須附加 wrap 到 body，禁止清除 #root。
      expect(html).toContain('document.body.appendChild(wrap)');

      // 無 SSG 時保留原本 fallback 行為。
      expect(html).toContain("root.innerHTML = ''");

      // 診斷事件需帶 hasPrerendered 標記，供後續觀察性追蹤。
      expect(html).toContain('hasPrerendered: hasPrerendered');
      expect(html).toContain('removeColdStartOverlay();');
    });

    it('should render cold-start diagnostics without emoji and with design token colors', () => {
      const html = readFileSync(resolve(ROOT_PATH, 'index.html'), 'utf-8');

      expect(html).toContain('Service Worker\\uff1a\\u672a\\u8a3b\\u518a');
      expect(html).toContain('\\u72c0\\u614b\\uff1aService Worker \\u672a\\u8a3b\\u518a');
      expect(html).toContain('rgb(var(--color-primary,124 58 237))');
      expect(html).toContain('rgb(var(--color-surface,255 255 255))');
      expect(html).toContain('rgb(var(--color-border,226 232 240))');
      expect(html).toContain("summary.textContent = '\\u8a3a\\u65b7\\u8a73\\u60c5'");
      expect(html).not.toContain('\\u23f0');
      expect(html).not.toContain('\\ud83c');
      expect(html).not.toContain('\\ud83d');
      expect(html).not.toContain('\\ud83e');
      expect(html).not.toContain('\\u26a0');
    });

    it('should reload on controllerchange after activating a waiting worker', () => {
      const swUtils = readFileSync(resolve(ROOT_PATH, 'src/utils/swUtils.ts'), 'utf-8');
      expect(swUtils).toContain('controllerchange');
      expect(swUtils).toContain('window.location.reload()');
    });

    it('should auto-apply a ready update when online', () => {
      const updatePrompt = readFileSync(
        resolve(ROOT_PATH, 'src/components/UpdatePrompt.tsx'),
        'utf-8',
      );
      expect(updatePrompt).toContain('needRefresh');
      expect(updatePrompt).toContain('navigator.onLine');
      expect(updatePrompt).toContain('updateServiceWorker(true)');
    });

    it('should scope navigation handling through NavigationRoute instead of manual origin checks', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('NavigationRoute');
    });
  });

  describe('PWA 建置防回歸', () => {
    it('should avoid brace-expansion-dependent glob syntax in injectManifest patterns', () => {
      const viteConfig = readFileSync(resolve(ROOT_PATH, 'vite.config.ts'), 'utf-8');
      expect(viteConfig).toContain("'**/*.js'");
      expect(viteConfig).toContain("'**/*.css'");
      expect(viteConfig).toContain("'**/*.html'");
      expect(viteConfig).not.toContain('**/*.{js,css,html');
    });

    it('should verify index.html and shell assets exist in the generated precache manifest', () => {
      const verifyScript = readFileSync(
        resolve(ROOT_PATH, '../../scripts/verify-precache-assets.mjs'),
        'utf-8',
      );

      expect(verifyScript).toContain('precache 缺少 index.html');
      expect(verifyScript).toContain('首頁 shell 資產');
      expect(verifyScript).toContain('MIN_PRECACHE_ENTRY_COUNT');
    });
  });

  describe('CSP 配置', () => {
    let viteConfig: string;

    beforeAll(() => {
      viteConfig = readFileSync(resolve(ROOT_PATH, 'vite.config.ts'), 'utf-8');
    });

    it('should not manage CSP allowlists inside vite config when Cloudflare is the SSOT', () => {
      expect(viteConfig).not.toContain('vite-plugin-csp-guard');
      expect(viteConfig).not.toContain('static.cloudflareinsights.com');
    });
  });

  describe('Cloudflare Worker 配置', () => {
    const workerPath = resolve(ROOT_PATH, '../../security-headers/src/worker.js');
    const workerExists = existsSync(workerPath);

    it.skipIf(!workerExists)('should not have deprecated Permissions-Policy features', () => {
      const workerContent = readFileSync(workerPath, 'utf-8');

      // 提取 Permissions-Policy 值
      const policyRegex = /['"]Permissions-Policy['"]:\s*\n?\s*['"]([^'"]+)['"]/;
      const match = policyRegex.exec(workerContent);

      if (match) {
        const policyValue = match[1];
        // 不應該包含已棄用的功能
        expect(policyValue).not.toContain('ambient-light-sensor');
        expect(policyValue).not.toContain('document-domain');
        expect(policyValue).not.toContain('vr');
      }
    });
  });

  describe('offline.html revision 策略', () => {
    it('should have revision based on content hash', () => {
      const viteConfig = readFileSync(resolve(ROOT_PATH, 'vite.config.ts'), 'utf-8');

      // 檢查是否有 additionalManifestEntries 配置
      expect(viteConfig).toContain('additionalManifestEntries');

      // 應該使用動態 revision (getFileRevision 函數)
      expect(viteConfig).toContain('getFileRevision');
      expect(viteConfig).toContain("getFileRevision('public/offline.html')");
    });

    it('should have getFileRevision function for dynamic revision', () => {
      const viteConfig = readFileSync(resolve(ROOT_PATH, 'vite.config.ts'), 'utf-8');

      // 應該有 getFileRevision 函數定義
      expect(viteConfig).toContain('function getFileRevision');
      expect(viteConfig).toContain('createHash');
    });
  });
});
