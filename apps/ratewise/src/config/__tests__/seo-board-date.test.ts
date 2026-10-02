import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as GeneratedExamples from '../generated/seo-rate-examples';

const generated = '../generated/seo-rate-examples';
afterEach(() => {
  vi.doUnmock(generated);
  vi.resetModules();
});

describe('幣別頁牌告日期', () => {
  it.each(['2026-09-25', ''])('週日產生時使用週五牌告日期或省略缺值：%s', async (boardDate) => {
    vi.doMock(generated, async () => ({
      ...(await vi.importActual<typeof GeneratedExamples>(generated)),
      SEO_RATE_EXAMPLES_DATE: '2026-09-27',
      SEO_RATE_EXAMPLES_BOARD_DATE: boardDate,
    }));
    const { getCurrencyLandingPageContent, getReverseCurrencyLandingPageContent } =
      await import('../seo-metadata/currency-landing');
    for (const code of ['USD', 'JPY', 'KRW'] as const) {
      for (const content of [
        getCurrencyLandingPageContent(code),
        getReverseCurrencyLandingPageContent(code),
      ]) {
        const text = JSON.stringify(content, (key, value) =>
          key === 'jsonLd' ? undefined : value,
        );
        expect(text).not.toContain('2026-09-27');
        if (boardDate) expect(text).toContain(boardDate);
        else expect(text).not.toContain('牌告日期：');
      }
    }
  });
});
