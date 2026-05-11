// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MultiConverter } from '../MultiConverter';
import type { CurrencyCode, MultiAmountsState, RateMode, RateType } from '../../types';
import type { RateDetails } from '../../hooks/useExchangeRates';
import type { ExchangeShopRate } from '../../../../services/moneyboxRateService';

const translations: Record<string, string> = {
  'currencies.TWD': '新台幣',
  'currencies.USD': '美元',
  'currencies.JPY': '日圓',
  'currencies.EUR': '歐元',
  'currencies.KRW': '韓元',
  'favorites.addFavorite': '加入常用貨幣',
  'favorites.removeFavorite': '移除常用貨幣',
  'multiConverter.amountClickCalculator': '{{name}} ({{code}}) 金額，點擊開啟計算機',
  'multiConverter.baseCurrency': '基準貨幣',
  'multiConverter.calculating': '計算中',
  'multiConverter.cashOnlyNote': '{{code}} 僅提供現金匯率',
  'multiConverter.cashRate': '現金',
  'multiConverter.currencyListLabel': '貨幣列表',
  'multiConverter.noData': '無資料',
  'multiConverter.spotOnlyNote': '{{code}} 僅提供即期匯率',
  'multiConverter.spotRate': '即期',
  'multiConverter.switchToCash': '切換到現金匯率',
  'multiConverter.switchToSpot': '切換到即期匯率',
  'multiConverter.switchToNextRate': '切換到{{next}}',
  'multiConverter.onlyOneRateAvailable': '此幣別僅有一種匯率可用',
  'singleConverter.exchangeShopRate': '換錢所',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => {
      const template = translations[key] ?? key;
      return Object.entries(values ?? {}).reduce(
        (message, [name, value]) => message.replaceAll(`{{${name}}}`, value),
        template,
      );
    },
  }),
}));

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
    rateMode: 'sell' as RateMode,
    details: {
      TWD: { name: '新台幣', spot: { sell: 1, buy: 1 }, cash: { sell: 1, buy: 1 } },
      USD: { name: '美元', spot: { sell: 31.665, buy: 31.165 }, cash: { sell: 31.78, buy: 31.0 } },
      JPY: {
        name: '日圓',
        spot: { sell: 0.2047, buy: 0.2007 },
        cash: { sell: 0.2087, buy: 0.1967 },
      },
      EUR: { name: '歐元', spot: { sell: 36.95, buy: 36.45 }, cash: { sell: 37.15, buy: 36.25 } },
      KRW: { name: '韓元', spot: { sell: null, buy: 0 }, cash: { sell: 0.0236, buy: 0.0216 } },
    } as unknown as Record<string, RateDetails>,
    onAmountChange: vi.fn(),
    onQuickAmount: vi.fn(),
    onRateTypeChange: vi.fn(),
    onRateSourceChange: vi.fn(),
    onBaseCurrencyChange: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
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
  });

  describe('快速金額功能', () => {
    it('點擊快速金額按鈕應該呼叫 onQuickAmount', () => {
      render(<MultiConverter {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '1,000' }));
      expect(defaultProps.onQuickAmount).toHaveBeenCalledWith(1000);
    });
  });

  describe('基準貨幣切換', () => {
    it('點擊非基準貨幣應該呼叫 onBaseCurrencyChange', () => {
      render(<MultiConverter {...defaultProps} />);

      const usdRow = screen.getByText('美元').closest('div[class*="rounded-xl"]');
      expect(usdRow).toBeTruthy();
      fireEvent.click(usdRow!);
      expect(defaultProps.onBaseCurrencyChange).toHaveBeenCalledWith('USD');
    });

    it('基準貨幣應該有特殊的樣式', () => {
      render(<MultiConverter {...defaultProps} />);

      const twdRow = screen.getByText('TWD').closest('div[class*="rounded-xl"]');
      expect(twdRow).toHaveClass('cursor-default');
      const usdRow = screen.getByText('USD').closest('div[class*="rounded-xl"]');
      expect(usdRow).toHaveClass('cursor-pointer');
    });
  });

  describe('匯率類型切換', () => {
    it('點擊匯率類型按鈕應該呼叫 onRateTypeChange 或 onRateSourceChange', () => {
      render(<MultiConverter {...defaultProps} />);

      const rateToggleButtons = screen.getAllByRole('button', { name: /切換到/ });
      expect(rateToggleButtons.length).toBeGreaterThan(0);
      fireEvent.click(rateToggleButtons[0]!);
      const called =
        defaultProps.onRateTypeChange.mock.calls.length > 0 ||
        defaultProps.onRateSourceChange!.mock.calls.length > 0;
      expect(called).toBe(true);
    });
  });

  describe('計算機功能', () => {
    it('點擊金額應該開啟計算機', async () => {
      render(<MultiConverter {...defaultProps} />);

      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.click(twdAmountBtn);

      expect(await screen.findByTestId('calculator-keyboard')).toBeInTheDocument();
    });

    it('計算機確認應該更新金額', async () => {
      render(<MultiConverter {...defaultProps} />);

      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.click(twdAmountBtn);

      fireEvent.click(await screen.findByTestId('calculator-confirm'));

      expect(defaultProps.onAmountChange).toHaveBeenCalledWith('TWD', '12345');
    });

    it('計算機關閉應該隱藏', async () => {
      render(<MultiConverter {...defaultProps} />);

      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.click(twdAmountBtn);

      fireEvent.click(await screen.findByTestId('calculator-close'));

      expect(screen.queryByTestId('calculator-keyboard')).not.toBeInTheDocument();
    });

    it('鍵盤 Enter 應該開啟計算機', async () => {
      render(<MultiConverter {...defaultProps} />);

      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.keyDown(twdAmountBtn, { key: 'Enter' });

      expect(await screen.findByTestId('calculator-keyboard')).toBeInTheDocument();
    });

    it('鍵盤 Space 應該開啟計算機', async () => {
      render(<MultiConverter {...defaultProps} />);

      const twdAmountBtn = screen.getByRole('button', {
        name: '新台幣 (TWD) 金額，點擊開啟計算機',
      });
      fireEvent.keyDown(twdAmountBtn, { key: ' ' });

      expect(await screen.findByTestId('calculator-keyboard')).toBeInTheDocument();
    });
  });

  describe('匯率顯示', () => {
    it('應該顯示正確的匯率格式', () => {
      render(<MultiConverter {...defaultProps} />);

      expect(screen.getByText(/1 TWD = .* USD/)).toBeInTheDocument();
    });

    it('TWD 不在 details 內時仍應視為 1 並顯示外幣匯率', () => {
      const { TWD: _twd, ...detailsWithoutTwd } = defaultProps.details;

      render(
        <MultiConverter
          {...defaultProps}
          details={detailsWithoutTwd as unknown as Record<string, RateDetails>}
        />,
      );

      expect(screen.getByText(/1 TWD = .* USD/)).toBeInTheDocument();
      expect(screen.queryAllByText('計算中')).toHaveLength(0);
    });

    it('當匯率數據不完整時應該使用 fallback 機制', () => {
      const propsWithKRW = {
        ...defaultProps,
        sortedCurrencies: ['TWD', 'KRW'] as CurrencyCode[],
        multiAmounts: { TWD: '1000', KRW: '42463' } as MultiAmountsState,
        rateType: 'spot' as RateType,
      };

      render(<MultiConverter {...propsWithKRW} />);

      expect(screen.queryByText('無資料')).not.toBeInTheDocument();
    });

    it('auto 模式應依共用核心顯示基準幣對 TWD 與交叉匯率', () => {
      const propsWithUsdBase = {
        ...defaultProps,
        sortedCurrencies: ['USD', 'TWD', 'JPY'] as CurrencyCode[],
        baseCurrency: 'USD' as CurrencyCode,
        rateMode: 'auto' as RateMode,
        multiAmounts: {
          USD: '100',
          TWD: '3087.00',
          JPY: '15131',
        } as MultiAmountsState,
        favorites: ['JPY'] as CurrencyCode[],
        details: {
          TWD: { name: '新台幣', spot: { sell: 1, buy: 1 }, cash: { sell: 1, buy: 1 } },
          USD: { name: '美元', spot: { sell: 30.97, buy: 30.87 }, cash: { sell: 31.4, buy: 30.4 } },
          JPY: { name: '日圓', spot: { sell: 0.204, buy: 0.2 }, cash: { sell: null, buy: null } },
        } as unknown as Record<string, RateDetails>,
      };

      render(<MultiConverter {...propsWithUsdBase} />);

      expect(screen.getByText(/1 USD = 30\.8700 TWD/)).toBeInTheDocument();
      expect(screen.getByText(/1 USD = 151\.3235 JPY/)).toBeInTheDocument();
      expect(screen.queryByText(/1 USD = 30\.9700 TWD/)).not.toBeInTheDocument();
      expect(screen.queryByText(/1 USD = 151\.8137 JPY/)).not.toBeInTheDocument();
    });

    it('exchange-shop 模式應在多幣別顯示換錢所 TWD 配對匯率', () => {
      const krwExchangeShopRate: ExchangeShopRate = {
        currency: 'KRW',
        sell: 44.9,
        buy: 45.1,
        updateTime: '2026/05/08 09:30:00',
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        providerName: '明洞換匯所',
        isFallback: false,
      };
      const propsWithExchangeShop = {
        ...defaultProps,
        sortedCurrencies: ['TWD', 'KRW'] as CurrencyCode[],
        baseCurrency: 'TWD' as CurrencyCode,
        rateType: 'cash' as RateType,
        rateMode: 'sell' as RateMode,
        rateSource: 'exchange-shop' as const,
        exchangeShopRatesByCurrency: {
          KRW: krwExchangeShopRate,
        },
        multiAmounts: {
          TWD: '1000',
          KRW: '44900',
        } as MultiAmountsState,
      };

      render(<MultiConverter {...propsWithExchangeShop} />);

      expect(screen.getByText(/1 TWD = 44\.9000 KRW/)).toBeInTheDocument();
      expect(screen.queryByText(/1 TWD = 42\.3729 KRW/)).not.toBeInTheDocument();
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

      expect(screen.getByText(/1 USD = .* JPY/)).toBeInTheDocument();
    });

    it('目標貨幣是 TWD 時應該正確顯示匯率', () => {
      const propsWithUSDBase = {
        ...defaultProps,
        baseCurrency: 'USD' as CurrencyCode,
        sortedCurrencies: ['USD', 'TWD'] as CurrencyCode[],
      };

      render(<MultiConverter {...propsWithUSDBase} />);

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

  describe('TWD 收藏星號行為', () => {
    it('TWD 星號應為固定裝飾（data-testid=twd-star-fixed），不論 favorites 是否包含 TWD', () => {
      const propsWithoutTWDFav = {
        ...defaultProps,
        favorites: ['JPY'] as CurrencyCode[],
      };
      render(<MultiConverter {...propsWithoutTWDFav} />);

      expect(screen.getByTestId('twd-star-fixed')).toBeInTheDocument();
    });

    it('TWD 星號容器應設 aria-hidden="true"（純裝飾）', () => {
      const propsWithoutTWDFav = {
        ...defaultProps,
        favorites: [] as CurrencyCode[],
      };
      const { container } = render(<MultiConverter {...propsWithoutTWDFav} />);

      const twdStar = container.querySelector('[data-testid="twd-star-fixed"]');
      expect(twdStar).toBeInTheDocument();
      expect(twdStar?.closest('[aria-hidden="true"]')).toBeTruthy();
    });

    it('點擊 TWD 星號區域不應呼叫 onToggleFavorite', () => {
      const propsWithoutTWDFav = {
        ...defaultProps,
        favorites: [] as CurrencyCode[],
      };
      render(<MultiConverter {...propsWithoutTWDFav} />);

      const twdStar = screen.getByTestId('twd-star-fixed');
      fireEvent.click(twdStar);
      expect(defaultProps.onToggleFavorite).not.toHaveBeenCalledWith('TWD');
    });

    it('非 TWD 貨幣星號應為互動按鈕（JPY 已收藏 → filled star，aria-label 符合翻譯）', () => {
      render(<MultiConverter {...defaultProps} />);

      const removeBtn = screen.getByRole('button', { name: /移除常用貨幣/ });
      expect(removeBtn).toBeInTheDocument();
    });
  });
});
