import { getJsonLdForRoute, jsonLdToScriptTags } from '@app/park-keeper/seo/jsonld';

describe('jsonld module', () => {
  const buildTime = '2025-01-15T12:00:00.000Z';

  describe('getJsonLdForRoute', () => {
    it('should return breadcrumb + webApp + FAQ (3 schemas) for "/"', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      expect(schemas).toHaveLength(3);
      const types = schemas.map((s) => s['@type']);
      expect(types).toContain('BreadcrumbList');
      expect(types).toContain('WebApplication');
      expect(types).toContain('FAQPage');
    });

    it('should return only breadcrumb (1 schema) for "/about/"', () => {
      const schemas = getJsonLdForRoute('/about/', buildTime);
      expect(schemas).toHaveLength(1);
      expect(schemas[0]!['@type']).toBe('BreadcrumbList');
    });

    it('should return only breadcrumb (1 schema) for "/settings/"', () => {
      const schemas = getJsonLdForRoute('/settings/', buildTime);
      expect(schemas).toHaveLength(1);
      expect(schemas[0]!['@type']).toBe('BreadcrumbList');
    });

    it('breadcrumb for "/" should have 2 items', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      expect(breadcrumb).toBeDefined();
      const items = breadcrumb!['itemListElement'] as unknown[];
      expect(items).toHaveLength(2);
    });

    it('breadcrumb for "/about/" should have 3 items', () => {
      const schemas = getJsonLdForRoute('/about/', buildTime);
      const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      expect(breadcrumb).toBeDefined();
      const items = breadcrumb!['itemListElement'] as unknown[];
      expect(items).toHaveLength(3);
    });
  });

  describe('jsonLdToScriptTags', () => {
    it('should produce valid script tags with type="application/ld+json"', () => {
      const schemas = [{ '@type': 'Test', name: 'Test' }];
      const result = jsonLdToScriptTags(schemas);
      expect(result).toContain('type="application/ld+json"');
      expect(result).toContain('<script');
      expect(result).toContain('</script>');
      expect(result).toContain('"@type":"Test"');
    });
  });

  describe('WebApplication schema', () => {
    it('should have correct @type and name', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const webApp = schemas.find((s) => s['@type'] === 'WebApplication');
      expect(webApp).toBeDefined();
      expect(webApp!['@type']).toBe('WebApplication');
      expect(webApp!['name']).toBe('停車好工具');
    });
  });

  describe('FAQ schema', () => {
    it('should have @type FAQPage with mainEntity array', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const faq = schemas.find((s) => s['@type'] === 'FAQPage');
      expect(faq).toBeDefined();
      expect(faq!['@type']).toBe('FAQPage');
      expect(Array.isArray(faq!['mainEntity'])).toBe(true);
      expect((faq!['mainEntity'] as unknown[]).length).toBeGreaterThan(0);
    });
  });
});
