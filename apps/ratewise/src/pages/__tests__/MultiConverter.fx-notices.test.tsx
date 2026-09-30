import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { act } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { normalizeQuote } from '@app/shared/fx';
import { useConverterStore } from '../../stores/converterStore';
import MultiConverter from '../MultiConverter';
import type * as ApiEndpointsModule from '../../config/api-endpoints';

vi.mock('../../config/api-endpoints', async (importOriginal) => ({
  ...(await importOriginal<typeof ApiEndpointsModule>()),
  FX_V3_PUBLIC: true,
  isFxV3Public: () => true,
}));
vi.mock('../../components/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../features/ratewise/hooks/useExchangeRates', () => ({
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
vi.mock('../../features/ratewise/hooks/useMoneyBoxRates', () => ({
  useMoneyBoxRates: () => ({ rate: null }),
}));
vi.mock('../../features/ratewise/hooks/useMoneyBoxRatesMap', () => ({
  useMoneyBoxRatesMap: () => ({ rates: {} }),
}));
const fxState = vi.hoisted(() => ({
  error: null as string | null,
  quotes: [] as unknown[],
  providerStatuses: new Map<string, string>([['bot', 'ok']]),
}));
vi.mock('../../features/ratewise/hooks/useFxQuotes', () => ({
  useFxQuotes: () => ({
    quotes: fxState.quotes,
    releaseId: null,
    isLoading: false,
    error: fxState.error,
    providerStatuses: fxState.providerStatuses,
  }),
}));
// 報價必須是穩定參考，否則每次 render 都會觸發重新計算。
fxState.quotes = normalizeQuote({
  providerId: 'bot',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  providerBuyPrice: '30',
  providerSellPrice: '32',
  sourcePublishedAt: '2020-01-01T00:00:00Z',
  fetchedAt: new Date().toISOString(),
  lastSuccessfulCheckAt: new Date().toISOString(),
  serviceCountry: 'TW',
  deliveryMethod: 'cash',
  channel: 'branch',
  dataKind: 'published_board',
});

beforeEach(() => {
  fxState.error = null;
  useConverterStore.setState({
    rateType: 'cash',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  });
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <HelmetProvider>
        <MultiConverter />
      </HelmetProvider>
    </MemoryRouter>,
  );

it('discloses stale v3 quotes on the multi-currency page instead of using them silently', () => {
  renderPage();

  expect(screen.getByTestId('multi-fx-quote-notices')).toHaveTextContent(
    '牌告已超過更新門檻，僅供參考',
  );
});

it('discloses a failed refresh that keeps the cached quotes on the multi-currency page', () => {
  fxState.error = 'network';
  renderPage();

  expect(screen.getByTestId('multi-fx-quote-notices')).toHaveTextContent('最新報價更新失敗');
});

afterEach(() => vi.useRealTimers());

it('refreshes the freshness notice as the clock crosses the stale threshold', () => {
  vi.useFakeTimers();
  const now = Date.now();
  fxState.quotes = normalizeQuote({
    providerId: 'bot',
    subjectCurrency: 'USD',
    priceCurrency: 'TWD',
    unitAmount: '1',
    providerBuyPrice: '30',
    providerSellPrice: '32',
    sourcePublishedAt: new Date(now - 35 * 3_600_000).toISOString(),
    fetchedAt: new Date(now).toISOString(),
    lastSuccessfulCheckAt: new Date(now).toISOString(),
    serviceCountry: 'TW',
    deliveryMethod: 'cash',
    channel: 'branch',
    dataKind: 'published_board',
  });
  renderPage();
  expect(screen.queryByTestId('multi-fx-quote-notices')).not.toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(2 * 3_600_000);
  });

  expect(screen.getByTestId('multi-fx-quote-notices')).toHaveTextContent('牌告已超過更新門檻');
});
