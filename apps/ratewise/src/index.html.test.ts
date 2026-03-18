/** index.html 靜態模板測試 - 驗證 SEOHelmet 架構 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('index.html - Static Template (SEOHelmet Architecture)', () => {
  const indexHtmlPath = resolve(__dirname, '..', 'index.html');
  const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

  describe('🟢 基礎設施 Meta Tags（保留）', () => {
    it('should have <html lang="zh-TW"> attribute', () => {
      expect(indexHtmlContent).toContain('<html lang="zh-TW">');
    });

    it('should have charset and viewport meta tags', () => {
      expect(indexHtmlContent).toContain('<meta charset="UTF-8"');
      expect(indexHtmlContent).toContain('<meta name="viewport"');
    });

    it('should have theme-color meta tag', () => {
      expect(indexHtmlContent).toContain('<meta name="theme-color" content="#8B5CF6"');
    });

    it('should have Cloudflare Rocket Loader disabled', () => {
      expect(indexHtmlContent).toContain('cloudflare-rocket-loader');
    });

    it('should have app-version and build-time meta tags', () => {
      expect(indexHtmlContent).toContain('<meta name="app-version"');
      expect(indexHtmlContent).toContain('<meta name="build-time"');
    });

    it('should have Google Search Console verification', () => {
      expect(indexHtmlContent).toContain('<meta name="google-site-verification"');
    });
  });

  describe('🟢 SEO Tags 由 SEOHelmet 統一管理（不在 index.html）', () => {
    it('should NOT have hardcoded title tag', () => {
      // [2026-01-30] SEOHelmet 現在在 ClientOnly 外面，所有頁面統一管理
      expect(indexHtmlContent).not.toMatch(/<title>/);
    });

    it('should NOT have hardcoded description meta tag', () => {
      // [2026-01-30] 移除硬編碼 description，避免子頁面重複
      expect(indexHtmlContent).not.toMatch(/<meta\s+name="description"/);
    });

    it('should NOT have hardcoded keywords meta tag', () => {
      expect(indexHtmlContent).not.toMatch(/<meta\s+name="keywords"/);
    });

    it('should NOT have hardcoded robots meta tag', () => {
      // [2026-01-30] 移除硬編碼 robots，避免子頁面重複
      expect(indexHtmlContent).not.toMatch(/<meta\s+name="robots"/);
    });

    it('should NOT have hardcoded canonical URL', () => {
      expect(indexHtmlContent).not.toContain('<link rel="canonical"');
    });
  });

  describe('🟢 Open Graph Tags 由 SEOHelmet 管理（不在 index.html）', () => {
    it('should NOT have hardcoded og:url tag', () => {
      // [2026-01-29] 這是 C1 Critical Issue 的根因
      // 硬編碼 og:url 導致 16/17 頁面顯示錯誤的 URL
      expect(indexHtmlContent).not.toMatch(/<meta\s+property="og:url"/);
    });

    it('should NOT have hardcoded og:title tag', () => {
      expect(indexHtmlContent).not.toMatch(/<meta\s+property="og:title"/);
    });

    it('should NOT have hardcoded og:description tag', () => {
      expect(indexHtmlContent).not.toMatch(/<meta\s+property="og:description"/);
    });

    it('should NOT have hardcoded og:image tag', () => {
      expect(indexHtmlContent).not.toMatch(/<meta\s+property="og:image"\s+content="/);
    });

    it('should NOT have hardcoded og:type tag', () => {
      expect(indexHtmlContent).not.toMatch(/<meta\s+property="og:type"/);
    });
  });

  describe('🟢 Twitter Card Tags 由 SEOHelmet 管理（不在 index.html）', () => {
    it('should NOT have hardcoded twitter:card tag', () => {
      expect(indexHtmlContent).not.toMatch(/<meta\s+name="twitter:card"/);
    });

    it('should NOT have hardcoded twitter:title tag', () => {
      expect(indexHtmlContent).not.toMatch(/<meta\s+name="twitter:title"/);
    });

    it('should NOT have hardcoded twitter:image tag', () => {
      expect(indexHtmlContent).not.toMatch(/<meta\s+name="twitter:image"/);
    });
  });

  describe('🟢 JSON-LD Structured Data 由 SEOHelmet 管理（不在 index.html）', () => {
    it('should NOT have hardcoded JSON-LD script tags', () => {
      // [2026-01-29] 這是 C2 Critical Issue 的修復
      // 硬編碼 JSON-LD 導致重複 Organization, WebSite, WebApplication schemas
      expect(indexHtmlContent).not.toContain('<script type="application/ld+json">');
    });

    it('should NOT have hardcoded title in template', () => {
      // [2026-01-30] title 由 SEOHelmet 統一管理，不在 index.html
      expect(indexHtmlContent).not.toMatch(/<title>/);
    });
  });

  describe('🟢 PWA Meta Tags（保留）', () => {
    it('should retain PWA essential tags', () => {
      expect(indexHtmlContent).toContain('<meta name="theme-color" content="#8B5CF6"');
      expect(indexHtmlContent).toContain('<meta name="viewport"');
      expect(indexHtmlContent).toContain('<link rel="apple-touch-icon"');
      expect(indexHtmlContent).toContain('<link rel="icon"');
    });

    it('should retain PWA manifest hints', () => {
      expect(indexHtmlContent).toContain('mobile-web-app-capable');
      expect(indexHtmlContent).toContain('apple-mobile-web-app-capable');
    });
  });

  describe('🟢 Resource Hints（保留）', () => {
    it('should retain preconnect hints', () => {
      expect(indexHtmlContent).toContain('<link rel="preconnect"');
    });

    it('should not have redundant dns-prefetch (preconnect supersedes)', () => {
      expect(indexHtmlContent).not.toContain('<link rel="dns-prefetch"');
    });
  });

  describe('🟢 Noscript Fallback（保留）', () => {
    it('should have noscript content for SEO', () => {
      expect(indexHtmlContent).toContain('<noscript>');
      expect(indexHtmlContent).toContain('RateWise 匯率好工具');
    });
  });

  describe('🟢 Security: Theme Initialization Script', () => {
    // 壓縮後以行為驗證，不依賴變數名稱（ALLOWED_STYLES→A、getValidatedStyle→v 等）。

    it('should have theme whitelist for security', () => {
      // [2026-01-29] 白名單防注入，壓縮後仍含完整主題名稱陣列。
      expect(indexHtmlContent).toContain("'zen', 'nitro', 'kawaii', 'classic', 'ocean', 'forest'");
    });

    it('should check for prototype pollution prevention', () => {
      // [2026-01-29] 防 prototype pollution：config 為普通物件才繼續。
      expect(indexHtmlContent).toContain('constructor !== Object');
    });

    it('should use hasOwnProperty for property check', () => {
      // [2026-01-29] 安全屬性存取，壓縮後仍保留。
      expect(indexHtmlContent).toContain('Object.prototype.hasOwnProperty.call');
    });

    it('should validate style is a string type', () => {
      // [2026-01-29] 型別驗證，壓縮後仍含 typeof 與 string 檢查。
      expect(indexHtmlContent).toMatch(/typeof\s+\w+\s*===\s*['"]string['"]/);
    });

    it('should use indexOf for whitelist validation (ES5 compatible)', () => {
      // [2026-01-29] indexOf 白名單查找，ES5 相容，壓縮後仍保留。
      expect(indexHtmlContent).toContain('.indexOf(');
    });
  });
});
