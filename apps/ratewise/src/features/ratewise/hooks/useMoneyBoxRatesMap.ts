import { useEffect, useMemo, useState } from 'react';
import { hasExchangeShopProvider } from '../../../config/exchangeShopProviders';
import {
  fetchExchangeShopRate,
  type ExchangeShopRatesByCurrency,
} from '../../../services/moneyboxRateService';
import type { CurrencyCode } from '../types';

const EMPTY_RATES: ExchangeShopRatesByCurrency = {};

interface MoneyBoxRatesMapState {
  rates: ExchangeShopRatesByCurrency;
  isLoading: boolean;
  error: Error | null;
  currenciesKey: string;
}

const EMPTY_STATE: MoneyBoxRatesMapState = {
  rates: EMPTY_RATES,
  isLoading: false,
  error: null,
  currenciesKey: '',
};

export function useMoneyBoxRatesMap(activeCurrencies: CurrencyCode[]): {
  rates: ExchangeShopRatesByCurrency;
  isLoading: boolean;
  error: Error | null;
} {
  const currenciesKey = useMemo(
    () =>
      Array.from(new Set(activeCurrencies.filter((currency) => hasExchangeShopProvider(currency))))
        .sort()
        .join(','),
    [activeCurrencies],
  );
  const supportedCurrencies = useMemo(
    () => (currenciesKey === '' ? [] : (currenciesKey.split(',') as CurrencyCode[])),
    [currenciesKey],
  );
  const [state, setState] = useState<MoneyBoxRatesMapState>(EMPTY_STATE);

  useEffect(() => {
    let cancelled = false;

    if (supportedCurrencies.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- active currencies 清空時需立即重置對應狀態
      setState(EMPTY_STATE);
      return () => {
        cancelled = true;
      };
    }

    setState((previous) =>
      previous.currenciesKey === currenciesKey
        ? previous
        : {
            rates: EMPTY_RATES,
            isLoading: true,
            error: null,
            currenciesKey,
          },
    );

    Promise.all(
      supportedCurrencies.map(async (currency) => {
        const rate = await fetchExchangeShopRate(currency);
        return [currency, rate] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;

        const rates = entries.reduce<ExchangeShopRatesByCurrency>((acc, [currency, rate]) => {
          if (rate) {
            acc[currency] = rate;
          }
          return acc;
        }, {});

        setState({
          rates,
          isLoading: false,
          error: null,
          currenciesKey,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          rates: EMPTY_RATES,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
          currenciesKey,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [currenciesKey, supportedCurrencies]);

  if (supportedCurrencies.length === 0) {
    return {
      rates: EMPTY_RATES,
      isLoading: false,
      error: null,
    };
  }

  if (state.currenciesKey !== currenciesKey) {
    return {
      rates: EMPTY_RATES,
      isLoading: true,
      error: null,
    };
  }

  return {
    rates: state.rates,
    isLoading: state.isLoading,
    error: state.error,
  };
}
