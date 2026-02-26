import { getJsonLdForRoute, jsonLdToScriptTags } from '@app/park-keeper/seo/jsonld';

describe('jsonld module', () => {
  const buildTime = '2025-01-15T12:00:00.000Z';

  describe('getJsonLdForRoute', () => {
    it('should return 6 schemas for "/" (breadcrumb, org, website, webApp, FAQ, howTo)', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      expect(schemas).toHaveLength(6);
      const types = schemas.map((s) => s['@type']);
      expect(types).toContain('BreadcrumbList');
      expect(types).toContain('Organization');
      expect(types).toContain('WebSite');
      expect(types).toContain('WebApplication');
      expect(types).toContain('FAQPage');
      expect(types).toContain('HowTo');
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

    it('should have aggregateRating', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const webApp = schemas.find((s) => s['@type'] === 'WebApplication');
      expect(webApp!['aggregateRating']).toBeDefined();
    });

    it('should have featureList', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const webApp = schemas.find((s) => s['@type'] === 'WebApplication');
      expect(Array.isArray(webApp!['featureList'])).toBe(true);
      expect((webApp!['featureList'] as unknown[]).length).toBeGreaterThan(5);
    });
  });

  describe('Organization schema', () => {
    it('should have @type Organization with name and url', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const org = schemas.find((s) => s['@type'] === 'Organization');
      expect(org).toBeDefined();
      expect(org!['name']).toBe('haotool.org');
      expect(org!['url']).toContain('haotool.org');
    });
  });

  describe('WebSite schema', () => {
    it('should have potentialAction for SearchAction', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const website = schemas.find((s) => s['@type'] === 'WebSite');
      expect(website).toBeDefined();
      expect(website!['potentialAction']).toBeDefined();
    });
  });

  describe('HowTo schema', () => {
    it('should have 3 steps', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const howTo = schemas.find((s) => s['@type'] === 'HowTo');
      expect(howTo).toBeDefined();
      expect(Array.isArray(howTo!['step'])).toBe(true);
      expect((howTo!['step'] as unknown[]).length).toBe(3);
    });
  });

  describe('FAQ schema', () => {
    it('should have @type FAQPage with 6+ questions', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const faq = schemas.find((s) => s['@type'] === 'FAQPage');
      expect(faq).toBeDefined();
      expect(faq!['@type']).toBe('FAQPage');
      expect(Array.isArray(faq!['mainEntity'])).toBe(true);
      expect((faq!['mainEntity'] as unknown[]).length).toBeGreaterThanOrEqual(6);
    });

    it('first FAQ should target "台灣最好用的停車工具"', () => {
      const schemas = getJsonLdForRoute('/', buildTime);
      const faq = schemas.find((s) => s['@type'] === 'FAQPage');
      const entities = faq!['mainEntity'] as Record<string, unknown>[];
      expect(entities[0]!['name']).toContain('台灣最好用');
    });
  });
});
