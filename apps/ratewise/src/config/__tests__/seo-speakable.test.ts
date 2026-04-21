/**
 * Speakable Schema 整合測試
 *
 * 驗證所有核心內容頁的 jsonLd 經 attachSpeakableToGraph 處理後，
 * 產出合法的 SpeakableSpecification 節點（嵌套於 Article/WebPage 的 speakable 屬性）。
 *
 * 背景：schema.org 規範 SpeakableSpecification 必須是 Article/WebPage 的 speakable 屬性值，
 * 而非獨立 @graph 節點；Google Assistant 語音搜尋以此判定朗讀區塊。
 */

import { describe, expect, it } from 'vitest';
import {
  FAQ_PAGE_SEO,
  GUIDE_PAGE_SEO,
  OPEN_DATA_PAGE_SEO,
  ABOUT_PAGE_SEO,
  SELL_RATE_VS_MID_RATE_PAGE,
  CASH_VS_SPOT_RATE_PAGE,
  CARD_RATE_GUIDE_PAGE,
} from '../seo-metadata';
import { attachSpeakableToGraph } from '../../components/seo-helmet-utils';

type JsonLdNode = Record<string, unknown>;

const SPEAKABLE_CAPABLE_TYPES = new Set([
  'Article',
  'TechArticle',
  'WebPage',
  'FAQPage',
  'AboutPage',
]);

function findSpeakableParent(nodes: JsonLdNode[]): JsonLdNode | undefined {
  return nodes.find(
    (n) => SPEAKABLE_CAPABLE_TYPES.has(String(n['@type'])) && n['speakable'] !== undefined,
  );
}

function getSpeakableSelectors(parent: JsonLdNode): string[] {
  const speakable = parent['speakable'] as Record<string, unknown> | undefined;
  if (!speakable) return [];
  const selector = speakable['cssSelector'];
  return Array.isArray(selector) ? (selector as string[]) : [];
}

const PAGES = [
  { name: 'FAQ_PAGE_SEO', page: FAQ_PAGE_SEO },
  { name: 'GUIDE_PAGE_SEO', page: GUIDE_PAGE_SEO },
  { name: 'OPEN_DATA_PAGE_SEO', page: OPEN_DATA_PAGE_SEO },
  { name: 'ABOUT_PAGE_SEO', page: ABOUT_PAGE_SEO },
  { name: 'SELL_RATE_VS_MID_RATE_PAGE', page: SELL_RATE_VS_MID_RATE_PAGE },
  { name: 'CASH_VS_SPOT_RATE_PAGE', page: CASH_VS_SPOT_RATE_PAGE },
  { name: 'CARD_RATE_GUIDE_PAGE', page: CARD_RATE_GUIDE_PAGE },
] as const;

describe('Speakable schema 整合測試（所有核心內容頁）', () => {
  PAGES.forEach(({ name, page }) => {
    describe(name, () => {
      const nodes = page.jsonLd as JsonLdNode[];
      const url = `https://app.haotool.org/ratewise${page.pathname}`;
      const processed = attachSpeakableToGraph([...nodes], url);

      it('處理後應有 Article/WebPage/FAQPage 含 speakable 屬性', () => {
        const parent = findSpeakableParent(processed);
        expect(parent, `${name} 處理後缺 speakable 父節點`).toBeDefined();
      });

      it('speakable.cssSelector 應為非空 CSS 選擇器陣列', () => {
        const parent = findSpeakableParent(processed);
        const selectors = parent ? getSpeakableSelectors(parent) : [];
        expect(selectors.length).toBeGreaterThan(0);
        selectors.forEach((s) => {
          expect(typeof s).toBe('string');
          expect(s.trim().length).toBeGreaterThan(0);
        });
      });

      it('cssSelector 至少包含 h1（首屏標題為語音朗讀起點）', () => {
        const parent = findSpeakableParent(processed);
        const selectors = parent ? getSpeakableSelectors(parent) : [];
        expect(selectors).toContain('h1');
      });

      it('不應殘留獨立 SpeakableSpecification 節點於 @graph（schema.org 規範）', () => {
        const orphan = processed.find((n) => n['@type'] === 'SpeakableSpecification');
        expect(orphan, `${name} 存在遊離 SpeakableSpecification 節點`).toBeUndefined();
      });
    });
  });

  it('FAQ 頁 speakable 應涵蓋 details summary（Q&A 摺疊標題朗讀）', () => {
    const nodes = FAQ_PAGE_SEO.jsonLd as JsonLdNode[];
    const url = `https://app.haotool.org/ratewise${FAQ_PAGE_SEO.pathname}`;
    const processed = attachSpeakableToGraph([...nodes], url);
    const parent = findSpeakableParent(processed);
    const selectors = parent ? getSpeakableSelectors(parent) : [];
    expect(selectors).toContain('details summary');
  });
});
