/**
 * JSON-LD Tests
 * [BDD:2025-12-29] 結構化數據測試
 */

import { describe, it, expect } from 'vitest';
import {
  getJsonLdForRoute,
  jsonLdToScriptTags,
  buildBreadcrumbSchema,
  buildQuizSchema,
  buildLearningSchema,
} from './jsonld';

describe('getJsonLdForRoute', () => {
  const buildTime = '2025-12-29T00:00:00.000Z';

  describe('當路由為首頁時', () => {
    it('應該返回基礎 JSON-LD 數據', () => {
      const result = getJsonLdForRoute('/', buildTime);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((item) => item['@type'] === 'WebApplication')).toBe(true);
      expect(result.some((item) => item['@type'] === 'Organization')).toBe(true);
      expect(result.some((item) => item['@type'] === 'WebSite')).toBe(true);
    });

    it('應該包含 LearningResource schema', () => {
      const result = getJsonLdForRoute('/', buildTime);

      expect(result.some((item) => item['@type'] === 'LearningResource')).toBe(true);
    });

    it('應該包含 BreadcrumbList schema', () => {
      const result = getJsonLdForRoute('/', buildTime);

      expect(result.some((item) => item['@type'] === 'BreadcrumbList')).toBe(true);
    });
  });

  describe('當路由為測驗頁時', () => {
    it('應該包含 Quiz schema', () => {
      const result = getJsonLdForRoute('/quiz/', buildTime);

      expect(result.some((item) => item['@type'] === 'Quiz')).toBe(true);
    });

    it('應該包含正確的麵包屑導航', () => {
      const result = getJsonLdForRoute('/quiz/', buildTime);
      const breadcrumb = result.find((item) => item['@type'] === 'BreadcrumbList');

      expect(breadcrumb).toBeDefined();
      const items = (breadcrumb as { itemListElement?: unknown[] })?.itemListElement;
      expect(items).toHaveLength(2);
    });
  });
});

describe('jsonLdToScriptTags', () => {
  it('應該生成正確的 script 標籤', () => {
    const jsonLd = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Test' }];

    const result = jsonLdToScriptTags(jsonLd);

    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain('</script>');
    expect(result).toContain('"@context":"https://schema.org"');
  });

  it('應該處理多個 JSON-LD 物件', () => {
    const jsonLd = [{ '@type': 'WebSite' }, { '@type': 'Organization' }];

    const result = jsonLdToScriptTags(jsonLd);

    expect(result.match(/<script/g)?.length).toBe(2);
  });
});

describe('buildBreadcrumbSchema', () => {
  it('應該生成正確的麵包屑結構', () => {
    const breadcrumbs = [
      { name: '首頁', url: '/' },
      { name: '測驗', url: '/quiz/' },
    ];

    const result = buildBreadcrumbSchema(breadcrumbs);

    expect(result['@type']).toBe('BreadcrumbList');
    expect((result.itemListElement as unknown[]).length).toBe(2);
  });
});

describe('buildQuizSchema', () => {
  it('應該生成正確的測驗 schema', () => {
    const result = buildQuizSchema();

    expect(result['@type']).toBe('Quiz');
    expect(result.name).toBe('地震知識測驗');
    expect(result.hasPart).toBeDefined();
  });
});

describe('buildLearningSchema', () => {
  it('應該生成正確的學習資源 schema', () => {
    const result = buildLearningSchema();

    expect(result['@type']).toBe('LearningResource');
    expect(result.teaches).toContain('地震成因與板塊運動');
    expect(result.isAccessibleForFree).toBe(true);
  });
});
