import { useEffect, useState } from 'react';
import { hasExchangeShopProvider } from '../../../config/exchangeShopProviders';
import {
  fetchExchangeShopRate,
  type ExchangeShopRate,
} from '../../../services/moneyboxRateService';
import type { CurrencyCode } from '../types';

interface MoneyBoxRatesState {
  currency: CurrencyCode | null;
  rate: ExchangeShopRate | null;
  isLoading: boolean;
  error: Error | null;
}

const EMPTY_STATE: MoneyBoxRatesState = {
  currency: null,
  rate: null,
  isLoading: false,
  error: null,
};

function createLoadingState(activeCurrency: CurrencyCode): MoneyBoxRatesState {
  return {
    currency: activeCurrency,
    rate: null,
    isLoading: true,
    error: null,
  };
}

export function useMoneyBoxRates(activeCurrency: CurrencyCode | null): MoneyBoxRatesState {
  const [state, setState] = useState<MoneyBoxRatesState>(EMPTY_STATE);
  const hasProvider = activeCurrency !== null && hasExchangeShopProvider(activeCurrency);

  useEffect(() => {
    let cancelled = false;

    if (!hasProvider) {
      return () => {
        cancelled = true;
      };
    }

    fetchExchangeShopRate(activeCurrency)
      .then((rate) => {
        if (cancelled) return;
        setState({ currency: activeCurrency, rate, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          currency: activeCurrency,
          rate: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeCurrency, hasProvider]);

  if (!hasProvider) {
    return EMPTY_STATE;
  }

  if (state.currency !== activeCurrency) {
    return createLoadingState(activeCurrency);
  }

  return state;
}
