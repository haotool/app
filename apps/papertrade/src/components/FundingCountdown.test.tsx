import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FundingCountdown } from './FundingCountdown';

const BASE_NOW = 1_800_000_000_000;

describe('FundingCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a placeholder when nextFundingTime is missing', () => {
    render(<FundingCountdown nextFundingTime={undefined} />);
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });

  it('renders the remaining time and ticks down every second', () => {
    render(<FundingCountdown nextFundingTime={BASE_NOW + 65_000} />);
    expect(screen.getByText('01:05')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByText('01:04')).toBeInTheDocument();
  });

  it('clamps at 00:00 after crossing the settlement moment', () => {
    render(<FundingCountdown nextFundingTime={BASE_NOW + 1_000} />);

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('restarts the countdown when a new funding time arrives after rollover', () => {
    const { rerender } = render(<FundingCountdown nextFundingTime={BASE_NOW + 1_000} />);
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByText('00:00')).toBeInTheDocument();

    rerender(<FundingCountdown nextFundingTime={BASE_NOW + 2_000 + 8 * 3_600_000} />);
    expect(screen.getByText('8:00:00')).toBeInTheDocument();
  });

  it('updates itself without re-rendering the parent node', () => {
    const parentRenderSpy = vi.fn();
    function Parent() {
      parentRenderSpy();
      return <FundingCountdown nextFundingTime={BASE_NOW + 120_000} />;
    }
    render(<Parent />);
    const rendersBefore = parentRenderSpy.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText('01:55')).toBeInTheDocument();
    expect(parentRenderSpy.mock.calls.length).toBe(rendersBefore);
  });
});
