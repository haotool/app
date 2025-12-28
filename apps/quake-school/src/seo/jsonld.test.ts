/**
 * JSON-LD 測試
 * [BDD 測試策略]
 */
import { describe, it, expect } from 'vitest';
import {
  getJsonLdForRoute,
  jsonLdToScriptTags,
  organizationSchema,
  webApplicationSchema,
} from './jsonld';

describe('SEO JSON-LD', () => {
  describe('organizationSchema', () => {
    it('應該有正確的 @type', () => {
      expect(organizationSchema['@type']).toBe('Organization');
    });

    it('應該有必要的屬性', () => {
      expect(organizationSchema).toHaveProperty('name');
      expect(organizationSchema).toHaveProperty('url');
      expect(organizationSchema).toHaveProperty('logo');
    });
  });

  describe('webApplicationSchema', () => {
    it('應該有正確的 @type', () => {
      expect(webApplicationSchema['@type']).toBe('WebApplication');
    });

    it('應該有正確的應用程式類別', () => {
      expect(webApplicationSchema['applicationCategory']).toBe('EducationalApplication');
    });
  });

  describe('getJsonLdForRoute', () => {
    it('應該為首頁返回 Organization 和 WebApplication schema', () => {
      // Given: 首頁路由
      const buildTime = new Date().toISOString();

      // When: 獲取 JSON-LD
      const jsonLd = getJsonLdForRoute('/', buildTime);

      // Then: 應該包含兩個 schema
      expect(jsonLd).toHaveLength(2);
      expect(jsonLd[0]?.['@type']).toBe('Organization');
      expect(jsonLd[1]?.['@type']).toBe('WebApplication');
    });

    it('應該為課程頁面返回 Course schema', () => {
      // Given: 課程頁面路由
      const buildTime = new Date().toISOString();

      // When: 獲取 JSON-LD
      const jsonLd = getJsonLdForRoute('/lessons', buildTime);

      // Then: 應該包含 Course schema
      expect(jsonLd.some((s) => s['@type'] === 'Course')).toBe(true);
    });
  });

  describe('jsonLdToScriptTags', () => {
    it('應該生成正確的 script 標籤', () => {
      // Given: JSON-LD 數據
      const jsonLd = [organizationSchema];

      // When: 轉換為 script 標籤
      const scriptTags = jsonLdToScriptTags(jsonLd);

      // Then: 應該是有效的 script 標籤
      expect(scriptTags).toContain('<script type="application/ld+json">');
      expect(scriptTags).toContain('</script>');
      expect(scriptTags).toContain('"@type":"Organization"');
    });
  });
});
