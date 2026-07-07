/** index.html 靜態模板測試 - 驗證 SEOHelmet 架構 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CUSTOM_THEME_DERIVE_VERSION } from './config/custom-theme';

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
      expect(indexHtmlContent).toContain('<meta name="theme-color" content="#3182F6"');
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
      expect(indexHtmlContent).toContain('<meta name="theme-color" content="#3182F6"');
      expect(indexHtmlContent).toContain('<meta name="viewport"');
      expect(indexHtmlContent).toContain('<link rel="apple-touch-icon"');
      expect(indexHtmlContent).toContain('<link rel="icon"');
    });

    it('should preload the brand wordmark font subset with base path SSOT', () => {
      // 品牌標準字（Nunito 900 子集）：preload 走 __BASE_PATH__ 佔位符。
      // @font-face 必須在 src/index.css（與 .brand-wordmark 同 sheet），
      // 否則 Beasties 逐 sheet 判定 critical fonts 時會整條剝除（unused preload 根因）。
      expect(indexHtmlContent).toContain('__BASE_PATH__fonts/nunito-wordmark-900.woff2');
      expect(indexHtmlContent).not.toMatch(/@font-face\s*\{/);

      const indexCssContent = readFileSync(resolve(__dirname, 'index.css'), 'utf-8');
      expect(indexCssContent).toContain("font-family: 'Nunito Wordmark'");
      expect(indexCssContent).toContain('font-display: swap');
      expect(indexCssContent).toContain("url('/fonts/nunito-wordmark-900.woff2')");
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
      // Vite transformIndexHtml 會把 __BRAND_FULL__ 替換為 APP_INFO.name；
      // 測試以靜態模板為對象，斷言 placeholder 而非最終品牌字串。
      expect(indexHtmlContent).toContain('__BRAND_FULL__');
    });
  });

  describe('🟢 主題底色 SSOT（深色主題內容頁可讀性守門）', () => {
    it('body 標籤不得硬編碼 Tailwind 色板 class（會蓋掉主題變數）', () => {
      // [2026-07-05] P0：bg-slate-50 utility class specificity 高於 index.css 的
      // body { background-color: rgb(var(--color-background)) }，導致深色主題底色被鎖淺色。
      expect(indexHtmlContent).toMatch(/<body>/);
      expect(indexHtmlContent).not.toMatch(/<body[^>]*class=/);
    });

    it('critical CSS 的 body 底色必須走 --sk-bg 主題變數', () => {
      // 首次 paint 前依 data-style 取主題底色，深色主題不閃白。
      expect(indexHtmlContent).toContain('background: var(--sk-bg, #f8fafc);');
    });
  });

  describe('🟢 Security: Theme Initialization Script', () => {
    // 壓縮後以行為驗證，不依賴變數名稱（ALLOWED_STYLES→A、getValidatedStyle→v 等）。

    it('should have theme whitelist for security', () => {
      // [2026-01-29] 白名單防注入，壓縮後仍含完整主題名稱陣列。
      // [2026-07-05] E2：allowlist 加入 'custom'（自訂主題色）。
      expect(indexHtmlContent).toContain(
        "'zen', 'violet', 'nitro', 'racing', 'kawaii', 'classic', 'forest', 'custom'",
      );
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

  describe('🟢 Custom Theme Bootstrap（E2 最小覆寫＋E7 wave-A 快取全量 pre-paint）', () => {
    const bootstrapStart = indexHtmlContent.indexOf('<!-- Theme Initialization');
    const bootstrapEnd = indexHtmlContent.indexOf('</script>', bootstrapStart);
    const bootstrap = indexHtmlContent.slice(bootstrapStart, bootstrapEnd);

    it('should validate customPrimary with strict hex pattern', () => {
      // 僅接受 #RRGGBB 六碼，與 runtime isValidHexColor 同構。
      expect(indexHtmlContent).toContain('/^#[0-9a-fA-F]{6}$/');
      expect(indexHtmlContent).toContain('customPrimary');
    });

    it('should read the derived vars cache with signature and triple-format validation (#619)', () => {
      // E7 wave-A：pre-paint 讀 applyTheme 持久化的派生快取（含深色背景系與 on-surface），
      // 深色使用者冷啟不閃白；簽章（primary/tone/derive 版本）或格式不符即整包棄用。
      expect(bootstrap).toContain("'ratewise-theme-vars'");
      expect(bootstrap).toContain(
        `c.p !== p || c.t !== t || c.v !== ${CUSTOM_THEME_DERIVE_VERSION}`,
      );
      expect(bootstrap).toContain('/^\\d{1,3} \\d{1,3} \\d{1,3}$/');
      expect(bootstrap).toContain('customBackgroundTone');
      // E7 wave-C：tone 值域 enum | #RRGGBB（亮度滑桿連續 tone），hex tone 進簽章比對。
      expect(bootstrap).toContain('/^[a-z]{1,16}$/.test(t) || /^#[0-9a-fA-F]{6}$/.test(t)');
      // 空 map 防護：--color-primary 鍵必須存在，否則視為壞快取回退最小覆寫。
      expect(bootstrap).toContain("String(m['--color-primary'])");
      // skeleton 首繪變數同步（--sk-bg 只認 data-style 靜態區塊，custom 需 inline 供給）。
      expect(bootstrap).toContain("'--sk-bg'");
      expect(bootstrap).toContain("'--sk-text'");
    });

    it('derive version stamp in bootstrap must match CUSTOM_THEME_DERIVE_VERSION (SSOT sync)', () => {
      // bootstrap 為 inline script 無法 import，以字面值比對鎖定雙端版本同步；
      // 演算改版時 bump 常數，本斷言即紅，提醒同步 index.html 字面值。
      const match = /c\.v !== (\d+)/.exec(bootstrap);
      expect(match?.[1]).toBe(String(CUSTOM_THEME_DERIVE_VERSION));
    });

    it('should fall back to minimal --color-primary override without inlining derivation', () => {
      // 快取缺失/不符的降級：--color-primary 一鍵 + theme-color meta；完整演算由 applyTheme 接手。
      expect(bootstrap).toContain("'--color-primary'");
      expect(bootstrap).toContain('meta[name="theme-color"]');
      // 不得在 bootstrap 內嵌演算（strong/hover 等鍵的計算禁止出現，防雙份漂移）。
      expect(bootstrap).not.toContain('--color-primary-strong');
      expect(bootstrap).not.toContain('--color-primary-hover');
    });

    it('should keep default custom primary aligned with brand blue', () => {
      expect(indexHtmlContent).toContain("P = '#3182F6'");
    });
  });
});
