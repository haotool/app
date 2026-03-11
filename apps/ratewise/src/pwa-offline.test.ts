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

    it('should have additionalManifestEntries for offline.html', () => {
      expect(viteConfig).toContain('additionalManifestEntries');
      expect(viteConfig).toContain('offline.html');
    });

    it('should have skipWaiting and clientsClaim for immediate activation', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('skipWaiting()');
      expect(swContent).toContain('clientsClaim()');
    });

    it('should have setCatchHandler for offline navigation fallback', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      expect(swContent).toContain('setCatchHandler');
      // 以排除法判斷 document：非 document 請求直接回傳 error，document 進入 precache 回退。
      expect(swContent).toContain("destination !== 'document'");
    });

    it('should use NavigationRoute + createHandlerBoundToURL for SPA offline navigation', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      // Workbox 官方 SPA 離線模式：NavigationRoute 直接從 precache 提供 index.html。
      // 相比 NetworkFirst + setCatchHandler，此模式對冷啟動離線更可靠。
      expect(swContent).toContain('createHandlerBoundToURL(');
      expect(swContent).toContain('new NavigationRoute(');
    });

    it('should have offline-first strategy in setCatchHandler', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      // 確保離線回退策略邏輯存在
      expect(swContent).toContain('離線回退');
      // setCatchHandler 作為保險層：document 請求從 precache 取 index.html。
      expect(swContent).toContain("matchPrecache('index.html')");
    });

    it('should have NavigationRoute as scope-safe navigation handler', () => {
      const swContent = readFileSync(resolve(ROOT_PATH, 'src/sw.ts'), 'utf-8');
      // NavigationRoute 只攔截 SW scope 內的導覽請求，天然同源保護。
      expect(swContent).toContain('new NavigationRoute(');
      expect(swContent).toContain('createHandlerBoundToURL(');
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
