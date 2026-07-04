/**
 * SEO Tests — 每路由 meta/jsonld 有值、FAQPage 僅 About（全站唯一）
 */
import { describe, it, expect } from 'vitest';
import { getMetaTagsForRoute } from '../seo/meta-tags';
import { ABOUT_FAQ_ITEMS, getJsonLdForRoute, jsonLdToScriptTags } from '../seo/jsonld';
// @ts-expect-error - ESM module type definition not auto-detected by TypeScript
import { SEO_PATHS } from '../../app.config.mjs';

const BUILD_TIME = '2026-07-05T00:00:00.000Z';
const seoPaths = SEO_PATHS as string[];

describe('meta-tags', () => {
  it('SSOT 共 4 條 SEO 路徑', () => {
    expect(seoPaths).toEqual(['/', '/tools/', '/about/', '/contact/']);
  });

  it.each(seoPaths)('%s 輸出 title/description/canonical/og', (path) => {
    const tags = getMetaTagsForRoute(path, BUILD_TIME);
    expect(tags).toMatch(/<title>[^<]+<\/title>/);
    expect(tags).toContain('name="description"');
    expect(tags).toContain(`<link rel="canonical" href="https://haotool.org${path}" />`);
    expect(tags).toContain('property="og:title"');
    expect(tags).toContain('name="twitter:card"');
    expect(tags).toContain(BUILD_TIME);
  });

  it('/404/ 輸出 noindex 且無 canonical', () => {
    const tags = getMetaTagsForRoute('/404', BUILD_TIME);
    expect(tags).toContain('noindex');
    expect(tags).not.toContain('rel="canonical"');
  });
});

describe('jsonld @graph', () => {
  it.each(seoPaths)('%s 輸出非空 @graph 且含 WebPage（dateModified = BUILD_TIME）', (path) => {
    const graph = getJsonLdForRoute(path, BUILD_TIME);
    expect(graph.length).toBeGreaterThan(0);
    const webPage = graph.find((node) => node['@type'] === 'WebPage');
    expect(webPage).toBeDefined();
    expect(webPage?.['dateModified']).toBe(BUILD_TIME);
  });

  it('首頁含 Organization/WebSite/Person，SearchAction 指向 /tools/', () => {
    const serialized = jsonLdToScriptTags(getJsonLdForRoute('/', BUILD_TIME));
    expect(serialized).toContain('"Organization"');
    expect(serialized).toContain('"WebSite"');
    expect(serialized).toContain('"Person"');
    expect(serialized).toContain('https://haotool.org/tools/?q={search_term_string}');
  });

  it('非首頁含 BreadcrumbList', () => {
    for (const path of seoPaths.filter((p) => p !== '/')) {
      const serialized = jsonLdToScriptTags(getJsonLdForRoute(path, BUILD_TIME));
      expect(serialized).toContain('"BreadcrumbList"');
    }
  });

  it('/tools/ 含 CollectionPage + ItemList（5 工具）', () => {
    const graph = getJsonLdForRoute('/tools/', BUILD_TIME);
    const collection = graph.find((node) => node['@type'] === 'CollectionPage');
    expect(collection).toBeDefined();
    const mainEntity = collection?.['mainEntity'] as { itemListElement: unknown[] };
    expect(mainEntity.itemListElement).toHaveLength(5);
  });

  it('/about/ 含 ProfilePage', () => {
    const serialized = jsonLdToScriptTags(getJsonLdForRoute('/about/', BUILD_TIME));
    expect(serialized).toContain('"ProfilePage"');
  });

  it('FAQPage 僅允許出現在 /about/（全站唯一）', () => {
    for (const path of seoPaths) {
      const serialized = jsonLdToScriptTags(getJsonLdForRoute(path, BUILD_TIME));
      if (path === '/about/') {
        // FAQ 內容尚未定稿（掛點留空）；有內容時必須輸出 FAQPage。
        if (ABOUT_FAQ_ITEMS.length > 0) {
          expect(serialized).toContain('"FAQPage"');
        } else {
          expect(serialized).not.toContain('"FAQPage"');
        }
      } else {
        expect(serialized).not.toContain('"FAQPage"');
      }
    }
  });

  it('未知路由（/404）不輸出 JSON-LD', () => {
    expect(getJsonLdForRoute('/404', BUILD_TIME)).toEqual([]);
    expect(jsonLdToScriptTags([])).toBe('');
  });

  it('@graph 打包為單一 script 標籤', () => {
    const serialized = jsonLdToScriptTags(getJsonLdForRoute('/', BUILD_TIME));
    expect(serialized.match(/<script type="application\/ld\+json">/g)).toHaveLength(1);
    expect(serialized).toContain('"@graph"');
  });
});
