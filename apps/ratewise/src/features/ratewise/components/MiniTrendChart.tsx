import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  createChart,
  ColorType,
  LineStyle,
  CrosshairMode,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { motion, AnimatePresence } from 'motion/react';
import { formatExchangeRate } from '../../../utils/currencyFormatter';
import { getChartColors } from '../../../config/themes';
import { chartTransitions } from '../../../config/animations';
import type { CurrencyCode } from '../types';

export interface MiniTrendDataPoint {
  date: string;
  rate: number;
}

export interface MiniTrendChartProps {
  data: MiniTrendDataPoint[];
  currencyCode: CurrencyCode;
  className?: string;
}

interface TooltipData {
  date: string;
  rate: number;
  x: number;
  y: number;
}

/**
 * 迷你趨勢圖 — lightweight-charts AreaSeries。
 *
 * 觸控追蹤採官方 tracking-without-long-press 做法：
 * handleScroll/handleScale 已禁用，touchstart 直接啟動 crosshair，
 * touchmove 以 setCrosshairPosition 程式化移動。
 *
 * @see https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-position
 */
export function MiniTrendChart({ data, className = '' }: MiniTrendChartProps) {
  const displayData = data;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [isTouching, setIsTouching] = useState(false);

  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class' || mutation.attributeName === 'data-style') {
          setThemeVersion((v) => v + 1);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-style'],
    });

    return () => observer.disconnect();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- themeVersion 是故意的依賴，用於觸發主題切換時重建圖表
  const getThemeColors = useCallback(() => getChartColors(), [themeVersion]);

  const stats = useMemo(() => {
    if (displayData.length === 0) {
      return { min: 0, max: 0, minIndex: 0, maxIndex: 0, change24h: 0, changePercent: 0 };
    }

    const rates = displayData.map((d) => d.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const minIndex = rates.indexOf(min);
    const maxIndex = rates.indexOf(max);

    const currentRate = rates[rates.length - 1] ?? 0;
    const rate24hAgo = rates[0] ?? 0;
    const change24h = currentRate - rate24hAgo;
    const changePercent = rate24hAgo !== 0 ? (change24h / rate24hAgo) * 100 : 0;

    return { min, max, minIndex, maxIndex, change24h, changePercent };
  }, [displayData]);

  useEffect(() => {
    if (!chartContainerRef.current || displayData.length < 2) return;

    const chartColors = getThemeColors();

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          width: 1,
          color: chartColors.topColor,
          style: LineStyle.Solid,
          labelVisible: false,
        },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      lineColor: chartColors.lineColor,
      lineWidth: 2,
      topColor: chartColors.topColor,
      bottomColor: chartColors.bottomColor,
      lineStyle: LineStyle.Solid,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBorderColor: chartColors.lineColor,
      crosshairMarkerBackgroundColor: chartColors.markerBackground,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    seriesRef.current = series;

    const chartData = displayData.map((point) => ({
      time: point.date,
      value: point.rate,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();

    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark('rw:chart-rendered');
        if (performance.getEntriesByName('rw:chart-fetch-start').length > 0) {
          performance.measure('rw:chart-total-time', 'rw:chart-fetch-start', 'rw:chart-rendered');
        }
      } catch {
        // Safari 可能拒絕某些 mark/measure。
      }
    }

    chart.subscribeCrosshairMove((param) => {
      if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
        setTooltipData(null);
      } else {
        const dataPoint = param.seriesData.get(series);
        if (dataPoint && 'value' in dataPoint) {
          const container = chartContainerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            setTooltipData({
              date: param.time as string,
              rate: dataPoint.value,
              x: rect.left + param.point.x,
              y: rect.top,
            });
          }
        }
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
        chart.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [displayData, stats.maxIndex, stats.minIndex, getThemeColors]);

  /**
   * 觸控追蹤（官方 tracking-without-long-press 做法）。
   * handleScroll/handleScale 已禁用，touchstart 即刻啟動 crosshair 追蹤。
   * @see https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-position
   */
  const updateCrosshairFromTouch = useCallback((clientX: number, clientY: number) => {
    const container = chartContainerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!container || !chart || !series) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const price = series.coordinateToPrice(y);
    const time = chart.timeScale().coordinateToTime(x);

    if (price === null || time === null) return;
    if (!Number.isFinite(price as number)) return;

    chart.setCrosshairPosition(price as number, time, series);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      setIsTouching(true);
      updateCrosshairFromTouch(touch.clientX, touch.clientY);
    },
    [updateCrosshairFromTouch],
  );

  const handleTouchMoveNative = useCallback(
    (e: TouchEvent) => {
      if (!isTouching) return;
      e.preventDefault();

      const touch = e.touches[0];
      if (!touch) return;

      updateCrosshairFromTouch(touch.clientX, touch.clientY);
    },
    [isTouching, updateCrosshairFromTouch],
  );

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    container.addEventListener('touchmove', handleTouchMoveNative, { passive: false });

    return () => {
      container.removeEventListener('touchmove', handleTouchMoveNative);
    };
  }, [handleTouchMoveNative]);

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false);
    setTooltipData(null);

    try {
      chartRef.current?.clearCrosshairPosition();
    } catch {
      // Silently fail。
    }
  }, []);

  if (displayData.length < 2) {
    return null;
  }

  return (
    <motion.div
      className={`w-full h-full relative ${className}`}
      data-testid="mini-trend-chart"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={chartTransitions.fadeIn}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div
        ref={chartContainerRef}
        data-testid="mini-trend-chart-surface"
        className={`w-full h-full touch-none ${isTouching ? 'select-none' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {createPortal(
        <AnimatePresence>
          {tooltipData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={chartTransitions.tooltipBounce}
              className="pointer-events-none"
              style={{
                position: 'fixed',
                left: `${tooltipData.x}px`,
                top: `${tooltipData.y - 55}px`,
                zIndex: 99999,
                x: '-50%',
              }}
            >
              <div className="relative">
                <div className="rounded-control border border-border/70 bg-surface/95 px-3 py-1.5 shadow-floating backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 text-xs leading-tight whitespace-nowrap">
                    <span className="text-primary font-semibold">{tooltipData.date}</span>
                    <span className="text-text font-bold">
                      {formatExchangeRate(tooltipData.rate)}
                    </span>
                  </div>
                </div>
                <div
                  className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border/70 bg-surface/95"
                  aria-hidden="true"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}
