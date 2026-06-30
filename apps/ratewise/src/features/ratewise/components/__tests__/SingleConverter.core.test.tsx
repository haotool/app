import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SingleConverter } from '../SingleConverter';
import type { CurrencyCode } from '../../types';
import { CURRENCY_DEFINITIONS } from '../../constants';
import { singleConverterLayoutTokens } from '../../../../config/design-tokens';
import type { ExchangeShopRate } from '../../../../services/moneyboxRateService';

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
    rateMode: 'sell' as const,
    onFromCurrencyChange: vi.fn(),
    onToCurrencyChange: vi.fn(),
    onFromAmountChange: vi.fn(),
    onToAmountChange: vi.fn(),
    onQuickAmount: vi.fn(),
    onSwapCurrencies: vi.fn(),
    onAddToHistory: vi.fn(),
    onRateTypeChange: vi.fn(),
  };

  const getSpotRateButton = () =>
    screen.queryByRole('tab', { name: /即期/ }) ?? screen.getByRole('button', { name: /即期/ });
  const getCashRateButton = () =>
    screen.queryByRole('tab', { name: /現金/ }) ?? screen.getByRole('button', { name: /現金/ });

  const assertRateTypeSelected = (control: HTMLElement, selected: boolean) => {
    if (control.getAttribute('role') === 'tab') {
      expect(control).toHaveAttribute('aria-selected', selected ? 'true' : 'false');
      return;
    }
    expect(control).toHaveAttribute('aria-pressed', selected ? 'true' : 'false');
  };

  const renderLegacy = (props = mockProps) => {
    window.history.replaceState({}, '', '/?ux=legacy');
    return render(<SingleConverter {...props} />);
  };

  const mockMoneyBoxRate: ExchangeShopRate = {
    currency: 'KRW',
    sell: 44.85,
    buy: 45.1,
    updateTime: '2026/05/07 16:33:55',
    source: 'MoneyBox',
    sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
    providerName: '明洞換匯所',
    isFallback: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');

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
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');

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

      fireEvent.click(screen.getByTestId('hero-currency-input-to'));
      const toQuickButton = within(screen.getByTestId('quick-amounts-hero')).getByText('100');
      fireEvent.click(toQuickButton);

      expect(mockProps.onToAmountChange).toHaveBeenCalledWith('100.00');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(navigator.vibrate).toHaveBeenCalledWith(30);
    });
  });

  describe('高度斷點佈局', () => {
    it('hero-v2 快速金額應使用 quick-amounts-hero', () => {
      render(<SingleConverter {...mockProps} />);

      expect(screen.getByTestId('quick-amounts-hero')).toBeInTheDocument();
      expect(screen.queryByTestId('quick-amounts-from')).not.toBeInTheDocument();
    });

    it('legacy 快速金額與交換按鈕應套用高度斷點顯示規則', () => {
      window.history.replaceState({}, '', '/?ux=legacy');
      render(<SingleConverter {...mockProps} />);

      const quickFrom = screen.getByTestId('quick-amounts-from');
      const quickTo = screen.getByTestId('quick-amounts-to');
      const swapButton = screen.getByTestId('swap-button');

      expect(quickFrom).toHaveClass(singleConverterLayoutTokens.quickAmounts.fromVisibility);
      expect(quickTo).toHaveClass(singleConverterLayoutTokens.quickAmounts.toVisibility);
      expect(swapButton).toHaveClass(singleConverterLayoutTokens.swap.visibility);
      window.history.replaceState({}, '', '/');
    });

    it('legacy 趨勢圖容器應套用高度斷點高度設定', () => {
      window.history.replaceState({}, '', '/?ux=legacy');
      render(<SingleConverter {...mockProps} />);

      const trendChart = screen.getByTestId('trend-chart');
      singleConverterLayoutTokens.rateCard.chartHeight.split(' ').forEach((className) => {
        expect(trendChart).toHaveClass(className);
      });
      window.history.replaceState({}, '', '/');
    });

    it('hero-v2 匯率顯示應套用 answer-first 字級 token', () => {
      render(<SingleConverter {...mockProps} />);

      const heroRateDisplay = screen.getByTestId('hero-rate-display');
      singleConverterLayoutTokens.rateCard.heroRateDisplay.split(' ').forEach((className) => {
        expect(heroRateDisplay).toHaveClass(className);
      });
      expect(screen.getByTestId('hero-rate-trust-badge')).toBeInTheDocument();
    });

    it('legacy 匯率文字區塊應預留計價基準 pill 槽位高度', () => {
      window.history.replaceState({}, '', '/?ux=legacy');
      render(<SingleConverter {...mockProps} />);

      const rateTextBlock = screen.getByTestId('hero-rate-display').parentElement;
      expect(rateTextBlock).toHaveClass(singleConverterLayoutTokens.rateCard.rateTextBlock);
      window.history.replaceState({}, '', '/');
    });
  });

  describe('匯率類型切換', () => {
    it('should call onRateTypeChange when switching to spot', () => {
      render(<SingleConverter {...mockProps} rateType="cash" />);

      const spotButton = getSpotRateButton();
      fireEvent.click(spotButton);

      expect(mockProps.onRateTypeChange).toHaveBeenCalledWith('spot');
    });

    it('should call onRateTypeChange when switching to cash', () => {
      render(<SingleConverter {...mockProps} rateType="spot" />);

      const cashButton = getCashRateButton();
      fireEvent.click(cashButton);

      expect(mockProps.onRateTypeChange).toHaveBeenCalledWith('cash');
    });

    it('should apply active styles to selected rate type', () => {
      const { rerender } = render(<SingleConverter {...mockProps} rateType="spot" />);

      const spotButton = getSpotRateButton();
      assertRateTypeSelected(spotButton, true);

      rerender(<SingleConverter {...mockProps} rateType="cash" />);

      const cashButton = getCashRateButton();
      assertRateTypeSelected(cashButton, true);
      assertRateTypeSelected(getSpotRateButton(), false);
    });

    it('should disable unavailable rate type button for current currency pair', () => {
      render(
        <SingleConverter
          {...mockProps}
          fromCurrency="TWD"
          toCurrency="KRW"
          rateType="cash"
          details={{
            KRW: {
              name: '韓元',
              spot: { buy: 0, sell: null },
              cash: { buy: 0.0226, sell: 0.024 },
            },
          }}
          rateTypeAvailability={{ spot: false, cash: true }}
        />,
      );

      const spotButton = getSpotRateButton();
      expect(spotButton).toBeDisabled();
    });

    it('should not call onRateTypeChange when target rate type is unavailable', () => {
      render(
        <SingleConverter
          {...mockProps}
          fromCurrency="TWD"
          toCurrency="KRW"
          rateType="cash"
          details={{
            KRW: {
              name: '韓元',
              spot: { buy: 0, sell: null },
              cash: { buy: 0.0226, sell: 0.024 },
            },
          }}
          rateTypeAvailability={{ spot: false, cash: true }}
        />,
      );

      const spotButton = getSpotRateButton();
      fireEvent.click(spotButton);

      expect(mockProps.onRateTypeChange).not.toHaveBeenCalled();
    });
  });

  describe('金額顯示區域', () => {
    it('should display formatted from amount', () => {
      renderLegacy();

      const fromAmount = screen.getByTestId('amount-input');
      expect(fromAmount).toHaveTextContent('1,000.00');
    });

    it('should open calculator when from amount area clicked', () => {
      renderLegacy();

      const fromAmount = screen.getByTestId('amount-input');
      fireEvent.click(fromAmount);

      expect(fromAmount).toBeInTheDocument();
    });

    it('should display formatted to amount', () => {
      renderLegacy();

      const toAmount = screen.getByTestId('amount-output');
      expect(toAmount).toHaveTextContent('31.58');
    });

    it('should open calculator when to amount area clicked', () => {
      renderLegacy();

      const toAmount = screen.getByTestId('amount-output');
      fireEvent.click(toAmount);
      expect(toAmount).toBeInTheDocument();
    });

    it('should support keyboard activation (Enter/Space)', () => {
      renderLegacy();

      const fromAmount = screen.getByTestId('amount-input');
      fireEvent.keyDown(fromAmount, { key: 'Enter' });

      expect(fromAmount).toBeInTheDocument();
    });

    it('hero-v2 應顯示雙欄金額輸入', () => {
      render(<SingleConverter {...mockProps} />);

      expect(screen.getByTestId('hero-currency-input-from')).toHaveTextContent('1,000.00');
      expect(screen.getByTestId('hero-currency-input-to')).toHaveTextContent('31.58');
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

  describe('趨勢圖 CLS 穩定', () => {
    it('趨勢圖容器應自初始渲染起保持可見且固定高度', () => {
      renderLegacy();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const trendChart = screen.getByTestId('trend-chart');
      expect(trendChart).not.toHaveClass('opacity-0');
      singleConverterLayoutTokens.rateCard.chartHeight.split(' ').forEach((className) => {
        expect(trendChart).toHaveClass(className);
      });
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

    it('auto 模式應以當前主方向匯率為 SSOT，反向顯示其倒數', () => {
      render(
        <SingleConverter
          {...mockProps}
          rateMode="auto"
          exchangeRates={{ ...mockExchangeRates, USD: 31.665 }}
          details={{
            USD: {
              name: '美元',
              spot: { buy: 30.87, sell: 30.97 },
              cash: { buy: 30.4, sell: 31.4 },
            },
          }}
        />,
      );

      expect(screen.getByText('1 TWD = 0.0323 USD')).toBeInTheDocument();
      expect(screen.getByText('1 USD = 30.9700 TWD')).toBeInTheDocument();
      expect(screen.queryByText('1 USD = 30.8700 TWD')).not.toBeInTheDocument();
    });

    it('TWD→KRW 選擇換錢所時應顯示換錢所賣出匯率', () => {
      render(
        <SingleConverter
          {...mockProps}
          fromCurrency="TWD"
          toCurrency="KRW"
          rateSource="exchange-shop"
          moneyBoxRate={mockMoneyBoxRate}
          exchangeShopCurrency="KRW"
        />,
      );

      expect(screen.getByText('1 TWD = 44.8500 KRW')).toBeInTheDocument();
    });

    it('KRW→TWD 選擇換錢所時應顯示換錢所買入反向匯率', () => {
      render(
        <SingleConverter
          {...mockProps}
          fromCurrency="KRW"
          toCurrency="TWD"
          rateSource="exchange-shop"
          moneyBoxRate={mockMoneyBoxRate}
          exchangeShopCurrency="KRW"
        />,
      );

      expect(screen.getByText('1 KRW = 0.0222 TWD')).toBeInTheDocument();
    });

    it('auto 模式 KRW→TWD 時，副標應顯示主方向匯率的倒數', () => {
      const exchangeShopRate: ExchangeShopRate = {
        ...mockMoneyBoxRate,
        sell: 44.9,
        buy: 45.1,
      };

      render(
        <SingleConverter
          {...mockProps}
          fromCurrency="KRW"
          toCurrency="TWD"
          rateMode="auto"
          rateSource="exchange-shop"
          moneyBoxRate={exchangeShopRate}
          exchangeShopCurrency="KRW"
        />,
      );

      expect(screen.getByText('1 KRW = 0.0222 TWD')).toBeInTheDocument();
      expect(screen.getByText('1 TWD = 45.1000 KRW')).toBeInTheDocument();
      expect(screen.queryByText('1 TWD = 44.9000 KRW')).not.toBeInTheDocument();
    });

    it('auto 模式 TWD→KRW 時，副標應顯示主方向匯率的倒數', () => {
      const exchangeShopRate: ExchangeShopRate = {
        ...mockMoneyBoxRate,
        sell: 44.9,
        buy: 45.1,
      };

      render(
        <SingleConverter
          {...mockProps}
          fromCurrency="TWD"
          toCurrency="KRW"
          rateMode="auto"
          rateSource="exchange-shop"
          moneyBoxRate={exchangeShopRate}
          exchangeShopCurrency="KRW"
        />,
      );

      expect(screen.getByText('1 TWD = 44.9000 KRW')).toBeInTheDocument();
      expect(screen.getByText('1 KRW = 0.0223 TWD')).toBeInTheDocument();
      expect(screen.queryByText('1 KRW = 0.0222 TWD')).not.toBeInTheDocument();
    });
  });

  describe('金額格式化顯示', () => {
    it('should show formatted from amount', () => {
      renderLegacy({ ...mockProps, fromAmount: '1000' });

      const fromAmount = screen.getByTestId('amount-input');
      expect(fromAmount).toHaveTextContent('1,000.00');
    });

    it('should show formatted to amount', () => {
      renderLegacy();

      const toAmount = screen.getByTestId('amount-output');
      expect(toAmount).toHaveTextContent('31.58');
    });

    it('hero-v2 should show formatted hero currency inputs', () => {
      render(<SingleConverter {...mockProps} fromAmount="1000" />);

      expect(screen.getByTestId('hero-currency-input-from')).toHaveTextContent('1,000.00');
      expect(screen.getByTestId('hero-currency-input-to')).toHaveTextContent('31.58');
    });
  });
});
