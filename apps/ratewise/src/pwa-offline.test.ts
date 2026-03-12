/**
 * PWA 離線功能測試
 * 驗證 Service Worker 預快取配置與離線 fallback
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
      expect(content).toContain('<title>離線模式 - RateWise</title>');
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

    it('should use prompt registerType to avoid autoUpdate version tearing', () => {
      expect(viteConfig).toContain("registerType: 'prompt'");
    });

    it('should have additionalManifestEntries for offline.html', () => {
      expect(viteConfig).toContain('additionalManifestEntries');
      expect(viteConfig).toContain('offline.html');
    });

    it('should have skipWaiting and clientsClaim for immediate activation', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('skipWaiting()');
      expect(swContent).toContain('clientsClaim()');
      expect(swContent).toContain("data?.type === 'SKIP_WAITING'");
    });

    it('should have setCatchHandler for offline navigation fallback', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('setCatchHandler');
      expect(swContent).toContain("destination === 'document'");
    });

    it('should try cache before offline.html fallback', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('caches.match(req.url)');
      expect(swContent).toContain("matchPrecache('index.html')");
    });

    it('should have offline-first strategy in setCatchHandler', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      // 確保離線回退策略邏輯存在
      expect(swContent).toContain('離線回退');
      // 確保 matchPrecache 使用相對路徑（與 manifest 一致）
      expect(swContent).toContain("matchPrecache('index.html')");
      expect(swContent).toContain("matchPrecache('offline.html')");
      expect(swContent).toContain('requestOrigin !== swOrigin');
    });

    it('should have cross-origin protection in setCatchHandler', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('安全驗證');
      expect(swContent).toContain('僅處理同源請求');
    });

    it('should not write launch-recache assets into workbox precache', () => {
      const storageManager = readFileSync(
        resolve(ROOT_PATH, 'src/utils/pwaStorageManager.ts'),
        'utf-8',
      );
      expect(storageManager).toContain("caches.open('critical-launch-cache')");
      expect(storageManager).not.toContain("name.startsWith('workbox-precache')");
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

    it('should avoid brace-expansion-dependent glob syntax in injectManifest patterns', () => {
      const viteConfig = readFileSync(resolve(ROOT_PATH, 'vite.config.ts'), 'utf-8');
      expect(viteConfig).toContain("'assets/**/*.js'");
      expect(viteConfig).toContain("'assets/**/*.css'");
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

  describe('冷啟動保護（Cold-Start Safety）', () => {
    it('should call skipWaiting in install event handler for immediate post-recovery activation', () => {
      // 根因：recovery bootstrap 解除 SW 後，新 SW 停留 waiting 狀態，
      // 離線冷啟動時無 SW 攔截導致黑屏。
      // 修復：install event 立即呼叫 skipWaiting()，確保 SW 迅速進入 active。
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toMatch(/addEventListener\(['"]install['"]/);
      const installCallsSkipWaiting =
        /addEventListener\(['"]install['"][\s\S]{0,300}skipWaiting/s.test(swContent);
      expect(
        installCallsSkipWaiting,
        'install event handler 必須呼叫 skipWaiting() 以確保 SW 立即啟用',
      ).toBe(true);
    });

    it('should NOT self-destruct (unregister) on bad-precaching-response', () => {
      // 根因：precache 失敗（CDN stale 404）時呼叫 registration.unregister()，
      // SW 自毀後無任何離線保護，下次冷啟動離線 = 黑屏。
      // 修復：移除 unregister() 呼叫，讓 precache 失敗靜默處理，下次載入重試。
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      const badPrecacheIdx = swContent.indexOf('bad-precaching-response');
      if (badPrecacheIdx !== -1) {
        // 擷取 bad-precaching-response 周圍的處理邏輯（前後 600 字元）
        const surrounding = swContent.slice(
          Math.max(0, badPrecacheIdx - 100),
          badPrecacheIdx + 600,
        );
        expect(
          surrounding,
          'bad-precaching-response handler 不得呼叫 registration.unregister()',
        ).not.toContain('.unregister()');
      }
    });

    it('should have networkTimeoutSeconds >= 3 to prevent premature offline fallback on mobile', () => {
      // 根因：0.5s timeout 在行動網路（RTT 200-500ms）下頻繁誤觸離線回退，
      // 導致快取 HTML 被提供但 JS chunk 404（版本不符）。
      // 修復：提高至 >= 3s，符合 Workbox 官方建議。
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      const match = /networkTimeoutSeconds:\s*([\d.]+)/.exec(swContent);
      expect(match, 'networkTimeoutSeconds 應在 sw.ts 中定義').not.toBeNull();
      const timeout = parseFloat(match![1] ?? '0');
      expect(
        timeout,
        `networkTimeoutSeconds 應 >= 3，目前為 ${timeout}（行動網路 RTT 約 200-500ms）`,
      ).toBeGreaterThanOrEqual(3);
    });
  });
});
