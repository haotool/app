/**
 * Prerendering BDD Tests - SEO Phase 2B-2
 *
 * BDD 測試：驗證 vite-react-ssg 靜態 HTML 生成
 *
 * 測試策略：
 * - 🔴 驗證 dist/ 目錄結構（index.html, faq/index.html, about/index.html）
 * - 🔴 驗證 FAQ 頁面的 SEOHelmet meta tags 正確嵌入靜態 HTML
 * - 🔴 驗證 About 頁面的 SEOHelmet meta tags 正確嵌入靜態 HTML
 * - 🔴 驗證 404 頁面不應該預渲染（動態處理）
 * - 🔴 驗證所有頁面的 JSON-LD 正確
 *
 * 參考：fix/seo-phase2b-prerendering
 * 依據：[SEO 審查報告 2025-11-25] React SPA 爬蟲索引問題
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const distPath = resolve(__dirname, '../dist');
const projectRoot = resolve(__dirname, '..');

beforeAll(() => {
  const indexHtml = resolve(distPath, 'index.html');
  if (existsSync(indexHtml)) return;

  const result = spawnSync('pnpm', ['build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    throw new Error(`pnpm build failed with exit code ${result.status ?? 'unknown'}`);
  }
}, 120000);

describe('Prerendering Static HTML Generation (BDD)', () => {
  describe('🔴 RED: 靜態 HTML 檔案結構', () => {
    it('should generate dist/index.html for homepage', () => {
      // 🔴 紅燈：首頁應該生成 dist/index.html
      const indexHtml = resolve(distPath, 'index.html');
      expect(existsSync(indexHtml)).toBe(true);
    });

    it('should generate dist/faq/index.html for FAQ page', () => {
      // 🔴 紅燈：FAQ 頁面應該生成 dist/faq/index.html
      const faqHtml = resolve(distPath, 'faq/index.html');
      expect(existsSync(faqHtml)).toBe(true);
    });

    it('should generate dist/about/index.html for About page', () => {
      // 🔴 紅燈：About 頁面應該生成 dist/about/index.html
      const aboutHtml = resolve(distPath, 'about/index.html');
      expect(existsSync(aboutHtml)).toBe(true);
    });

    it('should NOT generate 404 page as static HTML', () => {
      // 🔴 紅燈：404 頁面不應該預渲染（動態處理）
      const notFoundHtml = resolve(distPath, '404/index.html');
      expect(existsSync(notFoundHtml)).toBe(false);
    });

    it('should NOT generate color-scheme page as static HTML', () => {
      // 🔴 紅燈：內部工具頁面不應該預渲染
      const colorSchemeHtml = resolve(distPath, 'color-scheme/index.html');
      expect(existsSync(colorSchemeHtml)).toBe(false);
    });
  });

  describe('🔴 RED: FAQ 頁面 SEO Meta Tags', () => {
    const faqHtml = resolve(distPath, 'faq/index.html');

    it('should have FAQ-specific title in static HTML', () => {
      if (!existsSync(faqHtml)) return; // Skip if file doesn't exist

      const content = readFileSync(faqHtml, 'utf-8');
      // 🔴 紅燈：應該包含 FAQ 頁面專屬標題
      expect(content).toContain('<title>');
      expect(content).toMatch(/常見問題|FAQ/i);
    });

    it('should have FAQ-specific description meta tag', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // 🔴 紅燈：應該包含 FAQ 頁面專屬描述
      expect(content).toContain('<meta name="description"');
      expect(content).toMatch(/匯率換算|currency|exchange/i);
    });

    it('should have FAQ-specific keywords meta tag', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // 🔴 紅燈：應該包含 FAQ 頁面專屬關鍵字
      expect(content).toContain('<meta name="keywords"');
    });

    it('should have FAQ canonical URL with trailing slash', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      expect(content).toContain('<link rel="canonical"');
      expect(content).toContain('/faq/');
    });

    it('should have Open Graph tags for FAQ page', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // 🔴 紅燈：應該包含 Open Graph tags
      expect(content).toContain('<meta property="og:title"');
      expect(content).toContain('<meta property="og:description"');
      expect(content).toContain('<meta property="og:url"');
    });
  });

  describe('🔴 RED: About 頁面 SEO Meta Tags', () => {
    const aboutHtml = resolve(distPath, 'about/index.html');

    it('should have About-specific title in static HTML', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // 🔴 紅燈：應該包含 About 頁面專屬標題
      expect(content).toContain('<title>');
      expect(content).toMatch(/關於|About/i);
    });

    it('should have About-specific description meta tag', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // 🔴 紅燈：應該包含 About 頁面專屬描述
      expect(content).toContain('<meta name="description"');
    });

    it('should have About canonical URL with trailing slash', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      expect(content).toContain('<link rel="canonical"');
      expect(content).toContain('/about/');
    });

    it('should have Open Graph tags for About page', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // 🔴 紅燈：應該包含 Open Graph tags
      expect(content).toContain('<meta property="og:title"');
      expect(content).toContain('<meta property="og:description"');
      expect(content).toContain('<meta property="og:url"');
    });
  });

  describe('🔴 RED: CSP & Security', () => {
    const indexHtml = resolve(distPath, 'index.html');

    it('should have Rocket Loader disabled meta tag', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).toContain('<meta name="cloudflare-rocket-loader" content="off"');
    });

    it('should not have unsafe-inline in script-src CSP', () => {
      // 注意：這個測試檢查的是 HTML 中的 CSP meta tag（如果有）
      // 實際的 CSP 由 nginx.conf 或 Cloudflare Worker 設定
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');

      // 如果 HTML 中有 CSP meta tag，確保 script-src 不包含 unsafe-inline
      const cspMetaMatch =
        /<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]*)"[^>]*>/i.exec(content);

      if (cspMetaMatch?.[1]) {
        const cspContent = cspMetaMatch[1];
        const scriptSrcMatch = /script-src[^;]+/.exec(cspContent);

        if (scriptSrcMatch) {
          expect(scriptSrcMatch[0]).not.toContain('unsafe-inline');
        }
      }
    });
  });

  describe('🔴 RED: JSON-LD 正確性', () => {
    const faqHtml = resolve(distPath, 'faq/index.html');
    const aboutHtml = resolve(distPath, 'about/index.html');
    const indexHtml = resolve(distPath, 'index.html');

    it('FAQ page should have FAQPage JSON-LD in static HTML', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      expect(content).toContain('<script type="application/ld+json">');
      // 支持美化和壓縮兩種格式
      expect(content).toMatch(/"@type":\s*"FAQPage"/);
      expect(content).toContain('"mainEntity"');
    });

    it('About page should have AboutPage or Organization JSON-LD', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // 🔴 紅燈：About 頁面應該包含 AboutPage 或 Organization JSON-LD
      expect(content).toContain('<script type="application/ld+json">');
      expect(content).toMatch(/"@type":\s*"(AboutPage|Organization)"/);
    });

    it('Homepage should only have index.html JSON-LD (no SEOHelmet duplication)', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');

      // 🔴 紅燈：首頁應該只有一個 WebApplication JSON-LD
      const webAppMatches = content.match(/"@type":\s*"WebApplication"/g);
      expect(webAppMatches).toBeTruthy();
      expect(webAppMatches?.length).toBe(1);

      // 🔴 紅燈：首頁應該只有一個 Organization JSON-LD
      const orgMatches = content.match(/"@type":\s*"Organization"/g);
      expect(orgMatches).toBeTruthy();
      expect(orgMatches?.length).toBe(1);
    });

    it('FAQ and About pages should NOT duplicate homepage JSON-LD', () => {
      if (!existsSync(faqHtml) || !existsSync(aboutHtml)) return;

      const faqContent = readFileSync(faqHtml, 'utf-8');
      const aboutContent = readFileSync(aboutHtml, 'utf-8');

      // 🔴 紅燈：FAQ 頁面應該只有一個 WebApplication（來自 index.html template）
      const faqWebAppMatches = faqContent.match(/"@type":\s*"WebApplication"/g);
      expect(faqWebAppMatches?.length).toBeLessThanOrEqual(1);

      // 🔴 紅燈：About 頁面應該只有一個 WebApplication（來自 index.html template）
      const aboutWebAppMatches = aboutContent.match(/"@type":\s*"WebApplication"/g);
      expect(aboutWebAppMatches?.length).toBeLessThanOrEqual(1);
    });
  });

  describe('🔴 RED: SEO 最佳實踐', () => {
    const faqHtml = resolve(distPath, 'faq/index.html');
    const aboutHtml = resolve(distPath, 'about/index.html');

    it('FAQ page should have proper hreflang tags', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      expect(content).toContain('hreflang="zh-TW"');
      expect(content).toContain('hreflang="x-default"');
      expect(content).not.toContain('hreflang="en"');
      expect(content).not.toContain('hreflang="ja"');
    });

    it('About page should have proper hreflang tags', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      expect(content).toContain('hreflang="zh-TW"');
      expect(content).toContain('hreflang="x-default"');
      expect(content).not.toContain('hreflang="en"');
      expect(content).not.toContain('hreflang="ja"');
    });

    it('All pages should have proper charset and viewport', () => {
      const pages = [
        resolve(distPath, 'index.html'),
        resolve(distPath, 'faq/index.html'),
        resolve(distPath, 'about/index.html'),
      ];

      pages.forEach((pagePath) => {
        if (!existsSync(pagePath)) return;

        const content = readFileSync(pagePath, 'utf-8');
        // 🔴 紅燈：所有頁面應該有正確的 charset 和 viewport
        expect(content).toContain('<meta charset="UTF-8"');
        expect(content).toContain('<meta name="viewport"');
      });
    });
  });

  describe('🔴 RED: vite-react-ssg 整合驗證', () => {
    it('should have vite-react-ssg in package.json devDependencies', async () => {
      // 🔴 紅燈：package.json 應該包含 vite-react-ssg
      const packageJson = await import('../package.json');
      expect(packageJson.devDependencies).toHaveProperty('vite-react-ssg');
    });

    it('should have build script using vite-react-ssg', async () => {
      // 🔴 紅燈：build script 應該使用 vite-react-ssg build
      const packageJson = await import('../package.json');
      expect(packageJson.scripts.build).toContain('vite-react-ssg');
    });

    it('main.tsx should use ViteReactSSG instead of ReactDOM.createRoot', () => {
      // 🔴 紅燈：main.tsx 應該使用 ViteReactSSG
      const mainTsx = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
      expect(mainTsx).toContain('ViteReactSSG');
      expect(mainTsx).toContain('export const createRoot');
    });

    it('should have routes configuration for vite-react-ssg', () => {
      // 🔴 紅燈：應該有 routes 配置檔案
      const hasRoutesInMain = existsSync(resolve(__dirname, 'main.tsx'));
      const hasRoutesInApp = existsSync(resolve(__dirname, 'App.tsx'));
      expect(hasRoutesInMain || hasRoutesInApp).toBe(true);
    });
  });
});
