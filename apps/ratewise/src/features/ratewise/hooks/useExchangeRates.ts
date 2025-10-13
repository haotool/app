import { useState, useEffect } from 'react';
import { getExchangeRates } from '../../../services/exchangeRateService';
import { CURRENCY_DEFINITIONS } from '../constants';
import type { CurrencyCode } from '../types';

export interface ExchangeRatesState {
  rates: Record<CurrencyCode, number | null>;
  isLoading: boolean;
  error: Error | null;
  lastUpdate: string | null;
  source: string | null;
}

const INITIAL_STATE: ExchangeRatesState = {
  rates: Object.fromEntries(
    Object.keys(CURRENCY_DEFINITIONS).map((code) => [code, null]),
  ) as Record<CurrencyCode, number | null>,
  isLoading: true,
  error: null,
  lastUpdate: null,
  source: null,
};

export function useExchangeRates() {
  const [state, setState] = useState<ExchangeRatesState>(INITIAL_STATE);

  useEffect(() => {
    let isMounted = true;

    async function loadRates() {
      try {
        const data = await getExchangeRates();
        if (!isMounted) return;

        const newRates = { ...INITIAL_STATE.rates };

        newRates.TWD = 1;

        Object.keys(data.rates).forEach((code) => {
          if (code in newRates) {
            const rate = data.rates[code];
            newRates[code as CurrencyCode] = rate || null;
          }
        });

        setState({
          rates: newRates,
          isLoading: false,
          error: null,
          lastUpdate: data.updateTime,
          source: data.source,
        });

        console.log('✅ Exchange rates loaded:', {
          currencies: Object.values(newRates).filter((r) => r !== null).length,
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
