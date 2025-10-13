/**
 * Hook for loading real-time exchange rates from Taiwan Bank
 */

import { useState, useEffect } from 'react';
import { getExchangeRates } from '../../../services/exchangeRateService';
import { CURRENCY_DEFINITIONS } from '../constants';
import type { CurrencyCode } from '../types';

export interface ExchangeRatesState {
  rates: Record<CurrencyCode, number>;
  isLoading: boolean;
  error: Error | null;
  lastUpdate: string | null;
  source: string | null;
}

const INITIAL_STATE: ExchangeRatesState = {
  rates: Object.fromEntries(
    Object.entries(CURRENCY_DEFINITIONS).map(([code, def]) => [code, def.rate]),
  ) as Record<CurrencyCode, number>,
  isLoading: false,
  error: null,
  lastUpdate: null,
  source: null,
};

/**
 * Hook to load and manage exchange rates
 */
export function useExchangeRates() {
  const [state, setState] = useState<ExchangeRatesState>(INITIAL_STATE);

  useEffect(() => {
    let isMounted = true;

    async function loadRates() {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await getExchangeRates();

        if (!isMounted) return;

        // The fetched data is the source of truth.
        // Add TWD as the base currency.
        const newRates = { ...data.rates, TWD: 1 };

        setState({
          rates: newRates as Record<CurrencyCode, number>,
          isLoading: false,
          error: null,
          lastUpdate: data.updateTime,
          source: data.source,
        });

        console.log('✅ Exchange rates loaded:', {
          currencies: Object.keys(rates).length,
          source: data.source,
          updateTime: data.updateTime,
        });
      } catch (error) {
        if (!isMounted) return;

        console.error('Failed to load exchange rates:', error);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    }

    loadRates();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
