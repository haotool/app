import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SingleConverter } from '../SingleConverter';
import type { CurrencyCode } from '../../types';

vi.mock('../../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: vi.fn().mockResolvedValue([]),
  fetchLatestRates: vi.fn().mockResolvedValue({
    updateTime: '2025/11/29 08:00:00',
    source: 'Taiwan Bank',
    rates: {},
  }),
}));

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({ setData: vi.fn(), applyOptions: vi.fn() })),
    timeScale: vi.fn(() => ({ fitContent: vi.fn(), applyOptions: vi.fn() })),
    priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
    applyOptions: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    remove: vi.fn(),
    resize: vi.fn(),
  })),
  ColorType: { Solid: 'solid', VerticalGradient: 'gradient' },
  CrosshairMode: { Normal: 0, Magnet: 1 },
  LineStyle: { Solid: 0, Dotted: 1, Dashed: 2, LargeDashed: 3, SparseDotted: 4 },
  AreaSeries: 'AreaSeries',
}));

const exchangeRates: Record<CurrencyCode, number | null> = {
  TWD: 1,
  USD: 31.9,
  EUR: 37.03,
  JPY: 0.2007,
  GBP: 43.2,
  AUD: 22.53,
  CAD: 23.06,
  SGD: 24.88,
  CHF: 39.98,
  KRW: 0.02284,
  CNY: 4.732,
  HKD: 4.085,
  NZD: 18.68,
  THB: 1.0215,
  PHP: 0.5819,
  IDR: 0.00208,
  VND: 0.00137,
  MYR: 8.275,
};

const baseProps = {
  fromAmount: '1000',
  toAmount: '5008',
  exchangeRates,
  rateType: 'spot' as const,
  rateMode: 'auto' as const,
  onFromCurrencyChange: vi.fn(),
  onToCurrencyChange: vi.fn(),
  onFromAmountChange: vi.fn(),
  onToAmountChange: vi.fn(),
  onQuickAmount: vi.fn(),
  onSwapCurrencies: vi.fn(),
  onAddToHistory: vi.fn(),
  onRateTypeChange: vi.fn(),
};

describe('SingleConverter - 換算結果無障礙宣告', () => {
  it('渲染 polite live region 並包含目前換算結果', () => {
    render(<SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" />);
    const region = screen.getByTestId('conversion-live-region');
    // 顯式宣告 live region 語意，確保螢幕閱讀器確實朗讀換算結果（不僅依賴 <output> 的隱式 role）。
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveTextContent('TWD');
    expect(region).toHaveTextContent('JPY');
    expect(region).toHaveTextContent('5,008');
  });

  it('toAmount 變更時 live region 同步更新', () => {
    const { rerender } = render(
      <SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" />,
    );
    rerender(
      <SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" toAmount="9999" />,
    );
    expect(screen.getByTestId('conversion-live-region')).toHaveTextContent('9,999');
  });
});
