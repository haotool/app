/**
 * JSON-LD Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { describe, it, expect } from 'vitest';
import {
  getJsonLdForRoute,
  jsonLdToScriptTags,
  buildBreadcrumbSchema,
  buildFaqSchema,
  BASE_JSON_LD,
} from './jsonld';

describe('JSON-LD Module', () => {
  describe('BASE_JSON_LD', () => {
    it('應該包含 WebApplication schema', () => {
      const webApp = BASE_JSON_LD.find((item) => item['@type'] === 'WebApplication');
      expect(webApp).toBeDefined();
      expect(webApp?.name).toBe('Quake-School 地震防災教室');
    });

    it('應該包含 Organization schema', () => {
      const org = BASE_JSON_LD.find((item) => item['@type'] === 'Organization');
      expect(org).toBeDefined();
      expect(org?.name).toBe('haotool');
    });

    it('應該包含 WebSite schema', () => {
      const site = BASE_JSON_LD.find((item) => item['@type'] === 'WebSite');
      expect(site).toBeDefined();
      expect(site?.inLanguage).toBe('zh-TW');
    });
  });

  describe('buildBreadcrumbSchema', () => {
    it('應該生成正確的 BreadcrumbList schema', () => {
      const breadcrumbs = [
        { name: '首頁', url: 'https://app.haotool.org/quake-school/' },
        { name: '關於', url: 'https://app.haotool.org/quake-school/about/' },
      ];

      const schema = buildBreadcrumbSchema(breadcrumbs);

      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
      expect(schema.itemListElement[0]?.position).toBe(1);
      expect(schema.itemListElement[1]?.position).toBe(2);
    });
  });

  describe('buildFaqSchema', () => {
    it('應該生成正確的 FAQPage schema', () => {
      const faq = [
        { question: '問題1？', answer: '答案1' },
        { question: '問題2？', answer: '答案2' },
      ];

      const schema = buildFaqSchema(faq, 'https://app.haotool.org/quake-school/faq/');

      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]?.['@type']).toBe('Question');
      expect(schema.mainEntity[0]?.name).toBe('問題1？');
    });
  });

  describe('getJsonLdForRoute', () => {
    it('首頁應該包含 Breadcrumb 和 ImageObject', () => {
      const jsonLd = getJsonLdForRoute('/', '2025-12-29');

      const breadcrumb = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
      const image = jsonLd.find((item) => item['@type'] === 'ImageObject');

      expect(breadcrumb).toBeDefined();
      expect(image).toBeDefined();
    });

    it('FAQ 頁面應該包含 FAQPage schema', () => {
      const jsonLd = getJsonLdForRoute('/faq', '2025-12-29');

      const faqPage = jsonLd.find((item) => item['@type'] === 'FAQPage');

      expect(faqPage).toBeDefined();
    });

    it('關於頁面應該包含正確的 Breadcrumb', () => {
      const jsonLd = getJsonLdForRoute('/about', '2025-12-29');

      const breadcrumb = jsonLd.find((item) => item['@type'] === 'BreadcrumbList') as
        | { itemListElement: unknown[] }
        | undefined;

      expect(breadcrumb).toBeDefined();
      expect(breadcrumb?.itemListElement).toHaveLength(2);
    });
  });

  describe('jsonLdToScriptTags', () => {
    it('應該生成正確的 script 標籤', () => {
      const jsonLd = [{ '@type': 'Test', name: 'test' }];

      const result = jsonLdToScriptTags(jsonLd);

      expect(result).toContain('<script type="application/ld+json">');
      expect(result).toContain('</script>');
      expect(result).toContain('"@type":"Test"');
    });
  });
});
