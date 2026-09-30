// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeQuote, type QuoteSnapshot } from '@app/shared/fx';
import { getEstimateContextSubstitutions } from '../../fxEffectiveContext';
import { estimateCrossPair } from '../../fxCrossEstimate';
import { formatFxSubstitution } from '../../fxSubstitutionText';
import { useConverterStore } from '../../../../stores/converterStore';
import type * as ApiEndpointsModule from '../../../../config/api-endpoints';
import { useFxCurrencyConverter as useCurrencyConverter } from '../useCurrencyConverter';
vi.mock('../../../../config/api-endpoints', async (importOriginal) => ({
  ...(await importOriginal<typeof ApiEndpointsModule>()),
  FX_V3_PUBLIC: true,
  isFxV3Public: () => true,
}));
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
afterEach(() => vi.useRealTimers());
const quotes = normalizeQuote({
  providerId: 'second-bank',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  providerBuyPrice: '30',
  providerSellPrice: '32',
  sourcePublishedAt: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  lastSuccessfulCheckAt: new Date().toISOString(),
  serviceCountry: 'TW',
  deliveryMethod: 'cash',
  channel: 'branch',
  dataKind: 'published_board' as const,
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

  it('normalizes calculator results with excess decimals or a negative sign before estimating', async () => {
    const { result } = renderHook(() =>
      useCurrencyConverter({ fxQuotes: quotes, rateType: 'cash' }),
    );
    act(() => result.current.handleFromAmountChange('320.004999999999'));
    await waitFor(() => expect(result.current.toAmount).toBe('10'));
    act(() => result.current.handleFromAmountChange('-320'));
    await waitFor(() => expect(result.current.toAmount).toBe('-10'));
  });
});

it('names the non-TWD currency in reverse-pair delivery disclosures', async () => {
  const krwCash = normalizeQuote({ ...quotes[0]!.sourceQuote, subjectCurrency: 'KRW' });
  useConverterStore.setState({ fromCurrency: 'KRW', toCurrency: 'TWD', rateType: 'spot' });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: krwCash, rateType: 'spot' }),
  );
  act(() => result.current.handleFromAmountChange('100'));
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  const [substitution] = result.current.contextSubstitutions;
  expect(substitution).toBeDefined();
  if (substitution)
    expect(formatFxSubstitution(substitution)).toBe('KRW無即期報價，改以現鈔計算。');
});

it('refreshes quote freshness when a newer release arrives and while idle', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-29T12:00:00Z'));
  useConverterStore.setState({ providerPreference: { mode: 'best' } });
  const quoteAt = (sourcePublishedAt: string) =>
    normalizeQuote({
      ...quotes[0]!.sourceQuote,
      sourcePublishedAt,
      fetchedAt: new Date().toISOString(),
      lastSuccessfulCheckAt: new Date().toISOString(),
    });
  const { result, rerender } = renderHook(
    ({ rows }) => useCurrencyConverter({ fxQuotes: rows, rateType: 'cash' }),
    { initialProps: { rows: quoteAt('2026-09-28T10:00:00Z') } },
  );
  act(() => result.current.handleFromAmountChange('320'));

  rerender({ rows: quoteAt('2026-09-28T12:00:30Z') });
  expect(result.current.estimateFreshness).toBe('fresh');
  expect(result.current.rankedProviderQuotes.length).toBeGreaterThan(0);
  expect(result.current.toAmount).toBe('10');

  await act(async () => vi.advanceTimersByTimeAsync(120_000));
  expect(result.current.estimateFreshness).toBe('unknown');
  expect(result.current.rankedProviderQuotes).toEqual([]);
  expect(result.current.fxEstimate.status).toBe('unavailable');
  expect(result.current.toAmount).toBe('');
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
    providerBuyPrice: '0.2',
    providerSellPrice: '0.25',
  });
  useConverterStore.setState({ fromCurrency: 'USD', toCurrency: 'JPY' });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: [...quotes, ...jpy], rateType: 'cash' }),
  );
  act(() => result.current.handleFromAmountChange('10'));
  await waitFor(() => expect(result.current.toAmount).toBe('1200'));
  expect(result.current.fxEstimate).toMatchObject({ kind: 'derived_cross', recommendable: false });
  await act(() => useConverterStore.setState({ providerPreference: { mode: 'best' } }));
  await waitFor(() => expect(result.current.toAmount).toBe('1200'));
});

it('uses one requested-or-fallback delivery method for both cross legs and discloses it once', async () => {
  const usdSpot = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    subjectCurrency: 'USD',
    deliveryMethod: 'account',
    channel: 'online',
    providerBuyPrice: '30',
    providerSellPrice: '32',
  });
  const krwCash = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    subjectCurrency: 'KRW',
    providerBuyPrice: '0.023',
    providerSellPrice: '0.025',
  });
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'KRW',
    rateType: 'spot',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'second-bank', sourceKind: 'bank' },
    },
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: [...quotes, ...usdSpot, ...krwCash], rateType: 'spot' }),
  );
  act(() => result.current.handleFromAmountChange('100'));
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(result.current.fxEstimate).toMatchObject({ kind: 'derived_cross', status: 'available' });
  expect(result.current.contextSubstitutions).toEqual([
    expect.objectContaining({
      kind: 'deliveryMethod',
      from: 'account',
      to: 'cash',
      toCurrency: 'KRW',
    }),
  ]);
});

it('fills the USD multi table cross rows with one route-level method disclosure', () => {
  const foreign = ['KRW', 'VND', 'PHP', 'MYR', 'IDR'].flatMap((currency, index) =>
    normalizeQuote({
      ...quotes[0]!.sourceQuote,
      subjectCurrency: currency,
      providerBuyPrice: String(0.02 + index / 1000),
      providerSellPrice: String(0.03 + index / 1000),
    }),
  );
  const allQuotes = [...quotes, ...foreign];
  const context = {
    now: new Date().toISOString(),
    country: 'TW',
    deliveryMethod: 'account' as const,
    channel: 'online' as const,
  };
  for (const currency of ['KRW', 'VND', 'PHP', 'MYR', 'IDR']) {
    const request = {
      fromCurrency: 'USD',
      toCurrency: currency,
      amount: '100',
      mode: 'EXACT_IN' as const,
    };
    const estimate = estimateCrossPair({
      request,
      context,
      quotes: allQuotes,
      providerId: 'second-bank',
      best: false,
    });
    expect(estimate?.toAmount).toBeTruthy();
    expect(
      getEstimateContextSubstitutions({
        request,
        result: estimate!,
        context,
        providerId: 'second-bank',
        quotes: allQuotes,
      }),
    ).toEqual([
      expect.objectContaining({ kind: 'deliveryMethod', to: 'cash', toCurrency: currency }),
    ]);
  }
});

it('keeps best-mode quotes at the requested location and history records effective cross context', async () => {
  const seoul = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    subjectCurrency: 'KRW',
    serviceCountry: 'KR',
    branchId: 'seoul',
    providerBuyPrice: '0.023',
    providerSellPrice: '0.025',
    sourcePublishedAt: new Date().toISOString(),
  });
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    rateType: 'spot',
    serviceCountry: 'TW',
    providerPreference: { mode: 'best' },
  });
  const noRelocation = renderHook(() =>
    useCurrencyConverter({ fxQuotes: seoul, rateType: 'spot' }),
  );
  act(() => noRelocation.result.current.handleFromAmountChange('100'));
  await waitFor(() => expect(noRelocation.result.current.fxEstimate.status).toBe('unavailable'));
  expect(noRelocation.result.current.contextSubstitutions).toEqual([]);
  noRelocation.unmount();

  const crossCash = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    subjectCurrency: 'KRW',
    providerBuyPrice: '0.023',
    providerSellPrice: '0.025',
  });
  const manualUsd = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    subjectCurrency: 'USD',
    providerBuyPrice: '30',
    providerSellPrice: '32',
  });
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'KRW',
    rateType: 'spot',
    serviceCountry: 'TW',
    branchId: null,
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'second-bank', sourceKind: 'bank' },
    },
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: [...quotes, ...manualUsd, ...crossCash], rateType: 'spot' }),
  );
  act(() => result.current.handleFromAmountChange('100'));
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  act(() => result.current.addToHistory());
  expect(result.current.history[0]).toMatchObject({
    rateType: 'cash',
    serviceCountry: 'TW',
    branchId: null,
  });
  const history = result.current.history[0]!;
  expect(history.derivedLegs).toHaveLength(2);
  act(() => result.current.reconvertFromHistory(history));
  expect(result.current.fromAmount).toBe(history.amount);
  expect(result.current.toAmount).toBe(history.result);
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
    providerSellPrice: '30',
  });
  const ineligible = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'wrong-branch',
    branchId: 'other',
    providerSellPrice: '1',
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
    ['third-bank', 330],
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
      providerBuyPrice: '0.2',
      providerSellPrice: '0.25',
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
      providerBuyPrice: '0.2',
      providerSellPrice: '0.25',
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

it('keeps stale provider freshness evidence available when ranking excludes the quote', () => {
  const staleAt = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    sourcePublishedAt: '2020-01-01T00:00:00Z',
  });
  useConverterStore.setState({ providerPreference: { mode: 'best' } });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: staleAt, rateType: 'cash' }),
  );
  expect(result.current.rankedProviderQuotes).toEqual([]);
  expect(result.current.providerQuotes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        provider: expect.objectContaining({ providerId: 'second-bank' }),
        freshness: 'stale',
        sourcePublishedAt: '2020-01-01T00:00:00Z',
      }),
    ]),
  );
});

it('keeps a deliberate spot choice while using cash for a cash-only pair', async () => {
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    rateType: 'spot',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  });
  const cashOnly = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'bot',
    subjectCurrency: 'KRW',
    providerBuyPrice: '0.023',
    providerSellPrice: '0.025',
    sourcePublishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    lastSuccessfulCheckAt: new Date().toISOString(),
    deliveryMethod: 'cash',
    channel: 'branch',
  });
  const spotUsd = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'bot',
    deliveryMethod: 'account',
    channel: 'online',
    sourcePublishedAt: new Date().toISOString(),
  });
  const { result, rerender } = renderHook(
    ({ rateType }) => useCurrencyConverter({ fxQuotes: [...cashOnly, ...spotUsd], rateType }),
    { initialProps: { rateType: 'spot' as const } },
  );
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(useConverterStore.getState().rateType).toBe('spot');
  expect(result.current.contextSubstitutions).toContainEqual(
    expect.objectContaining({ kind: 'deliveryMethod', from: 'account', to: 'cash' }),
  );
  act(() => {
    useConverterStore.setState({ toCurrency: 'USD' });
  });
  rerender({ rateType: 'spot' });
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(useConverterStore.getState().rateType).toBe('spot');
});

it('derives the unique MoneyBox location while preserving the manually selected Taiwan location', async () => {
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    rateType: 'spot',
    serviceCountry: 'TW',
    branchId: null,
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'moneybox', sourceKind: 'exchange-shop' },
    },
  });
  const moneybox = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'moneybox',
    subjectCurrency: 'KRW',
    providerBuyPrice: '0.023',
    providerSellPrice: '0.025',
    serviceCountry: 'KR',
    branchId: 'branch-7',
    sourcePublishedAt: new Date().toISOString(),
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: moneybox, rateType: 'spot' }),
  );
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(useConverterStore.getState()).toMatchObject({
    serviceCountry: 'TW',
    branchId: null,
    rateType: 'spot',
  });
  expect(result.current.contextSubstitutions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'location',
        country: 'KR',
        branchId: 'branch-7',
      }),
      expect.objectContaining({ kind: 'deliveryMethod', to: 'cash' }),
    ]),
  );
});

it('keeps the persisted converter context unchanged through bank → MoneyBox → bank', async () => {
  const bot = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'bot',
    subjectCurrency: 'KRW',
    providerBuyPrice: '0.023',
    providerSellPrice: '0.025',
    serviceCountry: 'TW',
    sourcePublishedAt: new Date().toISOString(),
  });
  const shop = normalizeQuote({
    ...bot[0]!.sourceQuote,
    providerId: 'moneybox',
    serviceCountry: 'KR',
    branchId: 'branch-7',
  });
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    rateType: 'spot',
    serviceCountry: 'TW',
    branchId: null,
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: [...bot, ...shop], rateType: 'spot' }),
  );
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  const persisted = { ...useConverterStore.getState() };
  act(() =>
    useConverterStore.getState().setProviderPreference({
      mode: 'manual',
      manualProvider: { providerId: 'moneybox', sourceKind: 'exchange-shop' },
    }),
  );
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(useConverterStore.getState()).toMatchObject({
    serviceCountry: persisted.serviceCountry,
    branchId: persisted.branchId,
    rateType: persisted.rateType,
  });
  act(() =>
    useConverterStore.getState().setProviderPreference({
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    }),
  );
  await waitFor(() => expect(result.current.selectedQuote?.providerId).toBe('bot'));
  expect(result.current.toAmount).not.toBe('');
  expect(useConverterStore.getState()).toMatchObject({
    serviceCountry: 'TW',
    branchId: null,
    rateType: 'spot',
  });
});

it('uses a fresh cash quote for best-mode TWD → KRW without changing spot preference', async () => {
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    rateType: 'spot',
    providerPreference: { mode: 'best' },
  });
  const cashOnly = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'bot',
    subjectCurrency: 'KRW',
    providerBuyPrice: '0.023',
    providerSellPrice: '0.025',
    sourcePublishedAt: new Date().toISOString(),
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: cashOnly, rateType: 'spot' }),
  );
  act(() => result.current.handleFromAmountChange('100'));
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(useConverterStore.getState().rateType).toBe('spot');
  expect(result.current.contextSubstitutions).toContainEqual(
    expect.objectContaining({ kind: 'deliveryMethod', from: 'account', to: 'cash' }),
  );
});

it('does not persist a derived cash context when KRW is present in multi mode', async () => {
  useConverterStore.setState({
    baseCurrency: 'TWD',
    rateType: 'spot',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  });
  const krwCash = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'bot',
    subjectCurrency: 'KRW',
    providerBuyPrice: '0.023',
    providerSellPrice: '0.025',
    sourcePublishedAt: new Date().toISOString(),
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: krwCash, rateType: 'spot', mode: 'multi' }),
  );
  await waitFor(() => expect(result.current.multiAmounts.KRW).not.toBe(''));
  expect(useConverterStore.getState().rateType).toBe('spot');
  expect(result.current.contextSubstitutions).toContainEqual(
    expect.objectContaining({ toCurrency: 'KRW', kind: 'deliveryMethod', to: 'cash' }),
  );
});

it('routes best mode through TWD legs for a cross pair', async () => {
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    providerPreference: { mode: 'best' },
  });
  const now = new Date().toISOString();
  const legs = [
    ...normalizeQuote({ ...quotes[0]!.sourceQuote, sourcePublishedAt: now }),
    ...normalizeQuote({
      ...quotes[0]!.sourceQuote,
      subjectCurrency: 'JPY',
      providerBuyPrice: '0.2',
      providerSellPrice: '0.25',
      sourcePublishedAt: now,
    }),
  ];
  const { result } = renderHook(() => useCurrencyConverter({ fxQuotes: legs, rateType: 'spot' }));
  act(() => result.current.handleFromAmountChange('10'));
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(result.current.contextSubstitutions).toEqual([
    expect.objectContaining({ fromCurrency: 'USD', toCurrency: 'JPY', kind: 'deliveryMethod' }),
  ]);
  act(() => result.current.handleFromAmountChange('-10'));
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(result.current.contextSubstitutions).toEqual([
    expect.objectContaining({ fromCurrency: 'USD', toCurrency: 'JPY', kind: 'deliveryMethod' }),
  ]);
});

it('records the actual provider and keeps best mode when a best cross result is saved to history', async () => {
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    providerPreference: { mode: 'best' },
  });
  const now = new Date().toISOString();
  const legs = [
    ...normalizeQuote({ ...quotes[0]!.sourceQuote, sourcePublishedAt: now }),
    ...normalizeQuote({
      ...quotes[0]!.sourceQuote,
      subjectCurrency: 'JPY',
      providerBuyPrice: '0.2',
      providerSellPrice: '0.25',
      sourcePublishedAt: now,
    }),
  ];
  const { result } = renderHook(() => useCurrencyConverter({ fxQuotes: legs, rateType: 'spot' }));
  act(() => result.current.handleFromAmountChange('10'));
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  act(() => result.current.addToHistory());
  const saved = result.current.history[0]!;

  expect(saved.providerId).toBe(quotes[0]!.providerId);
  expect(saved.providerSelectionMode).toBe('best');
  act(() => result.current.reconvertFromHistory(saved));
  expect(useConverterStore.getState().providerPreference.mode).toBe('best');
});

it('uses only fresh, successful provider legs for a best-mode cross pair', async () => {
  const leg = (providerId: string, subjectCurrency: string, publishedAt: string) =>
    normalizeQuote({
      ...quotes[0]!.sourceQuote,
      providerId,
      subjectCurrency,
      providerBuyPrice: subjectCurrency === 'JPY' ? '0.2' : '30',
      providerSellPrice: subjectCurrency === 'JPY' ? '0.25' : '32',
      sourcePublishedAt: publishedAt,
    });
  const now = new Date().toISOString();
  fxFeed.quotes = [
    ...leg('good-bank', 'USD', now),
    ...leg('good-bank', 'JPY', now),
    ...leg('stale-bank', 'USD', '2020-01-01T00:00:00Z'),
    ...leg('stale-bank', 'JPY', now),
    ...leg('failed-bank', 'USD', now),
    ...leg('failed-bank', 'JPY', now),
  ];
  fxFeed.providerStatuses.set('good-bank', 'ok');
  fxFeed.providerStatuses.set('stale-bank', 'ok');
  fxFeed.providerStatuses.set('failed-bank', 'failed');
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    providerPreference: { mode: 'best' },
  });
  const { result } = renderHook(() => useCurrencyConverter({ rateType: 'cash' }));
  act(() => result.current.handleFromAmountChange('10'));
  await waitFor(() => expect(result.current.toAmount).toBe('1200'));
  const goodLegIds = fxFeed.quotes
    .filter(
      (quote) =>
        quote.providerId === 'good-bank' &&
        ((quote.fromCurrency === 'USD' && quote.toCurrency === 'TWD') ||
          (quote.fromCurrency === 'TWD' && quote.toCurrency === 'JPY')),
    )
    .map((quote) => quote.quoteId);
  expect('legs' in result.current.fxEstimate && result.current.fxEstimate.legs).toEqual(
    expect.arrayContaining(goodLegIds),
  );
  expect(result.current.estimateFreshness).toBe('fresh');
});

it('falls back to applicable unknown BoT legs when best cross ranking has no eligible combination', async () => {
  const botUnknown = (subjectCurrency: string) =>
    normalizeQuote({
      ...quotes[0]!.sourceQuote,
      providerId: 'bot',
      subjectCurrency,
      providerBuyPrice: subjectCurrency === 'JPY' ? '0.2' : '30',
      providerSellPrice: subjectCurrency === 'JPY' ? '0.25' : '32',
      sourcePublishedAt: null,
    });
  fxFeed.quotes = [...botUnknown('USD'), ...botUnknown('JPY')];
  fxFeed.providerStatuses.set('bot', 'failed');
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    providerPreference: { mode: 'best' },
  });
  const { result } = renderHook(() => useCurrencyConverter({ rateType: 'cash' }));
  act(() => result.current.handleFromAmountChange('10'));
  await waitFor(() => expect(result.current.toAmount).toBe('1200'));
  expect(result.current.estimateFreshness).toBe('unknown');
  expect(result.current.selectedProviderStatus).toBe('failed');
});

it('uses applicable default BoT quote when best ranking has no fresh quote', async () => {
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'USD',
    providerPreference: { mode: 'best' },
  });
  const botUnknown = normalizeQuote({
    ...quotes[0]!.sourceQuote,
    providerId: 'bot',
    sourcePublishedAt: null,
  });
  const { result } = renderHook(() =>
    useCurrencyConverter({ fxQuotes: botUnknown, rateType: 'cash' }),
  );
  act(() => result.current.handleFromAmountChange('320'));
  await waitFor(() => expect(result.current.toAmount).not.toBe(''));
  expect(result.current.estimateFreshness).toBe('unknown');
});
