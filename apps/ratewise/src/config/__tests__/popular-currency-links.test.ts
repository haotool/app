import { describe, expect, it } from 'vitest';
import {
  buildCanonicalUrl,
  buildPopularCurrencyItemListJsonLd,
  CARD_RATE_GUIDE_PAGE,
  CASH_VS_SPOT_RATE_PAGE,
  HOMEPAGE_SEO,
  SELL_RATE_VS_MID_RATE_PAGE,
} from '../seo-metadata';
import {
  POPULAR_CURRENCY_CODES,
  POPULAR_FROM_TWD_LINKS,
  POPULAR_ITEM_LIST_LINKS,
  POPULAR_RATE_LINKS,
  POPULAR_RELATED_CURRENCY_LINKS,
  POPULAR_TO_TWD_LINKS,
} from '../popular-currency-links';
import { FOOTER_SECTIONS, POPULAR_RATE_LINKS as FOOTER_POPULAR_RATE_LINKS } from '../footer-links';

describe('popular currency links SSOT', () => {
  it('keeps homepage forward and reverse links aligned to the same popular currency order', () => {
    expect(POPULAR_TO_TWD_LINKS.map((link) => link.code)).toEqual([...POPULAR_CURRENCY_CODES]);
    expect(POPULAR_FROM_TWD_LINKS.map((link) => link.code)).toEqual([...POPULAR_CURRENCY_CODES]);

    for (const link of POPULAR_TO_TWD_LINKS) {
      expect(link.href).toBe(`/${link.code.toLowerCase()}-twd/`);
      expect(link.label).toMatch(/換台幣$/);
    }

    for (const link of POPULAR_FROM_TWD_LINKS) {
      expect(link.href).toBe(`/twd-${link.code.toLowerCase()}/`);
      expect(link.label).toMatch(/^台幣換/);
    }
  });

  it('derives footer popular rates and authority-guide related currencies from the same top links', () => {
    const topCodes = POPULAR_CURRENCY_CODES.slice(0, POPULAR_RATE_LINKS.length);

    expect(POPULAR_RATE_LINKS.map((link) => link.code)).toEqual(topCodes);
    expect(POPULAR_RELATED_CURRENCY_LINKS.map((link) => link.code)).toEqual(topCodes);
    expect(FOOTER_POPULAR_RATE_LINKS).toEqual(POPULAR_RATE_LINKS);
    expect(FOOTER_SECTIONS.find((section) => section.title === '熱門匯率')?.links).toEqual(
      POPULAR_RATE_LINKS,
    );
  });

  it('keeps guide related currency links in parity with the popular currency SSOT', () => {
    for (const page of [SELL_RATE_VS_MID_RATE_PAGE, CASH_VS_SPOT_RATE_PAGE, CARD_RATE_GUIDE_PAGE]) {
      expect(page.relatedCurrencies).toEqual(POPULAR_RELATED_CURRENCY_LINKS);
    }
  });

  it('exposes homepage ItemList JSON-LD for the visible popular currency links', () => {
    const itemList = buildPopularCurrencyItemListJsonLd();
    const homepageItemList = HOMEPAGE_SEO.jsonLd.find((schema) => schema['@type'] === 'ItemList');

    expect(homepageItemList).toEqual(itemList);
    expect(itemList['numberOfItems']).toBe(POPULAR_ITEM_LIST_LINKS.length);

    const elements = itemList['itemListElement'] as Record<string, unknown>[];
    expect(elements).toHaveLength(POPULAR_ITEM_LIST_LINKS.length);

    elements.forEach((element, index) => {
      const link = POPULAR_ITEM_LIST_LINKS[index]!;
      expect(element['@type']).toBe('ListItem');
      expect(element['position']).toBe(index + 1);
      expect(element['name']).toBe(link.label);
      expect(element['url']).toBe(buildCanonicalUrl(link.href));
    });
  });
});
