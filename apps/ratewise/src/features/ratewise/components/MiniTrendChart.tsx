import { useEffect, useRef, useMemo, useState } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { motion, AnimatePresence } from 'motion/react';
import { CURRENCY_DEFINITIONS } from '../constants';
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
 */
export function MiniTrendChart({ data, currencyCode, className = '' }: MiniTrendChartProps) {
  // 使用真實數據（Safari 404 問題已透過 logger.debug 降級處理修復）
  const displayData = data;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  // 智能計算小數位數：根據數值大小動態調整
  const getSmartDecimals = (value: number): number => {
    const baseDecimals = CURRENCY_DEFINITIONS[currencyCode].decimals;

    // 如果是整數貨幣（JPY, KRW），直接返回 0
    if (baseDecimals === 0) return 0;

    // 如果值 >= 1，使用基礎小數位數（通常是 2）
    if (value >= 1) return baseDecimals;

    // 如果值 < 1，需要更多小數位數來顯示有意義的數字
    // 例如：0.0324 需要 4 位，0.00123 需要 5 位
    const absValue = Math.abs(value);
    if (absValue === 0) return baseDecimals;

    // 計算需要多少位小數才能顯示至少 2 位有效數字
    const leadingZeros = Math.floor(-Math.log10(absValue));
    return Math.max(baseDecimals, leadingZeros + 2);
  };

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
          color: 'rgba(139, 92, 246, 0.5)',
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

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#8b5cf6',
      lineWidth: 2,
      topColor: 'rgba(139, 92, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.1)',
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
  }, [displayData, stats.maxIndex, stats.minIndex]);

  // 數據不足時不顯示圖表
  if (displayData.length < 2) {
    return null;
  }

  return (
    <motion.div
      className={`w-full h-full relative ${className}`}
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

      {/* Hover Tooltip - 白底紫字現代化設計 */}
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
            {/* 白底紫字 Tooltip */}
            <div className="relative">
              <div className="bg-white/98 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-2xl border-2 border-purple-200">
                <div className="flex items-center gap-2.5 text-[11px] leading-tight whitespace-nowrap">
                  <span className="text-purple-600 font-semibold">{tooltipData.date}</span>
                  <span className="text-purple-800 font-bold">
                    {tooltipData.rate.toFixed(getSmartDecimals(tooltipData.rate))}
                  </span>
                </div>
              </div>
              {/* 小三角形指示器 - 白色 */}
              <div
                className="absolute left-1/2 -bottom-[5px] transform -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgba(255, 255, 255, 0.98)',
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
