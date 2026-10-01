import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    lastUpdate: fxState.lastUpdate,
    lastFetchedAt: null,
  }),
}));
vi.mock('./hooks/useMoneyBoxRates', () => ({
  useMoneyBoxRates: () => ({ rate: fxState.legacyMoneyBoxRate }),
}));
vi.mock('./hooks/useMoneyBoxRatesMap', () => ({ useMoneyBoxRatesMap: () => ({ rates: {} }) }));
const fxState = vi.hoisted(() => ({
  error: null as string | null,
  fallback: false,
  rows: null as unknown[] | null,
  legacyMoneyBoxRate: null as unknown,
  lastUpdate: null as string | null,
  providerStatuses: undefined as Map<string, string> | undefined,
}));
vi.mock('./hooks/useFxQuotes', () => ({
  useFxQuotes: () => ({
    quotes: fxState.fallback ? [] : (fxState.rows ?? rows),
    releaseId: null,
    isLoading: false,
    error: fxState.error,
    providerStatuses: fxState.providerStatuses,
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
beforeEach(() => {
  fxState.rows = null;
  fxState.error = null;
  fxState.fallback = false;
  fxState.providerStatuses = undefined;
  fxState.legacyMoneyBoxRate = null;
  fxState.lastUpdate = null;
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
  });
});
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
      new RegExp(
        `USD → TWD：來源發布時間 ${formatIsoTimestamp('2020-01-01T00:00:00Z', { includeYear: true })}`,
      ),
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
  expect(screen.getByRole('status', { name: '報價來源狀態' })).toHaveTextContent('未列入最佳推薦');
  expect(screen.getByRole('status', { name: '報價來源狀態' })).toHaveTextContent('01/02 08:00');
});

it('discloses a provider excluded from best recommendation because its publication time is unknown', () => {
  fxState.rows = [
    ...normalizeQuote({ ...source, sourcePublishedAt: now }),
    ...normalizeQuote({ ...source, providerId: 'second-bank', sourcePublishedAt: null }),
  ];
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'TWD',
    providerPreference: { mode: 'best' },
  });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('status', { name: '報價來源狀態' })).toHaveTextContent(
    '來源未提供可判斷的發布時間，未列入最佳推薦',
  );
});

it('tells the user when a refresh failed and cached verified quotes are still shown', () => {
  fxState.error = 'network';
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('status', { name: '報價來源狀態' })).toHaveTextContent(
    '最新報價更新失敗，暫以上次已驗證的報價顯示',
  );
  expect(
    screen.queryByText('最新報價載入失敗，暫以備援牌告顯示，換錢所報價暫不可用。'),
  ).not.toBeInTheDocument();
  fxState.error = null;
});

it('builds the exchange shop badge from the verified v3 quote instead of the legacy endpoint', () => {
  const published = '2026-09-30T08:00:00Z';
  fxState.lastUpdate = published;
  fxState.legacyMoneyBoxRate = {
    currency: 'KRW',
    sell: 1,
    buy: 1,
    updateTime: 'LEGACY-STAMP',
    timestamp: null,
    source: 'MoneyBox',
    sourceUrl: 'https://example.com',
    providerName: '明洞換匯所',
    isFallback: true,
  };
  fxState.rows = normalizeQuote({
    ...source,
    providerId: 'moneybox',
    subjectCurrency: 'TWD',
    priceCurrency: 'KRW',
    serviceCountry: 'KR',
    branchId: 'myeongdong',
    sourcePublishedAt: published,
  });
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'KRW',
    serviceCountry: 'KR',
    branchId: 'myeongdong',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'moneybox', sourceKind: 'exchange-shop' },
    },
  });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  const badge = screen.getByTestId('ratewise-data-source');
  expect(badge).toHaveTextContent(formatIsoTimestamp(published, { includeYear: true }));
  expect(badge).not.toHaveTextContent('LEGACY-STAMP');
  expect(badge).not.toHaveTextContent('備援');
  fxState.legacyMoneyBoxRate = null;
  fxState.lastUpdate = null;
});

it('shows the exchange shop badge for a direct non-TWD v3 quote such as USD to KRW', () => {
  const published = '2026-09-30T08:00:00Z';
  fxState.lastUpdate = published;
  fxState.rows = normalizeQuote({
    ...source,
    providerId: 'moneybox',
    subjectCurrency: 'USD',
    priceCurrency: 'KRW',
    serviceCountry: 'KR',
    branchId: 'myeongdong',
    sourcePublishedAt: published,
  });
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'KRW',
    serviceCountry: 'KR',
    branchId: 'myeongdong',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'moneybox', sourceKind: 'exchange-shop' },
    },
  });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  const badge = screen.getByTestId('ratewise-data-source');
  expect(badge).toHaveTextContent('MoneyBox');
  expect(badge).not.toHaveTextContent('臺灣銀行');
  fxState.lastUpdate = null;
});

it('shows the BoT publication time from the adopted v3 quote instead of the legacy update time', () => {
  const published = '2026-09-30T08:00:00Z';
  fxState.lastUpdate = '2020-01-01T00:00:00Z';
  fxState.rows = normalizeQuote({ ...source, sourcePublishedAt: published });
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
  const badge = screen.getByTestId('ratewise-data-source');
  expect(badge).toHaveTextContent(formatIsoTimestamp(published, { includeYear: true }));
  expect(badge).not.toHaveTextContent('2020');
  fxState.lastUpdate = null;
});

it('discloses a fresh provider excluded from best recommendation because its check failed', () => {
  fxState.rows = [
    ...normalizeQuote({ ...source, sourcePublishedAt: now }),
    ...normalizeQuote({ ...source, providerId: 'second-bank', sourcePublishedAt: now }),
  ];
  fxState.providerStatuses = new Map([
    ['bot', 'ok'],
    ['second-bank', 'failed'],
  ]);
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'TWD',
    providerPreference: { mode: 'best' },
  });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('status', { name: '報價來源狀態' })).toHaveTextContent(
    '來源最近檢查未成功，未列入最佳推薦',
  );
  fxState.providerStatuses = undefined;
});

it('renders two stale quotes from one provider without duplicate React keys', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  fxState.rows = [
    ...normalizeQuote({ ...source, sourcePublishedAt: now }),
    ...normalizeQuote({
      ...source,
      providerId: 'second-bank',
      sourcePublishedAt: '2020-01-01T00:00:00Z',
    }),
    ...normalizeQuote({
      ...source,
      providerId: 'second-bank',
      sourcePublishedAt: '2020-01-02T00:00:00Z',
    }),
  ];
  useConverterStore.setState({
    fromCurrency: 'USD',
    toCurrency: 'TWD',
    providerPreference: { mode: 'best' },
  });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  const status = screen.getByRole('status', { name: '報價來源狀態' });
  expect(status.querySelectorAll('p')).toHaveLength(2);
  expect(errors.mock.calls.flat().join(' ')).not.toMatch(/unique "key" prop/i);
  errors.mockRestore();
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
  expect(screen.getByRole('status', { name: '報價來源狀態' })).toHaveTextContent(
    '最新報價載入失敗，暫以備援牌告顯示，換錢所報價暫不可用',
  );
  fxState.error = null;
  fxState.fallback = false;
});

it('restores the original rate switch and keeps normal v3 details outside the conversion card', () => {
  useConverterStore.setState({ fromCurrency: 'TWD', toCurrency: 'JPY' });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('button', { name: /切換到現金/ })).toBeVisible();
  expect(screen.getByText('依牌告試算，未含未知費用；不保證成交或可交付面額。')).not.toBeVisible();
  expect(screen.getByText('報價詳情')).toBeVisible();
  expect(screen.getByLabelText('換匯地點')).not.toBeVisible();
  expect(screen.queryByLabelText('換匯方式')).not.toBeInTheDocument();
});

it('the restored cash/account switch changes the v3 estimate without overwriting location', async () => {
  fxState.rows = [
    ...normalizeQuote({ ...source, sourcePublishedAt: now }),
    ...normalizeQuote({
      ...source,
      sourcePublishedAt: now,
      deliveryMethod: 'account',
      channel: 'online',
      providerSellPrice: '31',
    }),
  ];
  useConverterStore.setState({ fromCurrency: 'TWD', toCurrency: 'USD', serviceCountry: 'KR' });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /轉換結果/ })).toHaveTextContent('31.25'),
  );
  fireEvent.click(screen.getByRole('button', { name: /切換到即期/ }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /轉換結果/ })).toHaveTextContent('32.26'),
  );
  expect(useConverterStore.getState().rateType).toBe('spot');
  expect(useConverterStore.getState().serviceCountry).toBe('KR');
  expect(useConverterStore.getState().providerPreference.manualProvider?.providerId).toBe('bot');
});

it('cash substitution is shown as cash while the requested account preference is preserved', () => {
  useConverterStore.setState({ fromCurrency: 'TWD', toCurrency: 'JPY', rateType: 'spot' });
  render(
    <MemoryRouter>
      <HelmetProvider>
        <RateWise />
      </HelmetProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('button', { name: /切換到現金/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', { name: /切換到即期/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  expect(useConverterStore.getState().rateType).toBe('spot');
  expect(screen.getByRole('status', { name: '報價來源狀態' })).toHaveTextContent(
    'JPY無即期報價，改以現鈔計算',
  );
});
