import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionBanner } from './ConnectionBanner';
import { useMarketStore } from '../stores/marketStore';

describe('ConnectionBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMarketStore.setState({ tickers: {}, wsStatus: 'connected' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing while connected', () => {
    render(<ConnectionBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stays silent when the connection recovers within the 2.5s grace window', () => {
    render(<ConnectionBanner />);
    act(() => {
      useMarketStore.getState().setWsStatus('reconnecting');
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      useMarketStore.getState().setWsStatus('connected');
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the reconnecting pill only after the outage lasts beyond 2.5s', () => {
    render(<ConnectionBanner />);
    act(() => {
      useMarketStore.getState().setWsStatus('reconnecting');
    });
    act(() => {
      vi.advanceTimersByTime(2499);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('status')).toHaveTextContent('連線中斷，自動重連中');
  });

  it('shows the recovered pill for 1.5s after reconnect and then hides', () => {
    render(<ConnectionBanner />);
    act(() => {
      useMarketStore.getState().setWsStatus('reconnecting');
    });
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByRole('status')).toHaveTextContent('連線中斷，自動重連中');

    act(() => {
      useMarketStore.getState().setWsStatus('connected');
    });
    expect(screen.getByRole('status')).toHaveTextContent('已恢復連線');

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
