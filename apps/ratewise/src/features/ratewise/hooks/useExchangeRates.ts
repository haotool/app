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
  rates: {},
  isLoading: true, // Start in loading state
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
      // No need to set loading state here as it starts with true

      try {
        const data = await getExchangeRates();

        if (!isMounted) return;

        // Create a new rates object based on all possible currencies
        const newRates = Object.fromEntries(
          Object.keys(CURRENCY_DEFINITIONS).map((code) => [code, null]),
        ) as Record<CurrencyCode, number | null>;

        // Set TWD as the base
        newRates.TWD = 1;

        // Merge real-time rates from the fetch response
        Object.keys(data.rates).forEach((code) => {
          if (code in newRates) {
            newRates[code as CurrencyCode] = data.rates[code];
          }
        });

        setState({
          rates: newRates as Record<CurrencyCode, number>, // Asserting here, but downstream handles null
          isLoading: false,
          error: null,
          lastUpdate: data.updateTime,
          source: data.source,
        });

        console.log('✅ Exchange rates loaded:', {
          currencies: Object.keys(newRates).filter((k) => newRates[k as CurrencyCode] !== null)
            .length,
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
