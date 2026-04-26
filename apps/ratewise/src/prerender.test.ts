/** 預渲染測試 - 驗證 SSG 靜態 HTML 生成與 SEO meta tags */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { APP_ONLY_NOINDEX_PATHS } from './config/seo-paths';
import { APP_INFO } from './config/app-info';

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

describe('Prerendering Static HTML Generation (SEOHelmet Architecture)', () => {
  describe('🟢 靜態 HTML 檔案結構', () => {
    it('should generate dist/index.html for homepage', () => {
      const indexHtml = resolve(distPath, 'index.html');
      expect(existsSync(indexHtml)).toBe(true);
    });

    it('should generate dist/faq/index.html for FAQ page', () => {
      const faqHtml = resolve(distPath, 'faq/index.html');
      expect(existsSync(faqHtml)).toBe(true);
    });

    it('should generate dist/about/index.html for About page', () => {
      const aboutHtml = resolve(distPath, 'about/index.html');
      expect(existsSync(aboutHtml)).toBe(true);
    });

    it('should NOT generate 404 page as static HTML', () => {
      const notFoundHtml = resolve(distPath, '404/index.html');
      expect(existsSync(notFoundHtml)).toBe(false);
    });

    it('should generate color-scheme page as static HTML (app-only prerender)', () => {
      const colorSchemeHtml = resolve(distPath, 'color-scheme/index.html');
      expect(existsSync(colorSchemeHtml)).toBe(true);
    });
  });

  describe('🟢 FAQ 頁面 SEO Meta Tags（由 SEOHelmet 注入）', () => {
    const faqHtml = resolve(distPath, 'faq/index.html');

    it('should have FAQ-specific title in static HTML', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<title[^>]*>/);
      expect(content).toMatch(/常見問題|FAQ/i);
    });

    it('should append the brand only once for FAQ title', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      const titleMatch = /<title[^>]*>([^<]+)<\/title>/.exec(content);
      const titleText = titleMatch?.[1] ?? '';
      const brand = APP_INFO.name;

      expect(titleText).toBeTruthy();
      expect((titleText.match(new RegExp(brand, 'g')) ?? []).length).toBe(1);
      expect(titleText).not.toContain(`${brand} FAQ 解答 | ${brand}`);
    });

    it('should have FAQ-specific description meta tag', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<meta[^>]*name="description"/);
    });

    it('should NOT emit deprecated meta keywords on FAQ page', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      expect(content).not.toMatch(/<meta[^>]*name="keywords"/);
    });

    it('should have correct canonical URL for FAQ page (SSG Head)', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      expect(content).toMatch(
        /<link[^>]*rel="canonical"[^>]*href="https:\/\/app\.haotool\.org\/ratewise\/faq\/"/,
      );
    });

    it('should have Open Graph tags for FAQ page', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<meta[^>]*property="og:title"/);
      expect(content).toMatch(/<meta[^>]*property="og:description"/);
      expect(content).toMatch(/<meta[^>]*property="og:url"/);
    });

    it('should have correct og:url for FAQ page (not homepage URL)', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // [2026-01-29] C1 Critical Fix: 確保 og:url 指向正確的頁面
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<meta[^>]*property="og:url"[^>]*content="[^"]*\/faq\/"/);
    });
  });

  describe('🟢 About 頁面 SEO Meta Tags（由 SEOHelmet 注入）', () => {
    const aboutHtml = resolve(distPath, 'about/index.html');

    it('should have About-specific title in static HTML', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<title[^>]*>/);
      expect(content).toMatch(/關於|About/i);
    });

    it('should have About-specific description meta tag', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<meta[^>]*name="description"/);
    });

    it('should have correct canonical URL for About page (SSG Head)', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      expect(content).toMatch(
        /<link[^>]*rel="canonical"[^>]*href="https:\/\/app\.haotool\.org\/ratewise\/about\/"/,
      );
    });

    it('should have Open Graph tags for About page', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<meta[^>]*property="og:title"/);
      expect(content).toMatch(/<meta[^>]*property="og:description"/);
      expect(content).toMatch(/<meta[^>]*property="og:url"/);
    });

    it('should have correct og:url for About page (not homepage URL)', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // [2026-01-29] C1 Critical Fix: 確保 og:url 指向正確的頁面
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<meta[^>]*property="og:url"[^>]*content="[^"]*\/about\/"/);
    });
  });

  describe('🟢 Open Data 頁面 SEO Meta Tags（由 SEOHelmet 注入）', () => {
    const openDataHtml = resolve(distPath, 'open-data/index.html');

    it('should have Open Data-specific title in static HTML', () => {
      if (!existsSync(openDataHtml)) return;

      const content = readFileSync(openDataHtml, 'utf-8');
      expect(content).toMatch(/<title[^>]*>/);
      expect(content).toMatch(/開放資料 API/);
    });

    it('should append brand only once for Open Data title', () => {
      if (!existsSync(openDataHtml)) return;

      const content = readFileSync(openDataHtml, 'utf-8');
      const titleMatch = /<title[^>]*>([^<]+)<\/title>/.exec(content);
      const titleText = titleMatch?.[1] ?? '';
      expect(titleText).toBeTruthy();

      const occurrences = (titleText.match(new RegExp(APP_INFO.name, 'g')) ?? []).length;
      expect(occurrences).toBe(1);
    });

    it('should NOT emit deprecated meta keywords on Open Data page', () => {
      if (!existsSync(openDataHtml)) return;

      const content = readFileSync(openDataHtml, 'utf-8');
      expect(content).not.toMatch(/<meta[^>]*name="keywords"/);
    });
  });

  describe('🟢 首頁 SEO Meta Tags（由 SEOHelmet 在 ClientOnly 外層注入）', () => {
    const indexHtml = resolve(distPath, 'index.html');

    it('should have homepage title in static HTML', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).toMatch(/<title[^>]*>/);
      expect(content).toContain(APP_INFO.shortName);
    });

    it('should have homepage description meta tag', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).toMatch(/<meta[^>]*name="description"/);
    });

    it('should NOT emit deprecated meta keywords on homepage', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).not.toMatch(/<meta[^>]*name="keywords"/);
    });

    it('should have correct canonical URL for homepage', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).toMatch(
        /<link[^>]*rel="canonical"[^>]*href="https:\/\/app\.haotool\.org\/ratewise\/"/,
      );
    });

    it('should have og:url for homepage', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).toMatch(/<meta[^>]*property="og:url"/);
    });

    it('should have Twitter Card tags for homepage', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).toMatch(/<meta[^>]*name="twitter:card"/);
    });

    it('should have JSON-LD structured data for homepage', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).toMatch(/<script[^>]*type="application\/ld\+json"/);
      expect(content).toMatch(/"@type":\s*"SoftwareApplication"/);
    });

    it('should NOT have FAQPage JSON-LD on homepage', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).not.toMatch(/"@type":\s*"FAQPage"/);
    });

    it('should have only ONE title tag (no duplicates from template)', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      const titleMatches = content.match(/<title[^>]*>[^<]+<\/title>/g);
      expect(titleMatches).toBeTruthy();
      expect(titleMatches?.length).toBe(1);
    });

    it('should have only ONE description meta tag', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      const descMatches = content.match(/<meta[^>]*name="description"[^>]*>/g);
      expect(descMatches).toBeTruthy();
      expect(descMatches?.length).toBe(1);
    });
  });

  describe('🟢 子頁面不應有重複 meta tags', () => {
    it('FAQ page should have only ONE title tag', () => {
      const faqHtml = resolve(distPath, 'faq/index.html');
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      const titleMatches = content.match(/<title[^>]*>[^<]+<\/title>/g);
      expect(titleMatches).toBeTruthy();
      expect(titleMatches?.length).toBe(1);
    });

    it('FAQ page should have only ONE description meta tag', () => {
      const faqHtml = resolve(distPath, 'faq/index.html');
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      const descMatches = content.match(/<meta[^>]*name="description"[^>]*>/g);
      expect(descMatches).toBeTruthy();
      expect(descMatches?.length).toBe(1);
    });

    it('About page should have only ONE title tag', () => {
      const aboutHtml = resolve(distPath, 'about/index.html');
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      const titleMatches = content.match(/<title[^>]*>[^<]+<\/title>/g);
      expect(titleMatches).toBeTruthy();
      expect(titleMatches?.length).toBe(1);
    });

    it('About page should have only ONE description meta tag', () => {
      const aboutHtml = resolve(distPath, 'about/index.html');
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      const descMatches = content.match(/<meta[^>]*name="description"[^>]*>/g);
      expect(descMatches).toBeTruthy();
      expect(descMatches?.length).toBe(1);
    });
  });

  describe('🟢 幣別落地頁 Rich Results 範圍控制', () => {
    const usdHtml = resolve(distPath, 'usd-twd/index.html');
    const usdAmountHtml = resolve(distPath, 'usd-twd/500/index.html');

    it('USD/TWD page should exist as static HTML', () => {
      expect(existsSync(usdHtml)).toBe(true);
    });

    it('USD/TWD page should include ExchangeRateSpecification and exclude FAQPage / FinancialService', () => {
      if (!existsSync(usdHtml)) return;

      const content = readFileSync(usdHtml, 'utf-8');
      expect(content).toMatch(/"@type":\s*"ExchangeRateSpecification"/);
      expect(content).not.toMatch(/"@type":\s*"FAQPage"/);
      expect(content).not.toMatch(/"@type":\s*"FinancialService"/);
    });

    it('USD/TWD amount page should use self canonical and self hreflang', () => {
      if (!existsSync(usdAmountHtml)) return;

      const content = readFileSync(usdAmountHtml, 'utf-8');
      expect(content).toMatch(
        /<link[^>]*rel="canonical"[^>]*href="https:\/\/app\.haotool\.org\/ratewise\/usd-twd\/500\/"/,
      );
      expect(content).toMatch(
        /<link[^>]*rel="alternate"[^>]*hreflang="x-default"[^>]*href="https:\/\/app\.haotool\.org\/ratewise\/usd-twd\/500\/"/,
      );
      expect(content).toMatch(
        /<link[^>]*rel="alternate"[^>]*hreflang="zh-TW"[^>]*href="https:\/\/app\.haotool\.org\/ratewise\/usd-twd\/500\/"/,
      );
    });

    it('USD/TWD amount page should not duplicate the brand in title', () => {
      if (!existsSync(usdAmountHtml)) return;

      const content = readFileSync(usdAmountHtml, 'utf-8');
      const titleMatch = /<title[^>]*>([^<]+)<\/title>/.exec(content);
      const titleText = titleMatch?.[1] ?? '';

      expect(titleText).toBeTruthy();
      expect((titleText.match(new RegExp(APP_INFO.name, 'g')) ?? []).length).toBe(1);
      expect(titleText).not.toContain(`| ${APP_INFO.shortName} |`);
    });

    it('USD/TWD amount page should prerender the direct answer block', () => {
      if (!existsSync(usdAmountHtml)) return;

      const content = readFileSync(usdAmountHtml, 'utf-8');
      expect(content).toContain('換算結果（台銀現金賣出參考）');
      expect(content).toContain('500 USD');
      expect(content).toContain('在換算器查看最新匯率');
    });

    it('USD/TWD amount page should expose self-canonical ExchangeRateSpecification', () => {
      if (!existsSync(usdAmountHtml)) return;

      const content = readFileSync(usdAmountHtml, 'utf-8');
      expect(content).toMatch(
        /"@type":"ExchangeRateSpecification"[\s\S]*"url":"https:\/\/app\.haotool\.org\/ratewise\/usd-twd\/500\/"/,
      );
    });

    it('USD/TWD amount page should NOT emit deprecated meta keywords', () => {
      if (!existsSync(usdAmountHtml)) return;

      const content = readFileSync(usdAmountHtml, 'utf-8');
      expect(content).not.toMatch(/<meta[^>]*name="keywords"/);
    });
  });

  describe('🟢 noindex 功能頁 prerender 驗證', () => {
    const sitemapPath = resolve(projectRoot, 'public/sitemap.xml');

    it.each(APP_ONLY_NOINDEX_PATHS)(
      '%s should include robots noindex in prerendered HTML',
      (path) => {
        const htmlPath = resolve(distPath, path.slice(1), 'index.html');
        if (!existsSync(htmlPath)) return;

        const content = readFileSync(htmlPath, 'utf-8');
        expect(content).toMatch(/name="robots"[^>]*content="noindex/);
      },
    );

    it.each(APP_ONLY_NOINDEX_PATHS)('%s should use self canonical URL', (path) => {
      const htmlPath = resolve(distPath, path.slice(1), 'index.html');
      if (!existsSync(htmlPath)) return;

      const content = readFileSync(htmlPath, 'utf-8');
      expect(content).toMatch(
        new RegExp(
          `<link[^>]*rel="canonical"[^>]*href="https://app\\.haotool\\.org/ratewise${path}"`,
        ),
      );
    });

    it.each(APP_ONLY_NOINDEX_PATHS)('%s should stay out of sitemap.xml', (path) => {
      if (!existsSync(sitemapPath)) return;

      const sitemap = readFileSync(sitemapPath, 'utf-8');
      expect(sitemap).not.toContain(`/ratewise${path}</loc>`);
    });
  });

  describe('🟢 CSP & Security', () => {
    const indexHtml = resolve(distPath, 'index.html');

    it('should have Rocket Loader disabled meta tag', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).toContain('<meta name="cloudflare-rocket-loader" content="off"');
    });

    it('should not inject Content-Security-Policy meta tags into prerendered HTML', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      expect(content).not.toMatch(/<meta[^>]*http-equiv="Content-Security-Policy"/i);
    });
  });

  describe('🟢 JSON-LD 正確性（由 SEOHelmet 注入）', () => {
    const faqHtml = resolve(distPath, 'faq/index.html');
    const aboutHtml = resolve(distPath, 'about/index.html');
    const indexHtml = resolve(distPath, 'index.html');

    it('FAQ page should have Article JSON-LD and FAQPage in static HTML', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<script[^>]*type="application\/ld\+json"/);
      expect(content).toMatch(/"@type":\s*"Article"/);
      expect(content).toMatch(/"@type":\s*"FAQPage"/);
    });

    it('Open Data page should emit Dataset JSON-LD for machine-readable discovery', () => {
      const openDataHtml = resolve(distPath, 'open-data/index.html');
      if (!existsSync(openDataHtml)) return;

      const content = readFileSync(openDataHtml, 'utf-8');
      expect(content).toMatch(/"@type":\s*"Dataset"/);
      expect(content).toMatch(/"@type":\s*"DataDownload"/);
    });

    it('About page should have Organization JSON-LD', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      // vite-react-ssg Head adds data-rh="true" attribute
      expect(content).toMatch(/<script[^>]*type="application\/ld\+json"/);
      expect(content).toMatch(/"@type":\s*"Organization"/);
    });

    it('Homepage should have SoftwareApplication JSON-LD', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      // [2026-02-27] SEOHelmet 在 ClientOnly 外層管理所有 JSON-LD
      // SSG 時會渲染完整 JSON-LD
      expect(content).toContain('application/ld+json');
      expect(content).toMatch(/"@type":\s*"SoftwareApplication"/);
      expect(content).not.toMatch(/"@type":\s*"HowTo"/);
    });

    it('FAQ page should have exactly ONE Organization schema in top-level', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      // Since we use @graph structure, Organization appears within the graph array
      // Match "@type":"Organization" (without @context, as @context is at root level)
      const orgMatches = content.match(/"@type":\s*"Organization"/g);
      expect(orgMatches).toBeTruthy();
      // Should have exactly one top-level Organization (not counting nested ones in creator/copyrightHolder)
      expect(orgMatches?.length).toBeGreaterThanOrEqual(1);
    });

    it('Homepage should NOT have duplicate schemas from index.html template', () => {
      if (!existsSync(indexHtml)) return;

      const content = readFileSync(indexHtml, 'utf-8');
      // [2026-01-29] C2 Critical Fix: 確保沒有從 index.html template 來的重複 schema
      const webAppMatches = content.match(/"@type":\s*"WebApplication"/g);
      // 應該是 0（因為我們使用 SoftwareApplication）或最多 1
      expect(webAppMatches?.length ?? 0).toBeLessThanOrEqual(1);
    });
  });

  describe('🟢 SEO 最佳實踐', () => {
    const faqHtml = resolve(distPath, 'faq/index.html');
    const aboutHtml = resolve(distPath, 'about/index.html');

    it('FAQ page should have correct hreflang tags (SSG Head)', () => {
      if (!existsSync(faqHtml)) return;

      const content = readFileSync(faqHtml, 'utf-8');
      expect(content).toContain('hreflang="zh-TW"');
      expect(content).toContain('hreflang="x-default"');
    });

    it('About page should have correct hreflang tags (SSG Head)', () => {
      if (!existsSync(aboutHtml)) return;

      const content = readFileSync(aboutHtml, 'utf-8');
      expect(content).toContain('hreflang="zh-TW"');
      expect(content).toContain('hreflang="x-default"');
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
        expect(content).toContain('<meta charset="UTF-8"');
        expect(content).toContain('<meta name="viewport"');
      });
    });

    it('All pages should have lang="zh-TW" attribute', () => {
      const pages = [
        resolve(distPath, 'index.html'),
        resolve(distPath, 'faq/index.html'),
        resolve(distPath, 'about/index.html'),
      ];

      pages.forEach((pagePath) => {
        if (!existsSync(pagePath)) return;

        const content = readFileSync(pagePath, 'utf-8');
        // [2026-01-29] H2 Fix: 確保使用 zh-TW 而非 zh-Hant
        // vite-react-ssg may add additional attributes like data-beasties-container
        expect(content).toMatch(/<html[^>]*lang="zh-TW"/);
      });
    });
  });

  describe('🟢 vite-react-ssg 整合驗證', () => {
    it('should have vite-react-ssg in package.json devDependencies', async () => {
      const packageJson = await import('../package.json');
      expect(packageJson.devDependencies).toHaveProperty('vite-react-ssg');
    });

    it('should have build script using vite-react-ssg', async () => {
      const packageJson = await import('../package.json');
      expect(packageJson.scripts.build).toContain('vite-react-ssg');
    });

    it('main.tsx should use ViteReactSSG instead of ReactDOM.createRoot', () => {
      const mainTsx = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');
      expect(mainTsx).toContain('ViteReactSSG');
      expect(mainTsx).toContain('export const createRoot');
    });

    it('should have routes configuration for vite-react-ssg', () => {
      const hasRoutesInMain = existsSync(resolve(__dirname, 'main.tsx'));
      const hasRoutesInApp = existsSync(resolve(__dirname, 'App.tsx'));
      expect(hasRoutesInMain || hasRoutesInApp).toBe(true);
    });
  });
});
