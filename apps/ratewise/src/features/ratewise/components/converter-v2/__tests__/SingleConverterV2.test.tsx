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
