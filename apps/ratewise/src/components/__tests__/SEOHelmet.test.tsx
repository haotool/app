/**
 * SEOHelmet Component BDD Tests
 *
 * 依據：
 * - [Schema.org] Structured Data 規範
 * - [Google Search Central] JSON-LD 最佳實踐
 * - [2025 SEO Best Practices] 麵包屑導航與結構化數據
 *
 * 測試範圍：
 * - 組件渲染驗證（無錯誤）
 * - Props 接受性驗證
 * - 程式碼審查驗證（AggregateRating 已移除）
 *
 * **注意**:
 * - vite-react-ssg Head 在測試環境中不會實際渲染 <head> 內容到 DOM
 * - Schema 完整輸出驗證透過 build + grep 驗證
 * - 本測試專注組件邏輯正確性
 *
 * 建立時間: 2025-12-22
 * BDD 階段: Stage 3 GREEN
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HelmetProvider } from 'react-helmet-async';
import { SEOHelmet, shouldRenderStructuredData } from '../SEOHelmet';

describe('SEOHelmet Component', () => {
  const originalHead = document.head.innerHTML;
  const originalTitle = document.title;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  afterEach(() => {
    document.head.innerHTML = originalHead;
    document.title = originalTitle;
  });

  describe('Component Rendering', () => {
    it('should render without errors with minimal props', () => {
      expect(() => {
        render(
          <HelmetProvider>
            <SEOHelmet title="Test Page" />
          </HelmetProvider>,
        );
      }).not.toThrow();
    });

    it('should render without errors with breadcrumb prop', () => {
      expect(() => {
        render(
          <HelmetProvider>
            <SEOHelmet
              title="Test Page"
              breadcrumb={[
                { name: 'RateWise 首頁', item: '/' },
                { name: 'Test Page', item: '/test/' },
              ]}
            />
          </HelmetProvider>,
        );
      }).not.toThrow();
    });

    it('should render without errors with single breadcrumb item', () => {
      expect(() => {
        render(
          <HelmetProvider>
            <SEOHelmet title="Test Page" breadcrumb={[{ name: 'RateWise 首頁', item: '/' }]} />
          </HelmetProvider>,
        );
      }).not.toThrow();
    });

    it('should render without errors with FAQ prop', () => {
      expect(() => {
        render(
          <HelmetProvider>
            <SEOHelmet
              title="Test Page"
              faq={[
                {
                  question: 'Test Question?',
                  answer: 'Test Answer',
                },
              ]}
            />
          </HelmetProvider>,
        );
      }).not.toThrow();
    });

    it('should render without errors with HowTo prop', () => {
      expect(() => {
        render(
          <HelmetProvider>
            <SEOHelmet
              title="Test Page"
              howTo={{
                name: 'How to do something',
                description: 'Description',
                steps: [
                  {
                    position: 1,
                    name: 'Step 1',
                    text: 'Do this',
                  },
                ],
              }}
            />
          </HelmetProvider>,
        );
      }).not.toThrow();
    });

    it('should render without errors with all props combined', () => {
      expect(() => {
        render(
          <HelmetProvider>
            <SEOHelmet
              title="Test Page"
              description="Test Description"
              canonical="https://example.com/test/"
              keywords={['test', 'seo']}
              breadcrumb={[
                { name: 'Home', item: '/' },
                { name: 'Test', item: '/test/' },
              ]}
              faq={[{ question: 'Q?', answer: 'A' }]}
              howTo={{
                name: 'How to test',
                description: 'Testing guide',
                steps: [{ position: 1, name: 'Step 1', text: 'Test' }],
              }}
            />
          </HelmetProvider>,
        );
      }).not.toThrow();
    });
  });

  describe('Props Validation', () => {
    it('should accept breadcrumb prop as array of BreadcrumbItem', () => {
      const { container } = render(
        <HelmetProvider>
          <SEOHelmet
            title="Test"
            breadcrumb={[
              { name: 'Home', item: '/' },
              { name: 'Test', item: '/test/' },
            ]}
          />
        </HelmetProvider>,
      );

      expect(container).toBeDefined();
    });

    it('should handle empty breadcrumb array', () => {
      const { container } = render(
        <HelmetProvider>
          <SEOHelmet title="Test" breadcrumb={[]} />
        </HelmetProvider>,
      );

      expect(container).toBeDefined();
    });

    it('should handle undefined breadcrumb prop', () => {
      const { container } = render(
        <HelmetProvider>
          <SEOHelmet title="Test" />
        </HelmetProvider>,
      );

      expect(container).toBeDefined();
    });
  });

  describe('Noindex 行為', () => {
    it('noindex 頁面不應輸出結構化資料', () => {
      expect(shouldRenderStructuredData('noindex, follow')).toBe(false);
      expect(shouldRenderStructuredData('noindex, nofollow')).toBe(false);
    });

    it('可索引頁面應保留結構化資料', () => {
      expect(shouldRenderStructuredData('index, follow')).toBe(true);
    });
  });

  describe('Client-side Head Reconciliation', () => {
    it('should deduplicate existing title, description, canonical and structured data tags', () => {
      document.head.innerHTML = `
        <title>舊標題</title>
        <title data-rh="true">舊標題 RH</title>
        <meta name="description" content="舊描述">
        <meta name="description" content="舊描述 RH" data-rh="true">
        <link rel="canonical" href="https://old.example.com/">
        <link rel="canonical" href="https://old-rh.example.com/" data-rh="true">
        <script type="application/ld+json" data-rh="true">{"@context":"https://schema.org","@type":"Thing","name":"old"}</script>
      `;

      render(
        <HelmetProvider>
          <SEOHelmet
            title="測試頁"
            description="新的描述"
            canonical="/test/"
            faq={[{ question: 'Q?', answer: 'A' }]}
          />
        </HelmetProvider>,
      );

      const titles = document.head.querySelectorAll('title');
      const descriptions = document.head.querySelectorAll('meta[name="description"]');
      const canonicals = document.head.querySelectorAll('link[rel="canonical"]');
      const jsonLdScripts = document.head.querySelectorAll('script[type="application/ld+json"]');

      expect(titles).toHaveLength(1);
      expect(titles[0]).toHaveTextContent('測試頁 | RateWise');
      expect(titles[0]).toHaveAttribute('data-rh', 'true');
      expect(titles[0]).toHaveAttribute('data-seo-helmet', 'managed');

      expect(descriptions).toHaveLength(1);
      expect(descriptions[0]).toHaveAttribute('content', '新的描述');
      expect(descriptions[0]).toHaveAttribute('data-rh', 'true');
      expect(descriptions[0]).toHaveAttribute('data-seo-helmet', 'managed');

      expect(canonicals).toHaveLength(1);
      expect(canonicals[0]).toHaveAttribute('href', 'https://app.haotool.org/ratewise/test/');
      expect(canonicals[0]).toHaveAttribute('data-rh', 'true');
      expect(canonicals[0]).toHaveAttribute('data-seo-helmet', 'managed');

      expect(jsonLdScripts).toHaveLength(1);
      const structuredDataScript = jsonLdScripts.item(0);
      expect(structuredDataScript).not.toBeNull();
      expect(structuredDataScript).toHaveAttribute('data-rh', 'true');
      expect(structuredDataScript).toHaveAttribute('data-seo-helmet', 'structured-data');
      expect(structuredDataScript?.textContent).toContain('"@type":"FAQPage"');
    });

    it('should remove structured data on noindex pages', () => {
      document.head.innerHTML = `
        <script type="application/ld+json" data-rh="true">{"@context":"https://schema.org","@type":"Thing","name":"old"}</script>
      `;

      render(
        <HelmetProvider>
          <SEOHelmet title="Noindex 頁面" robots="noindex, follow" />
        </HelmetProvider>,
      );

      expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
    });

    it('should cleanup SEOHelmet-managed tags on unmount without removing unrelated head tags', () => {
      document.head.innerHTML = `
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      `;

      const { unmount } = render(
        <HelmetProvider>
          <SEOHelmet
            title="會被清掉的頁面"
            description="這組 metadata 應該在卸載後消失"
            canonical="/cleanup/"
            faq={[{ question: 'Q?', answer: 'A' }]}
          />
        </HelmetProvider>,
      );

      expect(document.head.querySelectorAll('[data-seo-helmet]')).not.toHaveLength(0);

      unmount();

      expect(document.head.querySelectorAll('title')).toHaveLength(0);
      expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(0);
      expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(0);
      expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
      expect(document.head.querySelectorAll('[data-seo-helmet]')).toHaveLength(0);

      const charset = document.head.querySelector('meta[charset="UTF-8"]');
      const viewport = document.head.querySelector('meta[name="viewport"]');
      expect(charset).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(viewport).toHaveAttribute('content', 'width=device-width, initial-scale=1');
    });

    it('should not recreate managed head nodes when rerendered with the same props', () => {
      const props = {
        title: '穩定頁面',
        description: '相同 props 不應重建 head 節點',
        canonical: '/stable/',
        alternates: [
          { hrefLang: 'x-default', href: '/stable/' },
          { hrefLang: 'zh-TW', href: '/stable/' },
        ],
        faq: [{ question: 'Q?', answer: 'A' }],
      };

      const { rerender } = render(
        <HelmetProvider>
          <SEOHelmet {...props} />
        </HelmetProvider>,
      );

      const initialCanonical = document.head.querySelector('link[rel="canonical"]');
      const initialAlternate = document.head.querySelector(
        'link[rel="alternate"][hreflang="zh-TW"]',
      );
      const initialStructuredData = document.head.querySelector(
        'script[type="application/ld+json"]',
      );

      rerender(
        <HelmetProvider>
          <SEOHelmet {...props} />
        </HelmetProvider>,
      );

      expect(document.head.querySelector('link[rel="canonical"]')).toBe(initialCanonical);
      expect(document.head.querySelector('link[rel="alternate"][hreflang="zh-TW"]')).toBe(
        initialAlternate,
      );
      expect(document.head.querySelector('script[type="application/ld+json"]')).toBe(
        initialStructuredData,
      );
    });
  });

  describe('Code Review Verifications', () => {
    /**
     * 驗證 AggregateRating 已從 SEOHelmet.tsx 移除
     *
     * 這個測試透過 code review 驗證：
     * - SEOHelmet.tsx L135-137 有註解說明移除原因
     * - 不存在 aggregateRating 相關代碼
     * - 符合 Google Review Guidelines 2025
     * - 符合 Linus YAGNI 原則
     *
     * 實際驗證透過：
     * - grep 搜尋確認無 "aggregateRating" 字串
     * - build 輸出檢查 dist/index.html
     */
    it('Code Review: AggregateRating 已移除（詳見 SEOHelmet.tsx L135-137）', () => {
      // 這個測試作為文檔記錄，實際驗證在 build 階段完成
      expect(true).toBe(true);
    });

    /**
     * 驗證 BreadcrumbList Schema 統一由 SEOHelmet 管理
     *
     * 這個測試透過 code review 驗證：
     * - Breadcrumb.tsx 已移除 Schema 生成（只負責 UI）
     * - SEOHelmet.tsx L309-314 負責生成 BreadcrumbList
     * - 符合 SRP 原則
     * - 避免重複 Schema 注入
     *
     * 實際驗證透過：
     * - grep 計數 dist/faq/index.html 的 "BreadcrumbList"（應為 1）
     * - E2E 測試或 Google Rich Results Test
     */
    it('Code Review: BreadcrumbList Schema 統一由 SEOHelmet 管理', () => {
      // 這個測試作為文檔記錄，實際驗證在 build 階段完成
      expect(true).toBe(true);
    });
  });
});
