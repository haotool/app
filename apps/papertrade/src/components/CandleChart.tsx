import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { type Kline } from '../services/kline';

interface CandleChartProps {
  bars: Kline[];
  seriesKey: string;
}

interface ChartHandles {
  chart: IChartApi;
  candles: ISeriesApi<'Candlestick'>;
  volume: ISeriesApi<'Histogram'>;
}

interface RenderedState {
  seriesKey: string;
  lastTime: number;
  length: number;
}

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toCandle(bar: Kline) {
  return {
    time: bar.time as UTCTimestamp,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  };
}

function buildVolumeMapper(longColor: string, shortColor: string) {
  return (bar: Kline) => ({
    time: bar.time as UTCTimestamp,
    value: bar.volume,
    color: bar.close >= bar.open ? longColor : shortColor,
  });
}

export function CandleChart({ bars, seriesKey }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handlesRef = useRef<ChartHandles | null>(null);
  const volumeMapperRef = useRef<ReturnType<typeof buildVolumeMapper> | null>(null);
  const renderedRef = useRef<RenderedState | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return undefined;

    const longColor = readToken('--color-long');
    const shortColor = readToken('--color-short');
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: readToken('--color-text-3'),
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: readToken('--color-border') },
        horzLines: { color: readToken('--color-border') },
      },
      timeScale: {
        borderColor: readToken('--color-border'),
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: readToken('--color-border'),
      },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: longColor,
      downColor: shortColor,
      borderVisible: false,
      wickUpColor: longColor,
      wickDownColor: shortColor,
    });
    candles.priceScale().applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.22 },
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    handlesRef.current = { chart, candles, volume };
    volumeMapperRef.current = buildVolumeMapper(`${longColor}99`, `${shortColor}99`);
    renderedRef.current = null;

    return () => {
      chart.remove();
      handlesRef.current = null;
      volumeMapperRef.current = null;
      renderedRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handles = handlesRef.current;
    const toVolume = volumeMapperRef.current;
    if (handles === null || toVolume === null) return;

    const last = bars.at(-1);
    const rendered = renderedRef.current;
    const isIncrementalUpdate =
      rendered !== null &&
      rendered.seriesKey === seriesKey &&
      last !== undefined &&
      last.time >= rendered.lastTime &&
      bars.length >= rendered.length &&
      bars.length - rendered.length <= 1;

    if (isIncrementalUpdate) {
      handles.candles.update(toCandle(last));
      handles.volume.update(toVolume(last));
    } else {
      handles.candles.setData(bars.map(toCandle));
      handles.volume.setData(bars.map(toVolume));
      handles.chart.timeScale().scrollToRealTime();
    }

    renderedRef.current = {
      seriesKey,
      lastTime: last?.time ?? 0,
      length: bars.length,
    };
  }, [bars, seriesKey]);

  return <div ref={containerRef} className="h-full w-full" data-testid="candle-chart" />;
}
