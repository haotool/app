/**
 * Sitemap 2025 標準測試
 *
 * 依據：
 * - [Bing Webmaster](https://blogs.bing.com/webmaster/february-2023/The-Importance-of-Setting-the-lastmod-Tag-in-Your-Sitemap)
 * - [Spotibo SEO Guide](https://spotibo.com/sitemap-guide/)
 * - [Sitemaps.org Protocol](https://www.sitemaps.org/protocol.html)
 *
 * 2025 標準：
 * - ✅ 保留 <lastmod> (Bing 明確要求真實時間戳)
 * - ❌ 移除 <changefreq> (Google 忽略)
 * - ❌ 移除 <priority> (Google 和 Bing 都忽略)
 * - ✅ 新增 Image Sitemap Extension
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parseStringPromise } from 'xml2js';

const SITEMAP_PATH = resolve(__dirname, '../../apps/ratewise/public/sitemap.xml');

interface SitemapUrl {
  loc: string[];
  lastmod: string[];
  'image:image'?: {
    'image:loc': string[];
    'image:caption'?: string[];
  }[];
  'xhtml:link'?: unknown[];
}

interface ParsedSitemap {
  urlset: {
    url: SitemapUrl[];
  };
}

function readSitemap(): string {
  if (!existsSync(SITEMAP_PATH)) {
    throw new Error(`Sitemap not found: ${SITEMAP_PATH}`);
  }
  return String(readFileSync(SITEMAP_PATH, 'utf-8'));
}

async function parseSitemap(xml: string): Promise<ParsedSitemap> {
  return (await parseStringPromise(xml)) as ParsedSitemap;
}

describe('Sitemap 2025 Standards', () => {
  describe('Deprecated Tags Removal', () => {
    it('should NOT contain <changefreq> tags', () => {
      const xml = readSitemap();
      expect(xml, 'changefreq is ignored by Google and should be removed').not.toContain(
        '<changefreq>',
      );
    });

    it('should NOT contain <priority> tags', () => {
      const xml = readSitemap();
      expect(xml, 'priority is ignored by Google and Bing, should be removed').not.toContain(
        '<priority>',
      );
    });
  });

  describe('Required Tags', () => {
    it('should contain <lastmod> for all URLs', async () => {
      const xml = readSitemap();
      const parsed = await parseSitemap(xml);

      const urls = parsed.urlset.url;
      expect(urls.length).toBeGreaterThan(0);

      urls.forEach((url) => {
        expect(url.lastmod).toBeDefined();
        expect(url.lastmod[0]).toBeTruthy();
      });
    });

    it('should use ISO 8601 format with timezone for lastmod', async () => {
      const xml = readSitemap();
      const parsed = await parseSitemap(xml);

      const urls = parsed.urlset.url;

      urls.forEach((url) => {
        const lastmod = url.lastmod[0]!;

        // 必須包含時區信息（+08:00 或 Z）
        expect(lastmod, `lastmod should use ISO 8601 with timezone: ${lastmod}`).toMatch(
          /T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/,
        );
      });
    });
  });

  describe('Timestamp Authenticity', () => {
    it('should have different lastmod timestamps for different pages', async () => {
      const xml = readSitemap();
      const parsed = await parseSitemap(xml);

      const urls = parsed.urlset.url;
      const lastmods = urls.map((u) => u.lastmod[0]!);

      // 提取日期部分（忽略時間）
      const uniqueDates = new Set(lastmods.map((d) => String(d).split('T')[0]));

      // 至少應該有 3 個不同的日期（不太可能所有文件都同一天修改）
      expect(
        uniqueDates.size,
        `Found ${uniqueDates.size} unique dates, should be >= 3 for authentic timestamps`,
      ).toBeGreaterThanOrEqual(3);
    });

    it('lastmod should be within reasonable timeframe', async () => {
      const xml = readSitemap();
      const parsed = await parseSitemap(xml);

      const now = Date.now();
      const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

      const urls = parsed.urlset.url;

      urls.forEach((url) => {
        const lastmod = new Date(String(url.lastmod[0])).getTime();

        // 時間戳應該在過去一年內且不是未來
        expect(lastmod, `lastmod should be between 1 year ago and now`).toBeGreaterThan(oneYearAgo);

        expect(lastmod, `lastmod should not be in the future`).toBeLessThanOrEqual(now);
      });
    });
  });

  describe('Image Sitemap Extension', () => {
    it('should include image namespace', () => {
      const xml = readSitemap();
      expect(xml, 'Should include image sitemap namespace').toContain(
        'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
      );
    });

    it('should have image:image tags for main pages', async () => {
      const xml = readSitemap();
      const parsed = await parseSitemap(xml);

      // 至少首頁應該有圖片
      const homeUrl = parsed.urlset.url.find((u) => String(u.loc[0]).endsWith('/ratewise/'));

      expect(homeUrl).toBeDefined();
      expect(homeUrl!['image:image']).toBeDefined();
      expect(homeUrl!['image:image']!.length).toBeGreaterThan(0);
    });

    it('image tags should have required fields', async () => {
      const xml = readSitemap();
      const parsed = await parseSitemap(xml);

      const urlsWithImages = parsed.urlset.url.filter((u) => u['image:image']);

      urlsWithImages.forEach((url) => {
        const images = url['image:image']!;

        images.forEach((img) => {
          expect(img['image:loc']).toBeDefined();
          expect(img['image:loc'][0]).toBeTruthy();

          // caption 是可選的，但如果有應該是字串
          if (img['image:caption']) {
            expect(typeof img['image:caption'][0]).toBe('string');
          }
        });
      });
    });
  });

  describe('Hreflang Configuration', () => {
    it('should have alternate links for all URLs', async () => {
      const xml = readSitemap();
      const parsed = await parseSitemap(xml);

      const urls = parsed.urlset.url;

      urls.forEach((url) => {
        const alternates = url['xhtml:link'];
        expect(alternates).toBeDefined();
        expect(alternates!.length).toBeGreaterThanOrEqual(2); // 至少 zh-TW 和 x-default
      });
    });
  });

  describe('URL Count', () => {
    it('should have all 17 SEO paths', async () => {
      const xml = readSitemap();
      const parsed = await parseSitemap(xml);

      const urls = parsed.urlset.url;

      // RateWise 應該有 17 個 SEO 路徑
      expect(urls.length, 'Should have 17 SEO paths (4 core + 13 currency pages)').toBe(17);
    });
  });
});
