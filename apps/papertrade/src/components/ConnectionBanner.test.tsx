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

  it('shows reconnecting banner when connection drops', () => {
    render(<ConnectionBanner />);
    act(() => {
      useMarketStore.getState().setWsStatus('reconnecting');
    });
    expect(screen.getByRole('status')).toHaveTextContent('連線中斷，重連中…');
  });

  it('shows recovered banner for two seconds after reconnect', () => {
    render(<ConnectionBanner />);
    act(() => {
      useMarketStore.getState().setWsStatus('reconnecting');
    });
    act(() => {
      useMarketStore.getState().setWsStatus('connected');
    });
    expect(screen.getByRole('status')).toHaveTextContent('已重新連線');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
