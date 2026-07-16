import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { CandleChart } from './CandleChart';
import { createChart, LineSeries } from 'lightweight-charts';
import { type Kline } from '../services/kline';
import { computeSma } from '../lib/indicators';
import { formatPrice } from '../lib/format';

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
  removeSeries: vi.fn(),
  timeScale: vi.fn(() => ({ scrollToRealTime: vi.fn() })),
  remove: vi.fn(),
};

vi.mock('lightweight-charts', () => ({
  CandlestickSeries: Symbol('CandlestickSeries'),
  HistogramSeries: Symbol('HistogramSeries'),
  LineSeries: Symbol('LineSeries'),
  createChart: vi.fn(() => chartStub),
}));

const createChartMock = createChart as unknown as Mock;

function bar(time: number, close = 100): Kline {
  return { time, open: 99, high: 101, low: 98, close, volume: 10 };
}

const eightBars = Array.from({ length: 8 }, (_, index) => bar((index + 1) * 60, 100 + index));

describe('CandleChart', () => {
  let candleSeries: SeriesStub;
  let volumeSeries: SeriesStub;
  let lineSeries: SeriesStub[];

  beforeEach(() => {
    candleSeries = makeSeriesStub();
    volumeSeries = makeSeriesStub();
    lineSeries = [];
    chartStub.addSeries.mockReset();
    chartStub.addSeries.mockImplementation((definition: unknown) => {
      if (definition === LineSeries) {
        const stub = makeSeriesStub();
        lineSeries.push(stub);
        return stub;
      }
      return chartStub.addSeries.mock.calls.length === 1 ? candleSeries : volumeSeries;
    });
    chartStub.removeSeries.mockReset();
    chartStub.remove.mockReset();
    createChartMock.mockClear();
  });

  it('creates chart with candlestick and volume series on mount', () => {
    render(<CandleChart bars={[]} seriesKey="BTCUSDT:60" indicators={[]} />);
    expect(createChartMock).toHaveBeenCalledTimes(1);
    expect(chartStub.addSeries).toHaveBeenCalledTimes(2);
  });

  it('sets full data on first render', () => {
    render(<CandleChart bars={[bar(60), bar(120)]} seriesKey="BTCUSDT:60" indicators={[]} />);
    expect(candleSeries.setData).toHaveBeenCalledTimes(1);
    expect(volumeSeries.setData).toHaveBeenCalledTimes(1);
    expect(candleSeries.setData.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('updates only the last bar for incremental ticks', () => {
    const { rerender } = render(
      <CandleChart bars={[bar(60), bar(120)]} seriesKey="BTCUSDT:60" indicators={[]} />,
    );
    candleSeries.setData.mockClear();
    volumeSeries.setData.mockClear();

    rerender(
      <CandleChart bars={[bar(60), bar(120, 108)]} seriesKey="BTCUSDT:60" indicators={[]} />,
    );
    expect(candleSeries.setData).not.toHaveBeenCalled();
    expect(candleSeries.update).toHaveBeenCalledWith(
      expect.objectContaining({ time: 120, close: 108 }),
    );
    expect(volumeSeries.update).toHaveBeenCalledTimes(1);

    rerender(
      <CandleChart
        bars={[bar(60), bar(120, 108), bar(180)]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
      />,
    );
    expect(candleSeries.setData).not.toHaveBeenCalled();
    expect(candleSeries.update).toHaveBeenLastCalledWith(expect.objectContaining({ time: 180 }));
  });

  it('resets data when the series key changes', () => {
    const { rerender } = render(
      <CandleChart bars={[bar(60), bar(120)]} seriesKey="BTCUSDT:60" indicators={[]} />,
    );
    candleSeries.setData.mockClear();

    rerender(<CandleChart bars={[bar(300)]} seriesKey="BTCUSDT:5" indicators={[]} />);
    expect(candleSeries.setData).toHaveBeenCalledTimes(1);
    expect(candleSeries.setData.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('removes the chart on unmount', () => {
    const { unmount } = render(<CandleChart bars={[]} seriesKey="BTCUSDT:60" indicators={[]} />);
    unmount();
    expect(chartStub.remove).toHaveBeenCalledTimes(1);
  });

  it('adds a line series with computed data when an indicator is enabled', () => {
    const { rerender } = render(
      <CandleChart bars={eightBars} seriesKey="BTCUSDT:60" indicators={[]} />,
    );
    expect(lineSeries).toHaveLength(0);

    rerender(<CandleChart bars={eightBars} seriesKey="BTCUSDT:60" indicators={['ma7']} />);
    expect(lineSeries).toHaveLength(1);
    const expected = computeSma(eightBars, 7).map((point) => ({
      time: point.time,
      value: point.value,
    }));
    expect(lineSeries[0]?.setData).toHaveBeenCalledWith(expected);
  });

  it('updates only the last indicator point for incremental ticks', () => {
    const { rerender } = render(
      <CandleChart bars={eightBars} seriesKey="BTCUSDT:60" indicators={['ma7']} />,
    );
    lineSeries[0]?.setData.mockClear();

    const next = [...eightBars, bar(540, 120)];
    rerender(<CandleChart bars={next} seriesKey="BTCUSDT:60" indicators={['ma7']} />);

    expect(lineSeries[0]?.setData).not.toHaveBeenCalled();
    const lastExpected = computeSma(next, 7).at(-1);
    expect(lineSeries[0]?.update).toHaveBeenCalledWith({
      time: lastExpected?.time,
      value: lastExpected?.value,
    });
  });

  it('removes the line series when an indicator is disabled', () => {
    const { rerender } = render(
      <CandleChart bars={eightBars} seriesKey="BTCUSDT:60" indicators={['ma7', 'ema12']} />,
    );
    expect(lineSeries).toHaveLength(2);

    rerender(<CandleChart bars={eightBars} seriesKey="BTCUSDT:60" indicators={['ema12']} />);
    expect(chartStub.removeSeries).toHaveBeenCalledTimes(1);
    expect(chartStub.removeSeries).toHaveBeenCalledWith(lineSeries[0]);
  });

  it('resets indicator data when the series key changes', () => {
    const { rerender } = render(
      <CandleChart bars={eightBars} seriesKey="BTCUSDT:60" indicators={['ma7']} />,
    );
    lineSeries[0]?.setData.mockClear();

    rerender(
      <CandleChart bars={eightBars.slice(0, 7)} seriesKey="BTCUSDT:5" indicators={['ma7']} />,
    );
    expect(lineSeries[0]?.setData).toHaveBeenCalledTimes(1);
  });

  it('shows the current indicator values in the caption', () => {
    render(<CandleChart bars={eightBars} seriesKey="BTCUSDT:60" indicators={['ma7', 'ma99']} />);

    const ma7Last = computeSma(eightBars, 7).at(-1);
    expect(ma7Last).toBeDefined();
    expect(screen.getByText(`MA7 ${formatPrice(ma7Last?.value ?? 0)}`)).toBeInTheDocument();
    expect(screen.getByText('MA99 --')).toBeInTheDocument();
  });
});
