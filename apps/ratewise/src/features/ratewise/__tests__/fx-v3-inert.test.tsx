// @vitest-environment jsdom
/**
 * FX_V3_PUBLIC=false 惰性合併守門：App 行為必須與 origin/main 等價。
 * - 不讀取／輪詢 v3 current，不顯示 v3 來源、best 選項與新鮮度警示
 * - KRW 換錢所手動換算沿用 main 的 legacy 公式（TWD × KRW/TWD sell）
 * - 趨勢圖走 legacy 歷史服務而非 v3 hash chain 歷史
 */
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FX_V3_PUBLIC } from '../../../config/api-endpoints';
import { useConverterStore } from '../../../stores/converterStore';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import RateWise from '../RateWise';

const spies = vi.hoisted(() => ({
  useFxQuotes: vi.fn(),
  fetchFxHistory: vi.fn(),
  fetchHistoricalRatesRange: vi.fn(),
  fetchLatestRates: vi.fn(),
}));
vi.mock('../hooks/useFxQuotes', () => ({ useFxQuotes: spies.useFxQuotes }));
vi.mock('../../../services/fxSnapshotService', () => ({ fetchFxHistory: spies.fetchFxHistory }));
vi.mock('../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: spies.fetchHistoricalRatesRange,
  fetchLatestRates: spies.fetchLatestRates,
}));
vi.mock('../../../components/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
const moneyBoxRate = {
  currency: 'KRW' as const,
  sell: 41.5,
  buy: 42,
  updateTime: '2026/09/27 11:14:28',
  timestamp: Date.parse('2026-09-27T02:14:28Z'),
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  providerName: '明洞換匯所',
  isFallback: false,
};
vi.mock('../hooks/useMoneyBoxRates', () => ({ useMoneyBoxRates: () => ({ rate: moneyBoxRate }) }));
vi.mock('../hooks/useMoneyBoxRatesMap', () => ({ useMoneyBoxRatesMap: () => ({ rates: {} }) }));
const details = {
  USD: { name: '美金', spot: { buy: 31.9, sell: 32 }, cash: { buy: 31.5, sell: 32.2 } },
  KRW: { name: '韓元', spot: { buy: null, sell: null }, cash: { buy: 0.0213, sell: 0.0251 } },
};
vi.mock('../hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({
    rates: { TWD: 1, USD: 32, KRW: 0.0251 },
    details,
    isLoading: false,
    error: null,
    warning: null,
    lastUpdate: '2026/09/26 06:44:18',
    lastFetchedAt: '2026-09-25T22:44:18.761Z',
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  spies.fetchHistoricalRatesRange.mockResolvedValue([
    { date: '2026-09-25', data: { updateTime: '2026/09/25', source: 'bot', rates: { USD: 32.1 } } },
    { date: '2026-09-24', data: { updateTime: '2026/09/24', source: 'bot', rates: { USD: 32.0 } } },
  ]);
  spies.fetchLatestRates.mockResolvedValue(null);
  useConverterStore.setState({
    fromCurrency: 'TWD',
    toCurrency: 'USD',
    rateType: 'spot',
    rateMode: 'auto',
    rateSource: 'bank',
    history: [],
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  });
});

describe('FX_V3_PUBLIC=false keeps the app equivalent to main', () => {
  it('ships with the v3 public switch off', () => {
    expect(FX_V3_PUBLIC).toBe(false);
  });

  it('converts KRW with the MoneyBox legacy formula and never reads v3 quotes', async () => {
    useConverterStore.setState({
      toCurrency: 'KRW',
      rateType: 'cash',
      rateSource: 'exchange-shop',
      providerPreference: {
        mode: 'manual',
        manualProvider: { providerId: 'moneybox', sourceKind: 'exchange-shop' },
      },
    });
    const { result } = renderHook(() =>
      useCurrencyConverter({
        details,
        exchangeRates: { TWD: 1, USD: 32, KRW: 0.0251 },
        rateType: 'cash',
        rateSource: 'exchange-shop',
        mode: 'single',
      }),
    );
    act(() => result.current.handleFromAmountChange('1000'));
    // main：TWD→KRW = amount × rates.TWD.sell（KRW_PER_TWD）
    await waitFor(() => expect(result.current.toAmount).toBe('41500'));
    expect(result.current.fxEstimate).toBeUndefined();
    expect(result.current.estimatePair).toBeUndefined();
    expect(spies.useFxQuotes).not.toHaveBeenCalled();
  });

  it('renders bank conversion without v3 controls, stale warnings or v3 history', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(
        <MemoryRouter>
          <HelmetProvider>
            <RateWise rememberConverterView={false} />
          </HelmetProvider>
        </MemoryRouter>,
      );
      expect(screen.queryByText('換匯條件')).not.toBeInTheDocument();
      expect(screen.queryByText('比較未含費用牌告')).not.toBeInTheDocument();
      expect(screen.queryByText(/資料時間未知|來源未提供發布時間|牌告已超過更新門檻/)).toBeNull();
      expect(screen.queryByText(/此條件無可用牌告/)).toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });
      await waitFor(() => expect(spies.fetchHistoricalRatesRange).toHaveBeenCalled());
      expect(spies.fetchFxHistory).not.toHaveBeenCalled();
      expect(screen.queryByText(/尚無此方向的可驗證歷史|歷史含缺值/)).toBeNull();
      expect(spies.useFxQuotes).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
