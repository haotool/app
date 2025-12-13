/**
 * SEO Tests
 */
import { describe, it, expect } from 'vitest';
import { getJsonLdForRoute, jsonLdToScriptTags } from '../seo/jsonld';
import { getMetaTagsForRoute } from '../seo/meta-tags';

const TEST_BUILD_TIME = '2025-12-13T12:00:00.000Z';

describe('SEO - JSON-LD', () => {
  describe('getJsonLdForRoute', () => {
    it('should return an array of JSON-LD objects', () => {
      const result = getJsonLdForRoute('/', TEST_BUILD_TIME);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include WebSite and Person schemas on home page', () => {
      const result = getJsonLdForRoute('/', TEST_BUILD_TIME);
      const types = result.map((r) => r['@type']);
      expect(types).toContain('WebSite');
      expect(types).toContain('Person');
      expect(types).toContain('WebPage');
    });

    it('should include WebPage schema for all routes', () => {
      const routes = ['/', '/projects/', '/about/', '/contact/'];
      routes.forEach((route) => {
        const result = getJsonLdForRoute(route, TEST_BUILD_TIME);
        const webPage = result.find((r) => r['@type'] === 'WebPage');
        expect(webPage).toBeDefined();
      });
    });

    it('should include CollectionPage for projects route', () => {
      const result = getJsonLdForRoute('/projects/', TEST_BUILD_TIME);
      const collection = result.find((r) => r['@type'] === 'CollectionPage');
      expect(collection).toBeDefined();
    });

    it('should normalize routes with trailing slashes', () => {
      const result1 = getJsonLdForRoute('/about', TEST_BUILD_TIME);
      const result2 = getJsonLdForRoute('/about/', TEST_BUILD_TIME);
      // Both should produce the same result
      expect(result1.length).toBe(result2.length);
    });
  });

  describe('jsonLdToScriptTags', () => {
    it('should convert JSON-LD to script tags', () => {
      const jsonLd = getJsonLdForRoute('/', TEST_BUILD_TIME);
      const scriptTags = jsonLdToScriptTags(jsonLd);
      expect(scriptTags).toContain('<script type="application/ld+json">');
      expect(scriptTags).toContain('</script>');
    });

    it('should include @context in output', () => {
      const jsonLd = getJsonLdForRoute('/', TEST_BUILD_TIME);
      const scriptTags = jsonLdToScriptTags(jsonLd);
      expect(scriptTags).toContain('https://schema.org');
    });
  });
});

describe('SEO - Meta Tags', () => {
  describe('getMetaTagsForRoute', () => {
    it('should return a string of meta tags', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include description meta tag', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<meta name="description"');
    });

    it('should include canonical link', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<link rel="canonical"');
    });

    it('should include Open Graph tags', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<meta property="og:type"');
      expect(result).toContain('<meta property="og:title"');
      expect(result).toContain('<meta property="og:description"');
      expect(result).toContain('<meta property="og:url"');
      expect(result).toContain('<meta property="og:image"');
    });

    it('should include Twitter Card tags', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<meta name="twitter:card"');
      expect(result).toContain('<meta name="twitter:title"');
      expect(result).toContain('<meta name="twitter:description"');
    });

    it('should generate correct canonical URLs with trailing slashes', () => {
      const routes = ['/projects/', '/about/', '/contact/'];
      routes.forEach((route) => {
        const result = getMetaTagsForRoute(route, TEST_BUILD_TIME);
        expect(result).toContain(`https://app.haotool.org${route}`);
      });
    });

    it('should include robots meta tag', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<meta name="robots"');
      expect(result).toContain('index, follow');
    });
  });
});
