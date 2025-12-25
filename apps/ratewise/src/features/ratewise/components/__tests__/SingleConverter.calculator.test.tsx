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

describe('SingleConverter calculator button', () => {
  it('opens calculator keyboard dialog when FROM amount button clicked', async () => {
    render(<SingleConverter {...mockProps} />);
    fireEvent.click(screen.getByLabelText('開啟計算機 (轉換金額)'));
    await waitFor(
      () => {
        expect(screen.getByRole('dialog', { name: '計算機' })).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  }, 15000);

  it('opens calculator keyboard dialog when TO amount button clicked', async () => {
    render(<SingleConverter {...mockProps} />);
    fireEvent.click(screen.getByLabelText('開啟計算機 (轉換結果)'));
    await waitFor(
      () => {
        expect(screen.getByRole('dialog', { name: '計算機' })).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  }, 15000);
});
