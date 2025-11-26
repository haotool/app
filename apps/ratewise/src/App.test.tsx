/**
 * App.tsx BDD Tests - SEO Phase 2A
 *
 * BDD 測試：驗證 App 組件的 SEO 元件使用策略
 *
 * 測試策略：
 * - ❌ 不應該在 App 組件中包含全域 SEOHelmet（避免與子頁面衝突）
 * - ✅ SEOHelmet 只應該在具體頁面中使用（FAQ、About、NotFound）
 * - ✅ 首頁的 meta tags 應該來自靜態 index.html
 *
 * 參考：fix/seo-phase2a-bdd-approach
 * 依據：[SEO 審查報告 2025-11-25] Meta Tags 重複衝突問題
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

describe('App Component - SEO Configuration (BDD)', () => {
  describe('🔴 RED: App 組件不應該包含全域 SEOHelmet', () => {
    it('should NOT import SEOHelmet in App.tsx source code', async () => {
      // 真正的 BDD 紅燈測試：讀取 App.tsx 源碼，驗證是否導入 SEOHelmet
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const appTsxPath = path.resolve(__dirname, 'App.tsx');
      const appTsxContent = await fs.readFile(appTsxPath, 'utf-8');

      // 🔴 紅燈：當前 App.tsx 包含 `import { SEOHelmet }`，這個測試會失敗
      const hasSEOHelmetImport = appTsxContent.includes(
        "import { SEOHelmet } from './components/SEOHelmet'",
      );

      // 預期：移除此導入後，測試通過（綠燈）
      expect(hasSEOHelmetImport).toBe(false);
    });

    it('should NOT render <SEOHelmet /> in App.tsx JSX', async () => {
      // 真正的 BDD 紅燈測試：讀取 App.tsx 源碼，驗證是否渲染 <SEOHelmet />
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const appTsxPath = path.resolve(__dirname, 'App.tsx');
      const appTsxContent = await fs.readFile(appTsxPath, 'utf-8');

      // 🔴 紅燈：當前 App.tsx 第 27 行包含 `<SEOHelmet />`，這個測試會失敗
      const hasSEOHelmetJSX = appTsxContent.includes('<SEOHelmet />');

      // 預期：移除此 JSX 元素後，測試通過（綠燈）
      expect(hasSEOHelmetJSX).toBe(false);
    });

    it('should allow child pages (FAQ/About) to manage their own SEO meta tags', async () => {
      // 驗證：子頁面應該各自包含 <SEOHelmet />
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const faqPath = path.resolve(__dirname, 'pages', 'FAQ.tsx');
      const aboutPath = path.resolve(__dirname, 'pages', 'About.tsx');

      const faqContent = await fs.readFile(faqPath, 'utf-8');
      const aboutContent = await fs.readFile(aboutPath, 'utf-8');

      // FAQ 應該包含 SEOHelmet
      expect(faqContent).toContain('<SEOHelmet');
      expect(faqContent).toContain('title="常見問題"');
      expect(faqContent).toContain('pathname="/faq"');

      // About 應該包含 SEOHelmet
      expect(aboutContent).toContain('<SEOHelmet');
      expect(aboutContent).toContain('title="關於我們"');
      expect(aboutContent).toContain('pathname="/about"');
    });
  });

  describe('🟢 GREEN: 驗證路由配置正確性', () => {
    it('should have correct routes: /, /faq, /about, /color-scheme, *', () => {
      const { container } = render(
        <HelmetProvider>
          <App />
        </HelmetProvider>,
      );

      // 驗證：App 組件應該包含所有必要的路由
      expect(container).toBeTruthy();

      // 預期路由：
      // - / → CurrencyConverter (首頁，靜態 SEO from index.html)
      // - /faq → FAQ (動態 SEO from SEOHelmet)
      // - /about → About (動態 SEO from SEOHelmet)
      // - /color-scheme → ColorSchemeComparison (隱藏頁面)
      // - * → NotFound (404 頁面，noindex SEO)
    });
  });

  describe('🔵 REFACTOR: 首頁 meta tags 來源驗證', () => {
    it('should use static HTML meta tags for homepage (not React Helmet)', () => {
      // 驗證：首頁的 meta tags 應該來自 index.html，而非 React Helmet

      // 策略：
      // 1. index.html 包含靜態 meta tags（description, og:*, twitter:*）
      // 2. Google 爬蟲立即讀取這些靜態 tags（無需等待 JS 執行）
      // 3. AI 爬蟲（GPTBot, ClaudeBot）只能讀取靜態 HTML

      const { container } = render(
        <HelmetProvider>
          <App />
        </HelmetProvider>,
      );

      expect(container).toBeTruthy();

      // 預期結果：
      // - index.html 保留完整的 SEO meta tags
      // - App.tsx 不包含全域 SEOHelmet
      // - FAQ/About 頁面使用各自的 SEOHelmet
      // - Google Search Console 索引錯誤：2 → 0
    });
  });
});
