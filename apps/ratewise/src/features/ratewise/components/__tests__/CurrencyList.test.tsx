/**
 * CurrencyList Component Tests
 *
 * 測試覆蓋:
 * 1. 基本渲染
 * 2. 貨幣列表顯示
 * 3. 收藏功能
 * 4. 匯率格式化
 *
 * 依據: [Context7:testing-library][LINUS_GUIDE.md:測試覆蓋率 ≥80%]
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurrencyList } from '../CurrencyList';
import type { CurrencyCode } from '../../types';

// Mock formatExchangeRate
vi.mock('../../../../utils/currencyFormatter', () => ({
  formatExchangeRate: (rate: number) => rate.toFixed(4),
}));

describe('CurrencyList Component', () => {
  const defaultProps = {
    favorites: ['USD', 'JPY'] as CurrencyCode[],
    exchangeRates: {
      TWD: 1,
      USD: 31.5,
      JPY: 0.21,
      EUR: 34.2,
      GBP: 40.1,
      AUD: 20.5,
      CAD: 23.1,
      CHF: 35.8,
      CNY: 4.35,
      HKD: 4.05,
      KRW: 0.024,
      MYR: 7.1,
      NZD: 19.2,
      PHP: 0.56,
      SGD: 23.5,
      THB: 0.92,
      VND: 0.00127,
      IDR: 0.002,
    } as Record<CurrencyCode, number | null>,
    onToggleFavorite: vi.fn(),
    onRefreshTrends: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<CurrencyList {...defaultProps} />);

    expect(screen.getByText('全部幣種')).toBeInTheDocument();
  });

  it('renders currency list region with correct aria-label', () => {
    render(<CurrencyList {...defaultProps} />);

    const listRegion = screen.getByRole('region', { name: '貨幣列表' });
    expect(listRegion).toBeInTheDocument();
  });

  it('renders all currency codes', () => {
    render(<CurrencyList {...defaultProps} />);

    // 檢查一些主要貨幣是否顯示
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('JPY')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('GBP')).toBeInTheDocument();
  });

  it('displays currency names', () => {
    render(<CurrencyList {...defaultProps} />);

    // 檢查貨幣名稱是否顯示
    expect(screen.getByText('美元')).toBeInTheDocument();
    expect(screen.getByText('日圓')).toBeInTheDocument();
    expect(screen.getByText('歐元')).toBeInTheDocument();
  });

  it('displays exchange rates formatted correctly', () => {
    render(<CurrencyList {...defaultProps} />);

    // 檢查匯率是否正確格式化 (使用 mock 的 toFixed(4))
    expect(screen.getByText('31.5000')).toBeInTheDocument();
    expect(screen.getByText('0.2100')).toBeInTheDocument();
  });

  it('calls onToggleFavorite when currency row is clicked', () => {
    render(<CurrencyList {...defaultProps} />);

    // 點擊 EUR 行
    const eurRow = screen.getByText('EUR').closest('div[class*="group"]');
    if (eurRow) {
      fireEvent.click(eurRow);
    }

    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('EUR');
  });

  it('shows filled star for favorite currencies', () => {
    render(<CurrencyList {...defaultProps} />);

    // USD 和 JPY 是收藏的，應該有 text-favorite class
    const stars = document.querySelectorAll('.text-favorite');
    expect(stars.length).toBeGreaterThan(0);
  });

  it('shows empty star for non-favorite currencies', () => {
    render(<CurrencyList {...defaultProps} />);

    // 非收藏貨幣的星星應該有 text-text-muted/30 class (SSOT design token)
    const emptyStars = document.querySelectorAll('[class*="text-text-muted"]');
    expect(emptyStars.length).toBeGreaterThan(0);
  });

  it('handles null exchange rate gracefully', () => {
    const propsWithNullRate = {
      ...defaultProps,
      exchangeRates: {
        ...defaultProps.exchangeRates,
        USD: null,
      } as Record<CurrencyCode, number | null>,
    };

    render(<CurrencyList {...propsWithNullRate} />);

    // 應該顯示 0.0000 (因為 ?? 0)
    // 使用 getAllByText 因為可能有多個 0.0000
    const zeroRates = screen.getAllByText('0.0000');
    expect(zeroRates.length).toBeGreaterThan(0);
  });

  it('renders currency flags', () => {
    render(<CurrencyList {...defaultProps} />);

    // 檢查是否有 emoji 旗幟 (USD 🇺🇸, JPY 🇯🇵)
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('🇯🇵')).toBeInTheDocument();
  });

  it('has scrollable container for currency list', () => {
    render(<CurrencyList {...defaultProps} />);

    const listRegion = screen.getByRole('region', { name: '貨幣列表' });
    expect(listRegion).toHaveClass('overflow-y-auto');
    expect(listRegion).toHaveClass('max-h-96');
  });

  it('applies hover styles on currency row', () => {
    render(<CurrencyList {...defaultProps} />);

    const currencyRow = screen.getByText('USD').closest('div[class*="group"]');
    // 使用 SSOT design token: hover:bg-primary/5
    expect(currencyRow).toHaveClass('hover:bg-primary/5');
  });
});

describe('CurrencyList Accessibility', () => {
  const defaultProps = {
    favorites: [] as CurrencyCode[],
    exchangeRates: {
      TWD: 1,
      USD: 31.5,
      JPY: 0.21,
      EUR: 34.2,
      GBP: 40.1,
      AUD: 20.5,
      CAD: 23.1,
      CHF: 35.8,
      CNY: 4.35,
      HKD: 4.05,
      KRW: 0.024,
      MYR: 7.1,
      NZD: 19.2,
      PHP: 0.56,
      SGD: 23.5,
      THB: 0.92,
      VND: 0.00127,
      IDR: 0.002,
    } as Record<CurrencyCode, number | null>,
    onToggleFavorite: vi.fn(),
  };

  it('currency list region is focusable', () => {
    render(<CurrencyList {...defaultProps} />);

    const listRegion = screen.getByRole('region', { name: '貨幣列表' });
    expect(listRegion).toHaveAttribute('tabIndex', '0');
  });
});
