import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SingleConverter } from '../SingleConverter';
import type { CurrencyCode } from '../../types';
import { CURRENCY_DEFINITIONS } from '../../constants';

vi.mock('../../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: vi.fn().mockResolvedValue([]),
  fetchLatestRates: vi.fn().mockResolvedValue({ lastUpdate: '2025-11-15', rates: {} }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'singleConverter.openCalculatorFrom': 'Open calculator (Amount)',
        'singleConverter.openCalculatorTo': 'Open calculator (Result)',
        'calculator.title': 'Calculator',
      };
      return translations[key] ?? key;
    },
  }),
}));

const exchangeRates = Object.fromEntries(
  Object.keys(CURRENCY_DEFINITIONS).map((code) => [code, 1]),
) as Record<CurrencyCode, number | null>;

const mockProps = {
  fromCurrency: 'USD' as CurrencyCode,
  toCurrency: 'TWD' as CurrencyCode,
  fromAmount: '10',
  toAmount: '320',
  exchangeRates,
  details: undefined,
  rateType: 'spot' as const,
  onFromCurrencyChange: () => {},
  onToCurrencyChange: () => {},
  onFromAmountChange: () => {},
  onToAmountChange: () => {},
  onQuickAmount: () => {},
  onSwapCurrencies: () => {},
  onAddToHistory: () => {},
  onRateTypeChange: () => {},
};

describe('SingleConverter calculator integration', () => {
  it('opens calculator keyboard dialog when FROM amount area clicked', async () => {
    render(<SingleConverter {...mockProps} />);
    // v2.0: 點擊金額顯示區域開啟計算機
    const amountInput = screen.getByTestId('amount-input');
    fireEvent.click(amountInput);
    await waitFor(
      () => {
        expect(screen.getByRole('dialog', { name: 'Calculator' })).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  }, 15000);

  it('opens calculator keyboard dialog when TO amount area clicked', async () => {
    render(<SingleConverter {...mockProps} />);
    // v2.0: 點擊金額顯示區域開啟計算機
    const amountOutput = screen.getByTestId('amount-output');
    fireEvent.click(amountOutput);
    await waitFor(
      () => {
        expect(screen.getByRole('dialog', { name: 'Calculator' })).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  }, 15000);
});
