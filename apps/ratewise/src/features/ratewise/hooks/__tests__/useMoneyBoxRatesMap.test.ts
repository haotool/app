// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasExchangeShopProvider } from '../../../../config/exchangeShopProviders';
import {
  fetchExchangeShopRate,
  type ExchangeShopRate,
} from '../../../../services/moneyboxRateService';
import type { CurrencyCode } from '../../types';
import { useMoneyBoxRatesMap } from '../useMoneyBoxRatesMap';

vi.mock('../../../../config/exchangeShopProviders', () => ({
  hasExchangeShopProvider: vi.fn(),
}));

vi.mock('../../../../services/moneyboxRateService', () => ({
  fetchExchangeShopRate: vi.fn(),
}));

const krwRate: ExchangeShopRate = {
  currency: 'KRW',
  sell: 45.25,
  buy: 45.8,
  updateTime: '2026-05-07 12:00',
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  providerName: '明洞換匯所',
  isFallback: false,
};

describe('useMoneyBoxRatesMap', () => {
  beforeEach(() => {
    vi.mocked(hasExchangeShopProvider).mockImplementation((currency) => currency === 'KRW');
    vi.mocked(fetchExchangeShopRate).mockResolvedValue(krwRate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('activeCurrencies identity 改變但內容相同時不重複 fetch', async () => {
    const initialProps: { activeCurrencies: CurrencyCode[] } = { activeCurrencies: ['KRW'] };
    const { result, rerender } = renderHook(
      ({ activeCurrencies }) => useMoneyBoxRatesMap(activeCurrencies),
      { initialProps },
    );

    await waitFor(() => {
      expect(result.current.rates.KRW).toEqual(krwRate);
    });

    rerender({ activeCurrencies: ['KRW'] });

    expect(fetchExchangeShopRate).toHaveBeenCalledTimes(1);
  });
});
