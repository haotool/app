/**
 * SingleConverterV2 單元測試：換算對等性（兩列皆可編輯）、swap、rate chip 基準切換、
 * bottom sheet 幣別 picker。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { SingleConverterV2 } from '../SingleConverterV2';
import { useConverterTrend } from '../useConverterTrend';
import type { SingleConverterProps } from '../../SingleConverter';
import type { CurrencyCode } from '../../../types';
import type { RateDetails } from '../../../../../utils/offlineStorage';
import zhTW from '../../../../../i18n/locales/zh-TW';
import en from '../../../../../i18n/locales/en';
import ja from '../../../../../i18n/locales/ja';
import ko from '../../../../../i18n/locales/ko';

// motion mock：onTap 映射為 onClick，去除動畫 props（對齊 CalculatorKey.test 慣例）。
vi.mock('motion/react', () => ({
  motion: {
    button: ({
      children,
      onTap,
      onTapStart: _onTapStart,
      onTapCancel: _onTapCancel,
      whileTap: _whileTap,
      whileHover: _whileHover,
      transition: _transition,
      ...rest
    }: {
      children?: React.ReactNode;
      onTap?: () => void;
      onTapStart?: () => void;
      onTapCancel?: () => void;
      whileTap?: unknown;
      whileHover?: unknown;
      transition?: unknown;
    } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button onClick={() => onTap?.()} {...rest}>
        {children}
      </button>
    ),
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      drag: _drag,
      dragConstraints: _dragConstraints,
      dragElastic: _dragElastic,
      onDragEnd: _onDragEnd,
      whileHover: _whileHover,
      ...rest
    }: {
      children?: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      drag?: unknown;
      dragConstraints?: unknown;
      dragElastic?: unknown;
      onDragEnd?: unknown;
      whileHover?: unknown;
    } & React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// 趨勢資料 hook mock：單元測試不觸網。
vi.mock('../useConverterTrend', () => ({
  useConverterTrend: vi.fn(() => ({ data: [], isLoading: false })),
}));

// toast mock：E8 複製回饋斷言用；同時避免無 provider 時的 console.warn 噪音。
const { showToastMock } = vi.hoisted(() => ({ showToastMock: vi.fn() }));
vi.mock('../../../../../components/Toast', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

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

function buildProps(overrides: Partial<SingleConverterProps> = {}): SingleConverterProps {
  return {
    fromCurrency: 'TWD',
    toCurrency: 'USD',
    fromAmount: '1000',
    toAmount: '31.58',
    exchangeRates: mockExchangeRates,
    rateType: 'spot',
    onFromCurrencyChange: vi.fn(),
    onToCurrencyChange: vi.fn(),
    onFromAmountChange: vi.fn(),
    onToAmountChange: vi.fn(),
    onQuickAmount: vi.fn(),
    onSwapCurrencies: vi.fn(),
    onAddToHistory: vi.fn(),
    onRateTypeChange: vi.fn(),
    ...overrides,
  };
}

describe('SingleConverterV2 - 等值雙列', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('渲染兩個對等貨幣列與 rate chip，無 from/to 標籤', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    expect(screen.getByTestId('converter-v2-row-from')).toBeInTheDocument();
    expect(screen.getByTestId('converter-v2-row-to')).toBeInTheDocument();
    expect(screen.getByTestId('converter-v2-amount-from')).toHaveTextContent('1,000');
    expect(screen.getByTestId('converter-v2-rate-chip')).toHaveTextContent(/1 TWD = .+ USD/);
    // v2 不再出現方向性文案。
    expect(screen.queryByText('轉換金額')).not.toBeInTheDocument();
    expect(screen.queryByText('轉換結果')).not.toBeInTheDocument();
  });

  it('首次數字鍵取代預設種子而非串接，後續鍵入正常串接（#633 虛擬鍵路徑）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-1'));
    fireEvent.click(screen.getByTestId('converter-v2-key-2'));
    fireEvent.click(screen.getByTestId('converter-v2-key-3'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // 修正前首鍵串接在種子 1000 之後，會回寫 '1000123'。
    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('123');
    expect(props.onToAmountChange).not.toHaveBeenCalled();
  });

  it('回歸：種子為單一數字且首鍵按同一數字時，首鍵不被吞掉（#633 邊界）', () => {
    // 種子 5 按 5：clear+input 後表達式仍為 '5'（不變），閘門必須仍然開啟；再按 3 應得 53。
    const props = buildProps({ fromAmount: '5' });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    fireEvent.click(screen.getByTestId('converter-v2-key-3'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // 修正前首鍵後閘門未開，按 3 再度觸發取代種子，回寫 '3'。
    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('53');
  });

  it('切換活躍列後，鍵入回寫另一列（換算對等性；首鍵取代該列種子）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));
    fireEvent.click(screen.getByTestId('converter-v2-key-1'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(props.onToAmountChange).toHaveBeenLastCalledWith('1');
  });

  it('回歸：切換活躍列多次且零按鍵，兩列數值與方向完全不變', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    // 來回切換活躍列 N 次（含 keypad remount），全程不按任何鍵。
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('converter-v2-amount-to'));
      fireEvent.click(screen.getByTestId('converter-v2-amount-from'));
    }
    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // 不得觸發任何金額回寫（回寫會使父層以捨入反推值改寫另一列並翻轉最後編輯方向）。
    expect(props.onFromAmountChange).not.toHaveBeenCalled();
    expect(props.onToAmountChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('converter-v2-amount-from')).toHaveTextContent('1,000');
    expect(screen.getByTestId('converter-v2-amount-to')).toHaveTextContent('31.58');
  });

  it('回歸：切列零按鍵期間外部值變動，首次按鍵以最新值為種子（stale seed 視窗）', () => {
    const props = buildProps();
    const { rerender } = render(<SingleConverterV2 {...props} />);

    // 零按鍵期間外部值變動（如費率模式切換觸發重算）。
    rerender(<SingleConverterV2 {...props} fromAmount="500" />);

    // #633 後數字首鍵取代種子，改以運算子首鍵驗證種子已同步（串接語意保留）。
    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-1'));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 修正前種子仍為掛載時的 1000，會回寫 '1001'。
    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('501');
  });

  it('回歸：被引擎拒絕的按鍵不得開啟回寫閘門', () => {
    // 種子已含小數點，再鍵入 '.' 會被 canAddDecimal 拒絕（表達式不變）。
    const props = buildProps({ fromAmount: '0.12345678' });
    const { rerender } = render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-.'));
    // 之後的重算路徑（另一列更新觸發父層 re-render）不得把未變的顯示值當成使用者編輯回寫。
    rerender(<SingleConverterV2 {...props} toAmount="99" />);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // 修正前 hasUserInputRef 已被設為 true，重算路徑會回寫捨入反推值並翻轉最後編輯方向。
    expect(props.onFromAmountChange).not.toHaveBeenCalled();
    expect(props.onToAmountChange).not.toHaveBeenCalled();
  });

  it('回歸：被拒按鍵後外部值變動仍可正常重播種子', () => {
    const props = buildProps({ fromAmount: '0.12345678' });
    const { rerender } = render(<SingleConverterV2 {...props} />);

    // 被拒按鍵（閘門不得開啟）之後外部值變動，種子應同步為新值。
    fireEvent.click(screen.getByTestId('converter-v2-key-.'));
    rerender(<SingleConverterV2 {...props} fromAmount="200" />);

    // 以運算子串接驗證重播後的種子確實為 200（200 + 3 = 203）。
    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-3'));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('203');
  });

  it('含運算子表達式以引擎 preview 回寫（沿用既有計算引擎）', () => {
    const props = buildProps({ fromAmount: '100' });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('105');
  });

  it('swap 鈕交換兩列幣別', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-swap'));

    expect(props.onSwapCurrencies).toHaveBeenCalledTimes(1);
  });

  it('QA-I D1：auto 模式 KRW→TWD chip 顯示現金買入且數值為買入價', () => {
    // KRW 僅現金：buy 0.0185 / sell 0.0195。auto 模式外幣→TWD 以銀行買入計算，標籤必須同源。
    const krwDetails: Record<string, RateDetails> = {
      KRW: {
        name: '韓元',
        spot: { buy: null, sell: null },
        cash: { buy: 0.0185, sell: 0.0195 },
      },
    };
    render(
      <SingleConverterV2
        {...buildProps({
          fromCurrency: 'KRW',
          toCurrency: 'TWD',
          details: krwDetails,
          rateType: 'cash',
          rateMode: 'auto',
          rateTypeAvailability: { spot: false, cash: true },
        })}
      />,
    );

    const chip = screen.getByTestId('converter-v2-rate-chip');
    // 修正前：數值用買入 0.0185 計算，標籤卻顯示「現金賣出」。
    expect(chip).toHaveTextContent('1 KRW = 0.0185 TWD');
    expect(chip).toHaveTextContent('現金買入');
    expect(chip).not.toHaveTextContent('現金賣出');
  });

  it('QA-I D1：auto 模式 TWD→KRW chip 顯示現金賣出且數值為賣出價倒數', () => {
    const krwDetails: Record<string, RateDetails> = {
      KRW: {
        name: '韓元',
        spot: { buy: null, sell: null },
        cash: { buy: 0.0185, sell: 0.0195 },
      },
    };
    render(
      <SingleConverterV2
        {...buildProps({
          fromCurrency: 'TWD',
          toCurrency: 'KRW',
          details: krwDetails,
          rateType: 'cash',
          rateMode: 'auto',
          rateTypeAvailability: { spot: false, cash: true },
        })}
      />,
    );

    const chip = screen.getByTestId('converter-v2-rate-chip');
    // TWD→外幣（客戶買外幣）：1 / KRW.cash.sell = 1 / 0.0195 ≈ 51.2821。
    expect(chip).toHaveTextContent('1 TWD = 51.2821 KRW');
    expect(chip).toHaveTextContent('現金賣出');
    expect(chip).not.toHaveTextContent('現金買入');
  });

  it('QA-I D1 review Blocking 2：買入全缺 fallback 到賣出時，標籤跟著實際採用側', () => {
    // cash.buy 缺失 → 引擎實際用 cash.sell 0.0195 計算，chip 不得再標「現金買入」。
    const buyMissingDetails: Record<string, RateDetails> = {
      KRW: {
        name: '韓元',
        spot: { buy: null, sell: null },
        cash: { buy: null, sell: 0.0195 },
      },
    };
    render(
      <SingleConverterV2
        {...buildProps({
          fromCurrency: 'KRW',
          toCurrency: 'TWD',
          details: buyMissingDetails,
          rateType: 'cash',
          rateMode: 'auto',
          rateTypeAvailability: { spot: false, cash: true },
        })}
      />,
    );

    const chip = screen.getByTestId('converter-v2-rate-chip');
    expect(chip).toHaveTextContent('1 KRW = 0.0195 TWD');
    expect(chip).toHaveTextContent('現金賣出');
    expect(chip).not.toHaveTextContent('現金買入');
  });

  it('S3：v2 Phase 1 不支援刷卡——chip 無「刷卡」字樣（標籤分支已移除，上游已收斂 bank）', () => {
    // useCurrencyConverter 已保證 v2 下 effectiveRateSource 收斂 bank；
    // 此測試鎖定 chip 標籤分支移除：即使上游誤傳 card，也不得出現「刷卡」宣稱。
    render(<SingleConverterV2 {...buildProps({ rateSource: 'card' })} />);

    const chip = screen.getByTestId('converter-v2-rate-chip');
    expect(chip).not.toHaveTextContent('刷卡');
  });

  it('QA-I D1 review：mid 模式值為中間價且標籤為「中間價」', () => {
    const krwDetails: Record<string, RateDetails> = {
      KRW: {
        name: '韓元',
        spot: { buy: null, sell: null },
        cash: { buy: 0.0185, sell: 0.0195 },
      },
    };
    render(
      <SingleConverterV2
        {...buildProps({
          fromCurrency: 'KRW',
          toCurrency: 'TWD',
          details: krwDetails,
          rateType: 'cash',
          rateMode: 'mid',
          rateTypeAvailability: { spot: false, cash: true },
        })}
      />,
    );

    const chip = screen.getByTestId('converter-v2-rate-chip');
    // (0.0185 + 0.0195) / 2 = 0.0190。
    expect(chip).toHaveTextContent('1 KRW = 0.0190 TWD');
    expect(chip).toHaveTextContent('中間價');
    expect(chip).not.toHaveTextContent('賣出');
    expect(chip).not.toHaveTextContent('買入');
  });

  it('QA-I D1 review：auto 交叉（外幣→外幣）混合價只標 rate type，省略買/賣', () => {
    const crossDetails: Record<string, RateDetails> = {
      USD: { name: '美元', spot: { buy: 30.87, sell: 30.97 }, cash: { buy: 30.4, sell: 31.4 } },
      JPY: { name: '日圓', spot: { buy: 0.2, sell: 0.204 }, cash: { buy: null, sell: null } },
    };
    render(
      <SingleConverterV2
        {...buildProps({
          fromCurrency: 'USD',
          toCurrency: 'JPY',
          details: crossDetails,
          rateType: 'spot',
          rateMode: 'auto',
          rateTypeAvailability: { spot: true, cash: false },
        })}
      />,
    );

    const chip = screen.getByTestId('converter-v2-rate-chip');
    // 值為 USD.spot.buy / JPY.spot.sell = 30.87 / 0.204 ≈ 151.3235（買/賣混合價）。
    expect(chip).toHaveTextContent('1 USD = 151.3235 JPY');
    expect(chip).toHaveTextContent('即期');
    expect(chip).not.toHaveTextContent('即期賣出');
    expect(chip).not.toHaveTextContent('即期買入');
  });

  it('QA-I D1 review：sell 模式交叉兩腿一致，維持「即期賣出」完整標籤', () => {
    const crossDetails: Record<string, RateDetails> = {
      USD: { name: '美元', spot: { buy: 30.87, sell: 30.97 }, cash: { buy: 30.4, sell: 31.4 } },
      JPY: { name: '日圓', spot: { buy: 0.2, sell: 0.204 }, cash: { buy: null, sell: null } },
    };
    render(
      <SingleConverterV2
        {...buildProps({
          fromCurrency: 'USD',
          toCurrency: 'JPY',
          details: crossDetails,
          rateType: 'spot',
          rateMode: 'sell',
          rateTypeAvailability: { spot: true, cash: false },
        })}
      />,
    );

    const chip = screen.getByTestId('converter-v2-rate-chip');
    // 值為 USD.spot.sell / JPY.spot.sell = 30.97 / 0.204 ≈ 151.8137。
    expect(chip).toHaveTextContent('1 USD = 151.8137 JPY');
    expect(chip).toHaveTextContent('即期賣出');
  });

  it('rate chip 顯示基準並可切換現金／即期', () => {
    const props = buildProps({ rateType: 'spot' });
    render(<SingleConverterV2 {...props} />);

    const chip = screen.getByTestId('converter-v2-rate-chip');
    expect(chip).toHaveTextContent('即期賣出');

    fireEvent.click(chip);
    expect(props.onRateTypeChange).toHaveBeenCalledWith('cash');
  });

  it('目標基準不可用時不切換', () => {
    const props = buildProps({
      rateType: 'spot',
      rateTypeAvailability: { spot: true, cash: false },
    });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-rate-chip'));
    expect(props.onRateTypeChange).not.toHaveBeenCalled();
  });

  it('QA-I D3：目標基準不可用時 chip 呈現不可用態（aria-disabled + 樣式）', () => {
    // KRW 無即期：切換目標 spot 不可用。
    const props = buildProps({
      rateType: 'cash',
      rateTypeAvailability: { spot: false, cash: true },
    });
    render(<SingleConverterV2 {...props} />);

    const chip = screen.getByTestId('converter-v2-rate-chip');
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip.className).toContain('cursor-not-allowed');
    expect(chip.className).toContain('opacity-60');
  });

  it('QA-I D3：不可用態點擊顯示原因 tooltip 而非無聲無反應', () => {
    const props = buildProps({
      rateType: 'cash',
      rateTypeAvailability: { spot: false, cash: true },
    });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-rate-chip'));

    expect(props.onRateTypeChange).not.toHaveBeenCalled();
    expect(screen.getByText('目前不提供 即期 匯率')).toBeInTheDocument();
  });

  it('QA-I D3：目標基準可用時 chip 不帶不可用態', () => {
    render(
      <SingleConverterV2
        {...buildProps({ rateType: 'spot', rateTypeAvailability: { spot: true, cash: true } })}
      />,
    );

    const chip = screen.getByTestId('converter-v2-rate-chip');
    expect(chip).not.toHaveAttribute('aria-disabled');
    expect(chip.className).not.toContain('cursor-not-allowed');
  });

  it('幣別 picker：開啟 bottom sheet 並選擇幣別', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-currency-from'));
    expect(screen.getByTestId('currency-picker-sheet')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('currency-option-JPY'));
    expect(props.onFromCurrencyChange).toHaveBeenCalledWith('JPY');
    expect(screen.queryByTestId('currency-picker-sheet')).not.toBeInTheDocument();
  });

  it('觸控目標尺寸：swap 熱區 44px、鍵高 54px', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    expect(screen.getByTestId('converter-v2-swap').className).toContain('h-11 w-11');
    expect(screen.getByTestId('converter-v2-key-7').className).toContain('h-[54px]');
  });
});

describe('SingleConverterV2 - 基準標籤 i18n keys（QA-I D1，四語系）', () => {
  const locales = [
    ['zh-TW', zhTW],
    ['en', en],
    ['ja', ja],
    ['ko', ko],
  ] as const;

  it.each(locales)('%s 應提供 converterV2.rateBasisCashBuy', (_name, locale) => {
    expect(locale.converterV2.rateBasisCashBuy).toEqual(expect.any(String));
    expect(locale.converterV2.rateBasisCashBuy.length).toBeGreaterThan(0);
  });

  it.each(locales)('%s 應提供 converterV2.rateBasisSpotBuy', (_name, locale) => {
    expect(locale.converterV2.rateBasisSpotBuy).toEqual(expect.any(String));
    expect(locale.converterV2.rateBasisSpotBuy.length).toBeGreaterThan(0);
  });

  it.each(locales)('%s 應提供 converterV2.rateBasisMid', (_name, locale) => {
    expect(locale.converterV2.rateBasisMid).toEqual(expect.any(String));
    expect(locale.converterV2.rateBasisMid.length).toBeGreaterThan(0);
  });

  it.each(locales)(
    '%s 應提供 mixed 標籤用的 singleConverter.cashRate/spotRate',
    (_name, locale) => {
      expect(locale.singleConverter.cashRate).toEqual(expect.any(String));
      expect(locale.singleConverter.spotRate).toEqual(expect.any(String));
    },
  );

  it('zh-TW 買入標籤為現金買入／即期買入、mid 標籤為中間價', () => {
    expect(zhTW.converterV2.rateBasisCashBuy).toBe('現金買入');
    expect(zhTW.converterV2.rateBasisSpotBuy).toBe('即期買入');
    expect(zhTW.converterV2.rateBasisMid).toBe('中間價');
  });
});

describe('SingleConverterV2 - 實體鍵盤（#587）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('鍵盤首次數字輸入取代預設種子而非串接，後續正常串接（#633 實體鍵路徑）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: '3' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // 修正前首鍵串接在種子 1000 之後，會回寫 '1000123'（QA：123456789 變 1,000,123,456,789）。
    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('123');
    expect(props.onToAmountChange).not.toHaveBeenCalled();
  });

  it('鍵盤運算子表達式以引擎 preview 回寫', () => {
    const props = buildProps({ fromAmount: '100' });
    render(<SingleConverterV2 {...props} />);

    fireEvent.keyDown(window, { key: '+' });
    fireEvent.keyDown(window, { key: '5' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('105');
  });

  it('鍵盤退格刪除最後一位並回寫', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.keyDown(window, { key: 'Backspace' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('100');
  });

  it('切換活躍列後，鍵盤輸入回寫另一列（首鍵取代該列種子）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));
    fireEvent.keyDown(window, { key: '1' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(props.onToAmountChange).toHaveBeenLastCalledWith('1');
  });

  it('幣別 picker 開啟時實體鍵盤停用，避免與 sheet 搜尋衝突', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-currency-from'));
    expect(screen.getByTestId('currency-picker-sheet')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '5' });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(props.onFromAmountChange).not.toHaveBeenCalled();
    expect(props.onToAmountChange).not.toHaveBeenCalled();
  });

  it('回歸：Cmd/Ctrl 組合鍵（如瀏覽器縮放 Cmd+-）不入表達式、不開閘改值（B-1）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.keyDown(window, { key: '-', metaKey: true });
    fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(props.onFromAmountChange).not.toHaveBeenCalled();
    expect(props.onToAmountChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('converter-v2-amount-from')).toHaveTextContent('1,000');
  });

  it('回歸：無任何鍵盤輸入時閘門維持關閉（切列零按鍵不變值）', () => {
    const props = buildProps();
    const { rerender } = render(<SingleConverterV2 {...props} />);

    // 外部重算路徑（父層 re-render）不得因掛上鍵盤監聽而誤開閘門。
    rerender(<SingleConverterV2 {...props} toAmount="99" />);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(props.onFromAmountChange).not.toHaveBeenCalled();
    expect(props.onToAmountChange).not.toHaveBeenCalled();
  });
});

describe('SingleConverterV2 - E8 wave-A：快速金額 chips（缺口 1）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('chips 內嵌 keypad 頂列，金額跟隨活躍列幣別（v1 SSOT 常數）', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const keypad = screen.getByTestId('converter-v2-keypad');
    const chips = screen.getByTestId('converter-v2-quick-chips');
    // chips 必須在 keypad 容器內（單排頂列，不佔獨立區塊）。
    expect(keypad.contains(chips)).toBe(true);
    // 活躍列預設 from（TWD）：顯示 TWD 的 SSOT 快速金額。
    expect(screen.getByTestId('converter-v2-quick-1000')).toHaveTextContent('1,000');
    expect(screen.getByTestId('converter-v2-quick-5000')).toHaveTextContent('5,000');
  });

  it('切換活躍列後 chips 跟隨該列幣別（USD SSOT 金額）', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));

    // USD SSOT：10/20/50/100/500；TWD 專屬的 3000 不得出現。
    expect(screen.getByTestId('converter-v2-quick-20')).toBeInTheDocument();
    expect(screen.queryByTestId('converter-v2-quick-3000')).not.toBeInTheDocument();
  });

  it('點擊 chip 取代活躍列金額（非串接）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-quick-500'));

    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('500');
    expect(props.onToAmountChange).not.toHaveBeenCalled();
  });

  it('chip 取代後首顆數字鍵沿用 #633 取代語意（不串接在 chip 金額之後）', () => {
    const props = buildProps();
    const { rerender } = render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-quick-500'));
    // 父層回寫後 remount keypad 重播種子（閘門關閉）。
    rerender(<SingleConverterV2 {...props} fromAmount="500" />);

    fireEvent.click(screen.getByTestId('converter-v2-key-7'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // 修正錯誤語意時會回寫 '5007'；正確為取代種子後的 '7'。
    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('7');
  });

  it('S3：chip 點擊觸發 keypad 重播種子，chips 列不 remount（DOM 同一節點、scroll／focus 保留）', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const chips = screen.getByTestId('converter-v2-quick-chips');
    const chip = screen.getByTestId('converter-v2-quick-500');
    chips.scrollLeft = 120;
    chip.focus();

    // 點擊 chip：keypadSession +1 → keypad grid remount；chips 位於 key 範圍之外不得重掛。
    fireEvent.click(chip);

    // DOM 節點同一（未重掛）＝橫向捲動位置與焦點的等效保證。
    expect(screen.getByTestId('converter-v2-quick-chips')).toBe(chips);
    expect(screen.getByTestId('converter-v2-quick-500')).toBe(chip);
    expect(chips.scrollLeft).toBe(120);
    expect(document.activeElement).toBe(chip);
  });
});

describe('SingleConverterV2 - E8 wave-A：歷史記錄 settle 寫入（缺口 2）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('鍵入後停頓 2s 視為 settle，靜默寫入歷史（notify: false）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
    expect(props.onAddToHistory).toHaveBeenCalledWith({ notify: false });
  });

  it('連續鍵入期間不寫入；停頓後只寫一筆', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByTestId('converter-v2-key-3'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(props.onAddToHistory).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
  });

  it('切列視為 settle 邊界：立即 flush，之後不重複寫入', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));

    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
  });

  it('離開（unmount）時 flush 未結算的換算', () => {
    const props = buildProps();
    const { unmount } = render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    unmount();

    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
  });

  it('零輸入不寫入歷史（切列／掛載／unmount 都不觸發）', () => {
    const props = buildProps();
    const { unmount } = render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    unmount();

    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });

  it('B1：backspace 清到 0 後停頓 2s 不寫入（金額 0 守門）', () => {
    const props = buildProps({ fromAmount: '5', toAmount: '0.16' });
    const { rerender } = render(<SingleConverterV2 {...props} />);

    // 使用者按 backspace 把活躍列清到 0：keypad 回寫 0 → 父層重算後兩列歸零。
    fireEvent.click(screen.getByTestId('converter-v2-key-backspace'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('0');
    rerender(<SingleConverterV2 {...props} fromAmount="0" toAmount="0.00" />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // 修正前 settle timer 照寫，歷史出現 0 TWD = 0.00 USD 的無意義紀錄。
    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });

  it('B1：金額為空字串時 settle 不寫入', () => {
    const props = buildProps();
    const { rerender } = render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-backspace'));
    rerender(<SingleConverterV2 {...props} fromAmount="" toAmount="" />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });

  it('B1：與上一筆自動寫入同值（from/to/amount）去重；金額變更後恢復寫入', () => {
    const props = buildProps();
    const { rerender } = render(<SingleConverterV2 {...props} />);

    // 第一次 settle：寫入（快照 TWD|USD|1000）。
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);

    // 第二次 settle：props 未變（同 from/to/amount）→ 去重跳過。
    fireEvent.click(screen.getByTestId('converter-v2-key-3'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);

    // 金額變更後再 settle：識別鍵不同 → 恢復寫入。
    rerender(<SingleConverterV2 {...props} fromAmount="53" toAmount="1.67" />);
    fireEvent.click(screen.getByTestId('converter-v2-key-7'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(props.onAddToHistory).toHaveBeenCalledTimes(2);
  });

  it('B2：pending 中切幣別（picker）取消 settle，不寫入', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    fireEvent.click(screen.getByTestId('converter-v2-currency-from'));
    fireEvent.click(screen.getByTestId('currency-option-JPY'));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // 修正前 timer 跨幣別變更後照寫，寫入的是變更後重算值（語意失真）。
    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });

  it('B2：pending 中 swap 取消 settle，不寫入', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    fireEvent.click(screen.getByTestId('converter-v2-swap'));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });

  it('B2：pending 中切換現金／即期取消 settle，不寫入', () => {
    const props = buildProps({ rateType: 'spot' });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    fireEvent.click(screen.getByTestId('converter-v2-rate-chip'));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(props.onRateTypeChange).toHaveBeenCalledWith('cash');
    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });

  it('B2：picker 選回同幣別＝同 pair，pending settle 保留照常寫入', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    fireEvent.click(screen.getByTestId('converter-v2-currency-from'));
    fireEvent.click(screen.getByTestId('currency-option-TWD'));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
  });
});

describe('SingleConverterV2 - E8 wave-A：方向翻轉（缺口 4）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('點擊 ⇄ 鈕翻轉 chip 顯示方向（倒數表示），再點恢復', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const chip = screen.getByTestId('converter-v2-rate-chip');
    const flip = screen.getByTestId('converter-v2-rate-flip');
    expect(chip).toHaveTextContent(/1 TWD = .+ USD/);
    expect(flip).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(flip);
    expect(chip).toHaveTextContent(/1 USD = .+ TWD/);
    expect(flip).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(flip);
    expect(chip).toHaveTextContent(/1 TWD = .+ USD/);
  });

  it('翻轉僅改顯示：不觸發基準切換、計價標籤不變', () => {
    const props = buildProps({ rateType: 'spot' });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-rate-flip'));

    expect(props.onRateTypeChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('converter-v2-rate-chip')).toHaveTextContent('即期賣出');
  });

  it('chip 本體 tap 語意不變：仍切換現金／即期（#659 契約）', () => {
    const props = buildProps({ rateType: 'spot' });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-rate-flip'));
    fireEvent.click(screen.getByTestId('converter-v2-rate-chip'));

    expect(props.onRateTypeChange).toHaveBeenCalledWith('cash');
  });

  it('S4：切幣別（picker）重置翻轉態為預設方向（per-pair 檢視偏好）', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const flip = screen.getByTestId('converter-v2-rate-flip');
    fireEvent.click(flip);
    expect(flip).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByTestId('converter-v2-currency-from'));
    fireEvent.click(screen.getByTestId('currency-option-JPY'));

    expect(flip).toHaveAttribute('aria-pressed', 'false');
  });

  it('S4：swap 重置翻轉態為預設方向', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const flip = screen.getByTestId('converter-v2-rate-flip');
    fireEvent.click(flip);
    expect(flip).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByTestId('converter-v2-swap'));

    expect(flip).toHaveAttribute('aria-pressed', 'false');
  });

  it('S4：同 pair session 內保留翻轉態（選回同幣別、切換基準都不重置）', () => {
    const props = buildProps({ rateType: 'spot' });
    render(<SingleConverterV2 {...props} />);

    const flip = screen.getByTestId('converter-v2-rate-flip');
    fireEvent.click(flip);

    // 選回同幣別＝pair 未變 → 保留。
    fireEvent.click(screen.getByTestId('converter-v2-currency-from'));
    fireEvent.click(screen.getByTestId('currency-option-TWD'));
    expect(flip).toHaveAttribute('aria-pressed', 'true');

    // 切換現金／即期＝同 pair 基準變更 → 保留。
    fireEvent.click(screen.getByTestId('converter-v2-rate-chip'));
    expect(flip).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('SingleConverterV2 - E8 wave-A：長按複製（缺口 6）', () => {
  const writeTextMock = vi.fn<(text: string) => Promise<void>>();

  beforeEach(() => {
    vi.useFakeTimers();
    writeTextMock.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('S1：長按 500ms 只標記意圖（視覺回饋），writeText 於 pointerup 手勢內執行', async () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const toRow = screen.getByTestId('converter-v2-amount-to');
    fireEvent.pointerDown(toRow, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // 意圖標記階段：僅視覺回饋，不得於 setTimeout callback 內呼叫 writeText
    // （脫離 user activation 會使 Safari/iOS 剪貼簿權限失效）。
    expect(toRow).toHaveAttribute('data-copy-armed', 'true');
    expect(writeTextMock).not.toHaveBeenCalled();

    // pointerup（使用者手勢同步 context）才提交複製。
    fireEvent.pointerUp(toRow, { button: 0 });
    await act(async () => {
      await Promise.resolve();
    });

    expect(writeTextMock).toHaveBeenCalledWith('1000 TWD = 31.58 USD');
    expect(showToastMock).toHaveBeenCalledWith('已複製', 'success');
    expect(toRow).not.toHaveAttribute('data-copy-armed');
  });

  it('S1：指標離開（pointerleave）放棄長按，不複製', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const toRow = screen.getByTestId('converter-v2-amount-to');
    fireEvent.pointerDown(toRow, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(toRow).toHaveAttribute('data-copy-armed', 'true');

    fireEvent.pointerLeave(toRow);

    expect(toRow).not.toHaveAttribute('data-copy-armed');
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('長按複製後鬆手的 click 不切換活躍列（誤觸防護）', async () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const toRow = screen.getByTestId('converter-v2-amount-to');
    fireEvent.pointerDown(toRow, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.pointerUp(toRow, { button: 0 });
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(toRow);

    // 複製已提交（單次），活躍列維持 from（aria-pressed 不因長按鬆手翻轉）。
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('converter-v2-amount-from')).toHaveAttribute('aria-pressed', 'true');
    expect(toRow).toHaveAttribute('aria-pressed', 'false');
  });

  it('短按（未達 500ms）不複製，維持切列語意', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const toRow = screen.getByTestId('converter-v2-amount-to');
    fireEvent.pointerDown(toRow, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerUp(toRow, { button: 0 });
    fireEvent.click(toRow);

    expect(writeTextMock).not.toHaveBeenCalled();
    expect(toRow).toHaveAttribute('aria-pressed', 'true');
  });

  it('桌面右鍵（contextmenu）等效複製', async () => {
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.contextMenu(screen.getByTestId('converter-v2-amount-from'));
    await act(async () => {
      await Promise.resolve();
    });

    expect(writeTextMock).toHaveBeenCalledWith('1000 TWD = 31.58 USD');
    expect(showToastMock).toHaveBeenCalledWith('已複製', 'success');
  });

  it('複製失敗時顯示錯誤 toast', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('denied'));
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.contextMenu(screen.getByTestId('converter-v2-amount-from'));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(showToastMock).toHaveBeenCalledWith('複製失敗', 'error');
  });
});

describe('SingleConverterV2 - 大金額自適應縮放（#590）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('QA 回歸：容器 179px、繪製 188px 時縮放至可完整顯示（保最高位）', () => {
    // QA 實測（qa-mobile-pwa-report P1-1）：51,346 USD → 1,636,397.02 TWD 左截斷。
    const props = buildProps({ fromAmount: '51346', toAmount: '1000' });
    const { rerender } = render(
      <SingleConverterV2 {...props} fromCurrency="USD" toCurrency="TWD" />,
    );

    const box = screen.getByTestId('converter-v2-amount-to');
    const text = screen.getByTestId('converter-v2-amount-text-to');
    Object.defineProperty(box, 'clientWidth', { value: 179, configurable: true });
    Object.defineProperty(text, 'offsetWidth', { value: 188, configurable: true });

    // 外部值變動觸發重量測（layout effect 依 display 重跑）。
    rerender(
      <SingleConverterV2 {...props} fromCurrency="USD" toCurrency="TWD" toAmount="1636397.02" />,
    );

    expect(text).toHaveTextContent('1,636,397');
    // 179 / 188 ≈ 0.9521：縮放後繪製寬 ≤ 容器寬，最高位「1」不再被左緣裁掉。
    expect(text.style.transform).toMatch(/^scale\(0\.95/);
    expect(text.style.transformOrigin).toBe('right center');
  });

  it('金額可容納時不縮放（transform 不出現）', () => {
    const props = buildProps();
    const { rerender } = render(<SingleConverterV2 {...props} />);

    const box = screen.getByTestId('converter-v2-amount-to');
    const text = screen.getByTestId('converter-v2-amount-text-to');
    Object.defineProperty(box, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(text, 'offsetWidth', { value: 80, configurable: true });

    rerender(<SingleConverterV2 {...props} toAmount="42" />);

    expect(text.style.transform).toBe('');
  });

  it('縮放不影響 aria-label 完整金額（可及性語意保留）', () => {
    const props = buildProps({ toAmount: '1636397.02' });
    render(<SingleConverterV2 {...props} />);

    expect(screen.getByTestId('converter-v2-amount-to')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('1,636,397.02'),
    );
  });
});

describe('SingleConverterV2 - E8 wave-B：運算式列（缺口 5）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('預設與純數字輸入不顯示運算式列（僅計算進行中顯示）', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    expect(screen.queryByTestId('converter-v2-expression')).not.toBeInTheDocument();

    // 純數字（#633 首鍵取代種子）：無運算子，不視為計算進行中。
    fireEvent.click(screen.getByTestId('converter-v2-key-7'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByTestId('converter-v2-expression')).not.toBeInTheDocument();
  });

  it('含運算子表達式顯示於活躍列（如「1000 + 5」），settle 後隱藏', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('converter-v2-expression')).toHaveTextContent('1000 + 5');

    // settle（停頓 2s）＝計算結束，運算式列隱藏。
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.queryByTestId('converter-v2-expression')).not.toBeInTheDocument();
  });

  it('CLS 零位移：運算式列為 absolute overlay，不佔版面高度', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-3'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const overlay = screen.getByTestId('converter-v2-expression');
    expect(overlay.className).toContain('absolute');
    expect(overlay.className).toContain('pointer-events-none');
  });

  it('切列（settle 邊界）後運算式列隱藏', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId('converter-v2-expression')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));
    expect(screen.queryByTestId('converter-v2-expression')).not.toBeInTheDocument();
  });

  it('B2 語意變更（swap）取消 settle 同時隱藏運算式列', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.click(screen.getByTestId('converter-v2-swap'));
    expect(screen.queryByTestId('converter-v2-expression')).not.toBeInTheDocument();
  });
});

describe('SingleConverterV2 - E8 wave-B：換錢所來源切換（缺口 3）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('不支援幣別零暴露：無 exchangeShopCurrency 時不渲染切換鈕', () => {
    render(<SingleConverterV2 {...buildProps({ onRateSourceChange: vi.fn() })} />);

    expect(screen.queryByTestId('converter-v2-rate-source')).not.toBeInTheDocument();
  });

  it('支援幣別（KRW）顯示切換鈕，點擊切至換錢所', () => {
    const onRateSourceChange = vi.fn();
    render(
      <SingleConverterV2
        {...buildProps({
          fromCurrency: 'TWD',
          toCurrency: 'KRW',
          exchangeShopCurrency: 'KRW',
          onRateSourceChange,
        })}
      />,
    );

    const toggle = screen.getByTestId('converter-v2-rate-source');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);
    expect(onRateSourceChange).toHaveBeenCalledWith('exchange-shop');
  });

  it('換錢所啟用中：chip 標註換錢所（#659 分支）、切換鈕 aria-pressed、再點回銀行', () => {
    const onRateSourceChange = vi.fn();
    render(
      <SingleConverterV2
        {...buildProps({
          fromCurrency: 'TWD',
          toCurrency: 'KRW',
          rateSource: 'exchange-shop',
          exchangeShopCurrency: 'KRW',
          onRateSourceChange,
        })}
      />,
    );

    expect(screen.getByTestId('converter-v2-rate-chip')).toHaveTextContent('換錢所');
    const toggle = screen.getByTestId('converter-v2-rate-source');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle);
    expect(onRateSourceChange).toHaveBeenCalledWith('bank');
  });

  it('換錢所啟用中 chip tap＝回銀行基準，不切現金／即期', () => {
    const onRateSourceChange = vi.fn();
    const props = buildProps({
      fromCurrency: 'TWD',
      toCurrency: 'KRW',
      rateSource: 'exchange-shop',
      exchangeShopCurrency: 'KRW',
      onRateSourceChange,
    });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-rate-chip'));

    expect(onRateSourceChange).toHaveBeenCalledWith('bank');
    expect(props.onRateTypeChange).not.toHaveBeenCalled();
  });

  it('B2：pending settle 中切換來源取消寫入（語意變更不寫失真值）', () => {
    const props = buildProps({
      fromCurrency: 'TWD',
      toCurrency: 'KRW',
      exchangeShopCurrency: 'KRW',
      onRateSourceChange: vi.fn(),
    });
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    fireEvent.click(screen.getByTestId('converter-v2-rate-source'));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });
});

describe('SingleConverterV2 - E8 wave-B：SR settle 播報（缺口 10，#620）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('aria-live=polite 摘要區常駐 DOM 且初始為空（SR 註冊 live region 前置條件）', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    const region = screen.getByTestId('converter-v2-sr-summary');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveTextContent('');
  });

  it('settle 後播報「{amount} {from} 等於 {result} {to}」，逐鍵期間不播報', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    // 非逐鍵：settle 前不得有播報內容。
    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent('');

    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent(
      '1,000.00 TWD 等於 31.58 USD',
    );
  });

  it('切列 settle 邊界同樣觸發播報（共用同一 settle 事件，無平行計時器）', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));

    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent(
      '1,000.00 TWD 等於 31.58 USD',
    );
  });

  it('B1 守門共用：金額 0 settle 不播報', () => {
    const props = buildProps({ fromAmount: '5', toAmount: '0.16' });
    const { rerender } = render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-backspace'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender(<SingleConverterV2 {...props} fromAmount="0" toAmount="0.00" />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent('');
  });

  it('視覺零變化：摘要區為 sr-only', () => {
    render(<SingleConverterV2 {...buildProps()} />);

    expect(screen.getByTestId('converter-v2-sr-summary').className).toContain('sr-only');
  });
});

describe('SingleConverterV2 - E8 wave-B：趨勢 sheet 強化（缺口 8）', () => {
  const trendPoints = [
    { date: '2026-07-01', rate: 31.2 },
    { date: '2026-07-02', rate: 31.4 },
    { date: '2026-07-03', rate: 31.6 },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    // 還原檔頭預設 mock，避免污染其他 describe。
    vi.mocked(useConverterTrend).mockImplementation(() => ({
      data: [],
      isLoading: false,
      trendRateType: 'spot',
    }));
  });

  function renderWithRouter(props = buildProps()) {
    return render(
      <MemoryRouter>
        <SingleConverterV2 {...props} />
      </MemoryRouter>,
    );
  }

  function openTrendSheet() {
    fireEvent.click(screen.getByTestId('converter-v2-sparkline'));
  }

  it('sheet 內顯示基準切換（現金／即期），點擊切換後標註跟隨', () => {
    vi.mocked(useConverterTrend).mockImplementation(({ rateType }) => ({
      data: trendPoints,
      isLoading: false,
      trendRateType: rateType,
    }));
    renderWithRouter(buildProps({ rateType: 'cash' }));
    openTrendSheet();

    const cashOption = screen.getByTestId('converter-v2-trend-basis-cash');
    expect(cashOption).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/基準：現金賣出/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('converter-v2-trend-basis-spot'));
    expect(screen.getByTestId('converter-v2-trend-basis-spot')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByText(/基準：即期賣出/)).toBeInTheDocument();
  });

  it('誠實回落（#564）：KRW 即期序列缺失時切即期，序列與標註同步回落現金賣出', () => {
    // 模擬 resolveTrendSeries 行為：要求 spot 但可繪點不足 → 回傳 cash 序列＋實際基準 cash。
    vi.mocked(useConverterTrend).mockImplementation(({ rateType }) =>
      rateType === 'spot'
        ? { data: trendPoints, isLoading: false, trendRateType: 'cash' }
        : { data: trendPoints, isLoading: false, trendRateType: rateType },
    );
    renderWithRouter(
      buildProps({
        fromCurrency: 'KRW',
        toCurrency: 'TWD',
        rateType: 'cash',
        rateTypeAvailability: { spot: false, cash: true },
      }),
    );
    openTrendSheet();

    fireEvent.click(screen.getByTestId('converter-v2-trend-basis-spot'));

    // 值-標籤同步：實際採用序列為現金 → 標註必須顯示現金賣出，不得宣稱即期。
    expect(screen.getByText(/基準：現金賣出/)).toBeInTheDocument();
    expect(screen.queryByText(/基準：即期賣出/)).not.toBeInTheDocument();
  });

  it('攻略連結：pair 落地頁存在（TWD→USD＝/twd-usd/）時顯示並指向該頁', () => {
    renderWithRouter();
    openTrendSheet();

    const link = screen.getByTestId('converter-v2-trend-guide-link');
    expect(link).toHaveAttribute('href', '/twd-usd/');
    expect(link).toHaveTextContent('查看 USD 攻略');
  });

  it('攻略連結：pair 落地頁不存在（USD→JPY）時零暴露', () => {
    renderWithRouter(buildProps({ fromCurrency: 'USD', toCurrency: 'JPY' }));
    openTrendSheet();

    expect(screen.queryByTestId('converter-v2-trend-guide-link')).not.toBeInTheDocument();
  });

  it('換錢所來源時 sheet 隱藏基準切換（無現金／即期語意）', () => {
    renderWithRouter(
      buildProps({
        fromCurrency: 'TWD',
        toCurrency: 'KRW',
        rateSource: 'exchange-shop',
        exchangeShopCurrency: 'KRW',
        onRateSourceChange: vi.fn(),
      }),
    );
    openTrendSheet();

    expect(screen.queryByTestId('converter-v2-trend-basis-cash')).not.toBeInTheDocument();
    expect(screen.queryByTestId('converter-v2-trend-basis-spot')).not.toBeInTheDocument();
  });
});

describe('SingleConverterV2 - E8 wave-B 審查殘項（#669）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('第 1 項：settle 後單按運算子（值未變），overlay 沿 settle 計時自動清除且不寫歷史', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    // 先完成一次 settle（dirty 已消化）。
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('converter-v2-expression')).not.toBeInTheDocument();

    // settle 後單按運算子：值未變（引擎無回寫），overlay 顯示。
    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId('converter-v2-expression')).toBeInTheDocument();

    // 修正前無 pending settle 時不排計時，overlay 常駐至下次輸入；修正後同一 settle 計時清除。
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.queryByTestId('converter-v2-expression')).not.toBeInTheDocument();
    // overlay 隱藏計時為純視覺清除：不得額外寫入歷史。
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
  });

  it('QA-J J-4：運算式未完成的 timer settle 只播報不寫入歷史，切列邊界才寫入最終值', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    // 1000 + 5 停頓 2s：settle 落在運算式進行中（中間值情境）。
    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // 修正前中間值寫入歷史造成噪音；修正後 timer settle 不寫入，SR 播報照常。
    expect(props.onAddToHistory).not.toHaveBeenCalled();
    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent(
      '1,000.00 TWD 等於 31.58 USD',
    );
    expect(screen.queryByTestId('converter-v2-expression')).not.toBeInTheDocument();

    // 切列＝運算式作廢邊界（keypad remount），列值即最終值 → 此時才寫入一筆。
    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
  });

  it('QA-J J-4 補強：頁面轉入背景（visibilitychange hidden）flush deferred dirty，關 app 不遺失', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    // 1000 + 5 停頓 2s：deferred（運算式未完成不寫入）。
    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(props.onAddToHistory).not.toHaveBeenCalled();

    try {
      // 前景態的 visibilitychange（如切回前景）不觸發 flush。
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      fireEvent(document, new Event('visibilitychange'));
      expect(props.onAddToHistory).not.toHaveBeenCalled();

      // 轉入背景（PWA 殺程序前最後寫入時機）：deferred dirty 立即寫入最終值。
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      fireEvent(document, new Event('visibilitychange'));
      expect(props.onAddToHistory).toHaveBeenCalledTimes(1);

      // 再次背景切換不重複寫入（dirty 已消化）。
      fireEvent(document, new Event('visibilitychange'));
      expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
    } finally {
      // 還原 prototype getter，避免污染其他測試。
      delete (document as unknown as Record<string, unknown>)['hidden'];
    }
  });

  it('QA-J J-4 補強：unmount 移除 visibilitychange listener（無洩漏）', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<SingleConverterV2 {...buildProps()} />);

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('QA-J J-4：運算式未完成期間語意變更（swap）仍取消不寫（B2 語意不破）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-+'));
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(props.onAddToHistory).not.toHaveBeenCalled();

    // 延後寫入的 dirty 不得跨語意變更存活。
    fireEvent.click(screen.getByTestId('converter-v2-swap'));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });

  function buildExchangeShopProps(overrides: Partial<SingleConverterProps> = {}) {
    return buildProps({
      fromCurrency: 'TWD',
      toCurrency: 'KRW',
      fromAmount: '1000',
      toAmount: '42000',
      exchangeShopCurrency: 'KRW',
      onRateSourceChange: vi.fn(),
      ...overrides,
    });
  }

  it('QA-J J-2：換錢所切換後新值 settle 重播 SR status（announce-only 不寫歷史）', () => {
    const props = buildExchangeShopProps();
    const { rerender } = render(<SingleConverterV2 {...props} />);

    // 先 settle 一次：SR 播報銀行來源結果。
    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent('42,000 KRW');

    // 切換來源：父層以換錢所匯率重算 to 列。
    fireEvent.click(screen.getByTestId('converter-v2-rate-source'));
    rerender(<SingleConverterV2 {...props} rateSource="exchange-shop" toAmount="43210" />);

    // 修正前 SR status 停留舊播報；修正後新來源值沿同一 settle 計時自然重播。
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent('43,210 KRW');
    // announce-only：與 B2 cancel 語意協調，不得把來源切換後的重算值寫入歷史。
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
  });

  it('QA-J J-2：換錢所啟用中 chip tap 回銀行同屬來源切換，新值 settle 重播', () => {
    const props = buildExchangeShopProps({ rateSource: 'exchange-shop', toAmount: '43210' });
    const { rerender } = render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent('43,210 KRW');

    fireEvent.click(screen.getByTestId('converter-v2-rate-chip'));
    rerender(<SingleConverterV2 {...props} rateSource="bank" toAmount="42000" />);

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent('42,000 KRW');
    expect(props.onAddToHistory).toHaveBeenCalledTimes(1);
  });

  it('QA-J J-2：尚無任何播報時切換來源不排定重播（無 stale status 可修）', () => {
    const props = buildExchangeShopProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-rate-source'));
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByTestId('converter-v2-sr-summary')).toHaveTextContent('');
    expect(props.onAddToHistory).not.toHaveBeenCalled();
  });
});

describe('SingleConverterV2 - E8 wave-B i18n keys（四語系守門）', () => {
  const locales = [
    ['zh-TW', zhTW],
    ['en', en],
    ['ja', ja],
    ['ko', ko],
  ] as const;

  it.each(locales)('%s 應提供 converterV2.settleAnnouncement（含四個插值槽）', (_name, locale) => {
    const template = locale.converterV2.settleAnnouncement;
    expect(template).toEqual(expect.any(String));
    for (const slot of ['{{amount}}', '{{from}}', '{{result}}', '{{to}}']) {
      expect(template).toContain(slot);
    }
  });

  it.each(locales)(
    '%s 應提供 converterV2.trendGuideLink 與 trendBasisSwitchLabel',
    (_name, locale) => {
      expect(locale.converterV2.trendGuideLink).toContain('{{code}}');
      expect(locale.converterV2.trendBasisSwitchLabel.length).toBeGreaterThan(0);
    },
  );

  it('zh-TW settle 播報格式為「{amount} {from} 等於 {result} {to}」', () => {
    expect(zhTW.converterV2.settleAnnouncement).toBe('{{amount}} {{from}} 等於 {{result}} {{to}}');
  });
});
