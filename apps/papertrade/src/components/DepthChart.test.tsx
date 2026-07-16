import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DepthChart } from './DepthChart';
import { DEPTH_REDRAW_INTERVAL_MS } from '../config/market';

const { subscribeMock } = vi.hoisted(() => ({ subscribeMock: vi.fn() }));

vi.mock('../services/marketWs', () => ({
  marketWs: {
    subscribe: subscribeMock,
    onStatus: vi.fn(() => vi.fn()),
    getStatus: vi.fn(() => 'connected'),
  },
}));

type Handler = (message: unknown) => void;
const handlers: Handler[] = [];

function snapshot(u: number, mid = 100) {
  return {
    type: 'snapshot',
    data: {
      s: 'BTCUSDT',
      b: [
        [String(mid - 1), '1'],
        [String(mid - 2), '2'],
      ],
      a: [
        [String(mid + 1), '2'],
        [String(mid + 2), '4'],
      ],
      u,
    },
  };
}

function mockRect(element: HTMLElement) {
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }) as DOMRect;
}

function flushSample() {
  act(() => {
    vi.advanceTimersByTime(DEPTH_REDRAW_INTERVAL_MS);
  });
}

describe('DepthChart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    handlers.length = 0;
    subscribeMock.mockReset();
    subscribeMock.mockImplementation((_topic: string, handler: Handler) => {
      handlers.push(handler);
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a skeleton until the first sampled book arrives', () => {
    render(<DepthChart symbol="BTCUSDT" />);
    expect(screen.getByLabelText('深度圖載入中')).toBeInTheDocument();

    act(() => handlers[0]?.(snapshot(100)));
    expect(screen.getByLabelText('深度圖載入中')).toBeInTheDocument();

    flushSample();
    expect(screen.queryByLabelText('深度圖載入中')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '市場深度圖' })).toBeInTheDocument();
  });

  it('renders both depth areas and the mid price marker', () => {
    render(<DepthChart symbol="BTCUSDT" />);
    act(() => handlers[0]?.(snapshot(100)));
    flushSample();

    expect(screen.getByTestId('depth-bid-area')).toBeInTheDocument();
    expect(screen.getByTestId('depth-ask-area')).toBeInTheDocument();
    expect(screen.getByText('100.00')).toBeInTheDocument();
  });

  it('throttles redraws to the sampling interval', () => {
    render(<DepthChart symbol="BTCUSDT" />);
    act(() => handlers[0]?.(snapshot(100, 100)));
    flushSample();
    expect(screen.getByText('100.00')).toBeInTheDocument();

    act(() => handlers[0]?.(snapshot(101, 200)));
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.queryByText('200.00')).not.toBeInTheDocument();

    flushSample();
    expect(screen.getByText('200.00')).toBeInTheDocument();
  });

  it('shows the tapped level price and cumulative size', () => {
    render(<DepthChart symbol="BTCUSDT" />);
    act(() => handlers[0]?.(snapshot(100)));
    flushSample();

    const surface = screen.getByTestId('depth-chart');
    mockRect(surface);
    fireEvent.click(surface, { clientX: 0 });

    expect(screen.getByText(/買 98\.000/)).toBeInTheDocument();
    expect(screen.getByText(/累計 3/)).toBeInTheDocument();

    fireEvent.click(surface, { clientX: 200 });
    expect(screen.getByText(/賣 102\.00/)).toBeInTheDocument();
    expect(screen.getByText(/累計 6/)).toBeInTheDocument();
  });

  it('keeps the hint when tapping inside the spread', () => {
    render(<DepthChart symbol="BTCUSDT" />);
    act(() => handlers[0]?.(snapshot(100)));
    flushSample();

    const surface = screen.getByTestId('depth-chart');
    mockRect(surface);
    fireEvent.click(surface, { clientX: 100 });

    expect(screen.getByText('點按或以方向鍵探索檔位累計量')).toBeInTheDocument();
  });

  it('steps the probe with arrow keys and clears it with Escape', () => {
    render(<DepthChart symbol="BTCUSDT" />);
    act(() => handlers[0]?.(snapshot(100)));
    flushSample();

    const surface = screen.getByRole('button', { name: '探索市場深度檔位' });

    // 域 [98,102]，自中間價 100 起步進 2%（0.08）：右移入賣側首檔 101。
    for (let index = 0; index < 13; index += 1) {
      fireEvent.keyDown(surface, { key: 'ArrowRight' });
    }
    expect(screen.getByText(/賣 101\.00/)).toBeInTheDocument();

    fireEvent.keyDown(surface, { key: 'Escape' });
    expect(screen.getByText('點按或以方向鍵探索檔位累計量')).toBeInTheDocument();
  });
});
