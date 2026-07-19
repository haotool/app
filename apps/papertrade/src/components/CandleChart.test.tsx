import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { CandleChart } from './CandleChart';
import { CandlestickSeries, createChart, LineSeries } from 'lightweight-charts';
import { type Kline } from '../services/kline';
import { computeMacd, computeSma } from '../lib/indicators';
import { formatPrice } from '../lib/format';

interface SeriesStub {
  setData: Mock;
  update: Mock;
  priceScale: Mock;
  createPriceLine: Mock;
  removePriceLine: Mock;
}

function makeSeriesStub(): SeriesStub {
  return {
    setData: vi.fn(),
    update: vi.fn(),
    priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
    createPriceLine: vi.fn(() => ({})),
    removePriceLine: vi.fn(),
  };
}

const macdPaneStub = { setHeight: vi.fn() };

const chartStub = {
  addSeries: vi.fn(),
  removeSeries: vi.fn(),
  panes: vi.fn(() => [{ setHeight: vi.fn() }, macdPaneStub]),
  timeScale: vi.fn(() => ({ scrollToRealTime: vi.fn() })),
  remove: vi.fn(),
};

const markersStub = { setMarkers: vi.fn(), markers: vi.fn(() => []), detach: vi.fn() };

vi.mock('lightweight-charts', () => ({
  CandlestickSeries: Symbol('CandlestickSeries'),
  HistogramSeries: Symbol('HistogramSeries'),
  LineSeries: Symbol('LineSeries'),
  LineStyle: { Solid: 0, Dotted: 1, Dashed: 2 },
  createChart: vi.fn(() => chartStub),
  createSeriesMarkers: vi.fn(() => markersStub),
}));

const createChartMock = createChart as unknown as Mock;

function bar(time: number, close = 100): Kline {
  return { time, open: 99, high: 101, low: 98, close, volume: 10 };
}

function wave(prices: number[]): Kline[] {
  return prices.map((price, index) => ({
    time: (index + 1) * 60,
    open: price,
    high: price + 0.5,
    low: price - 0.5,
    close: price,
    volume: 1,
  }));
}

const eightBars = Array.from({ length: 8 }, (_, index) => bar((index + 1) * 60, 100 + index));

// 峰（index 7 高 20.5、index 23 高 20.0）與谷（index 15 低 7.5）序列：
// 高點聚類（觸碰 2）供 S/R；highs 兩錨點供阻力趨勢線。
const swingBars = wave([
  10, 11.5, 13, 14.5, 16, 17.5, 19, 20, 18.5, 17, 15.5, 14, 12.5, 11, 9.5, 8, 9.5, 11, 12.5, 14,
  15.5, 17, 18.5, 19.5, 18, 16.5, 15, 13.5, 12, 10.5,
]);

// 急跌反彈後緩跌收斂：價格 Lower Low（index 45 → 90）＋ DIF Higher Low，構成 bullish 背離。
const divergencePrices: number[] = [];
for (let index = 0; index <= 30; index += 1) divergencePrices.push(100);
for (let index = 1; index <= 15; index += 1) divergencePrices.push(100 - index * 2);
for (let index = 1; index <= 15; index += 1) divergencePrices.push(70 + index * 1);
for (let index = 1; index <= 30; index += 1) divergencePrices.push(85 - index * (17 / 30));
for (let index = 1; index <= 6; index += 1) divergencePrices.push(68 + index * 1.5);
const divergenceBars = wave(divergencePrices);

const analysisOff = {
  showMacd: false,
  showTrendLines: false,
  showSupportResistance: false,
};

describe('CandleChart', () => {
  let candleSeries: SeriesStub;
  let volumeSeries: SeriesStub;
  let lineSeries: SeriesStub[];
  let macdSeries: SeriesStub[];

  beforeEach(() => {
    candleSeries = makeSeriesStub();
    volumeSeries = makeSeriesStub();
    lineSeries = [];
    macdSeries = [];
    chartStub.addSeries.mockReset();
    chartStub.addSeries.mockImplementation(
      (definition: unknown, _options: unknown, paneIndex?: number) => {
        if (paneIndex === 1) {
          const stub = makeSeriesStub();
          macdSeries.push(stub);
          return stub;
        }
        if (definition === LineSeries) {
          const stub = makeSeriesStub();
          lineSeries.push(stub);
          return stub;
        }
        return definition === CandlestickSeries ? candleSeries : volumeSeries;
      },
    );
    chartStub.removeSeries.mockReset();
    chartStub.remove.mockReset();
    macdPaneStub.setHeight.mockClear();
    markersStub.setMarkers.mockClear();
    createChartMock.mockClear();
  });

  it('creates chart with candlestick and volume series on mount', () => {
    render(
      <CandleChart
        symbol="BTCUSDT"
        bars={[]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(createChartMock).toHaveBeenCalledTimes(1);
    expect(chartStub.addSeries).toHaveBeenCalledTimes(2);
  });

  it('applies the symbol tick-size price format to the candlestick axis', () => {
    render(
      <CandleChart
        symbol="PPRUSDT"
        bars={[]}
        seriesKey="PPRUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    const candleCall = chartStub.addSeries.mock.calls.find((call) => call[0] === CandlestickSeries);
    expect(candleCall?.[1]).toMatchObject({
      priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
    });
  });

  it('sets full data on first render', () => {
    render(
      <CandleChart
        symbol="BTCUSDT"
        bars={[bar(60), bar(120)]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(candleSeries.setData).toHaveBeenCalledTimes(1);
    expect(volumeSeries.setData).toHaveBeenCalledTimes(1);
    expect(candleSeries.setData.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('updates only the last bar for incremental ticks', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={[bar(60), bar(120)]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    candleSeries.setData.mockClear();
    volumeSeries.setData.mockClear();

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={[bar(60), bar(120, 108)]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(candleSeries.setData).not.toHaveBeenCalled();
    expect(candleSeries.update).toHaveBeenCalledWith(
      expect.objectContaining({ time: 120, close: 108 }),
    );
    expect(volumeSeries.update).toHaveBeenCalledTimes(1);

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={[bar(60), bar(120, 108), bar(180)]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(candleSeries.setData).not.toHaveBeenCalled();
    expect(candleSeries.update).toHaveBeenLastCalledWith(expect.objectContaining({ time: 180 }));
  });

  it('resets data when the series key changes', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={[bar(60), bar(120)]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    candleSeries.setData.mockClear();

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={[bar(300)]}
        seriesKey="BTCUSDT:5"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(candleSeries.setData).toHaveBeenCalledTimes(1);
    expect(candleSeries.setData.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('removes the chart on unmount', () => {
    const { unmount } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={[]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    unmount();
    expect(chartStub.remove).toHaveBeenCalledTimes(1);
  });

  it('adds a line series with computed data when an indicator is enabled', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={eightBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(lineSeries).toHaveLength(0);

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={eightBars}
        seriesKey="BTCUSDT:60"
        indicators={['ma7']}
        {...analysisOff}
      />,
    );
    expect(lineSeries).toHaveLength(1);
    const expected = computeSma(eightBars, 7).map((point) => ({
      time: point.time,
      value: point.value,
    }));
    expect(lineSeries[0]?.setData).toHaveBeenCalledWith(expected);
  });

  it('updates only the last indicator point for incremental ticks', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={eightBars}
        seriesKey="BTCUSDT:60"
        indicators={['ma7']}
        {...analysisOff}
      />,
    );
    lineSeries[0]?.setData.mockClear();

    const next = [...eightBars, bar(540, 120)];
    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={next}
        seriesKey="BTCUSDT:60"
        indicators={['ma7']}
        {...analysisOff}
      />,
    );

    expect(lineSeries[0]?.setData).not.toHaveBeenCalled();
    const lastExpected = computeSma(next, 7).at(-1);
    expect(lineSeries[0]?.update).toHaveBeenCalledWith({
      time: lastExpected?.time,
      value: lastExpected?.value,
    });
  });

  it('removes the line series when an indicator is disabled', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={eightBars}
        seriesKey="BTCUSDT:60"
        indicators={['ma7', 'ema12']}
        {...analysisOff}
      />,
    );
    expect(lineSeries).toHaveLength(2);

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={eightBars}
        seriesKey="BTCUSDT:60"
        indicators={['ema12']}
        {...analysisOff}
      />,
    );
    expect(chartStub.removeSeries).toHaveBeenCalledTimes(1);
    expect(chartStub.removeSeries).toHaveBeenCalledWith(lineSeries[0]);
  });

  it('resets indicator data when the series key changes', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={eightBars}
        seriesKey="BTCUSDT:60"
        indicators={['ma7']}
        {...analysisOff}
      />,
    );
    lineSeries[0]?.setData.mockClear();

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={eightBars.slice(0, 7)}
        seriesKey="BTCUSDT:5"
        indicators={['ma7']}
        {...analysisOff}
      />,
    );
    expect(lineSeries[0]?.setData).toHaveBeenCalledTimes(1);
  });

  it('shows the current indicator values in the caption', () => {
    render(
      <CandleChart
        symbol="BTCUSDT"
        bars={eightBars}
        seriesKey="BTCUSDT:60"
        indicators={['ma7', 'ma99']}
        {...analysisOff}
      />,
    );

    const ma7Last = computeSma(eightBars, 7).at(-1);
    expect(ma7Last).toBeDefined();
    expect(
      screen.getByText(`MA7 ${formatPrice(ma7Last?.value ?? 0, 'BTCUSDT')}`),
    ).toBeInTheDocument();
    expect(screen.getByText('MA99 --')).toBeInTheDocument();
  });

  it('creates the MACD pane series with full data and a 120px pane height', () => {
    render(
      <CandleChart
        symbol="BTCUSDT"
        bars={divergenceBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
        showMacd
      />,
    );

    expect(macdSeries).toHaveLength(3);
    expect(macdPaneStub.setHeight).toHaveBeenCalledWith(120);

    const macd = computeMacd(divergenceBars);
    const [hist, dif, dea] = macdSeries;
    expect(hist?.setData.mock.calls[0]?.[0]).toHaveLength(macd.length);
    expect(dif?.setData).toHaveBeenCalledWith(
      macd.map((point) => ({ time: point.time, value: point.dif })),
    );
    expect(dea?.setData).toHaveBeenCalledWith(
      macd.map((point) => ({ time: point.time, value: point.dea })),
    );
  });

  it('updates only the last MACD point for incremental ticks', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={divergenceBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
        showMacd
      />,
    );
    for (const stub of macdSeries) stub.setData.mockClear();

    const last = divergenceBars.at(-1)!;
    const next = [...divergenceBars.slice(0, -1), { ...last, close: last.close + 0.4 }];
    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={next}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
        showMacd
      />,
    );

    const expected = computeMacd(next).at(-1);
    const [hist, dif, dea] = macdSeries;
    expect(hist?.setData).not.toHaveBeenCalled();
    expect(dif?.setData).not.toHaveBeenCalled();
    expect(hist?.update).toHaveBeenCalledTimes(1);
    expect(dif?.update).toHaveBeenCalledWith({ time: expected?.time, value: expected?.dif });
    expect(dea?.update).toHaveBeenCalledWith({ time: expected?.time, value: expected?.dea });
  });

  it('removes the MACD pane series when the toggle turns off', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={divergenceBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
        showMacd
      />,
    );
    expect(macdSeries).toHaveLength(3);

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={divergenceBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(chartStub.removeSeries).toHaveBeenCalledTimes(3);
  });

  it('marks a constructed bullish divergence with an arrowUp below the bar', () => {
    render(
      <CandleChart
        symbol="BTCUSDT"
        bars={divergenceBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
        showMacd
      />,
    );

    expect(markersStub.setMarkers).toHaveBeenLastCalledWith([
      expect.objectContaining({ time: 91 * 60, position: 'belowBar', shape: 'arrowUp' }),
    ]);
  });

  it('clears divergence markers when MACD turns off', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={divergenceBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
        showMacd
      />,
    );

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={divergenceBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(markersStub.setMarkers).toHaveBeenLastCalledWith([]);
  });

  it('draws the trend lines through the two most recent pivots extended to the last bar', () => {
    render(
      <CandleChart
        symbol="BTCUSDT"
        bars={swingBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
        showTrendLines
      />,
    );

    // 主圖僅趨勢線兩條 LineSeries：support（lows 不足兩個 → 空資料）、resistance（三點）。
    expect(lineSeries).toHaveLength(2);
    expect(lineSeries[0]?.setData).toHaveBeenCalledWith([]);
    const resistanceData = lineSeries[1]?.setData.mock.calls[0]?.[0] as { time: number }[];
    expect(resistanceData).toHaveLength(3);
    expect(resistanceData.map((point) => point.time)).toEqual([8 * 60, 24 * 60, 30 * 60]);
  });

  it('creates price lines for clustered support/resistance levels and removes them on toggle off', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={swingBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
        showSupportResistance
      />,
    );

    // 高點 20.5 與 20.0 聚類（觸碰 2）→ 一條 20.25 priceLine。
    expect(candleSeries.createPriceLine).toHaveBeenCalledTimes(1);
    expect(candleSeries.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({ price: 20.25 }),
    );

    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={swingBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        {...analysisOff}
      />,
    );
    expect(candleSeries.removePriceLine).toHaveBeenCalledTimes(1);
  });

  it('skips re-analysis when the bars reference changes without a new bar', () => {
    const { rerender } = render(
      <CandleChart
        symbol="BTCUSDT"
        bars={swingBars}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        showMacd
        showTrendLines
        showSupportResistance
      />,
    );
    const trendSetDataCalls = lineSeries[1]?.setData.mock.calls.length ?? 0;
    const markerCalls = markersStub.setMarkers.mock.calls.length;
    candleSeries.createPriceLine.mockClear();

    // 參照變、長度不變（最新一根 tick 跳動）：analysis memo 不重算，extras effect 不重跑。
    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={[...swingBars]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        showMacd
        showTrendLines
        showSupportResistance
      />,
    );
    expect(lineSeries[1]?.setData.mock.calls.length).toBe(trendSetDataCalls);
    expect(markersStub.setMarkers.mock.calls.length).toBe(markerCalls);
    expect(candleSeries.createPriceLine).not.toHaveBeenCalled();

    // 新增一根 bar（length +1）：analysis 重算，趨勢線重設。
    const last = swingBars.at(-1)!;
    rerender(
      <CandleChart
        symbol="BTCUSDT"
        bars={[...swingBars, { ...last, time: last.time + 60 }]}
        seriesKey="BTCUSDT:60"
        indicators={[]}
        showMacd
        showTrendLines
        showSupportResistance
      />,
    );
    expect(lineSeries[1]?.setData.mock.calls.length).toBe(trendSetDataCalls + 1);
  });
});
