import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { CoinBadge } from './CoinBadge';
import { getCoinIcon } from '../lib/coinIcon';

vi.mock('../lib/coinIcon', () => ({
  getCoinIcon: vi.fn(),
}));

const getCoinIconMock = getCoinIcon as Mock;

describe('CoinBadge', () => {
  beforeEach(() => {
    getCoinIconMock.mockReset();
  });

  it('renders the vendored icon image when one exists', () => {
    getCoinIconMock.mockReturnValue('/assets/coins/btc.svg');
    render(<CoinBadge symbol="BTCUSDT" />);

    const image = screen.getByRole('img', { name: 'BTC' });
    expect(image).toHaveAttribute('src', '/assets/coins/btc.svg');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('draggable', 'false');
    expect(image).toHaveClass('rounded-full', 'size-8');
  });

  it('uses the md size class when requested', () => {
    getCoinIconMock.mockReturnValue('/assets/coins/eth.svg');
    render(<CoinBadge symbol="ETHUSDT" size="md" />);
    expect(screen.getByRole('img', { name: 'ETH' })).toHaveClass('size-9');
  });

  it('falls back to the letter badge when no icon exists', () => {
    getCoinIconMock.mockReturnValue(null);
    const { container } = render(<CoinBadge symbol="BTCUSDT" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const badge = container.querySelector('span[aria-hidden]');
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent('BTC');
  });
});
