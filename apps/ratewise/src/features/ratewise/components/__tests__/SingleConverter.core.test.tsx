import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SingleConverter } from '../SingleConverter';
import type { CurrencyCode } from '../../types';
import { CURRENCY_DEFINITIONS } from '../../constants';

// Mock services
vi.mock('../../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: vi.fn().mockResolvedValue([]),
  fetchLatestRates: vi.fn().mockResolvedValue({
    updateTime: '2025/11/29 08:00:00',
    source: 'Taiwan Bank',
    rates: {},
  }),
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

describe('SingleConverter - 核心功能測試', () => {
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

    // Mock window.scrollTo (jsdom limitation)
    Object.defineProperty(window, 'scrollTo', {
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

    // Restore navigator.vibrate for next test
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  describe('貨幣選擇', () => {
    it('should call onFromCurrencyChange when from currency changes', () => {
      render(<SingleConverter {...mockProps} />);

      const fromSelect = screen.getByLabelText('選擇來源貨幣');
      fireEvent.change(fromSelect, { target: { value: 'EUR' } });

      expect(mockProps.onFromCurrencyChange).toHaveBeenCalledWith('EUR');
    });

    it('should call onToCurrencyChange when to currency changes', () => {
      render(<SingleConverter {...mockProps} />);

      const toSelect = screen.getByLabelText('選擇目標貨幣');
      fireEvent.change(toSelect, { target: { value: 'JPY' } });

      expect(mockProps.onToCurrencyChange).toHaveBeenCalledWith('JPY');
    });

    it('should render all currency options in both selects', { timeout: 15000 }, () => {
      render(<SingleConverter {...mockProps} />);

      const fromSelect = screen.getByLabelText('選擇來源貨幣');
      const toSelect = screen.getByLabelText('選擇目標貨幣');

      const currencyCodes = Object.keys(CURRENCY_DEFINITIONS);

      // 只取一次 options 以避免重複 DOM 查詢
      const fromOptions = within(fromSelect as HTMLElement).getAllByRole('option');
      const toOptions = within(toSelect as HTMLElement).getAllByRole('option');

      const fromValues = fromOptions.map((opt) => (opt as HTMLOptionElement).value);
      const toValues = toOptions.map((opt) => (opt as HTMLOptionElement).value);

      // 驗證所有貨幣都存在
      currencyCodes.forEach((code) => {
        expect(fromValues).toContain(code);
        expect(toValues).toContain(code);
      });
    });
  });

  describe('快速金額按鈕', () => {
    it('should call onQuickAmount when from currency quick amount clicked', () => {
      render(<SingleConverter {...mockProps} />);

      // TWD 快速金額: [100, 500, 1000, 3000, 5000]
      const quickButtons = screen.getAllByText('1,000');
      const quickButton = quickButtons[0];
      if (quickButton) {
        fireEvent.click(quickButton);
      }

      expect(mockProps.onQuickAmount).toHaveBeenCalledWith(1000);
    });

    it('should trigger vibrate feedback when quick amount clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const quickButtons = screen.getAllByText('100');
      const quickButton = quickButtons[0];
      if (quickButton) {
        fireEvent.click(quickButton);
      }

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(navigator.vibrate).toHaveBeenCalledWith(30);
    });

    it('should set to amount directly when to currency quick amount clicked', () => {
      render(<SingleConverter {...mockProps} />);

      // USD decimals = 2, 所以快速金額應該格式化為 2 位小數
      const toQuickButtons = screen.getAllByText('100'); // 可能有多個，取最後一個（to currency）
      const toQuickButton = toQuickButtons[toQuickButtons.length - 1];

      if (toQuickButton) {
        fireEvent.click(toQuickButton);
      }

      expect(mockProps.onToAmountChange).toHaveBeenCalledWith('100.00');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(navigator.vibrate).toHaveBeenCalledWith(30);
    });
  });

  describe('匯率類型切換', () => {
    it('should call onRateTypeChange when switching to spot', () => {
      render(<SingleConverter {...mockProps} rateType="cash" />);

      const spotButton = screen.getByLabelText('切換到即期匯率');
      fireEvent.click(spotButton);

      expect(mockProps.onRateTypeChange).toHaveBeenCalledWith('spot');
    });

    it('should call onRateTypeChange when switching to cash', () => {
      render(<SingleConverter {...mockProps} rateType="spot" />);

      const cashButton = screen.getByLabelText('切換到現金匯率');
      fireEvent.click(cashButton);

      expect(mockProps.onRateTypeChange).toHaveBeenCalledWith('cash');
    });

    it('should apply active styles to selected rate type', () => {
      const { rerender } = render(<SingleConverter {...mockProps} rateType="spot" />);

      const spotButton = screen.getByLabelText('切換到即期匯率');
      // 使用 aria-pressed 驗證選中狀態（更好的無障礙測試）
      expect(spotButton).toHaveAttribute('aria-pressed', 'true');

      rerender(<SingleConverter {...mockProps} rateType="cash" />);

      const cashButton = screen.getByLabelText('切換到現金匯率');
      expect(cashButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('輸入框編輯', () => {
    it('should enter editing mode on from amount focus', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);

      // 編輯模式下應該顯示未格式化的值
      expect(fromInput).toHaveValue('1000');
    });

    it('should update editing value on from amount change', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: '2000' } });

      expect(mockProps.onFromAmountChange).toHaveBeenCalledWith('2000');
    });

    it('should clean non-numeric characters from input', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: 'abc123.45def' } });

      // 應該清除非數字字符，只保留 123.45
      expect(mockProps.onFromAmountChange).toHaveBeenCalledWith('123.45');
    });

    it('should handle multiple decimal points correctly', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: '12.34.56' } });

      // 應該只保留第一個小數點：12.3456
      expect(mockProps.onFromAmountChange).toHaveBeenCalledWith('12.3456');
    });

    it('should exit editing mode on blur', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);
      fireEvent.change(fromInput, { target: { value: '2500' } });
      fireEvent.blur(fromInput);

      // blur 時應該再次呼叫 onFromAmountChange 確認值
      expect(mockProps.onFromAmountChange).toHaveBeenLastCalledWith('2500');
    });

    it('should prevent non-numeric and non-control keys', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);

      // 測試字母鍵（應該被阻止）
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

      fromInput.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should allow modifier keys (Ctrl/Cmd)', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);

      // Ctrl+C（複製）不應該被阻止
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

      fromInput.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('交換貨幣按鈕', () => {
    it('should call onSwapCurrencies when swap button clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const swapButton = screen.getByLabelText('交換幣別');
      fireEvent.click(swapButton);

      expect(mockProps.onSwapCurrencies).toHaveBeenCalled();
    });

    it('should trigger vibrate feedback when swap button clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const swapButton = screen.getByLabelText('交換幣別');
      fireEvent.click(swapButton);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });

    it('should disable swap button while swapping animation plays', () => {
      render(<SingleConverter {...mockProps} />);

      const swapButton = screen.getByLabelText('交換幣別');
      fireEvent.click(swapButton);

      // 動畫期間按鈕應該被禁用
      expect(swapButton).toBeDisabled();

      // 600ms 後動畫結束，按鈕應該重新啟用
      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(screen.getByLabelText('交換幣別')).not.toBeDisabled();
    });
  });

  describe('加入歷史記錄', () => {
    it('should call onAddToHistory when button clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const addButton = screen.getByText('加入歷史記錄');
      fireEvent.click(addButton);

      expect(mockProps.onAddToHistory).toHaveBeenCalled();
    });
  });

  describe('趨勢圖進場動畫', () => {
    it('should show trend chart after 300ms delay', async () => {
      render(<SingleConverter {...mockProps} />);

      // Wait for async operations to complete
      await act(async () => {
        await Promise.resolve();
      });

      // 初始狀態趨勢圖隱藏（opacity-0）
      const trendContainer = document.querySelector('.opacity-0');
      expect(trendContainer).toBeInTheDocument();

      // 300ms 後應該顯示（opacity-100）
      await act(async () => {
        vi.advanceTimersByTime(400);
        await Promise.resolve();
      });

      const visibleTrend = document.querySelector('.opacity-100');
      expect(visibleTrend).toBeInTheDocument();
    });
  });

  describe('匯率顯示', () => {
    it('should display exchange rate with fromCurrency', () => {
      render(<SingleConverter {...mockProps} />);

      // 驗證包含 fromCurrency (TWD) 和 toCurrency (USD) 的匯率顯示
      const rateDisplays = screen.getAllByText((_content, element) => {
        const text = element?.textContent ?? '';
        return text.includes('1 TWD =') && text.includes('USD');
      });

      // 應該至少有一個匯率顯示
      expect(rateDisplays.length).toBeGreaterThan(0);
      expect(rateDisplays[0]).toBeInTheDocument();
    });

    it('should display reverse exchange rate with toCurrency', () => {
      render(<SingleConverter {...mockProps} />);

      // 驗證包含 toCurrency (USD) 和 fromCurrency (TWD) 的反向匯率顯示
      const reverseRateDisplays = screen.getAllByText((_content, element) => {
        const text = element?.textContent ?? '';
        return text.includes('1 USD =') && text.includes('TWD');
      });

      // 應該至少有一個反向匯率顯示
      expect(reverseRateDisplays.length).toBeGreaterThan(0);
      expect(reverseRateDisplays[0]).toBeInTheDocument();
    });
  });

  describe('輸入框格式化顯示', () => {
    it('should show formatted amount when not editing', () => {
      render(<SingleConverter {...mockProps} fromAmount="1000" />);

      const fromInput = screen.getByTestId('amount-input');

      // 非編輯模式應該顯示格式化的值（千分位逗號）
      expect(fromInput).toHaveValue('1,000.00');
    });

    it('should show unformatted amount when editing', () => {
      render(<SingleConverter {...mockProps} fromAmount="1000" />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);

      // 編輯模式應該顯示未格式化的值
      expect(fromInput).toHaveValue('1000');
    });
  });
});
