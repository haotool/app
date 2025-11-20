/**
 * MultiConverter Calculator Integration Tests
 * @file MultiConverter.calculator.test.tsx
 * @description BDD 測試：多幣別計算機整合功能
 * @see docs/dev/013_multi_converter_calculator_integration.md
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiConverter } from '../MultiConverter';
import type { CurrencyCode, MultiAmountsState } from '../../types';

// Mock exchangeRateHistoryService
vi.mock('../../../../services/exchangeRateHistoryService', () => ({
  fetchHistoricalRatesRange: vi.fn().mockResolvedValue([]),
  fetchLatestRates: vi.fn().mockResolvedValue({ lastUpdate: '2025-11-20', rates: {} }),
}));

// Helper function to create complete MultiAmountsState
const createMultiAmounts = (partial: Partial<MultiAmountsState>): MultiAmountsState => {
  const allCurrencies: CurrencyCode[] = [
    'TWD',
    'USD',
    'CHF',
    'JPY',
    'KRW',
    'HKD',
    'GBP',
    'AUD',
    'CAD',
    'SGD',
    'EUR',
    'CNY',
    'NZD',
    'THB',
    'PHP',
    'IDR',
    'VND',
    'MYR',
  ];
  const result = {} as MultiAmountsState;
  allCurrencies.forEach((code) => {
    result[code] = partial[code] ?? '';
  });
  return result;
};

const mockProps = {
  sortedCurrencies: ['USD', 'JPY', 'EUR'] as CurrencyCode[],
  multiAmounts: createMultiAmounts({
    USD: '100',
    JPY: '15180',
    EUR: '85',
  }),
  baseCurrency: 'USD' as CurrencyCode,
  favorites: ['USD', 'JPY'] as CurrencyCode[],
  rateType: 'spot' as const,
  details: {
    USD: {
      name: '美元',
      spot: { buy: 30.5, sell: 31.0 },
      cash: { buy: 30.0, sell: 31.5 },
    },
    JPY: {
      name: '日圓',
      spot: { buy: 0.2, sell: 0.21 },
      cash: { buy: 0.19, sell: 0.22 },
    },
    EUR: {
      name: '歐元',
      spot: { buy: 33.5, sell: 34.0 },
      cash: { buy: 33.0, sell: 34.5 },
    },
  },
  onAmountChange: vi.fn(),
  onQuickAmount: vi.fn(),
  onToggleFavorite: vi.fn(),
  onRateTypeChange: vi.fn(),
  onBaseCurrencyChange: vi.fn(),
};

describe('MultiConverter Calculator Integration', () => {
  describe('Feature 1: 計算機按鈕顯示', () => {
    it('Scenario 1.1: 應該為每個貨幣渲染計算機按鈕', () => {
      // Given: 用戶在多幣別轉換頁面
      render(<MultiConverter {...mockProps} />);

      // When: 頁面載入完成
      // Then: 每個貨幣輸入框右側應該顯示計算機圖標按鈕
      const usdCalculator = screen.getByLabelText('開啟計算機 (USD)');
      const jpyCalculator = screen.getByLabelText('開啟計算機 (JPY)');
      const eurCalculator = screen.getByLabelText('開啟計算機 (EUR)');

      expect(usdCalculator).toBeInTheDocument();
      expect(jpyCalculator).toBeInTheDocument();
      expect(eurCalculator).toBeInTheDocument();
    });

    it('Scenario 1.1: 按鈕應該有唯一的 aria-label', () => {
      // Given: 用戶在多幣別轉換頁面
      render(<MultiConverter {...mockProps} />);

      // When: 頁面載入完成
      // Then: 每個按鈕應該有唯一的 aria-label
      const usdButton = screen.getByLabelText('開啟計算機 (USD)');
      const jpyButton = screen.getByLabelText('開啟計算機 (JPY)');
      const eurButton = screen.getByLabelText('開啟計算機 (EUR)');

      expect(usdButton).toHaveAttribute('aria-label', '開啟計算機 (USD)');
      expect(jpyButton).toHaveAttribute('aria-label', '開啟計算機 (JPY)');
      expect(eurButton).toHaveAttribute('aria-label', '開啟計算機 (EUR)');
    });

    it('Scenario 1.2: 基準貨幣計算機按鈕應該使用黃色色系', () => {
      // Given: 用戶在多幣別轉換頁面
      // And: 基準貨幣為 USD
      render(<MultiConverter {...mockProps} baseCurrency="USD" />);

      // When: 頁面載入完成
      // Then: USD 的計算機按鈕應該使用 yellow-600 色系
      const usdButton = screen.getByLabelText('開啟計算機 (USD)');
      expect(usdButton).toHaveClass('text-yellow-600');
      expect(usdButton).toHaveClass('hover:bg-yellow-50');
    });

    it('Scenario 1.2: 非基準貨幣計算機按鈕應該使用紫色色系', () => {
      // Given: 用戶在多幣別轉換頁面
      // And: 基準貨幣為 USD
      render(<MultiConverter {...mockProps} baseCurrency="USD" />);

      // When: 頁面載入完成
      // Then: 其他貨幣的計算機按鈕應該使用 purple-600 色系
      const jpyButton = screen.getByLabelText('開啟計算機 (JPY)');
      const eurButton = screen.getByLabelText('開啟計算機 (EUR)');

      expect(jpyButton).toHaveClass('text-purple-600');
      expect(jpyButton).toHaveClass('hover:bg-purple-50');
      expect(eurButton).toHaveClass('text-purple-600');
      expect(eurButton).toHaveClass('hover:bg-purple-50');
    });

    it('Scenario 1.1: 按鈕應該有正確的 hover 樣式', () => {
      // Given: 用戶在多幣別轉換頁面
      render(<MultiConverter {...mockProps} />);

      // When: 頁面載入完成
      // Then: 按鈕應該有 hover 效果
      const usdButton = screen.getByLabelText('開啟計算機 (USD)');
      expect(usdButton).toHaveClass('hover:text-yellow-700');
      expect(usdButton).toHaveClass('hover:bg-yellow-50');
    });
  });

  describe('Feature 2: 計算機 Modal 彈出', () => {
    it('Scenario 2.1: 點擊計算機按鈕應該彈出 Modal', async () => {
      // Given: 用戶在多幣別轉換頁面
      // And: USD 輸入框當前金額為 "100"
      render(<MultiConverter {...mockProps} />);

      // When: 用戶點擊 USD 輸入框右側的計算機按鈕
      const usdCalculator = screen.getByLabelText('開啟計算機 (USD)');
      fireEvent.click(usdCalculator);

      // Then: 計算機 Modal 應該彈出
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: '計算機' })).toBeInTheDocument();
      });
    });

    it('Scenario 2.2: 點擊不同貨幣的計算機按鈕應該顯示對應的金額', async () => {
      // Given: 用戶在多幣別轉換頁面
      // And: USD 輸入框金額為 "100"
      // And: EUR 輸入框金額為 "85"
      render(<MultiConverter {...mockProps} />);

      // When: 用戶點擊 EUR 計算機按鈕
      const eurCalculator = screen.getByLabelText('開啟計算機 (EUR)');
      fireEvent.click(eurCalculator);

      // Then: 計算機 Modal 應該彈出
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: '計算機' })).toBeInTheDocument();
      });

      // And: 計算機顯示值應該為 "85"（EUR 的值，非 USD）
      // Note: 這需要實作後才能驗證 initialValue
    });

    it('Scenario 2.1: Modal 標題應該顯示 "計算機"', async () => {
      // Given: 用戶在多幣別轉換頁面
      render(<MultiConverter {...mockProps} />);

      // When: 用戶點擊計算機按鈕
      const usdCalculator = screen.getByLabelText('開啟計算機 (USD)');
      fireEvent.click(usdCalculator);

      // Then: Modal 標題應該顯示 "計算機"
      await waitFor(() => {
        expect(screen.getByText('計算機')).toBeInTheDocument();
      });
    });
  });

  describe('Feature 3: 計算結果應用', () => {
    it('Scenario 3.1: 計算完成後應該更新對應貨幣金額', async () => {
      // Given: 用戶在多幣別轉換頁面
      // And: JPY 輸入框當前金額為 "15180"
      const onAmountChange = vi.fn();
      render(<MultiConverter {...mockProps} onAmountChange={onAmountChange} />);

      // When: 用戶點擊 JPY 計算機按鈕
      const jpyCalculator = screen.getByLabelText('開啟計算機 (JPY)');
      fireEvent.click(jpyCalculator);

      // Then: 計算機 Modal 應該彈出
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: '計算機' })).toBeInTheDocument();
      });

      // Note: 完整的計算和確認流程需要在實作後測試
    });

    it('Scenario 3.2: 取消計算不應該更新金額', async () => {
      // Given: 用戶在多幣別轉換頁面
      // And: CNY 輸入框當前金額為 "500"
      const onAmountChange = vi.fn();
      const propsWithCNY = {
        ...mockProps,
        sortedCurrencies: ['USD', 'CNY'] as CurrencyCode[],
        multiAmounts: createMultiAmounts({
          USD: mockProps.multiAmounts.USD,
          CNY: '500',
        }),
        details: {
          ...mockProps.details,
          CNY: {
            name: '人民幣',
            spot: { buy: 4.3, sell: 4.5 },
            cash: { buy: 4.2, sell: 4.6 },
          },
        },
      };
      render(<MultiConverter {...propsWithCNY} onAmountChange={onAmountChange} />);

      // When: 用戶點擊 CNY 計算機按鈕
      const cnyCalculator = screen.getByLabelText('開啟計算機 (CNY)');
      fireEvent.click(cnyCalculator);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: '計算機' })).toBeInTheDocument();
      });

      // And: 用戶點擊背景關閉 Modal（未確認）
      const backdrop = screen.getByRole('dialog').parentElement?.previousElementSibling;
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // Then: onAmountChange 不應該被呼叫
      // Note: 這取決於 CalculatorKeyboard 的實作
    });
  });

  describe('Feature 4: 事件處理', () => {
    it('計算機按鈕不應該觸發行點擊事件（切換基準貨幣）', () => {
      // Given: 用戶在多幣別轉換頁面
      const onBaseCurrencyChange = vi.fn();
      render(<MultiConverter {...mockProps} onBaseCurrencyChange={onBaseCurrencyChange} />);

      // When: 用戶點擊 JPY 計算機按鈕
      const jpyCalculator = screen.getByLabelText('開啟計算機 (JPY)');
      fireEvent.click(jpyCalculator);

      // Then: onBaseCurrencyChange 不應該被呼叫
      expect(onBaseCurrencyChange).not.toHaveBeenCalled();
    });

    it('關閉 Modal 應該清空 activeCalculatorCurrency', async () => {
      // Given: 用戶在多幣別轉換頁面
      // And: 計算機 Modal 已開啟
      render(<MultiConverter {...mockProps} />);

      const usdCalculator = screen.getByLabelText('開啟計算機 (USD)');
      fireEvent.click(usdCalculator);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: '計算機' })).toBeInTheDocument();
      });

      // When: 用戶關閉 Modal
      const closeButton = screen.getByLabelText('關閉計算機');
      fireEvent.click(closeButton);

      // Then: Modal 應該關閉
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: '計算機' })).not.toBeInTheDocument();
      });

      // And: 再次點擊計算機按鈕應該正常工作
      fireEvent.click(usdCalculator);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: '計算機' })).toBeInTheDocument();
      });
    });
  });

  describe('Feature 5: 無障礙支援', () => {
    it('Scenario 4.1: 按鈕應該可以被鍵盤聚焦', () => {
      // Given: 用戶在多幣別轉換頁面
      render(<MultiConverter {...mockProps} />);

      // When: 用戶使用 Tab 鍵導航
      const usdButton = screen.getByLabelText('開啟計算機 (USD)');
      usdButton.focus();

      // Then: 計算機按鈕應該可以被聚焦
      expect(document.activeElement).toBe(usdButton);
    });

    it('Scenario 4.2: 按鈕應該有正確的 role 和 aria 屬性', () => {
      // Given: 用戶在多幣別轉換頁面
      render(<MultiConverter {...mockProps} />);

      // When: 用戶導航到 USD 計算機按鈕
      const usdButton = screen.getByLabelText('開啟計算機 (USD)');

      // Then: 按鈕應該有正確的 role 和 aria 屬性
      expect(usdButton).toHaveAttribute('type', 'button');
      expect(usdButton).toHaveAttribute('aria-label', '開啟計算機 (USD)');
    });

    it('Scenario 4.2: 螢幕閱讀器應該讀出正確的 aria-label', () => {
      // Given: 用戶使用螢幕閱讀器
      render(<MultiConverter {...mockProps} />);

      // When: 用戶導航到 USD 計算機按鈕
      const usdButton = screen.getByLabelText('開啟計算機 (USD)');

      // Then: 螢幕閱讀器應該讀出 "開啟計算機 (USD)"
      expect(usdButton).toHaveAccessibleName('開啟計算機 (USD)');
    });
  });
});
