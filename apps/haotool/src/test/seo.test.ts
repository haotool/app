/**
 * SEO Tests
 */
import { describe, it, expect } from 'vitest';
import { getJsonLdForRoute, jsonLdToScriptTags } from '../seo/jsonld';
import { getMetaTagsForRoute } from '../seo/meta-tags';

const TEST_BUILD_TIME = '2025-12-13T12:00:00.000Z';
const HAOTOOL_SITE_URL = 'https://haotool.org';

describe('SEO - JSON-LD', () => {
  describe('getJsonLdForRoute', () => {
    it('should return an array of JSON-LD objects', () => {
      const result = getJsonLdForRoute('/', TEST_BUILD_TIME);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include Organization, WebSite, Person, FAQPage and WebPage on home page', () => {
      const result = getJsonLdForRoute('/', TEST_BUILD_TIME);
      const types = result.map((r) => r['@type']);
      expect(types).toContain('Organization');
      expect(types).toContain('WebSite');
      expect(types).toContain('Person');
      expect(types).toContain('FAQPage');
      expect(types).toContain('WebPage');
    });

    it('should include potentialAction in WebSite schema', () => {
      const result = getJsonLdForRoute('/', TEST_BUILD_TIME);
      const website = result.find((r) => r['@type'] === 'WebSite');
      expect(website?.['potentialAction']).toBeDefined();
      expect(website?.['potentialAction']?.['@type']).toBe('SearchAction');
    });

    it('should include @id references for linked schemas', () => {
      const result = getJsonLdForRoute('/', TEST_BUILD_TIME);
      const org = result.find((r) => r['@type'] === 'Organization');
      const person = result.find((r) => r['@type'] === 'Person');
      expect(org?.['@id']).toContain('#organization');
      expect(person?.['@id']).toContain('#person');
    });

    it('should include FAQPage with questions about haotool', () => {
      const result = getJsonLdForRoute('/', TEST_BUILD_TIME);
      const faq = result.find((r) => r['@type'] === 'FAQPage');
      expect(faq?.['mainEntity']).toBeDefined();
      expect(faq?.['mainEntity'].length).toBeGreaterThanOrEqual(4);
      expect(faq?.['mainEntity'][0]?.name).toContain('haotool');
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

    it('should include park-keeper in projects CollectionPage', () => {
      const result = getJsonLdForRoute('/projects/', TEST_BUILD_TIME);
      const collection = result.find((r) => r['@type'] === 'CollectionPage');
      const itemList = collection?.['mainEntity']?.itemListElement;

      expect(Array.isArray(itemList)).toBe(true);
      expect(
        itemList?.some(
          (item: { url: string }) => item.url === 'https://app.haotool.org/park-keeper/',
        ),
      ).toBe(true);
    });

    it('should include ProfilePage for about route', () => {
      const result = getJsonLdForRoute('/about/', TEST_BUILD_TIME);
      const profile = result.find((r) => r['@type'] === 'ProfilePage');
      expect(profile).toBeDefined();
      expect(profile?.['mainEntity']?.['@type']).toBe('Person');
    });

    it('should normalize routes with trailing slashes', () => {
      const result1 = getJsonLdForRoute('/about', TEST_BUILD_TIME);
      const result2 = getJsonLdForRoute('/about/', TEST_BUILD_TIME);
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

    it('should include description meta tag with haotool keywords', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<meta name="description"');
      expect(result).toContain('好工具');
    });

    it('should include canonical link', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<link rel="canonical"');
    });

    it('should include hreflang tags', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('hreflang="zh-TW"');
      expect(result).toContain('hreflang="x-default"');
    });

    it('should include Open Graph tags with image alt', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<meta property="og:type"');
      expect(result).toContain('<meta property="og:title"');
      expect(result).toContain('<meta property="og:description"');
      expect(result).toContain('<meta property="og:url"');
      expect(result).toContain('<meta property="og:image"');
      expect(result).toContain('<meta property="og:image:alt"');
      expect(result).toContain('<meta property="og:updated_time"');
    });

    it('should include Twitter Card tags with image alt', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<meta name="twitter:card"');
      expect(result).toContain('<meta name="twitter:title"');
      expect(result).toContain('<meta name="twitter:description"');
      expect(result).toContain('<meta name="twitter:image:alt"');
    });

    it('should generate correct canonical URLs with trailing slashes', () => {
      const routes = ['/projects/', '/about/', '/contact/'];
      routes.forEach((route) => {
        const result = getMetaTagsForRoute(route, TEST_BUILD_TIME);
        expect(result).toContain(`${HAOTOOL_SITE_URL}${route}`);
      });
    });

    it('should include enhanced robots meta tag', () => {
      const result = getMetaTagsForRoute('/', TEST_BUILD_TIME);
      expect(result).toContain('<meta name="robots"');
      expect(result).toContain('max-image-preview:large');
      expect(result).toContain('max-snippet:-1');
    });
  });
});
