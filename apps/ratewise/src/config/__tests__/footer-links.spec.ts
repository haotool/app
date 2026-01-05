import { describe, expect, it } from 'vitest';
import { FOOTER_SECTIONS, POPULAR_RATE_LINKS } from '../footer-links';

describe('footer links config', () => {
  it('includes a popular rates section with stable ordering', () => {
    const popularSection = FOOTER_SECTIONS.find((section) => section.title === '熱門匯率');
    expect(popularSection).toBeDefined();
    expect(popularSection?.links).toEqual(POPULAR_RATE_LINKS);
  });

  it('keeps popular rate links ordered by priority', () => {
    const labels = POPULAR_RATE_LINKS.map((link) => link.label);
    expect(labels).toEqual([
      'USD 美元',
      'JPY 日圓',
      'EUR 歐元',
      'HKD 港幣',
      'CNY 人民幣',
      'KRW 韓元',
    ]);
  });
});
