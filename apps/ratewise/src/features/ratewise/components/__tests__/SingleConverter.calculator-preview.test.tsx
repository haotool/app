import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('SingleConverter - 計算機即時換算預覽', () => {
  it('開啟計算機輸入時顯示目標幣別即時換算', async () => {
    render(<SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" />);

    fireEvent.click(screen.getByTestId('amount-input'));
    fireEvent.click(await screen.findByRole('button', { name: '數字 5' }));

    // useCalculator 預覽有 50ms debounce,使用 findBy 等待
    const preview = await screen.findByTestId('calculator-conversion-preview');
    expect(preview).toHaveTextContent('JPY');
    expect(preview).toHaveTextContent('≈');
  });

  it('編輯 to 欄位時預覽顯示來源幣別', async () => {
    render(<SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" />);

    fireEvent.click(screen.getByTestId('amount-output'));
    fireEvent.click(await screen.findByRole('button', { name: '數字 5' }));

    const preview = await screen.findByTestId('calculator-conversion-preview');
    expect(preview).toHaveTextContent('TWD');
  });
});

describe('SingleConverter - 計算機 pristine 整合路徑(useCalculatorModal 實際流向)', () => {
  // CalculatorKey 用 Motion onTap(pointer 手勢),fireEvent.click 不會觸發;
  // 改走實體鍵盤路徑(useCalculatorKeyboard 監聽 window keydown),同樣經過 input()。
  it('開啟計算機帶入現值後第一次輸入數字重新開始', async () => {
    render(<SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" />);

    fireEvent.click(screen.getByTestId('amount-input'));
    await screen.findByRole('button', { name: '數字 5' });
    fireEvent.keyDown(window, { key: '5' });

    // baseProps.fromAmount = '1000':若 pristine 失效會變成 '10,005'
    expect(screen.getByLabelText('當前表達式')).toHaveTextContent(/^5$/);
  });

  it('關閉再開啟計算機後 pristine 重新生效', async () => {
    render(<SingleConverter {...baseProps} fromCurrency="TWD" toCurrency="JPY" />);

    fireEvent.click(screen.getByTestId('amount-input'));
    await screen.findByRole('button', { name: '數字 5' });
    fireEvent.keyDown(window, { key: '5' });
    fireEvent.keyDown(window, { key: 'Escape' });

    fireEvent.click(screen.getByTestId('amount-input'));
    await screen.findByRole('button', { name: '數字 6' });
    fireEvent.keyDown(window, { key: '6' });

    expect(screen.getByLabelText('當前表達式')).toHaveTextContent(/^6$/);
  });
});
