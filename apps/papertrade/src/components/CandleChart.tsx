import { useEffect, useMemo, useRef } from 'react';
import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { type Kline } from '../services/kline';
import { type MarketSymbol } from '../config/market';
import {
  computeIndicatorLine,
  computeMacd,
  INDICATORS,
  type IndicatorId,
  type IndicatorPoint,
  type MacdPoint,
} from '../lib/indicators';
import { analyzeChart, type TrendLine } from '../lib/chartAnalysis';
import { formatPrice } from '../lib/format';
import { priceFormatFor } from '../lib/priceScale';

interface CandleChartProps {
  symbol: MarketSymbol;
  bars: Kline[];
  seriesKey: string;
  indicators: IndicatorId[];
  showMacd: boolean;
  showTrendLines: boolean;
  showSupportResistance: boolean;
}

interface ChartHandles {
  chart: IChartApi;
  candles: ISeriesApi<'Candlestick'>;
  volume: ISeriesApi<'Histogram'>;
  markers: ISeriesMarkersPluginApi<Time>;
}

interface MacdSeriesHandles {
  dif: ISeriesApi<'Line'>;
  dea: ISeriesApi<'Line'>;
  hist: ISeriesApi<'Histogram'>;
}

interface TrendSeriesHandles {
  support: ISeriesApi<'Line'>;
  resistance: ISeriesApi<'Line'>;
}

interface RenderedState {
  seriesKey: string;
  lastTime: number;
  length: number;
}

const MACD_PANE_INDEX = 1;
const MACD_PANE_HEIGHT = 120;
const EMPTY_MACD: MacdPoint[] = [];

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

function buildMacdHistMapper(longColor: string, shortColor: string) {
  return (point: MacdPoint) => ({
    time: point.time as UTCTimestamp,
    value: point.hist,
    color: point.hist >= 0 ? longColor : shortColor,
  });
}

function toLinePoint(point: IndicatorPoint) {
  return { time: point.time as UTCTimestamp, value: point.value };
}

function toDifPoint(point: MacdPoint) {
  return { time: point.time as UTCTimestamp, value: point.dif };
}

function toDeaPoint(point: MacdPoint) {
  return { time: point.time as UTCTimestamp, value: point.dea };
}

function toTrendData(line: TrendLine | null) {
  if (line === null) return [];
  return [line.p1, line.p2, line.p3].map((point) => ({
    time: point.time as UTCTimestamp,
    value: point.price,
  }));
}

export function CandleChart({
  symbol,
  bars,
  seriesKey,
  indicators,
  showMacd,
  showTrendLines,
  showSupportResistance,
}: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handlesRef = useRef<ChartHandles | null>(null);
  const volumeMapperRef = useRef<ReturnType<typeof buildVolumeMapper> | null>(null);
  const macdHistMapperRef = useRef<ReturnType<typeof buildMacdHistMapper> | null>(null);
  const renderedRef = useRef<RenderedState | null>(null);
  const lineSeriesRef = useRef(new Map<IndicatorId, ISeriesApi<'Line'>>());
  const macdSeriesRef = useRef<MacdSeriesHandles | null>(null);
  const trendSeriesRef = useRef<TrendSeriesHandles | null>(null);
  const priceLinesRef = useRef(new Map<number, IPriceLine>());

  const indicatorLines = useMemo(() => {
    const lines = new Map<IndicatorId, IndicatorPoint[]>();
    for (const definition of INDICATORS) {
      if (indicators.includes(definition.id)) {
        lines.set(definition.id, computeIndicatorLine(bars, definition));
      }
    }
    return lines;
  }, [bars, indicators]);

  // MACD 每 tick 重算（O(n) 輕量），series 寫入仍走增量路徑。
  const macd = useMemo(() => (showMacd ? computeMacd(bars) : EMPTY_MACD), [bars, showMacd]);

  // pivot 於 rightBars 根後確認即不再變動、pivot 位置的 DIF 亦不受末根跳動影響：
  // 以序列鍵＋bar 數為鍵，最新一根 tick 不重跑 O(n) 掃描（R6-5）。
  const analysis = useMemo(
    () =>
      analyzeChart(bars, macd, {
        divergences: showMacd,
        trendLines: showTrendLines,
        supportResistance: showSupportResistance,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seriesKey, bars.length, showMacd, showTrendLines, showSupportResistance],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return undefined;

    const lineSeries = lineSeriesRef.current;
    const priceLines = priceLinesRef.current;
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
      // 軸精度同源 tick size（ADR-R6-01）；symbol 切換走 ChartPage key 全量重掛載。
      priceFormat: priceFormatFor(symbol),
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

    const markers = createSeriesMarkers(candles);

    handlesRef.current = { chart, candles, volume, markers };
    volumeMapperRef.current = buildVolumeMapper(
      readToken('--color-long-volume'),
      readToken('--color-short-volume'),
    );
    macdHistMapperRef.current = buildMacdHistMapper(
      readToken('--color-long-volume'),
      readToken('--color-short-volume'),
    );
    renderedRef.current = null;

    return () => {
      chart.remove();
      handlesRef.current = null;
      volumeMapperRef.current = null;
      macdHistMapperRef.current = null;
      renderedRef.current = null;
      lineSeries.clear();
      macdSeriesRef.current = null;
      trendSeriesRef.current = null;
      priceLines.clear();
    };
  }, [symbol]);

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

    // MACD 副圖與開關同步：開啟即於 pane 1 建 HIST/DIF/DEA，關閉移除（空 pane 由套件自動回收）。
    const toMacdHist = macdHistMapperRef.current;
    if (!showMacd) {
      const macdSeries = macdSeriesRef.current;
      if (macdSeries !== null) {
        handles.chart.removeSeries(macdSeries.hist);
        handles.chart.removeSeries(macdSeries.dif);
        handles.chart.removeSeries(macdSeries.dea);
        macdSeriesRef.current = null;
      }
    } else if (toMacdHist !== null) {
      let macdSeries = macdSeriesRef.current;
      let created = false;
      if (macdSeries === null) {
        const hist = handles.chart.addSeries(
          HistogramSeries,
          { priceLineVisible: false, lastValueVisible: false },
          MACD_PANE_INDEX,
        );
        // DIF/DEA 為價差空間，沿用同 symbol 軸精度；HIST 維持 volume 型格式。
        const dif = handles.chart.addSeries(
          LineSeries,
          {
            color: readToken('--color-indicator-1'),
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            priceFormat: priceFormatFor(symbol),
          },
          MACD_PANE_INDEX,
        );
        const dea = handles.chart.addSeries(
          LineSeries,
          {
            color: readToken('--color-indicator-3'),
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            priceFormat: priceFormatFor(symbol),
          },
          MACD_PANE_INDEX,
        );
        handles.chart.panes()[MACD_PANE_INDEX]?.setHeight(MACD_PANE_HEIGHT);
        macdSeries = { dif, dea, hist };
        macdSeriesRef.current = macdSeries;
        created = true;
      }

      const lastMacd = macd.at(-1);
      if (!created && isIncrementalUpdate && lastMacd !== undefined) {
        macdSeries.hist.update(toMacdHist(lastMacd));
        macdSeries.dif.update(toDifPoint(lastMacd));
        macdSeries.dea.update(toDeaPoint(lastMacd));
      } else if (created || !isIncrementalUpdate) {
        macdSeries.hist.setData(macd.map(toMacdHist));
        macdSeries.dif.setData(macd.map(toDifPoint));
        macdSeries.dea.setData(macd.map(toDeaPoint));
      }
    }

    renderedRef.current = {
      seriesKey,
      lastTime: last?.time ?? 0,
      length: bars.length,
    };
  }, [bars, seriesKey, indicatorLines, macd, showMacd, symbol]);

  // 背離標記／趨勢線／支撐阻力：analysis 以 bar 數為鍵，tick 不觸發本 effect。
  useEffect(() => {
    const handles = handlesRef.current;
    if (handles === null) return;

    handles.markers.setMarkers(
      analysis.divergences.map((divergence) => ({
        time: divergence.time as UTCTimestamp,
        ...(divergence.kind === 'bullish'
          ? {
              position: 'belowBar' as const,
              shape: 'arrowUp' as const,
              color: readToken('--color-long'),
            }
          : {
              position: 'aboveBar' as const,
              shape: 'arrowDown' as const,
              color: readToken('--color-short'),
            }),
      })),
    );

    // 趨勢線：三點 LineSeries（兩錨點＋外推點），僅確認新 pivot 時才重設資料。
    if (!showTrendLines) {
      const trendSeries = trendSeriesRef.current;
      if (trendSeries !== null) {
        handles.chart.removeSeries(trendSeries.support);
        handles.chart.removeSeries(trendSeries.resistance);
        trendSeriesRef.current = null;
      }
    } else {
      let trendSeries = trendSeriesRef.current;
      if (trendSeries === null) {
        const options = {
          lineWidth: 1 as const,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        };
        trendSeries = {
          support: handles.chart.addSeries(LineSeries, {
            ...options,
            color: readToken('--color-long'),
          }),
          resistance: handles.chart.addSeries(LineSeries, {
            ...options,
            color: readToken('--color-short'),
          }),
        };
        trendSeriesRef.current = trendSeries;
      }
      trendSeries.support.setData(toTrendData(analysis.support));
      trendSeries.resistance.setData(toTrendData(analysis.resistance));
    }

    // 支撐阻力：candles 上的水平 priceLine，以價位為鍵增刪。
    const priceLines = priceLinesRef.current;
    const desiredLevels = showSupportResistance ? analysis.levels : [];
    const desiredPrices = new Set(desiredLevels.map((level) => level.price));
    for (const [price, line] of priceLines) {
      if (!desiredPrices.has(price)) {
        handles.candles.removePriceLine(line);
        priceLines.delete(price);
      }
    }
    for (const level of desiredLevels) {
      if (!priceLines.has(level.price)) {
        priceLines.set(
          level.price,
          handles.candles.createPriceLine({
            price: level.price,
            color: readToken('--color-text-3'),
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
          }),
        );
      }
    }
  }, [analysis, showTrendLines, showSupportResistance]);

  const captions = INDICATORS.filter((definition) => indicatorLines.has(definition.id)).map(
    (definition) => {
      const lastPoint = indicatorLines.get(definition.id)?.at(-1);
      return {
        id: definition.id,
        colorToken: definition.colorToken,
        text: `${definition.label} ${lastPoint === undefined ? '--' : formatPrice(lastPoint.value, symbol)}`,
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
