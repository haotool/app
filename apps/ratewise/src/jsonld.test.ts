/** JSON-LD 結構化資料測試 - 驗證 SEOHelmet 統一管理 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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

    it('should NOT import HomeStructuredData in RateWise.tsx', () => {
      // [2026-01-30] HomeStructuredData 移至 routes.tsx ClientOnly 外層
      expect(rateWiseContent).not.toContain('import { HomeStructuredData } from');
    });

    it('should NOT use <HomeStructuredData> in RateWise.tsx', () => {
      expect(rateWiseContent).not.toContain('<HomeStructuredData');
    });

    it('should NOT define HOMEPAGE_FAQ in RateWise.tsx', () => {
      // [2026-01-30] HOMEPAGE_FAQ 移至 constants.ts，由 routes.tsx 匯入
      expect(rateWiseContent).not.toContain('HOMEPAGE_FAQ');
    });
  });

  describe('🟢 index.html 不應該包含 JSON-LD（由 SEOHelmet 管理）', () => {
    const indexHtmlPath = resolve(__dirname, '../index.html');
    const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

    it('should NOT have any JSON-LD in index.html', () => {
      // [2026-01-29] 這是 C2 Critical Issue 的修復
      // index.html 不應該包含任何 JSON-LD，避免重複 schema
      expect(indexHtmlContent).not.toContain('<script type="application/ld+json">');
    });

    it('should NOT have WebApplication schema in index.html', () => {
      expect(indexHtmlContent).not.toContain('"@type": "WebApplication"');
    });

    it('should NOT have Organization schema in index.html', () => {
      expect(indexHtmlContent).not.toContain('"@type": "Organization"');
    });

    it('should NOT have WebSite schema in index.html', () => {
      expect(indexHtmlContent).not.toContain('"@type": "WebSite"');
    });

    it('should NOT have SearchAction in index.html', () => {
      // [2026-01-29] H4 fix: SearchAction 被移除（因為沒有 ?q= 搜尋功能）
      expect(indexHtmlContent).not.toContain('"@type": "SearchAction"');
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

    it('should NOT have SearchAction in SEO layer', () => {
      expect(combinedContent).not.toContain("'@type': 'SearchAction'");
    });
  });

  describe('🟢 Homepage JSON-LD should live in HomeStructuredData', () => {
    const homeStructuredDataPath = resolve(__dirname, 'components/HomeStructuredData.tsx');
    const homeStructuredData = readFileSync(homeStructuredDataPath, 'utf-8');

    it('should define HowTo, FAQPage, and Article schemas', () => {
      // 首頁專屬 schema 集中在 HomeStructuredData
      expect(homeStructuredData).toContain("'@type': 'HowTo'");
      expect(homeStructuredData).toContain("'@type': 'FAQPage'");
      expect(homeStructuredData).toContain("'@type': 'Article'");
    });

    it('should include publisher and image for homepage Article', () => {
      expect(homeStructuredData).toContain("'@type': 'Organization'");
      expect(homeStructuredData).toContain('publisher');
      expect(homeStructuredData).toContain('image: OG_IMAGE_URL');
      expect(homeStructuredData).toContain('datePublished');
      expect(homeStructuredData).toContain('dateModified');
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

    it('About page should use SEOHelmet', () => {
      expect(aboutContent).toContain('<SEOHelmet');
    });

    it('NotFound page should use SEOHelmet', () => {
      expect(notFoundContent).toContain('<SEOHelmet');
    });
  });
});
