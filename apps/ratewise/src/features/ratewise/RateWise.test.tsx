import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import RateWise from './RateWise';

// Test helper: wrap component with required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(<HelmetProvider>{component}</HelmetProvider>);
};

// Mock lightweight-charts
// Based on TradingView's official testing strategy: E2E tests for canvas rendering
// Unit tests only verify component logic without actual chart rendering
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

const mockRatesResponse = {
  timestamp: '2025-10-18T00:00:00.000Z',
  updateTime: '2025/10/18 08:00:00',
  source: 'Taiwan Bank',
  sourceUrl: 'https://rate.bot.com.tw/xrt',
  base: 'TWD',
  rates: {
    TWD: 1,
    USD: 0.031,
    JPY: 4.6,
    EUR: 0.029,
  },
  details: {},
};

describe('RateWise Component', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRatesResponse),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Basic Rendering', () => {
    it('renders main headline', () => {
      renderWithProviders(<RateWise />);
      // Use getByRole for heading to avoid duplicate text matches
      expect(screen.getByRole('heading', { name: '匯率好工具' })).toBeInTheDocument();
    });

    it('renders in single mode by default', () => {
      renderWithProviders(<RateWise />);
      expect(screen.getByText('單幣別')).toBeInTheDocument();
      expect(screen.getByText('多幣別')).toBeInTheDocument();
    });

    // Note: Quick amount buttons are tested in "Currency Conversion > updates amount when quick button is clicked"
    // and "User Interactions > allows switching between quick amounts multiple times".
    // Removed fragile "shows default quick amount buttons" test that was timing out due to async data loading.
  });

  describe('Currency Conversion', () => {
    it('displays default amount in input field', () => {
      renderWithProviders(<RateWise />);
      const inputs = screen.getAllByPlaceholderText('0.00');
      expect(inputs[0]).toHaveValue(1000);
    });

    it('updates amount when quick button is clicked', async () => {
      renderWithProviders(<RateWise />);

      const quickButton = screen.getByText('5,000');
      fireEvent.click(quickButton);

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs[0]).toHaveValue(5000);
      });
    });

    it('handles manual amount input', async () => {
      renderWithProviders(<RateWise />);

      const inputs = screen.getAllByPlaceholderText('0.00');
      const fromInput = inputs[0]!;

      fireEvent.change(fromInput, { target: { value: '12345' } });

      await waitFor(() => {
        expect(fromInput).toHaveValue(12345);
      });
    });

    it('handles empty input gracefully', async () => {
      renderWithProviders(<RateWise />);

      const inputs = screen.getAllByPlaceholderText('0.00');
      const fromInput = inputs[0]!;

      fireEvent.change(fromInput, { target: { value: '' } });

      await waitFor(() => {
        expect(fromInput).toHaveValue(null);
      });
    });
  });

  describe('Mode Switching', () => {
    it('switches from single to multi mode', async () => {
      renderWithProviders(<RateWise />);

      const multiButton = screen.getByText('多幣別');
      fireEvent.click(multiButton);

      await waitFor(() => {
        // In multi mode, mode preference should be saved to localStorage
        expect(localStorage.getItem('currencyConverterMode')).toBe('multi');
      });
    });

    it('switches from multi to single mode', async () => {
      renderWithProviders(<RateWise />);

      // Switch to multi first
      const multiButton = screen.getByText('多幣別');
      fireEvent.click(multiButton);

      await waitFor(() => {
        expect(localStorage.getItem('currencyConverterMode')).toBe('multi');
      });

      // Switch back to single
      const singleButton = screen.getByText('單幣別');
      fireEvent.click(singleButton);

      await waitFor(() => {
        expect(localStorage.getItem('currencyConverterMode')).toBe('single');
      });
    });
  });

  describe('LocalStorage Persistence', () => {
    it('persists mode preference to localStorage', async () => {
      renderWithProviders(<RateWise />);

      const multiButton = screen.getByText('多幣別');
      fireEvent.click(multiButton);

      await waitFor(() => {
        expect(localStorage.getItem('currencyConverterMode')).toBe('multi');
      });
    });

    it('loads mode from localStorage on mount', () => {
      localStorage.setItem('currencyConverterMode', 'multi');
      renderWithProviders(<RateWise />);

      // Component should initialize with multi mode
      expect(screen.getByText('多幣別')).toBeInTheDocument();
    });

    it('persists favorite currencies to localStorage', async () => {
      renderWithProviders(<RateWise />);

      // Initial favorites should be saved
      await waitFor(() => {
        const favorites = localStorage.getItem('favorites');
        expect(favorites).toBeTruthy();
        const parsed = JSON.parse(favorites ?? '[]');
        expect(Array.isArray(parsed)).toBe(true);
      });
    });

    it('persists from currency selection', async () => {
      renderWithProviders(<RateWise />);

      const selects = screen.getAllByRole('combobox');
      const fromSelect = selects[0]!;

      fireEvent.change(fromSelect, { target: { value: 'USD' } });

      await waitFor(() => {
        expect(localStorage.getItem('fromCurrency')).toBe('USD');
      });
    });

    it('persists to currency selection', async () => {
      renderWithProviders(<RateWise />);

      const selects = screen.getAllByRole('combobox');
      const toSelect = selects[1]!;

      fireEvent.change(toSelect, { target: { value: 'JPY' } });

      await waitFor(() => {
        expect(localStorage.getItem('toCurrency')).toBe('JPY');
      });
    });
  });

  describe('Currency Selection', () => {
    it('allows changing from currency', async () => {
      renderWithProviders(<RateWise />);

      const selects = screen.getAllByRole('combobox');
      const fromSelect = selects[0]!;

      fireEvent.change(fromSelect, { target: { value: 'USD' } });

      await waitFor(() => {
        expect(fromSelect).toHaveValue('USD');
      });
    });

    it('allows changing to currency', async () => {
      renderWithProviders(<RateWise />);

      const selects = screen.getAllByRole('combobox');
      const toSelect = selects[1]!;

      fireEvent.change(toSelect, { target: { value: 'EUR' } });

      await waitFor(() => {
        expect(toSelect).toHaveValue('EUR');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles invalid currency code gracefully', () => {
      localStorage.setItem('fromCurrency', 'INVALID');
      localStorage.setItem('toCurrency', 'NOTREAL');

      // Should not crash and should fallback to defaults
      expect(() => renderWithProviders(<RateWise />)).not.toThrow();
    });

    it('handles corrupted localStorage data', () => {
      localStorage.setItem('favorites', 'invalid json data');

      // Should not crash and should use default favorites
      expect(() => renderWithProviders(<RateWise />)).not.toThrow();
    });

    it('handles zero amount input', async () => {
      renderWithProviders(<RateWise />);

      const inputs = screen.getAllByPlaceholderText('0.00');
      fireEvent.change(inputs[0]!, { target: { value: '0' } });

      await waitFor(() => {
        expect(inputs[0]).toHaveValue(0);
      });
    });
  });

  describe('User Interactions', () => {
    it('updates conversion result when amount changes', async () => {
      renderWithProviders(<RateWise />);

      const inputs = screen.getAllByPlaceholderText('0.00');
      const fromInput = inputs[0] as HTMLInputElement;
      const toInput = inputs[1] as HTMLInputElement;

      // Start with some amount
      fireEvent.change(fromInput, { target: { value: '1000' } });

      await waitFor(() => {
        // The to amount should be calculated and not empty
        expect(toInput.value).not.toBe('');
      });
    });

    it('allows switching between quick amounts multiple times', async () => {
      renderWithProviders(<RateWise />);

      // Wait for buttons to appear - findAllByRole throws if not found
      const buttons1000 = await screen.findAllByRole('button', { name: '1,000' });
      const buttons5000 = await screen.findAllByRole('button', { name: '5,000' });
      const buttons100 = await screen.findAllByRole('button', { name: '100' });

      // Verify buttons exist before clicking
      expect(buttons1000.length).toBeGreaterThan(0);
      expect(buttons5000.length).toBeGreaterThan(0);
      expect(buttons100.length).toBeGreaterThan(0);

      // Click 1,000
      fireEvent.click(buttons1000[0]!);
      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs[0]).toHaveValue(1000);
      });

      // Click 5,000
      fireEvent.click(buttons5000[0]!);
      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs[0]).toHaveValue(5000);
      });

      // Click 100
      fireEvent.click(buttons100[0]!);
      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs[0]).toHaveValue(100);
      });
    });
  });

  describe('History Tracking', () => {
    it('renders conversion history after adding an entry', async () => {
      renderWithProviders(<RateWise />);

      const addButton = screen.getByText('加入歷史記錄');
      const inputs = screen.getAllByPlaceholderText('0.00') as HTMLInputElement[];
      const toInput = inputs[1]!;

      await waitFor(() => {
        expect(toInput.value).not.toBe('');
      });

      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('轉換歷史')).toBeInTheDocument();
      });

      expect(screen.getAllByText(/TWD/).length).toBeGreaterThan(0);
    });
  });

  describe('Multi Mode Interactions', () => {
    it('updates multi-currency amounts when quick button is used', async () => {
      renderWithProviders(<RateWise />);

      fireEvent.click(screen.getByText('多幣別'));

      await waitFor(() => {
        expect(localStorage.getItem('currencyConverterMode')).toBe('multi');
      });

      await waitFor(() => {
        expect(screen.getByText('即時多幣別換算')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('5,000'));

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        // After formatting is applied, the value will be "5,000.00"
        expect(inputs[0]).toHaveValue('5,000.00');
      });

      const allInputs = screen.getAllByPlaceholderText('0.00') as HTMLInputElement[];

      // Focus, change, and blur to trigger formatting
      fireEvent.focus(allInputs[1]!);
      fireEvent.change(allInputs[1]!, { target: { value: '123' } });
      fireEvent.blur(allInputs[1]!);

      await waitFor(() => {
        // After formatting is applied, the value will be "123.00"
        expect(allInputs[1]).toHaveValue('123.00');
      });
    });

    it('allows toggling favorite currencies', async () => {
      renderWithProviders(<RateWise />);

      fireEvent.click(screen.getByText('多幣別'));

      await waitFor(() => {
        expect(screen.getByText('即時多幣別換算')).toBeInTheDocument();
      });

      const toggleButton = await screen.findByRole('button', { name: '加入常用貨幣 EUR' });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-label', '移除常用貨幣 EUR');
      });
    });

    it('allows changing amount in multi-currency mode to switch base currency', async () => {
      renderWithProviders(<RateWise />);

      fireEvent.click(screen.getByText('多幣別'));

      await waitFor(() => {
        expect(screen.getByText('即時多幣別換算')).toBeInTheDocument();
      });

      // Get all currency inputs
      const inputs = screen.getAllByPlaceholderText('0.00') as HTMLInputElement[];

      // Change to a non-base currency input to switch base currency
      // This simulates editing a currency amount, which changes it to the new base currency

      // First focus on the input to enter editing mode
      fireEvent.focus(inputs[1]!);

      // Then change the value
      fireEvent.change(inputs[1]!, { target: { value: '100' } });

      // Blur to apply formatting
      fireEvent.blur(inputs[1]!);

      await waitFor(() => {
        // After formatting is applied, the value will be "100.00"
        expect(inputs[1]).toHaveValue('100.00');
      });
    });
  });

  describe('Swap Control', () => {
    it('swaps selected currencies when swap button is clicked', async () => {
      renderWithProviders(<RateWise />);

      const [fromSelect, toSelect] = screen.getAllByRole('combobox') as HTMLSelectElement[];
      expect(fromSelect).toHaveValue('TWD');
      expect(toSelect).toHaveValue('USD');

      const swapButton = screen.getByRole('button', { name: '交換幣別' });
      fireEvent.click(swapButton);

      await waitFor(() => {
        const [updatedFrom, updatedTo] = screen.getAllByRole('combobox') as HTMLSelectElement[];
        expect(updatedFrom).toHaveValue('USD');
        expect(updatedTo).toHaveValue('TWD');
      });
    });
  });
});
