import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { motion, AnimatePresence } from 'motion/react';
import { formatExchangeRate } from '../../../utils/currencyFormatter';
import { getChartColors } from '../../../config/themes';
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
 * 迷你趨勢圖組件 - 現代化高級 APP 風格
 * 使用 lightweight-charts 專業金融圖表庫
 * 特色：
 * - 左到右酷炫動畫
 * - Hover 互動顯示日期和價格
 * - 數據 ≥ 2 天時統一延伸到最寬
 * - 現代化配色與微互動
 * - **SSOT Design Token** - 圖表顏色從 CSS Variables 獲取
 */
export function MiniTrendChart({ data, className = '' }: MiniTrendChartProps) {
  // 使用真實數據（Safari 404 問題已透過 logger.debug 降級處理修復）
  const displayData = data;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  // 追蹤主題變化 - 用於觸發圖表重建
  const [themeVersion, setThemeVersion] = useState(0);

  // MutationObserver 監聽 <html> class 變化（主題切換）
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          setThemeVersion((v) => v + 1);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // 獲取主題色彩（SSOT from CSS Variables）- themeVersion 變化時重新獲取
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

    // 計算24小時變化
    const currentRate = rates[rates.length - 1] ?? 0;
    const rate24hAgo = rates[0] ?? 0;
    const change24h = currentRate - rate24hAgo;
    const changePercent = rate24hAgo !== 0 ? (change24h / rate24hAgo) * 100 : 0;

    return { min, max, minIndex, maxIndex, change24h, changePercent };
  }, [displayData]);

  useEffect(() => {
    if (!chartContainerRef.current || displayData.length < 2) return;

    // 從 SSOT 獲取圖表顏色
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
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
      },
      crosshair: {
        mode: 0, // CrosshairMode.Normal - 自由移動不吸附
        vertLine: {
          width: 1,
          color: chartColors.topColor, // SSOT: 使用主題色 (40% opacity)
          style: LineStyle.Solid,
          labelVisible: false,
        },
        horzLine: {
          visible: false,
        },
      },
      handleScroll: false,
      handleScale: false,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    // SSOT: 從 CSS Variables 獲取圖表配色
    const series = chart.addSeries(AreaSeries, {
      lineColor: chartColors.lineColor, // SSOT: --color-chart-line
      lineWidth: 2,
      topColor: chartColors.topColor, // SSOT: --color-chart-area-top (40% opacity)
      bottomColor: chartColors.bottomColor, // SSOT: --color-chart-area-bottom (10% opacity)
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    seriesRef.current = series;

    // 轉換數據格式為 lightweight-charts 格式
    const chartData = displayData.map((point) => ({
      time: point.date,
      value: point.rate,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();

    // Crosshair 移動事件 - 顯示 tooltip
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
              y: rect.top + param.point.y,
            });
          }
        }
      }
    });

    // 處理視窗大小變化
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

  // 數據不足時不顯示圖表
  if (displayData.length < 2) {
    return null;
  }

  return (
    <motion.div
      className={`w-full h-full relative ${className}`}
      data-testid="mini-trend-chart"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ y: -2 }}
    >
      {/* Lightweight Charts 趨勢圖 */}
      <div
        ref={chartContainerRef}
        data-testid="mini-trend-chart-surface"
        className="w-full h-full"
      />

      {/* Hover Tooltip - SSOT 主題色設計 */}
      <AnimatePresence>
        {tooltipData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
            className="pointer-events-none"
            style={{
              position: 'fixed',
              left: `${tooltipData.x}px`,
              top: `${tooltipData.y - 55}px`,
              zIndex: 99999,
              transform: 'translateX(-50%)',
            }}
          >
            {/* SSOT: 使用主題色 Tooltip (card/foreground/primary) */}
            <div className="relative">
              <div className="bg-card/98 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-2xl border-2 border-border">
                <div className="flex items-center gap-2.5 text-[11px] leading-tight whitespace-nowrap">
                  <span className="text-primary font-semibold">{tooltipData.date}</span>
                  <span className="text-foreground font-bold">
                    {formatExchangeRate(tooltipData.rate)}
                  </span>
                </div>
              </div>
              {/* 小三角形指示器 - 使用 card 色 */}
              <div
                className="absolute left-1/2 -bottom-[5px] transform -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgb(var(--color-card) / 0.98)',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
