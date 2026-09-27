import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, expect, it, vi } from 'vitest';
import { normalizeQuote } from '@app/shared/fx';
import { useConverterStore } from '../../stores/converterStore';
import RateWise from './RateWise';

vi.mock('../../components/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('./hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({
    rates: {},
    details: {},
    isLoading: false,
    error: null,
    warning: null,
    lastUpdate: null,
    lastFetchedAt: null,
  }),
}));
vi.mock('./hooks/useMoneyBoxRates', () => ({ useMoneyBoxRates: () => ({ rate: null }) }));
vi.mock('./hooks/useMoneyBoxRatesMap', () => ({ useMoneyBoxRatesMap: () => ({ rates: {} }) }));
vi.mock('./hooks/useFxQuotes', () => ({
  useFxQuotes: () => ({ quotes: rows, releaseId: null, isLoading: false, error: null }),
}));
const now = new Date().toISOString();
const source = {
  providerId: 'bot',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  buy: '30',
  sell: '32',
  sourcePublishedAt: '2020-01-01T00:00:00Z',
  fetchedAt: now,
  lastSuccessfulCheckAt: now,
  serviceCountry: 'TW',
  deliveryMethod: 'cash' as const,
  channel: 'branch' as const,
};
const rows = [
  ...normalizeQuote(source),
  ...normalizeQuote({
    ...source,
    subjectCurrency: 'JPY',
    buy: '0.2',
    sell: '0.25',
    sourcePublishedAt: now,
  }),
];
beforeEach(() =>
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    rateType: 'cash',
    rateMode: 'auto',
    rateSource: 'bank',
    serviceCountry: 'TW',
    branchId: null,
    history: [],
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  }),
);
it('discloses stale underlying data for a manually selected cross-currency route', () => {
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  expect(
    screen.getByText('經中介幣別的兩腿推算，非業者直接牌告；不納入推薦。'),
  ).toBeInTheDocument();
  expect(screen.getByText('資料時間未知或已過期，僅供參考。')).toBeInTheDocument();
  expect(screen.getByText(/USD → TWD：來源發布時間 2020-01-01/)).toBeInTheDocument();
});
