import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type * as CurrenciesModule from '../../config/currencies';
import { useStore } from '../../store/useStore';

vi.mock('../../lib/exchangeRate', () => ({
  fetchMoneyboxRate: vi.fn().mockResolvedValue({ krwPerTwd: 43.5, updatedAt: '2026-01-01' }),
}));

vi.mock('../../config/currencies', async (importOriginal) => {
  const actual = await importOriginal<typeof CurrenciesModule>();
  return {
    ...actual,
    detectCurrencyFromTimezone: vi.fn(() => 'KRW' as const),
  };
});

import { useCurrencyAutoDetect } from '../useCurrencyAutoDetect';
import { detectCurrencyFromTimezone } from '../../config/currencies';

describe('useCurrencyAutoDetect', () => {
  beforeEach(() => {
    vi.mocked(detectCurrencyFromTimezone).mockReturnValue('KRW');
    useStore.setState({
      currency: 'TWD',
      currencyManuallySet: false,
      currentTripId: 'default-trip',
      expenses: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('混幣風險時跳過自動切換幣別', async () => {
    useStore.setState({
      expenses: [
        {
          id: 'exp-1',
          tripId: 'default-trip',
          type: 'split_evenly',
          participantIds: ['me'],
          paidBy: 'me',
          totalAmount: 100,
          perPersonAmounts: { me: 100 },
          note: '',
          createdAt: 1,
          currency: 'TWD',
        },
      ],
    });

    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      expect(useStore.getState().currency).toBe('TWD');
    });
  });

  it('無混幣風險時依時區自動切換', async () => {
    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      expect(useStore.getState().currency).toBe('KRW');
    });
  });
});
