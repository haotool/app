import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, expect, it, vi } from 'vitest';
import { formatIsoTimestamp } from '../../utils/timeFormatter';
import { normalizeQuote } from '@app/shared/fx';
import { useConverterStore } from '../../stores/converterStore';
import RateWise from './RateWise';
import type * as ApiEndpointsModule from '../../config/api-endpoints';

vi.mock('../../config/api-endpoints', async (importOriginal) => ({
  ...(await importOriginal<typeof ApiEndpointsModule>()),
  FX_V3_PUBLIC: true,
  isFxV3Public: () => true,
}));
vi.mock('../../components/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('./hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({
    rates: {},
    details: fxState.fallback
      ? { USD: { name: '美元', spot: { buy: 30, sell: 32 }, cash: { buy: 29, sell: 33 } } }
      : {},
    isLoading: false,
    error: null,
    warning: null,
    lastUpdate: null,
    lastFetchedAt: null,
  }),
}));
vi.mock('./hooks/useMoneyBoxRates', () => ({ useMoneyBoxRates: () => ({ rate: null }) }));
vi.mock('./hooks/useMoneyBoxRatesMap', () => ({ useMoneyBoxRatesMap: () => ({ rates: {} }) }));
const fxState = vi.hoisted(() => ({ error: null as string | null, fallback: false }));
vi.mock('./hooks/useFxQuotes', () => ({
  useFxQuotes: () => ({
    quotes: fxState.fallback ? [] : rows,
    releaseId: null,
    isLoading: false,
    error: fxState.error,
  }),
}));
const now = new Date().toISOString();
const source = {
  providerId: 'bot',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  providerBuyPrice: '30',
  providerSellPrice: '32',
  sourcePublishedAt: '2020-01-01T00:00:00Z',
  fetchedAt: now,
  lastSuccessfulCheckAt: now,
  serviceCountry: 'TW',
  deliveryMethod: 'cash' as const,
  channel: 'branch' as const,
  dataKind: 'published_board' as const,
};
const rows = [
  ...normalizeQuote(source),
  ...normalizeQuote({
    ...source,
    providerId: 'second-bank',
    sourcePublishedAt: '2020-01-02T00:00:00Z',
  }),
  ...normalizeQuote({
    ...source,
    subjectCurrency: 'JPY',
    providerBuyPrice: '0.2',
    providerSellPrice: '0.25',
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
  expect(
    screen.getByText('牌告已超過更新門檻（台銀 36 小時、換錢所 24 小時），僅供參考。'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      new RegExp(`USD → TWD：來源發布時間 ${formatIsoTimestamp('2020-01-01T00:00:00Z')}`),
    ),
  ).toBeInTheDocument();
});

it('renders the stale provider excluded from best recommendation in the status region', () => {
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'TWD',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('status', { name: '其他來源牌告狀態' })).toHaveTextContent(
    '未列入最佳推薦',
  );
  expect(screen.getByRole('status', { name: '其他來源牌告狀態' })).toHaveTextContent('01/02 08:00');
});

it('shows one degraded notice when v3 fetch fails and a BoT fallback quote is available', () => {
  fxState.error = 'network';
  fxState.fallback = true;
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  expect(screen.getByTestId('fx-v3-degraded-notice')).toHaveTextContent(
    '最新報價載入失敗，暫以備援牌告顯示，換錢所報價暫不可用',
  );
  fxState.error = null;
  fxState.fallback = false;
});
