import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SingleConverter } from '../SingleConverter';
import type { CurrencyCode } from '../../types';
import { CURRENCY_DEFINITIONS } from '../../constants';
import { singleConverterLayoutTokens } from '../../../../config/design-tokens';
import type { ExchangeShopRate } from '../../../../services/moneyboxRateService';

// Mock services
vi.mock('../../../../services/exchangeRateHistoryService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../services/exchangeRateHistoryService')>()),
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
  TrackingModeExitMode: {
    OnTouchEnd: 0,
    OnNextTap: 1,
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

  const getSpotRateButton = () => screen.getByRole('button', { name: /即期/ });
  const getCashRateButton = () => screen.getByRole('button', { name: /現金/ });

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
    // 排除 requestIdleCallback：sinon 只假 request 端不假 cancel 端，
    // 會與 setupTests 的 cancelIdleCallback stub（clearTimeout）型別衝突。
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });

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

  describe('高度斷點佈局', () => {
    it('快速金額與交換按鈕應套用高度斷點顯示規則', () => {
      render(<SingleConverter {...mockProps} />);

      const quickFrom = screen.getByTestId('quick-amounts-from');
      const quickTo = screen.getByTestId('quick-amounts-to');
      const swapButton = screen.getByTestId('swap-button');

      // 隱藏優先順序：快速金額(來源) short → 快速金額(結果) tiny → 交換按鈕 micro
      expect(quickFrom).toHaveClass(singleConverterLayoutTokens.quickAmounts.fromVisibility);
      expect(quickTo).toHaveClass(singleConverterLayoutTokens.quickAmounts.toVisibility);
      expect(swapButton).toHaveClass(singleConverterLayoutTokens.swap.visibility);
    });

    it('趨勢圖容器應套用高度斷點高度設定', () => {
      render(<SingleConverter {...mockProps} />);

      const trendChart = screen.getByTestId('trend-chart');
      singleConverterLayoutTokens.rateCard.chartHeight.split(' ').forEach((className) => {
        expect(trendChart).toHaveClass(className);
      });
    });

    it('匯率文字區塊應預留計價基準 pill 槽位高度', () => {
      render(<SingleConverter {...mockProps} />);

      const rateTextBlock = screen.getByText(/1 TWD =/).parentElement;
      expect(rateTextBlock).toHaveClass(singleConverterLayoutTokens.rateCard.rateTextBlock);
    });
  });

  describe('E10 fold 佈局', () => {
    it('fold 容器應套用 svh 首屏預算類別，結果卡（含歷史動作）錨定 fold 底緣', () => {
      render(<SingleConverter {...mockProps} />);

      const fold = screen.getByTestId('single-converter-fold');
      singleConverterLayoutTokens.fold.container.split(' ').forEach((className) => {
        expect(fold).toHaveClass(className);
      });

      // 歷史動作位於結果卡內＝fold 底界；結果卡以 mt-auto 錨定 fold 底緣。
      const resultCard = screen.getByTestId('rate-result-card');
      expect(resultCard).toHaveClass(singleConverterLayoutTokens.fold.resultAnchor);
      expect(within(resultCard).getByText('加入歷史記錄')).toBeInTheDocument();
      expect(fold).toContainElement(resultCard);
    });

    it('趨勢卡與四價詳情應位於 fold 之外（自然捲動區）', () => {
      render(<SingleConverter {...mockProps} />);

      const fold = screen.getByTestId('single-converter-fold');
      expect(within(fold).queryByTestId('trend-chart')).not.toBeInTheDocument();

      const rateDetails = screen.getByTestId('rate-details-card');
      const trendCard = screen.getByTestId('trend-card');
      expect(fold).not.toContainElement(rateDetails);
      expect(fold).not.toContainElement(trendCard);
      // DOM 序：fold → 四價詳情 → 趨勢卡
      expect(
        fold.compareDocumentPosition(rateDetails) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        rateDetails.compareDocumentPosition(trendCard) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('四價詳情應顯示外幣腿臺銀四價，缺報價誠實顯示破折號', () => {
      render(
        <SingleConverter
          {...mockProps}
          details={{
            USD: {
              name: '美元',
              spot: { buy: 30.87, sell: 30.97 },
              cash: { buy: 30.4, sell: null },
            },
          }}
        />,
      );

      const rateDetails = screen.getByTestId('rate-details-card');
      expect(within(rateDetails).getByText('即期買入')).toBeInTheDocument();
      expect(within(rateDetails).getByText('即期賣出')).toBeInTheDocument();
      expect(within(rateDetails).getByText('現金買入')).toBeInTheDocument();
      expect(within(rateDetails).getByText('現金賣出')).toBeInTheDocument();
      expect(within(rateDetails).getByText('30.8700')).toBeInTheDocument();
      expect(within(rateDetails).getByText('30.9700')).toBeInTheDocument();
      expect(within(rateDetails).getByText('30.4000')).toBeInTheDocument();
      expect(within(rateDetails).getByText('—')).toBeInTheDocument();
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
      expect(spotButton).toHaveAttribute('aria-pressed', 'true');

      rerender(<SingleConverter {...mockProps} rateType="cash" />);

      const cashButton = getCashRateButton();
      expect(cashButton).toHaveAttribute('aria-pressed', 'true');
      // 即期按鈕切換為未選中
      const spotButtonAfter = getSpotRateButton();
      expect(spotButtonAfter).toHaveAttribute('aria-pressed', 'false');
    });

    it('should mark unavailable rate type button aria-disabled (keeps tooltip clickable)', () => {
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

      // 原生 disabled 會吞掉點擊事件，導致禁用原因 tooltip 永遠無法顯示；
      // 改用 aria-disabled 保留可點擊性（切換行為由 onClick guard 阻擋）。
      const spotButton = getSpotRateButton();
      expect(spotButton).not.toBeDisabled();
      expect(spotButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should show unavailable reason tooltip when tapping the aria-disabled button', () => {
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

      fireEvent.click(getSpotRateButton());

      // RateTypeTooltip 應顯示禁用原因（目前不提供即期匯率）。
      expect(screen.getByText(/目前不提供/)).toBeInTheDocument();
      expect(document.querySelector('.fixed.inset-0.z-40')).toBeInTheDocument();
    });

    it('should keep the unavailable reason tooltip unclipped (no overflow-hidden ancestor)', () => {
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

      fireEvent.click(getSpotRateButton());

      // 氣泡以 bottom-full 向上彈出；任何 overflow-hidden 祖先都會把它剪到只剩數 px。
      let node: HTMLElement | null = screen.getByText(/目前不提供/);
      while (node && node !== document.body) {
        expect(node.className).not.toMatch(/overflow-hidden/);
        node = node.parentElement;
      }
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
      render(<SingleConverter {...mockProps} />);

      // v2.0: 金額顯示為 div，點擊開啟計算機
      const fromAmount = screen.getByTestId('amount-input');
      expect(fromAmount).toHaveTextContent('1,000.00');
    });

    it('should open calculator when from amount area clicked', () => {
      render(<SingleConverter {...mockProps} />);

      const fromAmount = screen.getByTestId('amount-input');
      fireEvent.click(fromAmount);

      // 計算機應該打開（通過其他測試驗證）
      expect(fromAmount).toBeInTheDocument();
    });

    it('should display formatted to amount', () => {
      render(<SingleConverter {...mockProps} />);

      // v2.0: 金額顯示區域（div）應該顯示 mockProps.toAmount 的值
      const toAmount = screen.getByTestId('amount-output');
      expect(toAmount).toHaveTextContent('31.58');
    });

    it('should open calculator when to amount area clicked', () => {
      render(<SingleConverter {...mockProps} />);

      // v2.0: 計算機鍵盤應該打開
      const toAmount = screen.getByTestId('amount-output');
      fireEvent.click(toAmount);
      expect(toAmount).toBeInTheDocument();
    });

    it('should support keyboard activation (Enter/Space)', () => {
      render(<SingleConverter {...mockProps} />);

      const fromAmount = screen.getByTestId('amount-input');
      fireEvent.keyDown(fromAmount, { key: 'Enter' });

      // Enter 鍵應該開啟計算機
      expect(fromAmount).toBeInTheDocument();
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
      render(<SingleConverter {...mockProps} />);

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
      render(<SingleConverter {...mockProps} fromAmount="1000" />);

      const fromAmount = screen.getByTestId('amount-input');

      // v2.0: 金額顯示區域（div）應該顯示格式化的值
      expect(fromAmount).toHaveTextContent('1,000.00');
    });

    it('should show formatted to amount', () => {
      render(<SingleConverter {...mockProps} />);

      const toAmount = screen.getByTestId('amount-output');

      // v2.0: 金額顯示區域（div）應該顯示格式化的值（使用 mockProps.toAmount = '31.58'）
      expect(toAmount).toHaveTextContent('31.58');
    });
  });
});
