/**
 * index.html BDD Tests - Static SEO Meta Tags Verification
 *
 * BDD 重構測試：驗證 index.html 包含完整的靜態 SEO meta tags
 *
 * 測試策略：
 * - ✅ 首頁應該包含靜態 meta tags（description, keywords, robots）
 * - ✅ 首頁應該包含 Open Graph tags（og:*）
 * - ✅ 首頁應該包含 Twitter Card tags（twitter:*）
 * - ✅ 首頁應該包含 canonical URL
 * - ✅ 首頁應該包含 JSON-LD structured data
 *
 * 參考：fix/seo-phase2a-bdd-approach
 * 依據：[SEO 審查報告 2025-11-25] Google 爬蟲讀取靜態 HTML
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('index.html - Static SEO Meta Tags (BDD Refactor)', () => {
  // 正確的路徑：從 src/ 目錄往上一層到項目根目錄
  const indexHtmlPath = resolve(__dirname, '..', 'index.html');
  const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

  // Debug: 打印文件路徑和內容長度
  console.log('📁 index.html路徑:', indexHtmlPath);
  console.log('📏 文件長度:', indexHtmlContent.length, 'characters');
  console.log('🔍 包含 description meta tag?', indexHtmlContent.includes('name="description"'));

  describe('🔵 REFACTOR: 基礎 SEO Meta Tags', () => {
    it('should have <html lang="zh-Hant"> attribute', () => {
      expect(indexHtmlContent).toContain('<html lang="zh-Hant">');
    });

    it('should have meta description tag', () => {
      // 考慮多行格式和空白字元
      expect(indexHtmlContent).toMatch(/name="description"/);
      expect(indexHtmlContent).toContain('RateWise 提供即時匯率換算服務');
    });

    it('should have meta keywords tag', () => {
      // 考慮多行格式和空白字元
      expect(indexHtmlContent).toMatch(/name="keywords"/);
      expect(indexHtmlContent).toContain('匯率好工具');
    });

    it('should have meta robots tag with full directives', () => {
      // 考慮多行格式和空白字元
      expect(indexHtmlContent).toMatch(/name="robots"/);
      expect(indexHtmlContent).toContain('index, follow');
      expect(indexHtmlContent).toContain('max-image-preview:large');
    });

    it('should have canonical URL', () => {
      expect(indexHtmlContent).toContain('<link rel="canonical"');
      expect(indexHtmlContent).toContain('https://app.haotool.org/ratewise');
    });
  });

  describe('🔵 REFACTOR: Open Graph Tags', () => {
    it('should have og:type tag', () => {
      expect(indexHtmlContent).toContain('<meta property="og:type" content="website"');
    });

    it('should have og:url tag', () => {
      expect(indexHtmlContent).toContain('<meta property="og:url"');
      expect(indexHtmlContent).toContain('https://app.haotool.org/ratewise');
    });

    it('should have og:title tag', () => {
      expect(indexHtmlContent).toContain('<meta property="og:title"');
      expect(indexHtmlContent).toContain('RateWise');
    });

    it('should have og:description tag', () => {
      // 考慮多行格式和空白字元
      expect(indexHtmlContent).toMatch(/property="og:description"/);
    });

    it('should have og:image tag with correct dimensions', () => {
      expect(indexHtmlContent).toContain('<meta property="og:image"');
      expect(indexHtmlContent).toContain('og-image.png');
      expect(indexHtmlContent).toContain('<meta property="og:image:width" content="1200"');
      expect(indexHtmlContent).toContain('<meta property="og:image:height" content="630"');
    });

    it('should have og:locale tag', () => {
      expect(indexHtmlContent).toContain('<meta property="og:locale" content="zh_TW"');
    });
  });

  describe('🔵 REFACTOR: Twitter Card Tags', () => {
    it('should have twitter:card tag', () => {
      expect(indexHtmlContent).toContain('<meta name="twitter:card" content="summary_large_image"');
    });

    it('should have twitter:title tag', () => {
      expect(indexHtmlContent).toContain('<meta name="twitter:title"');
      expect(indexHtmlContent).toContain('RateWise');
    });

    it('should have twitter:description tag', () => {
      // 考慮多行格式和空白字元
      expect(indexHtmlContent).toMatch(/name="twitter:description"/);
    });

    it('should have twitter:image tag', () => {
      expect(indexHtmlContent).toContain('<meta name="twitter:image"');
      expect(indexHtmlContent).toContain('twitter-image.png');
    });
  });

  describe('🔵 REFACTOR: JSON-LD Structured Data', () => {
    it('should have JSON-LD script tag', () => {
      expect(indexHtmlContent).toContain('<script type="application/ld+json">');
    });

    it('should have WebApplication schema', () => {
      expect(indexHtmlContent).toContain('"@type": "WebApplication"');
      expect(indexHtmlContent).toContain('"name": "RateWise"');
      expect(indexHtmlContent).toContain('"applicationCategory": "FinanceApplication"');
    });

    it('should have Organization schema', () => {
      expect(indexHtmlContent).toContain('"@type": "Organization"');
      expect(indexHtmlContent).toContain('"name": "RateWise"');
    });
  });

  describe('🔵 REFACTOR: PWA Meta Tags (保留)', () => {
    it('should retain PWA essential tags', () => {
      expect(indexHtmlContent).toContain('<meta name="theme-color" content="#8B5CF6"');
      expect(indexHtmlContent).toContain('<meta name="viewport"');
      expect(indexHtmlContent).toContain('<link rel="apple-touch-icon"');
    });
  });
});
