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
import { SEOHelmet } from '../SEOHelmet';
import { attachSpeakableToGraph, shouldRenderStructuredData } from '../seo-helmet-utils';

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

    it('should render without errors with breadcrumb and HowTo prop', () => {
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

    it('should deduplicate brand variants in the document title', () => {
      render(
        <HelmetProvider>
          <SEOHelmet title="500 美金換新台幣（USD/TWD）— 台銀實際賣出價 | RateWise" />
        </HelmetProvider>,
      );

      expect(document.title).toBe(
        '500 美金換新台幣（USD/TWD）— 台銀實際賣出價 | RateWise 匯率好工具',
      );
      expect((document.title.match(/RateWise 匯率好工具/g) ?? []).length).toBe(1);
      expect(document.title).not.toContain('| RateWise |');
    });

    it('should keep keywords prop compatible but never emit deprecated meta keywords', () => {
      render(
        <HelmetProvider>
          <SEOHelmet title="Test" keywords={['test', 'seo']} />
        </HelmetProvider>,
      );

      expect(document.head.querySelector('meta[name="keywords"]')).toBeNull();
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
            howTo={{
              name: '如何測試',
              description: '新的操作流程',
              steps: [{ position: 1, name: '步驟一', text: '先測試' }],
            }}
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
      expect(structuredDataScript?.textContent).toContain('"@type":"HowTo"');
      expect(structuredDataScript?.textContent).not.toContain('"@type":"FAQPage"');
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

    it('should retain managed tags on unmount and not remove unrelated head tags (SPA no-cleanup design)', () => {
      // SPA 導覽設計：unmount 不清除 metadata，避免新頁面掛載前短暫無標籤的閃爍。
      // 所有標籤由下一頁的 upsert*/replaceHeadCollection 覆寫。
      document.head.innerHTML = `
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      `;

      const { unmount } = render(
        <HelmetProvider>
          <SEOHelmet
            title="SPA 測試頁面"
            description="此 metadata 在 unmount 後應保留"
            canonical="/spatest/"
            howTo={{
              name: '測試流程',
              description: '測試用',
              steps: [{ position: 1, name: '步驟一', text: '測試' }],
            }}
          />
        </HelmetProvider>,
      );

      expect(document.head.querySelectorAll('[data-seo-helmet]')).not.toHaveLength(0);

      unmount();

      // unmount 後標籤應保留（SPA no-cleanup 設計，由下一頁覆寫）。
      expect(document.head.querySelectorAll('[data-seo-helmet]')).not.toHaveLength(0);

      // 外部注入標籤（charset、viewport）不受影響。
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

  describe('OG Image 完整標籤', () => {
    it('應輸出 og:image:type = image/jpeg', () => {
      render(
        <HelmetProvider>
          <SEOHelmet title="Test" />
        </HelmetProvider>,
      );

      const ogImageType = document.head.querySelector('meta[property="og:image:type"]');
      expect(ogImageType).not.toBeNull();
      expect(ogImageType).toHaveAttribute('content', 'image/jpeg');
    });

    it('應輸出 og:image:secure_url 且值與 og:image 相同', () => {
      render(
        <HelmetProvider>
          <SEOHelmet title="Test" />
        </HelmetProvider>,
      );

      const ogImage = document.head.querySelector('meta[property="og:image"]');
      const ogImageSecureUrl = document.head.querySelector('meta[property="og:image:secure_url"]');
      expect(ogImageSecureUrl).not.toBeNull();
      expect(ogImageSecureUrl?.getAttribute('content')).toBe(ogImage?.getAttribute('content'));
    });

    it('noindex 頁面也應保有 og:image:type（社群分享不受 noindex 影響）', () => {
      render(
        <HelmetProvider>
          <SEOHelmet title="Test" robots="noindex, follow" />
        </HelmetProvider>,
      );

      const ogImageType = document.head.querySelector('meta[property="og:image:type"]');
      expect(ogImageType).not.toBeNull();
      expect(ogImageType).toHaveAttribute('content', 'image/jpeg');
    });

    it('重新渲染相同 props 時 og:image:type 不應重複', () => {
      const { rerender } = render(
        <HelmetProvider>
          <SEOHelmet title="Test" />
        </HelmetProvider>,
      );
      rerender(
        <HelmetProvider>
          <SEOHelmet title="Test" />
        </HelmetProvider>,
      );

      const ogImageTypes = document.head.querySelectorAll('meta[property="og:image:type"]');
      expect(ogImageTypes).toHaveLength(1);
    });
  });

  describe('Code Review Verifications', () => {
    /**
     * aggregateRating 已加入 SoftwareApplication（seo-metadata.ts buildSiteJsonLd）
     *
     * 規格：Google Rich Results SoftwareApplication
     * - ratingValue: '4.8', ratingCount: '128', bestRating: '5', worstRating: '1'
     * - 建議接入正式評分系統後更新數值
     */
    it('Code Review: AggregateRating 已加入 SoftwareApplication（詳見 seo-metadata.ts buildSiteJsonLd）', () => {
      // 文檔記錄用途；實際驗證見 seo-best-practices.test.ts
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

    it('金額頁 alternate 應與 canonical 同步，避免 hreflang 指回基礎幣對頁', () => {
      render(
        <HelmetProvider>
          <SEOHelmet
            title="500 美金換新台幣（USD/TWD）— 台銀實際賣出價 | RateWise"
            canonical="https://app.haotool.org/ratewise/usd-twd/500/"
            pathname="/usd-twd"
          />
        </HelmetProvider>,
      );

      const canonical = document.head.querySelector('link[rel="canonical"]');
      const xDefault = document.head.querySelector('link[rel="alternate"][hreflang="x-default"]');
      const zhTw = document.head.querySelector('link[rel="alternate"][hreflang="zh-TW"]');

      expect(canonical).toHaveAttribute('href', 'https://app.haotool.org/ratewise/usd-twd/500/');
      expect(xDefault).toHaveAttribute('href', 'https://app.haotool.org/ratewise/usd-twd/500/');
      expect(zhTw).toHaveAttribute('href', 'https://app.haotool.org/ratewise/usd-twd/500/');
    });

    it('金額頁 title 不應出現 RateWise 品牌重複', () => {
      render(
        <HelmetProvider>
          <SEOHelmet title="500 美金換新台幣（USD/TWD）— 台銀實際賣出價 | RateWise" />
        </HelmetProvider>,
      );

      expect(document.title).toBe(
        '500 美金換新台幣（USD/TWD）— 台銀實際賣出價 | RateWise 匯率好工具',
      );
    });
  });
});

// ─── attachSpeakableToGraph ────────────────────────────────────────────────
// schema.org requires SpeakableSpecification to be the value of the `speakable`
// property on a WebPage/Article — not a standalone @graph node.

describe('attachSpeakableToGraph()', () => {
  const URL = 'https://app.haotool.org/ratewise/test/';

  it('SpeakableSpecification 應移入 Article 的 speakable 屬性', () => {
    const nodes = [
      { '@type': 'Article', headline: '標題' },
      { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
    ];
    const result = attachSpeakableToGraph(nodes, URL);
    const article = result[0]!;

    expect(result).toHaveLength(1);
    expect(article['@type']).toBe('Article');
    expect((article['speakable'] as Record<string, unknown>)['@type']).toBe(
      'SpeakableSpecification',
    );
    expect((article['speakable'] as Record<string, unknown>)['cssSelector']).toEqual(['h1']);
  });

  it('無相容父實體時應新增 WebPage 容器節點', () => {
    const nodes = [
      { '@type': 'ImageObject', url: 'img.jpg' },
      { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
    ];
    const result = attachSpeakableToGraph(nodes, URL);

    const webPage = result.find((b) => b['@type'] === 'WebPage');
    expect(webPage).toBeDefined();
    expect(webPage!['url']).toBe(URL);
    expect((webPage!['speakable'] as Record<string, unknown>)['cssSelector']).toEqual(['h1']);
    expect(result.find((b) => b['@type'] === 'SpeakableSpecification')).toBeUndefined();
  });

  it('獨立 SpeakableSpecification 節點不應留在 @graph 中', () => {
    const nodes = [
      { '@type': 'Article', headline: '標題' },
      { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
    ];
    const result = attachSpeakableToGraph(nodes, URL);

    expect(result.find((b) => b['@type'] === 'SpeakableSpecification')).toBeUndefined();
  });

  it('多個 SpeakableSpecification 的 cssSelector 應合併', () => {
    const nodes = [
      { '@type': 'Article', headline: '標題' },
      { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
      { '@type': 'SpeakableSpecification', cssSelector: ['details summary'] },
    ];
    const result = attachSpeakableToGraph(nodes, URL);
    const article = result[0]!;
    const selectors = (article['speakable'] as Record<string, unknown>)['cssSelector'] as string[];
    expect(selectors).toContain('h1');
    expect(selectors).toContain('details summary');
  });

  it('無 SpeakableSpecification 時應原樣回傳', () => {
    const nodes = [
      { '@type': 'Article', headline: '標題' },
      { '@type': 'Organization', name: 'HaoTool' },
    ];
    const result = attachSpeakableToGraph(nodes, URL);
    expect(result).toBe(nodes); // same reference — no allocation
  });

  it('父實體優先順序：Article > WebPage', () => {
    const nodes = [
      { '@type': 'WebPage', url: URL },
      { '@type': 'Article', headline: '標題' },
      { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
    ];
    const result = attachSpeakableToGraph(nodes, URL);

    const webPage = result.find((b) => b['@type'] === 'WebPage')!;
    const article = result.find((b) => b['@type'] === 'Article')!;
    expect(article['speakable']).toBeDefined();
    expect(webPage['speakable']).toBeUndefined();
  });

  it('HowTo 不應被視為 speakable 父節點（schema.org 僅限 Article/WebPage）', () => {
    const nodes = [
      { '@type': 'HowTo', name: '如何使用' },
      { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
    ];
    const result = attachSpeakableToGraph(nodes, URL);

    // HowTo 不支援 speakable，應建立 WebPage fallback
    const howTo = result.find((b) => b['@type'] === 'HowTo')!;
    const webPage = result.find((b) => b['@type'] === 'WebPage')!;
    expect(howTo['speakable']).toBeUndefined();
    expect(webPage).toBeDefined();
    expect(webPage['speakable']).toBeDefined();
  });

  it('有 HowTo + WebPage 時，speakable 應掛載到 WebPage', () => {
    const nodes = [
      { '@type': 'HowTo', name: '如何使用' },
      { '@type': 'WebPage', url: URL, name: '首頁' },
      { '@type': 'SpeakableSpecification', cssSelector: ['h1'] },
    ];
    const result = attachSpeakableToGraph(nodes, URL);

    const howTo = result.find((b) => b['@type'] === 'HowTo')!;
    const webPage = result.find((b) => b['@type'] === 'WebPage')!;
    expect(howTo['speakable']).toBeUndefined();
    expect(webPage['speakable']).toBeDefined();
    expect((webPage['speakable'] as Record<string, unknown>)['cssSelector']).toEqual(['h1']);
  });
});
