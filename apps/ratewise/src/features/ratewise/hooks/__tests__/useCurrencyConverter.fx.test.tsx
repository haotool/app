// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeQuote, type QuoteSnapshot } from '@app/shared/fx';
import { useConverterStore } from '../../../../stores/converterStore';
import { useCurrencyConverter } from '../useCurrencyConverter';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../../../../components/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../useMoneyBoxRates', () => ({ useMoneyBoxRates: () => ({ rate: null }) }));
vi.mock('../useMoneyBoxRatesMap', () => ({ useMoneyBoxRatesMap: () => ({ rates: {} }) }));
const fxFeed = vi.hoisted(() => ({
  quotes: [] as QuoteSnapshot[],
  providerStatuses: new Map<string, 'ok' | 'failed' | 'carried_forward'>(),
}));
vi.mock('../useFxQuotes', () => ({
  useFxQuotes: () => ({ ...fxFeed, releaseId: null, isLoading: false, error: null }),
}));
beforeEach(() => {
  fxFeed.quotes = [];
  fxFeed.providerStatuses.clear();
});
const quotes = normalizeQuote({
  providerId: 'second-bank',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  buy: '30',
  sell: '32',
  sourcePublishedAt: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  lastSuccessfulCheckAt: new Date().toISOString(),
  serviceCountry: 'TW',
  deliveryMethod: 'cash',
  channel: 'branch',
});
beforeEach(() =>
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'USD',
    rateType: 'cash',
    rateMode: 'auto',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'second-bank', sourceKind: 'bank' },
    },
    history: [],
    serviceCountry: 'TW',
    branchId: null,
  }),
);
describe('v3 direction quotes', () => {
  it('uses the selected provider quote for both amount input sides without legacy substitution', async () => {
    const { result } = renderHook(() =>
      useCurrencyConverter({ fxQuotes: quotes, rateType: 'cash' }),
    );
    act(() => result.current.handleFromAmountChange('320'));
    await waitFor(() => expect(result.current.toAmount).toBe('10'));
    act(() => result.current.handleToAmountChange('11'));
    await waitFor(() => expect(result.current.fromAmount).toBe('352'));
  });
});

it('does not substitute a missing manual provider, and distinguishes zero from unavailable', async () => {
  const { result, rerender } = renderHook(
    ({ rows }) => useCurrencyConverter({ fxQuotes: rows, rateType: 'cash' }),
    { initialProps: { rows: quotes } },
  );
  act(() => result.current.handleFromAmountChange('0'));
  await waitFor(() => expect(result.current.toAmount).toBe('0'));
  rerender({ rows: [] });
  await waitFor(() => expect(result.current.toAmount).toBe(''));
  act(() => result.current.addToHistory());
  expect(result.current.history).toHaveLength(0);
});

it('keeps manual conversion usable through an explicitly marked legacy fallback while v3 is unavailable', async () => {
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'USD',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({
      exchangeRates: { TWD: 1, USD: 32 },
      details: {
        USD: {
          name: '美元',
          cash: { buy: 30, sell: 32 },
          spot: { buy: 30, sell: 32 },
        },
      },
      rateType: 'cash',
    }),
  );
  act(() => result.current.handleFromAmountChange('320'));
  await waitFor(() => expect(result.current.toAmount).toBe('10'));
  expect(result.current.fxQuotes[0]?.sourceQuote.dataKind).toBe('fixed_fallback');
  expect(result.current.rankedProviderQuotes).toEqual([]);
  expect(result.current.estimateFreshness).toBe('unknown');
});

it('uses the same provider quote in multi mode and saves reproducible snapshot evidence', async () => {
  useConverterStore.setState({ baseCurrency: 'TWD' });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: quotes, rateType: 'cash', mode: 'multi' }),
  );
  act(() => result.current.handleMultiAmountChange('TWD', '320'));
  await waitFor(() => expect(result.current.multiAmounts.USD).toBe('10'));
  act(() => result.current.handleFromAmountChange('320'));
  await waitFor(() => expect(result.current.toAmount).toBe('10'));
  act(() => result.current.addToHistory());
  expect(result.current.history[0]?.quoteSnapshot?.providerId).toBe('second-bank');
});
it('keeps an explicitly selected two-leg reference out of best recommendations', async () => {
  const jpy = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    subjectCurrency: 'JPY',
    buy: '0.2',
    sell: '0.25',
  });
  useConverterStore.setState({ fromCurrency: 'USD', toCurrency: 'JPY' });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: [...quotes, ...jpy], rateType: 'cash' }),
  );
  act(() => result.current.handleFromAmountChange('10'));
  await waitFor(() => expect(result.current.toAmount).toBe('1200'));
  expect(result.current.fxEstimate).toMatchObject({ kind: 'derived_cross', recommendable: false });
  await act(() => useConverterStore.setState({ providerPreference: { mode: 'best' } }));
  await waitFor(() => expect(result.current.toAmount).toBe(''));
});
it('keeps explicit country and method when selecting another provider', () => {
  useConverterStore.getState().setRateType('spot');
  useConverterStore.getState().setProviderPreference({
    mode: 'manual',
    manualProvider: { providerId: 'moneybox', sourceKind: 'exchange-shop' },
  });
  expect(useConverterStore.getState().serviceCountry).toBe('TW');
  expect(useConverterStore.getState().rateType).toBe('spot');
});
it('exposes applicable provider quotes and ranks EXACT_OUT by required payment', async () => {
  const cheaper = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'third-bank',
    sell: '30',
  });
  const ineligible = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'wrong-branch',
    branchId: 'other',
    sell: '1',
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: [...quotes, ...cheaper, ...ineligible], rateType: 'cash' }),
  );
  act(() => result.current.handleToAmountChange('11'));
  await waitFor(() => expect(result.current.fromAmount).toBe('352'));
  expect(result.current.providerQuotes.map((q) => q.provider.providerId)).toEqual([
    'second-bank',
    'third-bank',
  ]);
  expect(
    result.current.rankedProviderQuotes.map((q) => [q.provider.providerId, q.resultAmount]),
  ).toEqual([
    ['third-bank', 330.01],
    ['second-bank', 352],
  ]);
});
it.each(['stale', 'unknown'] as const)(
  'preserves %s freshness evidence for an explicit two-leg estimate',
  async (state) => {
    const first = normalizeQuote({
      ...quotes[0]!.sourceQuote,
      sourcePublishedAt: state === 'unknown' ? null : '2020-01-01T00:00:00Z',
    });
    const second = normalizeQuote({
      ...quotes[0]!.sourceQuote,
      subjectCurrency: 'JPY',
      buy: '0.2',
      sell: '0.25',
    });
    useConverterStore.setState({ fromCurrency: 'USD', toCurrency: 'JPY' });
    const { result } = renderHook(() =>
      useCurrencyConverter({ fxQuotes: [...first, ...second], rateType: 'cash' }),
    );
    act(() => result.current.handleFromAmountChange('10'));
    await waitFor(() => expect(result.current.toAmount).toBe('1200'));
    expect(result.current.selectedQuote).toBeNull();
    expect(result.current.selectedQuoteEvidence).toHaveLength(2);
    expect(result.current.estimateFreshness).toBe(state);
  },
);

it('discloses a failed provider check for a still-fresh explicitly selected two-leg route', async () => {
  fxFeed.quotes = [
    ...quotes,
    ...normalizeQuote({
      ...quotes[0]!.sourceQuote,
      subjectCurrency: 'JPY',
      buy: '0.2',
      sell: '0.25',
    }),
  ];
  fxFeed.providerStatuses.set('second-bank', 'failed');
  useConverterStore.setState({ fromCurrency: 'USD', toCurrency: 'JPY' });
  const { result } = renderHook(() => useCurrencyConverter({ rateType: 'cash' }));
  act(() => result.current.handleFromAmountChange('10'));
  await waitFor(() => expect(result.current.toAmount).toBe('1200'));
  expect(result.current.estimateFreshness).toBe('fresh');
  expect(result.current.selectedProviderStatus).toBe('failed');
  expect(result.current.rankedProviderQuotes).toEqual([]);
});
