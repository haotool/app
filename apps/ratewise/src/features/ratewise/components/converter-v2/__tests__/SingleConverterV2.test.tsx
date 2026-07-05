/**
 * SingleConverterV2 單元測試：換算對等性（兩列皆可編輯）、swap、rate chip 基準切換、
 * bottom sheet 幣別 picker。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SingleConverterV2 } from '../SingleConverterV2';
import type { SingleConverterProps } from '../../SingleConverter';
import type { CurrencyCode } from '../../../types';

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

  it('鍵入數字時即時回寫活躍列（預設第一列）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-5'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('10005');
    expect(props.onToAmountChange).not.toHaveBeenCalled();
  });

  it('切換活躍列後，鍵入回寫另一列（換算對等性）', () => {
    const props = buildProps();
    render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-amount-to'));
    fireEvent.click(screen.getByTestId('converter-v2-key-1'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(props.onToAmountChange).toHaveBeenLastCalledWith('31.581');
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

    fireEvent.click(screen.getByTestId('converter-v2-key-1'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // 修正前種子仍為掛載時的 1000，會回寫 '10001'。
    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('5001');
  });

  it('回歸：被引擎拒絕的按鍵不得開啟回寫閘門', () => {
    // 8 位小數已達 iOS 上限，再鍵入數字會被 canAddDigit 拒絕（表達式不變）。
    const props = buildProps({ fromAmount: '0.12345678' });
    const { rerender } = render(<SingleConverterV2 {...props} />);

    fireEvent.click(screen.getByTestId('converter-v2-key-9'));
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
    fireEvent.click(screen.getByTestId('converter-v2-key-9'));
    rerender(<SingleConverterV2 {...props} fromAmount="200" />);

    fireEvent.click(screen.getByTestId('converter-v2-key-3'));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(props.onFromAmountChange).toHaveBeenLastCalledWith('2003');
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
