import { describe, expect, it } from 'vitest';
import { shouldRenderStructuredData } from '../../components/seo-helmet-utils';
import {
  ABOUT_PAGE_SEO,
  APP_ONLY_PAGE_SEO,
  FAQ_PAGE_SEO,
  HOMEPAGE_SEO,
  getCurrencyLandingPageContent,
  getReverseCurrencyLandingPageContent,
  shouldIncludeAggregateRating,
} from '../seo-metadata';

describe('schema truthfulness gate', () => {
  it('aggregateRating 僅在樣本數達門檻且有評分值時輸出', () => {
    expect(shouldIncludeAggregateRating({ ratingValue: null, ratingCount: 0 })).toBe(false);
    expect(shouldIncludeAggregateRating({ ratingValue: 4.8, ratingCount: 9 })).toBe(false);
    expect(shouldIncludeAggregateRating({ ratingValue: 4.8, ratingCount: 10 })).toBe(true);
  });

  it('FAQPage 僅允許 /faq/ 主頁輸出一次', () => {
    const faqPageTypes = FAQ_PAGE_SEO.jsonLd?.filter((block) => block['@type'] === 'FAQPage') ?? [];
    expect(faqPageTypes).toHaveLength(1);

    const homepageTypes =
      HOMEPAGE_SEO.jsonLd?.filter((block) => block['@type'] === 'FAQPage') ?? [];
    const aboutTypes = ABOUT_PAGE_SEO.jsonLd?.filter((block) => block['@type'] === 'FAQPage') ?? [];
    expect(homepageTypes).toHaveLength(0);
    expect(aboutTypes).toHaveLength(0);
  });

  it('幣別頁不輸出 FAQPage 或 FinancialService，只保留 ExchangeRateSpecification', () => {
    const forwardTypes =
      getCurrencyLandingPageContent('USD').jsonLd?.map((block) => block['@type']) ?? [];
    const reverseTypes =
      getReverseCurrencyLandingPageContent('USD').jsonLd?.map((block) => block['@type']) ?? [];

    expect(forwardTypes).toContain('ExchangeRateSpecification');
    expect(reverseTypes).toContain('ExchangeRateSpecification');
    expect(forwardTypes).not.toContain('FAQPage');
    expect(reverseTypes).not.toContain('FAQPage');
    expect(forwardTypes).not.toContain('FinancialService');
    expect(reverseTypes).not.toContain('FinancialService');
  });

  it('noindex 功能頁不應輸出結構化資料', () => {
    expect(shouldRenderStructuredData(APP_ONLY_PAGE_SEO.multi.robots)).toBe(false);
    expect(shouldRenderStructuredData(APP_ONLY_PAGE_SEO.favorites.robots)).toBe(false);
    expect(shouldRenderStructuredData(APP_ONLY_PAGE_SEO.settings.robots)).toBe(false);
  });
});
