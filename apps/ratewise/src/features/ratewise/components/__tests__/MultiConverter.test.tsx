import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiConverter } from '../MultiConverter';
import type { CurrencyCode, MultiAmountsState, RateType } from '../../types';
import type { RateDetails } from '../../hooks/useExchangeRates';

// Mock RateTypeTooltip
vi.mock('../../../../components/RateTypeTooltip', () => ({
  RateTypeTooltip: ({
    children,
    message,
    isDisabled,
  }: {
    children: React.ReactNode;
    message: string;
    isDisabled: boolean;
  }) => (
    <div data-testid="rate-type-tooltip" data-message={message} data-disabled={isDisabled}>
      {children}
    </div>
  ),
}));

// Mock CalculatorKeyboard
vi.mock('../../../calculator/components/CalculatorKeyboard', () => ({
  CalculatorKeyboard: ({
    isOpen,
    onClose,
    onConfirm,
    initialValue,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: number) => void;
    initialValue: number;
  }) =>
    isOpen ? (
      <div data-testid="calculator-keyboard">
        <span data-testid="calculator-initial-value">{initialValue}</span>
        <button data-testid="calculator-close" onClick={onClose}>
          Close
        </button>
        <button data-testid="calculator-confirm" onClick={() => onConfirm(12345)}>
          Confirm
        </button>
      </div>
    ) : null,
}));

describe('MultiConverter', () => {
  const defaultProps = {
    sortedCurrencies: ['TWD', 'USD', 'JPY', 'EUR'] as CurrencyCode[],
    multiAmounts: {
      TWD: '1000',
      USD: '31.78',
      JPY: '4909',
      EUR: '27.23',
    } as MultiAmountsState,
    baseCurrency: 'TWD' as CurrencyCode,
    favorites: ['TWD', 'JPY'] as CurrencyCode[],
    rateType: 'spot' as RateType,
    details: {
      TWD: { name: '新台幣', spot: { sell: 1, buy: 1 }, cash: { sell: 1, buy: 1 } },
      USD: { name: '美元', spot: { sell: 31.665, buy: 31.165 }, cash: { sell: 31.78, buy: 31.0 } },
      JPY: {
        name: '日圓',
        spot: { sell: 0.2047, buy: 0.2007 },
        cash: { sell: 0.2087, buy: 0.1967 },
      },
      EUR: { name: '歐元', spot: { sell: 36.95, buy: 36.45 }, cash: { sell: 37.15, buy: 36.25 } },
      KRW: { name: '韓元', spot: { sell: null, buy: 0 }, cash: { sell: 0.0236, buy: 0.0216 } }, // 只有現金匯率
    } as unknown as Record<string, RateDetails>,
    onAmountChange: vi.fn(),
    onQuickAmount: vi.fn(),
    onToggleFavorite: vi.fn(),
    onRateTypeChange: vi.fn(),
    onBaseCurrencyChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該渲染所有貨幣項目', () => {
      render(<MultiConverter {...defaultProps} />);

      expect(screen.getByText('TWD')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
      expect(screen.getByText('JPY')).toBeInTheDocument();
      expect(screen.getByText('EUR')).toBeInTheDocument();
    });

    it('應該渲染快速金額按鈕', () => {
      render(<MultiConverter {...defaultProps} />);

      expect(screen.getByRole('button', { name: '100' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '500' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1,000' })).toBeInTheDocument();
    });

    it('應該顯示即時多幣別換算標籤', () => {
      render(<MultiConverter {...defaultProps} />);

      expect(screen.getByText(/即時多幣別換算/)).toBeInTheDocument();
    });
  });

  describe('快速金額功能', () => {
    it('點擊快速金額按鈕應該呼叫 onQuickAmount', () => {
      render(<MultiConverter {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '1,000' }));
      expect(defaultProps.onQuickAmount).toHaveBeenCalledWith(1000);
    });
  });

  describe('收藏功能', () => {
    it('應該顯示收藏狀態', () => {
      render(<MultiConverter {...defaultProps} />);

      // TWD 和 JPY 是收藏的
      const twdFavoriteBtn = screen.getByRole('button', { name: '移除常用貨幣 TWD' });
      const usdFavoriteBtn = screen.getByRole('button', { name: '加入常用貨幣 USD' });

      expect(twdFavoriteBtn).toBeInTheDocument();
      expect(usdFavoriteBtn).toBeInTheDocument();
    });

    it('點擊收藏按鈕應該呼叫 onToggleFavorite', () => {
      render(<MultiConverter {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '加入常用貨幣 USD' }));
      expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('USD');
    });
  });

  describe('基準貨幣切換', () => {
    it('點擊非基準貨幣應該呼叫 onBaseCurrencyChange', () => {
      render(<MultiConverter {...defaultProps} />);

      // 點擊 USD 行（不是基準貨幣）
      const usdRow = screen.getByText('美元').closest('div[class*="rounded-xl"]');
      expect(usdRow).toBeTruthy();
      fireEvent.click(usdRow!);
      expect(defaultProps.onBaseCurrencyChange).toHaveBeenCalledWith('USD');
    });

    it('基準貨幣應該有特殊的樣式', () => {
      render(<MultiConverter {...defaultProps} />);

      // TWD 是基準貨幣，應該有黃色背景
      const twdRow = screen.getByText('TWD').closest('div[class*="rounded-xl"]');
      expect(twdRow).toHaveClass('from-yellow-50');
    });
  });

  describe('匯率類型切換', () => {
    it('點擊匯率類型按鈕應該呼叫 onRateTypeChange', () => {
      render(<MultiConverter {...defaultProps} />);

      // 找到可切換的匯率類型按鈕（非禁用狀態）- 取第一個
      const rateTypeButtons = screen.getAllByRole('button', { name: /切換到.*匯率/ });
      expect(rateTypeButtons.length).toBeGreaterThan(0);
      fireEvent.click(rateTypeButtons[0]!);
      expect(defaultProps.onRateTypeChange).toHaveBeenCalled();
    });
  });

  describe('計算機功能', () => {
    it('點擊金額應該開啟計算機', () => {
      render(<MultiConverter {...defaultProps} />);

      // 點擊 TWD 金額區域
      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.click(twdAmountBtn);

      expect(screen.getByTestId('calculator-keyboard')).toBeInTheDocument();
    });

    it('計算機確認應該更新金額', () => {
      render(<MultiConverter {...defaultProps} />);

      // 開啟計算機
      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.click(twdAmountBtn);

      // 確認計算結果
      fireEvent.click(screen.getByTestId('calculator-confirm'));

      expect(defaultProps.onAmountChange).toHaveBeenCalledWith('TWD', '12345');
    });

    it('計算機關閉應該隱藏', () => {
      render(<MultiConverter {...defaultProps} />);

      // 開啟計算機
      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.click(twdAmountBtn);

      // 關閉計算機
      fireEvent.click(screen.getByTestId('calculator-close'));

      expect(screen.queryByTestId('calculator-keyboard')).not.toBeInTheDocument();
    });

    it('鍵盤 Enter 應該開啟計算機', () => {
      render(<MultiConverter {...defaultProps} />);

      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.keyDown(twdAmountBtn, { key: 'Enter' });

      expect(screen.getByTestId('calculator-keyboard')).toBeInTheDocument();
    });

    it('鍵盤 Space 應該開啟計算機', () => {
      render(<MultiConverter {...defaultProps} />);

      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.keyDown(twdAmountBtn, { key: ' ' });

      expect(screen.getByTestId('calculator-keyboard')).toBeInTheDocument();
    });
  });

  describe('匯率顯示', () => {
    it('應該顯示正確的匯率格式', () => {
      render(<MultiConverter {...defaultProps} />);

      // TWD 作為基準貨幣時，USD 應該顯示 1 TWD = X USD
      expect(screen.getByText(/1 TWD = .* USD/)).toBeInTheDocument();
    });

    it('當匯率數據不完整時應該使用 fallback 機制', () => {
      // KRW 只有現金匯率，沒有即期匯率
      const propsWithKRW = {
        ...defaultProps,
        sortedCurrencies: ['TWD', 'KRW'] as CurrencyCode[],
        multiAmounts: { TWD: '1000', KRW: '42463' } as MultiAmountsState,
        rateType: 'spot' as RateType, // 請求即期匯率，但 KRW 只有現金
      };

      render(<MultiConverter {...propsWithKRW} />);

      // KRW 應該使用現金匯率作為 fallback，不應該顯示「無資料」
      expect(screen.queryByText('無資料')).not.toBeInTheDocument();
    });
  });

  describe('只有單一匯率類型的貨幣', () => {
    it('只有現金匯率的貨幣應該使用 RateTypeTooltip', () => {
      const propsWithKRW = {
        ...defaultProps,
        sortedCurrencies: ['TWD', 'KRW'] as CurrencyCode[],
        multiAmounts: {
          TWD: '1000',
          KRW: '42463',
        } as MultiAmountsState,
      };

      render(<MultiConverter {...propsWithKRW} />);

      // KRW 應該有 tooltip（因為只有現金匯率）
      const tooltips = screen.getAllByTestId('rate-type-tooltip');
      expect(tooltips.length).toBeGreaterThan(0);
    });
  });

  describe('交叉匯率計算', () => {
    it('非 TWD 基準貨幣應該計算交叉匯率', () => {
      const propsWithUSDBase = {
        ...defaultProps,
        baseCurrency: 'USD' as CurrencyCode,
      };

      render(<MultiConverter {...propsWithUSDBase} />);

      // USD 作為基準貨幣，應該顯示 1 USD = X JPY
      expect(screen.getByText(/1 USD = .* JPY/)).toBeInTheDocument();
    });

    it('目標貨幣是 TWD 時應該正確顯示匯率', () => {
      const propsWithUSDBase = {
        ...defaultProps,
        baseCurrency: 'USD' as CurrencyCode,
        sortedCurrencies: ['USD', 'TWD'] as CurrencyCode[],
      };

      render(<MultiConverter {...propsWithUSDBase} />);

      // 應該顯示 1 USD = X TWD
      expect(screen.getByText(/1 USD = .* TWD/)).toBeInTheDocument();
    });
  });

  describe('無障礙性', () => {
    it('貨幣列表應該有正確的 aria-label', () => {
      render(<MultiConverter {...defaultProps} />);

      expect(screen.getByRole('region', { name: '貨幣列表' })).toBeInTheDocument();
    });

    it('金額按鈕應該有正確的 aria-label', () => {
      render(<MultiConverter {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: '新台幣 (TWD) 金額，點擊開啟計算機' }),
      ).toBeInTheDocument();
    });
  });
});
