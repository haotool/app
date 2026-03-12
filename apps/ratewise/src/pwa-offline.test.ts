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
});
