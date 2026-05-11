import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasExchangeShopProvider } from '../../../../config/exchangeShopProviders';
import {
  fetchExchangeShopRate,
  type ExchangeShopRate,
} from '../../../../services/moneyboxRateService';
import type { CurrencyCode } from '../../types';
import { useMoneyBoxRates } from '../useMoneyBoxRates';

vi.mock('../../../../config/exchangeShopProviders', () => ({
  hasExchangeShopProvider: vi.fn(),
}));

vi.mock('../../../../services/moneyboxRateService', () => ({
  fetchExchangeShopRate: vi.fn(),
}));

const mockKrwRate: ExchangeShopRate = {
  currency: 'KRW',
  sell: 45.25,
  buy: 45.8,
  updateTime: '2026-05-07 12:00',
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  providerName: '明洞換匯所',
  isFallback: false,
};

describe('useMoneyBoxRates', () => {
  beforeEach(() => {
    vi.mocked(hasExchangeShopProvider).mockImplementation((currency) => currency === 'KRW');
    vi.mocked(fetchExchangeShopRate).mockResolvedValue(mockKrwRate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('KRW 初始 rate 為 null 且 isLoading 為 true', () => {
    const { result } = renderHook(() => useMoneyBoxRates('KRW'));

    expect(result.current.rate).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(fetchExchangeShopRate).toHaveBeenCalledWith('KRW');
  });

  it('KRW fetch 完後回傳 mock rate 且 isLoading 為 false', async () => {
    const { result } = renderHook(() => useMoneyBoxRates('KRW'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rate).toEqual(mockKrwRate);
    expect(result.current.error).toBeNull();
  });

  it('USD 無 provider 時 skip fetch，rate null、isLoading false、error null', () => {
    const { result } = renderHook(() => useMoneyBoxRates('USD'));

    expect(result.current.rate).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetchExchangeShopRate).not.toHaveBeenCalled();
  });

  it('activeCurrency 從 KRW 改 USD 後不再額外 fetch', async () => {
    const { result, rerender } = renderHook(
      ({ activeCurrency }: { activeCurrency: CurrencyCode }) => useMoneyBoxRates(activeCurrency),
      { initialProps: { activeCurrency: 'KRW' } },
    );

    await waitFor(() => {
      expect(result.current.rate).toEqual(mockKrwRate);
    });

    rerender({ activeCurrency: 'USD' });

    expect(result.current.rate).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetchExchangeShopRate).toHaveBeenCalledTimes(1);
  });
});
