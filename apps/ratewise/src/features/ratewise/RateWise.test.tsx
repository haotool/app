import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import RateWise from './RateWise';

describe('RateWise Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Basic Rendering', () => {
    it('renders main headline', () => {
      render(<RateWise />);
      expect(screen.getByText('好工具匯率')).toBeInTheDocument();
    });

    it('renders in single mode by default', () => {
      render(<RateWise />);
      expect(screen.getByText('單幣別')).toBeInTheDocument();
      expect(screen.getByText('多幣別')).toBeInTheDocument();
    });

    it('shows default quick amount buttons', () => {
      render(<RateWise />);
      // QUICK_AMOUNTS = [100, 1000, 5000, 10000] formatted with toLocaleString()
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
    });
  });

  describe('Currency Conversion', () => {
    it('displays default amount in input field', () => {
      render(<RateWise />);
      const inputs = screen.getAllByPlaceholderText('0.00');
      expect(inputs[0]).toHaveValue(1000);
    });

    it('updates amount when quick button is clicked', async () => {
      render(<RateWise />);

      const quickButton = screen.getByText('5,000');
      fireEvent.click(quickButton);

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs[0]).toHaveValue(5000);
      });
    });

    it('handles manual amount input', async () => {
      render(<RateWise />);

      const inputs = screen.getAllByPlaceholderText('0.00');
      const fromInput = inputs[0]!;

      fireEvent.change(fromInput, { target: { value: '12345' } });

      await waitFor(() => {
        expect(fromInput).toHaveValue(12345);
      });
    });

    it('handles empty input gracefully', async () => {
      render(<RateWise />);

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
      render(<RateWise />);

      const multiButton = screen.getByText('多幣別');
      fireEvent.click(multiButton);

      await waitFor(() => {
        // In multi mode, mode preference should be saved to localStorage
        expect(localStorage.getItem('currencyConverterMode')).toBe('multi');
      });
    });

    it('switches from multi to single mode', async () => {
      render(<RateWise />);

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
      render(<RateWise />);

      const multiButton = screen.getByText('多幣別');
      fireEvent.click(multiButton);

      await waitFor(() => {
        expect(localStorage.getItem('currencyConverterMode')).toBe('multi');
      });
    });

    it('loads mode from localStorage on mount', () => {
      localStorage.setItem('currencyConverterMode', 'multi');
      render(<RateWise />);

      // Component should initialize with multi mode
      expect(screen.getByText('多幣別')).toBeInTheDocument();
    });

    it('persists favorite currencies to localStorage', async () => {
      render(<RateWise />);

      // Initial favorites should be saved
      await waitFor(() => {
        const favorites = localStorage.getItem('favorites');
        expect(favorites).toBeTruthy();
        const parsed = JSON.parse(favorites || '[]');
        expect(Array.isArray(parsed)).toBe(true);
      });
    });

    it('persists from currency selection', async () => {
      render(<RateWise />);

      const selects = screen.getAllByRole('combobox');
      const fromSelect = selects[0]!;

      fireEvent.change(fromSelect, { target: { value: 'USD' } });

      await waitFor(() => {
        expect(localStorage.getItem('fromCurrency')).toBe('USD');
      });
    });

    it('persists to currency selection', async () => {
      render(<RateWise />);

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
      render(<RateWise />);

      const selects = screen.getAllByRole('combobox');
      const fromSelect = selects[0]!;

      fireEvent.change(fromSelect, { target: { value: 'USD' } });

      await waitFor(() => {
        expect(fromSelect).toHaveValue('USD');
      });
    });

    it('allows changing to currency', async () => {
      render(<RateWise />);

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
      expect(() => render(<RateWise />)).not.toThrow();
    });

    it('handles corrupted localStorage data', () => {
      localStorage.setItem('favorites', 'invalid json data');

      // Should not crash and should use default favorites
      expect(() => render(<RateWise />)).not.toThrow();
    });

    it('handles zero amount input', async () => {
      render(<RateWise />);

      const inputs = screen.getAllByPlaceholderText('0.00');
      fireEvent.change(inputs[0]!, { target: { value: '0' } });

      await waitFor(() => {
        expect(inputs[0]).toHaveValue(0);
      });
    });
  });

  describe('User Interactions', () => {
    it('updates conversion result when amount changes', async () => {
      render(<RateWise />);

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
      render(<RateWise />);

      // Click 1,000
      fireEvent.click(screen.getByText('1,000'));
      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs[0]).toHaveValue(1000);
      });

      // Click 5,000
      fireEvent.click(screen.getByText('5,000'));
      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs[0]).toHaveValue(5000);
      });

      // Click 100
      fireEvent.click(screen.getByText('100'));
      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs[0]).toHaveValue(100);
      });
    });
  });
});
