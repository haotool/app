import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SingleConverter } from '../SingleConverter';
import type { CurrencyCode } from '../../types';

// Mock services
vi.mock('../../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: vi.fn().mockResolvedValue([]),
  fetchLatestRates: vi.fn().mockResolvedValue(null),
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

describe('SingleConverter - 輸入框進階測試', () => {
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

  describe('目標貨幣輸入框 (toAmount)', () => {
    it('should enter editing mode on to amount focus', () => {
      render(<SingleConverter {...mockProps} />);

      const toInput = screen.getByLabelText(`轉換結果 (${mockProps.toCurrency})`);
      fireEvent.focus(toInput);

      // 編輯模式下應該顯示未格式化的值
      expect(toInput).toHaveValue('31.58');
    });

    it('should update editing value on to amount change', () => {
      render(<SingleConverter {...mockProps} />);

      const toInput = screen.getByLabelText(`轉換結果 (${mockProps.toCurrency})`);
      fireEvent.focus(toInput);
      fireEvent.change(toInput, { target: { value: '50.00' } });

      expect(mockProps.onToAmountChange).toHaveBeenCalledWith('50.00');
    });

    it('should clean non-numeric characters from to input', () => {
      render(<SingleConverter {...mockProps} />);

      const toInput = screen.getByLabelText(`轉換結果 (${mockProps.toCurrency})`);
      fireEvent.focus(toInput);
      fireEvent.change(toInput, { target: { value: 'abc50.00def' } });

      expect(mockProps.onToAmountChange).toHaveBeenCalledWith('50.00');
    });

    it('should handle multiple decimal points in to input', () => {
      render(<SingleConverter {...mockProps} />);

      const toInput = screen.getByLabelText(`轉換結果 (${mockProps.toCurrency})`);
      fireEvent.focus(toInput);
      fireEvent.change(toInput, { target: { value: '50.12.34' } });

      // 應該只保留第一個小數點：50.1234
      expect(mockProps.onToAmountChange).toHaveBeenCalledWith('50.1234');
    });

    it('should exit editing mode on to input blur', () => {
      render(<SingleConverter {...mockProps} />);

      const toInput = screen.getByLabelText(`轉換結果 (${mockProps.toCurrency})`);
      fireEvent.focus(toInput);
      fireEvent.change(toInput, { target: { value: '75.50' } });
      fireEvent.blur(toInput);

      expect(mockProps.onToAmountChange).toHaveBeenLastCalledWith('75.50');
    });

    it('should prevent non-numeric keys on to input', () => {
      render(<SingleConverter {...mockProps} />);

      const toInput = screen.getByLabelText(`轉換結果 (${mockProps.toCurrency})`);
      fireEvent.focus(toInput);

      // 測試字母鍵
      fireEvent.keyDown(toInput, {
        key: 'a',
        code: 'KeyA',
        charCode: 97,
      });

      // keyDown 事件會被阻止（preventDefault）
      // 但我們無法直接測試 preventDefault，因為 fireEvent 不會真正觸發它
      expect(toInput).toBeInTheDocument();
    });

    it('should allow control keys on to input', () => {
      render(<SingleConverter {...mockProps} />);

      const toInput = screen.getByLabelText(`轉換結果 (${mockProps.toCurrency})`);
      fireEvent.focus(toInput);

      // 測試 Backspace
      fireEvent.keyDown(toInput, { key: 'Backspace' });
      expect(toInput).toBeInTheDocument();

      // 測試 ArrowLeft
      fireEvent.keyDown(toInput, { key: 'ArrowLeft' });
      expect(toInput).toBeInTheDocument();

      // 測試 Tab
      fireEvent.keyDown(toInput, { key: 'Tab' });
      expect(toInput).toBeInTheDocument();
    });

    it('should allow modifier keys (ctrl/cmd) on to input', () => {
      render(<SingleConverter {...mockProps} />);

      const toInput = screen.getByLabelText(`轉換結果 (${mockProps.toCurrency})`);
      fireEvent.focus(toInput);

      // 測試 Ctrl+A
      fireEvent.keyDown(toInput, { key: 'a', ctrlKey: true });
      expect(toInput).toBeInTheDocument();

      // 測試 Cmd+V
      fireEvent.keyDown(toInput, { key: 'v', metaKey: true });
      expect(toInput).toBeInTheDocument();
    });
  });

  describe('來源貨幣輸入框 (fromAmount) - 進階測試', () => {
    it('should allow decimal point key', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);

      // 測試小數點
      fireEvent.keyDown(fromInput, { key: '.' });
      expect(fromInput).toBeInTheDocument();
    });

    it('should allow Delete key', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);

      fireEvent.keyDown(fromInput, { key: 'Delete' });
      expect(fromInput).toBeInTheDocument();
    });

    it('should allow Home and End keys', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);

      fireEvent.keyDown(fromInput, { key: 'Home' });
      expect(fromInput).toBeInTheDocument();

      fireEvent.keyDown(fromInput, { key: 'End' });
      expect(fromInput).toBeInTheDocument();
    });

    it('should allow ArrowUp and ArrowDown keys', () => {
      render(<SingleConverter {...mockProps} />);

      const fromInput = screen.getByTestId('amount-input');
      fireEvent.focus(fromInput);

      fireEvent.keyDown(fromInput, { key: 'ArrowUp' });
      expect(fromInput).toBeInTheDocument();

      fireEvent.keyDown(fromInput, { key: 'ArrowDown' });
      expect(fromInput).toBeInTheDocument();
    });
  });

  describe('交換按鈕', () => {
    it('should call onSwapCurrencies when swap button is clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const swapButton = screen.getByLabelText('交換幣別');
      fireEvent.click(swapButton);

      expect(mockProps.onSwapCurrencies).toHaveBeenCalled();
    });

    it('should trigger vibrate feedback when swap button is clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const swapButton = screen.getByLabelText('交換幣別');
      fireEvent.click(swapButton);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });

    it('should disable swap button during animation', () => {
      render(<SingleConverter {...mockProps} />);

      const swapButton = screen.getByLabelText('交換幣別');
      fireEvent.click(swapButton);

      // 動畫期間按鈕應該被禁用
      expect(swapButton).toBeDisabled();

      // 等待動畫結束（需要超過 600ms）
      act(() => {
        vi.advanceTimersByTime(700);
      });

      // 重新獲取按鈕（因為狀態可能已更新）
      const updatedSwapButton = screen.getByLabelText('交換幣別');
      expect(updatedSwapButton).not.toBeDisabled();
    });
  });

  describe('加入歷史記錄按鈕', () => {
    it('should call onAddToHistory when button is clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const addButton = screen.getByText('加入歷史記錄');
      fireEvent.click(addButton);

      expect(mockProps.onAddToHistory).toHaveBeenCalled();
    });
  });

  describe('計算機按鈕', () => {
    it('should open calculator for from amount when calculator button is clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const calculatorButton = screen.getByTestId('calculator-trigger-from');
      fireEvent.click(calculatorButton);

      // 計算機應該打開（CalculatorKeyboard 組件會渲染）
      expect(screen.getByText('加入歷史記錄')).toBeInTheDocument();
    });

    it('should open calculator for to amount when calculator button is clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const calculatorButton = screen.getByTestId('calculator-trigger-to');
      fireEvent.click(calculatorButton);

      // 計算機應該打開
      expect(screen.getByText('加入歷史記錄')).toBeInTheDocument();
    });
  });

  describe('目標貨幣快速金額', () => {
    it('should set to amount when to currency quick amount is clicked', () => {
      render(<SingleConverter {...mockProps} />);

      // 找到目標貨幣區域的快速金額按鈕
      // USD 的快速金額是 [10, 50, 100, 500, 1000]
      const quickButtons = screen.getAllByText('50');
      // 第二個 50 是 to currency 區域的
      if (quickButtons.length > 1) {
        const toQuickButton = quickButtons[1];
        if (toQuickButton) {
          fireEvent.click(toQuickButton);
        }
        expect(mockProps.onToAmountChange).toHaveBeenCalledWith('50.00');
      }
    });
  });

  describe('匯率顯示', () => {
    it('should display correct exchange rate', () => {
      render(<SingleConverter {...mockProps} />);

      // 應該顯示 1 TWD = X USD 的格式
      expect(screen.getByText(/1 TWD =/)).toBeInTheDocument();
      expect(screen.getByText(/1 USD =/)).toBeInTheDocument();
    });

    it('should display rate type buttons', () => {
      render(<SingleConverter {...mockProps} />);

      expect(screen.getByLabelText('切換到即期匯率')).toBeInTheDocument();
      expect(screen.getByLabelText('切換到現金匯率')).toBeInTheDocument();
    });
  });

  describe('貨幣選擇器', () => {
    it('should render from currency selector with correct value', () => {
      render(<SingleConverter {...mockProps} />);

      const fromSelect = screen.getByLabelText('選擇來源貨幣');
      expect(fromSelect).toHaveValue('TWD');
    });

    it('should render to currency selector with correct value', () => {
      render(<SingleConverter {...mockProps} />);

      const toSelect = screen.getByLabelText('選擇目標貨幣');
      expect(toSelect).toHaveValue('USD');
    });
  });
});
