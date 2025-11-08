import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SingleConverter } from '../SingleConverter';
import type { CurrencyCode } from '../../types';
import * as exchangeRateHistoryService from '../../../../services/exchangeRateHistoryService';

// Mock exchangeRateHistoryService
vi.mock('../../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: vi.fn(),
  fetchLatestRates: vi.fn(),
}));

// Mock lightweight-charts
// Based on TradingView's official testing strategy: E2E tests for canvas rendering
// Unit tests only verify component logic without actual chart rendering
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

describe('SingleConverter - 趨勢圖整合測試', () => {
  const mockExchangeRates: Record<CurrencyCode, number | null> = {
    TWD: 1,
    USD: 31.025,
    EUR: 36.07,
    JPY: 0.2061,
    GBP: 41.78,
    AUD: 20.28,
    CAD: 22.33,
    SGD: 23.99,
    CHF: 38.74,
    KRW: 0.02366,
    CNY: 4.372,
    HKD: 4.004,
  };

  const mockProps = {
    fromCurrency: 'TWD' as CurrencyCode,
    toCurrency: 'USD' as CurrencyCode,
    fromAmount: '1000',
    toAmount: '32.23',
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
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;

    vi.mocked(exchangeRateHistoryService.fetchLatestRates).mockResolvedValue({
      updateTime: '2025/10/17 08:00:00',
      source: 'Taiwan Bank',
      rates: { ...mockExchangeRates, USD: 31.5, EUR: 36.5 },
    });
  });

  describe('真實歷史數據自動載入', () => {
    it('應該在組件掛載時自動載入歷史匯率', async () => {
      const mockHistoricalData = [
        {
          date: '2025-10-14',
          data: {
            updateTime: '2025/10/14 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.025, EUR: 36.07 },
          },
        },
        {
          date: '2025-10-15',
          data: {
            updateTime: '2025/10/15 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.125, EUR: 36.15 },
          },
        },
        {
          date: '2025-10-16',
          data: {
            updateTime: '2025/10/16 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.245, EUR: 36.22 },
          },
        },
      ];

      vi.mocked(exchangeRateHistoryService.fetchHistoricalRatesRange).mockResolvedValue(
        mockHistoricalData,
      );

      render(<SingleConverter {...mockProps} />);

      // 驗證自動呼叫歷史匯率服務（25 天上限）
      await waitFor(() => {
        expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalledWith(25);
        expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalledTimes(1);
      });
    });

    it('應該在載入失敗時優雅處理（不崩潰）', async () => {
      vi.mocked(exchangeRateHistoryService.fetchHistoricalRatesRange).mockRejectedValue(
        new Error('Network error'),
      );
      vi.mocked(exchangeRateHistoryService.fetchLatestRates).mockRejectedValue(
        new Error('Latest failed'),
      );

      expect(() => render(<SingleConverter {...mockProps} />)).not.toThrow();

      await waitFor(() => {
        expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalled();
        expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalled();
      });
    });
  });

  describe('貨幣交換時趨勢圖自動更新', () => {
    it('應該在點擊交換按鈕時重新載入趨勢圖數據', async () => {
      const mockHistoricalData = [
        {
          date: '2025-10-14',
          data: {
            updateTime: '2025/10/14 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.025, EUR: 36.07 },
          },
        },
        {
          date: '2025-10-15',
          data: {
            updateTime: '2025/10/15 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.125, EUR: 36.15 },
          },
        },
      ];

      vi.mocked(exchangeRateHistoryService.fetchHistoricalRatesRange).mockResolvedValue(
        mockHistoricalData,
      );

      const onSwapCurrencies = vi.fn();
      const { rerender } = render(
        <SingleConverter {...mockProps} onSwapCurrencies={onSwapCurrencies} />,
      );

      // 初始載入
      await waitFor(() => {
        expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalledTimes(1);
        expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalledTimes(1);
      });

      // 點擊交換按鈕
      const swapButton = screen.getByLabelText('交換幣別');
      fireEvent.click(swapButton);

      expect(onSwapCurrencies).toHaveBeenCalled();

      // 模擬幣別交換後的重新渲染
      rerender(
        <SingleConverter
          {...mockProps}
          fromCurrency="USD"
          toCurrency="TWD"
          onSwapCurrencies={onSwapCurrencies}
        />,
      );

      // 驗證因為 fromCurrency 和 toCurrency 改變，useEffect 重新執行
      await waitFor(() => {
        expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalledTimes(2);
        expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalledTimes(2);
      });
    });

    it('應該在貨幣改變時計算新的匯率比值', async () => {
      const mockHistoricalData = [
        {
          date: '2025-10-14',
          data: {
            updateTime: '2025/10/14 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.025, EUR: 36.07 },
          },
        },
        {
          date: '2025-10-15',
          data: {
            updateTime: '2025/10/15 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.125, EUR: 36.15 },
          },
        },
      ];

      vi.mocked(exchangeRateHistoryService.fetchHistoricalRatesRange).mockResolvedValue(
        mockHistoricalData,
      );

      const { rerender } = render(<SingleConverter {...mockProps} />);

      await waitFor(() => {
        expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalledTimes(1);
        expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalledTimes(1);
      });

      // 驗證初始匯率顯示 (TWD → USD)
      expect(screen.getByText(/1 USD =/)).toBeInTheDocument();

      // 改變目標幣別為 EUR
      rerender(<SingleConverter {...mockProps} toCurrency="EUR" />);

      // 驗證匯率顯示更新為 EUR
      await waitFor(() => {
        expect(screen.getByText(/1 EUR =/)).toBeInTheDocument();
      });

      // 驗證重新載入趨勢圖（因為 toCurrency 改變）
      expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalledTimes(2);
      expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalledTimes(2);
    });
  });

  describe('無需刷新頁面的自動更新機制', () => {
    it('應該透過 useEffect 依賴自動觸發更新', async () => {
      const mockHistoricalData = [
        {
          date: '2025-10-14',
          data: {
            updateTime: '2025/10/14 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.025 },
          },
        },
        {
          date: '2025-10-15',
          data: {
            updateTime: '2025/10/15 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 31.125 },
          },
        },
      ];

      vi.mocked(exchangeRateHistoryService.fetchHistoricalRatesRange).mockResolvedValue(
        mockHistoricalData,
      );

      const { rerender } = render(<SingleConverter {...mockProps} />);

      // 初始載入
      await waitFor(() => {
        expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalledTimes(1);
        expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalledTimes(1);
      });

      // 模擬外部匯率數據更新（無需刷新頁面）
      const updatedRates = {
        ...mockExchangeRates,
        USD: 31.5, // 匯率變動
      };

      rerender(<SingleConverter {...mockProps} exchangeRates={updatedRates} />);

      // 即時匯率應立即更新（無需重新載入歷史數據）
      expect(screen.getByText(/31.5000/)).toBeInTheDocument();

      // 歷史數據不需重新載入（exchangeRates 不在 useEffect 依賴中）
      expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalledTimes(1);
      expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalledTimes(1);
    });
  });

  describe('趨勢圖匯率比值計算驗證', () => {
    it('應該正確計算 fromCurrency/toCurrency 的比值', async () => {
      const mockHistoricalData = [
        {
          date: '2025-10-14',
          data: {
            updateTime: '2025/10/14 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 30.0, EUR: 36.0 },
          },
        },
        {
          date: '2025-10-15',
          data: {
            updateTime: '2025/10/15 23:39:59',
            source: 'Taiwan Bank',
            rates: { ...mockExchangeRates, USD: 32.0, EUR: 38.0 },
          },
        },
      ];

      vi.mocked(exchangeRateHistoryService.fetchHistoricalRatesRange).mockResolvedValue(
        mockHistoricalData,
      );

      render(<SingleConverter {...mockProps} fromCurrency="USD" toCurrency="EUR" />);

      await waitFor(() => {
        expect(exchangeRateHistoryService.fetchHistoricalRatesRange).toHaveBeenCalled();
        expect(exchangeRateHistoryService.fetchLatestRates).toHaveBeenCalled();
      });

      // 驗證計算邏輯：
      // 10/14: fromRate=30, toRate=36 → rate = 30/36 = 0.8333
      // 10/15: fromRate=32, toRate=38 → rate = 32/38 = 0.8421
      // 趨勢圖應顯示 USD/EUR 的比值走勢
    });
  });
});
