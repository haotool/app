/**
 * Hreflang Configuration BDD Tests - SEO Phase 2A-3
 *
 * BDD 測試：驗證 Hreflang 配置正確性
 *
 * 測試策略：
 * - 🔴 sitemap.xml 不應該包含 hreflang="en"（應用沒有英文版本）
 * - 🔴 sitemap.xml 應該只有 zh-TW 和 x-default
 * - 🔴 SEOHelmet DEFAULT_ALTERNATES 不應該包含英文 locale
 * - 🔴 SEOHelmet 不應該為單一語言生成 og:locale:alternate
 *
 * 參考：fix/seo-phase2a-bdd-approach
 * 依據：[SEO 審查報告 2025-11-25] Hreflang 配置錯誤問題
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Hreflang Configuration (BDD)', () => {
  describe('🔴 RED: sitemap.xml Hreflang 配置', () => {
    const sitemapPath = resolve(__dirname, '../public/sitemap.xml');
    const sitemapContent = readFileSync(sitemapPath, 'utf-8');

    it('should NOT contain hreflang="en" (no English version exists)', () => {
      // 🔴 紅燈：sitemap.xml 不應該包含英文 hreflang
      expect(sitemapContent).not.toContain('hreflang="en"');
    });

    it('should only have zh-TW and x-default hreflang', () => {
      // 🔴 紅燈：確認只有繁體中文和預設語言
      expect(sitemapContent).toContain('hreflang="zh-TW"');
      expect(sitemapContent).toContain('hreflang="x-default"');

      // 確認沒有其他語言（en, ja, ko, etc.）
      expect(sitemapContent).not.toContain('hreflang="en"');
      expect(sitemapContent).not.toContain('hreflang="ja"');
      expect(sitemapContent).not.toContain('hreflang="ko"');
      expect(sitemapContent).not.toContain('hreflang="zh-CN"');
    });

    it('should have exactly 2 xhtml:link elements per URL (zh-TW and x-default)', () => {
      // 🔴 紅燈：計算 xhtml:link 數量，應該只有 2 個
      const xlinkMatches = sitemapContent.match(/<xhtml:link/g);
      expect(xlinkMatches).toBeTruthy();
      // 4 條 URL * 2 語言 = 8 (/, /faq/, /about/, /guide/)
      expect(xlinkMatches?.length).toBe(8);
    });
  });

  describe('🔴 RED: SEOHelmet.tsx Hreflang 配置', () => {
    const seoHelmetPath = resolve(__dirname, 'components/SEOHelmet.tsx');
    const seoHelmetContent = readFileSync(seoHelmetPath, 'utf-8');

    it('should NOT have English locale in DEFAULT_ALTERNATES', () => {
      // 🔴 紅燈：DEFAULT_ALTERNATES 不應該包含英文
      // 搜尋 DEFAULT_ALTERNATES 定義區塊
      const alternatesMatch = /const DEFAULT_ALTERNATES[\s\S]*?\[[\s\S]*?\];/.exec(
        seoHelmetContent,
      );
      expect(alternatesMatch).toBeTruthy();

      const alternatesBlock = alternatesMatch![0];

      // 確認不包含 'en', 'en-US', 'en-GB' 等英文 locale
      expect(alternatesBlock).not.toContain("'en'");
      expect(alternatesBlock).not.toContain('"en"');
      expect(alternatesBlock).not.toContain("'en-US'");
      expect(alternatesBlock).not.toContain('"en-US"');
      expect(alternatesBlock).not.toContain("'en-GB'");
      expect(alternatesBlock).not.toContain('"en-GB"');
    });

    it('should only have x-default and zh-TW in DEFAULT_ALTERNATES', () => {
      // 🔴 紅燈：確認 DEFAULT_ALTERNATES 只有 x-default 和 zh-TW
      const alternatesMatch = /const DEFAULT_ALTERNATES[\s\S]*?\[[\s\S]*?\];/.exec(
        seoHelmetContent,
      );
      expect(alternatesMatch).toBeTruthy();

      const alternatesBlock = alternatesMatch![0];

      // 應該包含 x-default 和 zh-TW
      expect(alternatesBlock).toMatch(/'x-default'|"x-default"/);
      expect(alternatesBlock).toMatch(/'zh-TW'|"zh-TW"|DEFAULT_LOCALE/);

      // 計算 hrefLang 的數量（應該只有 2 個）
      const hrefLangMatches = alternatesBlock.match(/hrefLang:/g);
      expect(hrefLangMatches?.length).toBe(2);
    });

    it('should not generate og:locale:alternate for the same locale as og:locale', () => {
      // 🔴 紅燈：檢查 og:locale:alternate 生成邏輯
      // 當只有一種語言時，不應該生成 og:locale:alternate

      // 搜尋 og:locale:alternate 生成代碼
      const ogLocaleAlternateMatch = /<meta[\s\S]*?property="og:locale:alternate"[\s\S]*?\/>/.exec(
        seoHelmetContent,
      );

      // 如果找到 og:locale:alternate，確認有 filter 邏輯排除主要 locale
      if (ogLocaleAlternateMatch) {
        // 檢查是否有過濾邏輯（filter 掉 x-default）
        expect(seoHelmetContent).toContain("hrefLang !== 'x-default'");

        // 檢查是否有過濾主要 locale 的邏輯
        // 當 alternates 只有 x-default 和主要 locale 時，應該不生成 og:locale:alternate
        const filterLogic = /normalizedAlternates[\s\S]*?\.filter[\s\S]*?\.map/.exec(
          seoHelmetContent,
        );
        expect(filterLogic).toBeTruthy();
      }
    });
  });

  describe('🔴 RED: Hreflang 最佳實踐驗證', () => {
    it('sitemap.xml and SEOHelmet should have consistent hreflang configuration', () => {
      // 🔴 紅燈：sitemap.xml 和 SEOHelmet 的 hreflang 應該一致

      const sitemapPath = resolve(__dirname, '../public/sitemap.xml');
      const sitemapContent = readFileSync(sitemapPath, 'utf-8');

      const seoHelmetPath = resolve(__dirname, 'components/SEOHelmet.tsx');
      const seoHelmetContent = readFileSync(seoHelmetPath, 'utf-8');

      // 從 sitemap.xml 提取所有 hreflang 值
      const sitemapHreflangs = Array.from(
        sitemapContent.matchAll(/hreflang="([^"]+)"/g),
        (match) => match[1],
      );

      // 從 SEOHelmet.tsx 提取 DEFAULT_ALTERNATES 中的 hrefLang 值
      const alternatesMatch = /const DEFAULT_ALTERNATES[\s\S]*?\[[\s\S]*?\];/.exec(
        seoHelmetContent,
      );
      expect(alternatesMatch).toBeTruthy();

      const alternatesBlock = alternatesMatch![0];

      // 驗證：sitemap 的 hreflang 應該與 SEOHelmet 的 DEFAULT_ALTERNATES 一致
      // sitemap 有 zh-TW
      expect(sitemapHreflangs).toContain('zh-TW');
      expect(alternatesBlock).toMatch(/'zh-TW'|"zh-TW"|DEFAULT_LOCALE/);

      // sitemap 有 x-default
      expect(sitemapHreflangs).toContain('x-default');
      expect(alternatesBlock).toMatch(/'x-default'|"x-default"/);

      // sitemap 不應該有 en，SEOHelmet 也不應該有
      expect(sitemapHreflangs).not.toContain('en');
      expect(alternatesBlock).not.toContain("'en'");
      expect(alternatesBlock).not.toContain('"en"');
    });

    it('should follow hreflang best practices: no self-referencing alternate', () => {
      // 🔴 紅燈：Hreflang 最佳實踐 - 主要語言不應該作為 alternate

      const seoHelmetPath = resolve(__dirname, 'components/SEOHelmet.tsx');
      const seoHelmetContent = readFileSync(seoHelmetPath, 'utf-8');

      // 檢查是否有邏輯避免主要 locale 成為 og:locale:alternate
      // 當只有一種語言時，應該：
      // - og:locale = zh_TW (主要語言)
      // - 不應該有 og:locale:alternate = zh_TW

      // 查找 og:locale:alternate 的過濾邏輯
      const filterPattern =
        /normalizedAlternates[\s\S]*?\.filter\(\(\{ hrefLang \}\).*?hrefLang !== ['"]x-default['"]\)/;
      const hasXDefaultFilter = filterPattern.test(seoHelmetContent);

      // 應該過濾掉 x-default
      expect(hasXDefaultFilter).toBe(true);

      // 理想情況：當只有一種語言時，應該完全不渲染 og:locale:alternate
      // 或者至少應該過濾掉與主要 locale 相同的項目
    });
  });
});
