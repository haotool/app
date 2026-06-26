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

describe('SingleConverter - 計價基準與時間戳(金融透明度)', () => {
  it('auto 模式 TWD→JPY 顯示「適用銀行賣出價」', () => {
    render(<SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" />);
    expect(screen.getByTestId('rate-basis-label')).toHaveTextContent('適用銀行賣出價');
  });

  it('auto 模式 JPY→TWD 顯示「適用銀行買入價」', () => {
    render(<SingleConverter {...baseProps} fromCurrency="JPY" toCurrency="TWD" />);
    expect(screen.getByTestId('rate-basis-label')).toHaveTextContent('適用銀行買入價');
  });

  it('mid 模式顯示「參考中間價」', () => {
    render(<SingleConverter {...baseProps} rateMode="mid" fromCurrency="TWD" toCurrency="JPY" />);
    expect(screen.getByTestId('rate-basis-label')).toHaveTextContent('參考中間價');
  });

  it('時間戳不渲染於匯率卡內(依使用者回饋移至卡外資料來源列)', () => {
    render(<SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" />);
    expect(screen.queryByTestId('rate-card-timestamp')).not.toBeInTheDocument();
  });

  it('同幣別時不顯示基準 pill(無換算意義)', () => {
    render(<SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="TWD" />);
    expect(screen.queryByTestId('rate-basis-label')).not.toBeInTheDocument();
  });

  it('sell 模式顯示「適用臺銀賣出牌告」', () => {
    render(<SingleConverter {...baseProps} rateMode="sell" fromCurrency="JPY" toCurrency="TWD" />);
    expect(screen.getByTestId('rate-basis-label')).toHaveTextContent('適用臺銀賣出牌告');
  });

  it('auto 模式外幣→外幣顯示「買入／賣出交叉換算」', () => {
    render(<SingleConverter {...baseProps} fromCurrency="USD" toCurrency="JPY" />);
    expect(screen.getByTestId('rate-basis-label')).toHaveTextContent('買入／賣出交叉換算');
  });

  it('exchange-shop 來源 TWD→外幣 顯示「適用換錢所賣出價」', () => {
    render(
      <SingleConverter
        {...baseProps}
        fromCurrency="TWD"
        toCurrency="JPY"
        rateSource="exchange-shop"
      />,
    );
    expect(screen.getByTestId('rate-basis-label')).toHaveTextContent('適用換錢所賣出價');
  });

  it('exchange-shop 來源 外幣→TWD 顯示「適用換錢所買入價」', () => {
    render(
      <SingleConverter
        {...baseProps}
        fromCurrency="JPY"
        toCurrency="TWD"
        rateSource="exchange-shop"
      />,
    );
    expect(screen.getByTestId('rate-basis-label')).toHaveTextContent('適用換錢所買入價');
  });
});
