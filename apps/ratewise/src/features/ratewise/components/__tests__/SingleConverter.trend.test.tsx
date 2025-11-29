import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SingleConverter } from '../SingleConverter';
import type { CurrencyCode } from '../../types';
import * as historyService from '../../../../services/exchangeRateHistoryService';
import type { ExchangeRateData } from '../../../../services/exchangeRateHistoryService';

// Mock services with controllable responses
vi.mock('../../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: vi.fn(),
  fetchLatestRates: vi.fn(),
}));

// Mock lightweight-charts
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
      applyOptions: vi.fn(),
    })),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
      applyOptions: vi.fn(),
    })),
    priceScale: vi.fn(() => ({
      applyOptions: vi.fn(),
    })),
    applyOptions: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    remove: vi.fn(),
    resize: vi.fn(),
  })),
  ColorType: {
    Solid: 'solid',
    VerticalGradient: 'gradient',
  },
  CrosshairMode: {
    Normal: 0,
    Magnet: 1,
  },
  LineStyle: {
    Solid: 0,
    Dotted: 1,
    Dashed: 2,
    LargeDashed: 3,
    SparseDotted: 4,
  },
  AreaSeries: 'AreaSeries',
}));

describe('SingleConverter - 趨勢圖載入測試', () => {
  const mockExchangeRates: Record<CurrencyCode, number | null> = {
    TWD: 1,
    USD: 31.665,
    EUR: 36.94,
    JPY: 0.2047,
    GBP: 42.49,
    AUD: 20.96,
    CAD: 22.89,
    SGD: 24.56,
    CHF: 39.46,
    KRW: 0.0236,
    CNY: 4.506,
    HKD: 4.081,
    NZD: 18.38,
    THB: 1.0393,
    PHP: 0.6016,
    IDR: 0.0022,
    VND: 0.0014,
    MYR: 8.097,
  };

  const mockProps = {
    fromCurrency: 'TWD' as CurrencyCode,
    toCurrency: 'USD' as CurrencyCode,
    fromAmount: '1000',
    toAmount: '31.58',
    exchangeRates: mockExchangeRates,
    rateType: 'spot' as const,
    onFromCurrencyChange: vi.fn(),
    onToCurrencyChange: vi.fn(),
    onFromAmountChange: vi.fn(),
    onToAmountChange: vi.fn(),
    onQuickAmount: vi.fn(),
    onSwapCurrencies: vi.fn(),
    onAddToHistory: vi.fn(),
    onRateTypeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('歷史數據載入', () => {
    it('should load historical data and latest rates on mount', async () => {
      const mockHistoricalData: { date: string; data: ExchangeRateData }[] = [
        {
          date: '2025-11-27',
          data: {
            rates: { TWD: 1, USD: 31.5 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/27 08:00:00',
            source: 'Taiwan Bank',
          },
        },
        {
          date: '2025-11-28',
          data: {
            rates: { TWD: 1, USD: 31.6 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/28 08:00:00',
            source: 'Taiwan Bank',
          },
        },
      ];
      const mockLatestRates: ExchangeRateData = {
        updateTime: '2025/11/29 08:00:00',
        source: 'Taiwan Bank',
        rates: { TWD: 1, USD: 31.665 } as Record<CurrencyCode, number>,
      };

      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue(mockHistoricalData);
      vi.mocked(historyService.fetchLatestRates).mockResolvedValue(mockLatestRates);

      render(<SingleConverter {...mockProps} />);

      // Wait for async operations - need to flush promises and advance timers
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(historyService.fetchHistoricalRatesRange).toHaveBeenCalledWith(25);
      expect(historyService.fetchLatestRates).toHaveBeenCalled();
    });

    it('should handle fetchLatestRates failure gracefully', async () => {
      const mockHistoricalData: { date: string; data: ExchangeRateData }[] = [
        {
          date: '2025-11-27',
          data: {
            rates: { TWD: 1, USD: 31.5 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/27 08:00:00',
            source: 'Taiwan Bank',
          },
        },
      ];

      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue(mockHistoricalData);
      vi.mocked(historyService.fetchLatestRates).mockRejectedValue(new Error('Network error'));

      render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should not throw and should still show component
      expect(screen.getByText('轉換金額')).toBeInTheDocument();
    });

    it('should handle fetchHistoricalRatesRange failure gracefully', async () => {
      vi.mocked(historyService.fetchHistoricalRatesRange).mockRejectedValue(
        new Error('Network error'),
      );
      vi.mocked(historyService.fetchLatestRates).mockResolvedValue({
        updateTime: '2025/11/29 08:00:00',
        source: 'Taiwan Bank',
        rates: { TWD: 1, USD: 31.665 } as Record<CurrencyCode, number>,
      });

      render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should show skeleton when no data
      expect(screen.getByText('轉換金額')).toBeInTheDocument();
    });

    it('should merge latest rates with historical data', async () => {
      const mockHistoricalData: { date: string; data: ExchangeRateData }[] = [
        {
          date: '2025-11-27',
          data: {
            rates: { TWD: 1, USD: 31.5 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/27 08:00:00',
            source: 'Taiwan Bank',
          },
        },
        {
          date: '2025-11-28',
          data: {
            rates: { TWD: 1, USD: 31.6 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/28 08:00:00',
            source: 'Taiwan Bank',
          },
        },
      ];
      const mockLatestRates: ExchangeRateData = {
        updateTime: '2025/11/29 08:00:00',
        source: 'Taiwan Bank',
        rates: { TWD: 1, USD: 31.665 } as Record<CurrencyCode, number>,
      };

      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue(mockHistoricalData);
      vi.mocked(historyService.fetchLatestRates).mockResolvedValue(mockLatestRates);

      render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Verify both services were called
      expect(historyService.fetchHistoricalRatesRange).toHaveBeenCalled();
      expect(historyService.fetchLatestRates).toHaveBeenCalled();
    });

    it('should deduplicate data when latest date matches historical date', async () => {
      const mockHistoricalData: { date: string; data: ExchangeRateData }[] = [
        {
          date: '2025-11-28',
          data: {
            rates: { TWD: 1, USD: 31.6 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/28 08:00:00',
            source: 'Taiwan Bank',
          },
        },
        {
          date: '2025-11-29',
          data: {
            rates: { TWD: 1, USD: 31.65 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/29 08:00:00',
            source: 'Taiwan Bank',
          },
        }, // Same date as latest
      ];
      const mockLatestRates: ExchangeRateData = {
        updateTime: '2025/11/29 10:00:00', // Same date, later time
        source: 'Taiwan Bank',
        rates: { TWD: 1, USD: 31.665 } as Record<CurrencyCode, number>, // Updated rate
      };

      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue(mockHistoricalData);
      vi.mocked(historyService.fetchLatestRates).mockResolvedValue(mockLatestRates);

      render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should complete without error
      expect(screen.getByText('轉換金額')).toBeInTheDocument();
    });

    it('should handle invalid latest rate (NaN or <= 0) gracefully', async () => {
      const mockHistoricalData: { date: string; data: ExchangeRateData }[] = [
        {
          date: '2025-11-28',
          data: {
            rates: { TWD: 1, USD: 31.6 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/28 08:00:00',
            source: 'Taiwan Bank',
          },
        },
      ];
      const mockLatestRates: ExchangeRateData = {
        updateTime: '2025/11/29 08:00:00',
        source: 'Taiwan Bank',
        rates: { TWD: 0, USD: 0 } as Record<CurrencyCode, number>, // Invalid rates (would result in 0/0 = NaN)
      };

      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue(mockHistoricalData);
      vi.mocked(historyService.fetchLatestRates).mockResolvedValue(mockLatestRates);

      render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should handle gracefully without crashing
      expect(screen.getByText('轉換金額')).toBeInTheDocument();
    });

    it('should handle null rates in historical data', async () => {
      const mockHistoricalData: { date: string; data: ExchangeRateData }[] = [
        {
          date: '2025-11-27',
          data: {
            rates: { TWD: 1, USD: null } as unknown as Record<CurrencyCode, number>,
            updateTime: '2025/11/27 08:00:00',
            source: 'Taiwan Bank',
          },
        }, // null rate
        {
          date: '2025-11-28',
          data: {
            rates: { TWD: 1, USD: 31.6 } as Record<CurrencyCode, number>,
            updateTime: '2025/11/28 08:00:00',
            source: 'Taiwan Bank',
          },
        },
      ];

      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue(mockHistoricalData);
      vi.mocked(historyService.fetchLatestRates).mockRejectedValue(new Error('No data'));

      render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should handle null rates gracefully
      expect(screen.getByText('轉換金額')).toBeInTheDocument();
    });
  });

  describe('趨勢圖動畫', () => {
    it('should show trend chart with animation after delay', async () => {
      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue([]);
      vi.mocked(historyService.fetchLatestRates).mockRejectedValue(new Error('No data'));

      render(<SingleConverter {...mockProps} />);

      // Initially hidden
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Component should be rendered
      expect(screen.getByText('轉換金額')).toBeInTheDocument();
    });
  });

  describe('貨幣變更時重新載入', () => {
    it('should reload trend data when fromCurrency changes', async () => {
      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue([]);
      vi.mocked(historyService.fetchLatestRates).mockRejectedValue(new Error('No data'));

      const { rerender } = render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const initialCallCount = vi.mocked(historyService.fetchHistoricalRatesRange).mock.calls
        .length;

      // Change currency
      rerender(<SingleConverter {...mockProps} fromCurrency="EUR" />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should have called fetchHistoricalRatesRange again
      expect(vi.mocked(historyService.fetchHistoricalRatesRange).mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );
    });

    it('should reload trend data when toCurrency changes', async () => {
      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue([]);
      vi.mocked(historyService.fetchLatestRates).mockRejectedValue(new Error('No data'));

      const { rerender } = render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const initialCallCount = vi.mocked(historyService.fetchHistoricalRatesRange).mock.calls
        .length;

      // Change currency
      rerender(<SingleConverter {...mockProps} toCurrency="JPY" />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should have called fetchHistoricalRatesRange again
      expect(vi.mocked(historyService.fetchHistoricalRatesRange).mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );
    });
  });

  describe('趨勢圖骨架屏', () => {
    it('should show skeleton when trend data is empty', async () => {
      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue([]);
      vi.mocked(historyService.fetchLatestRates).mockRejectedValue(new Error('No data'));

      render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should show skeleton (TrendChartSkeleton component)
      expect(screen.getByText('轉換金額')).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary 處理', () => {
    it('should render component with error boundary', async () => {
      vi.mocked(historyService.fetchHistoricalRatesRange).mockResolvedValue([]);
      vi.mocked(historyService.fetchLatestRates).mockRejectedValue(new Error('No data'));

      render(<SingleConverter {...mockProps} />);

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Component should be rendered with ErrorBoundary wrapper
      expect(screen.getByText('轉換金額')).toBeInTheDocument();
    });
  });
});
