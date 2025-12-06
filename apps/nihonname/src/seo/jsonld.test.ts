/**
 * JSON-LD Structured Data Tests
 * [BDD:2025-12-06] 提升 jsonld.ts 測試覆蓋率 0% → 100%
 */
import { describe, it, expect } from 'vitest';
import {
  BASE_JSON_LD,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildArticleSchema,
  buildHowToSchema,
  getJsonLdForRoute,
  jsonLdToScriptTags,
} from './jsonld';

describe('jsonld.ts', () => {
  describe('BASE_JSON_LD', () => {
    it('應該包含 WebApplication schema', () => {
      const webApp = BASE_JSON_LD.find((item) => item['@type'] === 'WebApplication');
      expect(webApp).toBeDefined();
      expect(webApp?.name).toBe('NihonName 皇民化改姓生成器');
      expect(webApp?.applicationCategory).toBe('EntertainmentApplication');
    });

    it('應該包含 Organization schema', () => {
      const org = BASE_JSON_LD.find((item) => item['@type'] === 'Organization');
      expect(org).toBeDefined();
      expect(org?.name).toBe('haotool');
      expect(org?.url).toBe('https://haotool.org');
    });

    it('應該包含 WebSite schema', () => {
      const website = BASE_JSON_LD.find((item) => item['@type'] === 'WebSite');
      expect(website).toBeDefined();
      expect(website?.name).toBe('NihonName');
      expect(website?.inLanguage).toBe('zh-TW');
    });

    it('WebApplication 應該包含 featureList', () => {
      const webApp = BASE_JSON_LD.find((item) => item['@type'] === 'WebApplication');
      expect(webApp).toBeDefined();
      if (webApp) {
        expect(webApp.featureList).toBeInstanceOf(Array);
        expect(webApp.featureList!.length).toBeGreaterThan(0);
      }
    });

    it('Organization 應該包含 sameAs 社群連結', () => {
      const org = BASE_JSON_LD.find((item) => item['@type'] === 'Organization');
      expect(org).toBeDefined();
      if (org) {
        expect(org.sameAs).toBeInstanceOf(Array);
        expect(org.sameAs!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('buildBreadcrumbSchema', () => {
    it('應該生成正確的 BreadcrumbList schema', () => {
      const breadcrumbs = [
        { name: '首頁', url: 'https://app.haotool.org/nihonname/' },
        { name: '關於', url: 'about' },
      ];
      const schema = buildBreadcrumbSchema(breadcrumbs);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
    });

    it('應該正確處理相對 URL', () => {
      const breadcrumbs = [{ name: '測試', url: '/test' }];
      const schema = buildBreadcrumbSchema(breadcrumbs);

      const items = schema.itemListElement as { item: string }[];
      expect(items[0]?.item).toBe('https://app.haotool.org/nihonname/test');
    });

    it('應該正確處理絕對 URL', () => {
      const breadcrumbs = [{ name: '測試', url: 'https://example.com/page' }];
      const schema = buildBreadcrumbSchema(breadcrumbs);

      const items = schema.itemListElement as { item: string }[];
      expect(items[0]?.item).toBe('https://example.com/page');
    });

    it('應該設定正確的 position', () => {
      const breadcrumbs = [
        { name: '首頁', url: '/' },
        { name: '歷史', url: '/history' },
        { name: '皇民化', url: '/history/kominka' },
      ];
      const schema = buildBreadcrumbSchema(breadcrumbs);

      const items = schema.itemListElement as { position: number }[];
      expect(items[0]?.position).toBe(1);
      expect(items[1]?.position).toBe(2);
      expect(items[2]?.position).toBe(3);
    });
  });

  describe('buildFaqSchema', () => {
    it('應該生成正確的 FAQPage schema', () => {
      const faq = [
        { question: '問題1', answer: '答案1' },
        { question: '問題2', answer: '答案2' },
      ];
      const schema = buildFaqSchema(faq, 'https://app.haotool.org/nihonname/faq');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.url).toBe('https://app.haotool.org/nihonname/faq');
      expect(schema.mainEntity).toHaveLength(2);
    });

    it('應該正確格式化 Question 和 Answer', () => {
      const faq = [{ question: '什麼是皇民化？', answer: '皇民化是日本殖民政策' }];
      const schema = buildFaqSchema(faq, 'https://example.com/faq');

      const questions = schema.mainEntity as { '@type': string; name: string }[];
      expect(questions[0]?.['@type']).toBe('Question');
      expect(questions[0]?.name).toBe('什麼是皇民化？');
    });

    it('應該處理空的 FAQ 陣列', () => {
      const schema = buildFaqSchema([], 'https://example.com/faq');
      expect(schema.mainEntity).toHaveLength(0);
    });
  });

  describe('buildArticleSchema', () => {
    it('應該生成正確的 Article schema', () => {
      const article = {
        headline: '測試標題',
        description: '測試描述',
        datePublished: '2025-01-01',
        dateModified: '2025-12-06',
        keywords: ['關鍵字1', '關鍵字2'],
      };
      const schema = buildArticleSchema(article, 'https://example.com/article');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Article');
      expect(schema.headline).toBe('測試標題');
      expect(schema.description).toBe('測試描述');
      expect(schema.datePublished).toBe('2025-01-01');
      expect(schema.dateModified).toBe('2025-12-06');
    });

    it('應該包含 author 和 publisher', () => {
      const article = {
        headline: '標題',
        description: '描述',
        datePublished: '2025-01-01',
        dateModified: '2025-01-01',
        keywords: [],
      };
      const schema = buildArticleSchema(article, 'https://example.com/article');

      expect(schema.author).toEqual({
        '@type': 'Organization',
        name: 'haotool',
        url: 'https://haotool.org',
      });
      const publisher = schema.publisher as { '@type': string };
      expect(publisher['@type']).toBe('Organization');
    });

    it('應該設定 inLanguage 為 zh-TW', () => {
      const article = {
        headline: '標題',
        description: '描述',
        datePublished: '2025-01-01',
        dateModified: '2025-01-01',
        keywords: [],
      };
      const schema = buildArticleSchema(article, 'https://example.com/article');

      expect(schema.inLanguage).toBe('zh-TW');
    });
  });

  describe('buildHowToSchema', () => {
    it('應該生成正確的 HowTo schema', () => {
      const schema = buildHowToSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('HowTo');
      expect(schema.name).toBe('如何使用皇民化改姓生成器');
    });

    it('應該包含 4 個步驟', () => {
      const schema = buildHowToSchema();
      expect(schema.step).toHaveLength(4);
    });

    it('步驟應該有正確的 position', () => {
      const schema = buildHowToSchema();
      const steps = schema.step as { position: number }[];

      expect(steps[0]?.position).toBe(1);
      expect(steps[1]?.position).toBe(2);
      expect(steps[2]?.position).toBe(3);
      expect(steps[3]?.position).toBe(4);
    });

    it('應該設定 totalTime', () => {
      const schema = buildHowToSchema();
      expect(schema.totalTime).toBe('PT1M');
    });
  });

  describe('getJsonLdForRoute', () => {
    const buildTime = '2025-12-06T00:00:00+08:00';

    it('首頁 (/) 應該包含基礎 schema 和 breadcrumb', () => {
      const jsonLd = getJsonLdForRoute('/', buildTime);

      expect(jsonLd.length).toBeGreaterThan(3); // BASE_JSON_LD (3) + breadcrumb
      const breadcrumb = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumb).toBeDefined();
    });

    it('空字串路由應該與首頁相同', () => {
      const jsonLd = getJsonLdForRoute('', buildTime);
      const breadcrumb = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumb).toBeDefined();
    });

    it('/about 應該包含正確的 breadcrumb', () => {
      const jsonLd = getJsonLdForRoute('/about', buildTime);
      const breadcrumb = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');

      expect(breadcrumb).toBeDefined();
      if (breadcrumb) {
        const items = (breadcrumb as { itemListElement: { name: string }[] }).itemListElement;
        expect(items).toHaveLength(2);
        expect(items[1]?.name).toBe('關於');
      }
    });

    it('/guide 應該包含 HowTo schema', () => {
      const jsonLd = getJsonLdForRoute('/guide', buildTime);
      const howTo = jsonLd.find((item) => item['@type'] === 'HowTo');
      expect(howTo).toBeDefined();
    });

    it('/faq 應該包含 breadcrumb', () => {
      const jsonLd = getJsonLdForRoute('/faq', buildTime);
      const breadcrumb = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumb).toBeDefined();
    });

    it('/history 應該包含 Article schema', () => {
      const jsonLd = getJsonLdForRoute('/history', buildTime);
      const article = jsonLd.find((item) => item['@type'] === 'Article');
      expect(article).toBeDefined();
      expect((article as { headline: string })?.headline).toContain('台灣歷史專區');
    });

    it('/history/kominka 應該包含皇民化運動 Article', () => {
      const jsonLd = getJsonLdForRoute('/history/kominka', buildTime);
      const article = jsonLd.find((item) => item['@type'] === 'Article');
      expect(article).toBeDefined();
      expect((article as { headline: string })?.headline).toContain('皇民化運動');
    });

    it('/history/shimonoseki 應該包含馬關條約 Article', () => {
      const jsonLd = getJsonLdForRoute('/history/shimonoseki', buildTime);
      const article = jsonLd.find((item) => item['@type'] === 'Article');
      expect(article).toBeDefined();
      expect((article as { headline: string })?.headline).toContain('馬關條約');
    });

    it('/history/san-francisco 應該包含舊金山和約 Article', () => {
      const jsonLd = getJsonLdForRoute('/history/san-francisco', buildTime);
      const article = jsonLd.find((item) => item['@type'] === 'Article');
      expect(article).toBeDefined();
      expect((article as { headline: string })?.headline).toContain('舊金山和約');
    });

    it('未知路由應該使用預設 breadcrumb', () => {
      const jsonLd = getJsonLdForRoute('/unknown-page', buildTime);
      const breadcrumb = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumb).toBeDefined();
    });

    it('應該正確處理尾斜線', () => {
      const jsonLdWithSlash = getJsonLdForRoute('/about/', buildTime);
      const jsonLdWithoutSlash = getJsonLdForRoute('/about', buildTime);

      // 兩者應該產生相同數量的 schema
      expect(jsonLdWithSlash.length).toBe(jsonLdWithoutSlash.length);
    });
  });

  describe('jsonLdToScriptTags', () => {
    it('應該將 JSON-LD 轉換為 script 標籤', () => {
      const jsonLd = [{ '@type': 'WebSite', name: 'Test' }];
      const html = jsonLdToScriptTags(jsonLd);

      expect(html).toContain('<script type="application/ld+json">');
      expect(html).toContain('</script>');
      expect(html).toContain('"@type":"WebSite"');
    });

    it('應該處理多個 JSON-LD 物件', () => {
      const jsonLd = [
        { '@type': 'WebSite', name: 'Test1' },
        { '@type': 'Organization', name: 'Test2' },
      ];
      const html = jsonLdToScriptTags(jsonLd);

      const scriptCount = (html.match(/<script type="application\/ld\+json">/g) ?? []).length;
      expect(scriptCount).toBe(2);
    });

    it('應該處理空陣列', () => {
      const html = jsonLdToScriptTags([]);
      expect(html).toBe('');
    });

    it('應該正確序列化 JSON', () => {
      const jsonLd = [{ '@context': 'https://schema.org', '@type': 'Test', value: 123 }];
      const html = jsonLdToScriptTags(jsonLd);

      expect(html).toContain('"@context":"https://schema.org"');
      expect(html).toContain('"value":123');
    });
  });
});
