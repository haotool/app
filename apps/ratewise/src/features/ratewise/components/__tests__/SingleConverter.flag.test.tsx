/**
 * SingleConverter flag gate 測試：converter-v2 flag off 時渲染 legacy（SSG/hydration 紅線），
 * on 時分流至 SingleConverterV2。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SingleConverter, preheatConverterV2Chunk } from '../SingleConverter';
import { useConverterStore } from '../../../../stores/converterStore';
import type { CurrencyCode } from '../../types';

// Mock services（避免測試觸網）
vi.mock('../../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: vi.fn().mockResolvedValue([]),
  fetchLatestRates: vi.fn().mockResolvedValue({
    updateTime: '2026/07/05 08:00:00',
    source: 'Taiwan Bank',
    rates: {},
  }),
}));

vi.mock('../converter-v2/useConverterTrend', () => ({
  useConverterTrend: vi.fn(() => ({ data: [], isLoading: false })),
}));

const mockExchangeRates: Record<CurrencyCode, number | null> = {
  TWD: 1,
  USD: 31.665,
  EUR: 36.94,
  JPY: 0.2047,
  GBP: 42.49,
  AUD: 20.96,
  CAD: 22.89,
  SGD: 24.56,
  CHF: 39.46,
  KRW: 0.0236,
  CNY: 4.506,
  HKD: 4.081,
  NZD: 18.38,
  THB: 1.0393,
  PHP: 0.6016,
  IDR: 0.0022,
  VND: 0.0014,
  MYR: 8.097,
};

const mockProps = {
  fromCurrency: 'TWD' as CurrencyCode,
  toCurrency: 'USD' as CurrencyCode,
  fromAmount: '1000',
  toAmount: '31.58',
  exchangeRates: mockExchangeRates,
  rateType: 'spot' as const,
  onFromCurrencyChange: vi.fn(),
  onToCurrencyChange: vi.fn(),
  onFromAmountChange: vi.fn(),
  onToAmountChange: vi.fn(),
  onQuickAmount: vi.fn(),
  onSwapCurrencies: vi.fn(),
  onAddToHistory: vi.fn(),
  onRateTypeChange: vi.fn(),
};

describe('SingleConverter - converter-v2 flag gate', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
    useConverterStore.setState({ singleConverterVariant: 'legacy' });
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('flag off（預設）：渲染 legacy 版面，無 v2 元素', () => {
    render(<SingleConverter {...mockProps} />);

    expect(screen.getByTestId('amount-input')).toBeInTheDocument();
    expect(screen.queryByTestId('converter-v2')).not.toBeInTheDocument();
  });

  it('flag on（使用者設定 v2）：chunk 就緒前以 v2 骨架佔位，就緒後分流至等值雙列 v2', async () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    render(<SingleConverter {...mockProps} />);

    // lazy 尚未 resolve：Suspense fallback 為 v2 佈局輪廓骨架，而非空白（issue #583）。
    if (!screen.queryByTestId('converter-v2')) {
      expect(screen.getByTestId('converter-v2-skeleton')).toBeInTheDocument();
    }

    expect(await screen.findByTestId('converter-v2')).toBeInTheDocument();
    expect(screen.queryByTestId('converter-v2-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('amount-input')).not.toBeInTheDocument();
  });

  it('冷啟動預熱：persisted 偏好為 v2 時觸發 v2 chunk 預取，legacy 時不觸發', async () => {
    expect(preheatConverterV2Chunk()).toBeNull();

    useConverterStore.setState({ singleConverterVariant: 'v2' });
    const preheat = preheatConverterV2Chunk();
    expect(preheat).not.toBeNull();
    await expect(preheat).resolves.toMatchObject({ default: expect.any(Function) });
  });

  it('flag on（URL override）：?converter=v2 直接啟用', async () => {
    window.history.replaceState(null, '', '/?converter=v2');
    render(<SingleConverter {...mockProps} />);

    expect(await screen.findByTestId('converter-v2')).toBeInTheDocument();
  });
});
