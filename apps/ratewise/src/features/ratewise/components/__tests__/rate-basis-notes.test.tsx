import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FavoritesList } from '../FavoritesList';
import { CurrencyList } from '../CurrencyList';
import type { CurrencyCode } from '../../types';

const exchangeRates = {
  TWD: 1,
  USD: 31.9,
  JPY: 0.2007,
} as Record<CurrencyCode, number | null>;

describe('清單計價基準標示(金融透明度)', () => {
  it('FavoritesList 顯示臺銀賣出價說明與 TWD 單位', () => {
    render(<FavoritesList favorites={['JPY', 'USD']} exchangeRates={exchangeRates} />);
    expect(screen.getByTestId('favorites-basis-note')).toHaveTextContent('臺銀賣出價');
    expect(screen.getAllByText('TWD').length).toBeGreaterThan(0);
  });

  it('CurrencyList 顯示臺銀賣出價說明', () => {
    render(
      <CurrencyList favorites={[]} exchangeRates={exchangeRates} onToggleFavorite={vi.fn()} />,
    );
    expect(screen.getByTestId('currency-list-basis-note')).toHaveTextContent('臺銀賣出價');
  });
});
