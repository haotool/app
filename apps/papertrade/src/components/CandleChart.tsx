import { useEffect, useMemo, useRef } from 'react';
import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { type Kline } from '../services/kline';
import {
  computeIndicatorLine,
  INDICATORS,
  type IndicatorId,
  type IndicatorPoint,
} from '../lib/indicators';
import { formatPrice } from '../lib/format';

interface CandleChartProps {
  bars: Kline[];
  seriesKey: string;
  indicators: IndicatorId[];
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

function toLinePoint(point: IndicatorPoint) {
  return { time: point.time as UTCTimestamp, value: point.value };
}

export function CandleChart({ bars, seriesKey, indicators }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handlesRef = useRef<ChartHandles | null>(null);
  const volumeMapperRef = useRef<ReturnType<typeof buildVolumeMapper> | null>(null);
  const renderedRef = useRef<RenderedState | null>(null);
  const lineSeriesRef = useRef(new Map<IndicatorId, ISeriesApi<'Line'>>());

  const indicatorLines = useMemo(() => {
    const lines = new Map<IndicatorId, IndicatorPoint[]>();
    for (const definition of INDICATORS) {
      if (indicators.includes(definition.id)) {
        lines.set(definition.id, computeIndicatorLine(bars, definition));
      }
    }
    return lines;
  }, [bars, indicators]);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return undefined;

    const lineSeries = lineSeriesRef.current;
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
    volumeMapperRef.current = buildVolumeMapper(
      readToken('--color-long-volume'),
      readToken('--color-short-volume'),
    );
    renderedRef.current = null;

    return () => {
      chart.remove();
      handlesRef.current = null;
      volumeMapperRef.current = null;
      renderedRef.current = null;
      lineSeries.clear();
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

    // 指標線與開關同步：新開補掛、關閉移除；既有線沿蠟燭的增量／重設判準寫入。
    for (const definition of INDICATORS) {
      const series = lineSeriesRef.current.get(definition.id);
      const line = indicatorLines.get(definition.id);

      if (line === undefined) {
        if (series !== undefined) {
          handles.chart.removeSeries(series);
          lineSeriesRef.current.delete(definition.id);
        }
        continue;
      }

      if (series === undefined) {
        const created = handles.chart.addSeries(LineSeries, {
          color: readToken(definition.colorToken),
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        created.setData(line.map(toLinePoint));
        lineSeriesRef.current.set(definition.id, created);
        continue;
      }

      const lastPoint = line.at(-1);
      if (isIncrementalUpdate && lastPoint !== undefined) {
        series.update(toLinePoint(lastPoint));
      } else {
        series.setData(line.map(toLinePoint));
      }
    }

    renderedRef.current = {
      seriesKey,
      lastTime: last?.time ?? 0,
      length: bars.length,
    };
  }, [bars, seriesKey, indicatorLines]);

  const captions = INDICATORS.filter((definition) => indicatorLines.has(definition.id)).map(
    (definition) => {
      const lastPoint = indicatorLines.get(definition.id)?.at(-1);
      return {
        id: definition.id,
        colorToken: definition.colorToken,
        text: `${definition.label} ${lastPoint === undefined ? '--' : formatPrice(lastPoint.value)}`,
      };
    },
  );

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        role="img"
        aria-label="K 線蠟燭圖與成交量"
        className="h-full w-full"
        data-testid="candle-chart"
      />
      {captions.length > 0 && (
        <div
          aria-label="指標當前值"
          className="pointer-events-none absolute left-2 top-1 z-10 flex flex-wrap gap-x-2.5 text-caption tabular-nums"
        >
          {captions.map((caption) => (
            <span key={caption.id} style={{ color: `var(${caption.colorToken})` }}>
              {caption.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
