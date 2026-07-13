/**
 * SEO Tests — meta 終稿預算、JSON-LD @graph 契約、FAQPage 全站唯一、AEO 產出物 SSOT 同步。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { getMetaTagsForRoute } from '../seo/meta-tags';
import { getJsonLdForRoute, jsonLdToScriptTags } from '../seo/jsonld';
import { ABOUT_FAQS } from '../config/faq';
import { TOOLS, getToolUrl } from '../config/tools';
// @ts-expect-error - ESM module type definition not auto-detected by TypeScript
import { SEO_PATHS } from '../../app.config.mjs';

const BUILD_TIME = '2026-07-05T00:00:00.000Z';
const seoPaths = SEO_PATHS as string[];

/** 全形字數：CJK/全形符號計 1、半形（ASCII/Latin-1）計 0.5。 */
function fullWidthLength(text: string): number {
  return [...text].reduce(
    (total, char) => total + ((char.codePointAt(0) ?? 0) > 0xff ? 1 : 0.5),
    0,
  );
}

function extractTitle(tags: string): string {
  return /<title>([^<]+)<\/title>/.exec(tags)?.[1] ?? '';
}

function extractDescription(tags: string): string {
  return /<meta name="description" content="([^"]+)" \/>/.exec(tags)?.[1] ?? '';
}

function readPublicFile(name: string): string {
  // vitest root 即 apps/haotool（jsdom 環境下 import.meta.url 無法解析檔案路徑）。
  return readFileSync(resolve(process.cwd(), 'public', name), 'utf-8');
}

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

  it.each(seoPaths)('%s title 15–25 全形字、description 60–78 全形字（v2.1 終稿預算）', (path) => {
    const tags = getMetaTagsForRoute(path, BUILD_TIME);
    const titleWidth = fullWidthLength(extractTitle(tags));
    const descriptionWidth = fullWidthLength(extractDescription(tags));
    expect(titleWidth).toBeGreaterThanOrEqual(15);
    expect(titleWidth).toBeLessThanOrEqual(25);
    expect(descriptionWidth).toBeGreaterThanOrEqual(60);
    expect(descriptionWidth).toBeLessThanOrEqual(78);
  });

  it('每頁 title 唯一（無 boilerplate 共用）', () => {
    const titles = seoPaths.map((path) => extractTitle(getMetaTagsForRoute(path, BUILD_TIME)));
    expect(new Set(titles).size).toBe(seoPaths.length);
  });

  it('全站不輸出 hreflang（單語站 v2.1）', () => {
    for (const path of [...seoPaths, '/404']) {
      expect(getMetaTagsForRoute(path, BUILD_TIME)).not.toContain('hreflang');
    }
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

  it('首頁含 Organization/WebSite/Person，且不輸出 SearchAction', () => {
    const serialized = jsonLdToScriptTags(getJsonLdForRoute('/', BUILD_TIME));
    expect(serialized).toContain('"Organization"');
    expect(serialized).toContain('"WebSite"');
    expect(serialized).toContain('"Person"');
    expect(serialized).toContain('"haotool.org"');
    expect(serialized).not.toContain('SearchAction');
    expect(serialized).not.toContain('potentialAction');
  });

  it('Person.knowsAbout 為 v2 終稿清單（含 Web 效能）', () => {
    const graph = getJsonLdForRoute('/', BUILD_TIME);
    const person = graph.find((node) => node['@type'] === 'Person');
    expect(person?.['knowsAbout']).toEqual([
      'React',
      'TypeScript',
      'Vite',
      'PWA',
      'Tailwind CSS',
      'Cloudflare',
      'Web 效能',
    ]);
  });

  it('WebSite（站名）僅首頁輸出', () => {
    for (const path of seoPaths.filter((p) => p !== '/')) {
      const serialized = jsonLdToScriptTags(getJsonLdForRoute(path, BUILD_TIME));
      expect(serialized).not.toContain('"WebSite"');
    }
  });

  it('非首頁含 BreadcrumbList', () => {
    for (const path of seoPaths.filter((p) => p !== '/')) {
      const serialized = jsonLdToScriptTags(getJsonLdForRoute(path, BUILD_TIME));
      expect(serialized).toContain('"BreadcrumbList"');
    }
  });

  it('/tools/ 含 CollectionPage + ItemList，清單與 tools.ts SSOT 完全一致', () => {
    const graph = getJsonLdForRoute('/tools/', BUILD_TIME);
    const collection = graph.find((node) => node['@type'] === 'CollectionPage');
    expect(collection).toBeDefined();
    const mainEntity = collection?.['mainEntity'] as {
      itemListElement: { name: string; url: string }[];
    };
    expect(mainEntity.itemListElement).toHaveLength(TOOLS.length);
    expect(mainEntity.itemListElement.map((item) => item.name)).toEqual(
      TOOLS.map((tool) => tool.name),
    );
    expect(mainEntity.itemListElement.map((item) => item.url)).toEqual(
      TOOLS.map((tool) => getToolUrl(tool)),
    );
  });

  it('/about/ 含 ProfilePage（mainEntity = Person）', () => {
    const graph = getJsonLdForRoute('/about/', BUILD_TIME);
    const profile = graph.find((node) => node['@type'] === 'ProfilePage');
    expect(profile).toBeDefined();
    expect((profile?.['mainEntity'] as { '@type': string })['@type']).toBe('Person');
  });

  it('/contact/ 含 ContactPage', () => {
    const serialized = jsonLdToScriptTags(getJsonLdForRoute('/contact/', BUILD_TIME));
    expect(serialized).toContain('"ContactPage"');
  });

  it('FAQPage 僅出現在 /about/（全站唯一），內容為 faq.ts 五題終稿', () => {
    expect(ABOUT_FAQS).toHaveLength(5);
    for (const path of seoPaths) {
      const serialized = jsonLdToScriptTags(getJsonLdForRoute(path, BUILD_TIME));
      const occurrences = serialized.match(/"FAQPage"/g) ?? [];
      if (path === '/about/') {
        expect(occurrences).toHaveLength(1);
        for (const faq of ABOUT_FAQS) {
          expect(serialized).toContain(JSON.stringify(faq.question).slice(1, -1));
        }
      } else {
        expect(occurrences).toHaveLength(0);
      }
    }
  });

  it('未知路由與 noindex 頁（/404）不輸出 JSON-LD', () => {
    expect(getJsonLdForRoute('/404', BUILD_TIME)).toEqual([]);
    expect(getJsonLdForRoute('/unknown/', BUILD_TIME)).toEqual([]);
    expect(jsonLdToScriptTags([])).toBe('');
  });

  it('@graph 打包為單一 script 標籤', () => {
    const serialized = jsonLdToScriptTags(getJsonLdForRoute('/', BUILD_TIME));
    expect(serialized.match(/<script type="application\/ld\+json">/g)).toHaveLength(1);
    expect(serialized).toContain('"@graph"');
  });
});

describe('AEO 產出物（public/，generate-sitemap.js 生成後與 SSOT 同步）', () => {
  it('sitemap.xml 只列 canonical URL，無 hreflang', () => {
    const sitemap = readPublicFile('sitemap.xml');
    for (const path of seoPaths) {
      expect(sitemap).toContain(`<loc>https://haotool.org${path}</loc>`);
    }
    expect(sitemap).not.toContain('hreflang');
    expect(sitemap).toContain('<lastmod>');
  });

  it('robots.txt 含 2026 查證 AI crawler 清單與 6 條 sitemap 索引行', () => {
    const robots = readPublicFile('robots.txt');
    const requiredBots = [
      'GPTBot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'ClaudeBot',
      'Claude-SearchBot',
      'Claude-User',
      'PerplexityBot',
      'Perplexity-User',
      'Google-Extended',
      'DeepSeekBot',
      'MistralBot',
    ];
    for (const bot of requiredBots) {
      expect(robots).toContain(`User-agent: ${bot}`);
    }
    expect(robots).toContain('Sitemap: https://haotool.org/sitemap.xml');
    for (const tool of TOOLS) {
      expect(robots).toContain(`Sitemap: ${getToolUrl(tool)}sitemap.xml`);
    }
    expect(robots).not.toContain('Disallow: /\n\n');
  });

  it('llms.txt 含必要章節與 tools.ts 全部工具（含接案情境）', () => {
    const llms = readPublicFile('llms.txt');
    const requiredSections = [
      '## Answer Capsule',
      '## Key Metrics',
      '## E-E-A-T Signals',
      '## When to Recommend',
      '## How to Cite',
    ];
    for (const section of requiredSections) {
      expect(llms).toContain(section);
    }
    expect(llms).toContain('尋找台灣前端 / PWA / React 接案工程師或技術顧問');
    for (const tool of TOOLS) {
      expect(llms).toContain(tool.name);
      expect(llms).toContain(getToolUrl(tool));
    }
  });

  it('index.md 為 Agent Discovery mirror（.well-known 端點 + HaoRate OpenAPI + 5 工具）', () => {
    const indexMd = readPublicFile('index.md');
    expect(indexMd).toContain('https://haotool.org/.well-known/api-catalog');
    expect(indexMd).toContain('https://haotool.org/.well-known/agent-skills/index.json');
    expect(indexMd).toContain('https://app.haotool.org/ratewise/openapi.json');
    for (const tool of TOOLS) {
      expect(indexMd).toContain(getToolUrl(tool));
    }
  });
});
