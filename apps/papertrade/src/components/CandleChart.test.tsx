import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { CandleChart } from './CandleChart';
import { createChart } from 'lightweight-charts';
import { type Kline } from '../services/kline';

interface SeriesStub {
  setData: Mock;
  update: Mock;
  priceScale: Mock;
}

function makeSeriesStub(): SeriesStub {
  return {
    setData: vi.fn(),
    update: vi.fn(),
    priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
  };
}

const chartStub = {
  addSeries: vi.fn(),
  timeScale: vi.fn(() => ({ scrollToRealTime: vi.fn() })),
  remove: vi.fn(),
};

vi.mock('lightweight-charts', () => ({
  CandlestickSeries: Symbol('CandlestickSeries'),
  HistogramSeries: Symbol('HistogramSeries'),
  createChart: vi.fn(() => chartStub),
}));

const createChartMock = createChart as unknown as Mock;

function bar(time: number, close = 100): Kline {
  return { time, open: 99, high: 101, low: 98, close, volume: 10 };
}

describe('CandleChart', () => {
  let candleSeries: SeriesStub;
  let volumeSeries: SeriesStub;

  beforeEach(() => {
    candleSeries = makeSeriesStub();
    volumeSeries = makeSeriesStub();
    chartStub.addSeries.mockReset();
    chartStub.addSeries.mockReturnValueOnce(candleSeries).mockReturnValueOnce(volumeSeries);
    chartStub.remove.mockReset();
    createChartMock.mockClear();
  });

  it('creates chart with candlestick and volume series on mount', () => {
    render(<CandleChart bars={[]} seriesKey="BTCUSDT:60" />);
    expect(createChartMock).toHaveBeenCalledTimes(1);
    expect(chartStub.addSeries).toHaveBeenCalledTimes(2);
  });

  it('sets full data on first render', () => {
    render(<CandleChart bars={[bar(60), bar(120)]} seriesKey="BTCUSDT:60" />);
    expect(candleSeries.setData).toHaveBeenCalledTimes(1);
    expect(volumeSeries.setData).toHaveBeenCalledTimes(1);
    expect(candleSeries.setData.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('updates only the last bar for incremental ticks', () => {
    const { rerender } = render(<CandleChart bars={[bar(60), bar(120)]} seriesKey="BTCUSDT:60" />);
    candleSeries.setData.mockClear();
    volumeSeries.setData.mockClear();

    rerender(<CandleChart bars={[bar(60), bar(120, 108)]} seriesKey="BTCUSDT:60" />);
    expect(candleSeries.setData).not.toHaveBeenCalled();
    expect(candleSeries.update).toHaveBeenCalledWith(
      expect.objectContaining({ time: 120, close: 108 }),
    );
    expect(volumeSeries.update).toHaveBeenCalledTimes(1);

    rerender(<CandleChart bars={[bar(60), bar(120, 108), bar(180)]} seriesKey="BTCUSDT:60" />);
    expect(candleSeries.setData).not.toHaveBeenCalled();
    expect(candleSeries.update).toHaveBeenLastCalledWith(expect.objectContaining({ time: 180 }));
  });

  it('resets data when the series key changes', () => {
    const { rerender } = render(<CandleChart bars={[bar(60), bar(120)]} seriesKey="BTCUSDT:60" />);
    candleSeries.setData.mockClear();

    rerender(<CandleChart bars={[bar(300)]} seriesKey="BTCUSDT:5" />);
    expect(candleSeries.setData).toHaveBeenCalledTimes(1);
    expect(candleSeries.setData.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('removes the chart on unmount', () => {
    const { unmount } = render(<CandleChart bars={[]} seriesKey="BTCUSDT:60" />);
    unmount();
    expect(chartStub.remove).toHaveBeenCalledTimes(1);
  });
});
