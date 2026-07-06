/**
 * 四報價卡測試（#618）：四基準值全數呈現、數值來自 SSOT、
 * 現金專屬幣別（無即期）誠實顯示不可用態。
 */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuoteMatrixSection } from '../currency/QuoteMatrixSection';
import { SEO_RATE_EXAMPLES } from '../../config/generated/seo-rate-examples';

describe('QuoteMatrixSection', () => {
  it('USD 應呈現現金買/賣＋即期買/賣四種報價（值來自 SSOT）', () => {
    const example = SEO_RATE_EXAMPLES['USD']!;
    render(<QuoteMatrixSection currencyCode="USD" currencyName="美金" rateExample={example} />);

    const cells: [string, number | null][] = [
      ['quote-cell-cash-buy', example.cashBuy],
      ['quote-cell-cash-sell', example.cashSell],
      ['quote-cell-spot-buy', example.spotBuy],
      ['quote-cell-spot-sell', example.spotSell],
    ];

    for (const [testId, value] of cells) {
      const cell = screen.getByTestId(testId);
      expect(value).not.toBeNull();
      expect(
        within(cell).getByText(value!.toLocaleString('zh-TW', { maximumFractionDigits: 6 })),
      ).toBeInTheDocument();
    }

    expect(screen.queryByText(/未提供即期報價/)).not.toBeInTheDocument();
  });

  it('KRW（現金專屬）即期買/賣應顯示誠實不可用態', () => {
    const example = SEO_RATE_EXAMPLES['KRW']!;
    expect(example.spotSell).toBeNull();

    render(<QuoteMatrixSection currencyCode="KRW" currencyName="韓元" rateExample={example} />);

    for (const testId of ['quote-cell-spot-buy', 'quote-cell-spot-sell']) {
      const cell = screen.getByTestId(testId);
      expect(within(cell).getByText('臺銀無此報價')).toBeInTheDocument();
    }

    expect(screen.getByText(/未提供即期報價，換匯以現金匯率為準/)).toBeInTheDocument();
  });

  it('全部 17 幣別的 SEO_RATE_EXAMPLES 均含四基準欄位', () => {
    for (const [code, example] of Object.entries(SEO_RATE_EXAMPLES)) {
      expect(example.cashSell, `${code} cashSell`).toBeGreaterThan(0);
      expect(example, `${code} 應含 cashBuy 欄位`).toHaveProperty('cashBuy');
      expect(example, `${code} 應含 spotBuy 欄位`).toHaveProperty('spotBuy');
      expect(example, `${code} 應含 spotSell 欄位`).toHaveProperty('spotSell');
      // spotAvailable 與 spotSell 缺值語意一致
      expect(example.spotAvailable, `${code} spotAvailable 與 spotSell 一致`).toBe(
        example.spotSell !== null,
      );
    }
  });
});
