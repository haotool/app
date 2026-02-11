/**
 * SEO 最佳實踐測試 - 2026 AI SEO / GEO / LLMO / AEO
 * 依據 Context7 + 權威網站最佳實踐編寫
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT_PATH = resolve(__dirname, '..');
const PUBLIC_PATH = resolve(ROOT_PATH, 'public');
const SRC_PATH = resolve(ROOT_PATH, 'src');

/** 輔助：讀取檔案 */
const readFile = (path: string): string => {
  if (!existsSync(path)) throw new Error(`File not found: ${path}`);
  return readFileSync(path, 'utf-8');
};

describe('🔍 AI SEO Best Practices 2026 (GEO/LLMO/AEO)', () => {
  describe('📄 llms.txt - LLM Optimization', () => {
    const llmsPath = resolve(PUBLIC_PATH, 'llms.txt');
    const llmsContent = readFile(llmsPath);

    it('should have valid llms.txt file', () => {
      expect(existsSync(llmsPath)).toBe(true);
    });

    it('should start with site identity header', () => {
      expect(llmsContent.startsWith('# RateWise')).toBe(true);
    });

    it('should have Answer Capsule section for quick Q&A', () => {
      // GEO 2026: AI 搜索優先顯示簡潔回答
      expect(llmsContent).toContain('Answer Capsule');
    });

    it('should have E-E-A-T Signals section', () => {
      // E-E-A-T 2026: AI 引用信號
      expect(llmsContent).toContain('E-E-A-T Signals');
      expect(llmsContent).toContain('專業性');
      expect(llmsContent).toContain('權威性');
      expect(llmsContent).toContain('可信度');
    });

    it('should have Key Metrics for performance evidence', () => {
      // 效能證據增加可信度
      expect(llmsContent).toContain('Key Metrics');
      expect(llmsContent).toContain('LCP');
      expect(llmsContent).toContain('Lighthouse');
    });

    it('should have AI/LLM Access Control section', () => {
      // llms.txt 2026 規範：明確 AI 訪問控制
      expect(llmsContent).toContain('AI/LLM Access Control');
      expect(llmsContent).toContain('Allow:');
    });

    it('should allow major AI crawlers', () => {
      // 2026 主要 AI 爬蟲白名單
      expect(llmsContent).toContain('GPTBot');
      expect(llmsContent).toContain('ClaudeBot');
      expect(llmsContent).toContain('PerplexityBot');
    });

    it('should have Attribution requirement', () => {
      // 引用規範
      expect(llmsContent).toContain('Attribution');
    });

    it('should have Contact information', () => {
      // 聯絡方式（E-E-A-T 可信度）
      expect(llmsContent).toContain('Contact');
      expect(llmsContent).toContain('@');
    });

    it('should list all core pages', () => {
      expect(llmsContent).toContain('Core Pages');
      expect(llmsContent).toContain('/faq/');
      expect(llmsContent).toContain('/guide/');
      expect(llmsContent).toContain('/about/');
    });

    it('should list popular currency landing pages', () => {
      // 核心貨幣（必須存在）
      const coreCurrencies = ['usd', 'jpy', 'eur', 'hkd', 'cny', 'krw'];
      for (const currency of coreCurrencies) {
        expect(llmsContent).toContain(`/${currency}-twd/`);
      }
    });

    it('should have at least 6 currency pages listed', () => {
      // 至少要有 6 個貨幣頁面
      const currencyUrlPattern = /\/[a-z]{3}-twd\//g;
      const allMatches = llmsContent.match(currencyUrlPattern);
      expect(allMatches).toBeTruthy();
      expect(allMatches!.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('🤖 robots.txt - AI Crawler Directives', () => {
    const robotsPath = resolve(PUBLIC_PATH, 'robots.txt');
    const robotsContent = readFile(robotsPath);

    it('should have valid robots.txt file', () => {
      expect(existsSync(robotsPath)).toBe(true);
    });

    it('should allow all crawlers by default', () => {
      expect(robotsContent).toContain('User-agent: *');
      expect(robotsContent).toContain('Allow: /');
    });

    it('should have Sitemap directive', () => {
      expect(robotsContent).toContain('Sitemap:');
      expect(robotsContent).toContain('sitemap.xml');
    });

    it('should explicitly allow GPTBot', () => {
      expect(robotsContent).toContain('User-agent: GPTBot');
      expect(robotsContent).toMatch(/User-agent: GPTBot[\s\S]*?Allow: \//);
    });

    it('should explicitly allow ClaudeBot', () => {
      expect(robotsContent).toContain('User-agent: ClaudeBot');
    });

    it('should explicitly allow PerplexityBot', () => {
      expect(robotsContent).toContain('User-agent: PerplexityBot');
    });

    it('should explicitly allow ChatGPT-User', () => {
      expect(robotsContent).toContain('User-agent: ChatGPT-User');
    });

    it('should explicitly allow Google-Extended', () => {
      // Google AI Overviews 爬蟲
      expect(robotsContent).toContain('User-agent: Google-Extended');
    });

    it('should allow social media crawlers', () => {
      expect(robotsContent).toContain('Twitterbot');
      expect(robotsContent).toContain('facebookexternalbot');
    });

    it('should disallow service worker and internal files', () => {
      expect(robotsContent).toContain('Disallow: /sw.js');
      expect(robotsContent).toContain('Disallow: /workbox-');
    });
  });

  describe('🗺️ sitemap.xml - Search Engine Optimization', () => {
    const sitemapPath = resolve(PUBLIC_PATH, 'sitemap.xml');
    const sitemapContent = readFile(sitemapPath);

    it('should have valid sitemap.xml file', () => {
      expect(existsSync(sitemapPath)).toBe(true);
    });

    it('should have XML declaration', () => {
      expect(sitemapContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('should have urlset with proper namespaces', () => {
      expect(sitemapContent).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(sitemapContent).toContain('xmlns:xhtml');
    });

    it('should have hreflang for multilingual support', () => {
      expect(sitemapContent).toContain('hreflang="zh-TW"');
      expect(sitemapContent).toContain('hreflang="x-default"');
    });

    it('should have lastmod dates in ISO format', () => {
      expect(sitemapContent).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z<\/lastmod>/);
    });

    it('should include image sitemap for rich results', () => {
      expect(sitemapContent).toContain('xmlns:image');
      expect(sitemapContent).toContain('<image:loc>');
    });

    it('should have all core pages', () => {
      expect(sitemapContent).toContain('/ratewise/</loc>');
      expect(sitemapContent).toContain('/ratewise/faq/</loc>');
      expect(sitemapContent).toContain('/ratewise/about/</loc>');
      expect(sitemapContent).toContain('/ratewise/guide/</loc>');
    });

    it('should have all 13 currency landing pages', () => {
      const currencies = [
        'usd',
        'jpy',
        'eur',
        'hkd',
        'cny',
        'krw',
        'aud',
        'cad',
        'chf',
        'gbp',
        'nzd',
        'sgd',
        'thb',
      ];
      for (const currency of currencies) {
        expect(sitemapContent).toContain(`/${currency}-twd/</loc>`);
      }
    });
  });

  describe('🏷️ JSON-LD Structured Data - Schema.org', () => {
    const seoHelmetPath = resolve(SRC_PATH, 'components/SEOHelmet.tsx');
    const seoHelmetContent = readFile(seoHelmetPath);

    it('should have SoftwareApplication schema', () => {
      // 2026 推薦：SoftwareApplication 比 WebApplication 更豐富
      expect(seoHelmetContent).toContain("'@type': 'SoftwareApplication'");
    });

    it('should have Organization schema', () => {
      expect(seoHelmetContent).toContain("'@type': 'Organization'");
    });

    it('should have WebSite schema', () => {
      expect(seoHelmetContent).toContain("'@type': 'WebSite'");
    });

    it('should have FAQPage schema builder', () => {
      expect(seoHelmetContent).toContain("'@type': 'FAQPage'");
    });

    it('should have HowTo schema builder', () => {
      expect(seoHelmetContent).toContain("'@type': 'HowTo'");
    });

    it('should have BreadcrumbList schema builder', () => {
      expect(seoHelmetContent).toContain("'@type': 'BreadcrumbList'");
    });

    it('should have ImageObject schema with creator metadata', () => {
      // 2026 AI 圖片理解增強
      expect(seoHelmetContent).toContain("'@type': 'ImageObject'");
      expect(seoHelmetContent).toContain('creator');
      expect(seoHelmetContent).toContain('copyrightNotice');
    });

    it('should NOT have SearchAction (no search functionality)', () => {
      // 沒有 ?q= 搜尋功能，不應該有 SearchAction
      expect(seoHelmetContent).not.toContain("'@type': 'SearchAction'");
    });

    it('should have applicationCategory for app type', () => {
      expect(seoHelmetContent).toContain('applicationCategory');
      expect(seoHelmetContent).toContain('FinanceApplication');
    });

    it('should have featureList for app capabilities', () => {
      expect(seoHelmetContent).toContain('featureList');
    });

    it('should have offers with price for app schema', () => {
      expect(seoHelmetContent).toContain("'@type': 'Offer'");
      expect(seoHelmetContent).toContain("price: '0'");
    });

    it('should have contactPoint for Organization', () => {
      expect(seoHelmetContent).toContain("'@type': 'ContactPoint'");
      expect(seoHelmetContent).toContain('email');
    });

    it('should have sameAs for social profiles', () => {
      expect(seoHelmetContent).toContain('sameAs');
    });
  });

  describe('📝 Meta Tags - Open Graph & Twitter Cards', () => {
    const seoHelmetPath = resolve(SRC_PATH, 'components/SEOHelmet.tsx');
    const seoHelmetContent = readFile(seoHelmetPath);

    it('should have og:type meta tag', () => {
      expect(seoHelmetContent).toContain('property="og:type"');
    });

    it('should have og:url meta tag', () => {
      expect(seoHelmetContent).toContain('property="og:url"');
    });

    it('should have og:title meta tag', () => {
      expect(seoHelmetContent).toContain('property="og:title"');
    });

    it('should have og:description meta tag', () => {
      expect(seoHelmetContent).toContain('property="og:description"');
    });

    it('should have og:image with dimensions', () => {
      expect(seoHelmetContent).toContain('property="og:image"');
      expect(seoHelmetContent).toContain('og:image:width');
      expect(seoHelmetContent).toContain('og:image:height');
      expect(seoHelmetContent).toContain('1200');
      expect(seoHelmetContent).toContain('630');
    });

    it('should have og:image:alt for accessibility', () => {
      expect(seoHelmetContent).toContain('og:image:alt');
    });

    it('should have og:locale meta tag', () => {
      expect(seoHelmetContent).toContain('property="og:locale"');
    });

    it('should have og:site_name meta tag', () => {
      expect(seoHelmetContent).toContain('property="og:site_name"');
    });

    it('should have twitter:card set to summary_large_image', () => {
      expect(seoHelmetContent).toContain('name="twitter:card"');
      expect(seoHelmetContent).toContain('summary_large_image');
    });

    it('should have twitter:image:alt for accessibility', () => {
      expect(seoHelmetContent).toContain('twitter:image:alt');
    });

    it('should have canonical link tag', () => {
      expect(seoHelmetContent).toContain('rel="canonical"');
    });

    it('should have hreflang alternate links', () => {
      expect(seoHelmetContent).toContain('rel="alternate"');
      expect(seoHelmetContent).toContain('hrefLang');
    });

    it('should have robots meta with AI-friendly directives', () => {
      // 2026 AI 搜索優化：max-image-preview:large 允許 AI 使用圖片
      expect(seoHelmetContent).toContain('max-image-preview:large');
      expect(seoHelmetContent).toContain('max-snippet:-1');
    });
  });

  describe('🏠 HomeStructuredData - Homepage Rich Results', () => {
    const homePath = resolve(SRC_PATH, 'components/HomeStructuredData.tsx');
    const homeContent = readFile(homePath);

    it('should have HowTo schema for conversion steps', () => {
      expect(homeContent).toContain("'@type': 'HowTo'");
    });

    it('should have FAQPage schema', () => {
      expect(homeContent).toContain("'@type': 'FAQPage'");
    });

    it('should have Article schema for content', () => {
      expect(homeContent).toContain("'@type': 'Article'");
    });

    it('should have publisher and image for Article', () => {
      expect(homeContent).toContain('publisher');
      expect(homeContent).toContain('image: OG_IMAGE_URL');
    });
  });

  describe('⚡ Core Web Vitals - Performance SEO', () => {
    const indexHtmlPath = resolve(ROOT_PATH, 'index.html');
    const indexHtmlContent = readFile(indexHtmlPath);

    it('should have preconnect hints for performance', () => {
      expect(indexHtmlContent).toContain('<link rel="preconnect"');
    });

    it('should not have redundant dns-prefetch (preconnect supersedes)', () => {
      expect(indexHtmlContent).not.toContain('<link rel="dns-prefetch"');
    });

    it('should have critical CSS inlined for LCP', () => {
      expect(indexHtmlContent).toContain('<style>');
      expect(indexHtmlContent).toContain('skeleton-shimmer');
    });

    it('should have skeleton loader for CLS prevention', () => {
      expect(indexHtmlContent).toContain('.skeleton-page');
    });

    it('should have theme initialization script for FOUC prevention', () => {
      expect(indexHtmlContent).toContain('STORAGE_KEY');
      expect(indexHtmlContent).toContain('applyStyle');
    });
  });

  describe('🌐 Internationalization - Language SEO', () => {
    const seoHelmetPath = resolve(SRC_PATH, 'components/SEOHelmet.tsx');
    const seoHelmetContent = readFile(seoHelmetPath);
    const indexHtmlPath = resolve(ROOT_PATH, 'index.html');
    const indexHtmlContent = readFile(indexHtmlPath);

    it('should have html lang="zh-TW" attribute', () => {
      expect(indexHtmlContent).toContain('<html lang="zh-TW">');
    });

    it('should have DEFAULT_LOCALE set to zh-TW', () => {
      expect(seoHelmetContent).toContain("DEFAULT_LOCALE = 'zh-TW'");
    });

    it('should have x-default hreflang', () => {
      expect(seoHelmetContent).toContain("hrefLang: 'x-default'");
    });

    it('should have inLanguage for WebSite schema', () => {
      expect(seoHelmetContent).toContain('inLanguage');
    });
  });

  describe('🔒 Security Headers - Trust Signals', () => {
    // Cloudflare Worker 在專案根目錄
    const workerPath = resolve(ROOT_PATH, '../../security-headers/src/worker.js');

    it('should have Cloudflare Worker for security headers', () => {
      expect(existsSync(workerPath)).toBe(true);
    });

    it('should have Permissions-Policy without deprecated features in policy value', () => {
      const workerContent = readFile(workerPath);
      expect(workerContent).toContain('Permissions-Policy');
      // 提取實際的 Permissions-Policy 值（排除註解）
      const policyRegex = /'Permissions-Policy':\s*\n?\s*['"]([^'"]+)['"]/;
      const policyMatch = policyRegex.exec(workerContent);
      expect(policyMatch).toBeTruthy();
      if (policyMatch) {
        const policyValue = policyMatch[1];
        // 實際 Policy 值不應該包含已棄用的功能
        expect(policyValue).not.toContain('ambient-light-sensor');
        expect(policyValue).not.toContain('document-domain');
        expect(policyValue).not.toContain('vr');
      }
    });
  });
});

describe('📊 E-E-A-T Compliance', () => {
  describe('Experience & Expertise', () => {
    const aboutPath = resolve(SRC_PATH, 'pages/About.tsx');
    const aboutContent = readFile(aboutPath);

    it('should have technical details in About page', () => {
      expect(aboutContent).toContain('技術');
    });

    it('should mention data source authority', () => {
      expect(aboutContent).toContain('臺灣銀行');
    });

    it('should mention update frequency', () => {
      expect(aboutContent).toContain('5 分鐘');
    });
  });

  describe('Authoritativeness', () => {
    const llmsPath = resolve(PUBLIC_PATH, 'llms.txt');
    const llmsContent = readFile(llmsPath);

    it('should cite official data source', () => {
      expect(llmsContent).toContain('臺灣銀行');
    });

    it('should mention test coverage for credibility', () => {
      expect(llmsContent).toContain('覆蓋率');
    });

    it('should mention performance scores', () => {
      expect(llmsContent).toContain('Lighthouse');
    });
  });

  describe('Trustworthiness', () => {
    const llmsPath = resolve(PUBLIC_PATH, 'llms.txt');
    const llmsContent = readFile(llmsPath);

    it('should have open source license mention', () => {
      expect(llmsContent).toContain('GPL-3.0');
    });

    it('should have contact information', () => {
      expect(llmsContent).toContain('Contact');
    });

    it('should be transparent about data source', () => {
      expect(llmsContent).toContain('100%');
      expect(llmsContent).toContain('臺灣銀行');
    });
  });
});
