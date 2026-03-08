/** JSON-LD 結構化資料測試 - 驗證 SEOHelmet 統一管理 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('JSON-LD Structured Data (SEOHelmet Architecture)', () => {
  describe('🟢 RateWise.tsx 不應該直接使用 SEO 元件（由 routes.tsx 外層管理）', () => {
    const rateWisePath = resolve(__dirname, 'features/ratewise/RateWise.tsx');
    const rateWiseContent = readFileSync(rateWisePath, 'utf-8');

    it('should NOT import SEOHelmet in RateWise.tsx', () => {
      expect(rateWiseContent).not.toContain('import { SEOHelmet } from');
    });

    it('should NOT use <SEOHelmet> component in RateWise.tsx', () => {
      expect(rateWiseContent).not.toContain('<SEOHelmet');
    });
  });

  describe('🟢 index.html 不應該包含 JSON-LD（由 SEOHelmet 管理）', () => {
    const indexHtmlPath = resolve(__dirname, '../index.html');
    const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

    it('should NOT have any JSON-LD in index.html', () => {
      expect(indexHtmlContent).not.toContain('<script type="application/ld+json">');
    });

    it('should NOT include homepage-only schemas in index.html', () => {
      expect(indexHtmlContent).not.toContain('"@type": "HowTo"');
      expect(indexHtmlContent).not.toContain('"@type": "FAQPage"');
      expect(indexHtmlContent).not.toContain('"@type": "Article"');
    });
  });

  describe('🟢 SEO 層負責所有 JSON-LD 生成（SEOHelmet + seo-metadata）', () => {
    const seoHelmetPath = resolve(__dirname, 'components/SEOHelmet.tsx');
    const seoMetadataPath = resolve(__dirname, 'config/seo-metadata.ts');
    const seoHelmetContent = readFileSync(seoHelmetPath, 'utf-8');
    const seoMetadataContent = readFileSync(seoMetadataPath, 'utf-8');
    const combinedContent = seoHelmetContent + seoMetadataContent;

    it('should have SoftwareApplication schema in SEO layer', () => {
      expect(combinedContent).toContain("'@type': 'SoftwareApplication'");
    });

    it('should have Organization schema in SEO layer', () => {
      expect(combinedContent).toContain("'@type': 'Organization'");
    });

    it('should have WebSite schema in SEO layer', () => {
      expect(combinedContent).toContain("'@type': 'WebSite'");
    });

    it('should NOT define FAQPage schema builder in SEOHelmet', () => {
      expect(seoHelmetContent).not.toContain('buildFaqSchema');
      expect(seoHelmetContent).not.toContain("'@type': 'FAQPage'");
    });
  });

  describe('🟢 Homepage JSON-LD 與內容 SSOT', () => {
    const seoMetadataPath = resolve(__dirname, 'config/seo-metadata.ts');
    const seoMetadata = readFileSync(seoMetadataPath, 'utf-8');

    it('should define HowTo and FAQ content in seo-metadata.ts', () => {
      expect(seoMetadata).toContain('HOMEPAGE_HOW_TO');
      expect(seoMetadata).toContain('HOMEPAGE_FAQ_CONTENT');
      expect(seoMetadata).toContain("'@type': 'ImageObject'");
    });

    it('should keep FAQ content out of FAQPage rich result builder', () => {
      expect(seoMetadata).toContain('faqContent');
      expect(seoMetadata).not.toContain('faq: [...HOMEPAGE_FAQ_CONTENT]');
    });
  });

  describe('🟢 FAQ prerender 不應輸出 FAQPage', () => {
    const faqHtmlPath = resolve(__dirname, '../dist/faq/index.html');

    it('FAQ static HTML should not contain FAQPage JSON-LD after build', () => {
      if (!existsSync(faqHtmlPath)) {
        return;
      }

      const faqHtml = readFileSync(faqHtmlPath, 'utf-8');
      expect(faqHtml).not.toContain('"@type":"FAQPage"');
    });
  });

  describe('🟢 SEOHelmet 應該用於子頁面', () => {
    const faqPath = resolve(__dirname, 'pages/FAQ.tsx');
    const aboutPath = resolve(__dirname, 'pages/About.tsx');
    const notFoundPath = resolve(__dirname, 'pages/NotFound.tsx');

    const faqContent = readFileSync(faqPath, 'utf-8');
    const aboutContent = readFileSync(aboutPath, 'utf-8');
    const notFoundContent = readFileSync(notFoundPath, 'utf-8');

    it('FAQ page should use SEOHelmet', () => {
      expect(faqContent).toContain('<SEOHelmet');
    });

    it('FAQ page should not pass FAQ rich result prop', () => {
      expect(faqContent).not.toContain('faq={');
    });

    it('About page should use SEOHelmet', () => {
      expect(aboutContent).toContain('<SEOHelmet');
    });

    it('NotFound page should use SEOHelmet', () => {
      expect(notFoundContent).toContain('<SEOHelmet');
    });
  });
});
