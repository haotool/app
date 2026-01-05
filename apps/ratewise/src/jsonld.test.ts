/**
 * JSON-LD Structured Data BDD Tests - SEO Phase 2B-1
 *
 * BDD 測試：驗證 JSON-LD 結構化數據沒有重複定義
 *
 * 測試策略：
 * - 🔴 RateWise.tsx（首頁元件）不應該使用 SEOHelmet（避免動態 JSON-LD 重複）
 * - 🔴 index.html 應該只保留站點層級 JSON-LD（WebApplication, Organization, WebSite）
 * - 🔴 首頁專屬 JSON-LD (HowTo/FAQ/Article) 必須僅在首頁輸出
 * - 🔴 確認沒有重複的 @type 定義（WebApplication, Organization, WebSite）
 *
 * 參考：fix/seo-phase2b-jsonld-cleanup
 * 依據：[SEO 審查報告 2025-11-25] JSON-LD 重複定義問題
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('JSON-LD Structured Data (BDD)', () => {
  describe('🔴 RED: RateWise.tsx 不應該使用 SEOHelmet', () => {
    const rateWisePath = resolve(__dirname, 'features/ratewise/RateWise.tsx');
    const rateWiseContent = readFileSync(rateWisePath, 'utf-8');

    it('should NOT import SEOHelmet in RateWise.tsx', () => {
      // 🔴 紅燈：首頁元件不應該 import SEOHelmet
      expect(rateWiseContent).not.toContain('import { SEOHelmet } from');
    });

    it('should NOT use <SEOHelmet> component in RateWise.tsx', () => {
      // 🔴 紅燈：首頁元件不應該使用 <SEOHelmet>
      expect(rateWiseContent).not.toContain('<SEOHelmet');
    });
  });

  describe('🔴 RED: index.html 應該只保留站點層級 JSON-LD', () => {
    const indexHtmlPath = resolve(__dirname, '../index.html');
    const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

    it('should have WebApplication schema', () => {
      // 🔴 紅燈：應該包含 WebApplication
      expect(indexHtmlContent).toContain('"@type": "WebApplication"');
    });

    it('should have Organization schema', () => {
      // 🔴 紅燈：應該包含 Organization
      expect(indexHtmlContent).toContain('"@type": "Organization"');
    });

    it('should have WebSite schema', () => {
      // 🔴 紅燈：應該包含 WebSite
      expect(indexHtmlContent).toContain('"@type": "WebSite"');
    });

    it('should have complete WebApplication with all required fields', () => {
      // 🔴 紅燈：WebApplication 應該包含所有必要欄位
      expect(indexHtmlContent).toContain('"alternateName"');
      expect(indexHtmlContent).toContain('"applicationCategory"');
      expect(indexHtmlContent).toContain('"featureList"');
      expect(indexHtmlContent).toContain('"screenshot"');
    });

    it('should have optimized logo path in Organization schema', () => {
      // 🔴 紅燈：Organization 應該使用優化後的 logo
      expect(indexHtmlContent).toContain('optimized/logo-512w.png');
    });

    it('should have SearchAction in WebSite schema', () => {
      // 🔴 紅燈：WebSite 應該包含 SearchAction
      expect(indexHtmlContent).toContain('"@type": "SearchAction"');
      expect(indexHtmlContent).toContain('"query-input"');
    });

    it('should NOT include homepage-only schemas', () => {
      // 🔴 紅燈：非首頁不應包含 HowTo/FAQ/Article
      expect(indexHtmlContent).not.toContain('"@type": "HowTo"');
      expect(indexHtmlContent).not.toContain('"@type": "FAQPage"');
      expect(indexHtmlContent).not.toContain('"@type": "Article"');
    });
  });

  describe('🔴 RED: 確認沒有重複的 @type 定義', () => {
    const indexHtmlPath = resolve(__dirname, '../index.html');
    const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

    it('should have exactly ONE WebApplication schema in index.html', () => {
      // 🔴 紅燈：index.html 應該只有一個 WebApplication
      const matches = indexHtmlContent.match(/"@type":\s*"WebApplication"/g);
      expect(matches).toBeTruthy();
      expect(matches?.length).toBe(1);
    });

    it('should have exactly ONE Organization schema in index.html', () => {
      // 🔴 紅燈：index.html 應該只有一個 Organization
      const matches = indexHtmlContent.match(/"@type":\s*"Organization"/g);
      expect(matches).toBeTruthy();
      expect(matches?.length).toBe(1);
    });

    it('should have exactly ONE WebSite schema in index.html', () => {
      // 🔴 紅燈：index.html 應該只有一個 WebSite
      const matches = indexHtmlContent.match(/"@type":\s*"WebSite"/g);
      expect(matches).toBeTruthy();
      expect(matches?.length).toBe(1);
    });
  });

  describe('🔴 RED: Homepage JSON-LD should live in HomeStructuredData', () => {
    const homeStructuredDataPath = resolve(__dirname, 'components/HomeStructuredData.tsx');
    const homeStructuredData = readFileSync(homeStructuredDataPath, 'utf-8');

    it('should define HowTo, FAQPage, and Article schemas', () => {
      // 🔴 紅燈：首頁專屬 schema 必須集中在 HomeStructuredData
      expect(homeStructuredData).toContain("'@type': 'HowTo'");
      expect(homeStructuredData).toContain("'@type': 'FAQPage'");
      expect(homeStructuredData).toContain("'@type': 'Article'");
    });

    it('should include image metadata for homepage Article', () => {
      // 🔴 紅燈：首頁 Article 圖片需包含授權與作者資訊
      expect(homeStructuredData).toContain('acquireLicensePage');
      expect(homeStructuredData).toContain('creator');
      expect(homeStructuredData).toContain('creditText');
      expect(homeStructuredData).toContain('copyrightNotice');
    });
  });

  describe('🔴 RED: SEOHelmet 應該只用於子頁面', () => {
    const faqPath = resolve(__dirname, 'pages/FAQ.tsx');
    const aboutPath = resolve(__dirname, 'pages/About.tsx');
    const notFoundPath = resolve(__dirname, 'pages/NotFound.tsx');

    const faqContent = readFileSync(faqPath, 'utf-8');
    const aboutContent = readFileSync(aboutPath, 'utf-8');
    const notFoundContent = readFileSync(notFoundPath, 'utf-8');

    it('FAQ page should use SEOHelmet', () => {
      // ✅ FAQ 頁面應該使用 SEOHelmet
      expect(faqContent).toContain('<SEOHelmet');
    });

    it('About page should use SEOHelmet', () => {
      // ✅ About 頁面應該使用 SEOHelmet
      expect(aboutContent).toContain('<SEOHelmet');
    });

    it('NotFound page should use SEOHelmet', () => {
      // ✅ 404 頁面應該使用 SEOHelmet
      expect(notFoundContent).toContain('<SEOHelmet');
    });
  });
});
